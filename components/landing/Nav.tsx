"use client";

import { useEffect, useState } from "react";
import { DOCS_URL, REPO_URL } from "./content";

const LINKS = [
  { href: "#what-is-atlas", label: "What is Atlas" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#install", label: "Install" },
  { href: "#use-cases", label: "Use cases" },
];

/** Sticky header. Gains a hairline border once the hero starts scrolling away. */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="atl-nav" data-scrolled={scrolled ? "true" : "false"}>
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 text-[0.9375rem] font-semibold tracking-[-0.02em] text-[#f4f6fa]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <defs>
              <linearGradient id="atlas-mark-g" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#6fb4ff" />
                <stop offset="1" stopColor="#8b7cff" />
              </linearGradient>
            </defs>
            <path
              d="M9 1.5 16.5 9 9 16.5 1.5 9Z"
              fill="none"
              stroke="url(#atlas-mark-g)"
              strokeWidth="1.1"
            />
            <path d="M9 5.4 12.6 9 9 12.6 5.4 9Z" fill="url(#atlas-mark-g)" />
          </svg>
          atlas
        </a>

        <nav aria-label="Sections" className="ml-4 hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="atl-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <a href={DOCS_URL} className="atl-nav-link">Docs</a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="atl-nav-link hidden sm:inline"
          >
            Repository
          </a>
          <a href="#install" className="atl-btn atl-btn-primary !px-4 !py-2 !text-[0.8125rem]">
            Install Atlas
          </a>
        </div>
      </div>
    </header>
  );
}
