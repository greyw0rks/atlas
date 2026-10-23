import { prisma } from "@/lib/db";
import {
  type MemoryKind,
  decodeStringList,
  encodeList,
} from "./kinds";
import { recallFromWalrus, recallAcrossNamespaces } from "./memwal";
import { namespaceForRepo } from "./writer";
import type { ChainVerification } from "@/lib/chain/tatum";

/**
 * chainVerification is stored as JSON text on SQLite. Parse it on read; a
 * malformed value must never break recall, so failures degrade to null.
 */
function parseChainVerification(json: string | null): ChainVerification | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as ChainVerification;
  } catch {
    return null;
  }
}

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
 * List fields (techStack / importantFiles) are decoded from their JSON storage.
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

  const context = repo.context
    ? {
        ...repo.context,
        techStack: decodeStringList(repo.context.techStack),
        importantFiles: decodeStringList(repo.context.importantFiles),
      }
    : null;

  return {
    repoId: repo.id,
    name: repo.name,
    path: repo.path,
    context,
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
    tags: decodeStringList(t.tags),
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
    alternatives: decodeStringList(d.alternatives),
    blobId: d.blobId,
    chainVerification: parseChainVerification(d.chainVerification),
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
    tags: decodeStringList(m.tags),
    resolved: m.resolved,
    blobId: m.blobId,
    chainVerification: parseChainVerification(m.chainVerification),
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
    alternatives: decodeStringList(d.alternatives),
    blobId: d.blobId,
    chainVerification: parseChainVerification(d.chainVerification),
    createdAt: d.createdAt,
  }));
}

/**
 * Find repositories whose deterministic context text matches a query.
 * (Cross-repo semantic search now lives in Walrus Memory per-namespace; this is a
 * cheap local text-contains fallback over the SQLite index.)
 */
export async function findSimilarRepositories(query: string, limit = 10) {
  const q = query.trim().toLowerCase();

  const repos = await prisma.repository.findMany({
    include: { context: { select: { contextText: true } } },
  });

  const scored = repos
    .map((r) => {
      const text = (r.context?.contextText ?? r.name).toLowerCase();
      const hit = q.length > 0 && text.includes(q);
      return { repoId: r.id, name: r.name, path: r.path, hit };
    })
    .filter((r) => r.hit)
    .slice(0, limit);

  return scored.map((r) => ({
    repoId: r.repoId,
    name: r.name,
    path: r.path,
    similarity: 1,
  }));
}

/**
 * Semantic search over memories via Walrus Memory (MemWal) recall.
 *
 * Recall runs server-side on the relayer (embedding + vector search over SEAL-
 * encrypted blobs on Walrus). Hits are hydrated from the local SQLite index by
 * blobId to recover kind/importance/tags; hits without a local row are returned
 * from the recalled text directly.
 */
export async function searchMemories(
  query: string,
  repoPath?: string,
  kind?: MemoryKind,
  limit = 20,
) {
  let repo = null;
  if (repoPath) {
    repo = await prisma.repository.findUnique({
      where: { path: repoPath },
    });
    if (!repo) {
      return [];
    }
  }

  const namespace = repo ? namespaceForRepo(repo.name) : undefined;

  // Over-fetch when a kind filter is applied, since MemWal can't filter by kind.
  const recallLimit = kind ? Math.min(limit * 3, 100) : limit;
  // The relayer scopes recall to a namespace. With no repository, discover the
  // account's namespaces and merge their results instead of querying nothing.
  const hits = namespace
    ? await recallFromWalrus({ query, namespace, limit: recallLimit })
    : await recallAcrossNamespaces({ query, limit: recallLimit });

  if (hits.length === 0) {
    return [];
  }

  // Hydrate from the local index by blobId.
  const blobIds = hits.map((h) => h.blobId).filter(Boolean);
  const rows = blobIds.length
    ? await prisma.memory.findMany({
        where: { blobId: { in: blobIds } },
        include: { repo: { select: { name: true } } },
      })
    : [];
  const byBlob = new Map(rows.map((r) => [r.blobId as string, r]));

  // Decisions live in their own table but are written to Walrus with the same
  // blob id, so they hydrate from the decision rows rather than surfacing as
  // anonymous CONTEXT hits.
  const decisionRows = blobIds.length
    ? await prisma.decision.findMany({
        where: { blobId: { in: blobIds } },
        include: { repo: { select: { name: true } } },
      })
    : [];
  const decisionsByBlob = new Map(
    decisionRows.map((d) => [d.blobId as string, d]),
  );

  const results = hits.map((h) => {
    const row = byBlob.get(h.blobId);
    if (row) {
      return {
        id: row.id,
        kind: row.kind as MemoryKind,
        content: row.content,
        importance: row.importance,
        tags: decodeStringList(row.tags),
        resolved: row.resolved,
        blobId: row.blobId,
        chainVerification: parseChainVerification(row.chainVerification),
        createdAt: row.createdAt,
        repoName: row.repo.name,
        similarity: 1 - h.distance,
      };
    }
    const decision = decisionsByBlob.get(h.blobId);
    if (decision) {
      const alternatives = decodeStringList(decision.alternatives);
      return {
        id: decision.id,
        kind: "DECISION" as MemoryKind,
        content:
          `Decision: ${decision.title}\nRationale: ${decision.rationale}` +
          (alternatives.length
            ? `\nAlternatives considered: ${alternatives.join(", ")}`
            : ""),
        importance: 5,
        tags: [] as string[],
        resolved: false,
        blobId: decision.blobId,
        chainVerification: parseChainVerification(decision.chainVerification),
        createdAt: decision.createdAt,
        repoName: decision.repo.name,
        similarity: 1 - h.distance,
      };
    }
    // Memory lives on Walrus but not in this local index — surface it anyway.
    return {
      id: h.blobId,
      kind: "CONTEXT" as MemoryKind,
      content: h.text,
      importance: 1,
      tags: [] as string[],
      resolved: false,
      blobId: h.blobId,
      chainVerification: null,
      createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
      repoName: repo?.name ?? "",
      similarity: 1 - h.distance,
    };
  });

  const filtered = kind ? results.filter((r) => r.kind === kind) : results;
  return filtered.slice(0, limit);
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
      hitIds: encodeList(hitIds),
      scores: encodeList(scores),
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
    memories: session.memories.map((m) => ({
      ...m,
      tags: decodeStringList(m.tags),
      chainVerification: parseChainVerification(m.chainVerification),
    })),
    decisions: session.decisions.map((d) => ({
      ...d,
      alternatives: decodeStringList(d.alternatives),
      chainVerification: parseChainVerification(d.chainVerification),
    })),
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
        tags: decodeStringList(m.tags),
        resolved: m.resolved,
        blobId: m.blobId,
        chainVerification: parseChainVerification(m.chainVerification),
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
        alternatives: decodeStringList(d.alternatives),
        blobId: d.blobId,
        chainVerification: parseChainVerification(d.chainVerification),
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
