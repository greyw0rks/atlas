import type * as THREE from "three";

export type Quality = "high" | "low";

/** Camera framing applied by the shared renderer for a given breakpoint. */
export interface CameraConfig {
  fov: number;
  position: [number, number, number];
  lookAt?: [number, number, number];
}

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** The owning renderer — scenes use it to bake shared environment maps. */
  renderer: THREE.WebGLRenderer;
  /** Pointer in NDC, range -1..1, already eased. */
  pointer: THREE.Vector2;
  quality: Quality;
  width: number;
  height: number;
  /** Seconds since the scene was first revealed. */
  time: number;
}

export interface SceneInstance {
  /** Called every animation frame while the stage is on screen. */
  update(ctx: SceneContext, delta: number): void;
  /** Called when the viewport or quality tier changes. */
  resize?(ctx: SceneContext): void;
  dispose(): void;
}

export type SceneFactory = (ctx: SceneContext) => SceneInstance;

export interface SceneDefinition {
  /** Unique id, used as the dynamic-import cache key. */
  name: string;
  factory: SceneFactory;
  camera: CameraConfig;
  /** Framing override used on narrow viewports. */
  mobileCamera?: Partial<CameraConfig>;
  /** Multiplies procedural element counts on the low quality tier. */
  density?: number;
}

/**
 * The shared renderer draws every scene as an opaque, near-black canvas that
 * matches the page background, so the 3D objects appear to float in the page
 * itself rather than inside a widget. Glow comes from additive sprites and
 * emissive materials rather than a bloom pass — same look, a fraction of the
 * cost, and no colour-space ambiguity when stacking render targets.
 */
export const SCENE_BACKGROUND = 0x090b10;
