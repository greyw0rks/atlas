import SceneStage from "../three/SceneStage";
import Reveal from "./Reveal";

/**
 * SECTION 01 — Hero.
 *
 * Text column left, the layered-crystal-core illustration right, roughly 45/55.
 * On mobile the DOM order already puts the headline and both calls to action
 * above a shorter version of the same object.
 *
 * The floating labels are decorative echoes of the reference mockup; they are
 * `aria-hidden` because the same list is presented properly, with the tool that
 * backs each one, in section 02.
 */
export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-6 pb-16 pt-14 lg:pb-28 lg:pt-20">
      <div
        className="atl-aura"
        style={{
          top: "-10%",
          right: "-6%",
          width: "46rem",
          height: "46rem",
          background:
            "radial-gradient(circle, rgba(49,117,198,0.34) 0%, rgba(139,124,255,0.12) 45%, transparent 70%)",
        }}
      />
      <div
        className="atl-aura"
        style={{
          bottom: "-22%",
          left: "-14%",
          width: "34rem",
          height: "34rem",
          background:
            "radial-gradient(circle, rgba(139,124,255,0.24) 0%, transparent 68%)",
        }}
      />

      <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[45fr_55fr] lg:gap-8">
        <div className="relative z-10">
          <Reveal>
            <p className="atl-eyebrow">The memory layer for AI agents</p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="atl-display mt-6 text-[clamp(2.4rem,6.4vw,4.4rem)]">
              Your AI should remember what it learns.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="atl-lede mt-6 max-w-[46ch]">
              Atlas helps AI coding agents retain project context, decisions, and
              knowledge across working sessions.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#install" className="atl-btn atl-btn-primary">
                Install Atlas
              </a>
              <a href="#how-it-works" className="atl-btn atl-btn-ghost">
                Explore how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <p className="atl-mono mt-8 max-w-[48ch] text-[0.6875rem] leading-relaxed text-[#a4adbd]/70">
              An MCP server for Claude Code. Memories are written to Walrus
              Memory on mainnet, with the blob id kept as onchain proof.
            </p>
          </Reveal>
        </div>

        <div className="relative">
          <SceneStage
            scene="memory-core"
            className="atl-stage-hero"
            label="Assembling core"
          />

          <div
            className="pointer-events-none absolute inset-0 hidden lg:block"
            aria-hidden="true"
          >
            <div
              className="atl-float-card"
              style={{ top: "10%", left: "-6%", animationDelay: "0s" }}
            >
              <span className="atl-float-icon">◈</span>
              <span className="atl-float-copy">
                <strong>Repository context</strong>
                <em>Manifests, files, stack</em>
              </span>
            </div>
            <div
              className="atl-float-card"
              style={{ top: "44%", right: "-6%", animationDelay: "1.4s" }}
            >
              <span className="atl-float-icon">◇</span>
              <span className="atl-float-copy">
                <strong>Architectural decisions</strong>
                <em>Rationale on record</em>
              </span>
            </div>
            <div
              className="atl-float-card"
              style={{ bottom: "16%", left: "1%", animationDelay: "2.6s" }}
            >
              <span className="atl-float-icon">◉</span>
              <span className="atl-float-copy">
                <strong>Open tasks</strong>
                <em>TODOs and bugs</em>
              </span>
            </div>
            <div
              className="atl-float-card"
              style={{ bottom: "7%", right: "4%", animationDelay: "3.8s" }}
            >
              <span className="atl-float-icon">▣</span>
              <span className="atl-float-copy">
                <strong>Session handoffs</strong>
                <em>Built for the next agent</em>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
