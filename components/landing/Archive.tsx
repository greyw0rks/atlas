import SceneStage from "../three/SceneStage";
import Reveal from "./Reveal";
import { ARCHIVE_LABELS } from "./content";

/**
 * SECTION 02 — What is Atlas.
 *
 * The architectural memory archive: stacked floors, lit tiles, and a pathway
 * that draws itself between them. Mirrors the hero's split (stage left this
 * time) so the page alternates rather than repeating.
 *
 * The labels below name only things the tool set actually provides, and each
 * one is printed with the tool that backs it — no screenshots of product UI.
 */
export default function Archive() {
  return (
    <section
      id="what-is-atlas"
      className="atl-section relative overflow-hidden px-6 py-20 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[55fr_45fr] lg:gap-14">
        <div className="relative order-first">
          <SceneStage
            scene="memory-archive"
            className="atl-stage-frame"
            label="Indexing archive"
          />

          <div
            className="pointer-events-none absolute inset-0 hidden lg:block"
            aria-hidden="true"
          >
            <span
              className="atl-float-label"
              style={{ top: "12%", right: "-4%", animationDelay: "0.6s" }}
            >
              Repository context
            </span>
            <span
              className="atl-float-label"
              style={{ top: "52%", left: "-4%", animationDelay: "2.1s" }}
            >
              Architectural decisions
            </span>
            <span
              className="atl-float-label"
              style={{ top: "82%", right: "4%", animationDelay: "3.4s" }}
            >
              Open tasks
            </span>
          </div>
        </div>

        <div>
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="atl-section-num">02</span>
              <span className="atl-section-label">What is Atlas</span>
              <span className="atl-hairline" aria-hidden="true" />
            </div>
            <h2 className="atl-display mt-6 text-[clamp(1.9rem,4.2vw,3rem)]">
              Your context shouldn&rsquo;t reset when the chat does.
            </h2>
            <p className="atl-lede mt-5 max-w-[50ch]">
              Atlas is an MCP server. It reads your repository, writes what
              matters to Walrus Memory, and hands the same context back the next
              time an agent opens the project.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <ul className="mt-9 space-y-3">
              {ARCHIVE_LABELS.map((entry) => (
                <li
                  key={entry.label}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[rgba(164,173,189,0.1)] pb-3 last:border-0"
                >
                  <span className="text-[0.9375rem] font-medium">{entry.label}</span>
                  <span className="atl-mono ml-auto text-[0.6875rem] text-[#a4adbd]/60">
                    {entry.hint}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={200}>
            <p className="atl-mono mt-8 text-[0.6875rem] leading-relaxed text-[#a4adbd]/70">
              Nine memory kinds are stored, each with an importance score and a
              resolved flag.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
