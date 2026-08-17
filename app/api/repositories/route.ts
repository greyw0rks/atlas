import { NextResponse } from "next/server";
import { listRepositories } from "@/lib/memory/retrieval";

export const dynamic = "force-dynamic";

/**
 * GET /api/repositories
 * List all repositories with summary stats
 */
export async function GET() {
  try {
    const repos = await listRepositories();

    return NextResponse.json({
      repositories: repos,
      total: repos.length,
    });
  } catch (error) {
    console.error("[GET /api/repositories] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
