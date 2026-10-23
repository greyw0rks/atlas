import SceneStage from "../three/SceneStage";
import Reveal from "./Reveal";
import { MEMORY_KINDS, STAGES } from "./content";

/**
 * SECTION 03 — How it works.
 *
 * The three-stage context stream: a capturing terminal, a glass transfer tube,
 * and a restoring terminal. The illustration is the widest composition on the
 * page, so it sits full-bleed beneath the heading while the three written
 * stages sit underneath in a grid.
 *
 * Each stage names the tools that carry it out, so the copy can be checked
 * against the server rather than taken on trust.
 */
export default function Stream() {
  return (
    <section
      id="how-it-works"
      className="atl-section relative overflow-hidden px-6 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="atl-section-num">03</span>
            <span className="atl-section-label">How it works</span>
            <span className="atl-hairline" aria-hidden="true" />
          </div>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="atl-display max-w-[18ch] text-[clamp(1.9rem,4.2vw,3rem)]">
              From one session to the next.
            </h2>
            <p className="atl-lede max-w-[46ch]">
              Context moves in one direction: it is captured from the
              repository, preserved onchain, and restored when work resumes.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-12 max-w-[1240px] lg:mt-16">
        <SceneStage
          scene="context-stream"
          className="atl-stage-frame"
          label="Opening stream"
        />
      </div>

      <div className="mx-auto mt-14 max-w-[1240px]">
        <ol className="grid gap-6 md:grid-cols-3">
          {STAGES.map((stage, index) => (
            <Reveal key={stage.index} delay={index * 110}>
              <li className="atl-card atl-card-hover h-full p-6">
                <div className="flex items-center gap-3">
                  <span className="atl-section-num">{stage.index}</span>
                  <span className="text-[1.0625rem] font-semibold tracking-[-0.015em]">
                    {stage.title}
                  </span>
                </div>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#a4adbd]">
                  {stage.body}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {stage.tools.map((tool) => (
                    <li key={tool} className="atl-chip">
                      {tool}
                    </li>
                  ))}
                </ul>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="atl-section-label">Memory kinds</span>
            {MEMORY_KINDS.map((kind) => (
              <span key={kind} className="atl-chip">
                {kind}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
