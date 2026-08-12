"use client";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05070C] text-[#E8E9F3]">
      {/* Header */}
      <header className="border-b border-[#1E2636] bg-[#0A0D12]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Atlas</h1>
                <p className="text-xs text-[#64748B]">Memory Agent for Claude Code & Codex</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/greyw0rks/atlas-2"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#0F131C] hover:bg-[#161D2B] border border-[#1E2636] rounded-lg text-sm font-medium transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-4 py-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full text-sm text-[#8B5CF6] mb-8">
          Built for CockroachDB × AWS Agentic Memory Challenge
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Your AI can write code.
          <br />
          <span className="text-[#8B5CF6]">Atlas makes it remember why.</span>
        </h1>

        <p className="text-xl text-[#94A3B8] max-w-3xl mx-auto mb-12">
          Atlas is an MCP memory agent that gives Claude Code and Codex persistent memory.
          It remembers decisions, tracks tasks, and hands off context between sessions.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <a
            href="#setup"
            className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            Get Started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
          <a
            href="https://github.com/greyw0rks/atlas-2"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[#0F131C] hover:bg-[#161D2B] border border-[#1E2636] rounded-lg font-medium transition-colors"
          >
            View on GitHub
          </a>
        </div>

        {/* Demo Video Placeholder */}
        <div className="bg-[#0F131C] border border-[#1E2636] rounded-2xl p-2 max-w-5xl mx-auto">
          <div className="aspect-video bg-[#05070C] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[#8B5CF6]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-[#64748B]">Demo video coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* What is Atlas */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-[#1E2636]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">What is Atlas?</h2>
          <p className="text-[#94A3B8] text-lg max-w-3xl mx-auto">
            Atlas is an MCP (Model Context Protocol) server that runs alongside Claude Code or Codex.
            It captures decisions, tracks tasks, and provides persistent memory across sessions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🧠</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Persistent Memory</h3>
                <p className="text-[#94A3B8]">
                  Remembers decisions, architecture, bugs, and TODOs across sessions.
                  Your agent knows what happened last time.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Semantic Search</h3>
                <p className="text-[#94A3B8]">
                  Vector kNN search powered by AWS Bedrock Titan Embeddings v2.
                  Find relevant memories from natural language queries.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#38BDF8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Session Handoffs</h3>
                <p className="text-[#94A3B8]">
                  Generates structured handoff documents at session end.
                  Switch between Claude Code and Codex without losing context.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Auto-Extraction</h3>
                <p className="text-[#94A3B8]">
                  Parses git commits to auto-generate memories.
                  &quot;fix:&quot; → BUG, &quot;breaking:&quot; → DECISION.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Instructions */}
      <section id="setup" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#1E2636]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Setup Atlas MCP Server</h2>
          <p className="text-[#94A3B8] text-lg">
            Follow these steps to connect Atlas to Claude Code or Codex
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">Clone and Install</h3>
                <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-4 font-mono text-sm mb-3 overflow-x-auto">
                  <div className="text-[#64748B] mb-1"># Clone the repository</div>
                  <div className="text-[#E8E9F3]">git clone https://github.com/greyw0rks/atlas-2.git</div>
                  <div className="text-[#E8E9F3]">cd atlas-2</div>
                  <div className="text-[#64748B] mt-3 mb-1"># Install dependencies</div>
                  <div className="text-[#E8E9F3]">npm install</div>
                  <div className="text-[#64748B] mt-3 mb-1"># Build the MCP server</div>
                  <div className="text-[#E8E9F3]">cd mcp-server && npm run build</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">Set Environment Variables</h3>
                <p className="text-[#94A3B8] mb-3">Create a <code className="px-2 py-1 bg-[#05070C] rounded text-[#8B5CF6]">.env</code> file in the project root:</p>
                <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-[#64748B] mb-1"># CockroachDB connection string</div>
                  <div className="text-[#E8E9F3]">DATABASE_URL=&quot;postgresql://user:password@cluster.cockroachlabs.cloud:26257/defaultdb?sslmode=require&quot;</div>
                  <div className="text-[#64748B] mt-3 mb-1"># AWS Bedrock (for embeddings)</div>
                  <div className="text-[#E8E9F3]">AWS_REGION=&quot;us-east-1&quot;</div>
                  <div className="text-[#E8E9F3]">AWS_ACCESS_KEY_ID=&quot;your-key&quot;</div>
                  <div className="text-[#E8E9F3]">AWS_SECRET_ACCESS_KEY=&quot;your-secret&quot;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">Initialize Database</h3>
                <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-4 font-mono text-sm mb-3 overflow-x-auto">
                  <div className="text-[#64748B] mb-1"># Push schema to CockroachDB</div>
                  <div className="text-[#E8E9F3]">npx prisma db push</div>
                  <div className="text-[#64748B] mt-3 mb-1"># Generate Prisma Client</div>
                  <div className="text-[#E8E9F3]">npx prisma generate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">Configure Claude Code</h3>
                <p className="text-[#94A3B8] mb-3">Add Atlas to your Claude Code settings at <code className="px-2 py-1 bg-[#05070C] rounded text-[#8B5CF6]">~/.config/claude-code/settings.json</code>:</p>
                <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#E8E9F3]">{`{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["/absolute/path/to/atlas-2/mcp-server/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "...",
        "AWS_SECRET_ACCESS_KEY": "..."
      }
    }
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#10B981] rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">Start Using Atlas</h3>
                <p className="text-[#94A3B8] mb-4">Atlas is now connected! Use these MCP tools in Claude Code:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-3">
                    <code className="text-[#8B5CF6] text-sm">atlas_start_session</code>
                    <p className="text-xs text-[#64748B] mt-1">Begin a coding session</p>
                  </div>
                  <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-3">
                    <code className="text-[#8B5CF6] text-sm">atlas_save_memory</code>
                    <p className="text-xs text-[#64748B] mt-1">Save a memory or decision</p>
                  </div>
                  <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-3">
                    <code className="text-[#8B5CF6] text-sm">atlas_search_memory</code>
                    <p className="text-xs text-[#64748B] mt-1">Semantic memory search</p>
                  </div>
                  <div className="bg-[#05070C] border border-[#1E2636] rounded-lg p-3">
                    <code className="text-[#8B5CF6] text-sm">atlas_end_session</code>
                    <p className="text-xs text-[#64748B] mt-1">End session + write .atlas/ files</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MCP Tools Reference */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-[#1E2636]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Available MCP Tools</h2>
          <p className="text-[#94A3B8] text-lg">
            12 tools for managing persistent memory across coding sessions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_start_session</h4>
            <p className="text-sm text-[#94A3B8]">Start a new coding session, load repository context, last session summary, and open tasks</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_get_repository_context</h4>
            <p className="text-sm text-[#94A3B8]">Get architecture, tech stack, important files, and constraints without starting a session</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_save_memory</h4>
            <p className="text-sm text-[#94A3B8]">Save a memory (ARCHITECTURE, DECISION, BUG, TODO, WARNING, etc.)</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_record_decision</h4>
            <p className="text-sm text-[#94A3B8]">Record architectural decisions with rationale and alternatives considered</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_search_memory</h4>
            <p className="text-sm text-[#94A3B8]">Semantic search using vector kNN with AWS Bedrock embeddings</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_scan_repository</h4>
            <p className="text-sm text-[#94A3B8]">Auto-discover tech stack from package.json, requirements.txt, go.mod, Cargo.toml</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_extract_git_memories</h4>
            <p className="text-sm text-[#94A3B8]">Auto-extract memories from git commit messages (fix:, feat:, breaking:, security:)</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_create_handoff</h4>
            <p className="text-sm text-[#94A3B8]">Generate structured handoff document for the next agent</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_end_session</h4>
            <p className="text-sm text-[#94A3B8]">End session, write summary, and create .atlas/ portable projection files</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_get_open_tasks</h4>
            <p className="text-sm text-[#94A3B8]">Get all unresolved TODO and BUG memories for a repository</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_get_recent_sessions</h4>
            <p className="text-sm text-[#94A3B8]">Get recent coding sessions with summaries and memory counts</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6">
            <h4 className="font-mono text-sm text-[#8B5CF6] mb-2">atlas_update_context</h4>
            <p className="text-sm text-[#94A3B8]">Update repository architecture, constraints, tech stack, or important files</p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-[#1E2636]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Built With</h2>
          <p className="text-[#94A3B8] text-lg">
            Production-ready infrastructure for agentic memory
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🦗</div>
            <h4 className="font-bold mb-2">CockroachDB</h4>
            <p className="text-sm text-[#64748B]">VECTOR(1024) + Distributed SQL</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">☁️</div>
            <h4 className="font-bold mb-2">AWS Bedrock</h4>
            <p className="text-sm text-[#64748B]">Titan Embeddings v2</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🔌</div>
            <h4 className="font-bold mb-2">MCP Protocol</h4>
            <p className="text-sm text-[#64748B]">Claude Code / Codex</p>
          </div>

          <div className="bg-[#0F131C] border border-[#1E2636] rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-bold mb-2">Prisma ORM</h4>
            <p className="text-sm text-[#64748B]">Type-safe queries</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2636] py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#64748B]">
            <div>Built for the CockroachDB × AWS Agentic Memory Challenge</div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/greyw0rks/atlas-2" target="_blank" rel="noopener noreferrer" className="hover:text-[#8B5CF6] transition-colors">
                GitHub
              </a>
              <a href="https://github.com/greyw0rks/atlas-2/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-[#8B5CF6] transition-colors">
                Documentation
              </a>
              <a href="#setup" className="hover:text-[#8B5CF6] transition-colors">
                Setup Guide
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
