"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Zap, Search as SearchIcon, AlertTriangle } from "lucide-react";
import {
  Frame,
  Panel,
  Card,
  PillLink,
  AccentButton,
  MetaLabel,
  BrandMark,
  KindBadge,
  Importance,
  Spinner,
  EmptyState,
} from "@/components/atlas/ui";

interface SearchResult {
  id: string;
  kind: string;
  content: string;
  importance: number;
  tags: string[];
  resolved: boolean;
  createdAt: string;
  repoName: string;
  similarity: number;
}

const KINDS = [
  "all",
  "ARCHITECTURE",
  "DECISION",
  "BUG",
  "TODO",
  "WARNING",
  "IMPORTANT_FILE",
  "DEPENDENCY",
  "SECURITY",
  "CONTEXT",
];

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <Frame>
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        </Frame>
      }
    >
      <SearchView />
    </Suspense>
  );
}

function SearchView() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState("all");
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string, kind: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({ query: q, limit: "50" });
      if (kind !== "all") params.append("kind", kind);

      const res = await fetch(`/api/memories/search?${params}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // The route returns the real reason (bad credentials, model not enabled,
        // database unreachable) — show it rather than a bare status code.
        throw new Error(
          data?.error ?? `Search failed with status ${res.status}`,
        );
      }

      setResults(data.results || []);
      setLatency(data.latencyMs ?? null);
    } catch (e) {
      setResults([]);
      setLatency(null);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Run immediately when arriving from the workspace hero with ?q=
  useEffect(() => {
    if (initialQuery) runSearch(initialQuery, "all");
  }, [initialQuery, runSearch]);

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

          <form
            className="flex items-center justify-between gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query, filterKind);
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
                  Search memory
                  <span className="caret" />
                </span>
              )}
            </div>
            <AccentButton type="submit" disabled={loading || !query.trim()} aria-label="Search">
              <Zap className="h-5 w-5 fill-current" />
            </AccentButton>
          </form>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-stroke-soft pt-5">
            {KINDS.map((kind) => {
              const active = filterKind === kind;
              return (
                <button
                  key={kind}
                  onClick={() => {
                    setFilterKind(kind);
                    if (searched) runSearch(query, kind);
                  }}
                  className={`rounded-full border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? "border-ink bg-ink text-canvas"
                      : "border-stroke bg-raised text-muted hover:text-ink"
                  }`}
                >
                  {kind === "all" ? "All types" : kind.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>

          {latency !== null && !loading && (
            <MetaLabel>
              {results.length} {results.length === 1 ? "match" : "matches"} · {latency}ms
            </MetaLabel>
          )}
        </Panel>

        {loading ? (
          <Panel className="flex justify-center py-20">
            <Spinner />
          </Panel>
        ) : error ? (
          <Panel className="p-6 md:p-8">
            <Card className="flex flex-col gap-2 border-accent/30 bg-accent/5 p-5">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <MetaLabel className="text-accent">Search unavailable</MetaLabel>
              </span>
              <p className="text-xs leading-relaxed text-ink-soft">{error}</p>
            </Card>
          </Panel>
        ) : results.length > 0 ? (
          <Panel className="flex flex-col gap-3 p-6 md:p-8">
            {results.map((result) => (
              <Card key={result.id} className="p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <KindBadge kind={result.kind} />
                    <Importance value={result.importance} />
                    {result.resolved && <MetaLabel>Resolved</MetaLabel>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="font-mono text-[10px] text-muted">
                      {Math.round(result.similarity * 100)}%
                    </span>
                    <span className="h-1 w-14 overflow-hidden rounded-full bg-stroke">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(0, Math.min(1, result.similarity)) * 100}%` }}
                      />
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-ink">{result.content}</p>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="text-ink-soft">{result.repoName}</span>
                  <span>·</span>
                  <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                  {result.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{result.tags.join(", ")}</span>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </Panel>
        ) : searched ? (
          <Panel>
            <EmptyState
              icon={<SearchIcon className="h-5 w-5" />}
              title="Nothing matched"
              body="Semantic search only sees memories that were embedded — anything saved below importance 3 is stored but never vectorised."
            />
          </Panel>
        ) : (
          <Panel>
            <EmptyState
              icon={<SearchIcon className="h-5 w-5" />}
              title="Search by meaning"
              body="Queries are embedded with Titan v2 and ranked by cosine distance, so 'auth' finds memories that only ever said 'login' or 'user verification'."
            >
              <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
                <Card className="p-4">
                  <MetaLabel className="text-ink">Try asking</MetaLabel>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    <li>why we chose this database</li>
                    <li>how authentication works</li>
                    <li>unresolved security concern</li>
                    <li>what broke in production</li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <MetaLabel className="text-ink">How it ranks</MetaLabel>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    <li>AWS Bedrock Titan Embeddings v2</li>
                    <li>1024-dimensional vectors</li>
                    <li>Cosine distance, nearest first</li>
                    <li>Stored in CockroachDB</li>
                  </ul>
                </Card>
              </div>
            </EmptyState>
          </Panel>
        )}
      </div>
    </Frame>
  );
}
