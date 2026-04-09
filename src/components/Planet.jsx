import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function buildProceduralTexture(baseColor, detail = 64) {
  const size = detail
  const data = new Uint8Array(size * size * 4)
  const base = new THREE.Color(baseColor)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const idx = (i * size + j) * 4
      const nx = j / size - 0.5
      const ny = i / size - 0.5
      // simple multi-octave noise approximation
      const n1 = Math.sin(nx * 14.1 + ny * 7.3) * 0.5 + 0.5
      const n2 = Math.sin(nx * 31.7 - ny * 19.1) * 0.5 + 0.5
      const n3 = Math.sin(nx * 5.3 + ny * 23.7) * 0.5 + 0.5
      const noise = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2)
      const variation = 0.78 + noise * 0.44
      data[idx]     = Math.min(255, Math.floor(base.r * 255 * variation))
      data[idx + 1] = Math.min(255, Math.floor(base.g * 255 * variation))
      data[idx + 2] = Math.min(255, Math.floor(base.b * 255 * variation))
      data[idx + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.needsUpdate = true
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

function buildNormalMap(detail = 64) {
  const size = detail
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const idx = (i * size + j) * 4
      const nx = j / size - 0.5
      const ny = i / size - 0.5
      const dx = Math.cos(nx * 28.2 + ny * 14.6) * 0.08
      const dy = Math.cos(ny * 28.2 - nx * 14.6) * 0.08
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

  const colorMap = useMemo(() => buildProceduralTexture(color, 128), [color])
  const normalMap = useMemo(() => buildNormalMap(128), [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += rotationSpeed * 0.6
      cloudRef.current.rotation.x += rotationSpeed * 0.15
    }
  })

  const atmColor = atmosphereColor
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
          normalScale={new THREE.Vector2(0.6, 0.6)}
          emissive={emissiveColor}
          emissiveIntensity={0.12}
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>

      {/* Cloud/haze layer */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[size * 1.025, 48, 48]} />
        <meshStandardMaterial
          color={cloudC}
          transparent
          opacity={0.07}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>

      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[size * 1.07, 48, 48]} />
        <meshBasicMaterial
          color={atmColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere halo */}
      <mesh>
        <sphereGeometry args={[size * 1.18, 32, 32]} />
        <meshBasicMaterial
          color={atmColor}
          transparent
          opacity={0.045}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Far atmosphere fringe */}
      <mesh>
        <sphereGeometry args={[size * 1.32, 32, 32]} />
        <meshBasicMaterial
          color={atmColor}
          transparent
          opacity={0.018}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {rings && (
        <group rotation={[Math.PI / 5, 0, 0.2]}>
          <mesh>
            <torusGeometry args={[size * 1.85, size * 0.14, 2, 128]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 2.15, size * 0.08, 2, 128]} />
            <meshBasicMaterial color={atmColor} transparent opacity={0.35} />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 2.42, size * 0.05, 2, 128]} />
            <meshBasicMaterial color={atmColor} transparent opacity={0.18} />
          </mesh>
        </group>
      )}

      <pointLight color={atmColor} intensity={2} distance={size * 10} decay={2} />
    </group>
  )
}
