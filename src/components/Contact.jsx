import { useState, useEffect, useRef } from 'react'
import { profile } from '../data'
import './Contact.css'

const contactLinks = [
  { icon: '✉️', label: 'Email',    value: profile.email,    href: `mailto:${profile.email}` },
  { icon: '🐙', label: 'GitHub',   value: 'github.com/pragneysh',   href: profile.github },
  { icon: '💼', label: 'LinkedIn', value: 'linkedin.com/in/pragneysh', href: profile.linkedin },
  { icon: '📍', label: 'Location', value: profile.location, href: null },
]

export default function Contact() {
  const ref = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

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

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return
    // In production, wire this to your API / EmailJS / AWS SES
    console.log('Form submitted:', form)
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <section id="contact" className="section contact-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">Contact</div>
        <h2 className="section-title">Let's <em>connect</em></h2>
        <div className="contact-grid">

          <div className="contact-info reveal">
            <p>
              I'm actively upskilling toward Cloud Engineering and DevOps Architecture roles.
              Open to full-time opportunities, freelance projects, and collaborations involving
              scalable systems, automation, or enterprise cloud solutions.
            </p>
            <div className="contact-links">
              {contactLinks.map((link, i) => (
                link.href ? (
                  <a key={i} href={link.href} className="contact-link" target="_blank" rel="noreferrer">
                    <span className="cl-icon">{link.icon}</span>
                    <div className="cl-text">
                      <div className="cl-label">{link.label}</div>
                      <div className="cl-value">{link.value}</div>
                    </div>
                    <span className="cl-arrow">→</span>
                  </a>
                ) : (
                  <div key={i} className="contact-link no-link">
                    <span className="cl-icon">{link.icon}</span>
                    <div className="cl-text">
                      <div className="cl-label">{link.label}</div>
                      <div className="cl-value">{link.value}</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="contact-form reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="form-title">// Send a message</div>
            {sent && <div className="form-success">✓ Message received — I'll get back to you soon!</div>}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Subject</label>
              <input className="form-input" name="subject" value={form.subject} onChange={handleChange} placeholder="Project · Opportunity · Collaboration" />
            </div>
            <div className="form-field">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" name="message" value={form.message} onChange={handleChange} placeholder="Tell me about your project or opportunity..." />
            </div>
            <button className="btn-primary form-submit" onClick={handleSubmit}>
              Send Message →
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}
