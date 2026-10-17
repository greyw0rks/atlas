import * as THREE from "three";
import { createPortalMaterial, tickShaderTime } from "../lib/materials";
import { createStudioRig } from "../lib/lighting";
import { glowTexture, makeGlowSprite } from "../lib/glow";
import { applyEnvironment } from "../lib/environment";
import { clamp01, easeOutExpo, lerp, seededRandom, smoothstep, stagger } from "../lib/anim";
import type { SceneDefinition, SceneInstance } from "../types";

/**
 * SECTION 04 — The illuminated portal.
 *
 * A dark machined doorway standing in a dim landscape, its opening receding
 * through a series of lit arches into a swirling surface, with light spilling
 * across the ground. This is the "entering the workflow" beat, so the whole
 * composition is built around one strong doorway and empty space around it.
 */

const FRAME_LAYERS = 5;
const APERTURE_WIDTH = 1.82;
const APERTURE_HEIGHT = 2.92;
const GROUND_Y = -1.9;

/** Four bars forming a rectangular arch, sized in world units. */
function buildArch(
  width: number,
  height: number,
  thickness: number,
  depth: number,
  material: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const spans: Array<[number, number, number, number]> = [
    // x, y, spanWidth, spanHeight
    [0, height / 2 + thickness / 2, width + thickness * 2, thickness],
    [0, -height / 2 - thickness / 2, width + thickness * 2, thickness],
    [-width / 2 - thickness / 2, 0, thickness, height],
    [width / 2 + thickness / 2, 0, thickness, height],
  ];

  for (const [x, y, w, h] of spans) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), material);
    mesh.position.set(x, y, 0);
    group.add(mesh);
  }

  return group;
}

export const portalScene: SceneDefinition = {
  name: "installation-portal",
  camera: { fov: 40, position: [0.45, 0.42, 6.9], lookAt: [0, 0.08, 0] },
  mobileCamera: { fov: 50, position: [0.4, 0.75, 8.4], lookAt: [0, 0.05, 0] },
  density: 0.55,
  factory(ctx): SceneInstance {
    const { scene } = ctx;
    applyEnvironment(scene, ctx.renderer);

    const density = ctx.quality === "low" ? 0.55 : 1;

    scene.add(createStudioRig({ intensity: 1.0, ambient: 0.32 }).group);

    const root = new THREE.Group();
    scene.add(root);

    const random = seededRandom(90210);

    /* ── the illuminated opening ──────────────────────────────────────── */
    const portalMaterial = createPortalMaterial();
    portalMaterial.uniforms.uIntensity.value = 0;
    const portal = new THREE.Mesh(
      new THREE.PlaneGeometry(APERTURE_WIDTH, APERTURE_HEIGHT),
      portalMaterial,
    );
    portal.position.z = -0.35 - FRAME_LAYERS * 0.24;
    root.add(portal);

    /* ── receding arches, each one lit in turn ────────────────────────── */
    const archMaterials: THREE.MeshStandardMaterial[] = [];
    const archGroups: THREE.Group[] = [];

    for (let i = 0; i < FRAME_LAYERS; i++) {
      // The outermost arch is dark ceramic; inner ones pick up emissive light.
      const material = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0x171d29 : 0x1b2333,
        emissive: new THREE.Color(i === 0 ? 0x05070c : 0x2f4f8f),
        emissiveIntensity: 0,
        metalness: 0.82,
        roughness: i === 0 ? 0.42 : 0.3,
        transparent: true,
        opacity: 0,
      });
      archMaterials.push(material);

      const inset = i * 0.14;
      const arch = buildArch(
        APERTURE_WIDTH + 0.32 - inset,
        APERTURE_HEIGHT + 0.32 - inset,
        0.17 - i * 0.014,
        0.3,
        material,
      );
      arch.position.z = -i * 0.24;
      arch.userData.baseZ = arch.position.z;
      root.add(arch);
      archGroups.push(arch);
    }

    /* ── the dark landscape seat ──────────────────────────────────────── */
    // No ground plane: a lit plane reads as a grey horizon in a stage this
    // dark. The doorway floats and the spill sprite paints its own pool.

    // Angular stone shards flank the doorway so it reads as a placed object.
    const shards: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const shard = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.34 + random() * 0.38, 0),
        new THREE.MeshStandardMaterial({
          color: 0x0b1019,
          metalness: 0.3,
          roughness: 0.68,
          flatShading: true,
          transparent: true,
          opacity: 0,
        }),
      );
      shard.position.set(
        side * (2.1 + random() * 1.5),
        GROUND_Y + 0.1 + random() * 0.22,
        -1.1 + random() * 2.2,
      );
      shard.rotation.set(random() * 3, random() * 3, random() * 3);
      shard.scale.set(1, 0.5 + random() * 0.45, 1);
      root.add(shard);
      shards.push(shard);
    }

    /* ── light spilling across the ground ─────────────────────────────── */
    const spill = makeGlowSprite({
      color: "#8f7dff",
      size: 1,
      opacity: 0,
      depthWrite: false,
    });
    // Squashed vertically and stretched forward: a pool, not a ball of light.
    spill.scale.set(9, 3.4, 1);
    spill.position.set(0, GROUND_Y + 0.02, 1.35);
    root.add(spill);

    const threshold = makeGlowSprite({ color: "#c9bcff", size: 2.6, opacity: 0 });
    threshold.position.set(0, GROUND_Y + 0.35, -0.2);
    root.add(threshold);

    /* ── drifting motes drawn toward the opening ──────────────────────── */
    const moteCount = Math.round(220 * density);
    const motePositions = new Float32Array(moteCount * 3);
    const moteSeed = new Float32Array(moteCount);
    for (let i = 0; i < moteCount; i++) {
      motePositions[i * 3] = (random() - 0.5) * 6.4;
      motePositions[i * 3 + 1] = GROUND_Y + random() * 4.6;
      motePositions[i * 3 + 2] = -0.4 + random() * 3.4;
      moteSeed[i] = random() * Math.PI * 2;
    }
    const moteGeometry = new THREE.BufferGeometry();
    moteGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
    const moteMaterial = new THREE.PointsMaterial({
      color: 0xb9a9ff,
      size: 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: glowTexture(),
    });
    root.add(new THREE.Points(moteGeometry, moteMaterial));

    return {
      update(context, delta) {
        const { time, pointer } = context;
        const intro = easeOutExpo(clamp01(time / 2.4));

        tickShaderTime(root, time);

        /* the doorway builds outward-in, then the opening ignites */
        for (let i = 0; i < archGroups.length; i++) {
          const arch = archGroups[i];
          const appear = stagger(time, i, FRAME_LAYERS, {
            delay: 0.2,
            duration: 1.1,
            spread: 1.1,
          });

          archMaterials[i].opacity = 0.95 * appear;
          // Only the inner arches catch the light from the opening.
          const lit = i === 0 ? 0 : appear * smoothstep(0, 1, intro);
          archMaterials[i].emissiveIntensity =
            lit * (0.55 + 0.25 * Math.sin(time * 1.2 - i * 0.6));
          arch.position.z = lerp(arch.userData.baseZ as number, (arch.userData.baseZ as number) - 0.06, appear);
        }

        const ignite = smoothstep(0.55, 1, intro);
        portalMaterial.uniforms.uIntensity.value = lerp(0.05, 1.25, ignite);
        portal.scale.setScalar(lerp(0.9, 1, ignite));

        for (const shard of shards) {
          (shard.material as THREE.MeshStandardMaterial).opacity = 0.92 * intro;
        }

        spill.material.opacity = 0.42 * ignite * (0.9 + 0.1 * Math.sin(time * 0.9));
        threshold.material.opacity = 0.34 * ignite;
        moteMaterial.opacity = 0.5 * smoothstep(0.8, 1, intro);

        /* motes drift up and forward, then wrap back down */
        const positions = moteGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < moteCount; i++) {
          const base = i * 3;
          positions[base + 1] += delta * (0.05 + (i % 7) * 0.012);
          if (positions[base + 1] > GROUND_Y + 4.8) {
            positions[base + 1] = GROUND_Y - 0.2;
          }
          positions[base] += Math.sin(time * 0.3 + moteSeed[i]) * delta * 0.06;
        }
        moteGeometry.attributes.position.needsUpdate = true;

        /* very restrained camera-facing motion — this section stays calm */
        root.rotation.y = pointer.x * 0.1;
        root.rotation.x = -pointer.y * 0.045;
      },

      dispose() {
        // Teardown is centralised: SceneCanvas disposes the whole subtree.
      },
    };
  },
};
