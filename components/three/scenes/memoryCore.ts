import * as THREE from "three";
import {
  createFilamentMaterial,
  createHaloMaterial,
  createShellMaterial,
  tickShaderTime,
} from "../lib/materials";
import { createLightPool, createStudioRig } from "../lib/lighting";
import { glowTexture, makeGlowSprite } from "../lib/glow";
import { applyEnvironment } from "../lib/environment";
import { clamp01, easeOutExpo, lerp, seededRandom, stagger } from "../lib/anim";
import type { SceneDefinition, SceneInstance } from "../types";

/**
 * SECTION 01 — The Atlas memory core.
 *
 * A dark polished icosahedral core wrapped in an iridescent glass shell and a
 * crystalline cage, encircled by five orbital rings of illuminated nodes
 * joined by fine filaments. Everything rotates slowly; nothing shouts.
 */

const RING_COUNT = 5;
const FILAMENT_SEGMENTS = 12;
const UP = new THREE.Vector3(0, 1, 0);

interface RingState {
  radius: number;
  speed: number;
  spin: number;
  quaternion: THREE.Quaternion;
  material: THREE.MeshBasicMaterial;
}

interface NodeState {
  ring: number;
  angle: number;
  radius: number;
  mesh: THREE.Mesh;
  sprite: THREE.Sprite;
}

export const memoryCoreScene: SceneDefinition = {
  name: "memory-core",
  camera: { fov: 42, position: [0, 0.5, 7.6], lookAt: [0, 0, 0] },
  mobileCamera: { fov: 52, position: [0, 0.8, 10.4] },
  density: 0.55,
  factory(ctx): SceneInstance {
    const { scene } = ctx;
    applyEnvironment(scene, ctx.renderer);

    const density = ctx.quality === "low" ? 0.55 : 1;
    const rig = createStudioRig({ intensity: 1.15, ambient: 0.42 });
    scene.add(rig.group);

    const root = new THREE.Group();
    scene.add(root);

    const pool = createLightPool("#2f6cc0", 12, 0.26);
    pool.position.set(0, -0.4, -3.2);
    root.add(pool);

    /* ── 1. dark polished core ─────────────────────────────────────────── */
    // Small enough that the shell above it can fully light the volume. The
    // faint emissive keeps the centre from reading as a hole punched in the orb.
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.0, 1),
      new THREE.MeshStandardMaterial({
        color: 0x0b1728,
        emissive: new THREE.Color(0x1f4d8f),
        emissiveIntensity: 0.38,
        metalness: 0.94,
        roughness: 0.15,
        flatShading: true,
      }),
    );
    root.add(core);

    /* ── 2. hot inner light ────────────────────────────────────────────── */
    // Sits between the core and the shell so it fills the orb from the inside.
    const innerMaterial = createHaloMaterial("#7cc0ff");
    innerMaterial.uniforms.uOpacity.value = 0.72;
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.28, 2), innerMaterial);
    root.add(inner);

    /* ── 3. iridescent glass shell ─────────────────────────────────────── */
    const shellMaterial = createShellMaterial();
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.8, ctx.quality === "low" ? 3 : 4),
      shellMaterial,
    );
    root.add(shell);

    /* ── 3b. atmospheric halo ──────────────────────────────────────────── */
    // A wide additive sprite behind the orb: gives the core presence against
    // the page background that a purely geometric shell cannot.
    const aura = makeGlowSprite({ color: "#5fa8ff", size: 6.9, opacity: 0 });
    aura.position.set(0, 0, -0.6);
    root.add(aura);

    /* ── 4. crystalline cage ───────────────────────────────────────────── */
    const cageSource = new THREE.IcosahedronGeometry(2.2, 1);
    const cageMaterial = new THREE.LineBasicMaterial({
      color: 0x6fb4ff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cage = new THREE.LineSegments(new THREE.EdgesGeometry(cageSource), cageMaterial);
    cageSource.dispose();
    root.add(cage);

    /* ── 5. orbital rings, nodes and filaments ─────────────────────────── */
    const system = new THREE.Group();
    root.add(system);

    const random = seededRandom(20261017);
    const rings: RingState[] = [];
    const nodes: NodeState[] = [];

    for (let r = 0; r < RING_COUNT; r++) {
      const radius = 2.35 + r * 0.32;
      const axis = new THREE.Vector3(
        random() - 0.5,
        random() - 0.5,
        random() - 0.5,
      ).normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, axis);

      const geometry = new THREE.TorusGeometry(
        radius,
        0.007,
        6,
        ctx.quality === "low" ? 128 : 240,
      );
      // The torus is authored in the XY plane; rotate it into XZ so it shares
      // the node ring's frame (normal +Y) before the axis quaternion applies.
      geometry.rotateX(-Math.PI / 2);

      const material = new THREE.MeshBasicMaterial({
        color: r % 2 === 0 ? 0x4f93e0 : 0x8b7cff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const torus = new THREE.Mesh(geometry, material);
      torus.quaternion.copy(quaternion);
      system.add(torus);

      rings.push({
        radius,
        speed: (0.06 + random() * 0.09) * (r % 2 === 0 ? 1 : -1),
        spin: random() * Math.PI * 2,
        quaternion,
        material,
      });
    }

    for (let r = 0; r < RING_COUNT; r++) {
      const ring = rings[r];
      const count = Math.round((4 + (r % 3)) * density) + 2;

      for (let n = 0; n < count; n++) {
        const angle = (n / count) * Math.PI * 2 + r * 0.7;
        const size = 0.045 + random() * 0.035;

        const mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(size, 0),
          new THREE.MeshStandardMaterial({
            color: 0xdfeaff,
            emissive: new THREE.Color(r % 2 === 0 ? 0x4f93e0 : 0x8b7cff),
            emissiveIntensity: 2.4,
            metalness: 0.2,
            roughness: 0.3,
          }),
        );
        system.add(mesh);

        const sprite = makeGlowSprite({
          color: r % 2 === 0 ? "#6fb4ff" : "#a99bff",
          size: size * 9,
          opacity: 0,
        });
        mesh.add(sprite);

        nodes.push({ ring: r, angle, radius: ring.radius, mesh, sprite });
      }
    }

    // Filaments join nodes on *different* rings, so the wiring reads as a
    // network rather than as beads threaded on a wire.
    const filamentPairs: Array<[number, number]> = [];
    const filamentCount = Math.round(22 * density);
    for (let i = 0; i < filamentCount; i++) {
      const a = Math.floor(random() * nodes.length);
      const b = Math.floor(random() * nodes.length);
      if (nodes[a].ring === nodes[b].ring) continue;
      filamentPairs.push([a, b]);
    }

    const filamentPositions = new Float32Array(
      filamentPairs.length * FILAMENT_SEGMENTS * 2 * 3,
    );
    const filamentGeometry = new THREE.BufferGeometry();
    filamentGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(filamentPositions, 3),
    );
    const filamentMaterial = createFilamentMaterial("#5f9fe8", 0.26);
    const filaments = new THREE.LineSegments(filamentGeometry, filamentMaterial);
    system.add(filaments);

    /* ── 6. drifting dust ──────────────────────────────────────────────── */
    const dustCount = Math.round(1500 * density);
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const radius = 2.4 + Math.pow(random(), 0.65) * 5.0;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      dustPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = radius * Math.cos(phi) * 0.62;
      dustPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
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
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    root.add(dust);

    /* ── 7. floating memory fragments ──────────────────────────────────── */
    const fragmentCount = Math.round(18 * density);
    const fragments: THREE.Mesh[] = [];
    const fragmentBaseY: number[] = [];
    for (let i = 0; i < fragmentCount; i++) {
      const radius = 2.9 + random() * 2.6;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const y = radius * Math.cos(phi) * 0.55;

      const fragment = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.02, 0.22),
        new THREE.MeshStandardMaterial({
          color: 0x9fb6d8,
          metalness: 0.6,
          roughness: 0.28,
          transparent: true,
          opacity: 0,
        }),
      );
      fragment.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        y,
        radius * Math.sin(phi) * Math.sin(theta),
      );
      fragment.rotation.set(random() * 3, random() * 3, random() * 3);
      fragmentBaseY.push(y);
      fragments.push(fragment);
      root.add(fragment);
    }

    /* ── animation ─────────────────────────────────────────────────────── */
    const scratchA = new THREE.Vector3();
    const scratchB = new THREE.Vector3();
    const scratchC = new THREE.Vector3();
    const pointA = new THREE.Vector3();
    const pointB = new THREE.Vector3();

    const nodePosition = (
      node: NodeState,
      angle: number,
      target: THREE.Vector3,
    ): THREE.Vector3 =>
      target
        .set(Math.cos(angle) * node.radius, 0, Math.sin(angle) * node.radius)
        .applyQuaternion(rings[node.ring].quaternion);

    /** Quadratic Bézier evaluated without allocating. */
    const bezier = (
      p0: THREE.Vector3,
      control: THREE.Vector3,
      p1: THREE.Vector3,
      t: number,
      out: THREE.Vector3,
    ): THREE.Vector3 => {
      const inv = 1 - t;
      return out.set(
        inv * inv * p0.x + 2 * inv * t * control.x + t * t * p1.x,
        inv * inv * p0.y + 2 * inv * t * control.y + t * t * p1.y,
        inv * inv * p0.z + 2 * inv * t * control.z + t * t * p1.z,
      );
    };

    return {
      update(context, delta) {
        const { time, pointer } = context;
        const intro = easeOutExpo(clamp01(time / 2.3));

        tickShaderTime(root, time);

        // The core assembles first, then the rings light up in sequence.
        const coreScale = lerp(0.62, 1, intro);
        core.scale.setScalar(coreScale);
        inner.scale.setScalar(coreScale);
        shell.scale.setScalar(coreScale);
        cage.scale.setScalar(coreScale);
        shellMaterial.uniforms.uOpacity.value = intro;
        innerMaterial.uniforms.uOpacity.value = 0.72 * intro;
        aura.material.opacity = 0.38 * intro;
        cageMaterial.opacity = 0.16 * intro;

        pool.material.opacity = 0.26 * intro;
        dustMaterial.opacity = 0.55 * intro;

        for (let r = 0; r < RING_COUNT; r++) {
          const ring = rings[r];
          ring.spin += ring.speed * delta;
          ring.material.opacity =
            stagger(time, r, RING_COUNT, {
              delay: 0.34,
              duration: 1.15,
              spread: 1.25,
            }) * 0.6;
        }

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          nodePosition(node, node.angle + rings[node.ring].spin, scratchA);

          const appear = stagger(time, node.ring, RING_COUNT, {
            delay: 0.5,
            duration: 1.3,
            spread: 1.25,
          });
          const pulse = 0.85 + 0.15 * Math.sin(time * 1.6 + i * 1.7);

          node.mesh.position.copy(scratchA);
          node.mesh.scale.setScalar(Math.max(0.001, appear * pulse));
          node.mesh.rotation.y += delta * 0.4;
          node.sprite.material.opacity = 0.75 * appear;
        }

        // Re-thread the filaments between the node positions each frame.
        let cursor = 0;
        for (const [a, b] of filamentPairs) {
          nodePosition(
            nodes[a],
            nodes[a].angle + rings[nodes[a].ring].spin,
            scratchA,
          );
          nodePosition(
            nodes[b],
            nodes[b].angle + rings[nodes[b].ring].spin,
            scratchB,
          );
          // Bow the line away from the centre so crossings look woven.
          scratchC.copy(scratchA).add(scratchB).multiplyScalar(0.58);

          for (let s = 0; s < FILAMENT_SEGMENTS; s++) {
            bezier(scratchA, scratchC, scratchB, s / FILAMENT_SEGMENTS, pointA);
            bezier(
              scratchA,
              scratchC,
              scratchB,
              (s + 1) / FILAMENT_SEGMENTS,
              pointB,
            );
            filamentPositions[cursor++] = pointA.x;
            filamentPositions[cursor++] = pointA.y;
            filamentPositions[cursor++] = pointA.z;
            filamentPositions[cursor++] = pointB.x;
            filamentPositions[cursor++] = pointB.y;
            filamentPositions[cursor++] = pointB.z;
          }
        }
        filamentGeometry.attributes.position.needsUpdate = true;
        filamentMaterial.opacity = 0.26 * stagger(time, 0, 1, { delay: 0.9, duration: 1.6 });

        for (let i = 0; i < fragments.length; i++) {
          const fragment = fragments[i];
          (fragment.material as THREE.MeshStandardMaterial).opacity = 0.5 * intro;
          fragment.rotation.x += delta * 0.08;
          fragment.rotation.z += delta * 0.05;
          fragment.position.y = fragmentBaseY[i] + Math.sin(time * 0.4 + i) * 0.12;
        }

        // Slow orbital drift plus a restrained pointer parallax.
        system.rotation.y = time * 0.075;
        system.rotation.x = Math.sin(time * 0.18) * 0.06;
        dust.rotation.y = -time * 0.022;

        root.rotation.y = pointer.x * 0.2;
        root.rotation.x = -pointer.y * 0.13;
        root.position.y = Math.sin(time * 0.42) * 0.05;
      },

      dispose() {
        // Teardown is centralised: SceneCanvas disposes the whole subtree.
      },
    };
  },
};
