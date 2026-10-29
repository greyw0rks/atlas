"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

export default function CommandBlock({
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

