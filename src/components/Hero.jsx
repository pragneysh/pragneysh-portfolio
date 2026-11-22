import { useState, useEffect } from 'react';
import { profile } from '../data';
import './Hero.css';
import {
  Download,
  ArrowRight,
  Mail,
  MapPin,
  Terminal,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Cloud,
} from 'lucide-react';

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0);

  const focusAreas = [
    "Scalable Web Applications",
    "Python & Django Backends",
    "AWS Cloud Infrastructure",
    "DevOps & CI/CD Pipelines",
  ];

  // Cycle focus areas every 3.2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRoleIndex(prev => (prev + 1) % focusAreas.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        {/* Left Column: Introduction & Positioning */}
        <div className="hero-content fade-in">
          {/* Status Badge */}
          <div className="hero-badge">
            <span className="hero-badge-pulse" />
            <span className="hero-badge-text">{profile.status}</span>
          </div>

          {/* Main Headline & Identity */}
          <h1 className="hero-title">
            <span className="hero-title-greeting">
              <span className="hero-name-first">Hi, I'm</span>{' '}
              <em className="hero-name-last">{profile.fullName}</em>
            </span>
            <span className="hero-headline">{profile.headline}</span>
          </h1>

          {/* Focus Area Rotator */}
          <div className="hero-role-wrapper">
            <span className="hero-role-prefix">// Engineering Focus:</span>
            <span className="hero-role-text" key={roleIndex}>
              {focusAreas[roleIndex]}
            </span>
          </div>

          {/* Professional Description */}
          <p className="hero-bio">
            I build scalable web applications, robust Python and Django backends, and cloud-native systems on AWS. Specialized in the full development lifecycle from database design and APIs to CI/CD automation and containerized deployments.
          </p>

          {/* Location & Availability tags */}
          <div className="hero-meta-tags">
            <span className="hero-meta-item">
              <MapPin size={13} />
              <span>{profile.locationShort}</span>
            </span>
            <span className="hero-meta-item">
              <CheckCircle2 size={13} className="text-emerald" />
              <span>{profile.availability}</span>
            </span>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="hero-actions">
            <a
              href="#featured-projects"
              className="btn-primary"
              onClick={e => handleScrollTo(e, 'featured-projects')}
            >
              <span>View Projects</span>
              <ArrowRight size={15} />
            </a>

            <a
              href="#contact"
              className="btn-ghost"
              onClick={e => handleScrollTo(e, 'contact')}
            >
              <Mail size={15} />
              <span>Get in Touch</span>
            </a>

            <a
              href={profile.resumeUrl}
              download="Pragneysh_Dekate_Resume.pdf"
              className="btn-ghost"
              aria-label="Download Pragneysh Dekate Resume"
            >
              <Download size={15} />
              <span>Resume / CV</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="hero-stats-row">
            {profile.stats.map((stat, i) => (
              <div className="hero-stat-box" key={i}>
                <span className="hero-stat-val">{stat.value}</span>
                <span className="hero-stat-lbl">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Profile & Technical Overview Card */}
        <div className="hero-visual fade-in">
          <div className="hero-profile-card">
            {/* Card Header */}
            <div className="card-header-bar">
              <div className="header-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="header-title">
                <Terminal size={12} />
                <span>pragneysh.dev · Full-Stack &amp; Cloud</span>
              </div>
              <div className="header-status">ACTIVE</div>
            </div>

            {/* Profile Avatar & Quick Bio */}
            <div className="card-profile-section">
              <div className="avatar-frame">
                <img
                  src={profile.avatar}
                  alt="Pragneysh Dekate - Full-Stack Developer & Cloud Engineer"
                  className="avatar-img"
                  width="72"
                  height="72"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.classList.add('avatar-fallback');
                  }}
                />
                <span className="avatar-badge" title="Full-Stack & Cloud Engineer">✓</span>
              </div>

              <div className="profile-identity">
                <div className="identity-name">{profile.fullName}</div>
                <p className="identity-title">{profile.role}</p>
                <div className="identity-pills">
                  <span className="tag-pill">Python &amp; Django</span>
                  <span className="tag-pill">React &amp; Vite</span>
                  <span className="tag-pill">AWS Cloud</span>
                  <span className="tag-pill">DevOps &amp; CI/CD</span>
                </div>
              </div>
            </div>

            {/* Service & Capability Overview */}
            <div className="terminal-code">
              <div className="code-row">
                <span className="code-prompt">$</span>
                <span className="code-cmd">overview --stack</span>
              </div>
              <div className="code-json">
                <div><span className="json-key">"core"</span>: [<span className="json-val">"Python"</span>, <span className="json-val">"Django"</span>, <span className="json-val">"React"</span>, <span className="json-val">"AWS"</span>],</div>
                <div><span className="json-key">"cloud"</span>: <span className="json-val">"EC2, Lambda, API Gateway, S3, CloudFront"</span>,</div>
                <div><span className="json-key">"devops"</span>: <span className="json-val">"Docker, Kubernetes, GitHub Actions, IaC"</span>,</div>
                <div><span className="json-key">"architecture"</span>: <span className="json-val">"Scalable, Secure, Production-Grade"</span></div>
              </div>
              <div className="code-status-line">
                <Sparkles size={13} className="text-blue" />
                <span>Available for full-time engineering roles</span>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="card-footer-bar">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
              >
                <span>GitHub</span>
                <ExternalLink size={12} />
              </a>
              <span className="footer-separator">•</span>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
              >
                <span>LinkedIn</span>
                <ExternalLink size={12} />
              </a>
              <span className="footer-separator">•</span>
              <span className="footer-open-flag">Open to Opportunities</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
