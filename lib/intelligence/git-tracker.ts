import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: Date;
  filesChanged: string[];
}

/**
 * Get recent commits from the repository.
 */
export async function getRecentCommits(
  repoPath: string,
  since?: Date,
  limit = 50,
): Promise<GitCommit[]> {
  try {
    const sinceArg = since ? `--since="${since.toISOString()}"` : "";
    const { stdout } = await execAsync(
      `git -C "${repoPath}" log ${sinceArg} -n ${limit} --pretty=format:"%H|%an|%at|%s"`,
    );

    if (!stdout.trim()) {
      return [];
    }

    const commits: GitCommit[] = [];

    for (const line of stdout.trim().split("\n")) {
      const [hash, author, timestamp, ...messageParts] = line.split("|");
      const message = messageParts.join("|"); // rejoin in case message had |

      // Get files changed in this commit
      const { stdout: filesOutput } = await execAsync(
        `git -C "${repoPath}" show --name-only --pretty=format: ${hash}`,
      );

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
  } catch (error) {
    console.error("[git-tracker] Failed to get commits:", error);
    return [];
  }
}

/**
 * Get current git branch name.
 */
export async function getCurrentBranch(repoPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`git -C "${repoPath}" rev-parse --abbrev-ref HEAD`);
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Check if directory is a git repository.
 */
export async function isGitRepo(repoPath: string): Promise<boolean> {
  try {
    await execAsync(`git -C "${repoPath}" rev-parse --git-dir`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the repository's remote origin URL.
 */
export async function getRemoteUrl(repoPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`git -C "${repoPath}" config --get remote.origin.url`);
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Get commit count for the repository.
 */
export async function getCommitCount(repoPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`git -C "${repoPath}" rev-list --count HEAD`);
    return parseInt(stdout.trim(), 10);
  } catch {
    return 0;
  }
}
