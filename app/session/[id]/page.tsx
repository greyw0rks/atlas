"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Compass,
  ScrollText,
  Terminal,
  AlertTriangle,
} from "lucide-react";
import {
  Frame,
  Panel,
  Card,
  PillLink,
  MetaLabel,
  BrandMark,
  Display,
  KindBadge,
  Importance,
  Spinner,
  EmptyState,
} from "@/components/atlas/ui";
import { formatDuration } from "@/components/atlas/format";

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
  const [filterKind, setFilterKind] = useState("all");

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
      <Frame>
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </Frame>
    );
  }

  if (error || !session) {
    return (
      <Frame>
        <Panel>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Session not found"
            body={error ?? undefined}
          >
            <div className="flex justify-center">
              <PillLink href="/workspace">
                <ChevronLeft className="h-3.5 w-3.5 text-muted" />
                <span>Back to workspace</span>
              </PillLink>
            </div>
          </EmptyState>
        </Panel>
      </Frame>
    );
  }

  const kinds = ["all", ...new Set(session.memories.map((m) => m.kind))];
  const filteredMemories =
    filterKind === "all"
      ? session.memories
      : session.memories.filter((m) => m.kind === filterKind);

  return (
    <Frame>
      <div className="flex flex-col gap-5">
        <Panel className="flex flex-col gap-6 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <BrandMark />
            <PillLink href="/workspace" className="px-3 py-1.5">
              <ChevronLeft className="h-3.5 w-3.5 text-muted" />
              <span>Workspace</span>
            </PillLink>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Display className="text-3xl md:text-4xl">{session.repoName}</Display>
              <span className="font-mono text-[11px] text-muted">
                {session.agentId} · {new Date(session.startedAt).toLocaleString()}
              </span>
            </div>
            <span
              className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                session.completed
                  ? "border-stroke bg-raised text-muted"
                  : "border-accent/30 bg-accent/10 text-accent"
              }`}
            >
              {session.completed ? "Completed" : "In progress"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-stroke-soft pt-6 md:grid-cols-4">
            <Meta label="Memories" value={String(session.memories.length)} />
            <Meta label="Decisions" value={String(session.decisions.length)} />
            <Meta
              label="Duration"
              value={session.durationMs ? formatDuration(session.durationMs) : "—"}
            />
            <Meta
              label="Ended"
              value={
                session.endedAt
                  ? new Date(session.endedAt).toLocaleTimeString()
                  : "still open"
              }
            />
          </div>

          {session.summary && (
            <Card className="p-5">
              <MetaLabel>Summary</MetaLabel>
              <p className="mt-2 text-sm leading-relaxed text-ink">{session.summary}</p>
            </Card>
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel className="flex flex-col gap-5 p-6 md:p-8 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Display className="text-2xl">Timeline</Display>
              <div className="flex flex-wrap gap-1.5">
                {kinds.map((kind) => {
                  const active = filterKind === kind;
                  return (
                    <button
                      key={kind}
                      onClick={() => setFilterKind(kind)}
                      className={`rounded-full border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
                        active
                          ? "border-ink bg-ink text-canvas"
                          : "border-stroke bg-raised text-muted hover:text-ink"
                      }`}
                    >
                      {kind === "all" ? "All" : kind.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredMemories.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">
                No memories of this type.
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {filteredMemories.map((memory, index) => (
                  <li key={memory.id} className="flex gap-4">
                    <span className="flex flex-col items-center pt-4">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-stroke bg-raised font-mono text-[10px] text-muted">
                        {index + 1}
                      </span>
                      {index < filteredMemories.length - 1 && (
                        <span aria-hidden className="mt-1 w-px flex-1 bg-stroke" />
                      )}
                    </span>
                    <Card className="flex-1 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <KindBadge kind={memory.kind} />
                        <Importance value={memory.importance} />
                        {memory.resolved && <MetaLabel>Resolved</MetaLabel>}
                      </div>
                      <p className="text-sm leading-relaxed text-ink">{memory.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                        <span>{new Date(memory.createdAt).toLocaleTimeString()}</span>
                        {memory.tags.length > 0 && (
                          <>
                            <span>·</span>
                            <span>{memory.tags.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <div className="flex flex-col gap-5 lg:col-span-4">
            <Panel className="flex flex-col gap-4 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <MetaLabel className="text-ink">Decisions made</MetaLabel>
                <Compass className="h-4 w-4 text-muted-soft" />
              </div>

              {session.decisions.length === 0 ? (
                <p className="text-xs text-muted">No decisions recorded.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {session.decisions.map((decision) => (
                    <Card key={decision.id} className="p-4">
                      <p className="text-sm font-medium text-ink">{decision.title}</p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                        {decision.rationale}
                      </p>
                      {decision.alternatives.length > 0 && (
                        <div className="mt-3 border-t border-stroke-soft pt-3">
                          <MetaLabel>Alternatives</MetaLabel>
                          <ul className="mt-1 flex flex-col gap-0.5 text-[11px] text-muted">
                            {decision.alternatives.map((alt) => (
                              <li key={alt}>{alt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Panel>

            {session.handoffText ? (
              <Panel className="flex flex-col gap-4 p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <MetaLabel className="text-ink">Handoff</MetaLabel>
                  <Terminal className="h-4 w-4 text-muted-soft" />
                </div>
                <Card className="overflow-x-auto p-4">
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-soft">
                    {session.handoffText}
                  </pre>
                </Card>
              </Panel>
            ) : (
              <Panel className="flex flex-col gap-3 p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <MetaLabel className="text-ink">Handoff</MetaLabel>
                  <ScrollText className="h-4 w-4 text-muted-soft" />
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  No handoff written. These are generated by{" "}
                  <code className="font-mono text-[11px] text-ink">
                    atlas_create_handoff
                  </code>{" "}
                  and projected to{" "}
                  <code className="font-mono text-[11px] text-ink">.atlas/sessions/</code>
                  .
                </p>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <MetaLabel>{label}</MetaLabel>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
