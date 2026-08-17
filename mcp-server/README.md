# Atlas MCP Server

Persistent memory system for coding agents. Gives AI assistants long-term memory across sessions via the Model Context Protocol.

## Installation

```bash
npm install -g atlas-mcp-server
```

## Setup

After installation, you need to configure:

1. Create `~/.config/atlas/.env`:

```env
DATABASE_URL="postgresql://user:pass@host:26257/db?sslmode=require"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
```

2. Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "atlas": {
      "command": "atlas-mcp",
      "env": {
        "DATABASE_URL": "postgresql://...",
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "your-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret"
      }
    }
  }
}
```

3. Restart Claude Code

## Usage

From any Claude Code session:

```
Start an Atlas session
```

Or use the `/atlas` skill to view current context.

## What It Does

- **Persistent memory** — remembers what you worked on between sessions
- **Auto-discovery** — scans repos for tech stack, important files
- **Decision tracking** — logs architectural choices with rationale
- **Task memory** — remembers TODOs and bugs across sessions
- **Semantic search** — finds relevant past memories via embeddings

## MCP Tools

- `atlas_start_session` — begin a coding session
- `atlas_end_session` — close and summarize
- `atlas_save_memory` — record important context
- `atlas_record_decision` — log architectural choices
- `atlas_scan_repository` — auto-discover tech stack
- `atlas_get_repository_context` — retrieve full context
- `atlas_get_open_tasks` — list TODOs/bugs
- `atlas_get_recent_sessions` — view session history
- `atlas_search_memories` — semantic search
- `atlas_list_repositories` — all tracked repos

## Database

Requires CockroachDB (or any Postgres-compatible database with vector support).

Free tier: https://cockroachlabs.cloud

## License

MIT
