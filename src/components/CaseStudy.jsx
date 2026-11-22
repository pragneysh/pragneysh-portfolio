import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { projects } from "../data";
import { PROJECT_PLAIN_INFO } from "./Projects";
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  CheckCircle2,
  Lock,
  Globe,
  ShieldCheck,
  Server,
  Cpu,
  FileCode,
  Sparkles,
  Radio,
  Clock,
  Database,
  UserCheck,
  AlertTriangle,
  Shield,
  Rocket,
  Check,
} from "lucide-react";
import "./CaseStudy.css";

function GitHubIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function CaseStudy() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [slug]);

  const project = projects.find((p) => p.slug === slug || p.id === slug);

  if (!project) {
    return (
      <div className="case-study-not-found section">
        <div className="section-inner text-center">
          <div className="not-found-card">
            <h2>Case Study Not Found</h2>
            <p>The case study for &ldquo;{slug}&rdquo; could not be located.</p>
            <Link to="/#projects" className="btn-primary">
              <ArrowLeft size={16} /> Return to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Find next project for bottom footer navigation
  const currentIndex = projects.findIndex((p) => p.slug === project.slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];
  const plainInfo = PROJECT_PLAIN_INFO[project.slug] || PROJECT_PLAIN_INFO[project.id];

  return (
    <article className="case-study-page">
      {/* Top Header / Breadcrumb navigation */}
      <div className="case-study-header-bar">
        <div className="case-study-container">
          <Link to="/#projects" className="back-link">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <div className="header-meta-tags">
            <span className="case-study-badge">{project.category}</span>
            {project.visibility === "private" ? (
              <span className="badge-lock">
                <Lock size={12} /> Internal System
              </span>
            ) : (
              <span className="badge-public">
                <Globe size={12} /> Public Showcase
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <header className="case-study-hero">
        <div className="case-study-container">
          <div className="hero-status-pill">
            <span className="status-dot-pulse" />
            <span>{project.projectStatus || "Completed Engineering Project"}</span>
          </div>

          <h1 className="case-study-title">{project.title}</h1>
          <p className="case-study-lead">{project.description}</p>

          {/* Quick Action Links */}
          <div className="case-study-actions">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary action-btn"
              >
                <Globe size={15} /> Visit Live Deployment ↗
              </a>
            ) : (
              <span className="btn-disabled action-btn" title="Internal deployment or architecture">
                <Lock size={14} /> Private / Internal Infrastructure
              </span>
            )}

            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost action-btn"
              >
                <GitHubIcon size={15} /> View Source Code ↗
              </a>
            ) : (
              <span className="btn-ghost-muted action-btn" title="Proprietary commercial repository">
                <Lock size={13} /> Repository Private
              </span>
            )}

            <Link to="/live-projects" className="btn-ghost action-btn">
              <Radio size={14} /> View All Deployments
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="case-study-body" tabIndex="-1">
        <div className="case-study-container">
          {/* Featured Visual Banner (when available) */}
          {project.image && (
            <div className="case-study-banner">
              <img
                src={project.image}
                alt={project.title}
                className="case-study-featured-img"
                loading="eager"
              />
              <div className="banner-caption">
                <span>{project.screenshots?.[0]?.label || "Primary Architectural Overview"}</span>
                <span className="banner-badge">
                  {project.screenshots?.[0]?.type === "real" ? "Verified Production Screenshot" : "Architectural Topology"}
                </span>
              </div>
            </div>
          )}

          {/* Verified Metrics Strip */}
          {project.metrics && project.metrics.length > 0 && (
            <section className="case-study-metrics-strip">
              <div className="metrics-strip-title">
                <ShieldCheck size={16} />
                <span>Verified Technical Specifications &amp; Benchmarks</span>
              </div>
              <div className="metrics-grid">
                {project.metrics.map((metric, idx) => (
                  <div key={idx} className="metric-cell">
                    <span className="metric-val">{metric.value}</span>
                    <span className="metric-lbl">{metric.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Structured Narrative Content Cards */}
          <div className="case-study-grid-content">
            {/* Overview & Purpose */}
            <section className="content-card">
              <h2 className="card-heading">
                <span className="heading-num">01</span> Project Overview
              </h2>
              {plainInfo && (
                <div className="plain-overview-lead">
                  <p className="plain-lead-text">
                    <strong>In plain language:</strong> {plainInfo.simpleDesc}
                  </p>
                </div>
              )}
              <p className="narrative-text">{project.overview}</p>
            </section>

            {/* Problem Statement */}
            <section className="content-card card-warning-subtle">
              <h2 className="card-heading">
                <span className="heading-num">02</span> Problem Statement &amp; Engineering Scope
              </h2>
              <p className="narrative-text">{project.problem}</p>
            </section>

            {/* Solution & Approach */}
            <section className="content-card card-success-subtle">
              <h2 className="card-heading">
                <span className="heading-num">03</span> Architectural Solution
              </h2>
              <p className="narrative-text">{project.solution}</p>
            </section>

            {/* My Personal Role */}
            {project.myRole && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">04</span> My Role &amp; Implementation Ownership
                </h2>
                <p className="narrative-text">{project.myRole}</p>
              </section>
            )}

            {/* System Architecture Pipeline */}
            {project.architecture && project.architecture.length > 0 && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">05</span> System Architecture &amp; Data Flow
                </h2>
                <div className="plain-arch-intro">
                  <p className="narrative-text">
                    <strong>Simple Explanation:</strong> User requests interact with the frontend interface, which securely communicates through an API gateway layer with cloud microservices, storing data reliably in database storage.
                  </p>
                </div>
                <div className="arch-pipeline-wrapper">
                  {project.architecture.map((layer, idx) => (
                    <div key={idx} className="pipeline-step">
                      <div className={`pipeline-box box-${layer.color || "blue"}`}>
                        <div className="pipeline-bullet" />
                        <span className="pipeline-text">{layer.text}</span>
                      </div>
                      {idx < project.architecture.length - 1 && (
                        <div className="pipeline-arrow">↓</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Engineering Contributions */}
            {project.contributions && project.contributions.length > 0 && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">06</span> Key Engineering Deliverables
                </h2>
                <ul className="contributions-list">
                  {project.contributions.map((item, idx) => (
                    <li key={idx} className="contribution-item">
                      <CheckCircle2 size={18} className="contrib-icon" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Core Features */}
            {project.features && project.features.length > 0 && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">07</span> Core Capabilities &amp; Workflows
                </h2>
                <div className="features-grid">
                  {project.features.map((feat, idx) => (
                    <div key={idx} className="feature-pill">
                      <Sparkles size={14} className="feat-icon" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Engineering Challenges */}
            {project.engineeringChallenges && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">08</span> Technical Challenges &amp; Solutions
                </h2>
                <p className="narrative-text">{project.engineeringChallenges}</p>
              </section>
            )}

            {/* Security Practices */}
            {project.security && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">09</span> Security &amp; Access Controls
                </h2>
                <p className="narrative-text">{project.security}</p>
              </section>
            )}

            {/* Deployment & CI/CD */}
            {project.deployment && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">10</span> Deployment Architecture &amp; CI/CD
                </h2>
                <p className="narrative-text">{project.deployment}</p>
              </section>
            )}

            {/* Results & Outcomes */}
            {project.results && (
              <section className="content-card card-success-subtle">
                <h2 className="card-heading">
                  <span className="heading-num">11</span> Verifiable Outcomes &amp; Impact
                </h2>
                <p className="narrative-text">{project.results}</p>
              </section>
            )}

            {/* Tools & Technologies Used */}
            <section className="content-card">
              <h2 className="card-heading">
                <span className="heading-num">12</span> Technology Stack
              </h2>
              <div className="stack-pills-wrap">
                {project.stack.map((tech, idx) => (
                  <span key={idx} className="stack-pill">
                    {tech}
                  </span>
                ))}
              </div>
            </section>

            {/* Screenshots & Visual Gallery (if multiple) */}
            {project.screenshots && project.screenshots.length > 1 && (
              <section className="content-card">
                <h2 className="card-heading">
                  <span className="heading-num">13</span> Deployment Visuals
                </h2>
                <div className="gallery-grid">
                  {project.screenshots.map((s, idx) => (
                    <div key={idx} className="gallery-item">
                      <img src={s.url} alt={s.label} className="gallery-img" loading="lazy" />
                      <div className="gallery-footer">
                        <span className="gallery-label">{s.label}</span>
                        <span className={`gallery-type-badge type-${s.type}`}>
                          {s.type === "real" ? "Production Verified" : "Architecture Blueprint"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Bottom Next Project Footer */}
          <footer className="case-study-bottom-nav">
            <div className="bottom-nav-inner">
              <Link to="/#projects" className="btn-ghost">
                <ArrowLeft size={16} /> All Projects
              </Link>
              {nextProject && (
                <Link to={`/projects/${nextProject.slug}`} className="btn-primary">
                  Next Case Study: {nextProject.title} ↗
                </Link>
              )}
            </div>
          </footer>
        </div>
      </main>
    </article>
  );
}
