"use client";

import {
  useCallback,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import CommandBlock from "./CommandBlock";
import {
  AUTOMATED_INSTALL,
  CODEX_COMMANDS,
  CODEX_SETTINGS,
  DOCS_URL,
  INSTALL_EFFECTS,
  INSTALL_WARNINGS,
  MANUAL_INSTALL,
  REPO_URL,
  SETTINGS_SNIPPET,
} from "./content";

type TabKey = "auto" | "manual" | "codex";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "auto", label: "Automated" },
  { key: "manual", label: "Manual" },
  { key: "codex", label: "Codex" },
];

/**
 * Steps as a reader experiences them. The automated route is the four commands
 * `install.sh` expects; the manual route is the same work done by hand, which
 * deliberately leaves out the parts of the script that write to your home
 * directory.
 */
const STEPS: Record<TabKey, Array<{ title: string; body: string }>> = {
  auto: [
    {
      title: "Clone the repository",
      body: "The app and the MCP server come down together — the server is built from the same checkout.",
    },
    {
      title: "Create your .env",
      body: "Copy .env.example and fill in the MemWal delegate key and account id. A Tatum API key is optional — the Sui gateway also answers keyless requests today. The script exits if .env is missing.",
    },
    {
      title: "Run the installer",
      body: "It installs dependencies, creates the SQLite index, builds the server, and links the global atlas-mcp command.",
    },
    {
      title: "Restart your coding agent",
      body: "The installer registers Atlas with Claude Code and Codex. Restart your client, then ask it to start an Atlas session.",
    },
  ],
  manual: [
    {
      title: "Clone the repository",
      body: "Same checkout, same layout.",
    },
    {
      title: "Install dependencies",
      body: "Both the root package and mcp-server have their own dependencies.",
    },
    {
      title: "Create the index",
      body: "Prisma generates the client and pushes the schema to the local SQLite file.",
    },
    {
      title: "Build and link",
      body: "Compiles the server and links it so atlas-mcp resolves on your PATH.",
    },
    {
      title: "Register the server",
      body: "Use the JSON below for Claude Code, or select the Codex tab for its CLI and TOML configuration. Manual setup leaves your agent instructions for you to add.",
    },
  ],
  codex: [
    {
      title: "Install Atlas first",
      body: "Complete the Automated or Manual steps with Node 20+ and your .env configured. The automated installer already registers Codex; use the command below if you installed manually or need to reconnect it.",
    },
    {
      title: "Register Atlas with Codex",
      body: "Run the commands below from the Atlas repository root. The absolute server path lets Codex use Atlas while you work in other projects. Confirm atlas appears in codex mcp list.",
    },
    {
      title: "Add session instructions",
      body: "Add the Atlas instructions from the Codex guide to ~/.codex/AGENTS.md, or to one project's AGENTS.md. The automated installer adds global instructions for you.",
    },
    {
      title: "Restart Codex and start a session",
      body: 'Open your project in a new Codex session and ask: "Start an Atlas session for this repository with agentId codex, and summarize previous work."',
    },
  ],
};

/**
 * Installation steps and client registration share commands with the docs.
 */
export default function InstallPanel() {
  const [active, setActive] = useState<TabKey>("auto");
  const steps = STEPS[active];

  const onTabKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const index = TABS.findIndex((tab) => tab.key === active);
      const next =
        event.key === "ArrowRight"
          ? TABS[(index + 1) % TABS.length]
          : TABS[(index - 1 + TABS.length) % TABS.length];
      setActive(next.key);
      document.getElementById(`install-tab-${next.key}`)?.focus();
    },
    [active],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Installation and client setup"
        className="flex gap-2"
        onKeyDown={onTabKeyDown}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`install-tab-${tab.key}`}
            aria-selected={active === tab.key}
            aria-controls={`install-panel-${tab.key}`}
            tabIndex={active === tab.key ? 0 : -1}
            className="atl-tab"
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`install-panel-${active}`}
        aria-labelledby={`install-tab-${active}`}
        className="mt-6"
      >
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li key={step.title} className="atl-step">
              <span className="atl-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <p className="text-[0.9375rem] font-medium">{step.title}</p>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-[#a4adbd]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-7 space-y-4">
          <CommandBlock
            title={active === "codex" ? "Atlas checkout — connect Codex" : `atlas — ${active}`}
            commands={active === "codex" ? CODEX_COMMANDS : active === "auto" ? AUTOMATED_INSTALL : MANUAL_INSTALL}
            copyLabel={active === "codex" ? "Copy the Codex registration commands" : `Copy the ${active === "auto" ? "automated" : "manual"} install commands`}
          />

          {active === "auto" ? (
            <>
              <div className="atl-card p-5">
                <p className="atl-section-label">What the script does</p>
                <ul className="mt-4 space-y-2.5">
                  {INSTALL_EFFECTS.map((effect) => (
                    <li
                      key={effect}
                      className="flex gap-3 text-[0.875rem] leading-relaxed text-[#a4adbd]"
                    >
                      <span
                        className="mt-[0.45rem] h-1 w-1 flex-none rounded-full bg-[#8b7cff]"
                        aria-hidden="true"
                      />
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="space-y-2">
                {INSTALL_WARNINGS.map((warning) => (
                  <li
                    key={warning}
                    className="atl-mono text-[0.6875rem] leading-relaxed text-[#a4adbd]/80"
                  >
                    <span className="text-[#6fb4ff]">!</span> {warning}
                  </li>
                ))}
              </ul>
            </>
          ) : active === "codex" ? (
            <>
              <p className="text-sm leading-relaxed text-[#a4adbd]">
                Alternatively, if atlas-mcp is linked on your PATH, add this
                table to ~/.codex/config.toml. Use one registration method;
                update an existing atlas table instead of adding a duplicate.
              </p>
              <CommandBlock
                title="~/.codex/config.toml — alternative"
                commands={CODEX_SETTINGS}
                copyLabel="Copy the Codex config.toml snippet"
              />
              <a href={`${DOCS_URL}#codex`} className="atl-link">
                Codex guide and AGENTS.md instructions
              </a>
            </>
          ) : (
            <>
              <CommandBlock
                title="~/.claude/settings.json"
                commands={SETTINGS_SNIPPET}
                copyLabel="Copy the settings.json snippet"
              />
              <p className="atl-mono text-[0.6875rem] leading-relaxed text-[#a4adbd]/80">
                Add this under the existing mcpServers key. atlas-mcp is the
                binary linked in step 4.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a href="/local-dashboard" className="atl-link">
          Run the local dashboard
        </a>
        <a href={DOCS_URL} className="atl-link">
          Read the documentation
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="atl-link !border-transparent !text-[#a4adbd] hover:!text-white"
        >
          Browse the source
        </a>
      </div>
    </div>
  );
}
