"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemoryStats = getMemoryStats;
exports.getRepositoryContext = getRepositoryContext;
exports.getRecentSessions = getRecentSessions;
exports.getOpenTasks = getOpenTasks;
exports.getDecisions = getDecisions;
exports.getSessionMemories = getSessionMemories;
exports.getSessionDecisions = getSessionDecisions;
exports.findSimilarRepositories = findSimilarRepositories;
exports.searchMemories = searchMemories;
exports.logRetrieval = logRetrieval;
exports.getSession = getSession;
exports.getRepoTimeline = getRepoTimeline;
exports.listRepositories = listRepositories;
const db_1 = require("@/lib/db");
/**
 * Get overall memory statistics.
 */
async function getMemoryStats() {
    const [repoCount, sessionCount, memoryCount, openTaskCount] = await Promise.all([
        db_1.prisma.repository.count(),
        db_1.prisma.codingSession.count(),
        db_1.prisma.memory.count(),
        db_1.prisma.memory.count({ where: { resolved: false, kind: { in: ["TODO", "BUG"] } } }),
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
async function getRepositoryContext(repoPath) {
    const repo = await db_1.prisma.repository.findUnique({
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
async function getRecentSessions(repoPath, limit = 5) {
    const repo = await db_1.prisma.repository.findUnique({
        where: { path: repoPath },
    });
    if (!repo) {
        return [];
    }
    const sessions = await db_1.prisma.codingSession.findMany({
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
async function getOpenTasks(repoPath) {
    const repo = await db_1.prisma.repository.findUnique({
        where: { path: repoPath },
    });
    if (!repo) {
        return [];
    }
    const tasks = await db_1.prisma.memory.findMany({
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
async function getDecisions(repoPath, limit = 20) {
    const repo = await db_1.prisma.repository.findUnique({
        where: { path: repoPath },
    });
    if (!repo) {
        return [];
    }
    const decisions = await db_1.prisma.decision.findMany({
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
async function getSessionMemories(sessionId) {
    const memories = await db_1.prisma.memory.findMany({
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
async function getSessionDecisions(sessionId) {
    const decisions = await db_1.prisma.decision.findMany({
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
async function findSimilarRepositories(queryEmbedding, limit = 10) {
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;
    const results = await db_1.prisma.$queryRaw `
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
async function searchMemories(queryEmbedding, repoPath, kind, limit = 20) {
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;
    let repo = null;
    if (repoPath) {
        repo = await db_1.prisma.repository.findUnique({
            where: { path: repoPath },
        });
        if (!repo) {
            return [];
        }
    }
    // Build WHERE clause dynamically
    const whereClauses = [`m.embedding IS NOT NULL`];
    if (repo)
        whereClauses.push(`m."repoId" = '${repo.id}'`);
    if (kind)
        whereClauses.push(`m.kind = '${kind}'`);
    const whereSQL = whereClauses.join(" AND ");
    const results = await db_1.prisma.$queryRaw `
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
        kind: m.kind,
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
async function logRetrieval(kind, queryText, hitIds, scores, latencyMs, repoId) {
    await db_1.prisma.memoryRetrieval.create({
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
async function getSession(sessionId) {
    const session = await db_1.prisma.codingSession.findUnique({
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
async function getRepoTimeline(repoPath, since, limit = 200) {
    const repo = await db_1.prisma.repository.findUnique({
        where: { path: repoPath },
    });
    if (!repo) {
        return [];
    }
    const [memories, decisions] = await Promise.all([
        db_1.prisma.memory.findMany({
            where: {
                repoId: repo.id,
                ...(since ? { createdAt: { gte: since } } : {}),
            },
            orderBy: { createdAt: "asc" },
            take: limit,
            include: { session: { select: { agentId: true } } },
        }),
        db_1.prisma.decision.findMany({
            where: {
                repoId: repo.id,
                ...(since ? { createdAt: { gte: since } } : {}),
            },
            orderBy: { createdAt: "asc" },
            take: limit,
            include: { session: { select: { agentId: true } } },
        }),
    ]);
    const events = [
        ...memories.map((m) => ({
            type: "memory",
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
            type: "decision",
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
    const groups = {};
    for (const event of events) {
        const key = event.date.toISOString().split("T")[0];
        if (!groups[key])
            groups[key] = { date: key, events: [] };
        groups[key].events.push(event);
    }
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}
/**
 * List all repositories with summary stats.
 */
async function listRepositories() {
    const repos = await db_1.prisma.repository.findMany({
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
