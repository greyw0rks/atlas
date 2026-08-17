import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/memory/embedder";
import { searchMemories, logRetrieval } from "@/lib/memory/retrieval";

export const dynamic = "force-dynamic";

/**
 * GET /api/memories/search?query=...&repoPath=...&kind=...&limit=...
 * Semantic search over memories using vector kNN
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const repoPath = searchParams.get("repoPath") || undefined;
    const kind = searchParams.get("kind") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query) {
      return NextResponse.json(
        { error: "Missing required parameter: query" },
        { status: 400 }
      );
    }

    const startMs = Date.now();
    const embedding = await generateEmbedding(query);

    if (!embedding) {
      return NextResponse.json(
        { error: "Failed to generate query embedding" },
        { status: 500 }
      );
    }

    const results = await searchMemories(
      embedding,
      repoPath,
      kind as any,
      limit
    );

    const latencyMs = Date.now() - startMs;

    // Log retrieval for observability
    await logRetrieval(
      "search",
      query,
      results.map((r) => r.id),
      results.map((r) => r.similarity),
      latencyMs,
    );

    return NextResponse.json({
      query,
      results,
      latencyMs,
      resultCount: results.length,
    });
  } catch (error) {
    console.error("[GET /api/memories/search] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search memories" },
      { status: 500 }
    );
  }
}
