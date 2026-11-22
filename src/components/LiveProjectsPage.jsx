import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "./SEO";
import { liveProjects, profile } from "../data";
import {
  ArrowLeft,
  ArrowUpRight,
  Globe,
} from "lucide-react";
import "./LiveProjectsPage.css";

function GitHubIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "business", label: "Business", match: "business" },
  { id: "security", label: "Security", match: "security" },
  { id: "wellness", label: "Wellness", match: "wellness" },
  { id: "portfolio", label: "Portfolio", match: "portfolio" },
  { id: "film", label: "Film & Production", match: "film" },
];

function getCategoryEyebrow(category) {
  if (!category) return "CLIENT WEBSITE";
  const cat = category.toLowerCase();
  if (cat.includes("business")) return "BUSINESS WEBSITE";
  if (cat.includes("security")) return "SECURITY SOLUTIONS";
  if (cat.includes("wellness") || cat.includes("yoga")) return "WELLNESS & LIFESTYLE";
  if (cat.includes("portfolio")) return "PERSONAL PORTFOLIO";
  if (cat.includes("film") || cat.includes("production")) return "FILM & PRODUCTION";
  return category.toUpperCase();
}

const liveProjectsSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://pragneyshdekate.in/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Client Websites & Live Deployments",
          "item": "https://pragneyshdekate.in/live-projects"
        }
      ]
    },
    {
      "@type": "CollectionPage",
      "@id": "https://pragneyshdekate.in/live-projects#webpage",
      "url": "https://pragneyshdekate.in/live-projects",
      "name": "Client Websites & Live Deployments | Pragneysh Dekate",
      "description": "Production websites and commercial web platforms designed, developed, and deployed on AWS by Pragneysh Dekate for clients and businesses.",
      "isPartOf": {
        "@id": "https://pragneyshdekate.in/#website"
      }
    }
  ]
};

export default function LiveProjectsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const filteredProjects =
    activeFilter === "all"
      ? liveProjects
      : liveProjects.filter((p) => {
          const tab = FILTER_TABS.find((t) => t.id === activeFilter);
          return tab && p.category.toLowerCase().includes(tab.match);
        });

  return (
    <main id="main-content" className="showcase-page-root" tabIndex="-1">
      <SEO
        title="Client Websites & Live Deployments | Pragneysh Dekate"
        description="Explore production websites, business platforms, and web applications designed, developed, and deployed on AWS by Pragneysh Dekate for clients and commercial businesses."
        canonical="https://pragneyshdekate.in/live-projects"
        schema={liveProjectsSchema}
      />
      {/* Top Breadcrumb Nav */}
      <nav className="showcase-nav-bar" aria-label="Breadcrumb">
        <div className="showcase-container showcase-breadcrumb-trail">
          <Link to="/" className="showcase-back-link">
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current" aria-current="page">Client Websites &amp; Live Deployments</span>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="showcase-hero">
        <div className="showcase-container">
          <div className="showcase-eyebrow">SELECTED CLIENT WORK</div>
          <h1 className="showcase-title">Websites I&apos;ve Designed &amp; Developed</h1>
          <p className="showcase-subtitle">
            Real websites built and deployed for businesses, professionals and clients. Explore the work, experience the design and visit the live websites.
          </p>

          <div className="showcase-summary-line">
            <span className="summary-dot" />
            <span>5 Live Websites · 5 Industries · Responsive Experiences</span>
          </div>

          {/* Pill-Style Filter Navigation */}
          <div className="showcase-filter-bar" role="tablist" aria-label="Filter websites by industry">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              const count =
                tab.id === "all"
                  ? liveProjects.length
                  : liveProjects.filter((p) =>
                      p.category.toLowerCase().includes(tab.match)
                    ).length;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`showcase-filter-pill ${isActive ? "active" : ""}`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="filter-count">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Project Grid */}
      <section className="showcase-content-section" aria-label="Client Website Gallery">
        <div className="showcase-container">
          <div className="showcase-grid">
            {filteredProjects.map((proj) => {
              const tags = proj.tags ? proj.tags.slice(0, 4) : [];
              const eyebrow = getCategoryEyebrow(proj.category);

              return (
                <article key={proj.id} className="showcase-card">
                  {/* Screenshot Header */}
                  <div className="showcase-media-frame">
                    <img
                      src={proj.image}
                      alt={`${proj.title} production website homepage preview by Pragneysh Dekate`}
                      className="showcase-img"
                      width="600"
                      height="340"
                      loading="lazy"
                    />
                    <div className="showcase-live-pill">
                      <span className="live-pulse-dot" />
                      <span>LIVE</span>
                    </div>
                  </div>

                  {/* Information Area */}
                  <div className="showcase-card-body">
                    <div className="showcase-card-eyebrow">{eyebrow}</div>
                    <h2 className="showcase-card-title">{proj.title}</h2>

                    {proj.domain && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="showcase-domain-preview"
                        aria-label={`Visit ${proj.domain}`}
                      >
                        <Globe size={13} className="domain-icon" />
                        <span>{proj.domain}</span>
                        <ArrowUpRight size={13} className="domain-arrow" />
                      </a>
                    )}

                    <p className="showcase-card-desc">{proj.description}</p>

                    {tags.length > 0 && (
                      <div className="showcase-tag-list" aria-label="Technologies used">
                        {tags.map((tag, idx) => (
                          <span key={idx} className="showcase-tech-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="showcase-actions">
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="showcase-btn-primary"
                        aria-label={`Visit live website: ${proj.title}`}
                      >
                        <span>Visit Website</span>
                        <ArrowUpRight size={15} />
                      </a>

                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="showcase-btn-secondary"
                          title="View source code on GitHub"
                          aria-label={`View source code for ${proj.title} on GitHub`}
                        >
                          <GitHubIcon size={14} />
                          <span>Source Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Compact CTA Section */}
          <section className="showcase-compact-cta" aria-labelledby="cta-heading">
            <div className="compact-cta-inner">
              <div className="compact-cta-content">
                <h2 id="cta-heading" className="compact-cta-title">
                  Have a project in mind?
                </h2>
                <p className="compact-cta-desc">
                  Let&apos;s build something that makes your business stand out.
                </p>
              </div>
              <div className="compact-cta-actions">
                <a
                  href={`mailto:${profile.email}?subject=${encodeURIComponent("Website Project Inquiry")}`}
                  className="showcase-btn-primary cta-btn-primary"
                >
                  <span>Start a Conversation</span>
                  <ArrowUpRight size={15} />
                </a>
                <Link to="/#contact" className="showcase-btn-secondary cta-btn-secondary">
                  <span>View Contact Details</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
