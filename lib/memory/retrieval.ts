import { prisma } from "@/lib/db";
import type { MemoryKind } from "@prisma/client";

/**
 * Get overall memory statistics.
 */
export async function getMemoryStats() {
  const [repoCount, sessionCount, memoryCount, openTaskCount] = await Promise.all([
    prisma.repository.count(),
    prisma.codingSession.count(),
    prisma.memory.count(),
    prisma.memory.count({ where: { resolved: false, kind: { in: ["TODO", "BUG"] } } }),
  ]);

  return {
    repositories: repoCount,
    sessions: sessionCount,
    memories: memoryCount,
    openTasks: openTaskCount,
  };
}

/**
 * Get full repository context for a given repository path.
 */
export async function getRepositoryContext(repoPath: string) {
  const repo = await prisma.repository.findUnique({
    where: { path: repoPath },
    include: {
      context: true,
    },
  });

  if (!repo) {
    return null;
  }

  return {
    repoId: repo.id,
    name: repo.name,
    path: repo.path,
    context: repo.context,
  };
}

/**
 * Get recent coding sessions for a repository.
 */
export async function getRecentSessions(repoPath: string, limit = 5) {
  const repo = await prisma.repository.findUnique({
    where: { path: repoPath },
  });

  if (!repo) {
    return [];
  }

  const sessions = await prisma.codingSession.findMany({
    where: { repoId: repo.id },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: {
          memories: true,
          decisions: true,
        },
      },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    agentId: s.agentId,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationMs: s.durationMs,
    summary: s.summary,
    completed: s.completed,
    memoryCount: s._count.memories,
    decisionCount: s._count.decisions,
  }));
}

/**
 * Get open tasks (unresolved TODO + BUG memories) for a repository.
 */
export async function getOpenTasks(repoPath: string) {
  const repo = await prisma.repository.findUnique({
    where: { path: repoPath },
  });

  if (!repo) {
    return [];
  }

  const tasks = await prisma.memory.findMany({
    where: {
      repoId: repo.id,
      resolved: false,
      kind: { in: ["TODO", "BUG"] },
    },
    orderBy: [{ importance: "desc" }, { createdAt: "asc" }],
  });

  return tasks.map((t) => ({
    id: t.id,
    kind: t.kind,
    content: t.content,
    importance: t.importance,
    tags: t.tags,
    createdAt: t.createdAt,
  }));
}

/**
 * Get all decisions for a repository.
 */
export async function getDecisions(repoPath: string, limit = 20) {
  const repo = await prisma.repository.findUnique({
    where: { path: repoPath },
  });

  if (!repo) {
    return [];
  }

  const decisions = await prisma.decision.findMany({
    where: { repoId: repo.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      session: {
        select: {
          agentId: true,
          startedAt: true,
        },
      },
    },
  });

  return decisions.map((d) => ({
    id: d.id,
    title: d.title,
    rationale: d.rationale,
    alternatives: d.alternatives,
    createdAt: d.createdAt,
    agentId: d.session.agentId,
    sessionStartedAt: d.session.startedAt,
  }));
}

/**
 * Get all memories for a specific session.
 */
export async function getSessionMemories(sessionId: string) {
  const memories = await prisma.memory.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return memories.map((m) => ({
    id: m.id,
    kind: m.kind,
    content: m.content,
    importance: m.importance,
    tags: m.tags,
    resolved: m.resolved,
    createdAt: m.createdAt,
  }));
}

/**
 * Get all decisions for a specific session.
 */
export async function getSessionDecisions(sessionId: string) {
  const decisions = await prisma.decision.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return decisions.map((d) => ({
    id: d.id,
    title: d.title,
    rationale: d.rationale,
    alternatives: d.alternatives,
    createdAt: d.createdAt,
  }));
}

/**
 * Find similar repositories using vector kNN search.
 * Returns repositories ordered by cosine similarity.
 */
export async function findSimilarRepositories(queryEmbedding: number[], limit = 10) {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRaw<
    Array<{ repoId: string; name: string; path: string; distance: number }>
  >`
    SELECT
      rc."repoId",
      r.name,
      r.path,
      rc."contextEmbedding" <=> ${vectorLiteral}::vector AS distance
    FROM "RepositoryContext" rc
    JOIN "Repository" r ON r.id = rc."repoId"
    WHERE rc."contextEmbedding" IS NOT NULL
    ORDER BY distance
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    repoId: r.repoId,
    name: r.name,
    path: r.path,
    similarity: 1 - r.distance, // cosine distance to similarity
  }));
}

/**
 * Semantic search over memories using vector kNN.
 * Returns memories ordered by cosine similarity.
 */
export async function searchMemories(
  queryEmbedding: number[],
  repoPath?: string,
  kind?: MemoryKind,
  limit = 20,
) {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  let repo = null;
  if (repoPath) {
    repo = await prisma.repository.findUnique({
      where: { path: repoPath },
    });
    if (!repo) {
      return [];
    }
  }

  // Build WHERE clause dynamically
  const whereClauses: string[] = [`m.embedding IS NOT NULL`];
  if (repo) whereClauses.push(`m."repoId" = '${repo.id}'`);
  if (kind) whereClauses.push(`m.kind = '${kind}'`);

  const whereSQL = whereClauses.join(" AND ");

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      kind: string;
      content: string;
      importance: number;
      tags: string[];
      resolved: boolean;
      createdAt: Date;
      repoName: string;
      distance: number;
    }>
  >`
    SELECT
      m.id,
      m.kind,
      m.content,
      m.importance,
      m.tags,
      m.resolved,
      m."createdAt",
      r.name AS "repoName",
      m.embedding <=> ${vectorLiteral}::vector AS distance
    FROM "Memory" m
    JOIN "Repository" r ON r.id = m."repoId"
    WHERE ${whereSQL}
    ORDER BY distance
    LIMIT ${limit}
  `;

  return results.map((m) => ({
    id: m.id,
    kind: m.kind as MemoryKind,
    content: m.content,
    importance: m.importance,
    tags: m.tags,
    resolved: m.resolved,
    createdAt: m.createdAt,
    repoName: m.repoName,
    similarity: 1 - m.distance,
  }));
}

/**
 * Log a memory retrieval event for observability.
 */
export async function logRetrieval(
  kind: string,
  queryText: string,
  hitIds: string[],
  scores: number[],
  latencyMs: number,
  repoId?: string,
) {
  await prisma.memoryRetrieval.create({
    data: {
      kind,
      queryText,
      repoId,
      hitIds,
      scores,
      latencyMs,
    },
  });
}

/**
 * Get full session details including memories and decisions.
 */
export async function getSession(sessionId: string) {
  const session = await prisma.codingSession.findUnique({
    where: { id: sessionId },
    include: {
      repo: true,
      memories: {
        orderBy: { createdAt: "asc" },
      },
      decisions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    repoName: session.repo.name,
    repoPath: session.repo.path,
    agentId: session.agentId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,
    summary: session.summary,
    handoffText: session.handoffText,
    completed: session.completed,
    memories: session.memories,
    decisions: session.decisions,
  };
}

/**
 * Reconstruct a chronological timeline of all memories + decisions for a repo.
 * Groups events by date (YYYY-MM-DD). Optionally filtered by a since date.
 */
export async function getRepoTimeline(
  repoPath: string,
  since?: Date,
  limit = 200,
) {
  const repo = await prisma.repository.findUnique({
    where: { path: repoPath },
  });

  if (!repo) {
    return [];
  }

  const [memories, decisions] = await Promise.all([
    prisma.memory.findMany({
      where: {
        repoId: repo.id,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: { session: { select: { agentId: true } } },
    }),
    prisma.decision.findMany({
      where: {
        repoId: repo.id,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: { session: { select: { agentId: true } } },
    }),
  ]);

  type TimelineEvent = {
    type: "memory" | "decision";
    date: Date;
    agentId: string;
    data: Record<string, unknown>;
  };

  const events: TimelineEvent[] = [
    ...memories.map((m) => ({
      type: "memory" as const,
      date: m.createdAt,
      agentId: m.session.agentId,
      data: {
        id: m.id,
        kind: m.kind,
        content: m.content,
        importance: m.importance,
        tags: m.tags,
        resolved: m.resolved,
      },
    })),
    ...decisions.map((d) => ({
      type: "decision" as const,
      date: d.createdAt,
      agentId: d.session.agentId,
      data: {
        id: d.id,
        title: d.title,
        rationale: d.rationale,
        alternatives: d.alternatives,
      },
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const groups: Record<string, { date: string; events: TimelineEvent[] }> = {};
  for (const event of events) {
    const key = event.date.toISOString().split("T")[0];
    if (!groups[key]) groups[key] = { date: key, events: [] };
    groups[key].events.push(event);
  }

  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * List all repositories with summary stats.
 */
export async function listRepositories() {
  const repos = await prisma.repository.findMany({
    include: {
      context: {
        select: {
          sessionCount: true,
          openTaskCount: true,
          lastSessionAt: true,
        },
      },
      sessions: {
        take: 1,
        orderBy: { startedAt: "desc" },
        select: {
          agentId: true,
          startedAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    path: r.path,
    sessionCount: r.context?.sessionCount ?? 0,
    openTaskCount: r.context?.openTaskCount ?? 0,
    lastSessionAt: r.context?.lastSessionAt,
    lastAgentId: r.sessions[0]?.agentId,
  }));
}
