"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface RepositoryData {
  id: string;
  name: string;
  path: string;
  context: {
    architecture: string | null;
    techStack: string[];
    importantFiles: string[];
    constraints: string | null;
    sessionCount: number;
    openTaskCount: number;
    lastSessionAt: string | null;
  } | null;
  recentSessions: Array<{
    id: string;
    agentId: string;
    startedAt: string;
    endedAt: string | null;
    durationMs: number | null;
    summary: string | null;
    completed: boolean;
    memoryCount: number;
    decisionCount: number;
  }>;
  openTasks: Array<{
    id: string;
    kind: string;
    content: string;
    importance: number;
    tags: string[];
    createdAt: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    rationale: string;
    alternatives: string[];
    createdAt: string;
    agentId: string;
  }>;
}

export default function RepositoryPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [repo, setRepo] = useState<RepositoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRepository() {
      try {
        const res = await fetch(`/api/repositories/${repoId}`);
        if (!res.ok) {
          throw new Error("Repository not found");
        }
        const data = await res.json();
        setRepo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repository");
      } finally {
        setLoading(false);
      }
    }

    loadRepository();
  }, [repoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070C] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="min-h-screen bg-[#05070C] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Repository not found</div>
          <Link href="/" className="text-[#8B5CF6] hover:text-[#A78BFA]">
            ← Back to workspace
          </Link>
        </div>
      </div>
    );
  }

  const lastSession = repo.recentSessions[0];

  return (
    <div className="min-h-screen bg-[#05070C] text-[#E8E9F3]">
      {/* Header */}
      <header className="border-b border-[#1E2636] bg-[#0A0D12]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-[#64748B] hover:text-[#E8E9F3] transition-colors"
              >
                ←
              </Link>
              <div>
                <h1 className="text-xl font-bold">{repo.name}</h1>
                <p className="text-xs text-[#64748B] font-mono">
                  {repo.path.replace(/^\/home\/[^/]+\//, "~/")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-[#64748B]">
                {repo.context?.sessionCount || 0} sessions
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pick Up Where You Left Off Widget */}
        {lastSession && (
          <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#6D28D9]/5 border border-[#8B5CF6]/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold mb-1">Pick Up Where You Left Off</h2>
                <div className="text-sm text-[#64748B]">
                  Last session: {formatRelativeTime(lastSession.startedAt)} by{" "}
                  <span className="text-[#8B5CF6]">{lastSession.agentId}</span>
                </div>
              </div>
              <Link
                href={`/session/${lastSession.id}`}
                className="text-sm text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
              >
                View session →
              </Link>
            </div>

            {lastSession.summary && (
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4 mb-4">
                <div className="text-xs text-[#64748B] uppercase mb-2">What was done</div>
                <div className="text-sm">{lastSession.summary}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4">
                <div className="text-xs text-[#64748B] uppercase mb-2">
                  Memories recorded
                </div>
                <div className="text-2xl font-bold">{lastSession.memoryCount}</div>
              </div>
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4">
                <div className="text-xs text-[#64748B] uppercase mb-2">
                  Decisions made
                </div>
                <div className="text-2xl font-bold">{lastSession.decisionCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Open Tasks */}
        {repo.openTasks.length > 0 && (
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 mb-8">
            <h3 className="text-sm font-semibold text-[#64748B] uppercase mb-4">
              Open Tasks ({repo.openTasks.length})
            </h3>
            <div className="space-y-3">
              {repo.openTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-[#05070C] rounded-lg"
                >
                  <div
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      task.kind === "BUG"
                        ? "bg-[#DC2626]/10 text-[#DC2626]"
                        : "bg-[#F59E0B]/10 text-[#F59E0B]"
                    }`}
                  >
                    {task.kind}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm mb-1">{task.content}</div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <span>Importance: {task.importance}/5</span>
                      {task.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{task.tags.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#64748B] uppercase mb-4">
              Recent Sessions
            </h3>
            <div className="space-y-3">
              {repo.recentSessions.slice(0, 5).map((session) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="block p-3 bg-[#05070C] rounded-lg hover:border-[#8B5CF6] border border-transparent transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-[#8B5CF6]">
                      {session.agentId}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {formatRelativeTime(session.startedAt)}
                    </div>
                  </div>
                  {session.summary && (
                    <div className="text-xs text-[#64748B] mb-2 line-clamp-2">
                      {session.summary}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span>{session.memoryCount} memories</span>
                    <span>•</span>
                    <span>{session.decisionCount} decisions</span>
                    {session.durationMs && (
                      <>
                        <span>•</span>
                        <span>{Math.round(session.durationMs / 1000)}s</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#64748B] uppercase mb-4">
              Key Decisions
            </h3>
            <div className="space-y-4">
              {repo.decisions.slice(0, 5).map((decision) => (
                <div key={decision.id} className="p-3 bg-[#05070C] rounded-lg">
                  <div className="text-sm font-semibold mb-2">{decision.title}</div>
                  <div className="text-xs text-[#64748B] mb-2">
                    {decision.rationale}
                  </div>
                  {decision.alternatives.length > 0 && (
                    <div className="text-xs text-[#64748B]">
                      Alternatives: {decision.alternatives.join(", ")}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#64748B]">
                    <span>{decision.agentId}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(decision.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Context */}
        {repo.context && (
          <div className="mt-6 grid grid-cols-2 gap-6">
            {repo.context.architecture && (
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#64748B] uppercase mb-4">
                  Architecture
                </h3>
                <div className="text-sm text-[#E8E9F3] whitespace-pre-wrap">
                  {repo.context.architecture}
                </div>
              </div>
            )}

            {repo.context.techStack.length > 0 && (
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#64748B] uppercase mb-4">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {repo.context.techStack.map((tech, i) => (
                    <div
                      key={i}
                      className="px-3 py-1 bg-[#05070C] rounded-full text-xs"
                    >
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
