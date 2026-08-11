import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { prisma } from "@/lib/db";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const TITAN_MODEL_ID = "amazon.titan-embed-text-v2:0";

/**
 * Embeds behaviorText using Amazon Titan and writes the vector to AddressProfile.
 * Only called when observationCount >= 2 OR degree >= 3 (don't embed one-off counterparties).
 */
export async function embedBehaviorText(
  address: string,
  behaviorText: string,
): Promise<void> {
  if (!behaviorText.trim()) {
    console.warn(`[embedder] skipping empty behaviorText for ${address}`);
    return;
  }

  const startMs = Date.now();

  try {
    // Call Titan embedding model
    const response = await client.send(
      new InvokeModelCommand({
        modelId: TITAN_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          inputText: behaviorText,
          dimensions: 1024,
          normalize: true,
        }),
      }),
    );

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const embedding: number[] = responseBody.embedding;

    if (!Array.isArray(embedding) || embedding.length !== 1024) {
      throw new Error(
        `Unexpected embedding shape: ${embedding?.length || "null"}`,
      );
    }

    // Write vector via $executeRaw (Prisma doesn't support VECTOR type in typed queries)
    const vectorLiteral = `[${embedding.join(",")}]`;
    await prisma.$executeRaw`
      UPDATE "AddressProfile"
      SET "behaviorEmbedding" = ${vectorLiteral}::vector,
          "embeddedAt" = NOW()
      WHERE address = ${address}
    `;

    const embedMs = Date.now() - startMs;
    console.log(
      `[embedder] embedded ${address} in ${embedMs}ms (${behaviorText.length} chars → 1024d vector)`,
    );
  } catch (error) {
    console.error(`[embedder] failed to embed ${address}:`, error);
    // Don't throw — embedding is best-effort, trace should still complete
  }
}

/**
 * Batch embedding for seed scripts.
 * Processes up to 25 addresses in parallel (Bedrock default concurrency).
 */
export async function embedBatch(
  profiles: Array<{ address: string; behaviorText: string }>,
): Promise<void> {
  const BATCH_SIZE = 25;
  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((p) => embedBehaviorText(p.address, p.behaviorText)),
    );
    console.log(
      `[embedder] batch ${i / BATCH_SIZE + 1}/${Math.ceil(profiles.length / BATCH_SIZE)} complete`,
    );
  }
}
