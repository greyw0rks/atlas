"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Home,
  Search,
  Layers,
  Zap,
  RotateCcw,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Clock,
  Database,
  ListTodo,
  ScrollText,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import {
  Frame,
  Panel,
  Card,
  PillLink,
  AccentButton,
  AccentDot,
  MetaLabel,
  BrandMark,
  Display,
  Spinner,
} from "@/components/atlas/ui";
import { formatRelativeTime, groupByMonth } from "@/components/atlas/format";

interface Repository {
  id: string;
  name: string;
  path: string;
  sessionCount: number;
  openTaskCount: number;
  lastSessionAt: string | null;
  lastAgentId: string | null;
}

interface MemoryStats {
  repositories: number;
  sessions: number;
  memories: number;
  openTasks: number;
}

/** Starter queries. PAST interrogates what memory already holds; FUTURE asks
    what is still unfinished. Both run through the same semantic search. */
const SUGGESTIONS = {
  past: [
    {
      icon: ScrollText,
      badge: "High impact",
      query: "why did we choose this database",
      label: "Surface the decision record behind a choice nobody remembers making.",
    },
    {
      icon: Layers,
      query: "how does authentication work",
      label: "Recover the architecture notes an agent wrote in an earlier session.",
    },
    {
      icon: Clock,
      query: "what broke in production",
      label: "Pull up bugs that were logged, fixed, and then quietly forgotten.",
    },
  ],
  future: [
    {
      icon: ListTodo,
      badge: "High impact",
      query: "unresolved security concern",
      label: "Find the security notes still marked open across every repository.",
    },
    {
      icon: Lightbulb,
      query: "what should I do next",
      label: "Read back the open TODOs the last agent left behind for you.",
    },
    {
      icon: AlertTriangle,
      query: "known limitation or workaround",
      label: "List the HACKs and warnings that were never cleaned up.",
    },
  ],
} as const;

export default function WorkspacePage() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"past" | "future">("past");

  useEffect(() => {
    async function loadData() {
      try {
        const [reposRes, statsRes] = await Promise.all([
          fetch("/api/repositories"),
          fetch("/api/memories/stats"),
        ]);

        if (!reposRes.ok || !statsRes.ok) {
          throw new Error(
            `Memory backend returned ${!reposRes.ok ? reposRes.status : statsRes.status}`,
          );
        }

        const reposData = await reposRes.json();
        const statsData = await statsRes.json();

        setRepositories(reposData.repositories || []);
        setStats(statsData);
      } catch (error) {
        setBackendError(
          error instanceof Error ? error.message : "Memory backend unreachable",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const timeline = groupByMonth(repositories, (r) => r.lastSessionAt);
  const lastAgent = repositories.find((r) => r.lastAgentId)?.lastAgentId;

  return (
    <Frame>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ══════════════ LEFT — navigation + activity timeline ══════════════ */}
        <aside className="flex flex-col gap-5 lg:col-span-3">
          <Panel className="flex flex-col gap-3 p-4">
            <PillLink href="/#setup" className="justify-between px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest">
                New session
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </PillLink>

            <nav className="flex flex-col gap-2 pt-1">
              <PillLink href="/">
                <Home className="h-4 w-4 text-muted" />
                <span>Home</span>
              </PillLink>
              <PillLink href="/search">
                <Search className="h-4 w-4 text-muted" />
                <span>Search</span>
              </PillLink>
              <PillLink href="/#setup">
                <Layers className="h-4 w-4 text-muted" />
                <span>Integrations</span>
              </PillLink>
            </nav>
          </Panel>

          <Panel className="flex flex-1 flex-col gap-6 p-5">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : timeline.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted">
                No sessions recorded yet. Activity appears here once an agent calls{" "}
                <code className="font-mono text-[11px] text-ink">atlas_start_session</code>.
              </p>
            ) : (
              timeline.map((bucket) => (
                <div key={bucket.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-stroke-soft pb-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                      <AccentDot />
                      {bucket.month}
                    </span>
                    <span className="font-mono text-[10px] text-muted-soft">
                      {bucket.year}
                    </span>
                  </div>
                  {bucket.items.map((repo) => (
                    <Link
                      key={repo.id}
                      href={`/repo/${repo.id}`}
                      className="group flex flex-col gap-1"
                    >
                      <span className="text-xs font-medium leading-relaxed text-ink-soft transition-colors group-hover:text-ink">
                        {repo.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-soft">
                        {repo.sessionCount} sessions ·{" "}
                        {repo.lastSessionAt
                          ? formatRelativeTime(repo.lastSessionAt)
                          : "never"}
                      </span>
                    </Link>
                  ))}
                </div>
              ))
            )}
          </Panel>
        </aside>

        {/* ══════════════ CENTER — prompt canvas + starters ══════════════ */}
        <main className="flex flex-col gap-5 lg:col-span-6">
          <Panel className="flex min-h-[220px] flex-col justify-between p-6 md:p-8">
            <BrandMark />

            <form
              className="mt-6 flex items-center justify-between gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(query);
              }}
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search memories"
                  className="w-full border-none bg-transparent font-display text-3xl tracking-tight text-ink outline-none md:text-4xl"
                />
                {query.length === 0 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center font-display text-3xl tracking-tight text-ink md:text-4xl"
                  >
                    Ask a Question
                    <span className="caret" />
                  </span>
                )}
              </div>
              <AccentButton type="submit" disabled={!query.trim()} aria-label="Search">
                <Zap className="h-5 w-5 fill-current" />
              </AccentButton>
            </form>
          </Panel>

          <Panel className="flex flex-1 flex-col gap-6 p-6 md:p-8">
            <Display className="text-2xl md:text-3xl">Get Started</Display>

            <div
              role="tablist"
              aria-label="Starter query direction"
              className="grid grid-cols-2 gap-1 rounded-full border border-stroke bg-raised p-1"
            >
              {(["past", "future"] as const).map((tab) => {
                const active = activeTab === tab;
                const Icon = tab === "past" ? RotateCcw : ArrowRight;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center justify-center gap-2 rounded-full py-3 text-xs font-bold uppercase tracking-wider transition ${
                      active
                        ? "bg-ink text-canvas"
                        : "text-muted-soft hover:text-ink-soft"
                    }`}
                  >
                    {tab === "past" && <Icon className="h-3.5 w-3.5" />}
                    {tab}
                    {tab === "future" && <Icon className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto grid grid-cols-1 gap-4 md:grid-cols-3">
              {SUGGESTIONS[activeTab].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.query}
                    onClick={() => runSearch(s.query)}
                    className="group flex flex-col justify-between gap-6 rounded-2xl border border-stroke bg-raised p-4 text-left transition-colors hover:border-muted-soft"
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-stroke bg-surface">
                        <Icon className="h-4 w-4 text-muted" />
                      </span>
                      {"badge" in s && s.badge && (
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-accent">
                          {s.badge}
                        </span>
                      )}
                    </span>
                    <span className="text-xs leading-relaxed text-ink-soft group-hover:text-ink">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </main>

        {/* ══════════════ RIGHT — identity + memory telemetry ══════════════ */}
        <aside className="flex flex-col gap-5 lg:col-span-3">
          <Panel className="flex h-full flex-col justify-between p-5">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-stroke-soft pb-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-stroke bg-raised">
                  <Database className="h-4 w-4 text-muted" />
                </span>
                <span className="flex flex-col">
                  <span className="text-xs font-semibold text-ink">{greeting()},</span>
                  <span className="font-mono text-[11px] text-muted">
                    {lastAgent ?? "no agent yet"}
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <MetaLabel className="text-ink">Insights</MetaLabel>
                  {stats && stats.openTasks > 0 && <AccentDot />}
                </div>

                {loading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : backendError ? (
                  <Card className="flex flex-col gap-2 border-accent/30 bg-accent/5 p-4">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-accent" />
                      <MetaLabel className="text-accent">Backend down</MetaLabel>
                    </span>
                    <p className="text-xs leading-snug text-ink-soft">{backendError}</p>
                    <p className="text-[11px] leading-snug text-muted">
                      Memory is still on disk — the UI just can&apos;t read it. Check{" "}
                      <code className="font-mono">DATABASE_URL</code> and the Prisma
                      client.
                    </p>
                  </Card>
                ) : (
                  <>
                    <Insight
                      icon={<Boxes className="h-4 w-4 text-muted-soft" />}
                      label="Repositories tracked"
                      body={`${stats?.repositories ?? 0} ${
                        (stats?.repositories ?? 0) === 1 ? "repository has" : "repositories have"
                      } accumulated context that survives agent restarts.`}
                    />
                    <Insight
                      icon={<Clock className="h-4 w-4 text-muted-soft" />}
                      label="Sessions recorded"
                      body={`${stats?.sessions ?? 0} coding sessions, each with its own timeline of memories and decisions.`}
                    />
                    <Insight
                      icon={<ScrollText className="h-4 w-4 text-muted-soft" />}
                      label="Memory units"
                      body={`${stats?.memories ?? 0} facts stored. Anything at importance 3 or above is also embedded for semantic recall.`}
                    />
                    <Insight
                      icon={<ListTodo className="h-4 w-4 text-muted-soft" />}
                      label="Still open"
                      body={`${stats?.openTasks ?? 0} unresolved TODO and BUG memories are waiting on the next agent.`}
                      accent={(stats?.openTasks ?? 0) > 0}
                    />
                  </>
                )}
              </div>
            </div>

            <a
              href="https://github.com/greyw0rks/atlas"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-stroke bg-raised py-2.5 text-xs font-medium transition-colors hover:bg-surface"
            >
              <span>Repository</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
            </a>
          </Panel>
        </aside>
      </div>
    </Frame>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Insight({
  icon,
  label,
  body,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span className="flex flex-col gap-1">
        <MetaLabel className={accent ? "text-accent" : undefined}>{label}</MetaLabel>
        <span className="text-xs leading-snug text-ink-soft">{body}</span>
      </span>
    </div>
  );
}
