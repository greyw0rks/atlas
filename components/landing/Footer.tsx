import { DOCS_URL, REPO_URL } from "./content";

const LINKS = [
  { href: "#what-is-atlas", label: "What is Atlas" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#install", label: "Install" },
  { href: "#use-cases", label: "Use cases" },
];

export default function Footer() {
  return (
    <footer className="atl-footer">
      <div className="mx-auto max-w-[1240px] px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[0.9375rem] font-semibold tracking-[-0.02em] text-[#f4f6fa]">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <defs>
                  <linearGradient id="atlas-footer-g" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#6fb4ff" />
                    <stop offset="1" stopColor="#8b7cff" />
                  </linearGradient>
                </defs>
                <path
                  d="M9 1.5 16.5 9 9 16.5 1.5 9Z"
                  fill="none"
                  stroke="url(#atlas-footer-g)"
                  strokeWidth="1.1"
                />
                <path d="M9 5.4 12.6 9 9 12.6 5.4 9Z" fill="url(#atlas-footer-g)" />
              </svg>
              atlas
            </div>
            <p className="mt-4 max-w-[34ch] text-[0.875rem] leading-relaxed">
              Your context. Your AI. Always.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[0.8125rem] transition-colors hover:text-[#f4f6fa]"
              >
                {link.label}
              </a>
            ))}
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[0.8125rem] transition-colors hover:text-[#f4f6fa]"
            >
              Documentation
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[0.8125rem] transition-colors hover:text-[#f4f6fa]"
            >
              Repository
            </a>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[rgba(164,173,189,0.12)] pt-6 md:flex-row md:items-center md:justify-between">
          <p className="atl-mono text-[0.6875rem]">
            MCP server for Claude Code · Walrus Memory on mainnet · Tatum Sui RPC
          </p>
          <p className="atl-mono text-[0.6875rem]">
            Your context. Your AI. Always.
          </p>
        </div>
      </div>
    </footer>
  );
}
