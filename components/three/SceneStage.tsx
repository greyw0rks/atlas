"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { sceneLoaders, type SceneKey } from "./scenes";
import type { SceneDefinition } from "./types";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

interface SceneStageProps {
  /** Which illustration to mount — see `components/three/scenes/index.ts`. */
  scene: SceneKey;
  /** Extra classes for the stage wrapper (sizing lives with the caller). */
  className?: string;
  /** Shown while the scene is arming, and if WebGL is unavailable. */
  label?: string;
}

/**
 * Mounting gate for a section illustration.
 *
 * Nothing — not the scene chunk, not three.js, not the WebGL context — is
 * requested until the section is within 600px of the viewport. If the renderer
 * cannot start, the gradient fallback underneath stays visible and the rest of
 * the page is unaffected.
 */
export default function SceneStage({ scene, className, label }: SceneStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [definition, setDefinition] = useState<SceneDefinition | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!armed || definition) return;
    let cancelled = false;

    sceneLoaders[scene]()
      .then((loaded) => {
        if (!cancelled) setDefinition(loaded);
      })
      .catch((error: unknown) => {
        console.error(`[atlas] scene "${scene}" failed to load`, error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [armed, definition, scene]);

  const handleFailure = useCallback(() => setFailed(true), []);
  const live = Boolean(definition) && !failed;

  return (
    <div
      ref={hostRef}
      className={["atl-stage", live ? "atl-stage-live" : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="atl-stage-fallback">
        {failed ? <span>3D unavailable</span> : !definition ? <span>{label ?? ""}</span> : null}
      </div>
      {definition && !failed ? (
        <SceneCanvas definition={definition} onFailure={handleFailure} />
      ) : null}
    </div>
  );
}
