"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Database,
  Zap,
  Layers,
  RotateCcw,
  Search,
  Boxes,
  Link2,
  Terminal,
} from "lucide-react";
import {
  Frame,
  Panel,
  Card,
  PillLink,
  MetaLabel,
  BrandMark,
  Display,
} from "@/components/atlas/ui";

const REPO_URL = "https://github.com/greyw0rks/atlas";

const FEATURES = [
  {
    icon: Database,
    title: "Persistent memory",
    body: "Architecture, decisions, bugs and TODOs survive the session that produced them. The next agent starts informed instead of asking again.",
  },
  {
    icon: Search,
    title: "Semantic recall",
    body: "Memories at importance 3 or above are embedded with Titan v2 and ranked by cosine distance, so 'auth' still finds the note that said 'login'.",
  },
  {
    icon: RotateCcw,
    title: "Structured handoffs",
    body: "Every session can close with a what-I-did / what-failed / what's-next document, mirrored to .atlas/ so it travels with the repository.",
  },
  {
    icon: Zap,
    title: "Heuristic extraction",
    body: "Conventional commits become memories without an LLM in the loop: fix: becomes a BUG, breaking change becomes a DECISION, security becomes SECURITY.",
  },
] as const;

const STEPS = [
  {
    n: "1",
    title: "Clone and build",
    code: `git clone ${REPO_URL}.git
cd atlas
npm install
cd mcp-server && npm run build`,
  },
  {
    n: "2",
    title: "Provide credentials",
    body: "Create a .env file in the project root. The database holds every memory; Bedrock only handles embeddings.",
    code: `DATABASE_URL="postgresql://user:password@cluster.cockroachlabs.cloud:26257/defaultdb?sslmode=require"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"`,
  },
  {
    n: "3",
    title: "Push the schema",
    code: `npx prisma db push
npx prisma generate`,
  },
  {
    n: "4",
    title: "Register the MCP server",
    body: "Add Atlas to your agent's settings. Any MCP client works — Claude Code, Codex, Cursor.",
    code: `{
  "mcpServers": {
    "atlas": {
      "command": "atlas-mcp",
      "env": {
        "DATABASE_URL": "postgresql://...",
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "...",
        "AWS_SECRET_ACCESS_KEY": "..."
      }
    }
  }
}`,
  },
] as const;

const TOOLS = [
  ["atlas_start_session", "Open a session and load context, last summary and open tasks"],
  ["atlas_end_session", "Close a session and write the .atlas/ projection files"],
  ["atlas_save_memory", "Store one fact under a kind, importance and tags"],
  ["atlas_record_decision", "Log a choice with its rationale and rejected alternatives"],
  ["atlas_search_memory", "Vector kNN over embedded memories"],
  ["atlas_get_repository_context", "Architecture, stack and constraints without a session"],
  ["atlas_update_context", "Revise architecture, constraints, stack or key files"],
  ["atlas_get_open_tasks", "Every unresolved TODO and BUG, most important first"],
  ["atlas_get_recent_sessions", "Recent sessions with summaries and counts"],
  ["atlas_scan_repository", "Infer the stack from manifests and the README"],
  ["atlas_extract_git_memories", "Turn conventional commits into memories"],
  ["atlas_create_handoff", "Generate the handoff document for the next agent"],
  ["atlas_generate_atlas_md", "Write ATLAS.md as a portable session primer"],
  ["atlas_reconstruct_timeline", "Replay every memory and decision by day"],
] as const;

const STACK = [
  ["CockroachDB", "VECTOR(1024) + distributed SQL", Database],
  ["AWS Bedrock", "Titan Embeddings v2", Boxes],
  ["MCP", "Claude Code, Codex, Cursor", Link2],
  ["Prisma", "Type-safe queries", Terminal],
] as const;

export default function LandingPage() {
  return (
    <Frame>
      <div className="flex flex-col gap-5">
        {/* ══════════════ HERO ══════════════ */}
        <Panel className="flex flex-col gap-8 p-6 md:p-10">
          <div className="flex items-center justify-between">
            <BrandMark />
            <div className="flex items-center gap-2">
              <PillLink href="/workspace" className="px-3 py-1.5">
                <span>Workspace</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
              </PillLink>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stroke bg-raised px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface"
              >
                <span>GitHub</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <MetaLabel>Built for the CockroachDB × AWS agentic memory challenge</MetaLabel>
              <Display className="text-4xl leading-[1.05] md:text-6xl">
                Your agent can write code.
                <br />
                <span className="text-muted">Atlas makes it remember why</span>
                <span aria-hidden className="caret" />
              </Display>
              <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
                Atlas is repository-aware memory infrastructure that runs beside your
                coding agent over MCP. It records decisions, tracks unfinished work, and
                hands context to whichever agent shows up next.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <PillLink href="/workspace" className="bg-ink px-5 py-3 text-canvas hover:bg-ink-soft">
                  <span className="font-bold uppercase tracking-widest">Open workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </PillLink>
                <PillLink href="#setup" className="px-5 py-3">
                  <span>Setup guide</span>
                </PillLink>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4">
              {(
                [
                  ["Store", "CockroachDB"],
                  ["Embeddings", "AWS Bedrock"],
                  ["Interface", "MCP"],
                ] as const
              ).map(([label, value]) => (
                <Card key={label} className="flex items-center justify-between px-4 py-3">
                  <MetaLabel>{label}</MetaLabel>
                  <span className="text-xs font-semibold text-ink">{value}</span>
                </Card>
              ))}
            </div>
          </div>
        </Panel>

        {/* ══════════════ WHAT IT DOES ══════════════ */}
        <Panel className="flex flex-col gap-8 p-6 md:p-10">
          <div className="flex flex-col gap-3">
            <MetaLabel className="text-ink">What it does</MetaLabel>
            <Display className="max-w-2xl text-2xl md:text-3xl">
              Four things a stateless agent cannot do
            </Display>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="flex flex-col gap-4 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-surface">
                  <Icon className="h-4 w-4 text-muted" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="text-xs leading-relaxed text-muted">{body}</p>
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        {/* ══════════════ SETUP ══════════════ */}
        <Panel id="setup" className="flex flex-col gap-8 p-6 md:p-10">
          <div className="flex flex-col gap-3">
            <MetaLabel className="text-ink">Setup</MetaLabel>
            <Display className="max-w-2xl text-2xl md:text-3xl">
              Connect Atlas to your agent
            </Display>
          </div>

          <div className="flex flex-col gap-4">
            {STEPS.map((step) => (
              <Card key={step.n} className="flex flex-col gap-4 p-6 md:flex-row md:gap-6">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ink font-mono text-xs font-bold text-canvas">
                  {step.n}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                  {"body" in step && step.body && (
                    <p className="text-xs leading-relaxed text-muted">{step.body}</p>
                  )}
                  <pre className="overflow-x-auto rounded-xl border border-stroke bg-surface p-4 font-mono text-[11px] leading-relaxed text-ink-soft">
                    {step.code}
                  </pre>
                </div>
              </Card>
            ))}

            <Card className="flex flex-col gap-4 border-accent/30 bg-accent/5 p-6 md:flex-row md:gap-6">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent">
                <Zap className="h-4 w-4 fill-current text-black" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-ink">Then just ask</h3>
                <p className="text-xs leading-relaxed text-ink-soft">
                  Restart your agent and say{" "}
                  <span className="font-medium">&ldquo;start an Atlas session&rdquo;</span>. It
                  loads the last summary, the open tasks and the decisions before it writes
                  a line of code.
                </p>
              </div>
            </Card>
          </div>
        </Panel>

        {/* ══════════════ TOOL REFERENCE ══════════════ */}
        <Panel className="flex flex-col gap-8 p-6 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-3">
              <MetaLabel className="text-ink">Reference</MetaLabel>
              <Display className="text-2xl md:text-3xl">
                {TOOLS.length} MCP tools
              </Display>
            </div>
            <Layers className="h-4 w-4 text-muted-soft" />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {TOOLS.map(([name, body]) => (
              <Card key={name} className="flex flex-col gap-2 p-5">
                <code className="font-mono text-xs font-semibold text-ink">{name}</code>
                <p className="text-xs leading-relaxed text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </Panel>

        {/* ══════════════ STACK ══════════════ */}
        <Panel className="flex flex-col gap-8 p-6 md:p-10">
          <div className="flex flex-col gap-3">
            <MetaLabel className="text-ink">Built with</MetaLabel>
            <Display className="text-2xl md:text-3xl">
              Memory that outlives the process
            </Display>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map(([name, detail, Icon]) => (
              <Card key={name} className="flex flex-col gap-4 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-surface">
                  <Icon className="h-4 w-4 text-muted" />
                </span>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-ink">{name}</h4>
                  <p className="text-xs text-muted">{detail}</p>
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        {/* ══════════════ FOOTER ══════════════ */}
        <Panel className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row md:p-8">
          <div className="flex items-center gap-4">
            <BrandMark />
            <span className="text-[11px] text-muted">MIT licensed</span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-muted">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              GitHub
            </a>
            <a
              href={`${REPO_URL}/blob/main/README.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              Documentation
            </a>
            <a href="#setup" className="transition-colors hover:text-ink">
              Setup
            </a>
          </div>
        </Panel>
      </div>
    </Frame>
  );
}
