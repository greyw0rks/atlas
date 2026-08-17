"use client";

import { useState } from "react";
import Link from "next/link";

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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [filterKind, setFilterKind] = useState<string>("all");

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ query, limit: "50" });
      if (filterKind !== "all") {
        params.append("kind", filterKind);
      }

      const res = await fetch(`/api/memories/search?${params}`);
      const data = await res.json();

      setResults(data.results || []);
      setLatency(data.latencyMs);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const kinds = [
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
                <h1 className="text-xl font-bold">Memory Search</h1>
                <p className="text-xs text-[#64748B]">
                  Semantic search across all memories
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search memories... (e.g., 'authentication bug', 'database decision')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full px-4 py-3 bg-[#0F131C] border border-[#1E2636] rounded-xl text-[#E8E9F3] placeholder-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              className="px-4 py-3 bg-[#0F131C] border border-[#1E2636] rounded-xl text-[#E8E9F3] focus:border-[#8B5CF6] focus:outline-none"
            >
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kind === "all" ? "All Types" : kind}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-[#64748B] text-white rounded-xl font-semibold transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {latency !== null && (
            <div className="text-xs text-[#64748B]">
              Found {results.length} results in {latency}ms
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-5 hover:border-[#8B5CF6]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2 py-1 rounded text-xs font-mono ${getKindColor(
                        result.kind
                      )}`}
                    >
                      {result.kind}
                    </div>
                    {result.importance >= 3 && (
                      <div className="text-xs text-[#F59E0B]">
                        {"★".repeat(result.importance)}
                      </div>
                    )}
                    {result.resolved && (
                      <div className="text-xs text-[#10B981]">✓ Resolved</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-[#64748B]">
                      {Math.round(result.similarity * 100)}% match
                    </div>
                    <div
                      className="h-2 rounded-full bg-[#05070C]"
                      style={{ width: "60px" }}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9]"
                        style={{ width: `${result.similarity * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-sm mb-3">{result.content}</div>

                <div className="flex items-center gap-3 text-xs text-[#64748B]">
                  <span className="text-[#8B5CF6]">{result.repoName}</span>
                  <span>•</span>
                  <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                  {result.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{result.tags.join(", ")}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : query && !loading ? (
          <div className="text-center py-20">
            <div className="text-[#64748B] mb-2">No memories found</div>
            <div className="text-sm text-[#64748B]">
              Try a different search query or filter
            </div>
          </div>
        ) : !query && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#0F131C] rounded-2xl flex items-center justify-center mb-4 border border-[#1E2636]">
              <span className="text-3xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Semantic Memory Search</h2>
            <p className="text-[#64748B] max-w-md mb-6">
              Search uses vector embeddings to find memories by meaning, not just keywords.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4 text-left">
                <div className="text-sm font-semibold mb-2 text-[#8B5CF6]">
                  Example queries
                </div>
                <ul className="text-xs text-[#64748B] space-y-1">
                  <li>• &quot;authentication bug&quot;</li>
                  <li>• &quot;database performance decision&quot;</li>
                  <li>• &quot;security vulnerability&quot;</li>
                  <li>• &quot;why we chose React&quot;</li>
                </ul>
              </div>
              <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4 text-left">
                <div className="text-sm font-semibold mb-2 text-[#8B5CF6]">
                  How it works
                </div>
                <ul className="text-xs text-[#64748B] space-y-1">
                  <li>• Embeddings via AWS Bedrock Titan</li>
                  <li>• 1024-dimensional vectors</li>
                  <li>• Cosine similarity ranking</li>
                  <li>• CockroachDB vector indexing</li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
          </div>
        )}
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
