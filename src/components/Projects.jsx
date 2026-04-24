import { useEffect, useRef } from 'react'
import { projects } from '../data'
import './Projects.css'

function ArchDiagram({ arch }) {
  const colors = { blue: 'var(--accent)', green: 'var(--accent2)', orange: 'var(--orange)' }
  const bgs    = { blue: 'rgba(91,143,255,0.06)', green: 'rgba(61,255,192,0.06)', orange: 'rgba(249,115,22,0.06)' }
  return (
    <div className="arch-diagram">
      <div className="arch-label">// Architecture</div>
      {arch.map((layer, i) => (
        <div key={i}>
          <div className="arch-layer" style={{ background: bgs[layer.color] }}>
            <span style={{ color: colors[layer.color] }}>⬡</span>
            <span>{layer.text}</span>
          </div>
          {i < arch.length - 1 && <div className="arch-arrow">↓</div>}
        </div>
      ))}
    </div>
  )
}

export default function Projects() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.08 }
    )
    ref.current?.querySelectorAll('.proj-card').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const featured = projects[0]
  const rest = projects.slice(1)

  return (
    <section id="projects" className="section projects-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">Projects</div>
        <h2 className="section-title">Things I've <em>built</em></h2>

        {/* Featured */}
        <div className="proj-card proj-featured reveal-proj">
          <div className="proj-main">
            <div className="proj-num">{featured.num} · Featured</div>
            <div className="proj-title">{featured.title}</div>
            <div className="proj-desc">{featured.desc}</div>
            <div className="proj-stack">
              {featured.stack.map((tag, i) => (
                <span key={i} className={`stack-tag ${featured.stackColors[i] === 'green' ? 'green' : ''}`}>{tag}</span>
              ))}
            </div>
          </div>
          {featured.architecture && <ArchDiagram arch={featured.architecture} />}
        </div>

        {/* Grid */}
        <div className="projects-grid">
          {rest.map((proj, i) => (
            <div className="proj-card reveal-proj" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="proj-num">{proj.num}</div>
              <div className="proj-title">{proj.title}</div>
              <div className="proj-desc">{proj.desc}</div>
              <div className="proj-stack">
                {proj.stack.map((tag, j) => (
                  <span key={j} className={`stack-tag ${proj.stackColors[j] === 'green' ? 'green' : ''}`}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
