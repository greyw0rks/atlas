"use client";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#E8E6E1] text-[#2A2A2A]">
      {/* Header */}
      <header className="border-b border-[#D1CFC8] bg-[#F5F4F0]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2A2A2A] rounded-2xl flex items-center justify-center">
                <span className="text-[#E8E6E1] font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#2A2A2A]">Atlas</h1>
                <p className="text-xs text-[#6B6B6B]">Memory for Coding Agents</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/greyw0rks/atlas-2"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-white hover:bg-[#F5F4F0] border border-[#D1CFC8] rounded-full text-sm font-medium transition-all shadow-sm"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-block px-4 py-2 bg-white border border-[#D1CFC8] rounded-full text-xs text-[#6B6B6B] mb-6 shadow-sm">
              Built for CockroachDB × AWS Agentic Memory Challenge
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-[#2A2A2A]">
              Your AI can write code.
              <br />
              <span className="text-[#6B6B6B]">Atlas makes it remember why.</span>
            </h1>

            <p className="text-lg text-[#6B6B6B] mb-8">
              Atlas is an MCP memory agent that gives Claude Code and Codex persistent memory.
              It remembers decisions, tracks tasks, and hands off context between sessions.
            </p>

            <div className="flex items-center gap-3 mb-12">
              <a
                href="#setup"
                className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#1A1A1A] text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </a>
              <a
                href="https://github.com/greyw0rks/atlas-2"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white hover:bg-[#F5F4F0] border border-[#D1CFC8] rounded-full font-medium transition-all shadow-sm"
              >
                View on GitHub
              </a>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="px-4 py-2 bg-white border border-[#D1CFC8] rounded-full shadow-sm">
                <span className="text-xs text-[#6B6B6B]">Vector Search</span>
                <span className="ml-2 text-sm font-semibold text-[#2A2A2A]">CockroachDB</span>
              </div>
              <div className="px-4 py-2 bg-white border border-[#D1CFC8] rounded-full shadow-sm">
                <span className="text-xs text-[#6B6B6B]">Embeddings</span>
                <span className="ml-2 text-sm font-semibold text-[#2A2A2A]">AWS Bedrock</span>
              </div>
              <div className="px-4 py-2 bg-white border border-[#D1CFC8] rounded-full shadow-sm">
                <span className="text-xs text-[#6B6B6B]">Protocol</span>
                <span className="ml-2 text-sm font-semibold text-[#2A2A2A]">MCP</span>
              </div>
            </div>
          </div>

          {/* Right: Demo Visual */}
          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-6 shadow-lg">
            <div className="aspect-video bg-[#F5F4F0] rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#2A2A2A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-[#E8E6E1]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-[#6B6B6B] text-sm">Demo video coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Atlas */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-[#D1CFC8]">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-[#2A2A2A]">What is Atlas?</h2>
          <p className="text-[#6B6B6B] text-lg max-w-3xl mx-auto">
            Atlas is an MCP (Model Context Protocol) server that runs alongside Claude Code or Codex.
            It captures decisions, tracks tasks, and provides persistent memory across sessions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-[#F5F4F0] rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🧠</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">Persistent Memory</h3>
                <p className="text-[#6B6B6B]">
                  Remembers decisions, architecture, bugs, and TODOs across sessions.
                  Your agent knows what happened last time.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-[#F5F4F0] rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🔍</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">Semantic Search</h3>
                <p className="text-[#6B6B6B]">
                  Vector kNN search powered by AWS Bedrock Titan Embeddings v2.
                  Find relevant memories from natural language queries.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-[#F5F4F0] rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🔄</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">Session Handoffs</h3>
                <p className="text-[#6B6B6B]">
                  Generates structured handoff documents at session end.
                  Switch between Claude Code and Codex without losing context.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-[#F5F4F0] rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">⚡</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">Auto-Extraction</h3>
                <p className="text-[#6B6B6B]">
                  Parses git commits to auto-generate memories.
                  &quot;fix:&quot; → BUG, &quot;breaking:&quot; → DECISION.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Instructions */}
      <section id="setup" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#D1CFC8]">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-[#2A2A2A]">Setup Atlas MCP Server</h2>
          <p className="text-[#6B6B6B] text-lg">
            Follow these steps to connect Atlas to Claude Code or Codex
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-[#2A2A2A]">Clone and Install</h3>
                <div className="bg-[#F5F4F0] border border-[#D1CFC8] rounded-2xl p-5 font-mono text-sm overflow-x-auto">
                  <div className="text-[#6B6B6B] mb-2"># Clone the repository</div>
                  <div className="text-[#2A2A2A]">git clone https://github.com/greyw0rks/atlas-2.git</div>
                  <div className="text-[#2A2A2A]">cd atlas-2</div>
                  <div className="text-[#6B6B6B] mt-4 mb-2"># Install dependencies</div>
                  <div className="text-[#2A2A2A]">npm install</div>
                  <div className="text-[#6B6B6B] mt-4 mb-2"># Build the MCP server</div>
                  <div className="text-[#2A2A2A]">cd mcp-server && npm run build</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-[#2A2A2A]">Set Environment Variables</h3>
                <p className="text-[#6B6B6B] mb-4">Create a <code className="px-3 py-1 bg-[#F5F4F0] rounded-full text-sm text-[#2A2A2A] border border-[#D1CFC8]">.env</code> file in the project root:</p>
                <div className="bg-[#F5F4F0] border border-[#D1CFC8] rounded-2xl p-5 font-mono text-sm overflow-x-auto">
                  <div className="text-[#6B6B6B] mb-2"># CockroachDB connection string</div>
                  <div className="text-[#2A2A2A]">DATABASE_URL=&quot;postgresql://user:password@cluster.cockroachlabs.cloud:26257/defaultdb?sslmode=require&quot;</div>
                  <div className="text-[#6B6B6B] mt-4 mb-2"># AWS Bedrock (for embeddings)</div>
                  <div className="text-[#2A2A2A]">AWS_REGION=&quot;us-east-1&quot;</div>
                  <div className="text-[#2A2A2A]">AWS_ACCESS_KEY_ID=&quot;your-key&quot;</div>
                  <div className="text-[#2A2A2A]">AWS_SECRET_ACCESS_KEY=&quot;your-secret&quot;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-[#2A2A2A]">Initialize Database</h3>
                <div className="bg-[#F5F4F0] border border-[#D1CFC8] rounded-2xl p-5 font-mono text-sm overflow-x-auto">
                  <div className="text-[#6B6B6B] mb-2"># Push schema to CockroachDB</div>
                  <div className="text-[#2A2A2A]">npx prisma db push</div>
                  <div className="text-[#6B6B6B] mt-4 mb-2"># Generate Prisma Client</div>
                  <div className="text-[#2A2A2A]">npx prisma generate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-[#2A2A2A]">Configure Claude Code</h3>
                <p className="text-[#6B6B6B] mb-4">Add Atlas to your Claude Code settings at <code className="px-3 py-1 bg-[#F5F4F0] rounded-full text-sm text-[#2A2A2A] border border-[#D1CFC8]">~/.config/claude-code/settings.json</code>:</p>
                <div className="bg-[#F5F4F0] border border-[#D1CFC8] rounded-2xl p-5 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#2A2A2A]">{`{
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
          <div className="bg-[#F5F4F0] border-2 border-[#2A2A2A] rounded-3xl p-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-4 text-[#2A2A2A]">Start Using Atlas</h3>
                <p className="text-[#6B6B6B] mb-6">Atlas is now connected! Use these MCP tools in Claude Code:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white border border-[#D1CFC8] rounded-2xl p-4">
                    <code className="text-[#2A2A2A] text-sm font-semibold">atlas_start_session</code>
                    <p className="text-xs text-[#6B6B6B] mt-2">Begin a coding session</p>
                  </div>
                  <div className="bg-white border border-[#D1CFC8] rounded-2xl p-4">
                    <code className="text-[#2A2A2A] text-sm font-semibold">atlas_save_memory</code>
                    <p className="text-xs text-[#6B6B6B] mt-2">Save a memory or decision</p>
                  </div>
                  <div className="bg-white border border-[#D1CFC8] rounded-2xl p-4">
                    <code className="text-[#2A2A2A] text-sm font-semibold">atlas_search_memory</code>
                    <p className="text-xs text-[#6B6B6B] mt-2">Semantic memory search</p>
                  </div>
                  <div className="bg-white border border-[#D1CFC8] rounded-2xl p-4">
                    <code className="text-[#2A2A2A] text-sm font-semibold">atlas_end_session</code>
                    <p className="text-xs text-[#6B6B6B] mt-2">End session + write .atlas/ files</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MCP Tools Reference */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-[#D1CFC8]">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-[#2A2A2A]">Available MCP Tools</h2>
          <p className="text-[#6B6B6B] text-lg">
            12 tools for managing persistent memory across coding sessions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_start_session</h4>
            <p className="text-sm text-[#6B6B6B]">Start a new coding session, load repository context, last session summary, and open tasks</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_get_repository_context</h4>
            <p className="text-sm text-[#6B6B6B]">Get architecture, tech stack, important files, and constraints without starting a session</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_save_memory</h4>
            <p className="text-sm text-[#6B6B6B]">Save a memory (ARCHITECTURE, DECISION, BUG, TODO, WARNING, etc.)</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_record_decision</h4>
            <p className="text-sm text-[#6B6B6B]">Record architectural decisions with rationale and alternatives considered</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_search_memory</h4>
            <p className="text-sm text-[#6B6B6B]">Semantic search using vector kNN with AWS Bedrock embeddings</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_scan_repository</h4>
            <p className="text-sm text-[#6B6B6B]">Auto-discover tech stack from package.json, requirements.txt, go.mod, Cargo.toml</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_extract_git_memories</h4>
            <p className="text-sm text-[#6B6B6B]">Auto-extract memories from git commit messages (fix:, feat:, breaking:, security:)</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_create_handoff</h4>
            <p className="text-sm text-[#6B6B6B]">Generate structured handoff document for the next agent</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_end_session</h4>
            <p className="text-sm text-[#6B6B6B]">End session, write summary, and create .atlas/ portable projection files</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_get_open_tasks</h4>
            <p className="text-sm text-[#6B6B6B]">Get all unresolved TODO and BUG memories for a repository</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_get_recent_sessions</h4>
            <p className="text-sm text-[#6B6B6B]">Get recent coding sessions with summaries and memory counts</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="font-mono text-sm text-[#2A2A2A] font-semibold mb-2">atlas_update_context</h4>
            <p className="text-sm text-[#6B6B6B]">Update repository architecture, constraints, tech stack, or important files</p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-[#D1CFC8]">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-[#2A2A2A]">Built With</h2>
          <p className="text-[#6B6B6B] text-lg">
            Production-ready infrastructure for agentic memory
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">🦗</div>
            <h4 className="font-bold text-lg mb-2 text-[#2A2A2A]">CockroachDB</h4>
            <p className="text-sm text-[#6B6B6B]">VECTOR(1024) + Distributed SQL</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">☁️</div>
            <h4 className="font-bold text-lg mb-2 text-[#2A2A2A]">AWS Bedrock</h4>
            <p className="text-sm text-[#6B6B6B]">Titan Embeddings v2</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">🔌</div>
            <h4 className="font-bold text-lg mb-2 text-[#2A2A2A]">MCP Protocol</h4>
            <p className="text-sm text-[#6B6B6B]">Claude Code / Codex</p>
          </div>

          <div className="bg-white border border-[#D1CFC8] rounded-3xl p-8 text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h4 className="font-bold text-lg mb-2 text-[#2A2A2A]">Prisma ORM</h4>
            <p className="text-sm text-[#6B6B6B]">Type-safe queries</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D1CFC8] py-8 bg-[#F5F4F0]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#6B6B6B]">
            <div>Built for the CockroachDB × AWS Agentic Memory Challenge</div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/greyw0rks/atlas-2" target="_blank" rel="noopener noreferrer" className="hover:text-[#2A2A2A] transition-colors">
                GitHub
              </a>
              <a href="https://github.com/greyw0rks/atlas-2/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-[#2A2A2A] transition-colors">
                Documentation
              </a>
              <a href="#setup" className="hover:text-[#2A2A2A] transition-colors">
                Setup Guide
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
