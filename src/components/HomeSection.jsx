import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Planet from './Planet.jsx'

function Scene() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 10, 5]} intensity={1.1} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.6} color="#8b5cf6" />

      <Planet
        color="#1a6b5a"
        planetType="ocean"
        size={2.8}
        emissiveColor="#0a3d2e"
        atmosphereColor="#00d4ff"
        rings
        rotationSpeed={0.003}
      />
    </>
  )
}

export default function HomeSection() {
  return (
    <section id="home" className="home-section">
      <div className="home-canvas">
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 0, 7], fov: 50 }}
          gl={{ antialias: true }}
        >
          <Scene />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            maxPolarAngle={Math.PI * 0.65}
            minPolarAngle={Math.PI * 0.35}
          />
        </Canvas>
      </div>

      <div className="home-overlay">
        <p className="home-subtitle">Welcome to my universe</p>
        <h1 className="home-name gradient-text">Shaan Basu</h1>
        <p className="home-role">CS Student &amp; Developer</p>
      </div>

      <div className="scroll-indicator">
        <span>Scroll</span>
        <div className="scroll-arrow" />
      </div>
    </section>
  )
}
