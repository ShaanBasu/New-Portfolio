import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Planet from './Planet.jsx'

gsap.registerPlugin(ScrollTrigger)

const EDUCATION = [
  {
    school: 'University',
    degree: 'Bachelor of Computer Science',
    years: '2021 – 2025',
  },
  {
    school: 'High School',
    degree: 'Science Stream',
    years: '2019 – 2021',
  },
]

function PlanetScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 0, 5]} intensity={1} color="#00d4ff" />
      <Planet
        color="#164e63"
        size={2.2}
        emissiveColor="#0c4a6e"
        atmosphereColor="#38bdf8"
        rotationSpeed={0.004}
        rings
      />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  )
}

export default function EducationSection() {
  const itemsRef = useRef([])
  const sectionRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      itemsRef.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: i * 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="education" className="education-section" ref={sectionRef}>
      <div className="education-container">
        <div className="education-timeline">
          <div className="timeline-line" />
          {EDUCATION.map((edu, i) => (
            <div
              key={edu.school}
              className="timeline-item"
              ref={(el) => (itemsRef.current[i] = el)}
            >
              <div className="timeline-dot" />
              <div className="timeline-card glass-card">
                <div className="timeline-years">{edu.years}</div>
                <div className="timeline-school">{edu.school}</div>
                <div className="timeline-degree">{edu.degree}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="education-canvas-container">
          <Canvas
            style={{ width: '100%', height: '100%' }}
            camera={{ position: [0, 0, 6], fov: 50 }}
            gl={{ antialias: true }}
          >
            <PlanetScene />
          </Canvas>
        </div>
      </div>
    </section>
  )
}
