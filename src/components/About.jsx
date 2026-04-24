import { useEffect, useRef } from 'react'
import { profile, workflow } from '../data'
import './About.css'

export default function About() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1 }
    )
    ref.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="about" className="section about-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">About</div>
        <h2 className="section-title">Builder at <em>heart</em></h2>
        <div className="about-grid">
          <div className="about-text reveal">
            {profile.bio.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <blockquote className="about-quote">
              <p>"{profile.tagline}"</p>
              <cite>— Personal Engineering Philosophy</cite>
            </blockquote>
          </div>
          <div className="about-workflow reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="workflow-label">// Personal Workflow System</div>
            <div className="workflow-steps">
              {workflow.map((step, i) => (
                <div className="workflow-step" key={i}>
                  <div className="step-num">{step.num}</div>
                  <div className="step-content">
                    <div className="step-label">{step.label}</div>
                    <div className="step-sub">{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
