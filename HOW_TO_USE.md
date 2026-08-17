# How to Use Atlas MCP Server

## MCP Server is Already Configured ✅

Your `~/.claude/settings.json` already has:
```json
"mcpServers": {
  "atlas": {
    "command": "node",
    "args": ["/home/greyw0rks/atlas-2/mcp-server/dist/mcp-server/index.js"]
  }
}
```

## How to Access Atlas Tools

Atlas tools are available **automatically** in Claude Code through the MCP connection. You don't need a `/atlas` command.

### Using Atlas Tools

Simply ask Claude to use the Atlas tools naturally:

**Examples:**

```
"Start a new Atlas session for this project"
→ Claude calls: atlas_start_session()

"Save this as an architecture decision"
→ Claude calls: atlas_record_decision()

"Search my memories for authentication code"
→ Claude calls: atlas_search_memory()

"What tasks are still open?"
→ Claude calls: atlas_get_open_tasks()

"Scan this repo and tell me what tech stack it uses"
→ Claude calls: atlas_scan_repository()

"End the session and write a handoff"
→ Claude calls: atlas_end_session()
```

### Available Tools

Claude Code can automatically call these 12 Atlas tools:

1. **atlas_start_session** - Begin tracking a coding session
2. **atlas_end_session** - End session, write handoff + .atlas/ files
3. **atlas_create_handoff** - Generate structured handoff markdown
4. **atlas_save_memory** - Store memories (auto-embeds if important)
5. **atlas_record_decision** - Log architectural decisions
6. **atlas_get_repository_context** - Get repo overview
7. **atlas_update_context** - Update repo metadata
8. **atlas_scan_repository** - Auto-discover tech stack
9. **atlas_extract_git_memories** - Parse git commits into memories
10. **atlas_search_memory** - Semantic search across memories
11. **atlas_get_open_tasks** - List unresolved TODO/BUG memories
12. **atlas_get_recent_sessions** - Session history

### Verifying Connection

To verify Atlas is connected, **restart Claude Code** (the MCP config was just added) and then ask:

```
"Can you list the available MCP tools?"
```

You should see the 12 Atlas tools listed.

### Example Workflow

```
You: "Start an Atlas session for this project"
Claude: [calls atlas_start_session with repoPath, repoName, agentId]
       → Returns sessionId and context

You: "Scan this repository"
Claude: [calls atlas_scan_repository]
       → Discovers: Next.js, Prisma, AWS SDK, etc.

You: "Remember that we're using CockroachDB for vector storage"
Claude: [calls atlas_save_memory with kind=ARCHITECTURE]
       → Saved with importance 4, will be embedded

You: "What's our tech stack?"
Claude: [calls atlas_get_repository_context]
       → Lists: Next.js 14, Prisma, CockroachDB, AWS Bedrock

You: "Search for anything about embedding"
Claude: [calls atlas_search_memory with query="embedding"]
       → Returns semantic matches with similarity scores

You: "End the session"
Claude: [calls atlas_end_session]
       → Writes .atlas/sessions/2026-08-13.md + context files
```

## Testing Right Now

Try asking me:

**"Start an Atlas session for this atlas-2 repository"**

I'll call `atlas_start_session()` and you'll see the result immediately.

---

## Troubleshooting

**"Tool not found"** → Restart Claude Code to load the MCP config

**"Connection failed"** → Run `node /home/greyw0rks/atlas-2/mcp-server/dist/mcp-server/index.js` manually to test

**"Database error"** → Check `.env` has correct `DATABASE_URL`

**"Embedding failed"** → Verify AWS credentials in `.env`
