/** Small maths + easing helpers shared by every scene. No dependencies. */

export const clamp01 = (value: number): number =>
  value < 0 ? 0 : value > 1 ? 1 : value;

export const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeOutExpo = (t: number): number =>
  t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeInOutSine = (t: number): number =>
  -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Frame-rate independent smoothing. `smoothing` is the fraction of the
 * remaining distance left after one second.
 */
export const damp = (
  current: number,
  target: number,
  smoothing: number,
  delta: number,
): number => lerp(current, target, 1 - Math.pow(smoothing, delta));

/** Progress of one item in a staggered reveal, clamped to 0..1. */
export function stagger(
  time: number,
  index: number,
  count: number,
  {
    delay = 0,
    duration = 1,
    spread = 0.7,
    easing = easeOutCubic,
  }: {
    delay?: number;
    duration?: number;
    spread?: number;
    easing?: (t: number) => number;
  } = {},
): number {
  const step = count > 1 ? spread / (count - 1) : 0;
  return easing(clamp01((time - delay - index * step) / duration));
}

/** Deterministic pseudo-random in [0,1) so layouts are stable across reloads. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
