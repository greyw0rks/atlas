"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface SessionData {
  id: string;
  repoName: string;
  repoPath: string;
  agentId: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  summary: string | null;
  handoffText: string | null;
  completed: boolean;
  memories: Array<{
    id: string;
    kind: string;
    content: string;
    importance: number;
    tags: string[];
    resolved: boolean;
    createdAt: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    rationale: string;
    alternatives: string[];
    createdAt: string;
  }>;
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<string>("all");

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error("Session not found");
        }
        const data = await res.json();
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070C] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#05070C] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Session not found</div>
          <Link href="/" className="text-[#8B5CF6] hover:text-[#A78BFA]">
            ← Back to workspace
          </Link>
        </div>
      </div>
    );
  }

  const kinds = ["all", ...new Set(session.memories.map((m) => m.kind))];
  const filteredMemories =
    filterKind === "all"
      ? session.memories
      : session.memories.filter((m) => m.kind === filterKind);

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
                <h1 className="text-xl font-bold">{session.repoName}</h1>
                <p className="text-xs text-[#64748B]">
                  Session by <span className="text-[#8B5CF6]">{session.agentId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`text-xs px-3 py-1 rounded-full ${
                  session.completed
                    ? "bg-[#10B981]/10 text-[#10B981]"
                    : "bg-[#F59E0B]/10 text-[#F59E0B]"
                }`}
              >
                {session.completed ? "Completed" : "In Progress"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Session Info */}
        <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 mb-8">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-[#64748B] uppercase mb-1">Started</div>
              <div className="text-sm">
                {new Date(session.startedAt).toLocaleString()}
              </div>
            </div>
            {session.endedAt && (
              <div>
                <div className="text-xs text-[#64748B] uppercase mb-1">Ended</div>
                <div className="text-sm">
                  {new Date(session.endedAt).toLocaleString()}
                </div>
              </div>
            )}
            {session.durationMs && (
              <div>
                <div className="text-xs text-[#64748B] uppercase mb-1">Duration</div>
                <div className="text-sm">{formatDuration(session.durationMs)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-[#64748B] uppercase mb-1">Activity</div>
              <div className="text-sm">
                {session.memories.length} memories, {session.decisions.length}{" "}
                decisions
              </div>
            </div>
          </div>

          {session.summary && (
            <div className="mt-4 pt-4 border-t border-[#1E2636]">
              <div className="text-xs text-[#64748B] uppercase mb-2">Summary</div>
              <div className="text-sm">{session.summary}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Timeline - Left Column (2/3 width) */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Session Timeline</h2>
              <div className="flex items-center gap-2">
                <select
                  value={filterKind}
                  onChange={(e) => setFilterKind(e.target.value)}
                  className="text-xs px-3 py-1 bg-[#0F131C] border border-[#1E2636] rounded-lg text-[#E8E9F3]"
                >
                  {kinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind === "all" ? "All" : kind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredMemories.map((memory, index) => (
                <div
                  key={memory.id}
                  className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#05070C] rounded-full flex items-center justify-center text-xs text-[#64748B]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`px-2 py-1 rounded text-xs font-mono ${getKindColor(
                            memory.kind
                          )}`}
                        >
                          {memory.kind}
                        </div>
                        {memory.importance >= 3 && (
                          <div className="text-xs text-[#F59E0B]">
                            {"★".repeat(memory.importance)}
                          </div>
                        )}
                        {memory.resolved && (
                          <div className="text-xs text-[#10B981]">✓ Resolved</div>
                        )}
                      </div>
                      <div className="text-sm mb-2">{memory.content}</div>
                      <div className="flex items-center gap-2 text-xs text-[#64748B]">
                        <span>
                          {new Date(memory.createdAt).toLocaleTimeString()}
                        </span>
                        {memory.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{memory.tags.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMemories.length === 0 && (
                <div className="text-center py-12 text-[#64748B]">
                  No memories of this type
                </div>
              )}
            </div>
          </div>

          {/* Decisions - Right Column (1/3 width) */}
          <div>
            <h2 className="text-lg font-bold mb-4">Decisions Made</h2>
            {session.decisions.length === 0 ? (
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 text-center text-[#64748B]">
                No decisions recorded
              </div>
            ) : (
              <div className="space-y-4">
                {session.decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4"
                  >
                    <div className="text-sm font-semibold mb-2">
                      {decision.title}
                    </div>
                    <div className="text-xs text-[#64748B] mb-3">
                      {decision.rationale}
                    </div>
                    {decision.alternatives.length > 0 && (
                      <div className="text-xs text-[#64748B] pt-3 border-t border-[#1E2636]">
                        <div className="mb-1">Alternatives:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {decision.alternatives.map((alt, i) => (
                            <li key={i}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Handoff */}
            {session.handoffText && (
              <div className="mt-6">
                <h2 className="text-lg font-bold mb-4">Handoff Document</h2>
                <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-[#E8E9F3]">
                    {session.handoffText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getKindColor(kind: string): string {
  const colors: Record<string, string> = {
    ARCHITECTURE: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
    DECISION: "bg-[#10B981]/10 text-[#10B981]",
    BUG: "bg-[#DC2626]/10 text-[#DC2626]",
    TODO: "bg-[#F59E0B]/10 text-[#F59E0B]",
    WARNING: "bg-[#F59E0B]/10 text-[#F59E0B]",
    IMPORTANT_FILE: "bg-[#3B82F6]/10 text-[#3B82F6]",
    DEPENDENCY: "bg-[#64748B]/10 text-[#64748B]",
    SECURITY: "bg-[#DC2626]/10 text-[#DC2626]",
    CONTEXT: "bg-[#64748B]/10 text-[#64748B]",
  };
  return colors[kind] || "bg-[#64748B]/10 text-[#64748B]";
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
