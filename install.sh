#!/bin/bash
set -e

echo "======================================"
echo "  Atlas Memory System - Installer"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
ATLAS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Installing from: $ATLAS_DIR"
echo ""

# Step 1: Check prerequisites
echo "[1/8] Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 20+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version too old ($NODE_VERSION). Need 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo ""

# Step 2: Check .env file
echo "[2/8] Checking environment configuration..."

if [ ! -f "$ATLAS_DIR/.env" ]; then
    echo -e "${YELLOW}⚠ No .env file found${NC}"
    echo ""
    echo "Please create $ATLAS_DIR/.env with:"
    echo ""
    echo "DATABASE_URL=\"postgresql://user:pass@host:26257/db?sslmode=require\""
    echo "AWS_REGION=\"us-east-1\""
    echo "AWS_ACCESS_KEY_ID=\"your-key\""
    echo "AWS_SECRET_ACCESS_KEY=\"your-secret\""
    echo ""
    read -p "Press Enter after creating .env file, or Ctrl+C to exit..."
fi

if [ -f "$ATLAS_DIR/.env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${RED}✗ .env file still missing. Exiting.${NC}"
    exit 1
fi
echo ""

# Step 3: Install root dependencies
echo "[3/8] Installing root dependencies..."
cd "$ATLAS_DIR"
npm install --silent
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Step 4: Install MCP server dependencies
echo "[4/8] Installing MCP server dependencies..."
cd "$ATLAS_DIR/mcp-server"
npm install --silent
echo -e "${GREEN}✓ MCP server dependencies installed${NC}"
echo ""

# Step 5: Setup database
echo "[5/8] Setting up database..."
cd "$ATLAS_DIR"

echo "  → Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}  ✓ Prisma client generated${NC}"

echo "  → Pushing schema to database..."
if npx prisma db push > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Database schema applied${NC}"
else
    echo -e "${YELLOW}  ⚠ Database push failed - check DATABASE_URL in .env${NC}"
fi

cd "$ATLAS_DIR/mcp-server"
echo "  → Generating Prisma client for MCP server..."
ln -sf ../prisma prisma 2>/dev/null || true
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}  ✓ MCP server Prisma client generated${NC}"
echo ""

# Step 6: Build and install globally
echo "[6/8] Building and installing globally..."
cd "$ATLAS_DIR/mcp-server"

echo "  → Building TypeScript..."
npm run build > /dev/null 2>&1
echo -e "${GREEN}  ✓ Build complete${NC}"

echo "  → Installing globally..."
npm link > /dev/null 2>&1
echo -e "${GREEN}  ✓ Global installation complete${NC}"

# Verify installation
if command -v atlas-mcp &> /dev/null; then
    echo -e "${GREEN}  ✓ atlas-mcp command available${NC}"
else
    echo -e "${YELLOW}  ⚠ atlas-mcp not in PATH - may need to restart terminal${NC}"
fi
echo ""

# Step 7: Configure Claude Code settings
echo "[7/8] Configuring Claude Code..."

SETTINGS_FILE="$HOME/.claude/settings.json"
SETTINGS_BACKUP="$HOME/.claude/settings.json.backup-$(date +%Y%m%d-%H%M%S)"

if [ -f "$SETTINGS_FILE" ]; then
    echo "  → Backing up existing settings to $SETTINGS_BACKUP"
    cp "$SETTINGS_FILE" "$SETTINGS_BACKUP"
fi

# Create .claude directory if it doesn't exist
mkdir -p "$HOME/.claude"

# Create or update settings.json using Node.js
node "$ATLAS_DIR/mcp-server/install-config.cjs"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Claude Code settings updated${NC}"
else
    echo -e "${RED}  ✗ Failed to update settings${NC}"
    if [ -f "$SETTINGS_BACKUP" ]; then
        echo "  → Restoring backup..."
        cp "$SETTINGS_BACKUP" "$SETTINGS_FILE"
    fi
fi
echo ""

# Step 8: Install /atlas skill
echo "[8/8] Installing /atlas skill..."

SKILL_DIR="$HOME/.claude/skills/atlas"
mkdir -p "$SKILL_DIR"

cat > "$SKILL_DIR/SKILL.md" << 'EOF'
# Atlas Status

Display current repository context, open tasks, and recent sessions from Atlas memory system.

## Usage

```
/atlas
```

Shows:
- Current repository context (or all repositories if not in a project)
- Open tasks across all projects
- Recent coding sessions
- Recent architectural decisions

## Implementation

Call these Atlas MCP tools:
1. `mcp__atlas-memory__atlas_get_repository_context` - Get context (pass repoPath as pwd)
2. `mcp__atlas-memory__atlas_get_open_tasks` - Get all TODO/BUG memories (pass repoPath)
3. `mcp__atlas-memory__atlas_get_recent_sessions` - Get last 3-5 sessions (pass repoPath)

Render results in a formatted box using this layout:

```
╔══════════════════════════════════════════════════╗
║  ATLAS — <repo name>                             ║
╠══════════════════════════════════════════════════╣
║  Last session: <summary or "first session">      ║
║  Agent: <agentId>  ·  <date>                    ║
╠══════════════════════════════════════════════════╣
║  Open tasks (<count>)                            ║
║  [1] <kind>: <content>  (importance: N)          ║
║  [2] ...                                         ║
╠══════════════════════════════════════════════════╣
║  Recent decisions                                ║
║  • <title> — <rationale (first sentence)>        ║
╠══════════════════════════════════════════════════╣
║  Tech stack: <techStack.join(", ")>              ║
╚══════════════════════════════════════════════════╝
```

## Rules

- If context is null: suggest starting a session with atlas_start_session
- Truncate any field to 50 chars with "…" if longer
- Show at most 5 open tasks and 3 decisions
- This command is read-only - does not start sessions automatically
- If not in a git repo, show summary across all tracked repositories
EOF

echo -e "${GREEN}✓ /atlas skill installed${NC}"
echo ""

# ─── 9. Global CLAUDE.md ─────────────────────────────────────────────────────
echo "[9/9] Updating global CLAUDE.md to use Atlas..."

mkdir -p "$HOME/.claude"

cat > "$HOME/.claude/CLAUDE.md" << 'CLAUDE_EOF'
# Claude Code Instructions

## Session Management

On session start:

Start an Atlas session using the atlas_start_session MCP tool:
- repoPath: current working directory
- repoName: directory name
- agentId: "claude-code"

Atlas will return the full context: last session summary, open tasks, decisions, and tech stack. Use this as your starting point — do not read or create tasks/HANDOFF.md.

If Atlas MCP tools are unavailable, fall back to reading tasks/HANDOFF.md if it exists.

## Project Conventions

Commits: Follow conventional commits (feat/fix/docs/refactor/chore).
PRs: squash-merge; keep title ≤ 72 chars.
Tests: run existing test suite before marking a task done.
Lint: run linter before commits.

## Task Tracking

Tasks are tracked in Atlas memory via the atlas_save_memory MCP tool with kind: "TODO" or kind: "BUG". Use /atlas to view open tasks.

## Communication Style

Respond concisely. Skip preamble. Act, then report. If blocked, say why in one sentence.

## End of Session

Before stopping, call atlas_end_session MCP tool with a brief summary of what was accomplished.
CLAUDE_EOF

echo -e "${GREEN}✓ Global CLAUDE.md updated to use Atlas${NC}"
echo ""

# Final summary
echo "======================================"
echo "  ✅ Atlas Installation Complete!"
echo "======================================"
echo ""
echo "What was configured:"
echo "  • Global command: atlas-mcp"
echo "  • MCP server: added to ~/.claude/settings.json"
echo "  • /atlas skill: installed at ~/.claude/skills/atlas/"
echo "  • CLAUDE.md: updated to use Atlas on session start"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code"
echo "  2. Navigate to any project directory"
echo "  3. Type: Start an Atlas session"
echo "  4. Or type: /atlas"
echo ""
echo "Backup created at: $SETTINGS_BACKUP"
echo ""
echo "To verify installation:"
echo "  atlas-mcp  (should output: Atlas MCP Server running on stdio)"
echo ""
