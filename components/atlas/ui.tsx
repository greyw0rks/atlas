"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   Atlas UI primitives.
   House rules: depth via surface nesting + hairline strokes, never shadow.
   Accent (#FF4D15) is reserved for actions, active state and unread markers.
   ───────────────────────────────────────────────────────────────────────────── */

/** Page shell: warm canvas, with a floating rounded frame holding the bento. */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas p-4 md:p-8 font-sans text-ink">
      <div className="mx-auto w-full max-w-7xl rounded-5xl border border-stroke bg-frame p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

/** A bento cell on the frame — the mid surface tier. */
export function Panel({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-3xl border border-stroke bg-surface ${className}`}
    >
      {children}
    </div>
  );
}

/** A raised card nested inside a Panel — the top surface tier. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-stroke bg-raised ${className}`}>
      {children}
    </div>
  );
}

const PILL_BASE =
  "inline-flex items-center gap-2.5 rounded-full border border-stroke bg-raised px-4 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:text-muted-soft";

/** Outlined capsule button. */
export function Pill({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button className={`${PILL_BASE} ${className}`} {...props}>
      {children}
    </button>
  );
}

/** Outlined capsule that navigates. */
export function PillLink({
  children,
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link className={`${PILL_BASE} ${className}`} {...props}>
      {children}
    </Link>
  );
}

/** The one loud element on a screen: circular accent action. */
export function AccentButton({
  children,
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent text-black transition hover:bg-accent-hover active:scale-95 disabled:bg-muted-soft disabled:active:scale-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Uppercase micro meta-label used for section tags. */
export function MetaLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-[0.18em] text-muted ${className}`}
    >
      {children}
    </span>
  );
}

/** Small orange dot — unread / active / high-signal marker. */
export function AccentDot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent ${className}`}
    />
  );
}

/** ATLAS wordmark: extended tracking + a small capsule glyph. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="flex h-2.5 w-4 items-center justify-center rounded-full border border-ink"
      >
        <span className="h-1 w-1.5 rounded-full bg-ink" />
      </span>
      <span className="text-[10px] font-black uppercase tracking-brand text-ink">
        Atlas
      </span>
    </div>
  );
}

/** Editorial serif heading, optionally with the trailing prompt cursor. */
export function Display({
  children,
  caret = false,
  className = "",
}: {
  children: ReactNode;
  caret?: boolean;
  className?: string;
}) {
  return (
    <h2 className={`font-display tracking-tight text-ink ${className}`}>
      {children}
      {caret && <span aria-hidden className="caret" />}
    </h2>
  );
}

/** Kinds that earn the accent. Everything else stays monochrome so the
    accent ratio stays low enough to actually mean something. */
const HIGH_SIGNAL = new Set(["BUG", "SECURITY", "WARNING"]);

export function KindBadge({ kind }: { kind: string }) {
  const high = HIGH_SIGNAL.has(kind);
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
        high
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-stroke bg-surface text-muted"
      }`}
    >
      {kind.replace(/_/g, " ")}
    </span>
  );
}

/** Importance 1–5 as dots. Reads faster than star runs at this type scale. */
export function Importance({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Importance ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1 w-1 rounded-full ${
            n > value ? "bg-stroke" : value >= 4 ? "bg-accent" : "bg-ink-soft"
          }`}
        />
      ))}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`spinner block h-6 w-6 ${className}`}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-stroke bg-raised text-muted">
          {icon}
        </span>
      )}
      <Display className="mb-2 text-2xl">{title}</Display>
      {body && <p className="max-w-md text-xs leading-relaxed text-muted">{body}</p>}
      {children && <div className="mt-6 w-full max-w-2xl">{children}</div>}
    </div>
  );
}
