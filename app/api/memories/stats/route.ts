import { NextResponse } from "next/server";
import { getMemoryStats } from "@/lib/memory/retrieval";

export const dynamic = "force-dynamic";

/**
 * GET /api/memories/stats
 * Get overall memory statistics
 */
export async function GET() {
  try {
    const stats = await getMemoryStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[GET /api/memories/stats] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch memory stats" },
      { status: 500 }
    );
  }
}
