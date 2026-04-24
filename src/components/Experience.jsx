import { useEffect, useRef } from 'react'
import { experience } from '../data'
import './Experience.css'

export default function Experience() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1 }
    )
    ref.current?.querySelectorAll('.timeline-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="experience" className="section experience-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">Experience</div>
        <h2 className="section-title">Where I've <em>worked</em></h2>
        <div className="timeline">
          {experience.map((item, i) => (
            <div className="timeline-item" key={i} style={{ transitionDelay: `${i * 0.12}s` }}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-date">{item.date}</div>
                <div className="timeline-role">{item.role}</div>
                <div className="timeline-company">{item.company}</div>
                <ul className="timeline-points">
                  {item.points.map((pt, j) => (
                    <li key={j}><span className="pt-arrow">›</span>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
