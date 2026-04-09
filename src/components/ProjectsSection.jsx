import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

const PROJECTS = [
  {
    name: 'AI Chat App',
    desc: 'A real-time AI-powered chat application with ML backend.',
    link: '#',
    color: '#00d4ff',
    orbitRadius: 3.5,
    speed: 0.5,
    size: 0.42,
    startAngle: 0,
  },
  {
    name: 'E-Commerce Platform',
    desc: 'Full-stack e-commerce with React and Node.js.',
    link: '#',
    color: '#8b5cf6',
    orbitRadius: 5.2,
    speed: 0.35,
    size: 0.46,
    startAngle: Math.PI * 0.4,
  },
  {
    name: 'Data Visualizer',
    desc: 'Interactive data visualization dashboard.',
    link: '#',
    color: '#ffd700',
    orbitRadius: 7.0,
    speed: 0.25,
    size: 0.40,
    startAngle: Math.PI * 0.8,
  },
  {
    name: 'Portfolio Site',
    desc: 'This very 3D space portfolio website.',
    link: '#',
    color: '#ff6b6b',
    orbitRadius: 8.8,
    speed: 0.18,
    size: 0.44,
    startAngle: Math.PI * 1.2,
  },
  {
    name: 'ML Classifier',
    desc: 'Machine learning image classifier.',
    link: '#',
    color: '#50fa7b',
    orbitRadius: 10.6,
    speed: 0.12,
    size: 0.42,
    startAngle: Math.PI * 1.6,
  },
]

function Sun() {
  const meshRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      const pulse = 0.92 + Math.sin(state.clock.elapsedTime * 2) * 0.08
      meshRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      const g = 0.95 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
      glowRef.current.scale.setScalar(g)
    }
  })

  return (
    <group>
      <pointLight intensity={4} color="#ff9900" distance={60} decay={1.2} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.1, 48, 48]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff9900" emissiveIntensity={1.2} roughness={0.4} metalness={0} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.18} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.9, 32, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

function OrbitRing({ radius }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 2, 160]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
    </mesh>
  )
}

function OrbitingPlanet({ project, onSelect, selected }) {
  const meshRef = useRef()
  const angleRef = useRef(project.startAngle)

  useFrame(() => {
    angleRef.current += project.speed * 0.008
    if (meshRef.current) {
      meshRef.current.position.x = Math.cos(angleRef.current) * project.orbitRadius
      meshRef.current.position.z = Math.sin(angleRef.current) * project.orbitRadius
      meshRef.current.rotation.y += 0.012
    }
  })

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(project)
        }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[project.size, 40, 40]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={selected ? 0.7 : 0.25}
          roughness={0.55}
          metalness={0.15}
        />
        {selected && (
          <Html distanceFactor={10} center>
            <div style={{
              color: project.color,
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textShadow: `0 0 8px ${project.color}`,
              pointerEvents: 'none',
              marginTop: '-28px',
            }}>
              {project.name}
            </div>
          </Html>
        )}
        {!selected && (
          <Html distanceFactor={14} center>
            <div style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '9px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              marginTop: '-22px',
            }}>
              {project.name}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  )
}

// Auto-rotating camera rig — no OrbitControls so scroll events are never captured
function CameraRig() {
  const { camera } = useThree()
  const angleRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((_, delta) => {
    angleRef.current += delta * 0.18
    const x = Math.sin(angleRef.current) * 17 + mouseRef.current.x * 1.5
    const y = 9 - mouseRef.current.y * 1.5
    const z = Math.cos(angleRef.current) * 17
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
  })

  return null
}

function SolarSystemScene({ onSelect, selectedProject }) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <Sun />
      {PROJECTS.map((p) => (
        <OrbitRing key={p.name + '-ring'} radius={p.orbitRadius} />
      ))}
      {PROJECTS.map((p) => (
        <OrbitingPlanet
          key={p.name}
          project={p}
          onSelect={onSelect}
          selected={selectedProject?.name === p.name}
        />
      ))}
      <CameraRig />
    </>
  )
}

export default function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState(null)

  return (
    <section id="projects" className="projects-section">
      <div className="projects-section-title">
        <h2 className="section-heading gradient-text">Projects</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, letterSpacing: 2 }}>
          Click a planet to explore
        </p>
      </div>

      <div className="projects-canvas">
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 9, 17], fov: 52 }}
          gl={{ antialias: true }}
        >
          <SolarSystemScene onSelect={setSelectedProject} selectedProject={selectedProject} />
        </Canvas>
      </div>

      {selectedProject && (
        <div className="project-info-panel glass-card">
          <h3>{selectedProject.name}</h3>
          <p>{selectedProject.desc}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
            <a href={selectedProject.link} className="project-link">View Project</a>
            <button
              onClick={() => setSelectedProject(null)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.5)',
                borderRadius: 8,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      <div className="projects-scroll-hint">
        <span>↓ Scroll to continue</span>
      </div>
    </section>
  )
}
