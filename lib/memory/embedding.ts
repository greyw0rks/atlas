import { prisma } from "@/lib/db";
import { shouldEmbed } from "./profile";

/**
 * Generate embedding for an AddressProfile using AWS Bedrock Titan.
 * Only called if shouldEmbed() returns true.
 */
export async function embedAddressProfile(address: string): Promise<void> {
  const profile = await prisma.addressProfile.findUnique({
    where: { address },
    select: { behaviorText: true, embeddedAt: true },
  });

  if (!profile || !profile.behaviorText) {
    throw new Error(`No profile or behaviorText for ${address}`);
  }

  // Skip if already embedded recently (within last 24h)
  if (profile.embeddedAt && Date.now() - profile.embeddedAt.getTime() < 86400000) {
    return;
  }

  const canEmbed = await shouldEmbed(address);
  if (!canEmbed) {
    return;
  }

  // Generate embedding via Bedrock Titan
  const embedding = await generateEmbedding();
  // TODO D8: pass profile.behaviorText to generateEmbedding

  // Write via raw SQL (Prisma typed client breaks on VECTOR columns)
  const vectorStr = "[" + embedding.join(",") + "]";
  await prisma.$executeRaw`
    UPDATE "AddressProfile"
    SET "behaviorEmbedding" = ${vectorStr}::vector,
        "embeddedAt" = now()
    WHERE address = ${address}
  `;
}

/**
 * Call AWS Bedrock Titan Text Embeddings V2 to generate 1024-dim vector.
 * TODO D8: send text to Bedrock API
 */
async function generateEmbedding(): Promise<number[]> {
  const bedrockEndpoint = process.env.AWS_BEDROCK_ENDPOINT;
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bedrockEndpoint || !awsAccessKey || !awsSecretKey) {
    console.warn("Bedrock not configured, returning zero vector");
    return new Array(1024).fill(0);
  }

  // TODO: Implement AWS Signature V4 signing for Bedrock API
  // For now, return a mock embedding for local dev
  // Real implementation in D8
  console.warn("Bedrock embedding not yet implemented, using mock");
  return new Array(1024).fill(0).map(() => Math.random() * 0.01);
}

/**
 * Vector kNN search over AddressProfile embeddings.
 * Returns top K similar addresses.
 */
export async function vectorSearch(
  queryText: string,
  k: number = 5
): Promise<Array<{ address: string; distance: number }>> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding();
  // TODO D8: pass queryText to generateEmbedding
  const vectorStr = "[" + queryEmbedding.join(",") + "]";

  // Cosine similarity search via raw SQL
  const results = await prisma.$queryRaw<
    Array<{ address: string; distance: number }>
  >`
    SELECT address, "behaviorEmbedding" <=> ${vectorStr}::vector AS distance
    FROM "AddressProfile"
    WHERE "behaviorEmbedding" IS NOT NULL
    ORDER BY "behaviorEmbedding" <=> ${vectorStr}::vector
    LIMIT ${k}
  `;

  return results;
}
