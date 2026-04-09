import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

const GALAXY_COUNT = 8000
const galaxyPositions = new Float32Array(GALAXY_COUNT * 3)
const galaxyColors = new Float32Array(GALAXY_COUNT * 3)
for (let i = 0; i < GALAXY_COUNT; i++) {
  const i3 = i * 3
  const arm = i % 2
  const armOffset = arm * Math.PI
  const t = Math.random()
  const radius = Math.pow(t, 0.5) * 25
  const spiralAngle = radius * 0.4 + armOffset
  const scatter = (1 - t) * 0.8 + 0.1
  galaxyPositions[i3] = Math.cos(spiralAngle) * radius + (Math.random() - 0.5) * scatter * 3
  galaxyPositions[i3 + 1] = (Math.random() - 0.5) * (scatter * 1.5 + 0.3)
  galaxyPositions[i3 + 2] = Math.sin(spiralAngle) * radius + (Math.random() - 0.5) * scatter * 3
  const coreT = 1 - t
  galaxyColors[i3] = THREE.MathUtils.lerp(1.0, 0.3, coreT * 0.5)
  galaxyColors[i3 + 1] = THREE.MathUtils.lerp(0.7, 0.5, coreT * 0.3)
  galaxyColors[i3 + 2] = THREE.MathUtils.lerp(0.2, 1.0, coreT)
}

function GalaxyParticles() {
  const pointsRef = useRef()
  const positions = galaxyPositions
  const colors = galaxyColors

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.15} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  )
}

function CenterPlanet() {
  const meshRef = useRef()
  const cloudRef = useRef()
  const ringRef = useRef()

  // Procedural teal/green texture matching HomeSection planet
  const colorMap = (() => {
    const size = 128
    const data = new Uint8Array(size * size * 4)
    const base = new THREE.Color('#1a6b5a')
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4
        const nx = j / size - 0.5
        const ny = i / size - 0.5
        const n1 = Math.sin(nx * 14.1 + ny * 7.3) * 0.5 + 0.5
        const n2 = Math.sin(nx * 31.7 - ny * 19.1) * 0.5 + 0.5
        const n3 = Math.sin(nx * 5.3 + ny * 23.7) * 0.5 + 0.5
        const v = 0.78 + (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 0.44
        data[idx]     = Math.min(255, Math.floor(base.r * 255 * v))
        data[idx + 1] = Math.min(255, Math.floor(base.g * 255 * v))
        data[idx + 2] = Math.min(255, Math.floor(base.b * 255 * v))
        data[idx + 3] = 255
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    tex.needsUpdate = true
    return tex
  })()

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.003
    if (cloudRef.current) cloudRef.current.rotation.y += 0.0018
    if (ringRef.current) ringRef.current.rotation.z += 0.0004
  })

  return (
    <group>
      {/* Planet body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 96, 96]} />
        <meshStandardMaterial
          color="#1a6b5a"
          map={colorMap}
          emissive="#0a3d2e"
          emissiveIntensity={0.12}
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.231, 48, 48]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {/* Atmosphere layers */}
      <mesh>
        <sphereGeometry args={[1.284, 48, 48]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.416, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Rings */}
      <group ref={ringRef} rotation={[Math.PI / 5, 0, 0.2]}>
        <mesh>
          <torusGeometry args={[1.2 * 1.85, 1.2 * 0.14, 2, 128]} />
          <meshBasicMaterial color="#1a6b5a" transparent opacity={0.55} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.2 * 2.15, 1.2 * 0.08, 2, 128]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.35} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.2 * 2.42, 1.2 * 0.05, 2, 128]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.18} />
        </mesh>
      </group>
      <pointLight color="#00d4ff" intensity={2.5} distance={15} decay={2} />
    </group>
  )
}

function CameraAnimator({ onComplete }) {
  const { camera } = useThree()
  const done = useRef(false)

  useEffect(() => {
    camera.position.set(0, 8, 80)
    camera.lookAt(0, 0, 0)

    const tl = gsap.timeline()
    tl.to(camera.position, {
      z: 6,
      y: 2,
      duration: 3.5,
      ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(0, 0, 0),
    })
    tl.to(
      camera.position,
      {
        z: 4,
        y: 0,
        x: 1,
        duration: 1,
        ease: 'power2.in',
        onUpdate: () => camera.lookAt(0, 0, 0),
      },
      '-=0.5'
    )
    tl.call(() => {
      if (!done.current) {
        done.current = true
        onComplete()
      }
    })

    return () => tl.kill()
  }, [camera, onComplete])

  return null
}

export default function GalaxyIntro({ onComplete }) {
  const fadeRef = useRef()

  const handleComplete = () => {
    if (fadeRef.current) {
      gsap.to(fadeRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.in',
        onComplete,
      })
    } else {
      onComplete()
    }
  }

  return (
    <div className="galaxy-intro">
      <Canvas
        className="galaxy-canvas"
        camera={{ position: [0, 8, 80], fov: 60 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <GalaxyParticles />
        <CenterPlanet />
        <CameraAnimator onComplete={handleComplete} />
      </Canvas>
      <div ref={fadeRef} className="galaxy-fade" />
    </div>
  )
}
