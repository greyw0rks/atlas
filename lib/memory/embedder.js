"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
exports.embedMemory = embedMemory;
exports.embedRepositoryContext = embedRepositoryContext;
exports.embedBatch = embedBatch;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const db_1 = require("@/lib/db");
const client = new client_bedrock_runtime_1.BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
});
const TITAN_MODEL_ID = "amazon.titan-embed-text-v2:0";
/**
 * Generate a 1024-dimensional embedding using Amazon Titan v2.
 * Returns the normalized vector or null on failure.
 */
async function generateEmbedding(text) {
    if (!text.trim()) {
        console.warn("[embedder] skipping empty text");
        return null;
    }
    try {
        const response = await client.send(new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: TITAN_MODEL_ID,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                inputText: text,
                dimensions: 1024,
                normalize: true,
            }),
        }));
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const embedding = responseBody.embedding;
        if (!Array.isArray(embedding) || embedding.length !== 1024) {
            throw new Error(`Unexpected embedding shape: ${embedding?.length || "null"}`);
        }
        return embedding;
    }
    catch (error) {
        console.error("[embedder] failed to generate embedding:", error);
        return null;
    }
}
/**
 * Embed a Memory record's content and write to the database.
 * Only called when importance >= 3.
 */
async function embedMemory(memoryId, content) {
    const startMs = Date.now();
    const embedding = await generateEmbedding(content);
    if (!embedding) {
        console.warn(`[embedder] skipping memory ${memoryId} (embedding failed)`);
        return;
    }
    try {
        const vectorLiteral = `[${embedding.join(",")}]`;
        await db_1.prisma.$executeRaw `
      UPDATE "Memory"
      SET embedding = ${vectorLiteral}::vector,
          "embeddedAt" = NOW()
      WHERE id = ${memoryId}
    `;
        const embedMs = Date.now() - startMs;
        console.log(`[embedder] embedded memory ${memoryId} in ${embedMs}ms (${content.length} chars → 1024d)`);
    }
    catch (error) {
        console.error(`[embedder] failed to write embedding for memory ${memoryId}:`, error);
    }
}
/**
 * Embed repository context and write to the database.
 * Called when sessionCount >= 2 or when explicitly requested.
 */
async function embedRepositoryContext(repoId, contextText) {
    const startMs = Date.now();
    const embedding = await generateEmbedding(contextText);
    if (!embedding) {
        console.warn(`[embedder] skipping repo ${repoId} (embedding failed)`);
        return;
    }
    try {
        const vectorLiteral = `[${embedding.join(",")}]`;
        await db_1.prisma.$executeRaw `
      UPDATE "RepositoryContext"
      SET "contextEmbedding" = ${vectorLiteral}::vector,
          "embeddedAt" = NOW()
      WHERE "repoId" = ${repoId}
    `;
        const embedMs = Date.now() - startMs;
        console.log(`[embedder] embedded repo context ${repoId} in ${embedMs}ms (${contextText.length} chars → 1024d)`);
    }
    catch (error) {
        console.error(`[embedder] failed to write embedding for repo ${repoId}:`, error);
    }
}
/**
 * Batch embedding for migration scripts.
 * Processes up to 25 items in parallel (Bedrock default concurrency).
 */
async function embedBatch(items) {
    const BATCH_SIZE = 25;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((item) => item.type === "memory"
            ? embedMemory(item.id, item.text)
            : embedRepositoryContext(item.id, item.text)));
        console.log(`[embedder] batch ${i / BATCH_SIZE + 1}/${Math.ceil(items.length / BATCH_SIZE)} complete`);
    }
}
