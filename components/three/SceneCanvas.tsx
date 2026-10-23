"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { disposeObject } from "./lib/glow";
import { damp } from "./lib/anim";
import { SCENE_BACKGROUND, type Quality, type SceneContext, type SceneDefinition, type SceneInstance } from "./types";

interface SceneCanvasProps {
  definition: SceneDefinition;
  /** Called when the renderer cannot be created or the GL context is lost. */
  onFailure?: () => void;
}

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
/** Frozen clock position used when motion is reduced — fully settled shot. */
const SETTLED_TIME = 24;

function readQuality(): Quality {
  if (typeof window === "undefined") return "high";
  return window.matchMedia(MOBILE_QUERY).matches ? "low" : "high";
}

/**
 * Owns one WebGL renderer for one section illustration.
 *
 * Responsibilities kept out of the individual scenes: device pixel ratio
 * capping, viewport observation (render only while on screen), pointer
 * parallax easing, resize handling, reduced-motion, and full GPU teardown.
 */
export default function SceneCanvas({ definition, onFailure }: SceneCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const definitionRef = useRef(definition);
  definitionRef.current = definition;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        // Transparent canvas: the scene composites over the page's own
        // gradients, so the stage has no visible rectangular edge.
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      onFailure?.();
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia(REDUCED_QUERY).matches;

    let quality = readQuality();
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let instance: SceneInstance | null = null;
    let frame = 0;
    let disposed = false;
    let lastTime = 0;
    let elapsed = 0;
    let onScreen = false;

    const pointerTarget = new THREE.Vector2();
    const pointer = new THREE.Vector2();

    const setup = (): boolean => {
      const def = definitionRef.current;
      scene = new THREE.Scene();
      // No scene.background: the renderer clears to transparent so the page
      // gradients remain visible behind the scene.
      // Fog gives every scene the same atmospheric depth falloff.
      scene.fog = new THREE.Fog(SCENE_BACKGROUND, 12, 34);

      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);

      const ctx: SceneContext = {
        scene,
        camera,
        renderer,
        pointer,
        quality,
        width: 1,
        height: 1,
        time: 0,
      };

      try {
        instance = def.factory(ctx);
      } catch (error) {
        console.error(`[atlas] scene "${def.name}" failed to build`, error);
        return false;
      }

      try {
        host.appendChild(renderer.domElement);
      } catch {
        return false;
      }
      return true;
    };

    const applyCamera = (): void => {
      const def = definitionRef.current;
      if (!camera) return;
      const width = host.clientWidth || 1;
      const isNarrow = width < 768;
      const base = def.camera;
      const override = isNarrow ? def.mobileCamera : undefined;

      camera.fov = override?.fov ?? base.fov;
      const position = override?.position ?? base.position;
      const lookAt = override?.lookAt ?? base.lookAt ?? [0, 0, 0];
      camera.position.set(position[0], position[1], position[2]);
      camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      camera.updateProjectionMatrix();
    };

    const resize = (): void => {
      if (!camera || !scene) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const nextQuality = readQuality();
      const maxDpr = nextQuality === "high" ? 1.75 : 1.4;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(width, height, false);

      camera.aspect = width / height;

      if (nextQuality !== quality) {
        quality = nextQuality;
      }

      applyCamera();
      camera.updateProjectionMatrix();

      instance?.resize?.({
        scene,
        camera,
        renderer,
        pointer,
        quality,
        width,
        height,
        time: elapsed,
      });
    };

    const context: () => SceneContext | null = () => {
      if (!scene || !camera) return null;
      return {
        scene,
        camera,
        renderer,
        pointer,
        quality,
        width: Math.max(1, host.clientWidth),
        height: Math.max(1, host.clientHeight),
        time: elapsed,
      };
    };

    const renderFrame = (now: number): void => {
      const ctx = context();
      if (!ctx || !instance) return;

      const rawDelta = lastTime ? (now - lastTime) / 1000 : 0;
      lastTime = now;
      const delta = Math.min(rawDelta, 1 / 20);

      elapsed = prefersReduced ? SETTLED_TIME : elapsed + delta;

      // Ease the pointer so parallax glides instead of snapping.
      pointer.x = damp(pointer.x, pointerTarget.x, 0.0015, delta);
      pointer.y = damp(pointer.y, pointerTarget.y, 0.0015, delta);
      ctx.time = elapsed;

      instance.update(ctx, delta);
      renderer.render(ctx.scene, ctx.camera);
    };

    const loop = (now: number): void => {
      if (disposed) return;
      frame = requestAnimationFrame(loop);
      renderFrame(now);
    };

    const start = (): void => {
      if (disposed || onScreen) return;
      onScreen = true;
      lastTime = 0;
      applyCamera();
      resize();
      frame = requestAnimationFrame(loop);
    };

    const stop = (): void => {
      onScreen = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    /* ── pointer parallax (desktop only, and never under reduced motion) ── */
    const onPointerMove = (event: PointerEvent): void => {
      if (prefersReduced || quality === "low") return;
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerTarget.x = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      pointerTarget.y = Math.max(
        -1,
        Math.min(1, -(((event.clientY - rect.top) / rect.height) * 2 - 1)),
      );
    };

    const onContextLost = (event: Event): void => {
      event.preventDefault();
      stop();
      onFailure?.();
    };

    if (!setup()) {
      renderer.dispose();
      renderer.forceContextLoss?.();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(SCENE_BACKGROUND, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.addEventListener("webglcontextlost", onContextLost);

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { rootMargin: "180px 0px" },
    );
    intersectionObserver.observe(host);

    if (quality === "high") {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    // Draw the very first frame synchronously so the section never flashes empty.
    resize();
    renderFrame(performance.now());

    return () => {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);

      instance?.dispose();
      if (scene) disposeObject(scene);

      renderer.dispose();
      renderer.forceContextLoss?.();
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [onFailure]);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
