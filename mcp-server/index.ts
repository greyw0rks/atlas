#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { prisma } from "./db.js";
import {
  startSession,
  endSession,
  saveMemory,
  recordDecision,
  updateRepositoryContext,
  resolveMemory
} from "../lib/memory/writer.js";
import {
  getRepositoryContext,
  getRecentSessions,
  getOpenTasks,
  getDecisions,
  getSession,
  listRepositories,
  searchMemories,
  getSessionMemories,
  getSessionDecisions,
  logRetrieval,
  getRepoTimeline
} from "../lib/memory/retrieval.js";
import { generateEmbedding } from "../lib/memory/embedder.js";
import { scanRepository } from "../lib/intelligence/repo-scanner.js";
import { extractFromGitHistory } from "../lib/intelligence/memory-extractor.js";
import { getRecentCommits, isGitRepo } from "../lib/intelligence/git-tracker.js";
import * as fs from "fs/promises";
import * as path from "path";

const server = new Server(
  {
    name: "atlas-memory",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "atlas_start_session",
        description:
          "Start a new coding session for a repository. Creates CodingSession record and loads full repository context including last session summary, open tasks, and key decisions. Returns sessionId and complete context.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Absolute path or github.com/org/repo identifier",
            },
            repoName: {
              type: "string",
              description: "Human-readable repository name",
            },
            agentId: {
              type: "string",
              description: "Agent identifier (e.g., 'claude-code', 'codex', 'cursor')",
            },
            orgId: {
              type: "string",
              description: "Optional organization ID if this repo belongs to one",
            },
          },
          required: ["repoPath", "repoName", "agentId"],
        },
      },
      {
        name: "atlas_get_repository_context",
        description:
          "Get full repository context without starting a session. Returns architecture, tech stack, important files, constraints, recent sessions, open tasks, and key decisions.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Repository path",
            },
          },
          required: ["repoPath"],
        },
      },
      {
        name: "atlas_save_memory",
        description:
          "Save a memory (fact, observation, note) to the current coding session. Memories with importance >= 3 are automatically embedded for semantic search.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Current session ID from atlas_start_session",
            },
            repoId: {
              type: "string",
              description: "Repository ID from atlas_start_session",
            },
            kind: {
              type: "string",
              enum: ["ARCHITECTURE", "DECISION", "BUG", "TODO", "WARNING", "IMPORTANT_FILE", "DEPENDENCY", "SECURITY", "CONTEXT"],
              description: "Memory type",
            },
            content: {
              type: "string",
              description: "The fact or note to remember",
            },
            importance: {
              type: "number",
              description: "1-5 importance (>=3 triggers embedding), default 1",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags for filtering",
            },
          },
          required: ["sessionId", "repoId", "kind", "content"],
        },
      },
      {
        name: "atlas_record_decision",
        description:
          "Record an architectural or implementation decision with rationale and alternatives considered.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Current session ID",
            },
            repoId: {
              type: "string",
              description: "Repository ID",
            },
            title: {
              type: "string",
              description: "Short decision title (e.g., 'Use Fastify over Express')",
            },
            rationale: {
              type: "string",
              description: "Why this decision was made",
            },
            alternatives: {
              type: "array",
              items: { type: "string" },
              description: "Other options that were considered",
            },
          },
          required: ["sessionId", "repoId", "title", "rationale"],
        },
      },
      {
        name: "atlas_get_open_tasks",
        description:
          "Get all unresolved TODO and BUG memories for a repository, ordered by importance.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Repository path",
            },
          },
          required: ["repoPath"],
        },
      },
      {
        name: "atlas_get_recent_sessions",
        description:
          "Get the N most recent coding sessions for a repository with summaries and memory/decision counts.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Repository path",
            },
            limit: {
              type: "number",
              description: "Max sessions to return (default 5)",
            },
          },
          required: ["repoPath"],
        },
      },
      {
        name: "atlas_update_context",
        description:
          "Update a field in RepositoryContext (architecture, constraints, techStack, importantFiles). Regenerates contextText and triggers re-embedding.",
        inputSchema: {
          type: "object",
          properties: {
            repoId: {
              type: "string",
              description: "Repository ID",
            },
            architecture: {
              type: "string",
              description: "Markdown describing system architecture",
            },
            constraints: {
              type: "string",
              description: "Hard rules / 'don't touch' notes",
            },
            techStack: {
              type: "array",
              items: { type: "string" },
              description: "Tech stack list",
            },
            importantFiles: {
              type: "array",
              items: { type: "string" },
              description: "Critical file paths",
            },
          },
          required: ["repoId"],
        },
      },
      {
        name: "atlas_create_handoff",
        description:
          "Generate a structured handoff document for the current session. Includes what was done, what failed, what's next, and important context for the next agent. Returns markdown handoff text.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID to generate handoff for",
            },
          },
          required: ["sessionId"],
        },
      },
      {
        name: "atlas_search_memory",
        description:
          "Semantic search over memories using vector kNN. Returns memories ranked by similarity to the query text.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Optional: restrict search to one repository",
            },
            query: {
              type: "string",
              description: "Natural language query",
            },
            kind: {
              type: "string",
              enum: ["ARCHITECTURE", "DECISION", "BUG", "TODO", "WARNING", "IMPORTANT_FILE", "DEPENDENCY", "SECURITY", "CONTEXT"],
              description: "Optional: filter by memory kind",
            },
            limit: {
              type: "number",
              description: "Max results (default 20)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "atlas_end_session",
        description:
          "End the current coding session. Marks as complete, writes summary and handoff text, and creates .atlas/ portable projection files in the repository root.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID to end",
            },
            summary: {
              type: "string",
              description: "Short summary of what was accomplished",
            },
            handoffText: {
              type: "string",
              description: "Optional: full handoff markdown (if already generated)",
            },
            repoPath: {
              type: "string",
              description: "Repository path for writing .atlas/ files",
            },
          },
          required: ["sessionId", "summary", "repoPath"],
        },
      },
      {
        name: "atlas_scan_repository",
        description:
          "Scan repository to auto-discover tech stack, architecture (from README), and important files. Updates RepositoryContext with findings.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Absolute path to repository root",
            },
            repoId: {
              type: "string",
              description: "Repository ID from atlas_start_session",
            },
          },
          required: ["repoPath", "repoId"],
        },
      },
      {
        name: "atlas_extract_git_memories",
        description:
          "Extract memories from recent git commits. Analyzes commit messages and file changes to auto-generate BUG, ARCHITECTURE, SECURITY, and DEPENDENCY memories.",
        inputSchema: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Current session ID",
            },
            repoId: {
              type: "string",
              description: "Repository ID",
            },
            repoPath: {
              type: "string",
              description: "Repository path",
            },
            since: {
              type: "string",
              description: "ISO date string - only extract from commits after this date (default: last 7 days)",
            },
            limit: {
              type: "number",
              description: "Max commits to analyze (default 50)",
            },
          },
          required: ["sessionId", "repoId", "repoPath"],
        },
      },
      {
        name: "atlas_generate_atlas_md",
        description:
          "Generate ATLAS.md in the repository root. Writes a machine-readable project brief: tech stack, architecture, constraints, open tasks, and recent decisions. Ideal as a session-start primer.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Repository path to write ATLAS.md into",
            },
          },
          required: ["repoPath"],
        },
      },
      {
        name: "atlas_reconstruct_timeline",
        description:
          "Reconstruct a chronological timeline of all memories and decisions for a repository across all sessions, grouped by day. Useful for understanding project evolution.",
        inputSchema: {
          type: "object",
          properties: {
            repoPath: {
              type: "string",
              description: "Repository path",
            },
            since: {
              type: "string",
              description: "ISO date string — only include events after this date",
            },
            limit: {
              type: "number",
              description: "Max events to return per type (default 200)",
            },
          },
          required: ["repoPath"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "atlas_start_session": {
        const { repoPath, repoName, agentId, orgId } = args as {
          repoPath: string;
          repoName: string;
          agentId: string;
          orgId?: string;
        };

        const { sessionId, repoId } = await startSession(repoPath, repoName, agentId, orgId);

        // Load full context
        const context = await getRepositoryContext(repoPath);
        const recentSessions = await getRecentSessions(repoPath, 1);
        const openTasks = await getOpenTasks(repoPath);
        const decisions = await getDecisions(repoPath, 5);
        const suggestions = buildSuggestions(openTasks, recentSessions[0] || null);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                sessionId,
                repoId,
                context: context?.context,
                lastSession: recentSessions[0] || null,
                openTasks: openTasks.slice(0, 10),
                recentDecisions: decisions.slice(0, 5),
                suggestions,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_get_repository_context": {
        const { repoPath } = args as { repoPath: string };

        const context = await getRepositoryContext(repoPath);
        const recentSessions = await getRecentSessions(repoPath, 5);
        const openTasks = await getOpenTasks(repoPath);
        const decisions = await getDecisions(repoPath, 10);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                context: context?.context || null,
                recentSessions,
                openTasks,
                decisions,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_save_memory": {
        const { sessionId, repoId, kind, content, importance, tags } = args as {
          sessionId: string;
          repoId: string;
          kind: any;
          content: string;
          importance?: number;
          tags?: string[];
        };

        const { memoryId } = await saveMemory(sessionId, repoId, {
          kind,
          content,
          importance,
          tags,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                memoryId,
                willEmbed: (importance ?? 1) >= 3,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_record_decision": {
        const { sessionId, repoId, title, rationale, alternatives } = args as {
          sessionId: string;
          repoId: string;
          title: string;
          rationale: string;
          alternatives?: string[];
        };

        const { decisionId } = await recordDecision(sessionId, repoId, {
          title,
          rationale,
          alternatives,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                decisionId,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_get_open_tasks": {
        const { repoPath } = args as { repoPath: string };
        const tasks = await getOpenTasks(repoPath);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ tasks }, null, 2),
            },
          ],
        };
      }

      case "atlas_get_recent_sessions": {
        const { repoPath, limit } = args as { repoPath: string; limit?: number };
        const sessions = await getRecentSessions(repoPath, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ sessions }, null, 2),
            },
          ],
        };
      }

      case "atlas_update_context": {
        const { repoId, architecture, constraints, techStack, importantFiles } = args as {
          repoId: string;
          architecture?: string;
          constraints?: string;
          techStack?: string[];
          importantFiles?: string[];
        };

        await updateRepositoryContext(repoId, {
          architecture,
          constraints,
          techStack,
          importantFiles,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true }, null, 2),
            },
          ],
        };
      }

      case "atlas_create_handoff": {
        const { sessionId } = args as { sessionId: string };

        const session = await getSession(sessionId);
        if (!session) {
          throw new Error(`Session not found: ${sessionId}`);
        }

        const memories = await getSessionMemories(sessionId);
        const decisions = await getSessionDecisions(sessionId);

        // Build handoff markdown
        const handoff = buildHandoffMarkdown(session, memories, decisions);

        return {
          content: [
            {
              type: "text",
              text: handoff,
            },
          ],
        };
      }

      case "atlas_search_memory": {
        const { repoPath, query, kind, limit } = args as {
          repoPath?: string;
          query: string;
          kind?: any;
          limit?: number;
        };

        const startMs = Date.now();
        const embedding = await generateEmbedding(query);

        if (!embedding) {
          throw new Error("Failed to generate query embedding");
        }

        const results = await searchMemories(embedding, repoPath, kind, limit);
        const latencyMs = Date.now() - startMs;

        await logRetrieval(
          "search",
          query,
          results.map((r) => r.id),
          results.map((r) => r.similarity),
          latencyMs,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                query,
                results,
                latencyMs,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_end_session": {
        const { sessionId, summary, handoffText, repoPath } = args as {
          sessionId: string;
          summary: string;
          handoffText?: string;
          repoPath: string;
        };

        await endSession(sessionId, summary, handoffText);

        // Write .atlas/ projection files
        await writeAtlasProjection(repoPath, sessionId, handoffText);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                projectionWritten: true,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_scan_repository": {
        const { repoPath, repoId } = args as {
          repoPath: string;
          repoId: string;
        };

        const result = await scanRepository(repoPath, repoId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                techStack: result.techStack,
                importantFiles: result.importantFiles,
                architectureFound: !!result.architecture,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_extract_git_memories": {
        const { sessionId, repoId, repoPath, since, limit } = args as {
          sessionId: string;
          repoId: string;
          repoPath: string;
          since?: string;
          limit?: number;
        };

        const isGit = await isGitRepo(repoPath);
        if (!isGit) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "Not a git repository",
                  extractedCount: 0,
                }, null, 2),
              },
            ],
          };
        }

        const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const commits = await getRecentCommits(repoPath, sinceDate, limit || 50);
        const result = await extractFromGitHistory(sessionId, repoId, commits);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                commitsAnalyzed: commits.length,
                extractedCount: result.extractedCount,
              }, null, 2),
            },
          ],
        };
      }

      case "atlas_generate_atlas_md": {
        const { repoPath } = args as { repoPath: string };
        const atlasPath = await generateAtlasMd(repoPath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, path: atlasPath }, null, 2),
            },
          ],
        };
      }

      case "atlas_reconstruct_timeline": {
        const { repoPath, since, limit } = args as {
          repoPath: string;
          since?: string;
          limit?: number;
        };
        const sinceDate = since ? new Date(since) : undefined;
        const timeline = await getRepoTimeline(repoPath, sinceDate, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ repoPath, days: timeline.length, timeline }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Rule-based suggestions from open tasks and last session handoff.
 * No LLM — pure logic over existing data.
 */
function buildSuggestions(
  openTasks: Array<{ kind: string; content: string; importance: number }>,
  lastSession: { summary?: string | null; handoffText?: string | null } | null,
): Array<{ priority: string; action: string; source: string }> {
  const suggestions: Array<{ priority: string; action: string; source: string }> = [];

  if (lastSession?.handoffText) {
    const nextLine = lastSession.handoffText
      .split("\n")
      .find((l) => /^\d+\./.test(l.trim()));
    if (nextLine) {
      suggestions.push({
        priority: "high",
        action: `Continue: ${nextLine.replace(/^\d+\.\s*/, "").trim()}`,
        source: "last_session",
      });
    }
  }

  const top = [...openTasks].sort((a, b) => b.importance - a.importance).slice(0, 4);
  for (const t of top) {
    if (suggestions.length >= 5) break;
    suggestions.push({
      priority: t.importance >= 4 ? "high" : t.importance >= 3 ? "medium" : "low",
      action: t.kind === "BUG" ? `Fix bug: ${t.content}` : t.content,
      source: "open_task",
    });
  }

  return suggestions.slice(0, 5);
}

/**
 * Write ATLAS.md to the repository root.
 * Returns the path it was written to.
 */
async function generateAtlasMd(repoPath: string): Promise<string> {
  const [context, openTasks, decisions, sessions] = await Promise.all([
    getRepositoryContext(repoPath),
    getOpenTasks(repoPath),
    getDecisions(repoPath, 10),
    getRecentSessions(repoPath, 3),
  ]);

  const lines: string[] = [];
  const repoName = context?.name ?? path.basename(repoPath);

  lines.push(`# ATLAS — ${repoName}`);
  lines.push("");
  lines.push(`> Generated by Atlas MCP on ${new Date().toISOString().split("T")[0]}`);
  lines.push("");

  if (context?.context) {
    const ctx = context.context;

    if (ctx.techStack.length > 0) {
      lines.push("## Tech Stack");
      ctx.techStack.forEach((t: string) => lines.push(`- ${t}`));
      lines.push("");
    }

    if (ctx.architecture) {
      lines.push("## Architecture");
      lines.push(ctx.architecture);
      lines.push("");
    }

    if (ctx.constraints) {
      lines.push("## Constraints");
      lines.push(ctx.constraints);
      lines.push("");
    }

    if (ctx.importantFiles.length > 0) {
      lines.push("## Key Files");
      ctx.importantFiles.forEach((f: string) => lines.push(`- \`${f}\``));
      lines.push("");
    }
  }

  if (openTasks.length > 0) {
    lines.push("## Open Tasks");
    openTasks
      .sort((a, b) => b.importance - a.importance)
      .forEach((t, i) =>
        lines.push(`${i + 1}. **[${t.kind}]** ${t.content} *(importance: ${t.importance})*`),
      );
    lines.push("");
  }

  if (decisions.length > 0) {
    lines.push("## Recent Decisions");
    decisions.slice(0, 5).forEach((d) => {
      lines.push(`### ${d.title}`);
      lines.push(`- **Why:** ${d.rationale}`);
      if (d.alternatives.length > 0) {
        lines.push(`- **Alternatives:** ${d.alternatives.join(", ")}`);
      }
      lines.push(`- *${d.createdAt.toISOString().split("T")[0]} — ${d.agentId}*`);
      lines.push("");
    });
  }

  if (sessions.length > 0 && sessions[0].summary) {
    lines.push("## Last Session Summary");
    lines.push(sessions[0].summary);
    lines.push(
      `*${sessions[0].startedAt.toISOString().split("T")[0]} — ${sessions[0].agentId}*`,
    );
    lines.push("");
  }

  const atlasPath = path.join(repoPath, "ATLAS.md");
  await fs.writeFile(atlasPath, lines.join("\n"));
  return atlasPath;
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

  const completedTasks = memories.filter((m) => m.resolved && (m.kind === "TODO" || m.kind === "BUG"));
  if (completedTasks.length > 0) {
    lines.push("**Completed:**");
    completedTasks.forEach((t) => lines.push(`- ${t.content}`));
    lines.push("");
  }

  // Decisions made
  if (decisions.length > 0) {
    lines.push("## Decisions Made");
    lines.push("");
    decisions.forEach((d) => {
      lines.push(`**${d.title}**`);
      lines.push(`- Why: ${d.rationale}`);
      if (d.alternatives.length > 0) {
        lines.push(`- Alternatives considered: ${d.alternatives.join(", ")}`);
      }
      lines.push("");
    });
  }

  // What failed
  const bugs = memories.filter((m) => !m.resolved && m.kind === "BUG");
  const warnings = memories.filter((m) => m.kind === "WARNING");
  if (bugs.length > 0 || warnings.length > 0) {
    lines.push("## What Failed / Caution");
    lines.push("");
    bugs.forEach((b) => lines.push(`- BUG: ${b.content}`));
    warnings.forEach((w) => lines.push(`- ⚠️ ${w.content}`));
    lines.push("");
  }

  // What's next
  const openTodos = memories.filter((m) => !m.resolved && m.kind === "TODO");
  if (openTodos.length > 0) {
    lines.push("## What's Next");
    lines.push("");
    openTodos
      .sort((a, b) => b.importance - a.importance)
      .forEach((t, i) => lines.push(`${i + 1}. ${t.content}`));
    lines.push("");
  }

  // Important context
  const important = memories.filter((m) =>
    ["ARCHITECTURE", "IMPORTANT_FILE", "DEPENDENCY", "SECURITY"].includes(m.kind)
  );
  if (important.length > 0) {
    lines.push("## Important Context");
    lines.push("");
    important.forEach((m) => lines.push(`- **${m.kind}**: ${m.content}`));
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Write .atlas/ projection files to repository root
 */
async function writeAtlasProjection(repoPath: string, sessionId: string, handoffText?: string) {
  const atlasDir = path.join(repoPath, ".atlas");
  const sessionsDir = path.join(atlasDir, "sessions");

  await fs.mkdir(sessionsDir, { recursive: true });

  // Write session handoff
  if (handoffText) {
    const session = await getSession(sessionId);
    const dateStr = session?.startedAt.toISOString().split("T")[0] || "unknown";
    const handoffPath = path.join(sessionsDir, `${dateStr}.md`);
    await fs.writeFile(handoffPath, handoffText);
  }

  // Write context.md
  const repo = await prisma.repository.findUnique({
    where: { path: repoPath },
    include: { context: true },
  });

  if (repo?.context) {
    const contextLines = [];
    contextLines.push(`# ${repo.name} — Context`);
    contextLines.push("");
    if (repo.context.architecture) {
      contextLines.push("## Architecture");
      contextLines.push("");
      contextLines.push(repo.context.architecture);
      contextLines.push("");
    }
    if (repo.context.techStack.length > 0) {
      contextLines.push("## Tech Stack");
      contextLines.push("");
      repo.context.techStack.forEach((t: string) => contextLines.push(`- ${t}`));
      contextLines.push("");
    }
    if (repo.context.constraints) {
      contextLines.push("## Constraints");
      contextLines.push("");
      contextLines.push(repo.context.constraints);
      contextLines.push("");
    }
    await fs.writeFile(path.join(atlasDir, "context.md"), contextLines.join("\n"));
  }

  // Write todos.md
  const openTasks = await getOpenTasks(repoPath);
  if (openTasks.length > 0) {
    const todoLines = [`# Open Tasks`, ""];
    openTasks.forEach((t) => {
      todoLines.push(`## ${t.kind}: ${t.content}`);
      todoLines.push(`- Importance: ${t.importance}`);
      todoLines.push(`- Created: ${t.createdAt.toISOString()}`);
      todoLines.push("");
    });
    await fs.writeFile(path.join(atlasDir, "todos.md"), todoLines.join("\n"));
  }

  // Write decisions.md
  const decisions = await getDecisions(repoPath, 50);
  if (decisions.length > 0) {
    const decisionLines = [`# Decisions`, ""];
    decisions.forEach((d) => {
      decisionLines.push(`## ${d.title}`);
      decisionLines.push(`- Rationale: ${d.rationale}`);
      if (d.alternatives.length > 0) {
        decisionLines.push(`- Alternatives: ${d.alternatives.join(", ")}`);
      }
      decisionLines.push(`- Agent: ${d.agentId}`);
      decisionLines.push(`- Date: ${d.createdAt.toISOString()}`);
      decisionLines.push("");
    });
    await fs.writeFile(path.join(atlasDir, "decisions.md"), decisionLines.join("\n"));
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Atlas MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
