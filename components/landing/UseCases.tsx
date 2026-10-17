import SceneStage from "../three/SceneStage";
import Reveal from "./Reveal";
import { USE_CASES } from "./content";

/**
 * SECTION 05 — Use cases.
 *
 * A spatial constellation: five dispersed clusters joined by arcs, drawn with
 * the strongest parallax on the page. The four written clusters underneath are
 * the ones the implementation actually covers — there are no customer logos,
 * testimonials or adoption numbers here, because there are none to cite.
 */
export default function UseCases() {
  return (
    <section
      id="use-cases"
      className="atl-section relative overflow-hidden px-6 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="atl-section-num">05</span>
            <span className="atl-section-label">Use cases</span>
            <span className="atl-hairline" aria-hidden="true" />
          </div>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="atl-display max-w-[16ch] text-[clamp(1.9rem,4.2vw,3rem)]">
              Keep the knowledge. Continue the work.
            </h2>
            <p className="atl-lede max-w-[46ch]">
              Four things Atlas is actually built to hold on to, each one backed
              by a tool you can call today.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-12 max-w-[1240px] lg:mt-16">
        <SceneStage scene="use-case-constellation" className="atl-stage-frame" />
      </div>

      <div className="mx-auto mt-14 max-w-[1240px]">
        <div className="grid gap-6 sm:grid-cols-2">
          {USE_CASES.map((useCase, index) => (
            <Reveal key={useCase.title} delay={index * 90}>
              <article className="atl-card atl-card-hover h-full p-6">
                <h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">
                  {useCase.title}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[#a4adbd]">
                  {useCase.body}
                </p>
                <p className="atl-mono mt-5 text-[0.6875rem] text-[#6fb4ff]/80">
                  {useCase.tool}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
