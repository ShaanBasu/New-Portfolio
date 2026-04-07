import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

function GalaxyParticles() {
  const pointsRef = useRef()
  const count = 8000

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const arm = i % 2
      const armOffset = arm * Math.PI
      const t = Math.random()
      const radius = Math.pow(t, 0.5) * 25
      const spiralAngle = radius * 0.4 + armOffset
      const scatter = (1 - t) * 0.8 + 0.1

      positions[i3] = Math.cos(spiralAngle) * radius + (Math.random() - 0.5) * scatter * 3
      positions[i3 + 1] = (Math.random() - 0.5) * (scatter * 1.5 + 0.3)
      positions[i3 + 2] = Math.sin(spiralAngle) * radius + (Math.random() - 0.5) * scatter * 3

      const coreT = 1 - t
      colors[i3] = THREE.MathUtils.lerp(1.0, 0.3, coreT * 0.5)
      colors[i3 + 1] = THREE.MathUtils.lerp(0.7, 0.5, coreT * 0.3)
      colors[i3 + 2] = THREE.MathUtils.lerp(0.2, 1.0, coreT)
    }

    return { positions, colors }
  }, [])

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

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.003
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial
          color="#1a3a6e"
          emissive="#0044aa"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#00d4ff" intensity={3} distance={15} decay={2} />
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
