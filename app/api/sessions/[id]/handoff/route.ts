import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionMemories, getSessionDecisions } from "@/lib/memory/retrieval";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions/[id]/handoff
 * Generate handoff markdown for a session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const memories = await getSessionMemories(sessionId);
    const decisions = await getSessionDecisions(sessionId);

    // Build handoff markdown
    const handoff = buildHandoffMarkdown(session, memories, decisions);

    return NextResponse.json({
      handoff,
      sessionId,
    });
  } catch (error) {
    console.error(`[POST /api/sessions/${params.id}/handoff] error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate handoff" },
      { status: 500 }
    );
  }
}

/**
 * Build handoff markdown from session data
 */
function buildHandoffMarkdown(session: any, memories: any[], decisions: any[]): string {
  const lines: string[] = [];

  lines.push(`# Handoff — ${session.repoName}`);
  lines.push("");
  lines.push(`**Session:** ${session.id}`);
  lines.push(`**Agent:** ${session.agentId}`);
  lines.push(`**Started:** ${session.startedAt.toISOString()}`);
  if (session.endedAt) {
    lines.push(`**Duration:** ${Math.round(session.durationMs / 1000)}s`);
  }
  lines.push("");

  // What was done
  lines.push("## What I Did");
  lines.push("");
  if (session.summary) {
    lines.push(session.summary);
    lines.push("");
  }

  const completedTasks = memories.filter((m: any) => m.resolved && (m.kind === "TODO" || m.kind === "BUG"));
  if (completedTasks.length > 0) {
    lines.push("**Completed:**");
    completedTasks.forEach((t: any) => lines.push(`- ${t.content}`));
    lines.push("");
  }

  // Decisions made
  if (decisions.length > 0) {
    lines.push("## Decisions Made");
    lines.push("");
    decisions.forEach((d: any) => {
      lines.push(`**${d.title}**`);
      lines.push(`- Why: ${d.rationale}`);
      if (d.alternatives.length > 0) {
        lines.push(`- Alternatives considered: ${d.alternatives.join(", ")}`);
      }
      lines.push("");
    });
  }

  // What failed
  const bugs = memories.filter((m: any) => !m.resolved && m.kind === "BUG");
  const warnings = memories.filter((m: any) => m.kind === "WARNING");
  if (bugs.length > 0 || warnings.length > 0) {
    lines.push("## What Failed / Caution");
    lines.push("");
    bugs.forEach((b: any) => lines.push(`- BUG: ${b.content}`));
    warnings.forEach((w: any) => lines.push(`- ⚠️ ${w.content}`));
    lines.push("");
  }

  // What's next
  const openTodos = memories.filter((m: any) => !m.resolved && m.kind === "TODO");
  if (openTodos.length > 0) {
    lines.push("## What's Next");
    lines.push("");
    openTodos
      .sort((a: any, b: any) => b.importance - a.importance)
      .forEach((t: any, i: number) => lines.push(`${i + 1}. ${t.content}`));
    lines.push("");
  }

  // Important context
  const important = memories.filter((m: any) =>
    ["ARCHITECTURE", "IMPORTANT_FILE", "DEPENDENCY", "SECURITY"].includes(m.kind)
  );
  if (important.length > 0) {
    lines.push("## Important Context");
    lines.push("");
    important.forEach((m: any) => lines.push(`- **${m.kind}**: ${m.content}`));
    lines.push("");
  }

  return lines.join("\n");
}
