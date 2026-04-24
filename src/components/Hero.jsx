import { profile } from '../data'
import './Hero.css'

const terminalLines = [
  { prompt: '$', cmd: 'cat', arg: 'profile.json' },
  { key: '"name"',     val: `"${profile.name} (${profile.alias})"`,  type: 'str' },
  { key: '"role"',     val: '"Full-Stack & Cloud Engineer"',          type: 'str' },
  { key: '"location"', val: `"${profile.location}"`,                 type: 'str' },
  { key: '"track"',    val: '"DevOps / Cloud Architecture"',          type: 'str' },
  { key: '"status"',   val: 'open_to_work',                          type: 'val' },
  { key: '"rule"',     val: `"${profile.philosophy}"`,               type: 'str' },
]

const tags = ['AWS', 'Docker', 'Kubernetes', 'Django', 'React', 'CI/CD', 'IaC', 'NestJS']

export default function Hero() {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-grid">
        <div className="hero-left fade-in">
          <div className="hero-eyebrow">
            <div className="pulse-dot" />
            <span>Available for opportunities</span>
          </div>
          <h1 className="hero-name">
            {profile.name}<br />
            <span className="hero-italic">{profile.alias}</span>
          </h1>
          <p className="hero-alias">// Full-Stack Developer · Cloud &amp; DevOps Engineer</p>
          <p className="hero-desc">{profile.tagline}</p>
          <div className="hero-cta">
            <a href="#projects" className="btn-primary"
              onClick={e => { e.preventDefault(); document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) }}>
              View Projects →
            </a>
            <a href="#contact" className="btn-ghost"
              onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Get in Touch
            </a>
          </div>
        </div>

        <div className="hero-card fade-in delay-3">
          <div className="card-header">
            <div className="card-dot red" />
            <div className="card-dot yellow" />
            <div className="card-dot green" />
            <span className="card-filename">profile.json</span>
          </div>
          <div className="card-body">
            {terminalLines.map((line, i) =>
              line.prompt ? (
                <div className="t-line" key={i}>
                  <span className="t-prompt">$</span>
                  <span className="t-cmd">{line.cmd}</span>
                  <span className="t-muted"> {line.arg}</span>
                </div>
              ) : (
                <div className="t-line" key={i}>
                  <span className="t-key">{line.key}</span>
                  <span className="t-colon">: </span>
                  <span className={line.type === 'str' ? 't-str' : 't-val'}>{line.val}</span>
                  {i < terminalLines.length - 1 && <span className="t-muted">,</span>}
                </div>
              )
            )}
            <div className="card-tags">
              {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
