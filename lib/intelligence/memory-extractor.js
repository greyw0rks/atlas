"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromCommitMessage = extractFromCommitMessage;
exports.extractFromFileChanges = extractFromFileChanges;
exports.extractFromGitHistory = extractFromGitHistory;
exports.extractTodosFromCode = extractTodosFromCode;
const writer_1 = require("@/lib/memory/writer");
/**
 * Extract memories from git commit messages.
 * Patterns:
 * - "fix:" → BUG memory
 * - "feat:" / "add:" → TODO (completed)
 * - "refactor:" / "perf:" → ARCHITECTURE
 * - "BREAKING CHANGE" → DECISION
 */
function extractFromCommitMessage(commit) {
    const memories = [];
    const msg = commit.message.toLowerCase();
    const firstLine = commit.message.split("\n")[0];
    // Bug fix
    if (msg.startsWith("fix:") || msg.includes("fixed") || msg.includes("bug")) {
        memories.push({
            kind: "BUG",
            content: `${firstLine} (fixed in ${commit.hash.substring(0, 7)})`,
            importance: 3,
            tags: ["git", "resolved"],
        });
    }
    // Architecture change
    if (msg.startsWith("refactor:") ||
        msg.startsWith("perf:") ||
        msg.includes("architecture") ||
        msg.includes("redesign")) {
        memories.push({
            kind: "ARCHITECTURE",
            content: `${firstLine} (${commit.hash.substring(0, 7)})`,
            importance: 4,
            tags: ["git", "architecture"],
        });
    }
    // Breaking change = decision
    if (msg.includes("breaking change") || msg.includes("breaking:")) {
        const breakingText = commit.message.split(/breaking change:?/i)[1]?.trim() || firstLine;
        memories.push({
            kind: "DECISION",
            content: `Breaking change: ${breakingText}`,
            importance: 5,
            tags: ["git", "breaking"],
        });
    }
    // Security commit
    if (msg.includes("security") || msg.includes("vulnerability") || msg.includes("cve")) {
        memories.push({
            kind: "SECURITY",
            content: `${firstLine} (${commit.hash.substring(0, 7)})`,
            importance: 5,
            tags: ["git", "security"],
        });
    }
    return memories;
}
/**
 * Extract memories from file changes in a commit.
 * High-signal patterns:
 * - New config files (package.json, .env.example) → DEPENDENCY
 * - Changes to auth/security files → SECURITY
 * - New test files → context about what's tested
 */
function extractFromFileChanges(commit) {
    const memories = [];
    for (const file of commit.filesChanged) {
        // Dependency changes
        if (file.includes("package.json") ||
            file.includes("requirements.txt") ||
            file.includes("go.mod") ||
            file.includes("Cargo.toml")) {
            memories.push({
                kind: "DEPENDENCY",
                content: `Dependency changes in ${file} (${commit.hash.substring(0, 7)})`,
                importance: 3,
                tags: ["git", "dependencies"],
            });
        }
        // Security-sensitive files
        if (file.includes("auth") ||
            file.includes("security") ||
            file.includes("permission") ||
            file.includes("crypto")) {
            memories.push({
                kind: "SECURITY",
                content: `Security-related changes in ${file} (${commit.hash.substring(0, 7)})`,
                importance: 4,
                tags: ["git", "security"],
            });
        }
        // Important config files
        if (file.includes("config") ||
            file.includes("settings") ||
            file.endsWith(".env.example")) {
            memories.push({
                kind: "IMPORTANT_FILE",
                content: `${file} - configuration file modified in ${commit.hash.substring(0, 7)}`,
                importance: 3,
                tags: ["git", "config"],
            });
        }
    }
    return memories;
}
/**
 * Batch extract memories from recent git commits and save to session.
 */
async function extractFromGitHistory(sessionId, repoId, commits) {
    let count = 0;
    for (const commit of commits) {
        const commitMemories = [
            ...extractFromCommitMessage(commit),
            ...extractFromFileChanges(commit),
        ];
        // Deduplicate by content
        const uniqueMemories = commitMemories.filter((m, idx, arr) => arr.findIndex((m2) => m2.content === m.content) === idx);
        for (const mem of uniqueMemories) {
            await (0, writer_1.saveMemory)(sessionId, repoId, mem);
            count++;
        }
    }
    return { extractedCount: count };
}
/**
 * Extract TODO/FIXME comments from code files.
 * Returns structured TODO memories ready to save.
 */
function extractTodosFromCode(filePath, fileContent) {
    const memories = [];
    const lines = fileContent.split("\n");
    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // TODO pattern
        const todoMatch = trimmed.match(/\/\/\s*TODO:?\s*(.+)|#\s*TODO:?\s*(.+)/i);
        if (todoMatch) {
            const todoText = todoMatch[1] || todoMatch[2];
            memories.push({
                kind: "TODO",
                content: `${filePath}:${idx + 1} - ${todoText}`,
                importance: 2,
                tags: ["code", "todo"],
            });
        }
        // FIXME pattern
        const fixmeMatch = trimmed.match(/\/\/\s*FIXME:?\s*(.+)|#\s*FIXME:?\s*(.+)/i);
        if (fixmeMatch) {
            const fixmeText = fixmeMatch[1] || fixmeMatch[2];
            memories.push({
                kind: "BUG",
                content: `${filePath}:${idx + 1} - ${fixmeText}`,
                importance: 3,
                tags: ["code", "fixme"],
            });
        }
        // HACK pattern → WARNING
        const hackMatch = trimmed.match(/\/\/\s*HACK:?\s*(.+)|#\s*HACK:?\s*(.+)/i);
        if (hackMatch) {
            const hackText = hackMatch[1] || hackMatch[2];
            memories.push({
                kind: "WARNING",
                content: `${filePath}:${idx + 1} - HACK: ${hackText}`,
                importance: 3,
                tags: ["code", "hack"],
            });
        }
    });
    return memories;
}
