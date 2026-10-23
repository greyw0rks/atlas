import type { SceneDefinition } from "../types";

/**
 * Scene registry.
 *
 * Every entry is a thunk, never a static import, so each illustration (and the
 * three.js modules it needs) lands in its own async chunk. The page's markup,
 * navigation and install command therefore render and become interactive
 * without three.js being downloaded at all — it only arrives once a section
 * gets within 600px of the viewport.
 */
export const sceneLoaders = {
  "memory-core": () =>
    import("./memoryCore").then((module) => module.memoryCoreScene),
  "memory-archive": () => import("./archive").then((module) => module.archiveScene),
  "context-stream": () => import("./stream").then((module) => module.streamScene),
  "installation-portal": () =>
    import("./portal").then((module) => module.portalScene),
  "use-case-constellation": () =>
    import("./constellation").then((module) => module.constellationScene),
  "resolved-structure": () =>
    import("./resolved").then((module) => module.resolvedScene),
} satisfies Record<string, () => Promise<SceneDefinition>>;

export type SceneKey = keyof typeof sceneLoaders;
