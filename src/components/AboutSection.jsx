import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Planet from './Planet.jsx'

gsap.registerPlugin(ScrollTrigger)

function PlanetScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, 5, 0]} intensity={1.2} color="#8b5cf6" />
      <Planet
        color="#6d28d9"
        planetType="gas"
        size={2.2}
        emissiveColor="#3b0764"
        atmosphereColor="#8b5cf6"
        rotationSpeed={0.004}
      />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  )
}

export default function AboutSection() {
  const cardRef = useRef()
  const sectionRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="about" className="about-section" ref={sectionRef}>
      <div className="about-container">
        <div className="about-canvas-container">
          <Canvas
            style={{ width: '100%', height: '100%' }}
            camera={{ position: [0, 0, 6], fov: 50 }}
            gl={{ antialias: true }}
          >
            <PlanetScene />
          </Canvas>
        </div>

        <div ref={cardRef} className="about-card glass-card">
          <div className="about-avatar">SB</div>
          <h2 className="section-heading gradient-text">About Me</h2>
          <p className="about-bio">
            Computer Science student passionate about full-stack development, AI/ML, and building
            impactful applications that make a difference. I love exploring the intersection of
            technology and creativity.
          </p>
          <div className="about-details">
            <div className="about-detail">
              <span className="detail-icon">📍</span>
              <span>India</span>
            </div>
            <div className="about-detail">
              <span className="detail-icon">🎓</span>
              <span>Bachelor of Computer Science (2021–2025)</span>
            </div>
            <div className="about-detail">
              <span className="detail-icon">💼</span>
              <span>Open to Opportunities</span>
            </div>
            <div className="about-detail">
              <span className="detail-icon">🚀</span>
              <span>Interests: AI/ML, Full-Stack, 3D Web</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
