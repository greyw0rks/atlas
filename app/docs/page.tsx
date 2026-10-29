import type { Metadata } from "next";
import Link from "next/link";
import CommandBlock from "@/components/landing/CommandBlock";
import {
  CODEX_COMMANDS,
  CODEX_INSTRUCTIONS,
  CODEX_SETTINGS,
  MANUAL_INSTALL,
  MEMORY_KINDS,
  REPO_URL,
  SETTINGS_SNIPPET,
} from "@/components/landing/content";

const DESCRIPTION =
  "Install Atlas, connect it to Codex or Claude Code, and save and recall project memory with the MCP tools.";

export const metadata: Metadata = {
  title: "Documentation",
  description: DESCRIPTION,
  openGraph: { title: "Documentation · Atlas", description: DESCRIPTION },
  twitter: { title: "Documentation · Atlas", description: DESCRIPTION },
};

const SECTIONS = [
  ["installation", "Install Atlas"],
  ["codex", "Connect Codex"],
  ["claude-code", "Connect Claude Code"],
  ["workflow", "Your first session"],
  ["tools", "MCP tool reference"],
  ["storage", "Storage and recall"],
  ["dashboard", "Local dashboard"],
  ["troubleshooting", "Troubleshooting"],
] as const;

const TOOL_REFERENCE = [
  ["atlas_start_session", "Start work with repoPath, repoName, and agentId. Returns sessionId, repoId, previous work, open tasks, and decisions."],
  ["atlas_get_repository_context", "Read a repository's saved context without starting a session."],
  ["atlas_save_memory", "Save a typed memory with sessionId, repoId, kind, content, an importance score from 1 to 5, and optional tags."],
  ["atlas_record_decision", "Record a decision's title, rationale, and alternatives for the current session and repository."],
  ["atlas_get_open_tasks", "List unresolved TODO and BUG memories for a repository."],
  ["atlas_get_recent_sessions", "Read recent session summaries and memory and decision counts."],
  ["atlas_update_context", "Update architecture, constraints, techStack, or importantFiles in repository context."],
  ["atlas_create_handoff", "Generate a handoff describing completed work, failures, next steps, and relevant context."],
  ["atlas_search_memory", "Recall memory text by meaning through Walrus Memory and attach available local metadata."],
  ["atlas_end_session", "Finish the session with a summary and optional handoff. Writes portable .atlas/ files in the repository."],
  ["atlas_scan_repository", "Inspect a repository's stack, README, and important files and update its context."],
  ["atlas_extract_git_memories", "Extract memories from recent commits and changed files."],
  ["atlas_generate_atlas_md", "Write ATLAS.md with the project's context, constraints, tasks, and decisions."],
  ["atlas_reconstruct_timeline", "Read a chronological timeline of the repository's memories and decisions."],
  ["atlas_verify_onchain", "Look up Sui object IDs and transaction digests through Tatum and return verification details."],
] as const;

export default function Documentation() {
  return (
    <div className="atl-root atl-docs min-h-screen">
      <a href="#documentation" className="atl-btn atl-btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70]">
        Skip to documentation
      </a>
      <header className="border-b border-[#a4adbd]/15">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">atlas <span className="ml-2 text-sm font-normal text-[#a4adbd]">/ docs</span></Link>
          <a href={REPO_URL} className="atl-link" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <aside>
          <nav aria-label="Documentation sections" className="lg:sticky lg:top-8">
            <p className="atl-section-label !mt-0">Documentation</p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3 lg:flex-col">
              {SECTIONS.map(([id, label]) => (
                <li key={id}><a href={`#${id}`} className="atl-nav-link">{label}</a></li>
              ))}
            </ul>
          </nav>
        </aside>

        <main id="documentation" className="min-w-0">
          <h1 className="atl-display text-[clamp(2.4rem,6vw,3.8rem)]">Make project memory part of your workflow.</h1>
          <p className="atl-lede mt-6">
            Atlas is a local MCP server for coding agents. It saves project
            knowledge, decisions, and tasks so your next session can pick up
            where you left off. Start with installation, then connect your client.
          </p>
          <a href="#codex" className="atl-btn atl-btn-primary mt-6">Set up Atlas in Codex</a>

          <section id="installation" className="atl-docs-section" aria-labelledby="installation-title">
            <h2 id="installation-title">Install Atlas</h2>
            <p>
              You need Node.js 20 or newer, npm, and an MCP client. For remote
              storage and semantic recall, create a delegate key and account in
              the <a href="https://memory.walrus.xyz/dashboard" className="atl-link" target="_blank" rel="noreferrer">Walrus Memory dashboard</a>.
              The local index uses SQLite; no database server is required.
            </p>
            <h3>1. Get the current release</h3>
            <CommandBlock
              title="Terminal"
              commands={`git clone --branch feat/cinematic-landing ${REPO_URL}.git\ncd atlas\ncp .env.example .env`}
              copyLabel="Copy the repository setup commands"
            />
            <h3>2. Configure .env</h3>
            <p>
              Edit the file in your Atlas checkout before running the installer.
              Use the MemWalAccount object ID for MEMWAL_ACCOUNT_ID. The delegate
              public key will cause authentication errors. Keep the private key
              in this local, gitignored file.
            </p>
            <CommandBlock
              title=".env — replace the credential placeholders"
              commands={'DATABASE_URL="file:./dev.db"\nMEMWAL_PRIVATE_KEY="<your delegate private key>"\nMEMWAL_ACCOUNT_ID="0x<your account object id>"\nTATUM_API_KEY=""'}
              copyLabel="Copy the environment variable template"
            />
            <p>
              TATUM_API_KEY is optional and recommended for Sui RPC access.
              Atlas sends it as x-api-key when configured; keyless availability
              depends on the gateway.
            </p>
            <h3>3. Run the installer</h3>
            <CommandBlock title="Atlas checkout" commands="./install.sh" copyLabel="Copy the installer command" />
            <p>
              The installer builds and links atlas-mcp, creates the SQLite
              schema, registers Claude Code and Codex, and adds global session
              instructions. It backs up Claude settings before editing them,
              removes hooks that reference HANDOFF.md, and installs the /atlas
              skill for Claude Code. Restart your client after installation.
            </p>
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium">Manual installation</summary>
              <p>Run these steps from a new checkout, pausing after copying .env to fill in your credentials. Then register your client below and add its session instructions.</p>
              <CommandBlock title="Terminal — manual setup" commands={MANUAL_INSTALL} copyLabel="Copy the manual installation commands" />
            </details>
          </section>

          <section id="codex" className="atl-docs-section" aria-labelledby="codex-title">
            <h2 id="codex-title">Connect Atlas to Codex</h2>
            <p>
              Complete installation first. If you ran ./install.sh, Codex
              registration and global instructions are already added. Confirm
              the server with <code>codex mcp list</code>, then restart Codex.
              For a manual install or an existing Codex setup, follow these steps.
            </p>
            <h3>1. Register the MCP server</h3>
            <p>
              From the Atlas repository root, run the commands below. They save
              an absolute server path in ~/.codex/config.toml so Atlas also
              works when Codex opens another project.
            </p>
            <CommandBlock title="Atlas checkout — Codex CLI" commands={CODEX_COMMANDS} copyLabel="Copy the Codex registration commands" />
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium">Alternative: edit config.toml</summary>
              <p>
                If atlas-mcp is on your PATH after npm link, add this table to
                ~/.codex/config.toml. Choose the CLI or this method. If an atlas
                table already exists, update it rather than adding a duplicate.
              </p>
              <CommandBlock title="~/.codex/config.toml" commands={CODEX_SETTINGS} copyLabel="Copy the Codex config.toml snippet" />
            </details>
            <h3>2. Add instructions for each session</h3>
            <p>
              Append this block to ~/.codex/AGENTS.md for all projects, or to
              AGENTS.md in a single repository. Keep your existing instructions;
              if an Atlas block is already there, update that block.
            </p>
            <CommandBlock title="AGENTS.md" commands={CODEX_INSTRUCTIONS} copyLabel="Copy the Atlas AGENTS.md instructions" />
            <h3>3. Restart Codex and verify</h3>
            <p>
              Start a new Codex session in the project you want Atlas to
              remember. Ask it to run the prompt below. A successful tool call
              returns a session ID and repository ID. A new repository may have
              no previous session yet.
            </p>
            <CommandBlock
              title="Prompt for Codex"
              commands={'Start an Atlas session for this repository with agentId "codex".\nSummarize the previous session, open tasks, and key decisions.'}
              copyLabel="Copy the first Codex session prompt"
            />
          </section>

          <section id="claude-code" className="atl-docs-section" aria-labelledby="claude-title">
            <h2 id="claude-title">Connect Claude Code</h2>
            <p>
              The automated installer registers Atlas in ~/.claude/settings.json,
              adds global instructions in ~/.claude/CLAUDE.md, and installs the
              /atlas skill. Restart Claude Code and run /atlas.
            </p>
            <p>
              For manual setup, merge the atlas entry below into your existing
              mcpServers configuration. The atlas-mcp command must be on PATH.
              Ask Claude Code to start and end Atlas sessions, or add those
              instructions to CLAUDE.md with agentId set to &quot;claude-code&quot;.
            </p>
            <CommandBlock title="~/.claude/settings.json" commands={SETTINGS_SNIPPET} copyLabel="Copy the Claude Code settings snippet" />
          </section>

          <section id="workflow" className="atl-docs-section" aria-labelledby="workflow-title">
            <h2 id="workflow-title">Your first session</h2>
            <p>
              Atlas records what your agent sends to its tools. Session
              instructions help the agent use them consistently; Atlas does not
              automatically capture every conversation.
            </p>
            <ol className="list-decimal space-y-4 pl-5 text-[#a4adbd]">
              <li><strong className="text-[#f4f6fa]">Start:</strong> ask the agent to start a session for your repository and review its previous context. For a new project, ask it to scan the repository.</li>
              <li><strong className="text-[#f4f6fa]">Save:</strong> ask it to record useful facts, bugs, tasks, and decisions as you work. A successful remote write returns a blobId and storedOnWalrus: true.</li>
              <li><strong className="text-[#f4f6fa]">Recall:</strong> ask it to search Atlas for a topic, such as previous authentication decisions.</li>
              <li><strong className="text-[#f4f6fa]">Finish:</strong> ask it to create a handoff and end the session with a summary. The next session can retrieve that work.</li>
            </ol>
            <CommandBlock
              title="Example prompts during work"
              commands={"Save an ARCHITECTURE memory describing how the API shares data with the dashboard.\nRecord the decision we just made, including its rationale and alternatives.\nSearch Atlas for previous decisions about authentication.\nCreate a handoff, then end this Atlas session with a summary."}
              copyLabel="Copy the Atlas workflow prompts"
            />
          </section>

          <section id="tools" className="atl-docs-section" aria-labelledby="tools-title">
            <h2 id="tools-title">MCP tool reference</h2>
            <p>
              Atlas exposes 15 tools. Your MCP client reads their input schemas;
              use the sessionId and repoId returned by atlas_start_session for
              later calls that require them.
            </p>
            <dl className="divide-y divide-[#a4adbd]/15">
              {TOOL_REFERENCE.map(([tool, description]) => (
                <div key={tool} className="py-4">
                  <dt className="atl-mono break-words text-sm text-[#d2caff]">{tool}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[#a4adbd]">{description}</dd>
                </div>
              ))}
            </dl>
            <p>Memory kinds: {MEMORY_KINDS.join(", ")}. Use an importance score from 1 to 5 and optional tags to organize memories.</p>
          </section>

          <section id="storage" className="atl-docs-section" aria-labelledby="storage-title">
            <h2 id="storage-title">Storage and recall</h2>
            <p>
              Walrus Memory stores uploaded memory text and provides semantic
              recall. Its relayer handles embeddings, encryption, and Walrus
              storage on Sui Mainnet. SQLite holds your local session history,
              context, memory copies, tasks, and verification metadata.
            </p>
            <ul className="list-disc space-y-3 pl-5 text-[#a4adbd]">
              <li>A record with blobId: null or storedOnWalrus: false has no confirmed remote copy. It remains in your local index.</li>
              <li>Semantic search requires Walrus Memory; there is no local semantic search fallback.</li>
              <li>Back up your SQLite file. Full reconstruction of local metadata from Walrus is not implemented.</li>
              <li>Machines using the same Memory account can recall uploaded text. Local histories and metadata do not automatically sync.</li>
              <li>Recall namespaces use repository names. Give unrelated projects distinct names.</li>
            </ul>
            <p>
              Tatum checks Sui object IDs and transaction digests referenced in
              memories. Those checks describe the referenced chain data at the
              time of lookup; they do not validate every claim in a memory.
            </p>
          </section>

          <section id="dashboard" className="atl-docs-section" aria-labelledby="dashboard-title">
            <h2 id="dashboard-title">Run the local dashboard</h2>
            <p>From your configured Atlas checkout, start the web app:</p>
            <CommandBlock title="Atlas checkout" commands="npm run dev" copyLabel="Copy the dashboard start command" />
            <p>
              Open <a href="http://localhost:3000/workspace" className="atl-link">localhost:3000/workspace</a> to
              browse your repositories, sessions, tasks, decisions, and memories.
              The dashboard shares the MCP server&apos;s local SQLite index.
              The hosted Atlas website serves documentation; the memory dashboard
              and its API run on your machine.
            </p>
          </section>

          <section id="troubleshooting" className="atl-docs-section" aria-labelledby="troubleshooting-title">
            <h2 id="troubleshooting-title">Troubleshooting</h2>
            <h3>Codex cannot find Atlas</h3>
            <p>
              Run codex mcp list. If atlas is missing, register it from the
              Atlas checkout using the CLI command above and restart Codex.
              If the server file is missing, run npm run build --prefix mcp-server
              from that checkout before registering it.
            </p>
            <h3>atlas-mcp: command not found</h3>
            <p>
              Restart your terminal after npm link --prefix mcp-server, or use
              the Codex CLI command with the absolute Node entry point shown
              above. That method does not require the global atlas-mcp link.
            </p>
            <h3>Memory writes fail or return no blob ID</h3>
            <p>
              Check your Atlas checkout&apos;s .env and network connection.
              MEMWAL_ACCOUNT_ID must be the account object ID, not the delegate
              public key. Verify the delegate key belongs to that account and
              restart your client after changing credentials. A local save alone
              does not confirm storage on Walrus.
            </p>
            <h3>Tatum reports an authentication error</h3>
            <p>Add a valid TATUM_API_KEY to .env and restart your client. Verification errors are returned per reference.</p>
            <h3>Update an existing installation</h3>
            <CommandBlock
              title="Atlas checkout — update"
              commands={"git pull\nnpm install\nnpm install --prefix mcp-server\nnpm run build --prefix mcp-server"}
              copyLabel="Copy the Atlas update commands"
            />
            <p>Restart Codex or Claude Code after rebuilding. Keep the checkout at the registered path, or register it again if you move it.</p>
          </section>
          <footer className="mt-12 flex flex-wrap gap-6 border-t border-[#a4adbd]/15 pt-8">
            <Link href="/" className="atl-link">Back to Atlas</Link>
            <a href={`${REPO_URL}/blob/feat/cinematic-landing/INSTALL.md`} className="atl-link" target="_blank" rel="noreferrer">Installation guide on GitHub</a>
          </footer>
        </main>
      </div>
    </div>
  );
}
