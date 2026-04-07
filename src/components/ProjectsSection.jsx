import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const PROJECTS = [
  {
    name: 'AI Chat App',
    desc: 'A real-time AI-powered chat application with ML backend.',
    link: '#',
    color: '#00d4ff',
    orbitRadius: 4,
    speed: 0.5,
    size: 0.45,
    startAngle: 0,
  },
  {
    name: 'E-Commerce Platform',
    desc: 'Full-stack e-commerce with React and Node.js.',
    link: '#',
    color: '#8b5cf6',
    orbitRadius: 6,
    speed: 0.35,
    size: 0.5,
    startAngle: Math.PI * 0.4,
  },
  {
    name: 'Data Visualizer',
    desc: 'Interactive data visualization dashboard.',
    link: '#',
    color: '#ffd700',
    orbitRadius: 8,
    speed: 0.25,
    size: 0.42,
    startAngle: Math.PI * 0.8,
  },
  {
    name: 'Portfolio Site',
    desc: 'This very 3D space portfolio website.',
    link: '#',
    color: '#ff6b6b',
    orbitRadius: 10,
    speed: 0.18,
    size: 0.48,
    startAngle: Math.PI * 1.2,
  },
  {
    name: 'ML Classifier',
    desc: 'Machine learning image classifier.',
    link: '#',
    color: '#50fa7b',
    orbitRadius: 12,
    speed: 0.12,
    size: 0.44,
    startAngle: Math.PI * 1.6,
  },
]

function Sun() {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      <pointLight intensity={3} color="#ff9900" distance={50} decay={1.5} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff9900" emissiveIntensity={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

function OrbitRing({ radius }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.01, 2, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.07} />
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
      meshRef.current.rotation.y += 0.01
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
        <sphereGeometry args={[project.size, 32, 32]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={selected ? 0.6 : 0.2}
          roughness={0.6}
          metalness={0.2}
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
              color: 'rgba(255,255,255,0.6)',
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

function SolarSystemScene({ onSelect, selectedProject }) {
  return (
    <>
      <ambientLight intensity={0.15} />
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
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        maxDistance={30}
        minDistance={5}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI * 0.6}
        minPolarAngle={Math.PI * 0.2}
      />
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
          camera={{ position: [0, 12, 22], fov: 55 }}
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
    </section>
  )
}
