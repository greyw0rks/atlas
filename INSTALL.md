# Atlas Memory System - Complete Installation Guide

## One-Command Installation

```bash
cd /path/to/atlas-2
./install.sh
```

This automated installer will:
1. ✅ Check Node.js prerequisites (18+)
2. ✅ Verify `.env` configuration exists
3. ✅ Install all dependencies (root + mcp-server)
4. ✅ Setup database (Prisma generate + push schema)
5. ✅ Build and install `atlas-mcp` globally
6. ✅ Configure Claude Code settings (with backup)
7. ✅ Fix SessionStart hook conflicts automatically
8. ✅ Install `/atlas` skill

**The installer automatically fixes all common issues, including:**
- Conflicting HANDOFF.md hooks
- Missing MCP server configuration
- SessionStart/Stop hooks properly configured for Atlas
- Skill installation with correct directory structure

---

## Manual Installation (if needed)

### Prerequisites
- Node.js 20+
- CockroachDB or PostgreSQL with pgvector
- AWS Bedrock access (Titan Embeddings v2)

### Step 1: Clone & Navigate
```bash
git clone <atlas-2-repo-url>
cd atlas-2
```

### Step 2: Configure Environment
Create `.env`:
```bash
DATABASE_URL="postgresql://user:pass@host:26257/db?sslmode=require"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
```

### Step 3: Run Installer
```bash
./install.sh
```

### Step 4: Restart Claude Code
Close and reopen Claude Code to load Atlas.

---

## What Gets Configured

### 1. Global Binary
- **Location**: `~/.nvm/versions/node/vX.X.X/bin/atlas-mcp`
- **Test**: `atlas-mcp` (should output: "Atlas MCP Server running on stdio")

### 2. Claude Code Settings (`~/.claude/settings.json`)
```json
{
  "mcpServers": {
    "atlas": {
      "command": "atlas-mcp"
    }
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Start an Atlas session using atlas_start_session MCP tool (pass repoPath as current working directory, repoName as directory name, agentId as 'claude-code'). Do not create or update HANDOFF.md files."
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "End the Atlas session using atlas_end_session MCP tool with a brief summary of what was accomplished."
          }
        ]
      }
    ]
  }
}
```

**Important**: The installer removes any conflicting HANDOFF.md hooks automatically.

### 3. /atlas Skill
- **Location**: `~/.claude/skills/atlas/SKILL.md`
- **Usage**: Type `/atlas` in any directory

---

## Usage After Installation

### Automatic Session Tracking
When you open Claude Code in any directory, Atlas automatically starts tracking:
```bash
cd ~/my-project
claude
# Atlas session starts automatically
```

### Manual Commands
```
"Search my Atlas memories for authentication"
"What tasks are open across all projects?"
"Record this as an architecture decision"
"/atlas" - Show current repository status
```

### End Session
Claude Code automatically calls `atlas_end_session` when you exit, creating:
- `.atlas/` directory with portable context files
- Session summary in database

---

## Verification

### 1. Check Global Command
```bash
which atlas-mcp
# Output: /home/<user>/.nvm/versions/node/vX.X.X/bin/atlas-mcp

atlas-mcp
# Output: Atlas MCP Server running on stdio
```

### 2. Check Settings
```bash
cat ~/.claude/settings.json | grep -A 3 mcpServers
# Should show atlas MCP server
```

### 3. Test in Claude Code
```bash
claude
❯ /atlas
# Should display repository status
```

---

## Common Issues (Auto-Fixed by Installer)

### ❌ "Unknown command: /atlas"
**Fixed**: Installer creates skill at `~/.claude/skills/atlas/SKILL.md`

### ❌ Claude creates HANDOFF.md instead of using Atlas
**Fixed**: Installer removes conflicting SessionStart hooks and configures Atlas hooks

### ❌ "atlas-mcp: command not found"
**Fixed**: Installer runs `npm link` and verifies PATH

### ❌ "Database connection failed"
**Fixed**: Installer verifies `.env` exists before proceeding

### ❌ MCP tools not available
**Fixed**: Installer adds MCP server to settings.json and creates backup

---

## Rollback

If something goes wrong, your settings are backed up:

```bash
# Restore previous settings
cp ~/.claude/settings.json.backup-YYYYMMDD-HHMMSS ~/.claude/settings.json

# Uninstall global command
cd /path/to/atlas-2/mcp-server
npm unlink

# Remove skill
rm -rf ~/.claude/skills/atlas
```

---

## Updating Atlas

```bash
cd /path/to/atlas-2
git pull

cd mcp-server
npm run build
# Global link stays valid - settings unchanged
```

Restart Claude Code to use updated version.

---

## Multi-Machine Setup

Run the installer on each machine with the **same `.env` file** (same DATABASE_URL):

```bash
# Machine 1
cd atlas-2 && ./install.sh

# Machine 2 (same database)
cd atlas-2 && ./install.sh
# All machines share the same memory!
```

---

## Installation Summary

**Before installer:**
- ❌ Manual settings.json editing
- ❌ Hook conflicts with HANDOFF.md
- ❌ Forgot to remove template hooks
- ❌ Skill not installed correctly

**After installer:**
- ✅ One command: `./install.sh`
- ✅ All conflicts resolved automatically
- ✅ Settings backed up before changes
- ✅ Hooks properly configured
- ✅ Skill installed with correct structure
- ✅ Global command verified

---

## Getting Help

**Installation failed?**
```bash
# Check the backup
ls ~/.claude/*.backup-*

# Restore if needed
cp ~/.claude/settings.json.backup-* ~/.claude/settings.json
```

**Atlas not starting sessions?**
```bash
# Verify MCP server
atlas-mcp
# Should output: "Atlas MCP Server running on stdio"

# Check settings
cat ~/.claude/settings.json | grep -A 10 mcpServers
```

**Still having issues?**
Check `/path/to/atlas-2/TROUBLESHOOTING.md` or open an issue.

---

## What's Next?

After installation:
1. **Restart Claude Code**
2. Navigate to any project
3. Sessions start automatically
4. Use `/atlas` to view status
5. Ask Claude to search memories, record decisions, etc.

Atlas is now tracking all your coding work across every project! 🚀
