# Atlas Installation & Demo Checklist

## ✅ Pre-Demo Verification

**GitHub Repository:**
- [x] Pushed to https://github.com/greyw0rks/atlas
- [x] README.md complete with installation instructions
- [x] All documentation files included (INSTALL.md, HOW_TO_USE.md, etc.)

**npm Package:**
- [ ] Published to npm as `atlas-mcp-server` (waiting for npm login)
- [x] Package tested locally (`npm pack` successful)
- [x] README.md included in package

**MCP Server:**
- [x] All 12 tools tested and working
- [x] Database connection verified (CockroachDB)
- [x] AWS Bedrock embeddings working
- [x] `.atlas/` projection files created successfully

**Installation Scripts:**
- [x] `install.sh` tested end-to-end
- [x] `install-config.cjs` updates `~/.claude/settings.json` correctly
- [x] Removes HANDOFF.md conflicts
- [x] Updates `~/.claude/CLAUDE.md` to use Atlas

---

## 📹 Demo Video Script (3-4 minutes)

### 1. Problem Statement (30s)
*Show Claude Code session forgetting context*

"Every time I start a new coding session, I have to re-explain everything. AI coding assistants have no memory—they forget the moment you close the window."

### 2. Installation Demo (1min)
*Screen recording of install process*

```bash
# Clone the repository
git clone https://github.com/greyw0rks/atlas.git
cd atlas

# Create .env with credentials
cat > .env << EOF
DATABASE_URL="postgresql://..."
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
EOF

# Run installer
./install.sh

# Verify installation
atlas-mcp
# Output: Atlas MCP Server running on stdio
```

### 3. First Session Demo (1min)
*Show Claude Code starting an Atlas session*

User: "Start an Atlas session"

Claude calls:
```
atlas_start_session({
  repoPath: "/home/user/my-app",
  repoName: "my-app",
  agentId: "claude-code"
})
```

Atlas responds with:
- Repository context (tech stack auto-discovered)
- Last session summary (or "first session")
- Open tasks (empty for new projects)

User continues working, Claude saves memories automatically.

### 4. Second Session Demo (1min)
*Restart Claude Code, show context persists*

User: "/atlas"

Output shows:
```
╔══════════════════════════════════════════════════╗
║  ATLAS — my-app                                  ║
╠══════════════════════════════════════════════════╣
║  Last session: Added user authentication         ║
║  Agent: claude-code  ·  2026-08-17              ║
╠══════════════════════════════════════════════════╣
║  Open tasks (2)                                  ║
║  [BUG] Webhook signature validation failing     ║
║  [TODO] Add refund flow to admin dashboard      ║
╠══════════════════════════════════════════════════╣
║  Recent decisions                                ║
║  • Use Stripe over PayPal (better API)          ║
╠══════════════════════════════════════════════════╣
║  Tech stack: Next.js 14, Prisma, Tailwind       ║
╚══════════════════════════════════════════════════╝
```

Claude: "Picking up where we left off. I see we need to fix the webhook signature validation. Let me investigate..."

*Show Claude working with full context—no re-explanation needed*

### 5. Architecture Overview (30s)
*Show diagram or quick slides*

- **CockroachDB**: Distributed SQL + vector storage
- **AWS Bedrock**: Titan embeddings for semantic search
- **MCP**: Standardized protocol for AI agents
- **Portable**: `.atlas/` files (git-committable markdown)

### 6. Wrap & Call to Action (30s)

"Atlas gives coding agents persistent memory. Works with Claude Code, Claude Desktop, and any MCP-compatible agent."

```bash
npm install -g atlas-mcp-server
git clone https://github.com/greyw0rks/atlas
cd atlas && ./install.sh
```

"Links in description. Built for CockroachDB's Atlas Hackathon."

---

## 🎬 Recording Checklist

**Before Recording:**
- [ ] Clean terminal history
- [ ] Close unnecessary windows
- [ ] Set terminal font size to 14-16pt (readable in video)
- [ ] Prepare test project with realistic code
- [ ] Have .env credentials ready to copy

**Recording Tools:**
- Screen recorder: OBS / QuickTime / Windows Game Bar
- Resolution: 1920x1080 minimum
- Frame rate: 30fps minimum
- Audio: Clear microphone (test first!)

**During Recording:**
- [ ] Speak clearly and at moderate pace
- [ ] Show commands before running them
- [ ] Highlight key output (circle/arrow in post-edit)
- [ ] Keep each segment under 1 minute

**After Recording:**
- [ ] Trim dead air / mistakes
- [ ] Add captions/subtitles
- [ ] Add music (optional, keep low volume)
- [ ] Export as MP4 (H.264 codec)

---

## 📝 Devpost Submission

**Required Fields:**
- [x] Project title: "Atlas - Persistent Memory for Coding Agents"
- [x] Tagline: "AI assistants that remember context across sessions"
- [x] Detailed description: DEVPOST_SUBMISSION.md (complete)
- [ ] Demo video: YouTube/Vimeo link (upload after recording)
- [x] GitHub repo: https://github.com/greyw0rks/atlas
- [ ] Live demo: https://atlas-eight-plum.vercel.app
- [x] Built with: CockroachDB, AWS Bedrock, MCP, Next.js, Prisma
- [x] Category: AI/ML + Developer Tools

**Deadline:** August 18, 2026 (tomorrow)

---

## 🚀 Post-Submission

- [ ] Tweet demo video
- [ ] Post on r/ClaudeAI
- [ ] Share in MCP Discord
- [ ] Write blog post (optional)
