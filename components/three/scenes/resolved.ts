import * as THREE from "three";
import { createHaloMaterial, createFilamentMaterial, tickShaderTime } from "../lib/materials";
import { createLightPool, createStudioRig } from "../lib/lighting";
import { glowTexture, makeGlowSprite } from "../lib/glow";
import { applyEnvironment } from "../lib/environment";
import { clamp01, easeOutCubic, easeOutExpo, lerp, seededRandom, smoothstep } from "../lib/anim";
import type { SceneDefinition, SceneInstance } from "../types";

/**
 * SECTION 06 — The resolved structure.
 *
 * Three square frames and three rings that begin scattered and rotate into
 * orthogonal alignment around a small bright core. The movement is the whole
 * idea: everything resolves, then holds almost still. Deliberately the least
 * busy scene on the page — the final beat should feel settled, not active.
 */

const FRAME_HALF = 1.6;
const FRAME_BAR = 0.04;
const FRAME_DEPTH = 0.026;

interface Layer {
  object: THREE.Object3D;
  from: THREE.Euler;
  to: THREE.Euler;
}

/** A square frame assembled from four bars. */
function buildSquare(half: number, bar: number, depth: number, material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const spans: Array<[number, number, number, number]> = [
    [0, half, half * 2 + bar, bar],
    [0, -half, half * 2 + bar, bar],
    [-half, 0, bar, half * 2],
    [half, 0, bar, half * 2],
  ];
  for (const [x, y, w, h] of spans) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), material);
    mesh.position.set(x, y, 0);
    group.add(mesh);
  }
  return group;
}

export const resolvedScene: SceneDefinition = {
  name: "resolved-structure",
  camera: { fov: 40, position: [0.35, 0.5, 8.0], lookAt: [0, 0, 0] },
  mobileCamera: { fov: 50, position: [0.3, 0.9, 11.4], lookAt: [0, 0, 0] },
  density: 0.45,
  factory(ctx): SceneInstance {
    const { scene } = ctx;
    applyEnvironment(scene, ctx.renderer);

    const density = ctx.quality === "low" ? 0.45 : 1;
    const lowQuality = ctx.quality === "low";

    scene.add(createStudioRig({ intensity: 1.05, ambient: 0.4 }).group);

    const root = new THREE.Group();
    scene.add(root);

    const random = seededRandom(1965);
    const layers: Layer[] = [];
    const frameMaterials: THREE.MeshStandardMaterial[] = [];
    const ringMaterials: THREE.MeshBasicMaterial[] = [];

    /* ── three interlocking square frames ─────────────────────────────── */
    // Targets are the three orthogonal planes: settled, everything lines up.
    const frameTargets: Array<[number, number, number]> = [
      [0, 0, 0],
      [0, Math.PI / 2, 0],
      [Math.PI / 2, 0, 0],
    ];

    for (let i = 0; i < 3; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: 0x9fc2ef,
        metalness: 0.4,
        roughness: 0.14,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      frameMaterials.push(material);

      const frame = buildSquare(FRAME_HALF, FRAME_BAR, FRAME_DEPTH, material);
      const [tx, ty, tz] = frameTargets[i];
      frame.rotation.set(tx, ty, tz);
      root.add(frame);

      layers.push({
        object: frame,
        to: new THREE.Euler(tx, ty, tz),
        from: new THREE.Euler(
          tx + (random() - 0.5) * 1.6,
          ty + (random() - 0.5) * 1.6,
          tz + (random() - 0.5) * 1.6,
        ),
      });
    }

    /* ── three rings that ring the frames ─────────────────────────────── */
    const ringTargets: Array<[number, number, number]> = [
      [Math.PI / 2, 0, 0],
      [0, 0, 0],
      [0, Math.PI / 2, 0],
    ];

    for (let i = 0; i < 3; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x8b7cff : 0x5f9fe8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      ringMaterials.push(material);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(FRAME_HALF * 1.24 + i * 0.16, 0.012, 6, lowQuality ? 48 : 96),
        material,
      );
      const [tx, ty, tz] = ringTargets[i];
      ring.rotation.set(tx, ty, tz);
      root.add(ring);

      layers.push({
        object: ring,
        to: new THREE.Euler(tx, ty, tz),
        from: new THREE.Euler(
          tx + (random() - 0.5) * 2.2,
          ty + (random() - 0.5) * 2.2,
          tz + (random() - 0.5) * 2.2,
        ),
      });
    }

    /* ── the small resolved core ──────────────────────────────────────── */
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({
        color: 0xeaf2ff,
        emissive: new THREE.Color(0x7cc0ff),
        emissiveIntensity: 3.2,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 0,
      }),
    );
    root.add(core);

    const coreHalo = createHaloMaterial("#93c4ff");
    coreHalo.uniforms.uOpacity.value = 0;
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 16), coreHalo);
    root.add(halo);

    const coreGlow = makeGlowSprite({ color: "#a8d0ff", size: 3.2, opacity: 0 });
    root.add(coreGlow);

    /* ── axle filaments: six short spokes along the aligned axes ──────── */
    const axlePoints: number[] = [];
    const axleLength = FRAME_HALF * 1.55;
    for (const axis of [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]) {
      axlePoints.push(
        -axis[0] * axleLength, -axis[1] * axleLength, -axis[2] * axleLength,
        axis[0] * axleLength, axis[1] * axleLength, axis[2] * axleLength,
      );
    }
    const axleGeometry = new THREE.BufferGeometry();
    axleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(axlePoints), 3),
    );
    const axleMaterial = createFilamentMaterial("#4d7fbe", 0);
    root.add(new THREE.LineSegments(axleGeometry, axleMaterial));

    /* ── the sparsest dust on the page ────────────────────────────────── */
    const dustCount = Math.round(340 * density);
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const radius = 3.6 + random() * 4.4;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      dustPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = radius * Math.cos(phi) * 0.7;
      dustPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x9dc6ff,
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: glowTexture(),
    });
    root.add(new THREE.Points(dustGeometry, dustMaterial));

    const pool = createLightPool("#2f6cc0", 15, 0.24);
    pool.position.set(0, -0.6, -3);
    root.add(pool);

    return {
      update(context, delta) {
        const { time, pointer } = context;
        const intro = easeOutExpo(clamp01(time / 2.0));
        // Alignment is the payoff, so it happens after the structure appears.
        const align = easeOutCubic(smoothstep(0.5, 1.0, intro));

        tickShaderTime(root, time);

        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          layer.object.rotation.set(
            lerp(layer.from.x, layer.to.x, align),
            lerp(layer.from.y, layer.to.y, align),
            lerp(layer.from.z, layer.to.z, align),
          );
        }

        // Once aligned, a barely-there oscillation keeps it alive without
        // disturbing the settled read. Frames drift; rings spin slowly.
        const held = align > 0.995;
        for (let i = 0; i < 3; i++) {
          frameMaterials[i].opacity = 0.8 * intro;
        }
        for (let i = 0; i < 3; i++) {
          ringMaterials[i].opacity =
            (0.55 + 0.12 * Math.sin(time * 0.6 + i * 1.4)) * intro;
        }
        if (held) {
          layers[3].object.rotation.z = layers[3].to.z + time * 0.045;
          layers[4].object.rotation.x = layers[4].to.x + Math.sin(time * 0.12) * 0.05;
          layers[5].object.rotation.y = layers[5].to.y + time * 0.035;
        }

        const coreAppear = smoothstep(0.35, 1, intro);
        (core.material as THREE.MeshStandardMaterial).opacity = coreAppear;
        core.material.emissiveIntensity = 2.6 + 0.5 * Math.sin(time * 1.1);
        core.rotation.y += delta * 0.35;
        core.scale.setScalar(0.85 + 0.15 * align);
        coreGlow.material.opacity = 0.42 * coreAppear;
        coreHalo.uniforms.uOpacity.value = 0.85 * coreAppear;

        axleMaterial.opacity = 0.18 * align;
        dustMaterial.opacity = 0.4 * intro;
        pool.material.opacity = 0.24 * intro;

        // The most restrained parallax on the page — this section stays calm.
        root.rotation.y = pointer.x * 0.09;
        root.rotation.x = -pointer.y * 0.04;
        root.position.y = Math.sin(time * 0.3) * 0.02;
      },

      dispose() {
        // Teardown is centralised: SceneCanvas disposes the whole subtree.
      },
    };
  },
};
