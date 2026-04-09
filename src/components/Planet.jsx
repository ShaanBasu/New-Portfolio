import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// --- HD Noise helpers ---
function hash2d(ix, iy) {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function valueNoise(x, y) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  return (
    hash2d(ix, iy) * (1 - ux) * (1 - uy) +
    hash2d(ix + 1, iy) * ux * (1 - uy) +
    hash2d(ix, iy + 1) * (1 - ux) * uy +
    hash2d(ix + 1, iy + 1) * ux * uy
  )
}

function fbm(x, y, octaves = 6) {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  let maxVal = 0
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency) * amplitude
    maxVal += amplitude
    amplitude *= 0.5
    frequency *= 2.0
  }
  return value / maxVal
}

// --- Planet-type texture builders ---
function buildPlanetTexture(planetType, baseColor, detail = 256) {
  const size = detail
  const data = new Uint8Array(size * size * 4)

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const idx = (i * size + j) * 4
      const u = j / (size - 1)
      const v = i / (size - 1)
      const nx = u * 4.0
      const ny = v * 4.0
      const n = fbm(nx, ny, 6)

      let r, g, b

      if (planetType === 'ocean') {
        // Teal/green ocean world with continents and ice caps
        if (n > 0.62) {
          const t = Math.min(1, (n - 0.62) / 0.38)
          r = Math.floor(20 + t * 65)
          g = Math.floor(88 + t * 60)
          b = Math.floor(28 + t * 28)
        } else if (n > 0.55) {
          const t = (n - 0.55) / 0.07
          r = Math.floor(10 + t * 10)
          g = Math.floor(95 + t * 25)
          b = Math.floor(110 + t * 10)
        } else {
          const t = n / 0.55
          r = Math.floor(4 + t * 18)
          g = Math.floor(52 + t * 68)
          b = Math.floor(88 + t * 85)
        }
        // Polar ice caps
        const latFactor = Math.abs(v - 0.5) * 2
        if (latFactor > 0.80) {
          const ice = Math.min(1, (latFactor - 0.80) / 0.20)
          r = Math.floor(r + ice * (210 - r))
          g = Math.floor(g + ice * (228 - g))
          b = Math.floor(b + ice * (255 - b))
        }
      } else if (planetType === 'gas') {
        // Purple gas giant with swirling horizontal bands
        const bandN = v * 5 * Math.PI
        const swirl = fbm(nx * 0.7, ny * 0.7 + n * 3.5, 4)
        const band = (Math.sin(bandN + swirl * 4.5) * 0.5 + 0.5) * 0.65 + swirl * 0.35
        r = Math.floor(58 + band * 125)
        g = Math.floor(8 + band * 52)
        b = Math.floor(138 + band * 117)
        if (band > 0.72) {
          const hi = (band - 0.72) / 0.28
          r = Math.min(255, Math.floor(r + hi * 80))
          g = Math.min(255, Math.floor(g + hi * 30))
          b = Math.min(255, Math.floor(b + hi * 50))
        }
      } else if (planetType === 'volcanic') {
        // Dark volcanic world with glowing lava cracks
        const crack = fbm(nx * 2.8 + 7.3, ny * 2.8 + 3.1, 5)
        if (crack > 0.64) {
          const t = Math.min(1, (crack - 0.64) / 0.36)
          r = Math.floor(175 + t * 80)
          g = Math.floor(55 + t * 140)
          b = Math.floor(4 + t * 18)
        } else {
          const t = n * 0.5 + crack * 0.5
          r = Math.floor(18 + t * 62)
          g = Math.floor(8 + t * 32)
          b = Math.floor(3 + t * 14)
        }
      } else if (planetType === 'ice') {
        // Ice world with crystal structures and aurora tints
        const crystal = fbm(nx * 2.2 + 11.3, ny * 2.2 + 5.7, 5)
        const t = crystal * 0.55 + n * 0.45
        r = Math.floor(135 + t * 120)
        g = Math.floor(188 + t * 67)
        b = Math.floor(212 + t * 43)
        const aurora = fbm(nx * 1.3 + 20.5, ny * 1.3, 3)
        if (aurora > 0.56) {
          const at = (aurora - 0.56) / 0.44
          g = Math.min(255, Math.floor(g + at * 38))
          b = Math.min(255, Math.floor(b + at * 28))
        }
      } else {
        // Fallback: color-based with FBM variation
        const col = new THREE.Color(baseColor || '#4a90d9')
        const variation = 0.68 + n * 0.62
        r = Math.min(255, Math.floor(col.r * 255 * variation))
        g = Math.min(255, Math.floor(col.g * 255 * variation))
        b = Math.min(255, Math.floor(col.b * 255 * variation))
      }

      data[idx]     = Math.max(0, Math.min(255, r))
      data[idx + 1] = Math.max(0, Math.min(255, g))
      data[idx + 2] = Math.max(0, Math.min(255, b))
      data[idx + 3] = 255
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.needsUpdate = true
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  return tex
}

function buildNormalMap(planetType, detail = 256) {
  const size = detail
  const data = new Uint8Array(size * size * 4)
  const strength = planetType === 'volcanic' ? 3.8 : planetType === 'ice' ? 2.8 : 2.2

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const idx = (i * size + j) * 4
      const u = j / (size - 1)
      const v = i / (size - 1)
      const nx = u * 4.0
      const ny = v * 4.0
      const eps = 4.0 / size
      const hC = fbm(nx, ny, 5)
      const hR = fbm(nx + eps, ny, 5)
      const hU = fbm(nx, ny + eps, 5)
      const dx = Math.max(-1, Math.min(1, (hR - hC) * strength))
      const dy = Math.max(-1, Math.min(1, (hU - hC) * strength))
      data[idx]     = Math.floor(127 + dx * 127)
      data[idx + 1] = Math.floor(127 + dy * 127)
      data[idx + 2] = 255
      data[idx + 3] = 255
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.needsUpdate = true
  return tex
}

export default function Planet({
  color = '#4a90d9',
  planetType = null,
  size = 2,
  emissiveColor = '#0a0a5e',
  rings = false,
  atmosphereColor = '#4a90d9',
  onClick,
  position = [0, 0, 0],
  rotationSpeed = 0.005,
  cloudColor = null,
}) {
  const meshRef = useRef()
  const cloudRef = useRef()

  const colorMap = useMemo(() => buildPlanetTexture(planetType, color, 256), [planetType, color])
  const normalMap = useMemo(() => buildNormalMap(planetType, 256), [planetType])

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += rotationSpeed
    if (cloudRef.current) {
      cloudRef.current.rotation.y += rotationSpeed * 0.6
      cloudRef.current.rotation.x += rotationSpeed * 0.15
    }
  })

  const cloudC = cloudColor || atmosphereColor

  return (
    <group position={position} onClick={onClick}>
      {/* Planet body */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[size, 96, 96]} />
        <meshStandardMaterial
          color={color}
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          emissive={emissiveColor}
          emissiveIntensity={0.15}
          roughness={0.70}
          metalness={0.10}
        />
      </mesh>

      {/* Cloud/haze layer */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[size * 1.025, 64, 64]} />
        <meshStandardMaterial
          color={cloudC}
          transparent
          opacity={planetType === 'gas' ? 0.13 : 0.08}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>

      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[size * 1.07, 64, 64]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.13}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Mid atmosphere halo */}
      <mesh>
        <sphereGeometry args={[size * 1.20, 48, 48]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.055}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Far atmosphere fringe */}
      <mesh>
        <sphereGeometry args={[size * 1.38, 32, 32]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.022}
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
