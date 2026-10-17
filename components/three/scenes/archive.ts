import * as THREE from "three";
import { createFilamentMaterial } from "../lib/materials";
import { createLightPool, createStudioRig } from "../lib/lighting";
import { makeGlowSprite } from "../lib/glow";
import { applyEnvironment } from "../lib/environment";
import { clamp01, easeOutExpo, lerp, seededRandom, smoothstep, stagger } from "../lib/anim";
import type { SceneDefinition, SceneInstance } from "../types";

/**
 * SECTION 02 — The architectural memory archive.
 *
 * A stack of translucent floors braced by brushed-metal columns, each floor
 * holding upright glass tiles and lit by a pathway running its length. Where
 * the hero is a single core, this is a structure: knowledge filed, ordered and
 * built up one storey at a time.
 */

const FLOOR_COUNT = 6;
const COLUMN_RADIUS = 0.032;
const PATH_STEPS = 44;

interface Floor {
  group: THREE.Group;
  slab: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  edges: THREE.LineSegments;
  tiles: Array<THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>>;
  tileSprites: THREE.Sprite[];
  path: THREE.Line;
  pathMaterial: THREE.LineBasicMaterial;
  baseY: number;
  phase: number;
}

export const archiveScene: SceneDefinition = {
  name: "memory-archive",
  camera: { fov: 40, position: [3.35, 1.75, 5.4], lookAt: [0, 0.1, 0] },
  mobileCamera: { fov: 50, position: [4.35, 2.4, 7.6], lookAt: [0, 0.2, 0] },
  density: 0.6,
  factory(ctx): SceneInstance {
    const { scene } = ctx;
    applyEnvironment(scene, ctx.renderer);

    const density = ctx.quality === "low" ? 0.6 : 1;
    const lowQuality = ctx.quality === "low";

    scene.add(createStudioRig({ intensity: 1.05, ambient: 0.4 }).group);

    const root = new THREE.Group();
    root.rotation.y = -0.18;
    scene.add(root);

    const pool = createLightPool("#2c5fae", 19, 0.3);
    pool.position.set(0, -2.6, -2.4);
    root.add(pool);

    const random = seededRandom(776103);
    const floors: Floor[] = [];

    const totalHeight = (FLOOR_COUNT - 1) * 0.68;

    for (let i = 0; i < FLOOR_COUNT; i++) {
      const baseY = -totalHeight / 2 + i * 0.68;
      const group = new THREE.Group();
      group.position.y = baseY;
      root.add(group);

      /* ── translucent slab ───────────────────────────────────────────── */
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.09, 2.5),
        new THREE.MeshStandardMaterial({
          color: 0x22324c,
          emissive: new THREE.Color(0x0d1d34),
          emissiveIntensity: 1,
          metalness: 0.55,
          roughness: 0.24,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      group.add(slab);

      // A lit rim keeps each storey legible against the dark background.
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(slab.geometry),
        new THREE.LineBasicMaterial({
          color: 0x86b6ee,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(edges);

      /* ── upright glass tiles ────────────────────────────────────────── */
      const tileCount = Math.round((6 - i) * density) + 3;
      const tiles: Floor["tiles"] = [];
      const tileSprites: THREE.Sprite[] = [];

      for (let t = 0; t < tileCount; t++) {
        const height = 0.24 + random() * 0.38;
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, height, 0.46 + random() * 0.22),
          new THREE.MeshStandardMaterial({
            color: 0xc4daf6,
            emissive: new THREE.Color(i % 2 === 0 ? 0x2f6fbe : 0x6250c4),
            emissiveIntensity: 1.1,
            metalness: 0.25,
            roughness: 0.2,
            transparent: true,
            opacity: 0,
          }),
        );
        tile.position.set(
          -1.75 + (t / Math.max(1, tileCount - 1)) * 3.5 + (random() - 0.5) * 0.14,
          0.025 + height / 2,
          (random() - 0.5) * 1.7,
        );
        tile.rotation.y = (random() - 0.5) * 0.5;
        group.add(tile);
        tiles.push(tile);

        const sprite = makeGlowSprite({
          color: i % 2 === 0 ? "#5f9fe8" : "#9b8cff",
          size: 0.5,
          opacity: 0,
        });
        sprite.position.copy(tile.position);
        group.add(sprite);
        tileSprites.push(sprite);
      }

      /* ── lit pathway running the length of the floor ────────────────── */
      const pathFloat = new Float32Array(PATH_STEPS * 3);
      for (let s = 0; s < PATH_STEPS; s++) {
        const t = s / (PATH_STEPS - 1);
        pathFloat[s * 3] = Math.sin(t * Math.PI * 2.1 + i) * 0.85;
        pathFloat[s * 3 + 1] = 0.035;
        pathFloat[s * 3 + 2] = lerp(-1.05, 1.05, t);
      }
      const pathGeometry = new THREE.BufferGeometry();
      pathGeometry.setAttribute("position", new THREE.BufferAttribute(pathFloat, 3));
      pathGeometry.setDrawRange(0, 0);
      const pathMaterial = createFilamentMaterial("#7fc0ff", 0);
      const path = new THREE.Line(pathGeometry, pathMaterial);
      group.add(path);

      floors.push({
        group,
        slab,
        edges,
        tiles,
        tileSprites,
        path,
        pathMaterial,
        baseY,
        phase: random() * Math.PI * 2,
      });
    }

    /* ── four brushed-metal columns bracing the stack ─────────────────── */
    const columnHeight = totalHeight + 0.7;
    const columnGeometry = new THREE.CylinderGeometry(
      COLUMN_RADIUS,
      COLUMN_RADIUS,
      columnHeight,
      lowQuality ? 8 : 14,
    );
    const columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d97aa,
      metalness: 0.96,
      roughness: 0.24,
      transparent: true,
      opacity: 0,
    });
    const columns: THREE.Mesh[] = [];
    for (const x of [-1.98, 1.98]) {
      for (const z of [-0.92, 0.92]) {
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(x, 0, z);
        root.add(column);
        columns.push(column);
      }
    }

    /* ── newest memory, waiting at the top ────────────────────────────── */
    const keystone = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.17, 0),
      new THREE.MeshStandardMaterial({
        color: 0xe8f1ff,
        emissive: new THREE.Color(0x7cc0ff),
        emissiveIntensity: 2.8,
        metalness: 0.3,
        roughness: 0.25,
        transparent: true,
        opacity: 0,
      }),
    );
    keystone.position.y = totalHeight / 2 + 0.62;
    root.add(keystone);

    const keystoneGlow = makeGlowSprite({
      color: "#8fc6ff",
      size: 1.5,
      opacity: 0,
    });
    keystoneGlow.position.copy(keystone.position);
    root.add(keystoneGlow);

    return {
      update(context, delta) {
        const { time, pointer } = context;
        const intro = easeOutExpo(clamp01(time / 2.0));

        for (let i = 0; i < floors.length; i++) {
          const floor = floors[i];
          // Bottom floors settle first so the structure appears to be built.
          const appear = stagger(time, i, FLOOR_COUNT, {
            delay: 0.18,
            duration: 1.2,
            spread: 1.0,
          });

          floor.group.position.y = floor.baseY + lerp(-0.55, 0, appear);
          floor.slab.material.opacity = 0.55 * appear;
          (floor.edges.material as THREE.LineBasicMaterial).opacity = 0.62 * appear;

          for (let t = 0; t < floor.tiles.length; t++) {
            const tile = floor.tiles[t];
            const tileAppear = stagger(time, t, floor.tiles.length, {
              delay: 0.45 + i * 0.1,
              duration: 0.85,
              spread: 0.7,
            });
            tile.material.opacity = 0.9 * tileAppear;
            tile.material.emissiveIntensity =
              (1.1 + 0.4 * Math.sin(time * 0.8 + t + i)) * tileAppear;
            tile.scale.y = lerp(0.2, 1, tileAppear);
            floor.tileSprites[t].material.opacity = 0.4 * tileAppear;
          }

          // The pathway lights from the back of the floor to the front.
          const drawn = Math.floor(
            PATH_STEPS *
              smoothstep(0, 1, stagger(time, i, FLOOR_COUNT, { delay: 0.5, duration: 1.4, spread: 0.9 })),
          );
          floor.path.geometry.setDrawRange(0, drawn);
          floor.pathMaterial.opacity = 0.4 * appear;

          // Out-of-phase breathing keeps the stack from looking machined.
          floor.group.position.y += Math.sin(time * 0.5 + floor.phase) * 0.028;
        }

        for (const column of columns) {
          (column.material as THREE.MeshStandardMaterial).opacity = 0.85 * intro;
        }

        const keystoneAppear = stagger(time, 0, 1, { delay: 1.5, duration: 1.4 });
        (keystone.material as THREE.MeshStandardMaterial).opacity = keystoneAppear;
        keystone.rotation.y += delta * 0.5;
        keystone.rotation.x = Math.sin(time * 0.6) * 0.25;
        keystone.position.y =
          totalHeight / 2 + 0.62 + Math.sin(time * 0.7) * 0.04;
        keystoneGlow.position.y = keystone.position.y;
        keystoneGlow.material.opacity = 0.5 * keystoneAppear;

        pool.material.opacity = 0.3 * intro;

        root.rotation.y = -0.18 + time * 0.055 + pointer.x * 0.16;
        root.rotation.x = -pointer.y * 0.07;
      },

      dispose() {
        // Teardown is centralised: SceneCanvas disposes the whole subtree.
      },
    };
  },
};
