# Atlas 2.0 — Demo Script
**Duration:** 3-4 minutes  
**Target:** CockroachDB × AWS Agentic Memory Challenge judges

---

## Opening (15 seconds)

**Visual:** Landing page at https://atlas-eight-plum.vercel.app

**Script:**
> "Atlas gives coding agents a memory. Your AI can write code — Atlas makes it remember why.
> 
> Atlas is a persistent, repository-aware memory infrastructure built on CockroachDB and AWS Bedrock. Let me show you how it works."

---

## Section 1: MCP Tools in Claude Code (60 seconds)

**Visual:** Terminal with Claude Code open

**Script:**
> "Atlas integrates with coding agents through the Model Context Protocol. Here's a full session lifecycle:
> 
> First, we start a session for a repository."

**Action:** Call MCP tool

```
atlas_start_session(
  repoPath="/home/user/atlas-2",
  repoName="Atlas",
  agentId="claude-code"
)
```

**Script:**
> "Atlas detects the repository and loads relevant context — last session summary, open tasks, and key decisions.
>
> Next, we scan the repository to auto-discover the tech stack and architecture."

**Action:** Call MCP tool

```
atlas_scan_repository(
  repoPath="/home/user/atlas-2",
  repoId="<session-repo-id>"
)
```

**Script:**
> "It found Next.js, TypeScript, Prisma — all from package.json. No manual input needed.
>
> Now let's extract memories from git history."

**Action:** Call MCP tool

```
atlas_extract_git_memories(
  sessionId="<session-id>",
  repoId="<repo-id>",
  repoPath="/home/user/atlas-2"
)
```

**Script:**
> "Atlas parses commit messages: 'fix:' becomes a BUG memory, 'breaking:' becomes a DECISION. We just analyzed 50 commits and generated memories automatically."

---

## Section 2: Saving Memories & Decisions (30 seconds)

**Visual:** Still in Claude Code

**Script:**
> "During the session, we can save important context."

**Action:** Call MCP tool

```
atlas_save_memory(
  sessionId="<session-id>",
  repoId="<repo-id>",
  kind="ARCHITECTURE",
  content="Uses CockroachDB VECTOR(1024) for semantic memory with cosine similarity search",
  importance=5
)
```

**Script:**
> "High-importance memories are automatically embedded using AWS Bedrock Titan v2.
>
> We can also record architectural decisions."

**Action:** Call MCP tool

```
atlas_record_decision(
  sessionId="<session-id>",
  repoId="<repo-id>",
  title="Use CockroachDB over PostgreSQL",
  rationale="Need vector search + distributed SQL in single database",
  alternatives=["PostgreSQL + pgvector", "Separate vector DB"]
)
```

---

## Section 3: The UI — Workspace & Repository Views (45 seconds)

**Visual:** Navigate to https://atlas-eight-plum.vercel.app/workspace

**Script:**
> "Here's the Atlas workspace. Each repository shows session count, open tasks, and the last agent that worked on it.
>
> Let's drill into a repository."

**Visual:** Click into a repository detail page

**Script:**
> "The 'Pick Up Where You Left Off' widget is the dominant element. It shows:
> - Last session summary
> - Open tasks ranked by importance
> - Recent decisions
> - Tech stack discovered from scanning
> - Architecture extracted from the README
>
> This is what the next agent sees when they start working."

---

## Section 4: Semantic Search (30 seconds)

**Visual:** Navigate to /search

**Script:**
> "Atlas uses vector kNN search powered by AWS Bedrock. Let's search for 'how does authentication work?'"

**Action:** Type query and search

**Script:**
> "Results are ranked by cosine similarity. Each memory shows its kind, importance, and when it was created. We can filter by memory type — architecture, decisions, bugs, TODOs."

---

## Section 5: Session Timeline & Handoff (30 seconds)

**Visual:** Navigate to a session detail page

**Script:**
> "The session timeline shows memories and decisions chronologically. At the end of a session, Atlas generates a structured handoff document:
> - What was accomplished
> - Decisions made
> - What failed or needs caution
> - What's next
>
> This handoff travels between agents — Claude Code to Codex to Cursor — with full continuity."

---

## Section 6: .atlas/ Portable Files (20 seconds)

**Visual:** Show terminal with .atlas/ directory

**Script:**
> "When a session ends, Atlas writes portable projection files to the repository:
> - context.md — architecture, tech stack, constraints
> - todos.md — open tasks
> - decisions.md — historical decisions
> - sessions/ — handoff documents
>
> These files travel with the repo, even when the Atlas MCP server isn't connected."

**Action:** Show file contents

```bash
cat .atlas/context.md
cat .atlas/decisions.md
```

---

## Section 7: CockroachDB as System of Record (20 seconds)

**Visual:** Show Prisma schema or database

**Script:**
> "Everything is backed by CockroachDB. Six models:
> - Organization → Repository → CodingSession
> - Memory with VECTOR(1024) embeddings
> - Decision
> - RepositoryContext
>
> CockroachDB gives us vector search with cosine similarity, distributed SQL, and horizontal scalability — all in one database."

---

## Closing (15 seconds)

**Visual:** Back to landing page hero

**Script:**
> "Atlas solves the repetition problem for coding agents. Context survives sessions. Memory is searchable. Work hands off cleanly.
>
> Your AI can write code. Atlas makes it remember why.
>
> Built for the CockroachDB × AWS Agentic Memory Challenge. Thank you."

---

## Technical Talking Points (for Q&A)

### CockroachDB Integration
- VECTOR(1024) type with native cosine similarity search
- Prisma ORM for type-safe queries
- Single source of truth for structured + semantic memory
- Horizontal scalability without sharding complexity

### AWS Bedrock Integration
- Titan Embeddings v2 (1024 dimensions)
- Importance gating: only memories with importance ≥ 3 are embedded
- Reduces cost while keeping semantic search focused on high-signal content

### Intelligence Features
- Repository scanner: auto-discovers tech stack from package.json, requirements.txt, go.mod, Cargo.toml
- Memory extractor: parses git commit messages for patterns (fix:, feat:, breaking:, security)
- Architecture discovery: extracts from README.md

### Multi-Agent Support
- MCP protocol for Claude Code, Codex, Cursor
- Structured handoff documents: "What I Did / What Failed / What's Next"
- .atlas/ portable files as fallback when MCP server isn't connected

### Production Deployment
- Vercel (UI): https://atlas-eight-plum.vercel.app
- CockroachDB Cloud (data layer)
- AWS Bedrock (embeddings)
- 12 MCP tools, 7 API routes, 4 UI views

---

## Demo Flow Checklist

- [ ] Have test repository ready with git history
- [ ] MCP server configured and running
- [ ] Claude Code connected to MCP server
- [ ] Database seeded with example data (optional)
- [ ] Browser open to https://atlas-eight-plum.vercel.app
- [ ] Terminal ready for .atlas/ file showcase
- [ ] Screen recording software configured
- [ ] Microphone tested
- [ ] Timer ready (aim for 3-4 minutes)

---

## Backup Slides (if needed)

### Problem Statement
AI coding agents are powerful, but each session feels disconnected. Developers repeatedly explain:
- What the project does
- Why a decision was made
- What remains unfinished
- What was tried previously

### Solution
Atlas is a persistent memory layer that:
- Remembers context across sessions
- Auto-extracts memories from git commits
- Enables semantic search over past decisions
- Hands off work between agents

### Why Atlas 2.0 vs Atlas 1.0
Atlas 1.0 was a blockchain wallet tracer — interesting but tangential to "agentic memory."

Atlas 2.0 **IS** an agentic memory system:
- ✅ Structured memory (CockroachDB models)
- ✅ Semantic memory (VECTOR + kNN)
- ✅ Persistent memory (survives sessions)
- ✅ Multi-agent (MCP protocol)
- ✅ Repository-aware (scoped to projects)
- ✅ Intelligent extraction (git + scanning)
