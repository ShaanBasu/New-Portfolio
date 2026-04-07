import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const LEFT_PATH = 'M 40 600 C 30 500, 60 450, 40 380 C 20 310, 60 280, 45 220 C 30 160, 60 120, 50 60'
const RIGHT_PATH = 'M 40 600 C 50 500, 20 450, 40 380 C 60 310, 20 280, 35 220 C 50 160, 20 120, 30 60'

const LEAF_POSITIONS = [
  { x: 40, y: 500, rotate: -30, side: -1 },
  { x: 40, y: 420, rotate: 40, side: 1 },
  { x: 40, y: 340, rotate: -20, side: -1 },
  { x: 40, y: 260, rotate: 35, side: 1 },
  { x: 40, y: 180, rotate: -25, side: -1 },
  { x: 40, y: 100, rotate: 30, side: 1 },
]

function Leaf({ x, y, rotate, side }) {
  const transform = `translate(${x + side * 18}, ${y}) rotate(${rotate})`
  return (
    <ellipse
      cx={0}
      cy={0}
      rx={8}
      ry={16}
      fill="#2d5a27"
      opacity={0.7}
      transform={transform}
      style={{ filter: 'drop-shadow(0 0 4px rgba(45, 90, 39, 0.6))' }}
    />
  )
}

function VineSVG({ pathData, side, sectionRef }) {
  const pathRef = useRef()
  const svgRef = useRef()

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const length = path.getTotalLength()

    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 })
    gsap.set(svgRef.current, { opacity: 0 })

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(svgRef.current, { opacity: 1, duration: 0.3 })
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 2.5,
          ease: 'power2.out',
        })
      },
    })

    return () => trigger.kill()
  }, [sectionRef])

  const style =
    side === 'left'
      ? { position: 'absolute', left: 0, bottom: 0 }
      : { position: 'absolute', right: 0, bottom: 0, transform: 'scaleX(-1)' }

  return (
    <svg ref={svgRef} width={80} height={620} viewBox="0 0 80 620" style={style}>
      <path
        ref={pathRef}
        d={pathData}
        stroke="#2d5a27"
        strokeWidth={2.5}
        fill="none"
        style={{ filter: 'drop-shadow(0 0 6px rgba(45, 90, 39, 0.8))' }}
      />
      {LEAF_POSITIONS.map((lp, i) => (
        <Leaf key={i} {...lp} />
      ))}
    </svg>
  )
}

export default function VineGrowth({ sectionRef }) {
  return (
    <div className="vine-container">
      <VineSVG pathData={LEFT_PATH} side="left" sectionRef={sectionRef} />
      <VineSVG pathData={RIGHT_PATH} side="right" sectionRef={sectionRef} />
    </div>
  )
}
