# Atlas 2.0 — Persistent Memory for Coding Agents

Atlas gives coding agents a memory. Your AI can write code. Atlas makes it remember why.

## What is Atlas?

Atlas is a persistent, repository-aware memory infrastructure for autonomous coding agents. It uses CockroachDB as a durable system of record for both structured and semantic memory, enabling agents to:

- **Remember across sessions** — context survives agent restarts
- **Learn from git history** — auto-extract memories from commits
- **Search semantically** — vector kNN over AWS Bedrock embeddings
- **Hand off work** — structured context transfer between agents
- **Track decisions** — why choices were made, what alternatives existed

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Claude Code / Codex / Cursor (MCP Client)             │
└────────────────┬────────────────────────────────────────┘
                 │ MCP Protocol
┌────────────────▼────────────────────────────────────────┐
│  Atlas MCP Server (10 tools)                           │
│  - atlas_start_session                                 │
│  - atlas_save_memory                                   │
│  - atlas_record_decision                               │
│  - atlas_scan_repository                               │
│  - atlas_extract_git_memories                          │
│  - atlas_search_memory                                 │
│  - atlas_end_session                                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Atlas Memory Layer                                     │
│  - writer.ts  (session lifecycle, memory persistence)  │
│  - retrieval.ts (11 query functions)                   │
│  - embedder.ts (AWS Bedrock Titan v2, 1024d vectors)  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  CockroachDB Cloud (Source of Truth)                   │
│  - Structured memory (Prisma models)                   │
│  - Semantic memory (VECTOR + kNN)                      │
└─────────────────────────────────────────────────────────┘
```

## Features

### Core Memory System
- **Session tracking** — every coding session has a timeline of memories + decisions
- **Memory types** — ARCHITECTURE, DECISION, BUG, TODO, WARNING, IMPORTANT_FILE, DEPENDENCY, SECURITY, CONTEXT
- **Importance gating** — only memories with importance ≥ 3 are embedded (reduces cost)
- **Resolution tracking** — TODOs and BUGs can be marked resolved without deletion

### Intelligent Extraction
- **Repository scanner** — auto-discovers tech stack from package.json, requirements.txt, go.mod, Cargo.toml
- **Git memory extraction** — parses commit messages and file changes to generate memories
- **Architecture discovery** — extracts system design from README.md
- **Important files** — identifies critical files (config, schema, manifests)

### Semantic Search
- **Vector kNN** — powered by AWS Bedrock Titan Embeddings v2
- **Multi-repo search** — search across all repositories or restrict to one
- **Kind filtering** — filter by memory type
- **Audit log** — every retrieval is logged for observability

### Agent Handoff
- **Structured handoffs** — "What I Did / What Failed / What's Next"
- **.atlas/ projection files** — portable fallback when MCP server isn't connected
- **Pick up where you left off** — UI surfaces last session summary, open tasks, key decisions

## Setup

### 1. Prerequisites
- Node.js 18+
- CockroachDB Cloud account (free tier works)
- AWS account with Bedrock access (Titan Embeddings v2)

### 2. Environment Variables

Create `.env`:

```bash
# CockroachDB connection string
DATABASE_URL="postgresql://user:password@cluster.cockroachlabs.cloud:26257/defaultdb?sslmode=require"

# AWS Bedrock (for embeddings)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
```

### 3. Database Setup

```bash
# Install dependencies
npm install

# Apply schema to CockroachDB
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 4. MCP Server Setup

Add to your Claude Code settings (`~/.config/claude-code/settings.json`):

```json
{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["/path/to/atlas-2/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "...",
        "AWS_SECRET_ACCESS_KEY": "..."
      }
    }
  }
}
```

### 5. Auto-Fire Hook (optional)

Install the SessionStart hook so Atlas context is injected automatically every time you start a Claude Code session — no manual `atlas_start_session` call needed:

```bash
bash scripts/install-autofire.sh
```

This writes a `SessionStart` hook to `~/.config/claude-code/settings.json`. When you open Claude Code in any repo that has `.atlas/` files or an `ATLAS.md`, the context is printed at session start. The hook stays silent for repos Atlas hasn't seen yet.

### 6. Start the UI

```bash
npm run dev
```

Visit `http://localhost:3000` to see the Atlas dashboard.

## Usage

### From Claude Code

```
# Start a session (auto-fired if you installed the hook, otherwise call manually)
atlas_start_session(repoPath="/home/user/my-project", repoName="my-project", agentId="claude-code")

# Scan repository for tech stack and architecture
atlas_scan_repository(repoPath="/home/user/my-project", repoId="...")

# Extract memories from git history
atlas_extract_git_memories(sessionId="...", repoId="...", repoPath="/home/user/my-project")

# Save a memory
atlas_save_memory(sessionId="...", repoId="...", kind="ARCHITECTURE", content="Uses Next.js 14 with App Router", importance=4)

# Record a decision
atlas_record_decision(sessionId="...", repoId="...", title="Use Prisma over Drizzle", rationale="Team familiarity", alternatives=["Drizzle", "TypeORM"])

# Search memories
atlas_search_memory(query="how does authentication work?", repoPath="/home/user/my-project")

# Generate ATLAS.md (portable session-start primer, no MCP needed)
atlas_generate_atlas_md(repoPath="/home/user/my-project")

# Reconstruct project timeline
atlas_reconstruct_timeline(repoPath="/home/user/my-project", since="2026-01-01")

# End session
atlas_end_session(sessionId="...", summary="Added user authentication", repoPath="/home/user/my-project")
```

### From OpenAI Codex / VS Code Agent Mode (Cross-Agent)

Atlas speaks standard MCP — any agent that supports the Model Context Protocol can use it. For Codex in VS Code, add Atlas to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "atlas": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/atlas-2/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "...",
        "AWS_SECRET_ACCESS_KEY": "..."
      }
    }
  }
}
```

Both Claude Code and Codex write to the same CockroachDB cluster, so memories created in one agent are immediately available to the other. The `agentId` field on each session and memory record tracks which agent wrote it.

### From the UI

- **Workspace** (`/`) — All repositories with session count, open tasks, last agent
- **Repository** (`/repo/[id]`) — "Pick Up Where You Left Off" widget, recent sessions, open tasks, key decisions
- **Session** (`/session/[id]`) — Session timeline with memories + decisions chronologically
- **Search** (`/search`) — Semantic memory search across all repositories

## API Routes

- `GET /api/repositories` — List all repositories
- `GET /api/repositories/[id]` — Get repository by ID with context
- `POST /api/sessions` — Start a new session
- `GET /api/sessions/[id]` — Get session details
- `POST /api/sessions/[id]/handoff` — Generate handoff document
- `GET /api/memories/search?q=query` — Semantic search
- `GET /api/memories/stats` — Memory statistics

## Deployment

### Vercel (UI)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### MCP Server

The MCP server runs locally on your machine. Each developer needs to configure it in their Claude Code settings.

For team deployments, consider:
- Running the MCP server on a shared development server
- Using SSH tunneling to connect Claude Code to remote MCP server
- Deploying as a container with shared CockroachDB connection

## Tech Stack

- **Frontend** — Next.js 14, React, TypeScript, Tailwind CSS
- **Backend** — Next.js API routes, Prisma ORM
- **Database** — CockroachDB Cloud (PostgreSQL-compatible, vector support)
- **Embeddings** — AWS Bedrock Titan Embeddings v2 (1024d)
- **MCP** — Model Context Protocol (Claude Code integration)
- **Deployment** — Vercel (UI), local/SSH (MCP server)

## Why CockroachDB?

- **Vector indexing** — native VECTOR type with cosine similarity search
- **Distributed SQL** — horizontal scalability without sharding complexity
- **Prisma support** — type-safe queries with auto-generated client
- **Free tier** — 5 GB storage, perfect for personal projects

## Why Atlas 2.0?

Atlas 1.0 was a blockchain wallet tracer — interesting product but **tangential** to "agentic memory."

Atlas 2.0 **IS** an agentic memory system:
- ✅ Structured memory (CockroachDB models: sessions, memories, decisions)
- ✅ Semantic memory (VECTOR + kNN search via AWS Bedrock embeddings)
- ✅ Persistent memory (survives sessions, travels with repo via .atlas/ files)
- ✅ Multi-agent (MCP for Claude/Codex + SDK for custom agents)
- ✅ Repository-aware (memory is scoped to projects, not just user accounts)

## License

MIT
