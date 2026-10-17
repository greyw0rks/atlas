/**
 * Every published claim on the landing page lives here, and every one of them
 * was read out of the repository rather than written from memory.
 *
 * Where each fact comes from:
 *  - repo URL, default branch      → `git remote -v`, `origin/HEAD`
 *  - install command sequence      → `install.sh` (steps 1–9)
 *  - required credentials          → `.env.example`
 *  - the global binary name        → `mcp-server/package.json` (`bin.atlas-mcp`)
 *  - settings.json behaviour       → `mcp-server/install-config.cjs`
 *  - skill path                    → `install.sh` step 8
 *  - global CLAUDE.md handling     → `install.sh` step 9 (marker append)
 *  - the 15 tool names             → `mcp-server/index.ts`
 *  - the 9 memory kinds            → `lib/memory/kinds.ts`
 *  - where memory is stored        → `lib/memory/memwal.ts`, `lib/memory/writer.ts`
 *
 * README.md and INSTALL.md describe the same architecture; anything this page
 * claims that they disagree with is a bug on the page.
 */

export const REPO_URL = "https://github.com/greyw0rks/atlas";
export const DOCS_URL = "https://github.com/greyw0rks/atlas/tree/master/docs";
export const CLONE_COMMAND = `git clone ${REPO_URL}.git`;

/** The four commands from `install.sh`, in the order a new user runs them. */
export const AUTOMATED_INSTALL = [
  CLONE_COMMAND,
  "cd atlas",
  "cp .env.example .env   # MemWal delegate key + account id; Tatum key optional",
  "./install.sh",
].join("\n");

/** The individual steps `install.sh` performs, for a manual setup. */
export const MANUAL_INSTALL = [
  CLONE_COMMAND,
  "cd atlas && npm install && npm install --prefix mcp-server",
  "npx prisma generate && npx prisma db push",
  "npm run build --prefix mcp-server && npm link --prefix mcp-server",
].join("\n");

/**
 * What the installer does to your machine. Every line is a step in
 * `install.sh`. It edits your Claude Code config, so the two edits are stated
 * plainly rather than buried.
 */
export const INSTALL_EFFECTS = [
  "Installs dependencies for the root package and the MCP server",
  "Creates the local SQLite index with Prisma",
  "Builds the MCP server and links the global atlas-mcp command",
  "Registers the atlas server in ~/.claude/settings.json",
  "Removes hooks that reference HANDOFF.md, leaving your other hooks intact",
  "Installs the /atlas skill to ~/.claude/skills/atlas",
  "Appends an Atlas block to ~/.claude/CLAUDE.md, keeping your instructions",
];

/**
 * The exact object `mcp-server/install-config.cjs` writes — verified, not
 * paraphrased. It sets `settings.mcpServers.atlas` to this and nothing else.
 */
export const SETTINGS_SNIPPET = `{
  "mcpServers": {
    "atlas": {
      "command": "atlas-mcp"
    }
  }
}`;

/**
 * Two things a user should know before running the script. Read out of
 * `install.sh`: settings.json is copied aside before it is edited, and the
 * global ~/.claude/CLAUDE.md is appended to behind an `atlas:begin` marker,
 * never overwritten.
 */
export const INSTALL_WARNINGS = [
  "Your ~/.claude/settings.json is backed up first, as settings.json.backup-<date>.",
  "Your global ~/.claude/CLAUDE.md is appended to, not replaced. Existing instructions stay.",
];


/** Verified: `mcp-server/index.ts` registers exactly these tool names. */
export const TOOLS = [
  "atlas_start_session",
  "atlas_get_repository_context",
  "atlas_save_memory",
  "atlas_record_decision",
  "atlas_get_open_tasks",
  "atlas_get_recent_sessions",
  "atlas_update_context",
  "atlas_create_handoff",
  "atlas_search_memory",
  "atlas_end_session",
  "atlas_scan_repository",
  "atlas_extract_git_memories",
  "atlas_generate_atlas_md",
  "atlas_reconstruct_timeline",
  "atlas_verify_onchain",
] as const;

/** Verified: `lib/memory/kinds.ts` → MEMORY_KINDS. */
export const MEMORY_KINDS = [
  "ARCHITECTURE",
  "DECISION",
  "BUG",
  "TODO",
  "WARNING",
  "IMPORTANT_FILE",
  "DEPENDENCY",
  "SECURITY",
  "CONTEXT",
] as const;

/**
 * Labels for the archive illustration. Each one names something the tool set
 * above genuinely provides — no aspirational capabilities.
 */
export const ARCHIVE_LABELS = [
  { label: "Repository context", hint: "atlas_get_repository_context" },
  { label: "Architectural decisions", hint: "atlas_record_decision" },
  { label: "Open tasks", hint: "atlas_get_open_tasks" },
  { label: "Memory search", hint: "atlas_search_memory" },
  { label: "Session handoffs", hint: "atlas_create_handoff" },
  { label: "Tech stack", hint: "atlas_scan_repository" },
] as const;

/**
 * The three stages of the pipeline. Each maps to tools that exist, so the
 * illustration is describing real behaviour rather than an idealised flow.
 */
export const STAGES = [
  {
    index: "01",
    title: "Capture",
    body:
      "A session starts with the repository, not a blank slate. Atlas scans the project for its tech stack, reads back the last session's summary and open tasks, and extracts memories from git history.",
    tools: ["atlas_scan_repository", "atlas_extract_git_memories"],
  },
  {
    index: "02",
    title: "Preserve",
    body:
      "Decisions, bugs, warnings and important files are written as typed memories with an importance score. Each write goes to Walrus Memory on mainnet, and the returned blob id is kept on the local index as proof it is onchain.",
    tools: ["atlas_save_memory", "atlas_record_decision"],
  },
  {
    index: "03",
    title: "Restore",
    body:
      "When work resumes, context is read back — the repository summary, the tasks still open, recent sessions, and semantic search across everything written before. A handoff document can be generated for another agent.",
    tools: ["atlas_get_repository_context", "atlas_search_memory"],
  },
] as const;

/** Each cluster is backed by the tool named beneath it. */
export const USE_CASES = [
  {
    title: "Codebase understanding",
    body:
      "Atlas scans manifests and lockfiles to record the stack it finds, and flags the files a change is most likely to break.",
    tool: "atlas_scan_repository",
  },
  {
    title: "Architectural decisions",
    body:
      "Record why a choice was made and what the alternatives were, so the reasoning is still there when the diff is long forgotten.",
    tool: "atlas_record_decision",
  },
  {
    title: "Ongoing tasks",
    body:
      "TODOs and bugs are tracked as memories with an importance score, and can be marked resolved without being deleted.",
    tool: "atlas_get_open_tasks",
  },
  {
    title: "Project handoffs",
    body:
      "Generate a structured handoff from the session's context — built for the next agent, or your own next session.",
    tool: "atlas_create_handoff",
  },
] as const;
