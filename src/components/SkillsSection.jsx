import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Planet from './Planet.jsx'

gsap.registerPlugin(ScrollTrigger)

const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'Three.js', 'Machine Learning', 'SQL', 'Git', 'Docker',
]

function OrbitingSpheres() {
  const sphereRefs = useRef([])
  const radii = [3.5, 4.2, 3.8, 4.5, 3.2, 4.0]
  const speeds = [0.4, 0.3, 0.5, 0.35, 0.45, 0.38]
  const colors = ['#00d4ff', '#8b5cf6', '#ffd700', '#ff6b6b', '#50fa7b', '#ffb86c']
  const startAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    sphereRefs.current.forEach((ref, i) => {
      if (ref) {
        const angle = startAngles[i] + t * speeds[i]
        ref.position.x = Math.cos(angle) * radii[i]
        ref.position.z = Math.sin(angle) * radii[i]
        ref.position.y = Math.sin(t * 0.5 + i) * 0.3
      }
    })
  })

  return (
    <group>
      {colors.map((color, i) => (
        <mesh key={i} ref={(el) => (sphereRefs.current[i] = el)}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function SkillScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffd700" distance={15} decay={2} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Planet
        color="#b45309"
        planetType="volcanic"
        size={1.8}
        emissiveColor="#78350f"
        atmosphereColor="#ffd700"
        rotationSpeed={0.006}
      />
      <OrbitingSpheres />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
    </>
  )
}

export default function SkillsSection() {
  const pillsRef = useRef([])
  const sectionRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pillsRef.current,
        { opacity: 0, y: 20, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="skills" className="skills-section" ref={sectionRef}>
      <h2 className="section-heading gradient-text" style={{ marginBottom: 8 }}>
        Skills &amp; Technologies
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Technologies orbiting my development universe
      </p>

      <div className="skills-canvas-container">
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 2, 8], fov: 50 }}
          gl={{ antialias: true }}
        >
          <SkillScene />
        </Canvas>
      </div>

      <div className="skills-grid">
        {SKILLS.map((skill, i) => (
          <div
            key={skill}
            className="skill-pill"
            ref={(el) => (pillsRef.current[i] = el)}
          >
            {skill}
          </div>
        ))}
      </div>
    </section>
  )
}
