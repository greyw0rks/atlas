import * as THREE from "three";

/**
 * Soft radial falloff sprite, generated locally on a canvas so the site never
 * depends on a remote asset that could disappear.
 */
let cachedTexture: THREE.Texture | null = null;

export function glowTexture(): THREE.Texture {
  if (cachedTexture) return cachedTexture;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.22, "rgba(255,255,255,0.5)");
    g.addColorStop(0.5, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cachedTexture = texture;
  return texture;
}

export interface GlowSpriteOptions {
  color: THREE.ColorRepresentation;
  size?: number;
  opacity?: number;
  depthWrite?: boolean;
}

/** Additive light bloom stand-in: cheap, and reads well over a near-black scene. */
export function makeGlowSprite({
  color,
  size = 1,
  opacity = 0.8,
  depthWrite = false,
}: GlowSpriteOptions): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite,
    depthTest: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

/** Disposes a subtree, including geometries, materials and textures it owns. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();

    const material = (mesh as unknown as { material?: THREE.Material | THREE.Material[] })
      .material;
    if (!material) return;

    const list = Array.isArray(material) ? material : [material];
    for (const entry of list) {
      // Shared textures (e.g. the cached glow sprite) are intentionally kept.
      for (const value of Object.values(entry)) {
        if (value instanceof THREE.Texture && value !== cachedTexture) {
          value.dispose();
        }
      }
      entry.dispose();
    }
  });
}
