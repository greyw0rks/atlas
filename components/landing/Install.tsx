import SceneStage from "../three/SceneStage";
import Reveal from "./Reveal";
import InstallPanel from "./InstallPanel";

/**
 * SECTION 04 — Installation.
 *
 * A lit portal on the left, the real setup procedure on the right. Every
 * command, path and JSON key below was read out of `install.sh` and
 * `mcp-server/install-config.cjs`; none of it is illustrative.
 */
export default function Install() {
  return (
    <section
      id="install"
      className="atl-section relative overflow-hidden px-6 py-20 lg:py-28"
    >
      <div
        className="atl-aura"
        style={{
          top: "18%",
          left: "-10%",
          width: "38rem",
          height: "38rem",
          background:
            "radial-gradient(circle, rgba(49,117,198,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="atl-section-num">04</span>
            <span className="atl-section-label">Installation</span>
            <span className="atl-hairline" aria-hidden="true" />
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-8 grid max-w-[1240px] items-start gap-12 lg:grid-cols-[48fr_52fr] lg:gap-14">
        <div className="min-w-0 lg:sticky lg:top-24">
          <Reveal>
            <h2 className="atl-display text-[clamp(1.9rem,4.2vw,3rem)]">
              Install Atlas in four commands.
            </h2>
            <p className="atl-lede mt-5 max-w-[46ch]">
              Requires Node 18 or newer, a Walrus Memory delegate key and its
              account id. A Tatum API key is optional. The installer checks
              Node and npm, backs up ~/.claude/settings.json before editing it,
              and leaves your existing instructions in place.
            </p>
          </Reveal>

          <div className="relative mt-10">
            <SceneStage
              scene="installation-portal"
              className="atl-stage-frame"
              label="Opening portal"
            />
          </div>
        </div>

        {/* min-w-0 lets the command block's <pre> scroll instead of widening
            the grid track past the viewport on narrow screens. */}
        <Reveal delay={120} className="min-w-0">
          <InstallPanel />
        </Reveal>
      </div>
    </section>
  );
}
