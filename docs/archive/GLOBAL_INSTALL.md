# Atlas Global Installation Guide

## ✅ Atlas is Now Installed Globally

Atlas MCP server has been installed as a global npm package and is available from **any directory**.

---

## Installation Summary

### What Was Done

1. **Global npm link**: `npm link` in `/home/greyw0rks/atlas-2/mcp-server`
2. **Binary created**: `/home/greyw0rks/.nvm/versions/node/v22.22.3/bin/atlas-mcp`
3. **Claude Code configured**: `~/.claude/settings.json` now uses `atlas-mcp` command
4. **Environment inherited**: Atlas reads `.env` from `/home/greyw0rks/atlas-2/` automatically

### Verify Installation

```bash
# Check if atlas-mcp is available
which atlas-mcp
# Output: /home/greyw0rks/.nvm/versions/node/v22.22.3/bin/atlas-mcp

# Test it runs
atlas-mcp
# Output: Atlas MCP Server running on stdio
```

---

## How It Works Now

### From Any Directory

Atlas can now track **any repository** you work in:

```bash
cd ~/my-project
# Claude Code will automatically use atlas-mcp
# All Atlas tools (atlas_start_session, etc.) work here
```

### Configuration

**Claude Code Settings** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "atlas": {
      "command": "atlas-mcp"
    }
  }
}
```

**No args needed** - the global binary is already configured with the correct paths.

---

## Environment Variables

Atlas reads from `/home/greyw0rks/atlas-2/.env`:
```bash
DATABASE_URL=postgresql://...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

**Important**: All repositories share the same database. This means:
- ✅ Search across all your projects
- ✅ One centralized memory system
- ✅ Track work across multiple codebases
- ⚠️ Make sure DATABASE_URL is always accessible

---

## Testing Atlas Globally

### 1. Restart Claude Code
Atlas MCP config was updated - restart Claude Code to reload.

### 2. Test in Any Project

Navigate to any project:
```bash
cd ~/some-other-project
```

Ask Claude:
```
"Start an Atlas session for this project"
```

Claude will call `atlas_start_session()` and Atlas will:
- Create a new repository record if first time
- Scan the repo for tech stack
- Start tracking memories

### 3. Verify with MCP Tools

Try these commands naturally:
- "Search my Atlas memories for authentication"
- "What repositories does Atlas know about?"
- "Record this as a security decision"
- "What tasks are open across all my projects?"

---

## File Structure

```
~/.nvm/versions/node/v22.22.3/bin/
└── atlas-mcp              ← Global binary (symlink)

/home/greyw0rks/atlas-2/
├── .env                   ← Environment variables (DATABASE_URL, AWS creds)
├── prisma/
│   └── schema.prisma      ← Database schema
└── mcp-server/
    ├── dist/              ← Compiled MCP server
    │   └── mcp-server/
    │       └── index.js   ← Entry point (what atlas-mcp runs)
    └── package.json       ← Defines "atlas-mcp" bin command
```

---

## Updating Atlas

When you modify Atlas code:

```bash
cd /home/greyw0rks/atlas-2/mcp-server
npm run build              # Rebuild TypeScript
# Global binary automatically uses new build
```

No need to re-link - the symlink stays valid.

---

## Uninstalling

To remove global installation:

```bash
cd /home/greyw0rks/atlas-2/mcp-server
npm unlink
```

Then remove from `~/.claude/settings.json`:
```json
{
  "mcpServers": {}  // Remove "atlas" entry
}
```

---

## Multi-Machine Setup

To use Atlas on another machine:

1. **Clone the repo**:
   ```bash
   git clone <atlas-2-repo-url>
   cd atlas-2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd mcp-server && npm install && cd ..
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and AWS credentials
   ```

4. **Build and link**:
   ```bash
   cd mcp-server
   npm run build
   npm link
   ```

5. **Configure Claude Code**:
   Add to `~/.claude/settings.json`:
   ```json
   {
     "mcpServers": {
       "atlas": {
         "command": "atlas-mcp"
       }
     }
   }
   ```

6. **Restart Claude Code**

---

## Troubleshooting

### "atlas-mcp: command not found"

Your Node bin directory isn't in PATH. Add to `~/.bashrc` or `~/.zshrc`:
```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
```

Then `source ~/.bashrc` or restart terminal.

### "Database connection failed"

Check `/home/greyw0rks/atlas-2/.env` has correct `DATABASE_URL`.

### "Cannot find module"

Rebuild and regenerate Prisma:
```bash
cd /home/greyw0rks/atlas-2/mcp-server
npm run build
npx prisma generate
```

### "Changes not reflected"

After modifying TypeScript:
```bash
cd /home/greyw0rks/atlas-2/mcp-server
npm run build
# Restart Claude Code
```

---

## Benefits of Global Install

✅ **Works everywhere** - Use Atlas in any project  
✅ **Unified memory** - All projects in one database  
✅ **Cross-project search** - Find decisions across codebases  
✅ **Simple config** - Just `"command": "atlas-mcp"` in settings  
✅ **Easy updates** - Rebuild once, available everywhere  

---

**Status**: ✅ Atlas is globally installed and ready to use from any directory!

**Next**: Restart Claude Code and test Atlas in a different project.
