import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/memory/writer";
import { getRepositoryContext, getRecentSessions, getOpenTasks, getDecisions } from "@/lib/memory/retrieval";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions
 * Start a new coding session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoPath, repoName, agentId, orgId } = body;

    if (!repoPath || !repoName || !agentId) {
      return NextResponse.json(
        { error: "Missing required fields: repoPath, repoName, agentId" },
        { status: 400 }
      );
    }

    const { sessionId, repoId } = await startSession(repoPath, repoName, agentId, orgId);

    // Load full context for the response
    const context = await getRepositoryContext(repoPath);
    const recentSessions = await getRecentSessions(repoPath, 1);
    const openTasks = await getOpenTasks(repoPath);
    const decisions = await getDecisions(repoPath, 5);

    return NextResponse.json({
      sessionId,
      repoId,
      context: context?.context || null,
      lastSession: recentSessions[0] || null,
      openTasks: openTasks.slice(0, 10),
      recentDecisions: decisions.slice(0, 5),
    });
  } catch (error) {
    console.error("[POST /api/sessions] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start session" },
      { status: 500 }
    );
  }
}
