import { Link } from 'react-router-dom';
import { engineeringProjects } from '../data';
import { ArrowRight } from 'lucide-react';
import './FeaturedProjects.css';

// Curated 3 flagship projects highlighting cloud engineering, full-stack web, and enterprise SaaS
const FEATURED_SHOWCASE_CONFIG = [
  {
    id: 'leavesmanagement',
    cleanTitle: 'Leave Management System',
    categoryLabel: 'Cloud Platform',
    summary: 'A cloud workplace system for employee leave requests, team balances, and multi-level manager approvals.',
  },
  {
    id: 'tour-travel-booking',
    cleanTitle: 'Tour & Travel Booking Platform',
    categoryLabel: 'Web Application',
    summary: 'A full-stack travel booking application for exploring destinations, trip packages, and reserving hotel stays.',
  },
  {
    id: 'workly',
    cleanTitle: 'Workly – Compliance & CRM Platform',
    categoryLabel: 'Enterprise SaaS Prototype',
    summary: 'A compliance and relationship management dashboard for logistics teams to track carrier records, certificates, and workflows.',
  },
];

export default function FeaturedProjects() {
  const showcaseProjects = FEATURED_SHOWCASE_CONFIG.map((cfg) => {
    const proj = engineeringProjects.find((p) => p.id === cfg.id || p.slug === cfg.id);
    return {
      ...proj,
      ...cfg,
    };
  }).filter((p) => Boolean(p.id));

  const handleScrollToProjects = (e) => {
    e.preventDefault();
    const target = document.getElementById('projects');
    if (target) {
      const navHeight = 75;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.pushState(null, '', '#projects');
    }
  };

  return (
    <section id="featured-projects" className="section featured-projects-section" aria-label="Featured Projects Showcase">
      <div className="section-inner">
        {/* Section Header */}
        <div className="section-header text-center">
          <div className="section-label">CURATED SHOWCASE</div>
          <h2 className="section-title">
            Featured Systems &amp; <span className="text-gradient">Applications</span>
          </h2>
          <p className="section-description">
            Selected full-stack and cloud platforms highlighting scalable architecture, clean design, and real-world utility.
          </p>
        </div>

        {/* 3-Card Curated Showcase Grid */}
        <div className="featured-showcase-grid">
          {showcaseProjects.map((project) => (
            <article key={project.id} className="featured-showcase-card">
              {/* Media preview wrapper (16:9) */}
              <div className="featured-showcase-media">
                <img
                  src={project.image}
                  alt={`${project.cleanTitle} - ${project.categoryLabel} architecture preview by Pragneysh Dekate`}
                  className="featured-showcase-img"
                  width="600"
                  height="338"
                  loading="lazy"
                />
                <div className="featured-showcase-overlay" />
                <span className="featured-showcase-badge">{project.categoryLabel}</span>
              </div>

              {/* Showcase Card Body */}
              <div className="featured-showcase-body">
                <h3 className="featured-showcase-title">
                  <Link to={`/projects/${project.slug}`} className="showcase-title-link">
                    {project.cleanTitle}
                  </Link>
                </h3>

                <p className="featured-showcase-sentence">{project.summary}</p>

                <div className="featured-showcase-footer">
                  <Link to={`/projects/${project.slug}`} className="featured-explore-btn">
                    <span>Explore Project</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Section Bottom CTA -> Navigate to Complete Catalogue */}
        <div className="featured-showcase-cta-bar">
          <a
            href="#projects"
            onClick={handleScrollToProjects}
            className="featured-all-projects-link"
          >
            <span>Explore All Projects</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
