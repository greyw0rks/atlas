import { NextRequest, NextResponse } from "next/server";
import { getRecentSessions, getOpenTasks, getDecisions } from "@/lib/memory/retrieval";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/repositories/[id]
 * Get full repository context including sessions, tasks, and decisions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repoId = params.id;

    // Get repository by ID
    const repo = await prisma.repository.findUnique({
      where: { id: repoId },
      include: { context: true },
    });

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const recentSessions = await getRecentSessions(repo.path, 5);
    const openTasks = await getOpenTasks(repo.path);
    const decisions = await getDecisions(repo.path, 10);

    return NextResponse.json({
      id: repo.id,
      name: repo.name,
      path: repo.path,
      context: repo.context,
      recentSessions,
      openTasks,
      decisions,
    });
  } catch (error) {
    console.error(`[GET /api/repositories/${params.id}] error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repository" },
      { status: 500 }
    );
  }
}
