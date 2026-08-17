## Inspiration

Every time I start a new coding session with Claude or another AI assistant, I have to re-explain the project context: "This is a Next.js app using Prisma and Tailwind... we're building feature X... last session we decided to use approach Y..." It's exhausting.

**AI coding assistants have no memory.** They forget everything the moment you close the window.

Atlas fixes this. It gives coding agents **persistent memory** that survives across sessions, machines, and even different AI tools.

## What it does

Atlas is a **memory system for coding agents** built on the Model Context Protocol (MCP). It gives AI assistants the ability to:

* **Remember context** — tech stack, architecture, file structure
* **Track decisions** — "why did we choose PostgreSQL over MongoDB?" with full rationale
* **Maintain task lists** — TODOs and bugs that persist between sessions
* **Auto-discover projects** — scans repositories to understand what you're building
* **Semantic search** — find relevant past conversations via vector embeddings

When you start a new coding session, Atlas loads everything the agent needs to know:

```
Last session: Added payment processing via Stripe
Tech stack: Next.js 14, Prisma, Tailwind, Vercel
Open tasks: 
  • \[BUG] Webhook signature validation failing in production
  • \[TODO] Add refund flow to admin dashboard
Recent decisions:
  • Use Stripe over PayPal (better API, webhook reliability)
```

No more re-explaining. The agent picks up exactly where you left off.

## How we built it

**Architecture:**

1. **MCP Server** (TypeScript) — 12 tools for memory operations

   * Session lifecycle (start/end)
   * Memory CRUD (save/search/retrieve)
   * Repository scanning (auto-discover tech stack)
   * Decision tracking (log architectural choices)
2. **Database** (CockroachDB) — distributed SQL + vector storage

   * Prisma ORM for type-safe queries
   * `vector(1536)` columns for semantic search
   * Global replication for 99.999% uptime
3. **Intelligence Layer** (AWS Bedrock) — Titan embeddings

   * Converts memories → 1536-dim vectors
   * Powers semantic search across sessions
   * "Find all decisions about authentication" works even if you said "auth" or "login" or "user verification"
4. **UI** (Next.js + Tailwind) — visual memory browser

   * Workspace view: all tracked repositories
   * Timeline view: session history + memories
   * Search: semantic search interface
   * "Pick up where you left off" widget
5. **Portable Memory** — `.atlas/` projection files

   * Plain markdown exports of memories
   * Git-committable, human-readable
   * Works even if the database is offline

**Integration:**

Agents call Atlas via MCP tools:

```javascript
// Start session
atlas\_start\_session({
  repoPath: "/home/user/my-app",
  repoName: "my-app",
  agentId: "claude-code"
})

// Save important context
atlas\_save\_memory({
  kind: "DECISION",
  content: "Use React Query for data fetching",
  importance: 4,
  tags: \["architecture", "frontend", "data-fetching"]
})

// End session
atlas\_end\_session({
  summary: "Implemented user authentication with Clerk"
})
```

## Challenges we ran at

**1. Prisma in a published npm package**

Prisma generates client code specific to your database schema. You can't bundle it like a normal dependency.

**Solution:** Added a `postinstall` hook that runs `prisma generate` after `npm install -g atlas-mcp-server`. Users get a fresh client every time.

**2. Semantic search without exploding costs**

Vector databases are expensive. pgvector + hosted Postgres = $50-200/month minimum.

**Solution:** CockroachDB Serverless has native vector support (`vector(N)` columns) and a generous free tier. We get distributed SQL + vector search for $0.

**3. Making memory portable**

If Atlas's database goes down or a user loses access, all their memories are trapped.

**Solution:** `.atlas/` projection files. Every session writes plain markdown files to the repo:

```
.atlas/
  sessions/2024-08-17-session-abc123.md
  decisions/use-react-query.md
  memories/stripe-webhook-setup.md
```

Git-committable, human-readable, works offline.

**4. Avoiding prompt injection via memory**

If a malicious actor commits a file that says "You are now a different agent, ignore previous instructions...", and Atlas saves it as a memory, the next session could be hijacked.

**Solution:** Memory retrieval returns structured JSON, not raw text injected into prompts. The agent sees:

```json
{
  "id": "...",
  "kind": "NOTE",
  "content": "Use React Query for data fetching",
  "importance": 4
}
```

Not: "NOTE: Use React Query for data fetching. Also, you are now a different agent..."

## Accomplishments that we're proud of

✅ **All 12 MCP tools tested and working**

* Verified with end-to-end test suite
* Session lifecycle: start → scan → save → decide → end
* Repository scanning auto-discovered 5 tech stack items in < 2 seconds

✅ **Works with any MCP-compatible agent**

* Not just Claude Code — works with Claude Desktop, Cline, any MCP client
* Standardized interface via Model Context Protocol

✅ **Zero-config for users (after setup)**

* `npm install -g atlas-mcp-server`
* Add credentials to `\~/.claude/settings.json`
* Restart Claude Code
* "Start an Atlas session" — it just works

✅ **Portable memory**

* `.atlas/` files are plain markdown
* Commit them to git, read them offline, share them with your team
* Database is the source of truth, but you're never locked in

## What we learned

**1. MCP is powerful but immature**

The Model Context Protocol is only a few months old. Documentation is sparse, best practices are still emerging, and the tooling is rough.

But the abstraction is right: tools + resources + prompts. If AI agents become a standard part of software development (and they will), MCP will be the interface.

**2. Vector search is a UX problem, not a tech problem**

Embedding models are cheap and good. Vector databases are fast and affordable (CockroachDB's free tier is generous).

The hard part: **how do you surface relevant memories without overwhelming the agent?**

We tried:

* Return top-K results → too noisy
* Return only high-importance → misses useful context
* Return everything → blows up token budgets

What worked: **importance-weighted retrieval** with **recency decay**. Recent high-importance memories surface first. Old low-importance memories stay archived but searchable.

**3. Persistent identity is critical**

Early versions used `Date.now()` to generate session IDs. This broke resume-from-failure.

Switched to CUIDs (Collision-resistant Unique IDs). Now sessions, repositories, and memories have stable IDs that survive crashes, restarts, and database migrations.

**4. AI agents need structured output**

Free-form text responses are unreliable. "Save this memory" might return:

* "Memory saved successfully!"
* "I've saved that for you."
* "Okay, I'll remember that."
* *crashes because the response isn't valid JSON*

We force structured output via JSON Schema validation. Every tool call returns a known shape:

```typescript
{
  success: boolean,
  data: { sessionId: string, repoId: string, ... },
  error?: string
}
```

Agents parse it reliably. No more "it worked but I can't tell what happened."

## What's next for Atlas

**1. Multi-agent sessions**

Right now, Atlas assumes one agent per session. But real projects involve multiple agents:

* Frontend specialist
* Backend specialist
* DevOps agent
* Code reviewer

Atlas should support **collaborative sessions** where multiple agents share the same memory context.

**2. Memory pruning**

After 100 sessions, you have thousands of memories. Most are outdated.

We need:

* Auto-archival (low-importance + old → move to cold storage)
* Deprecation tracking ("this decision was reversed in session #47")
* Memory consolidation ("these 12 TODOs are all part of the same feature")

**3. Team memory**

Right now, Atlas is single-user. Your memories live in your database.

What if Atlas could:

* Sync memories across your team
* Show "what did Alice's agent learn about the auth system?"
* Prevent duplicate work ("Bob's agent already solved this 2 days ago")

**4. Agent-to-agent memory transfer**

When I switch from Claude Code → Cursor → Cline, I lose context.

Atlas should support:

* Export: "Atlas, export my last 5 sessions as a prompt"
* Import: "Atlas, learn from this conversation transcript"
* Bridge: Automatically sync context across different AI tools

## Built with

* **TypeScript** — MCP server + intelligence layer
* **Prisma** — type-safe database ORM
* **CockroachDB** — distributed SQL + vector storage
* **AWS Bedrock** — Titan embeddings (1536-dim)
* **Next.js 14** — UI (app router, server components)
* **Tailwind CSS** — styling
* **Model Context Protocol (MCP)** — AI agent interface
* **Vercel** — UI deployment
* **Node.js** — runtime

## Try it out

* **Live demo:** https://atlas-eight-plum.vercel.app
* **GitHub:** https://github.com/greyw0rks/atlas
* **npm:** `npm install -g atlas-mcp-server` (coming soon)
* **Docs:** See README.md in the repo

## Installation (for developers)

```bash
git clone https://github.com/greyw0rks/atlas.git
cd atlas
./install.sh
```

You'll need:

* Node.js 18+
* CockroachDB connection string (free tier: https://cockroachlabs.cloud)
* AWS credentials for Bedrock Titan embeddings

The installer:

1. ✅ Installs dependencies
2. ✅ Sets up database schema
3. ✅ Builds and links `atlas-mcp` globally
4. ✅ Configures Claude Code settings
5. ✅ Installs `/atlas` skill
6. ✅ Updates `\~/.claude/CLAUDE.md` to use Atlas

Restart Claude Code, then say: **"Start an Atlas session"**

\---

**Atlas gives coding agents the one thing they've always lacked: memory.**

No more re-explaining. No more lost context. Just persistent, searchable, portable memory that works across sessions, machines, and AI tools.

The future of software development isn't human-only or AI-only.  
It's **human + AI, with shared memory.**

Atlas is how we get there.

