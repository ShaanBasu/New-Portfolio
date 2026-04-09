import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─── Aurora Connector (Home → About) ──────────────────────────────────────────
// Undulating sine-wave aurora streams in cyan/purple tones
function AuroraConnector() {
  const svgRef = useRef()
  const pathRefs = useRef([])

  const waves = useMemo(() => {
    const params = [
      { amp: 22, freq: 0.0055, phase: 0.0,  yOff: 28,  color: '#00d4ff', strokeW: 2.5, opacity: 0.85 },
      { amp: 18, freq: 0.0072, phase: 1.1,  yOff: 55,  color: '#4ab8ff', strokeW: 1.8, opacity: 0.65 },
      { amp: 26, freq: 0.0045, phase: 2.3,  yOff: 85,  color: '#8b5cf6', strokeW: 2.0, opacity: 0.75 },
      { amp: 15, freq: 0.0088, phase: 3.4,  yOff: 115, color: '#bf7cff', strokeW: 1.5, opacity: 0.55 },
      { amp: 20, freq: 0.006,  phase: 4.2,  yOff: 148, color: '#00ffcc', strokeW: 1.3, opacity: 0.50 },
    ]
    return params.map(({ amp, freq, phase, yOff, color, strokeW, opacity }) => {
      const pts = []
      for (let x = 0; x <= 1600; x += 8) {
        const y = yOff + amp * Math.sin(x * freq + phase) + (amp * 0.3) * Math.sin(x * freq * 2.6 + phase * 0.7)
        pts.push(`${x},${y.toFixed(1)}`)
      }
      return { d: `M ${pts.join(' L ')}`, color, strokeW, opacity }
    })
  }, [])

  useEffect(() => {
    const paths = pathRefs.current.filter(Boolean)
    paths.forEach((p) => {
      const len = p.getTotalLength()
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
    })
    gsap.set(svgRef.current, { opacity: 0 })

    const trigger = ScrollTrigger.create({
      trigger: svgRef.current,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(svgRef.current, { opacity: 1, duration: 0.4 })
        paths.forEach((p, i) =>
          gsap.to(p, {
            strokeDashoffset: 0,
            duration: 2.2 + i * 0.25,
            ease: 'power2.out',
            delay: i * 0.18,
          })
        )
      },
    })
    return () => trigger.kill()
  }, [])

  return (
    <div className="section-connector" ref={svgRef}>
      <svg width="100%" height="180" viewBox="0 0 1600 180" preserveAspectRatio="none">
        <defs>
          <filter id="aurora-blur">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {waves.map((w, i) => (
          <path
            key={i}
            ref={(el) => (pathRefs.current[i] = el)}
            d={w.d}
            stroke={w.color}
            strokeWidth={w.strokeW}
            fill="none"
            opacity={w.opacity}
            style={{ filter: `drop-shadow(0 0 5px ${w.color})` }}
          />
        ))}
      </svg>
    </div>
  )
}

// ─── Constellation Connector (About → Skills) ─────────────────────────────────
// Star nodes connected by thin gold lines forming constellation patterns
const STAR_PTS = [
  [70, 45], [200, 110], [360, 32], [500, 130], [640, 55],
  [780, 120], [920, 38], [1060, 125], [1200, 50], [1360, 115], [1520, 42],
  [130, 150], [310, 80], [470, 160], [650, 85], [820, 155],
  [990, 70], [1160, 150], [1400, 75],
]
const STAR_EDGES = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],
  [11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],
  [1,11],[3,12],[5,13],[7,15],[9,17],
]

function ConstellationConnector() {
  const svgRef = useRef()
  const lineRefs = useRef([])
  const dotRefs = useRef([])

  useEffect(() => {
    gsap.set(svgRef.current, { opacity: 0 })
    gsap.set(dotRefs.current.filter(Boolean), { opacity: 0, scale: 0, transformOrigin: 'center' })
    gsap.set(lineRefs.current.filter(Boolean), { opacity: 0 })

    const trigger = ScrollTrigger.create({
      trigger: svgRef.current,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(svgRef.current, { opacity: 1, duration: 0.3 })
        gsap.to(dotRefs.current.filter(Boolean), {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: 'back.out(2)',
        })
        gsap.to(lineRefs.current.filter(Boolean), {
          opacity: 0.55,
          duration: 0.8,
          stagger: 0.04,
          ease: 'power2.out',
          delay: 0.8,
        })
      },
    })
    return () => trigger.kill()
  }, [])

  return (
    <div className="section-connector" ref={svgRef}>
      <svg width="100%" height="200" viewBox="0 0 1600 200" preserveAspectRatio="none">
        {STAR_EDGES.map(([a, b], i) => (
          <line
            key={i}
            ref={(el) => (lineRefs.current[i] = el)}
            x1={STAR_PTS[a][0]}
            y1={STAR_PTS[a][1]}
            x2={STAR_PTS[b][0]}
            y2={STAR_PTS[b][1]}
            stroke="#ffd700"
            strokeWidth="0.9"
            opacity="0"
            style={{ filter: 'drop-shadow(0 0 2px #ffd700)' }}
          />
        ))}
        {STAR_PTS.map(([x, y], i) => (
          <circle
            key={i}
            ref={(el) => (dotRefs.current[i] = el)}
            cx={x}
            cy={y}
            r={i < 11 ? 4 : 3}
            fill={i < 11 ? '#ffd700' : '#fffacd'}
            opacity="0"
            style={{ filter: 'drop-shadow(0 0 5px #ffd700)' }}
          />
        ))}
      </svg>
    </div>
  )
}

// ─── Energy Burst Connector (Skills → Projects) ────────────────────────────────
// Radial energy lines bursting from centre, with concentric arcs
function EnergyConnector() {
  const svgRef = useRef()
  const lineRefs = useRef([])
  const arcRefs = useRef([])

  const cx = 800
  const cy = 95

  const lines = useMemo(() => {
    const count = 28
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const inner = 14
      const outer = 65 + ((i * 43) % 52)
      return {
        x1: cx + Math.cos(angle) * inner,
        y1: cy + Math.sin(angle) * inner,
        x2: cx + Math.cos(angle) * outer,
        y2: cy + Math.sin(angle) * outer,
        color: i % 3 === 0 ? '#ff9900' : i % 3 === 1 ? '#ffcc00' : '#ff6600',
      }
    })
  }, [])

  const arcs = [
    { r: 90,  opacity: 0.4, color: '#ff9900', sw: 1.5 },
    { r: 140, opacity: 0.25, color: '#ffcc00', sw: 1.0 },
    { r: 185, opacity: 0.15, color: '#ff6600', sw: 0.8 },
  ]

  useEffect(() => {
    gsap.set(svgRef.current, { opacity: 0 })
    const linesEls = lineRefs.current.filter(Boolean)
    const arcsEls = arcRefs.current.filter(Boolean)
    gsap.set(linesEls, { scaleX: 0, scaleY: 0, transformOrigin: `${cx}px ${cy}px` })
    gsap.set(arcsEls, { opacity: 0, scale: 0, transformOrigin: `${cx}px ${cy}px` })

    const trigger = ScrollTrigger.create({
      trigger: svgRef.current,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(svgRef.current, { opacity: 1, duration: 0.3 })
        gsap.to(linesEls, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.9,
          stagger: 0.025,
          ease: 'power3.out',
        })
        gsap.to(arcsEls, {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: 'power2.out',
          delay: 0.5,
        })
      },
    })
    return () => trigger.kill()
  }, [])

  return (
    <div className="section-connector" ref={svgRef}>
      <svg width="100%" height="190" viewBox="0 0 1600 190" preserveAspectRatio="xMidYMid meet">
        {lines.map((l, i) => (
          <line
            key={i}
            ref={(el) => (lineRefs.current[i] = el)}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color}
            strokeWidth="1.5"
            opacity="0.75"
            style={{ filter: `drop-shadow(0 0 4px ${l.color})` }}
          />
        ))}
        {arcs.map((a, i) => (
          <circle
            key={i}
            ref={(el) => (arcRefs.current[i] = el)}
            cx={cx} cy={cy} r={a.r}
            fill="none"
            stroke={a.color}
            strokeWidth={a.sw}
            opacity={a.opacity}
            strokeDasharray="6 8"
            style={{ filter: `drop-shadow(0 0 3px ${a.color})` }}
          />
        ))}
        <circle cx={cx} cy={cy} r={12} fill="#ff9900" opacity="0.9"
          style={{ filter: 'drop-shadow(0 0 10px #ff9900)' }} />
      </svg>
    </div>
  )
}

// ─── Crystal Connector (Projects → Education) ─────────────────────────────────
// Angular ice-crystal branches growing upward in icy blues
function CrystalConnector() {
  const svgRef = useRef()
  const lineRefs = useRef([])

  // Pre-computed crystal branch segments (x1,y1 → x2,y2)
  const branches = useMemo(() => {
    const segs = []
    function branch(x, y, dx, dy, depth) {
      if (depth === 0) return
      const x2 = x + dx
      const y2 = y + dy
      segs.push({ x1: x, y1: y, x2, y2, depth })
      const len = Math.sqrt(dx * dx + dy * dy) * 0.62
      const angle = Math.atan2(dy, dx)
      const spread = Math.PI / 5
      branch(x2, y2, Math.cos(angle - spread) * len, Math.sin(angle - spread) * len, depth - 1)
      branch(x2, y2, Math.cos(angle + spread) * len, Math.sin(angle + spread) * len, depth - 1)
    }
    // Three main crystal trunks
    branch(800, 190, 0, -80, 4)
    branch(600, 190, -18, -70, 3)
    branch(1000, 190, 18, -70, 3)
    branch(400, 190, -10, -55, 2)
    branch(1200, 190, 10, -55, 2)
    return segs
  }, [])

  const depthColors = ['#00d4ff', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe']
  const depthWidths = [2.2, 1.6, 1.1, 0.8, 0.5]

  useEffect(() => {
    gsap.set(svgRef.current, { opacity: 0 })
    const els = lineRefs.current.filter(Boolean)
    gsap.set(els, { opacity: 0 })

    const trigger = ScrollTrigger.create({
      trigger: svgRef.current,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(svgRef.current, { opacity: 1, duration: 0.3 })
        // Animate trunk first (high depth) then branches (low depth)
        ;[4, 3, 2, 1].forEach((d, di) => {
          const group = els.filter((_, i) => branches[i]?.depth === d)
          gsap.to(group, {
            opacity: 1,
            duration: 0.6,
            stagger: 0.04,
            ease: 'power2.out',
            delay: di * 0.3,
          })
        })
      },
    })
    return () => trigger.kill()
  }, [branches])

  return (
    <div className="section-connector" ref={svgRef}>
      <svg width="100%" height="200" viewBox="0 0 1600 200" preserveAspectRatio="xMidYMax meet">
        {branches.map((seg, i) => {
          const di = 4 - seg.depth  // 0=trunk(depth4) → 3=tips(depth1)
          const col = depthColors[di] ?? depthColors[depthColors.length - 1]
          const sw = depthWidths[di] ?? depthWidths[depthWidths.length - 1]
          return (
            <line
              key={i}
              ref={(el) => (lineRefs.current[i] = el)}
              x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
              stroke={col}
              strokeWidth={sw}
              opacity="0"
              style={{ filter: `drop-shadow(0 0 3px ${col})` }}
            />
          )
        })}
      </svg>
    </div>
  )
}

// ─── Public API ────────────────────────────────────────────────────────────────
export default function SectionConnector({ type }) {
  if (type === 'aurora')        return <AuroraConnector />
  if (type === 'constellation') return <ConstellationConnector />
  if (type === 'energy')        return <EnergyConnector />
  if (type === 'crystal')       return <CrystalConnector />
  return null
}
