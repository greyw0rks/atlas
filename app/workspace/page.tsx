"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function Home() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reposRes, statsRes] = await Promise.all([
          fetch("/api/repositories"),
          fetch("/api/memories/stats"),
        ]);

        const reposData = await reposRes.json();
        const statsData = await statsRes.json();

        setRepositories(reposData.repositories || []);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#05070C] text-[#E8E9F3]">
      {/* Header */}
      <header className="border-b border-[#1E2636] bg-[#0A0D12]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Atlas</h1>
                <p className="text-xs text-[#64748B]">Persistent Memory for Coding Agents</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/search" className="text-sm text-[#8B5CF6] hover:text-[#A78BFA] transition-colors">
                Search Memories
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4">
              <div className="text-xs text-[#64748B] uppercase mb-1">Repositories</div>
              <div className="text-3xl font-bold">{stats.repositories}</div>
            </div>
            <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4">
              <div className="text-xs text-[#64748B] uppercase mb-1">Sessions</div>
              <div className="text-3xl font-bold">{stats.sessions}</div>
            </div>
            <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4">
              <div className="text-xs text-[#64748B] uppercase mb-1">Memories</div>
              <div className="text-3xl font-bold">{stats.memories}</div>
            </div>
            <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-4">
              <div className="text-xs text-[#64748B] uppercase mb-1">Open Tasks</div>
              <div className="text-3xl font-bold text-[#F59E0B]">{stats.openTasks}</div>
            </div>
          </div>
        )}

        {/* Repositories Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
          </div>
        ) : repositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#0F131C] rounded-2xl flex items-center justify-center mb-4 border border-[#1E2636]">
              <span className="text-3xl">🧠</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">No repositories yet</h2>
            <p className="text-[#64748B] max-w-md mb-6">
              Atlas tracks coding sessions across repositories. Start a session via the MCP server to begin building memory.
            </p>
            <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 text-left max-w-2xl">
              <div className="text-sm font-semibold mb-3">MCP Server Setup</div>
              <pre className="text-xs text-[#64748B] font-mono bg-[#05070C] p-4 rounded-lg overflow-x-auto">
{`{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["/path/to/atlas-2/mcp-server/dist/index.js"]
    }
  }
}`}</pre>
              <div className="text-xs text-[#64748B] mt-3">
                Add this to your Claude Code settings to enable Atlas memory.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Your Repositories</h2>
              <div className="text-sm text-[#64748B]">{repositories.length} repositories</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/repo/${repo.id}`}
                  className="block bg-[#0F131C] border border-[#1E2636] rounded-xl p-5 hover:border-[#8B5CF6] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold truncate group-hover:text-[#8B5CF6] transition-colors">
                        {repo.name}
                      </h3>
                      <p className="text-xs text-[#64748B] truncate font-mono mt-1">
                        {repo.path.replace(/^\/home\/[^/]+\//, "~/")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-[#64748B]">Sessions</div>
                      <div className="text-lg font-bold">{repo.sessionCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#64748B]">Open Tasks</div>
                      <div className="text-lg font-bold text-[#F59E0B]">
                        {repo.openTaskCount}
                      </div>
                    </div>
                  </div>

                  {repo.lastSessionAt && (
                    <div className="pt-3 border-t border-[#1E2636]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64748B]">Last session</span>
                        <span className="text-[#64748B]">
                          {formatRelativeTime(repo.lastSessionAt)}
                        </span>
                      </div>
                      {repo.lastAgentId && (
                        <div className="text-xs text-[#8B5CF6] mt-1">
                          {repo.lastAgentId}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
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
