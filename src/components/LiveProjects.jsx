import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { liveProjects, projects } from "../data";
import {
  Globe,
  Radio,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import "./LiveProjects.css";

function GitHubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function LiveProjects() {
  const ref = useRef(null);

  // Show selected verified deployments on homepage preview (top 3)
  const previewProjects = liveProjects.filter((p) => p.featuredOnHome).slice(0, 3);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08 }
    );
    ref.current?.querySelectorAll(".reveal-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="live-projects" className="section live-projects-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">CLIENT WEBSITES &amp; WORK SHOWCASE</div>
        <h2 className="section-title">
          Client Websites &amp; <span className="text-gradient">Live Deployments</span>
        </h2>
        <p className="section-description">
          Real production websites designed and developed for businesses, professionals, and clients. Every website is live, fully responsive, and verified online.
        </p>

        {/* Deployments Preview Grid — Selected Client Websites */}
        <div className="live-projects-grid">
          {previewProjects.map((proj, i) => (
            <article
              key={proj.id}
              className="live-card reveal-card"
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              {/* Screenshot Media Wrapper */}
              <div className="live-media-wrapper">
                <img
                  src={proj.image}
                  alt={`${proj.title} production screenshot`}
                  className="live-image"
                  loading="lazy"
                />

                {/* Status Float Badge */}
                <div className="live-status-badge-float">
                  <span className="status-dot dot-live" />
                  <span className="status-text">{proj.httpStatus || "Live Website"}</span>
                </div>

                {/* Screenshot Verification Tag */}
                <div className="screenshot-type-pill">
                  <ShieldCheck size={11} />
                  <span>{proj.screenshotLabel || "Real Website"}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="live-card-body">
                <div className="live-meta-row">
                  <span className="live-cat">{proj.category}</span>
                </div>

                <h3 className="live-title">{proj.title}</h3>

                {/* Prominently Displayed Clickable Domain */}
                <div className="live-domain-badge-wrap">
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="live-domain-badge"
                    title={`Visit ${proj.domain}`}
                  >
                    <Globe size={13} className="domain-icon" />
                    <span className="domain-text">{proj.domain}</span>
                    <ArrowUpRight size={13} className="domain-arrow" />
                  </a>
                </div>

                <p className="live-desc">{proj.description}</p>

                {/* Tech Tags */}
                <div className="live-tags">
                  {proj.tags?.map((tag, j) => (
                    <span key={j} className="live-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Operational Highlight */}
                {proj.metrics && (
                  <div className="live-metric-strip">
                    <CheckCircle2 size={12} className="metric-strip-icon" />
                    <span>{proj.metrics}</span>
                  </div>
                )}

                {/* Actions Row */}
                <div className="live-card-actions">
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary live-btn"
                    >
                      <Radio size={13} />
                      <span>Visit Website ↗</span>
                    </a>
                  )}

                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost live-btn"
                      title="View public GitHub repository"
                    >
                      <GitHubIcon size={13} />
                      <span>Source Code</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View All Deployments CTA */}
        <div className="live-section-cta">
          <Link to="/live-projects" className="btn-primary cta-all-btn">
            <span>Explore All Live Websites ({liveProjects.length})</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
