import { useState, useEffect } from 'react'

const links = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Skills', id: 'skills' },
  { label: 'Projects', id: 'projects' },
  { label: 'Education', id: 'education' },
]

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function Navigation() {
  const [activeId, setActiveId] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.4

      for (const link of links) {
        const el = document.getElementById(link.id)
        if (el) {
          const { top, bottom } = el.getBoundingClientRect()
          const absTop = top + window.scrollY
          const absBottom = bottom + window.scrollY
          if (scrollY >= absTop && scrollY < absBottom) {
            setActiveId(link.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => scrollTo('home')}>
        ✦ SB
      </div>
      <ul className="nav-links">
        {links.map((link) => (
          <li
            key={link.id}
            className={`nav-link${activeId === link.id ? ' active' : ''}`}
            onClick={() => scrollTo(link.id)}
          >
            {link.label}
          </li>
        ))}
      </ul>
    </nav>
  )
}
