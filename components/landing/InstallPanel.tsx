"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  AUTOMATED_INSTALL,
  DOCS_URL,
  INSTALL_EFFECTS,
  INSTALL_WARNINGS,
  MANUAL_INSTALL,
  REPO_URL,
  SETTINGS_SNIPPET,
} from "./content";

type TabKey = "auto" | "manual";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "auto", label: "Automated" },
  { key: "manual", label: "Manual" },
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
      title: "Restart Claude Code",
      body: "The atlas server is read from settings.json on the next launch. Sessions are started by you, not by a hook.",
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
      body: "Add the snippet below to ~/.claude/settings.json yourself. This route skips the /atlas skill and leaves your CLAUDE.md alone.",
    },
  ],
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      } else {
        // Fallback for pages served over plain HTTP, where the async clipboard
        // API is unavailable.
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-1000px";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand("copy");
        document.body.removeChild(area);
      }
    } catch {
      ok = false;
    }

    setState(ok ? "copied" : "error");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }, [value]);

  return (
    <button
      type="button"
      className="atl-copy"
      onClick={copy}
      aria-label={label}
      aria-live="polite"
    >
      {state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy"}
    </button>
  );
}

function CommandBlock({
  title,
  commands,
  copyLabel,
}: {
  title: string;
  commands: string;
  copyLabel: string;
}) {
  return (
    <div className="atl-terminal">
      <div className="atl-terminal-bar">
        <span className="atl-dot" style={{ background: "#39414f" }} aria-hidden="true" />
        <span className="atl-dot" style={{ background: "#39414f" }} aria-hidden="true" />
        <span
          className="atl-dot"
          style={{ background: "rgba(139,124,255,0.8)" }}
          aria-hidden="true"
        />
        <span className="atl-mono ml-2 truncate text-[0.6875rem] text-[#a4adbd]/70">
          {title}
        </span>
        <span className="ml-auto flex-none">
          <CopyButton value={commands} label={copyLabel} />
        </span>
      </div>
      <pre className="atl-mono overflow-x-auto px-4 py-3.5 text-[0.75rem] leading-[1.75] text-[#e8eef8] sm:text-[0.8125rem]">
        <code>{commands}</code>
      </pre>
    </div>
  );
}

/**
 * The installation panel: two real routes, numbered steps, copy buttons that
 * work, and the exact JSON the installer writes. Nothing here is a placeholder
 * — the commands are the ones in `install.sh`, and the snippet is copied from
 * `mcp-server/install-config.cjs`.
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
        aria-label="Installation method"
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
            title={active === "auto" ? "atlas — install" : "atlas — manual"}
            commands={active === "auto" ? AUTOMATED_INSTALL : MANUAL_INSTALL}
            copyLabel={`Copy the ${active === "auto" ? "automated" : "manual"} install commands`}
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
        <a href={DOCS_URL} target="_blank" rel="noreferrer" className="atl-link">
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
