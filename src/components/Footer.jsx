import { Link, useLocation, useNavigate } from "react-router-dom";
import { profile } from "../data";
import { Mail, ExternalLink } from "lucide-react";
import "./Footer.css";

function GitHubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedInIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function ResumeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToTop = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate('/');
    }
  };

  const handleNav = (e, path) => {
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      if (location.pathname === '/') {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `#${id}`);
        }
      }
    }
  };

  const navPrimary = [
    { href: "/#about", label: "About Me" },
    { href: "/#skills", label: "Technical Skills" },
    { href: "/#featured-projects", label: "Featured Projects" },
    { href: "/#projects", label: "All Projects & Case Studies" },
    { href: "/#architecture", label: "Cloud Architecture" },
    { href: "/live-projects", label: "Live Client Sites", isRoute: true },
    { href: "/#experience", label: "Work Experience" },
  ];

  const navCredentials = [
    { href: "/#achievements", label: "Engineering Highlights" },
    { href: "/#education", label: "Education" },
    { href: "/#certifications", label: "Certifications" },
    { href: "/#contributions", label: "Open Source" },
    { href: "/#github", label: "GitHub Repositories" },
    { href: "/#contact", label: "Contact & Connect" },
  ];

  return (
    <footer className="site-footer">
      <div className="container footer-container">
        {/* Top Section */}
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-brand" onClick={scrollToTop}>
              <span className="footer-brand-mark">PD</span>
              <span className="footer-brand-text">
                <span className="footer-brand-name">{profile.fullName}</span>
                <span className="footer-brand-tag">Full-Stack Developer | Python, Cloud &amp; DevOps</span>
              </span>
            </Link>
            <p className="footer-bio">
              Full-Stack Developer focused on building scalable web applications, robust Python &amp; Django backends, and cloud-native systems on AWS.
            </p>
            <div className="footer-status-pill">
              <span className="status-indicator-dot"></span>
              <span>Available · Immediate / 15-day notice</span>
            </div>
          </div>

          {/* Nav Column 1: Core Engineering */}
          <div className="footer-col">
            <h4 className="footer-col-title">Portfolio</h4>
            <ul className="footer-links-list">
              {navPrimary.map((item) => (
                <li key={item.href}>
                  {item.isRoute ? (
                    <Link to={item.href} className="footer-link">
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="footer-link"
                      onClick={(e) => handleNav(e, item.href)}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Nav Column 2: Credentials */}
          <div className="footer-col">
            <h4 className="footer-col-title">Credentials</h4>
            <ul className="footer-links-list">
              {navCredentials.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="footer-link"
                    onClick={(e) => handleNav(e, item.href)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Channels */}
          <div className="footer-col footer-col-connect">
            <h4 className="footer-col-title">Connect</h4>
            <ul className="footer-connect-list">
              <li>
                <a href={`mailto:${profile.email}`} className="footer-connect-link">
                  <Mail size={15} />
                  <span>{profile.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-connect-link"
                >
                  <LinkedInIcon size={15} />
                  <span>LinkedIn Profile</span>
                  <ExternalLink size={12} className="link-ext" />
                </a>
              </li>
              <li>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-connect-link"
                >
                  <GitHubIcon size={15} />
                  <span>GitHub (@{profile.githubUsername})</span>
                  <ExternalLink size={12} className="link-ext" />
                </a>
              </li>
              <li>
                <a
                  href={profile.resumeUrl}
                  download="Pragneysh_Dekate_Resume.pdf"
                  className="footer-connect-link highlight-link"
                >
                  <ResumeIcon size={15} />
                  <span>Download Verified CV</span>
                </a>
              </li>
            </ul>
            <div className="footer-location-note">
              <span>📍 {profile.locationShort}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© {currentYear} {profile.fullName}. All rights reserved.</span>
            <span className="footer-bullet">·</span>
            <span className="footer-engine-tag">Engineered with React 18 &amp; Vite</span>
          </div>

          <div className="footer-bottom-right">
            <button
              onClick={scrollToTop}
              className="back-to-top-btn"
              aria-label="Back to top"
            >
              <span>Back to Top</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
