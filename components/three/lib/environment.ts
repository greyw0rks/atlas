import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * One image-based lighting environment shared by every scene on the page.
 *
 * Without an environment map, `metalness > 0` materials render black. Baking a
 * neutral studio probe once and reusing it is what makes the brushed metal,
 * dark ceramic and glass surfaces read as physically believable — and it costs
 * a single PMREM generation per renderer rather than one per scene.
 */
const cache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

export function sharedEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const cached = cache.get(renderer);
  if (cached) return cached;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const room = new RoomEnvironment();
  const target = pmrem.fromScene(room, 0.04);
  room.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!material) return;
    for (const entry of Array.isArray(material) ? material : [material]) {
      entry.dispose();
    }
  });
  pmrem.dispose();

  cache.set(renderer, target.texture);
  return target.texture;
}

/** Applies the shared environment plus a consistent exposure to a scene. */
export function applyEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  scene.environment = sharedEnvironment(renderer);
  scene.environmentIntensity = 0.55;
}
