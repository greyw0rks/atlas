"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMemory = saveMemory;
exports.recordDecision = recordDecision;
exports.updateRepositoryContext = updateRepositoryContext;
exports.startSession = startSession;
exports.endSession = endSession;
exports.resolveMemory = resolveMemory;
const db_1 = require("@/lib/db");
const embedder_1 = require("./embedder");
/**
 * Generate deterministic context text from structured RepositoryContext fields.
 * This text is stable across updates — re-running produces the same string.
 */
function generateContextText(data) {
    const parts = [];
    parts.push(`Repository: ${data.name}`);
    parts.push(`Sessions: ${data.sessionCount}`);
    parts.push(`Open tasks: ${data.openTaskCount}`);
    if (data.techStack.length > 0) {
        parts.push(`Tech stack: ${data.techStack.join(", ")}`);
    }
    if (data.importantFiles.length > 0) {
        parts.push(`Key files: ${data.importantFiles.slice(0, 5).join(", ")}`);
    }
    if (data.architecture) {
        // First line only to keep deterministic text compact
        const archLine = data.architecture.split("\n")[0];
        parts.push(`Architecture: ${archLine}`);
    }
    if (data.constraints) {
        const constraintLine = data.constraints.split("\n")[0];
        parts.push(`Constraints: ${constraintLine}`);
    }
    return parts.join(" | ");
}
/**
 * Save a memory to a coding session.
 * If importance >= 3, triggers embedding asynchronously.
 */
async function saveMemory(sessionId, repoId, input) {
    const memory = await db_1.prisma.memory.create({
        data: {
            sessionId,
            repoId,
            kind: input.kind,
            content: input.content,
            importance: input.importance ?? 1,
            tags: input.tags ?? [],
        },
    });
    // Update open task count if this is a TODO or BUG
    if (input.kind === "TODO" || input.kind === "BUG") {
        await db_1.prisma.repositoryContext.update({
            where: { repoId },
            data: { openTaskCount: { increment: 1 } },
        });
    }
    // Trigger embedding if importance >= 3 (best-effort, don't block)
    if ((input.importance ?? 1) >= 3) {
        (0, embedder_1.embedMemory)(memory.id, input.content).catch((err) => console.error(`[writer] background embedding failed for memory ${memory.id}:`, err));
    }
    return { memoryId: memory.id };
}
/**
 * Record a decision made during a coding session.
 */
async function recordDecision(sessionId, repoId, input) {
    const decision = await db_1.prisma.decision.create({
        data: {
            sessionId,
            repoId,
            title: input.title,
            rationale: input.rationale,
            alternatives: input.alternatives ?? [],
        },
    });
    return { decisionId: decision.id };
}
/**
 * Update a field on RepositoryContext (architecture, constraints, techStack, etc.).
 * Regenerates contextText and triggers re-embedding if sessionCount >= 2.
 */
async function updateRepositoryContext(repoId, updates) {
    // Fetch current context to merge updates
    const context = await db_1.prisma.repositoryContext.findUnique({
        where: { repoId },
        include: { repo: true },
    });
    if (!context) {
        throw new Error(`RepositoryContext not found for repoId=${repoId}`);
    }
    // Merge updates
    const merged = {
        architecture: updates.architecture ?? context.architecture,
        constraints: updates.constraints ?? context.constraints,
        techStack: updates.techStack ?? context.techStack,
        importantFiles: updates.importantFiles ?? context.importantFiles,
    };
    // Regenerate deterministic contextText
    const contextText = generateContextText({
        name: context.repo.name,
        techStack: merged.techStack,
        importantFiles: merged.importantFiles,
        architecture: merged.architecture,
        constraints: merged.constraints,
        openTaskCount: context.openTaskCount,
        sessionCount: context.sessionCount,
    });
    await db_1.prisma.repositoryContext.update({
        where: { repoId },
        data: {
            ...merged,
            contextText,
        },
    });
    // Trigger embedding if sessionCount >= 2 (best-effort)
    if (context.sessionCount >= 2) {
        (0, embedder_1.embedRepositoryContext)(repoId, contextText).catch((err) => console.error(`[writer] background embedding failed for repo ${repoId}:`, err));
    }
}
/**
 * Start a new coding session.
 * Creates CodingSession record and initializes or updates RepositoryContext.
 */
async function startSession(repoPath, repoName, agentId, orgId) {
    // Upsert repository
    const repo = await db_1.prisma.repository.upsert({
        where: { path: repoPath },
        create: {
            path: repoPath,
            name: repoName,
            orgId,
        },
        update: {},
    });
    // Upsert repository context
    await db_1.prisma.repositoryContext.upsert({
        where: { repoId: repo.id },
        create: {
            repoId: repo.id,
            sessionCount: 1,
            lastSessionAt: new Date(),
        },
        update: {
            sessionCount: { increment: 1 },
            lastSessionAt: new Date(),
        },
    });
    // Create session
    const session = await db_1.prisma.codingSession.create({
        data: {
            repoId: repo.id,
            agentId,
        },
    });
    return { sessionId: session.id, repoId: repo.id };
}
/**
 * End a coding session.
 * Marks session as completed, writes summary and handoff text.
 */
async function endSession(sessionId, summary, handoffText) {
    const session = await db_1.prisma.codingSession.findUnique({
        where: { id: sessionId },
    });
    if (!session) {
        throw new Error(`CodingSession not found: ${sessionId}`);
    }
    const now = new Date();
    const durationMs = now.getTime() - session.startedAt.getTime();
    await db_1.prisma.codingSession.update({
        where: { id: sessionId },
        data: {
            completed: true,
            endedAt: now,
            durationMs,
            summary,
            handoffText,
        },
    });
}
/**
 * Resolve a TODO or BUG memory (mark as completed without deleting).
 */
async function resolveMemory(memoryId) {
    const memory = await db_1.prisma.memory.findUnique({
        where: { id: memoryId },
    });
    if (!memory) {
        throw new Error(`Memory not found: ${memoryId}`);
    }
    if (memory.resolved) {
        return; // already resolved
    }
    await db_1.prisma.memory.update({
        where: { id: memoryId },
        data: { resolved: true },
    });
    // Decrement open task count
    if (memory.kind === "TODO" || memory.kind === "BUG") {
        await db_1.prisma.repositoryContext.update({
            where: { repoId: memory.repoId },
            data: { openTaskCount: { decrement: 1 } },
        });
    }
}
