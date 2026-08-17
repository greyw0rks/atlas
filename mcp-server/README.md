# Atlas MCP Server

**Persistent memory for coding agents via Model Context Protocol**

Atlas gives AI coding assistants the ability to remember context, decisions, and tasks across sessions. Built for Claude Code, compatible with any MCP client.

## Quick Start

### 1. Install globally

```bash
npm install -g atlas-mcp-server
```

### 2. Clone the full repository for setup

```bash
git clone https://github.com/greyw0rks/atlas.git
cd atlas
```

### 3. Create your credentials

Create `atlas/.env`:

```env
DATABASE_URL="postgresql://user:pass@host:26257/db?sslmode=require"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
```

### 4. Run the installer

```bash
./install.sh
```

This will:
- ✅ Install dependencies
- ✅ Generate Prisma client
- ✅ Push database schema
- ✅ Configure `~/.claude/settings.json`
- ✅ Install `/atlas` skill
- ✅ Update `~/.claude/CLAUDE.md` to use Atlas

### 5. Restart Claude Code

That's it! Now when you open Claude Code in any project, say:

```
Start an Atlas session
```

Atlas will remember everything.

## What It Does

- **Remembers context** — tech stack, architecture, file structure
- **Tracks decisions** — "why did we choose X over Y?" with full rationale
- **Maintains tasks** — TODOs and bugs that persist between sessions
- **Auto-discovers projects** — scans repositories to understand what you're building
- **Semantic search** — find relevant past conversations via vector embeddings

## How It Works

Atlas is an MCP (Model Context Protocol) server that provides 12 tools:

1. `atlas_start_session` — begin a coding session
2. `atlas_end_session` — close session with summary
3. `atlas_save_memory` — store important context
4. `atlas_get_memories` — retrieve past memories
5. `atlas_search_memories` — semantic search via embeddings
6. `atlas_record_decision` — log architectural choices
7. `atlas_get_decisions` — retrieve past decisions
8. `atlas_save_task` — create TODO/BUG entries
9. `atlas_get_open_tasks` — view pending work
10. `atlas_scan_repository` — auto-discover tech stack
11. `atlas_get_repository_context` — load full context
12. `atlas_get_recent_sessions` — view session history

## Architecture

- **Database:** CockroachDB (distributed SQL + vector storage)
- **Embeddings:** AWS Bedrock Titan (1536-dim vectors)
- **MCP:** Standardized protocol for agent tools
- **Portable:** `.atlas/` projection files (git-committable markdown)

## Requirements

- Node.js 18+
- CockroachDB Cloud account (free tier works)
- AWS Bedrock access (optional, for semantic search)

## Documentation

Full docs at: https://github.com/greyw0rks/atlas

- [Installation Guide](https://github.com/greyw0rks/atlas/blob/master/INSTALL.md)
- [How to Use](https://github.com/greyw0rks/atlas/blob/master/HOW_TO_USE.md)
- [Verification](https://github.com/greyw0rks/atlas/blob/master/VERIFICATION.md)

## Verification

Test that it works:

```bash
atlas-mcp
# Should output: Atlas MCP Server running on stdio
```

In Claude Code:

```
/atlas
```

Shows repository status, open tasks, and recent sessions.

## License

MIT

## Links

- GitHub: https://github.com/greyw0rks/atlas
- Issues: https://github.com/greyw0rks/atlas/issues
- Live Demo: https://atlas-eight-plum.vercel.app
