import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

const STAR_COUNT = 3000
const starPositions = new Float32Array(STAR_COUNT * 3)
const starColors = new Float32Array(STAR_COUNT * 3)
for (let i = 0; i < STAR_COUNT; i++) {
  const i3 = i * 3
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = 50 + Math.random() * 150
  starPositions[i3] = r * Math.sin(phi) * Math.cos(theta)
  starPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
  starPositions[i3 + 2] = r * Math.cos(phi)
  const blueShift = Math.random()
  starColors[i3] = 0.6 + Math.random() * 0.4 - blueShift * 0.2
  starColors[i3 + 1] = 0.7 + Math.random() * 0.3 - blueShift * 0.1
  starColors[i3 + 2] = 0.8 + Math.random() * 0.2
}

function Stars() {
  const pointsRef = useRef()
  const positions = starPositions
  const colors = starColors

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00008
      pointsRef.current.rotation.x += 0.00003
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.3} vertexColors transparent opacity={0.85} sizeAttenuation />
    </points>
  )
}

export default function StarField() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      camera={{ position: [0, 0, 1], fov: 75 }}
      gl={{ antialias: true }}
    >
      <Stars />
    </Canvas>
  )
}
