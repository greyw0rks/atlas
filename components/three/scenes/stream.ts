import * as THREE from "three";
import { createFilamentMaterial } from "../lib/materials";
import { createLightPool, createStudioRig } from "../lib/lighting";
import { makeGlowSprite } from "../lib/glow";
import { applyEnvironment } from "../lib/environment";
import { clamp01, easeOutExpo, lerp, seededRandom, smoothstep, stagger } from "../lib/anim";
import type { SceneDefinition, SceneInstance } from "../types";

/**
 * SECTION 03 — The three-stage context stream.
 *
 * Read left to right the scene is the story: a capture frame that fills with
 * context, a transparent processing column that holds and reworks it, and a
 * restore frame that fills back in. Glass fragments travel the whole way, so
 * the three structures read as one continuous pipeline rather than three
 * separate props.
 */

const START_X = -3.35;
const END_X = 3.35;
const FRAME_WIDTH = 1.55;
const FRAME_HEIGHT = 2.3;
const TUBE_RADIUS = 0.52;
const TUBE_HEIGHT = 2.9;
const CONSOLE_LINES = 6;

interface Terminal {
  group: THREE.Group;
  lines: Array<THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>>;
  glows: THREE.Sprite[];
  edges: THREE.LineSegments;
  panel: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  metal: THREE.MeshStandardMaterial;
}

/** An open rectangular bezel with a stack of console lines floating inside. */
function buildTerminal(
  width: number,
  height: number,
  accent: number,
  random: () => number,
): Terminal {
  const group = new THREE.Group();
  const bar = 0.055;

  const metal = new THREE.MeshStandardMaterial({
    color: 0x2b3446,
    metalness: 0.9,
    roughness: 0.3,
    transparent: true,
    opacity: 0,
  });

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width - bar, height - bar, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x080c14,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  group.add(panel);

  // Four bars form the bezel; each is edged so it reads as machined metal.
  const bars: Array<[number, number, number, number]> = [
    [0, height / 2, width, bar],
    [0, -height / 2, width, bar],
    [-width / 2, 0, bar, height],
    [width / 2, 0, bar, height],
  ];
  for (const [x, y, w, h] of bars) {
    const geometry = new THREE.BoxGeometry(w, h, bar);
    const mesh = new THREE.Mesh(geometry, metal);
    mesh.position.set(x, y, 0);
    group.add(mesh);
  }

  // One edge overlay for the whole frame keeps the bezel crisp.
  const outlineSource = new THREE.BoxGeometry(width, height, bar);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(outlineSource),
    new THREE.LineBasicMaterial({
      color: 0x8fc0f5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  outlineSource.dispose();
  group.add(edges);

  /* ── console lines inside the bezel ──────────────────────────────── */
  const lines: Terminal["lines"] = [];
  const glows: THREE.Sprite[] = [];
  for (let i = 0; i < CONSOLE_LINES; i++) {
    const lineWidth = (width - 0.42) * (0.4 + random() * 0.6);
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(lineWidth, 0.026, 0.012),
      new THREE.MeshStandardMaterial({
        color: 0xcfe2ff,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 1.6,
        metalness: 0.1,
        roughness: 0.5,
        transparent: true,
        opacity: 0,
      }),
    );
    line.position.set(
      -(width - 0.42) / 2 + lineWidth / 2,
      height / 2 - 0.36 - i * ((height - 0.62) / (CONSOLE_LINES - 1)),
      0.02,
    );
    group.add(line);
    lines.push(line);

    const glow = makeGlowSprite({ color: accent, size: 0.44, opacity: 0 });
    glow.position.copy(line.position);
    group.add(glow);
    glows.push(glow);
  }

  return { group, lines, glows, edges, panel, metal };
}

export const streamScene: SceneDefinition = {
  name: "context-stream",
  camera: { fov: 40, position: [0.2, 0.9, 7.2], lookAt: [0, 0, 0] },
  mobileCamera: { fov: 52, position: [0, 1.3, 10.6], lookAt: [0, -0.1, 0] },
  density: 0.5,
  factory(ctx): SceneInstance {
    const { scene } = ctx;
    applyEnvironment(scene, ctx.renderer);

    const density = ctx.quality === "low" ? 0.5 : 1;
    const lowQuality = ctx.quality === "low";

    scene.add(createStudioRig({ intensity: 1.1, ambient: 0.4 }).group);

    const root = new THREE.Group();
    // The pipeline is the whole point of the section: size it to fill the
    // wide stage rather than floating as a thin band through the middle.
    root.scale.setScalar(1.18);
    scene.add(root);

    const random = seededRandom(31415926);

    /* ── stage 1 · capture ────────────────────────────────────────────── */
    const capture = buildTerminal(FRAME_WIDTH, FRAME_HEIGHT, 0x4f93e0, random);
    capture.group.position.x = START_X;
    root.add(capture.group);

    /* ── stage 3 · restore ────────────────────────────────────────────── */
    const restore = buildTerminal(FRAME_WIDTH, FRAME_HEIGHT, 0x8b7cff, random);
    restore.group.position.x = END_X;
    root.add(restore.group);

    /* ── stage 2 · the transparent processing column ──────────────────── */
    const column = new THREE.Group();
    root.add(column);

    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(
        TUBE_RADIUS,
        TUBE_RADIUS,
        TUBE_HEIGHT,
        lowQuality ? 20 : 40,
        1,
        true,
      ),
      new THREE.MeshStandardMaterial({
        color: 0x9fc2ef,
        metalness: 0.15,
        roughness: 0.08,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    column.add(tube);

    const capGeometry = new THREE.TorusGeometry(TUBE_RADIUS, 0.014, 6, lowQuality ? 28 : 56);
    const capMaterial = new THREE.MeshBasicMaterial({
      color: 0x8fc0f5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (const y of [TUBE_HEIGHT / 2, -TUBE_HEIGHT / 2]) {
      const cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.rotation.x = Math.PI / 2;
      cap.position.y = y;
      column.add(cap);
    }

    // Three inner rings rework the context as it passes through.
    const innerRings: THREE.Mesh[] = [];
    const ringMaterials: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < 3; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x8b7cff : 0x5f9fe8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.3 + i * 0.055, 0.009, 6, lowQuality ? 24 : 48),
        material,
      );
      ring.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      column.add(ring);
      innerRings.push(ring);
      ringMaterials.push(material);
    }

    const columnGlow = makeGlowSprite({ color: "#8fb8ff", size: 3.4, opacity: 0 });
    column.add(columnGlow);

    /* ── travelling glass fragments ───────────────────────────────────── */
    const fragmentCount = Math.round(38 * density);
    const fragments: THREE.Mesh[] = [];
    const phases = new Float32Array(fragmentCount);
    const jitterY = new Float32Array(fragmentCount);
    const jitterZ = new Float32Array(fragmentCount);
    const spin = new Float32Array(fragmentCount);

    for (let i = 0; i < fragmentCount; i++) {
      const fragment = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.008, 0.11),
        new THREE.MeshStandardMaterial({
          color: 0xbcd6f5,
          metalness: 0.5,
          roughness: 0.15,
          transparent: true,
          opacity: 0,
          emissive: new THREE.Color(0x2d5a96),
          emissiveIntensity: 0.6,
        }),
      );
      root.add(fragment);
      fragments.push(fragment);

      phases[i] = random();
      jitterY[i] = (random() - 0.5) * 0.5;
      jitterZ[i] = (random() - 0.5) * 0.42;
      spin[i] = (random() - 0.5) * 1.6;
    }

    /* ── the guide filament the fragments ride ────────────────────────── */
    const guidePoints = new Float32Array(48 * 3);
    for (let s = 0; s < 48; s++) {
      const t = s / 47;
      guidePoints[s * 3] = lerp(START_X, END_X, t);
      guidePoints[s * 3 + 1] = Math.sin(t * Math.PI) * 0.06;
      guidePoints[s * 3 + 2] = 0;
    }
    const guideGeometry = new THREE.BufferGeometry();
    guideGeometry.setAttribute("position", new THREE.BufferAttribute(guidePoints, 3));
    guideGeometry.setDrawRange(0, 0);
    const guideMaterial = createFilamentMaterial("#4d7fbe", 0.22);
    root.add(new THREE.Line(guideGeometry, guideMaterial));

    const pool = createLightPool("#2f6cc0", 15, 0.28);
    pool.position.set(0, -2.1, -2.6);
    root.add(pool);

    return {
      update(context, delta) {
        const { time, pointer } = context;
        const intro = easeOutExpo(clamp01(time / 2.1));

        /* stages arrive left, centre, right */
        const stages: Array<{ terminal: Terminal; scale: number }> = [
          { terminal: capture, scale: stagger(time, 0, 3, { delay: 0.15, duration: 1.15, spread: 0.85 }) },
          { terminal: restore, scale: stagger(time, 2, 3, { delay: 0.15, duration: 1.15, spread: 0.85 }) },
        ];

        for (const { terminal, scale: appear } of stages) {
          terminal.group.scale.setScalar(lerp(0.86, 1, appear));
          (terminal.edges.material as THREE.LineBasicMaterial).opacity = 0.5 * appear;
          terminal.panel.material.opacity = 0.7 * appear;
          terminal.metal.opacity = 0.92 * appear;
        }

        const columnAppear = stagger(time, 1, 3, { delay: 0.15, duration: 1.15, spread: 0.85 });
        tube.material.opacity = 0.14 * columnAppear;
        capMaterial.opacity = 0.5 * columnAppear;
        for (const material of ringMaterials) material.opacity = 0.6 * columnAppear;
        columnGlow.material.opacity = 0.34 * columnAppear;

        /* capture fills up, restore fills back in */
        for (let i = 0; i < CONSOLE_LINES; i++) {
          const captured =
            stagger(time, i, CONSOLE_LINES, { delay: 0.55, duration: 0.7, spread: 0.6 }) *
            stagger(time, 0, 3, { delay: 0.15, duration: 1.15, spread: 0.85 });
          capture.lines[i].material.opacity = 0.85 * captured;
          capture.lines[i].material.emissiveIntensity = 1.6 + Math.sin(time * 1.4 + i) * 0.4;
          capture.glows[i].material.opacity = 0.35 * captured;

          // The restore panel lights in the reverse order, as context returns.
          const restored =
            stagger(time, CONSOLE_LINES - 1 - i, CONSOLE_LINES, {
              delay: 1.5,
              duration: 0.9,
              spread: 0.5,
            }) * intro;
          restore.lines[i].material.opacity = 0.85 * restored;
          restore.lines[i].material.emissiveIntensity = 1.6 + Math.sin(time * 1.1 + i) * 0.4;
          restore.glows[i].material.opacity = 0.35 * restored;
        }

        /* fragments flowing along the pipeline */
        for (let i = 0; i < fragments.length; i++) {
          const fragment = fragments[i];
          // Ease each fragment through the middle so they bunch and regroup.
          const raw = (time * 0.115 + phases[i]) % 1;
          const t = raw + Math.sin(raw * Math.PI * 2) * 0.035;

          fragment.position.set(
            lerp(START_X + 0.55, END_X - 0.55, t),
            jitterY[i] + Math.sin(t * Math.PI) * 0.34,
            jitterZ[i] + Math.cos(t * Math.PI) * 0.24,
          );
          fragment.rotation.set(t * 3.2 + i, t * 2.1, spin[i] * t * 2);

          const material = fragment.material as THREE.MeshStandardMaterial;
          const edges = smoothstep(0, 0.07, raw) * (1 - smoothstep(0.93, 1, raw));
          const inside = 1 - Math.min(1, Math.abs(fragment.position.x) / 1.1);
          material.opacity = edges * (0.28 + inside * 0.5) * intro;
          material.emissiveIntensity = 0.6 + inside * 1.6;
        }

        guideGeometry.setDrawRange(
          0,
          Math.floor(48 * stagger(time, 0, 1, { delay: 0.6, duration: 1.6 })),
        );

        /* idle: inner rings counter-rotate, whole rig breathes */
        innerRings.forEach((ring, index) => {
          const speed = (0.34 + index * 0.16) * (index % 2 === 0 ? 1 : -1);
          ring.rotation.y += delta * speed;
          ring.rotation.z += delta * speed * 0.4;
        });
        column.rotation.y += delta * 0.1;

        pool.material.opacity = 0.28 * intro;

        root.rotation.y = Math.sin(time * 0.22) * 0.035 + pointer.x * 0.13;
        root.rotation.x = -pointer.y * 0.055;
        root.position.y = Math.sin(time * 0.5) * 0.03;
      },

      dispose() {
        // Teardown is centralised: SceneCanvas disposes the whole subtree.
      },
    };
  },
};
