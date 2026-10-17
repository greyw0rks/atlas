import * as THREE from "three";
import { makeGlowSprite } from "./glow";

/**
 * A reusable three-point studio rig: every scene shares the same lighting
 * direction and colour temperature, which is what makes six different
 * compositions still read as one visual world.
 */
export interface StudioRig {
  group: THREE.Group;
  key: THREE.DirectionalLight;
  fill: THREE.PointLight;
  rim: THREE.PointLight;
  ambient: THREE.AmbientLight;
}

export function createStudioRig({
  intensity = 1,
  ambient = 0.35,
}: { intensity?: number; ambient?: number } = {}): StudioRig {
  const group = new THREE.Group();
  group.name = "studio-rig";

  const ambientLight = new THREE.AmbientLight(0x2b3a55, ambient);
  const key = new THREE.DirectionalLight(0xbcd4ff, 1.5 * intensity);
  key.position.set(-5, 7, 6);

  const fill = new THREE.PointLight(0x3175c6, 26 * intensity, 26, 2);
  fill.position.set(6, -3, 5);

  const rim = new THREE.PointLight(0x8b7cff, 30 * intensity, 26, 2);
  rim.position.set(-6, 2, -5);

  group.add(ambientLight, key, fill, rim);
  return { group, key, fill, rim, ambient: ambientLight };
}

/** A large soft pool of light used to seat objects in the scene. */
export function createLightPool(
  color: THREE.ColorRepresentation,
  size: number,
  opacity = 0.5,
): THREE.Sprite {
  const sprite = makeGlowSprite({ color, size, opacity });
  sprite.renderOrder = -1;
  return sprite;
}
