import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer-left">
        Designed &amp; built by <strong>Pragneysh Dekate</strong> · Ahmedabad, India
      </div>
      <div className="footer-center">
        <a href="#hero" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          ↑ Back to top
        </a>
      </div>
      <div className="footer-right">
        Full-Stack · Cloud · DevOps · {year}
      </div>
    </footer>
  )
}
