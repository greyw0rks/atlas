# Atlas MCP Server Testing Guide

## Setup Complete ✓

1. **Prisma Client Generated** ✓
2. **Database Connected** (CockroachDB Cloud) ✓
3. **MCP Server Config** created at `.mcp.json` ✓

## Manual Testing Steps

### Option 1: Test from Claude Code (Recommended)

1. **Enable the MCP server in Claude Code:**
   ```bash
   # The server is already configured in .mcp.json
   # Claude Code will auto-discover it in this project
   ```

2. **Start a new Claude Code session in this directory:**
   ```bash
   cd /home/greyw0rks/atlas-2
   # Just start chatting - the MCP tools should be available
   ```

3. **Test the tool lifecycle:**
   ```
   Use atlas_start_session to start a session for this repo
   Use atlas_scan_repository to discover the tech stack
   Use atlas_save_memory to save a test memory
   Use atlas_search_memory to search for "CockroachDB"
   Use atlas_end_session to end the session
   ```

4. **Verify .atlas/ files created:**
   ```bash
   ls -la .atlas/
   cat .atlas/context.md
   ```

### Option 2: Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx tsx mcp-server/index.ts
```

Then open the URL shown and test each tool interactively.

### Option 3: Test with stdio client

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx tsx mcp-server/index.ts
```

## Available Tools (12 total)

1. `atlas_start_session` - Start coding session
2. `atlas_get_repository_context` - Get repo context without starting session
3. `atlas_save_memory` - Save memory (fact/note)
4. `atlas_record_decision` - Record architectural decision
5. `atlas_get_open_tasks` - Get unresolved TODOs/BUGs
6. `atlas_get_recent_sessions` - Get recent sessions
7. `atlas_update_context` - Update repository context
8. `atlas_create_handoff` - Generate handoff document
9. `atlas_search_memory` - Semantic search (requires AWS Bedrock)
10. `atlas_end_session` - End session, write .atlas/ files
11. `atlas_scan_repository` - Auto-discover tech stack
12. `atlas_extract_git_memories` - Extract memories from git commits

## Environment Variables

Required:
- `DATABASE_URL` - Set in `.env` ✓
- `AWS_REGION` - Set in `.mcp.json` ✓

Optional (for semantic search):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Success Criteria

- [x] MCP server starts without errors
- [x] Database connection works
- [ ] Can start/end a session
- [ ] .atlas/ directory is created
- [ ] Handoff document is generated
- [ ] Semantic search works (if AWS credentials present)

## Next: Demo Video

Once manual testing confirms all tools work, record a 3-4 minute demo showing:
1. Starting a session via MCP
2. Scanning the repo
3. Extracting git memories
4. Saving custom memories
5. Searching memories
6. Ending session → .atlas/ files written
7. UI showing the session timeline
