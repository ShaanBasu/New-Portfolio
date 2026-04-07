import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Planet({
  color = '#4a90d9',
  size = 2,
  emissiveColor = '#0a0a5e',
  rings = false,
  atmosphereColor = '#4a90d9',
  onClick,
  position = [0, 0, 0],
  rotationSpeed = 0.005,
}) {
  const meshRef = useRef()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed
    }
  })

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.15}
          roughness={0.75}
          metalness={0.1}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[size * 1.06, 32, 32]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh>
        <sphereGeometry args={[size * 1.12, 32, 32]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {rings && (
        <group rotation={[Math.PI / 5, 0, 0.2]}>
          <mesh>
            <torusGeometry args={[size * 1.9, size * 0.12, 2, 80]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
          <mesh>
            <torusGeometry args={[size * 2.2, size * 0.07, 2, 80]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </mesh>
        </group>
      )}

      <pointLight color={atmosphereColor} intensity={1.5} distance={size * 8} decay={2} />
    </group>
  )
}
