import * as THREE from "three";
import { createFilamentMaterial } from "../lib/materials";
import { createLightPool, createStudioRig } from "../lib/lighting";
import { glowTexture, makeGlowSprite } from "../lib/glow";
import { applyEnvironment } from "../lib/environment";
import { clamp01, easeOutExpo, seededRandom, smoothstep, stagger } from "../lib/anim";
import type { SceneDefinition, SceneInstance } from "../types";

/**
 * SECTION 05 — The spatial constellation.
 *
 * Five dispersed knowledge clusters at different depths and scales, joined by
 * arcs that draw themselves on. This is the only scene with real spatial
 * separation between subjects — the others are single objects, this one is a
 * field, which is what makes "connected projects" legible at a glance.
 */

interface ClusterSpec {
  position: [number, number, number];
  scale: number;
  kind: number;
}

const CLUSTERS: ClusterSpec[] = [
  { position: [-4.0, 0.9, -1.2], scale: 1.05, kind: 0 },
  { position: [-1.6, 1.7, -3.0], scale: 1.0, kind: 1 },
  { position: [-1.2, -1.45, 0.7], scale: 1.15, kind: 2 },
  { position: [2.9, 1.15, -1.8], scale: 1.0, kind: 3 },
  { position: [4.2, -1.15, -0.6], scale: 0.95, kind: 4 },
];

/** Clusters size up together so the field fills its stage. */
const CLUSTER_GAIN = 1.5;

interface Cluster {
  group: THREE.Group;
  nodes: THREE.Mesh[];
  sprites: THREE.Sprite[];
  /** Dark ceramic body — the solid mass of the cluster. */
  body: THREE.MeshStandardMaterial;
  /** Translucent plates, where the cluster has them. */
  glass: THREE.MeshStandardMaterial | null;
  /** Lit outline: an edge overlay or a ring. */
  accent: THREE.Material | null;
}

/**
 * Every cluster is built from the same vocabulary — dark ceramic mass, lit
 * nodes, one translucent element — so five different shapes still read as
 * members of one family.
 */
function buildCluster(kind: number, random: () => number): Cluster {
  const group = new THREE.Group();
  const nodes: THREE.Mesh[] = [];
  const sprites: THREE.Sprite[] = [];

  const body = new THREE.MeshStandardMaterial({
    color: 0x263a56,
    emissive: new THREE.Color(0x122744),
    emissiveIntensity: 1.0,
    metalness: 0.72,
    roughness: 0.36,
    flatShading: true,
    transparent: true,
    opacity: 0,
  });

  let glass: THREE.MeshStandardMaterial | null = null;
  let accent: THREE.Material | null = null;

  const nodeMaterial = (): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({
      color: 0x9dc4f0,
      emissive: new THREE.Color(kind % 2 === 0 ? 0x4f93e0 : 0x8b7cff),
      emissiveIntensity: 1.8,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0,
    });

  const addNode = (size: number, x: number, y: number, z: number): void => {
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), nodeMaterial());
    node.position.set(x, y, z);
    group.add(node);
    nodes.push(node);
  };

  if (kind === 0) {
    /* a dark core with upright glass plates orbiting it */
    group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), body));

    glass = new THREE.MeshStandardMaterial({
      color: 0x9fc2ef,
      metalness: 0.35,
      roughness: 0.12,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.44, 0.3), glass);
      plate.position.set(
        Math.cos(angle) * 0.56,
        (random() - 0.5) * 0.2,
        Math.sin(angle) * 0.56,
      );
      plate.rotation.y = angle;
      group.add(plate);
    }
  } else if (kind === 1) {
    /* four lit nodes clustered loosely together */
    for (let i = 0; i < 4; i++) {
      addNode(
        0.16,
        (random() - 0.5) * 0.72,
        (random() - 0.5) * 0.56,
        (random() - 0.5) * 0.44,
      );
    }
  } else if (kind === 2) {
    /* a slab platform carrying a short row of tiles */
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.62), body);
    group.add(slab);

    accent = createFilamentMaterial("#7fb2ea", 0);
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), accent));

    for (let i = 0; i < 5; i++) {
      const height = 0.2 + random() * 0.26;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, height, 0.3),
        nodeMaterial(),
      );
      tile.position.set(-0.55 + i * 0.275, 0.025 + height / 2, (random() - 0.5) * 0.2);
      group.add(tile);
      nodes.push(tile);
    }
  } else if (kind === 3) {
    /* a stretched shard with a single hard highlight node */
    const shard = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), body);
    shard.scale.set(1.5, 0.5, 0.7);
    group.add(shard);

    accent = createFilamentMaterial("#7fb2ea", 0);
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(shard.geometry), accent));

    addNode(0.15, 0.48, 0.18, 0.1);
  } else {
    /* a lit ring of nodes — the hub everything else routes through */
    accent = createFilamentMaterial("#6fb4ff", 0);
    group.add(new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.018, 8, 64), accent));

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      addNode(0.16, Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
    }
  }

  const glow = makeGlowSprite({
    color: kind % 2 === 0 ? "#4f93e0" : "#9b8cff",
    size: 2.2,
    opacity: 0,
  });
  group.add(glow);
  sprites.push(glow);

  return { group, nodes, sprites, body, glass, accent };
}

export const constellationScene: SceneDefinition = {
  name: "use-case-constellation",
  camera: { fov: 42, position: [0.7, 1.0, 8.2], lookAt: [0, -0.1, -0.9] },
  mobileCamera: { fov: 52, position: [0.4, 1.6, 11.2], lookAt: [0, -0.2, -0.9] },
  density: 0.6,
  factory(ctx): SceneInstance {
    const { scene } = ctx;
    applyEnvironment(scene, ctx.renderer);

    const density = ctx.quality === "low" ? 0.6 : 1;
    const lowQuality = ctx.quality === "low";

    scene.add(createStudioRig({ intensity: 1.05, ambient: 0.42 }).group);

    const root = new THREE.Group();
    scene.add(root);

    const random = seededRandom(424242);

    const clusters: Array<Cluster & { base: [number, number, number]; phase: number }> = [];

    for (const spec of CLUSTERS) {
      const built = buildCluster(spec.kind, random);
      built.group.position.set(...spec.position);
      built.group.scale.setScalar(spec.scale * CLUSTER_GAIN);
      root.add(built.group);
      clusters.push({ ...built, base: spec.position, phase: random() * Math.PI * 2 });
    }

    /* ── arcs between clusters, drawn on in sequence ──────────────────── */
    const arcTargets: Array<[number, number]> = [
      [0, 4],
      [1, 4],
      [2, 0],
      [3, 1],
      [2, 3],
    ];

    const arcs: Array<{
      geometry: THREE.TubeGeometry;
      material: THREE.MeshBasicMaterial;
      total: number;
    }> = [];

    for (const [from, to] of arcTargets) {
      const a = new THREE.Vector3(...clusters[from].base);
      const b = new THREE.Vector3(...clusters[to].base);
      // Bow the arc away from the centroid so no route runs straight.
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.z -= 0.75;
      mid.y += 0.35;

      const geometry = new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(a, mid, b),
        lowQuality ? 20 : 36,
        0.012,
        5,
        false,
      );
      geometry.setDrawRange(0, 0);

      const material = new THREE.MeshBasicMaterial({
        color: 0x5f9fe8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      root.add(new THREE.Mesh(geometry, material));
      arcs.push({ geometry, material, total: geometry.index?.count ?? 0 });
    }

    /* ── scattered space dust, sparser than the hero's ────────────────── */
    const dustCount = Math.round(700 * density);
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (random() - 0.5) * 16;
      dustPositions[i * 3 + 1] = (random() - 0.5) * 9;
      dustPositions[i * 3 + 2] = -7 + random() * 9;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x9dc6ff,
      size: 0.07,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: glowTexture(),
    });
    root.add(new THREE.Points(dustGeometry, dustMaterial));

    const pool = createLightPool("#2a5aa8", 22, 0.22);
    pool.position.set(0, -3.4, -4);
    root.add(pool);

    // Each cluster gets its own pool so the light appears to come from it.
    const clusterPools = clusters.map((cluster) => {
      const clusterPool = createLightPool("#4f93e0", 6, 0);
      clusterPool.position.copy(cluster.group.position);
      clusterPool.scale.multiplyScalar(cluster.group.scale.x);
      root.add(clusterPool);
      return clusterPool;
    });

    return {
      update(context, delta) {
        const { time, pointer } = context;
        const intro = easeOutExpo(clamp01(time / 2.2));

        /* clusters surface one by one, dispersed across the field */
        for (let i = 0; i < clusters.length; i++) {
          const cluster = clusters[i];
          const appear = stagger(time, i, clusters.length, {
            delay: 0.2,
            duration: 1.15,
            spread: 1.3,
          });

          cluster.group.position.y =
            cluster.base[1] +
            (1 - appear) * -0.5 +
            Math.sin(time * 0.42 + cluster.phase) * 0.05;
          cluster.group.rotation.y =
            time * 0.05 * (i % 2 === 0 ? 1 : -1) + cluster.phase;

          cluster.body.opacity = 0.95 * appear;
          cluster.body.emissiveIntensity = 1.0 + 0.25 * Math.sin(time * 0.7 + i);
          if (cluster.glass) cluster.glass.opacity = 0.7 * appear;
          if (cluster.accent) {
            (cluster.accent as THREE.MeshBasicMaterial).opacity = 0.8 * appear;
          }

          for (const node of cluster.nodes) {
            const material = node.material as THREE.MeshStandardMaterial;
            material.opacity = 0.95 * appear;
            material.emissiveIntensity = 2.2 + 0.9 * Math.sin(time * 1.3 + i * 2);
            node.rotation.y += delta * 0.6;
          }

          for (const sprite of cluster.sprites) {
            sprite.material.opacity = 0.22 * appear;
          }

          clusterPools[i].material.opacity = 0.45 * appear;
        }

        /* arcs draw themselves once their endpoints exist */
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i];
          const progress = stagger(time, i, arcs.length, {
            delay: 0.85,
            duration: 1.5,
            spread: 1.4,
          });
          arc.geometry.setDrawRange(0, Math.floor(arc.total * progress));
          arc.material.opacity =
            0.75 * smoothstep(0, 1, progress) * (0.85 + 0.15 * Math.sin(time * 0.8 + i));
        }

        dustMaterial.opacity = 0.5 * intro;
        pool.material.opacity = 0.22 * intro;

        /* a field reads as deep, so the parallax is stronger than elsewhere */
        root.rotation.y = Math.sin(time * 0.14) * 0.05 + pointer.x * 0.24;
        root.rotation.x = -pointer.y * 0.12;
        root.position.x = pointer.x * 0.22;
      },

      dispose() {
        // Teardown is centralised: SceneCanvas disposes the whole subtree.
      },
    };
  },
};
