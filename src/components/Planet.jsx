import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Map string planet types to GLSL integer uniforms
const PLANET_TYPE_INT = { ocean: 0, gas: 1, volcanic: 2, ice: 3 }

// Default sun direction – stable reference to avoid unnecessary useMemo recomputes
const DEFAULT_SUN_DIR = [5, 8, 5]

// ---------------------------------------------------------------------------
// GLSL Vertex Shader
// vObjPos  – normalized object-space sphere point (used for 3D terrain noise,
//             stays fixed on the surface as the planet rotates)
// vNormal  – world-space normal  (modelMatrix IS available in the vertex shader)
// vViewDir – world-space view direction
// ---------------------------------------------------------------------------
const PLANET_VERT = /* glsl */`
varying vec3 vObjPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vObjPos = normalize(position);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  // mat3(modelMatrix) is valid for uniform-scaled sphere normals
  vNormal   = normalize(mat3(modelMatrix) * normal);
  vViewDir  = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// ---------------------------------------------------------------------------
// GLSL Fragment Shader
// uModelMat3 – upper-left 3×3 of the mesh's world matrix, updated each frame
//              via a custom uniform so the bump-mapping gradient is correctly
//              transformed from object space to world space.
// ---------------------------------------------------------------------------
const PLANET_FRAG = /* glsl */`
precision highp float;

varying vec3 vObjPos;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform int  planetType;    // 0=ocean 1=gas 2=volcanic 3=ice
uniform vec3 sunDir;        // world-space direction toward the sun
uniform mat3 uModelMat3;    // upper-left 3×3 of world matrix (updated per frame)

// ---- 3-D value noise -------------------------------------------------------
float hash(float n) { return fract(sin(n) * 43758.5453); }

float noise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = p.x + p.y * 57.0 + 113.0 * p.z;
  return mix(
    mix(mix(hash(n),       hash(n +   1.0), f.x),
        mix(hash(n +  57.0), hash(n +  58.0), f.x), f.y),
    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
        mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
    f.z);
}

// 5-octave FBM – primary terrain (good quality, reasonable cost)
float fbm5(vec3 p) {
  float v = 0.0;
  v += 0.5000 * noise3(p); p *= 2.02;
  v += 0.2500 * noise3(p); p *= 2.03;
  v += 0.1250 * noise3(p); p *= 2.01;
  v += 0.0625 * noise3(p); p *= 2.04;
  v += 0.0313 * noise3(p);
  return v / 0.9688;
}

// 3-octave FBM – secondary detail / gas bands / fast gradient
float fbm3(vec3 p) {
  float v = 0.0;
  v += 0.5000 * noise3(p); p *= 2.02;
  v += 0.2500 * noise3(p); p *= 2.03;
  v += 0.1250 * noise3(p);
  return v / 0.8750;
}

// High-quality terrain height (used for colouring)
float terrainH(vec3 np) {
  return fbm5(np) * 0.65 + fbm3(np * 2.0 + vec3(5.2, 1.3, 2.8)) * 0.35;
}

// Lighter gradient function: only the primary fbm component.
// Using fewer octaves for the gradient keeps the bump-mapping cheap
// while still producing clear, convincing surface detail.
float gradH(vec3 np) {
  return fbm5(np);
}

void main() {
  vec3 sp = vObjPos;          // unit sphere point in object space (fixed to surface)
  vec3 np = sp * 2.5;         // primary noise coordinate

  float ht = terrainH(np);

  // ---- Bump normal ---------------------------------------------------------
  // Gradient computed in object (noise) space via the lighter gradH function,
  // then transformed to world space via uModelMat3.
  float eps = 0.012;
  float gh  = gradH(np);
  vec3 localGrad = vec3(
    gradH(np + vec3(eps, 0.0, 0.0)) - gh,
    gradH(np + vec3(0.0, eps, 0.0)) - gh,
    gradH(np + vec3(0.0, 0.0, eps)) - gh
  ) / eps;
  vec3 worldGrad = uModelMat3 * localGrad;
  vec3 tangGrad  = worldGrad - dot(worldGrad, vNormal) * vNormal;
  vec3 bn = normalize(vNormal - tangGrad * 2.0);

  // ---- Per-planet colour and material properties --------------------------
  vec3 col      = vec3(0.2);
  float specStr = 0.0;
  float specPow = 16.0;
  vec3  emit    = vec3(0.0);

  if (planetType == 0) {
    // ===== OCEAN WORLD =====
    if (ht > 0.58) {
      float t = (ht - 0.58) / 0.42;
      vec3 grass = vec3(0.07, 0.23, 0.05);
      vec3 mtn   = vec3(0.30, 0.24, 0.13);
      vec3 snow  = vec3(0.88, 0.93, 1.00);
      if (t < 0.5) col = mix(grass, mtn, t * 2.0);
      else         col = mix(mtn,  snow, (t - 0.5) * 2.0);
      specStr = 0.04; specPow = 10.0;
    } else if (ht > 0.50) {
      float t = (ht - 0.50) / 0.08;
      col = mix(vec3(0.03, 0.14, 0.16), vec3(0.06, 0.26, 0.14), t);
      specStr = 0.45; specPow = 48.0;
    } else {
      float t = ht / 0.50;
      col = mix(vec3(0.005, 0.018, 0.07), vec3(0.02, 0.07, 0.20), t);
      specStr = 0.95; specPow = 200.0;
    }
    // Polar ice caps
    float lat = abs(sp.y);
    if (lat > 0.73) {
      float it = smoothstep(0.73, 0.95, lat);
      col     = mix(col, vec3(0.90, 0.95, 1.00), it);
      specStr = mix(specStr, 0.45, it);
      specPow = mix(specPow, 40.0, it);
    }
    // Night-side city lights
    float dl = dot(bn, normalize(sunDir));
    if (dl < 0.05 && ht > 0.58) {
      float cn = fbm3(np * 9.0 + vec3(100.0, 50.0, 25.0));
      cn = pow(max(0.0, cn - 0.55), 2.5) * 8.0;
      float nf = smoothstep(0.05, -0.25, dl);
      emit += vec3(1.0, 0.85, 0.35) * cn * nf * 0.65;
    }

  } else if (planetType == 1) {
    // ===== GAS GIANT =====
    float turb = fbm3(np * 0.6 + vec3(0.0, 10.0, 0.0));
    float band = sin(sp.y * 20.0 + turb * 6.0) * 0.5 + 0.5;
    band = band * 0.70 + turb * 0.30;
    float sd    = length(sp - normalize(vec3(0.6, 0.1, 0.75)));
    float storm = smoothstep(0.38, 0.15, sd);
    vec3 c1 = vec3(0.13, 0.02, 0.36);
    vec3 c2 = vec3(0.50, 0.16, 0.70);
    vec3 c3 = vec3(0.87, 0.56, 0.94);
    if      (band < 0.45) col = mix(c1, c2, band / 0.45);
    else if (band < 0.75) col = mix(c2, c3, (band - 0.45) / 0.30);
    else                  col = mix(c3, c1, (band - 0.75) / 0.25);
    col   = mix(col, vec3(0.90, 0.60, 0.25), storm * 0.65);
    emit  = col * 0.04;
    specStr = 0.15; specPow = 24.0;

  } else if (planetType == 2) {
    // ===== VOLCANIC =====
    float c1 = fbm5(np * 3.5 + vec3(7.3, 3.1, 9.0));
    float c2 = fbm3(np * 7.0 + vec3(2.1, 15.0, 4.5));
    float lv = pow(c1 * 0.55 + c2 * 0.45, 1.8);
    float lt = smoothstep(0.38, 0.60, lv);
    vec3 rock  = vec3(0.06, 0.03, 0.02) + ht * vec3(0.05, 0.02, 0.01);
    vec3 lavaA = vec3(0.90, 0.22, 0.01);
    vec3 lavaB = vec3(1.00, 0.85, 0.10);
    col   = mix(rock, mix(lavaA, lavaB, smoothstep(0.5, 0.85, lv)), lt);
    emit  = mix(vec3(0.0), lavaA * 1.8, lt * lt);
    specStr = lt * 0.55; specPow = 80.0;

  } else {
    // ===== ICE WORLD =====
    float cr = fbm5(np * 2.8 + vec3(11.3, 5.7, 0.0));
    float ri = fbm3(np * 5.5 + vec3(2.4, 8.1, 1.5));
    float t  = cr * 0.55 + ri * 0.45;
    col = mix(
      mix(vec3(0.03, 0.09, 0.25), vec3(0.55, 0.78, 0.94), smoothstep(0.0, 0.4, t)),
      vec3(0.92, 0.97, 1.00),
      smoothstep(0.4, 1.0, t)
    );
    float au = fbm3(np * 1.5 + vec3(20.5, 0.0, 0.0));
    float al = smoothstep(0.3, 0.65, abs(sp.y));
    emit += vec3(0.0, au * 0.45, au * 0.22) * al;
    specStr = 0.75; specPow = 80.0;
  }

  // ---- Blinn-Phong Lighting -----------------------------------------------
  vec3 ld   = normalize(sunDir);
  float diff = max(0.0, dot(bn, ld));
  float amb  = 0.10;
  vec3  hv   = normalize(ld + normalize(vViewDir));
  float spec = pow(max(0.0, dot(bn, hv)), specPow) * specStr;

  vec3 lit = col * (amb + diff) + vec3(spec) + emit;

  // ---- Atmospheric Rim Glow -----------------------------------------------
  float rim = 1.0 - max(0.0, dot(normalize(vNormal), normalize(vViewDir)));
  rim = pow(rim, 2.8);
  vec3 atm;
  if      (planetType == 0) atm = vec3(0.14, 0.52, 1.00);
  else if (planetType == 1) atm = vec3(0.52, 0.12, 0.88);
  else if (planetType == 2) atm = vec3(1.00, 0.22, 0.02);
  else                       atm = vec3(0.32, 0.73, 1.00);
  lit += rim * atm * 1.5;

  // ---- Filmic Tonemapping + Gamma -----------------------------------------
  lit = lit / (lit + vec3(0.85));
  lit = pow(max(lit, vec3(0.0)), vec3(1.0 / 2.2));

  gl_FragColor = vec4(lit, 1.0);
}
`

export default function Planet({
  color = '#4a90d9',
  planetType = null,
  size = 2,
  emissiveColor = '#0a0a5e',  // kept for API compatibility
  rings = false,
  atmosphereColor = '#4a90d9',
  onClick,
  position = [0, 0, 0],
  rotationSpeed = 0.005,
  cloudColor = null,
  sunDirection = DEFAULT_SUN_DIR,
}) {
  const meshRef  = useRef()
  const cloudRef = useRef()

  // Build the custom ShaderMaterial once per planet type.
  // uModelMat3 is a custom uniform (upper-left 3×3 of the world matrix) that
  // we update each frame so the bump-mapping gradient can be correctly
  // transformed from object space to world space without needing the built-in
  // modelMatrix (which is unavailable in fragment shaders of ShaderMaterial).
  const material = useMemo(() => {
    const typeInt = PLANET_TYPE_INT[planetType] ?? 0
    const sun = new THREE.Vector3(
      sunDirection[0], sunDirection[1], sunDirection[2]
    ).normalize()
    return new THREE.ShaderMaterial({
      vertexShader:   PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      uniforms: {
        planetType:  { value: typeInt },
        sunDir:      { value: sun },
        uModelMat3:  { value: new THREE.Matrix3() },
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetType, sunDirection[0], sunDirection[1], sunDirection[2]])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed
      // Keep uModelMat3 in sync with the mesh's world matrix so the
      // fragment-shader bump normals stay correctly aligned with the terrain.
      material.uniforms.uModelMat3.value.setFromMatrix4(meshRef.current.matrixWorld)
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += rotationSpeed * 0.55
      cloudRef.current.rotation.x += rotationSpeed * 0.12
    }
  })

  const cloudC = cloudColor || atmosphereColor

  return (
    <group position={position} onClick={onClick}>
      {/* Planet body – rendered with custom GLSL shader */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 128, 128]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Thin cloud / haze shell */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[size * 1.022, 64, 64]} />
        <meshBasicMaterial
          color={cloudC}
          transparent
          opacity={planetType === 'gas' ? 0.10 : 0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[size * 1.07, 64, 64]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Mid atmosphere halo */}
      <mesh>
        <sphereGeometry args={[size * 1.22, 48, 48]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Far atmosphere fringe */}
      <mesh>
        <sphereGeometry args={[size * 1.42, 32, 32]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.025}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {rings && (
        <group rotation={[Math.PI / 5, 0, 0.2]}>
          <mesh>
            <torusGeometry args={[size * 1.85, size * 0.14, 2, 180]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 2.15, size * 0.09, 2, 180]} />
            <meshBasicMaterial color={atmosphereColor} transparent opacity={0.38} />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 2.45, size * 0.06, 2, 180]} />
            <meshBasicMaterial color={atmosphereColor} transparent opacity={0.20} />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 2.72, size * 0.04, 2, 180]} />
            <meshBasicMaterial color={atmosphereColor} transparent opacity={0.10} />
          </mesh>
        </group>
      )}

      <pointLight color={atmosphereColor} intensity={2.2} distance={size * 11} decay={2} />
    </group>
  )
}

