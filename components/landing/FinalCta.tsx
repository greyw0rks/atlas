import SceneStage from "../three/SceneStage";
import Reveal from "./Reveal";
import { REPO_URL } from "./content";

/**
 * SECTION 06 — Final call to action.
 *
 * The resolved structure: three frames and three rings that rotate into
 * orthogonal alignment and then hold almost still. It is the calmest scene on
 * the page on purpose — the closing beat should feel settled, not busy.
 */
export default function FinalCta() {
  return (
    <section className="atl-section relative overflow-hidden px-6 py-20 lg:py-28">
      <div
        className="atl-aura"
        style={{
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "42rem",
          height: "42rem",
          background:
            "radial-gradient(circle, rgba(139,124,255,0.24) 0%, rgba(49,117,198,0.12) 45%, transparent 72%)",
        }}
      />

      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <SceneStage
            scene="resolved-structure"
            className="atl-stage-frame mx-auto max-w-[600px]"
            label="Resolving"
          />
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-6 max-w-[46ch] text-center">
            <h2 className="atl-display text-[clamp(2rem,5vw,3.4rem)]">
              Give your AI a memory.
            </h2>
            <p className="atl-lede mx-auto mt-5 max-w-[42ch]">
              Atlas runs as an MCP server inside Claude Code and Codex. Your context stays
              where you put it, and it is still there next session.
            </p>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href="#install" className="atl-btn atl-btn-primary">
              Install Atlas
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="atl-btn atl-btn-ghost"
            >
              Explore the repository
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
