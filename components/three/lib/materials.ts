import * as THREE from "three";

/**
 * Custom shader materials for the landing-page scenes.
 *
 * Colour convention: uniforms are `THREE.Color` instances, which three stores
 * in linear working space. Each fragment shader ends with
 * `#include <colorspace_fragment>` so the output is encoded to sRGB exactly
 * like the built-in materials around them.
 */

const COLORSPACE = "#include <colorspace_fragment>";

/* ───────────────────────────────────────────────────────────────────────────
   Iridescent shell — the hero memory core's outer skin
   ─────────────────────────────────────────────────────────────────────────── */

const SHELL_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying vec3 vLocal;

  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBands;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uRim;

  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying vec3 vLocal;

  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm3(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amp * vnoise(p);
      p = p * 2.02 + 11.3;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewW);
    float facing = clamp(dot(N, V), 0.0, 1.0);
    float fres = 1.0 - facing;

    // Domain-warped fbm gives the surface its nebula folds. Sampling in local
    // space keeps the pattern attached to the shell as it turns.
    vec3 q = vLocal * uBands * 0.42;
    float warp = fbm3(q * 1.3 + vec3(0.0, uTime * 0.05, 0.0));
    float nebula = fbm3(q + warp * 1.6 + vec3(uTime * 0.025, -uTime * 0.04, 0.0));
    nebula = smoothstep(0.28, 0.8, nebula);

    // Brand palette only: blue body, violet in the folds, cyan in the hot veins.
    vec3 irid = mix(uColorA, uColorB, smoothstep(0.15, 0.8, nebula));
    irid = mix(irid, uRim, pow(nebula, 2.6) * 0.42);

    // The orb must read as a lit volume, not a silhouette ring: brightest
    // head-on, with a thin glass edge that stays dimmer than the core.
    float centre = pow(facing, 2.4);
    float rim = pow(fres, 7.0);

    vec3 color = irid * (0.10 + centre * 0.98);
    color += uRim * (centre * 0.3 + pow(nebula, 1.8) * 0.4);
    color += uRim * rim * 0.2;

    float alpha = clamp(
      uOpacity * (0.05 + centre * 0.7 + nebula * 0.2 + rim * 0.08),
      0.0,
      0.94
    );
    gl_FragColor = vec4(color, alpha);
    ${COLORSPACE}
  }
`;

export function createShellMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uBands: { value: 7.5 },
      uColorA: { value: new THREE.Color("#2a4fae") },
      uColorB: { value: new THREE.Color("#9a7bff") },
      uRim: { value: new THREE.Color("#7acbff") },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: SHELL_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    // FrontSide only: the back hemisphere would otherwise add a uniform,
    // full-bright layer and the core reads as a glowing ring.
    side: THREE.FrontSide,
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   Volumetric glow shell — a soft, view-facing halo around a core
   ─────────────────────────────────────────────────────────────────────────── */

const HALO_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;

  varying vec3 vNormalW;
  varying vec3 vViewW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewW);
    float facing = clamp(dot(N, V), 0.0, 1.0);
    float glow = pow(facing, 2.2);

    // slow breathing so the core never looks frozen
    glow *= 0.88 + 0.12 * sin(uTime * 0.7);

    gl_FragColor = vec4(uColor * glow, glow * uOpacity);
    ${COLORSPACE}
  }
`;

export function createHaloMaterial(color: THREE.ColorRepresentation): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.9 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: HALO_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    // Head-on glow. BackSide normals face away from the camera, so `facing`
    // collapses to zero and the halo only survives as a rim ring.
    side: THREE.FrontSide,
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   Portal surface — the swirling lit opening in the installation scene
   ─────────────────────────────────────────────────────────────────────────── */

const PORTAL_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PORTAL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHot;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amp * noise(p);
      p = p * 2.03 + 17.1;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * vec2(1.7, 2.8);
    float t = uTime * 0.11;

    // Domain warp turns the noise field into a slow vortex.
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    float n = fbm(p + q * 2.3 + t * 0.55);
    n = pow(clamp(n, 0.0, 1.0), 1.22);

    vec3 color = mix(uColorDeep, uColorMid, smoothstep(0.12, 0.82, n));
    color = mix(color, uColorHot, smoothstep(0.5, 1.0, n) * 0.9);

    // Frame the opening: darken toward the bezel, keep the centre hot.
    float edge =
      smoothstep(0.0, 0.16, uv.x) * smoothstep(0.0, 0.16, 1.0 - uv.x) *
      smoothstep(0.0, 0.1, uv.y) * smoothstep(0.0, 0.22, 1.0 - uv.y);

    color *= mix(0.55, 1.35, edge) * uIntensity;
    gl_FragColor = vec4(color, 1.0);
    ${COLORSPACE}
  }
`;

export function createPortalMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uColorDeep: { value: new THREE.Color("#2b1b6b") },
      uColorMid: { value: new THREE.Color("#8b7cff") },
      uColorHot: { value: new THREE.Color("#e6dcff") },
    },
    vertexShader: PORTAL_VERTEX,
    fragmentShader: PORTAL_FRAGMENT,
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   Shared helpers
   ─────────────────────────────────────────────────────────────────────────── */

/** Advances every `uTime` uniform found beneath `root`. */
export function tickShaderTime(root: THREE.Object3D, time: number): void {
  root.traverse((object) => {
    const material = (object as THREE.Mesh).material;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    for (const entry of list) {
      const uniforms = (entry as THREE.ShaderMaterial).uniforms;
      if (uniforms?.uTime) uniforms.uTime.value = time;
    }
  });
}

/** Thin additive line material used for filaments and constellation arcs. */
export function createFilamentMaterial(
  color: THREE.ColorRepresentation,
  opacity = 0.5,
): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
