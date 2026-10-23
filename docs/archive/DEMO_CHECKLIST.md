# Atlas 2.0 Demo Checklist

## Pre-Recording Setup

### Environment Setup
- [ ] MCP server configured in `~/.config/claude-code/settings.json`
- [ ] Environment variables in `.env`:
  - [ ] `DATABASE_URL` (CockroachDB connection string)
  - [ ] `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- [ ] MCP server built: `cd mcp-server && npm run build`
- [ ] Verify MCP server starts: `node mcp-server/index.js` (should output "Atlas MCP Server running on stdio")

### Test Repository Preparation
- [ ] Choose test repository with meaningful git history
- [ ] Ensure repository has package.json or similar manifest
- [ ] Verify at least 10+ commits with varied messages (fix:, feat:, etc.)
- [ ] README.md with architecture section (optional but good for demo)

### Database Seeding (Optional)
- [ ] Seed 1-2 example repositories with:
  - [ ] At least one completed session
  - [ ] Mix of memories (ARCHITECTURE, DECISION, TODO, BUG)
  - [ ] At least one decision with alternatives
- [ ] Verify data appears in UI at /workspace

### Browser & Tools
- [ ] Browser open to https://atlas-eight-plum.vercel.app
- [ ] Landing page loads correctly
- [ ] Workspace shows repositories (if seeded)
- [ ] Search page functional
- [ ] Terminal ready in test repository directory

### Recording Setup
- [ ] Screen recording software configured
- [ ] Microphone tested and levels checked
- [ ] Audio clarity verified
- [ ] Resolution set to 1920×1080 or higher
- [ ] Frame rate at least 30fps
- [ ] Recording area set to full screen or window
- [ ] System notifications disabled
- [ ] Close unnecessary applications

### Timing & Script
- [ ] Timer ready (aim for 3-4 minutes total)
- [ ] DEMO_SCRIPT.md open in second monitor or printed
- [ ] Practiced run-through at least once
- [ ] Backup talking points ready

## During Recording

### Section 1: Opening (15s)
- [ ] Show landing page
- [ ] Read tagline: "Your AI can write code. Atlas makes it remember why."
- [ ] Briefly explain: "Built on CockroachDB and AWS Bedrock"

### Section 2: MCP Tools (60s)
- [ ] Open terminal in test repository
- [ ] Launch Claude Code
- [ ] Call `atlas_start_session` — show context loaded
- [ ] Call `atlas_scan_repository` — show tech stack discovered
- [ ] Call `atlas_extract_git_memories` — show commits analyzed
- [ ] Mention: "No manual input needed"

### Section 3: Save Memories (30s)
- [ ] Call `atlas_save_memory` with ARCHITECTURE kind
- [ ] Mention: "High-importance memories auto-embedded with AWS Bedrock"
- [ ] Call `atlas_record_decision` with alternatives
- [ ] Show decision recorded

### Section 4: UI Workspace (45s)
- [ ] Navigate to /workspace
- [ ] Show repository cards with stats
- [ ] Click into repository detail
- [ ] Highlight "Pick Up Where You Left Off" widget
- [ ] Show: last session, open tasks, decisions, tech stack

### Section 5: Semantic Search (30s)
- [ ] Navigate to /search
- [ ] Search for "authentication" or relevant query
- [ ] Show results ranked by similarity
- [ ] Demonstrate kind filter
- [ ] Mention: "Vector kNN powered by AWS Bedrock Titan v2"

### Section 6: Session Timeline (30s)
- [ ] Navigate to session detail page
- [ ] Show chronological timeline
- [ ] Show handoff document section
- [ ] Mention: "Structured context transfer between agents"

### Section 7: .atlas/ Files (20s)
- [ ] Show terminal
- [ ] `ls .atlas/`
- [ ] `cat .atlas/context.md`
- [ ] `cat .atlas/decisions.md`
- [ ] Mention: "Portable files travel with repo"

### Section 8: CockroachDB (20s)
- [ ] Show Prisma schema or briefly mention models
- [ ] Highlight: "VECTOR(1024) for semantic memory"
- [ ] "Distributed SQL + vector search in one database"

### Section 9: Closing (15s)
- [ ] Return to landing page
- [ ] Summarize: "Context survives sessions, memory is searchable, work hands off cleanly"
- [ ] End with tagline: "Your AI can write code. Atlas makes it remember why."

## Post-Recording

### Review
- [ ] Watch recording for errors or glitches
- [ ] Check audio clarity
- [ ] Verify all key features shown
- [ ] Timing within 3-4 minutes
- [ ] No sensitive information visible

### Editing (if needed)
- [ ] Trim dead air or mistakes
- [ ] Add transitions between sections
- [ ] Add title card: "Atlas 2.0 — Persistent Memory for Coding Agents"
- [ ] Add closing card: "Built for CockroachDB × AWS Agentic Memory Challenge"

### Export
- [ ] Export as MP4 (H.264 codec)
- [ ] Resolution: 1920×1080 minimum
- [ ] File size under 500MB (for easy upload)
- [ ] Test playback on different device

### Upload
- [ ] Upload to YouTube (unlisted or public)
- [ ] Set title: "Atlas 2.0 — Persistent Memory for Coding Agents"
- [ ] Set description with:
  - [ ] GitHub link
  - [ ] Live demo link
  - [ ] Challenge mention
  - [ ] Tech stack list
- [ ] Add to Devpost submission
- [ ] Embed on landing page (replace placeholder)

## Devpost Submission

### Required Content
- [ ] Project title: "Atlas 2.0 — Persistent Memory for Coding Agents"
- [ ] Tagline: "Your AI can write code. Atlas makes it remember why."
- [ ] Demo video embedded
- [ ] GitHub repository link
- [ ] Live demo link: https://atlas-eight-plum.vercel.app
- [ ] Description emphasizing:
  - [ ] CockroachDB as system of record
  - [ ] VECTOR type for semantic search
  - [ ] AWS Bedrock Titan Embeddings v2
  - [ ] Auto-extraction from git
  - [ ] Multi-agent handoff
- [ ] Tech stack tags
- [ ] Challenge category selected

### Submission Text Template
```
## Inspiration
AI coding agents are powerful, but each session feels disconnected. Developers repeatedly explain what the project does, why decisions were made, and what remains unfinished. Atlas eliminates that repetition.

## What it does
Atlas is a persistent, repository-aware memory infrastructure for autonomous coding agents. It:
- Remembers context across sessions
- Auto-extracts memories from git commits
- Enables semantic search over past decisions
- Hands off work between agents with structured context
- Auto-discovers tech stack and architecture

## How we built it
- **CockroachDB**: VECTOR(1024) for semantic memory, distributed SQL for structured data
- **AWS Bedrock**: Titan Embeddings v2 for 1024-dimensional vectors
- **Next.js 14**: TypeScript frontend with Tailwind CSS
- **Prisma ORM**: Type-safe database queries
- **MCP Protocol**: Integration with Claude Code, Codex, Cursor

## Challenges we ran into
- Schema-locked tables in CockroachDB required manual unlocking
- Balancing embedding costs with semantic search quality (solved with importance gating)
- Designing handoff documents that are both human-readable and machine-parseable

## Accomplishments that we're proud of
- 12 production-ready MCP tools
- Intelligent extraction from git commits with zero manual input
- Single database for both structured and semantic memory
- .atlas/ portable files as fallback when MCP server isn't connected
- Production deployment with full CI/CD

## What we learned
- CockroachDB's VECTOR type is production-ready for semantic search
- AWS Bedrock Titan v2 provides excellent embeddings at reasonable cost
- MCP protocol enables seamless multi-agent integration
- Importance-based embedding gates reduce costs without sacrificing quality

## What's next for Atlas 2.0
- Browser extension for inline memory suggestions
- IDE integrations (VS Code, JetBrains)
- Team collaboration features (shared memories, permission controls)
- SDK for custom agents beyond MCP
- Advanced retrieval strategies (hybrid search, re-ranking)
```

### Final Checks
- [ ] All required fields filled
- [ ] Video plays correctly
- [ ] Links work
- [ ] No placeholder text remaining
- [ ] Proofread for typos
- [ ] Submit before deadline: Aug 18, 2026

---

## Backup Plan

If demo video recording fails:
- [ ] Have screenshots of all key features ready
- [ ] Write detailed walkthrough in Devpost description
- [ ] Link to live demo prominently
- [ ] Emphasize technical architecture over demo

If MCP tools fail during recording:
- [ ] Show API routes working via curl/Postman
- [ ] Focus on UI and semantic search
- [ ] Explain MCP integration conceptually

If semantic search fails:
- [ ] Show structured memory (sessions, decisions)
- [ ] Explain vector embedding architecture
- [ ] Demo other features that work
