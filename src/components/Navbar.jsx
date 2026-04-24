import { useState, useEffect } from 'react'
import './Navbar.css'

const navItems = ['About', 'Skills', 'Projects', 'Experience', 'Contact']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
      const sections = navItems.map(n => document.getElementById(n.toLowerCase()))
      let current = ''
      sections.forEach(s => {
        if (s && window.scrollY >= s.offsetTop - 130) current = s.id
      })
      setActive(current)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNav = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <a className="nav-logo" href="#hero" onClick={e => handleNav(e, 'hero')}>
        Pragneysh<span>.</span>
      </a>
      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {navItems.map(item => (
          <li key={item}>
            <a
              href={`#${item.toLowerCase()}`}
              className={active === item.toLowerCase() ? 'active' : ''}
              onClick={e => handleNav(e, item.toLowerCase())}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
      <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)}>
        <span/><span/><span/>
      </button>
    </nav>
  )
}
