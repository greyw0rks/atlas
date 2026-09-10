"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ArrowRight,
  Boxes,
  ListTodo,
  Clock,
  Compass,
  Package,
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
import { formatRelativeTime, formatDuration, tildePath } from "@/components/atlas/format";

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
      <Frame>
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </Frame>
    );
  }

  if (error || !repo) {
    return (
      <Frame>
        <Panel>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Repository not found"
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

  const lastSession = repo.recentSessions[0];

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
              <Display className="text-3xl md:text-4xl">{repo.name}</Display>
              <span className="font-mono text-[11px] text-muted">
                {tildePath(repo.path)}
              </span>
            </div>
            <div className="flex gap-8">
              <Stat label="Sessions" value={repo.context?.sessionCount ?? 0} />
              <Stat
                label="Open"
                value={repo.openTasks.length}
                accent={repo.openTasks.length > 0}
              />
              <Stat label="Decisions" value={repo.decisions.length} />
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {lastSession && (
            <Panel className="flex flex-col gap-5 p-6 md:p-8 lg:col-span-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Display className="text-2xl">Pick up where you left off</Display>
                  <span className="font-mono text-[11px] text-muted">
                    {formatRelativeTime(lastSession.startedAt)} · {lastSession.agentId}
                  </span>
                </div>
                <PillLink href={`/session/${lastSession.id}`} className="px-3 py-1.5">
                  <span>Open</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                </PillLink>
              </div>

              {lastSession.summary && (
                <Card className="p-5">
                  <MetaLabel>What was done</MetaLabel>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    {lastSession.summary}
                  </p>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <MetaLabel>Memories</MetaLabel>
                  <p className="mt-1 font-display text-2xl">{lastSession.memoryCount}</p>
                </Card>
                <Card className="p-4">
                  <MetaLabel>Decisions</MetaLabel>
                  <p className="mt-1 font-display text-2xl">
                    {lastSession.decisionCount}
                  </p>
                </Card>
                <Card className="p-4">
                  <MetaLabel>Duration</MetaLabel>
                  <p className="mt-1 font-display text-2xl">
                    {lastSession.durationMs ? formatDuration(lastSession.durationMs) : "—"}
                  </p>
                </Card>
              </div>
            </Panel>
          )}

          <Panel
            className={`flex flex-col gap-4 p-6 md:p-8 ${
              lastSession ? "lg:col-span-5" : "lg:col-span-12"
            }`}
          >
            <div className="flex items-center justify-between">
              <MetaLabel className="text-ink">Open tasks</MetaLabel>
              <ListTodo className="h-4 w-4 text-muted-soft" />
            </div>

            {repo.openTasks.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted">
                Nothing unresolved. TODO and BUG memories land here until an agent
                marks them resolved.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {repo.openTasks.slice(0, 10).map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <KindBadge kind={task.kind} />
                      <Importance value={task.importance} />
                    </div>
                    <p className="text-xs leading-relaxed text-ink">{task.content}</p>
                    {task.tags.length > 0 && (
                      <p className="mt-2 font-mono text-[10px] text-muted">
                        {task.tags.join(", ")}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel className="flex flex-col gap-4 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <MetaLabel className="text-ink">Recent sessions</MetaLabel>
              <Clock className="h-4 w-4 text-muted-soft" />
            </div>

            {repo.recentSessions.length === 0 ? (
              <p className="text-xs text-muted">No sessions recorded.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {repo.recentSessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="rounded-2xl border border-stroke bg-raised p-4 transition-colors hover:border-muted-soft"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-ink">
                        {session.agentId}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {formatRelativeTime(session.startedAt)}
                      </span>
                    </div>
                    {session.summary && (
                      <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                        {session.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                      <span>{session.memoryCount} memories</span>
                      <span>·</span>
                      <span>{session.decisionCount} decisions</span>
                      {session.durationMs && (
                        <>
                          <span>·</span>
                          <span>{formatDuration(session.durationMs)}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="flex flex-col gap-4 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <MetaLabel className="text-ink">Key decisions</MetaLabel>
              <Compass className="h-4 w-4 text-muted-soft" />
            </div>

            {repo.decisions.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted">
                No decisions recorded. Agents write these with{" "}
                <code className="font-mono text-[11px] text-ink">
                  atlas_record_decision
                </code>
                .
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {repo.decisions.slice(0, 5).map((decision) => (
                  <Card key={decision.id} className="p-4">
                    <p className="text-sm font-medium text-ink">{decision.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                      {decision.rationale}
                    </p>
                    {decision.alternatives.length > 0 && (
                      <p className="mt-2 text-[11px] leading-relaxed text-muted">
                        Instead of: {decision.alternatives.join(", ")}
                      </p>
                    )}
                    <p className="mt-3 font-mono text-[10px] text-muted">
                      {decision.agentId} · {formatRelativeTime(decision.createdAt)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {repo.context &&
          (repo.context.architecture ||
            repo.context.techStack.length > 0 ||
            repo.context.constraints ||
            repo.context.importantFiles.length > 0) && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {repo.context.architecture && (
                <Panel className="flex flex-col gap-4 p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <MetaLabel className="text-ink">Architecture</MetaLabel>
                    <Boxes className="h-4 w-4 text-muted-soft" />
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">
                    {repo.context.architecture}
                  </p>
                </Panel>
              )}

              <Panel className="flex flex-col gap-6 p-6 md:p-8">
                {repo.context.techStack.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <MetaLabel className="text-ink">Tech stack</MetaLabel>
                      <Package className="h-4 w-4 text-muted-soft" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {repo.context.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-stroke bg-raised px-3 py-1 text-[11px] text-ink-soft"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {repo.context.importantFiles.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <MetaLabel className="text-ink">Important files</MetaLabel>
                    <ul className="flex flex-col gap-1 font-mono text-[11px] text-muted">
                      {repo.context.importantFiles.map((file) => (
                        <li key={file}>{file}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {repo.context.constraints && (
                  <div className="flex flex-col gap-3">
                    <MetaLabel className="text-accent">Constraints</MetaLabel>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">
                      {repo.context.constraints}
                    </p>
                  </div>
                )}
              </Panel>
            </div>
          )}
      </div>
    </Frame>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <MetaLabel>{label}</MetaLabel>
      <span
        className={`font-display text-2xl leading-none ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
