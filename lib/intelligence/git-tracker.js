"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentCommits = getRecentCommits;
exports.getCurrentBranch = getCurrentBranch;
exports.isGitRepo = isGitRepo;
exports.getRemoteUrl = getRemoteUrl;
exports.getCommitCount = getCommitCount;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Get recent commits from the repository.
 */
async function getRecentCommits(repoPath, since, limit = 50) {
    try {
        const sinceArg = since ? `--since="${since.toISOString()}"` : "";
        const { stdout } = await execAsync(`git -C "${repoPath}" log ${sinceArg} -n ${limit} --pretty=format:"%H|%an|%at|%s"`);
        if (!stdout.trim()) {
            return [];
        }
        const commits = [];
        for (const line of stdout.trim().split("\n")) {
            const [hash, author, timestamp, ...messageParts] = line.split("|");
            const message = messageParts.join("|"); // rejoin in case message had |
            // Get files changed in this commit
            const { stdout: filesOutput } = await execAsync(`git -C "${repoPath}" show --name-only --pretty=format: ${hash}`);
            const filesChanged = filesOutput
                .trim()
                .split("\n")
                .filter((f) => f.length > 0);
            commits.push({
                hash,
                author,
                timestamp: new Date(parseInt(timestamp) * 1000),
                message,
                filesChanged,
            });
        }
        return commits;
    }
    catch (error) {
        console.error("[git-tracker] Failed to get commits:", error);
        return [];
    }
}
/**
 * Get current git branch name.
 */
async function getCurrentBranch(repoPath) {
    try {
        const { stdout } = await execAsync(`git -C "${repoPath}" rev-parse --abbrev-ref HEAD`);
        return stdout.trim();
    }
    catch {
        return null;
    }
}
/**
 * Check if directory is a git repository.
 */
async function isGitRepo(repoPath) {
    try {
        await execAsync(`git -C "${repoPath}" rev-parse --git-dir`);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get the repository's remote origin URL.
 */
async function getRemoteUrl(repoPath) {
    try {
        const { stdout } = await execAsync(`git -C "${repoPath}" config --get remote.origin.url`);
        return stdout.trim();
    }
    catch {
        return null;
    }
}
/**
 * Get commit count for the repository.
 */
async function getCommitCount(repoPath) {
    try {
        const { stdout } = await execAsync(`git -C "${repoPath}" rev-list --count HEAD`);
        return parseInt(stdout.trim(), 10);
    }
    catch {
        return 0;
    }
}
