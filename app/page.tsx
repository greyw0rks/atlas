import Archive from "@/components/landing/Archive";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Install from "@/components/landing/Install";
import Nav from "@/components/landing/Nav";
import Stream from "@/components/landing/Stream";
import UseCases from "@/components/landing/UseCases";

/**
 * The Atlas landing page.
 *
 * Server-rendered: all copy, the navigation and the install panel are in the
 * initial HTML, so nothing on this page waits on WebGL. Each of the six
 * illustrations is a separate lazily-loaded chunk that only arrives once its
 * section is within 600px of the viewport — see `components/three/SceneStage`.
 */
export default function Home() {
  return (
    <div className="atl-root">
      <div className="atl-noise" aria-hidden="true" />
      <a
        href="#what-is-atlas"
        className="atl-btn atl-btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70]"
      >
        Skip to content
      </a>

      <Nav />

      <main>
        <Hero />
        <Archive />
        <Stream />
        <Install />
        <UseCases />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}
