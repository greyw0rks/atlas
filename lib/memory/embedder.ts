import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { prisma } from "@/lib/db";

const REGION = process.env.AWS_REGION || "us-east-1";

const client = new BedrockRuntimeClient({ region: REGION });

const TITAN_MODEL_ID = "amazon.titan-embed-text-v2:0";

export class EmbeddingError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "EmbeddingError";
    this.cause = cause;
  }
}

/**
 * Turn an AWS SDK failure into something a human can act on. Without this the
 * caller only ever sees "failed to generate embedding", which is true of a
 * missing key, a disabled model and a throttle alike.
 */
function describeFailure(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  const detail = error instanceof Error ? error.message : String(error);
  const where = `${TITAN_MODEL_ID} in ${REGION}`;

  switch (name) {
    case "CredentialsProviderError":
      return `No AWS credentials resolved for Bedrock. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.`;
    case "UnrecognizedClientException":
    case "InvalidSignatureException":
      return `AWS rejected the Bedrock credentials (${name}). The key may be deleted, disabled or rotated.`;
    case "AccessDeniedException":
      return `Access denied to ${where}. The IAM principal needs bedrock:InvokeModel, and the model must be enabled for this account in this region.`;
    case "ResourceNotFoundException":
      return `${where} was not found. Titan v2 is not available in every region.`;
    case "ThrottlingException":
      return `Bedrock throttled the request for ${where}. Retry with backoff.`;
    case "ValidationException":
      return `Bedrock rejected the request body for ${where}: ${detail}`;
    default:
      return `Bedrock call to ${where} failed${name ? ` (${name})` : ""}: ${detail}`;
  }
}

/**
 * Generate a 1024-dimensional embedding using Amazon Titan v2.
 * Throws EmbeddingError with an actionable reason — callers that must not fail
 * should use tryGenerateEmbedding instead.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new EmbeddingError("Cannot embed empty text");
  }

  let responseBody: { embedding?: number[] };
  try {
    const response = await client.send(
      new InvokeModelCommand({
        modelId: TITAN_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          inputText: text,
          dimensions: 1024,
          normalize: true,
        }),
      }),
    );

    responseBody = JSON.parse(new TextDecoder().decode(response.body));
  } catch (error) {
    throw new EmbeddingError(describeFailure(error), error);
  }

  const embedding = responseBody.embedding;
  if (!Array.isArray(embedding) || embedding.length !== 1024) {
    throw new EmbeddingError(
      `Unexpected embedding shape from ${TITAN_MODEL_ID}: ${embedding?.length ?? "null"} dimensions, expected 1024`,
    );
  }

  return embedding;
}

/** Best-effort variant for background writes: logs and returns null instead of throwing. */
export async function tryGenerateEmbedding(text: string): Promise<number[] | null> {
  try {
    return await generateEmbedding(text);
  } catch (error) {
    console.error(
      `[embedder] ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/**
 * Embed a Memory record's content and write to the database.
 * Only called when importance >= 3. Never throws — a failed embedding must not
 * lose the memory itself, which is already committed.
 */
export async function embedMemory(memoryId: string, content: string): Promise<void> {
  const startMs = Date.now();
  const embedding = await tryGenerateEmbedding(content);

  if (!embedding) {
    console.warn(`[embedder] skipping memory ${memoryId} (embedding failed)`);
    return;
  }

  try {
    const vectorLiteral = `[${embedding.join(",")}]`;
    await prisma.$executeRaw`
      UPDATE "Memory"
      SET embedding = ${vectorLiteral}::vector,
          "embeddedAt" = NOW()
      WHERE id = ${memoryId}
    `;

    const embedMs = Date.now() - startMs;
    console.log(
      `[embedder] embedded memory ${memoryId} in ${embedMs}ms (${content.length} chars → 1024d)`,
    );
  } catch (error) {
    console.error(`[embedder] failed to write embedding for memory ${memoryId}:`, error);
  }
}

/**
 * Embed repository context and write to the database.
 * Called when sessionCount >= 2 or when explicitly requested.
 */
export async function embedRepositoryContext(
  repoId: string,
  contextText: string,
): Promise<void> {
  const startMs = Date.now();
  const embedding = await tryGenerateEmbedding(contextText);

  if (!embedding) {
    console.warn(`[embedder] skipping repo ${repoId} (embedding failed)`);
    return;
  }

  try {
    const vectorLiteral = `[${embedding.join(",")}]`;
    await prisma.$executeRaw`
      UPDATE "RepositoryContext"
      SET "contextEmbedding" = ${vectorLiteral}::vector,
          "embeddedAt" = NOW()
      WHERE "repoId" = ${repoId}
    `;

    const embedMs = Date.now() - startMs;
    console.log(
      `[embedder] embedded repo context ${repoId} in ${embedMs}ms (${contextText.length} chars → 1024d)`,
    );
  } catch (error) {
    console.error(`[embedder] failed to write embedding for repo ${repoId}:`, error);
  }
}

/**
 * Batch embedding for migration scripts.
 * Processes up to 25 items in parallel (Bedrock default concurrency).
 */
export async function embedBatch(
  items: Array<{ id: string; text: string; type: "memory" | "repo" }>,
): Promise<void> {
  const BATCH_SIZE = 25;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((item) =>
        item.type === "memory"
          ? embedMemory(item.id, item.text)
          : embedRepositoryContext(item.id, item.text),
      ),
    );
    console.log(
      `[embedder] batch ${i / BATCH_SIZE + 1}/${Math.ceil(items.length / BATCH_SIZE)} complete`,
    );
  }
}
