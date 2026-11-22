import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { projects } from "../data";
import {
  ArrowRight,
  Layers,
} from "lucide-react";
import "./Projects.css";

// Plain-language, non-technical project information & user benefits
export const PROJECT_PLAIN_INFO = {
  "leavesmanagement": {
    categoryKey: "cloud",
    categoryLabel: "Cloud Platform",
    simpleDesc: "A workplace management system that helps employees request leave and allows managers to review, approve and track requests in one place.",
    highlights: [
      "Employee time-off requests & balance tracking",
      "Multi-level manager approval workflows with status alerts",
    ],
    tech: ["React", "NestJS", "AWS"],
  },
  "tour-travel-booking": {
    categoryKey: "web",
    categoryLabel: "Web Application",
    simpleDesc: "A travel booking website where visitors can explore destinations, plan trips, discover hotels and manage their travel bookings.",
    highlights: [
      "Holiday package discovery with day-by-day itineraries",
      "Hotel room reservations and booking management",
    ],
    tech: ["Python", "Django", "MySQL"],
  },
  "tshirt-customization-platform": {
    categoryKey: "ecommerce",
    categoryLabel: "E-Commerce",
    simpleDesc: "An online shopping experience where customers can customize T-shirts, preview their designs in real time and place orders.",
    highlights: [
      "Interactive live product visual customizer",
      "Complete shopping cart and order checkout flow",
    ],
    tech: ["Django", "MySQL", "HTML5"],
  },
  "client-portfolio-platforms": {
    categoryKey: "cloud",
    categoryLabel: "Cloud Platform",
    simpleDesc: "Professional websites built for businesses, designed to showcase their services, attract customers and provide a smooth online experience.",
    highlights: [
      "Fast global loading with verified SSL security",
      "Live client deployments for real commercial businesses",
    ],
    tech: ["AWS S3", "CloudFront", "React"],
  },
  "restaurant-ordering-system": {
    categoryKey: "web",
    categoryLabel: "Web Application",
    simpleDesc: "A digital restaurant ordering system that lets customers browse menus, customize food orders and place orders directly from their table.",
    highlights: [
      "QR code table ordering with zero app download",
      "Real-time order synchronization with kitchen queue",
    ],
    tech: ["React", "NestJS", "AWS"],
  },
  "auth-security-systems": {
    categoryKey: "security",
    categoryLabel: "Security",
    simpleDesc: "A secure login and account protection system with two-step verification, password recovery and safe access management.",
    highlights: [
      "Two-step multi-factor verification for account defense",
      "Safe session management and encrypted login tokens",
    ],
    tech: ["Python", "Django", "JWT"],
  },
  "aws-control-center": {
    categoryKey: "cloud",
    categoryLabel: "Cloud Platform",
    simpleDesc: "An automated cloud management dashboard that backs up business data, monitors cloud resources and keeps systems running reliably.",
    highlights: [
      "Automated cloud backup schedules and recovery",
      "Resource status monitoring and health reporting",
    ],
    tech: ["AWS", "Python", "CloudFormation"],
  },
  "workly": {
    categoryKey: "web",
    categoryLabel: "Web Application",
    simpleDesc: "A compliance and relationship management dashboard for logistics teams to track carrier records, documents and operational workflows.",
    highlights: [
      "Carrier profile and document verification tracking",
      "Operational workflow queues and status alerts",
    ],
    tech: ["React", "Python", "SQL"],
  },
  "verticomply": {
    categoryKey: "web",
    categoryLabel: "Web Application",
    simpleDesc: "A healthcare compliance dashboard designed to track audit readiness, security policies and patient privacy standards.",
    highlights: [
      "Compliance audit checklist and policy tracking",
      "Role-based access controls for sensitive records",
    ],
    tech: ["React", "Django", "PostgreSQL"],
  },
};

const TABS = [
  { key: "all", label: "All Projects" },
  { key: "cloud", label: "Cloud & Platforms" },
  { key: "web", label: "Web Applications" },
  { key: "ecommerce", label: "E-Commerce" },
  { key: "security", label: "Security" },
];

export function getCategoryKey(proj) {
  const info = PROJECT_PLAIN_INFO[proj.id] || PROJECT_PLAIN_INFO[proj.slug];
  if (info) return info.categoryKey;
  const cat = (proj.category || "").toLowerCase();
  if (cat.includes("cloud") || cat.includes("platform")) return "cloud";
  if (cat.includes("security") || cat.includes("auth")) return "security";
  if (cat.includes("commerce")) return "ecommerce";
  return "web";
}

export default function Projects() {
  const sectionRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08 }
    );
    sectionRef.current?.querySelectorAll(".reveal-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  const filteredProjects =
    activeTab === "all"
      ? projects
      : projects.filter((p) => getCategoryKey(p) === activeTab);

  return (
    <section id="projects" className="section projects-section" ref={sectionRef} aria-label="Projects">
      <div className="section-inner">
        {/* Section Header */}
        <div className="section-header text-center">
          <div className="section-label">SELECTED WORK</div>
          <h2 className="section-title">
            <span className="text-gradient">Projects</span>
          </h2>
          <p className="section-description">
            Explore applications, business platforms and software solutions I&apos;ve built. Each project highlights a real problem, the solution and how it works.
          </p>
        </div>

        {/* Clean Filter Navigation */}
        <div className="projects-filter-bar">
          <div className="filter-pills-wrap" role="tablist" aria-label="Filter projects by category">
            {TABS.map((tab) => {
              const count =
                tab.key === "all"
                  ? projects.length
                  : projects.filter((p) => getCategoryKey(p) === tab.key).length;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  className={`filter-btn ${isActive ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className="filter-count">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Responsive Projects Grid */}
        <div className="projects-grid">
          {filteredProjects.map((proj, i) => {
            const info = PROJECT_PLAIN_INFO[proj.id] || PROJECT_PLAIN_INFO[proj.slug] || {
              categoryLabel: proj.category,
              simpleDesc: proj.description,
              tech: proj.stack?.slice(0, 3) || [],
            };

            return (
              <article
                className="project-card reveal-card"
                key={proj.id}
                style={{ transitionDelay: `${(i % 3) * 0.08}s` }}
              >
                {/* 1. Preview Media (16:9 Aspect Ratio) */}
                <div className="project-card-media">
                  {proj.image ? (
                    <img
                      src={proj.image}
                      alt={`${proj.title} preview`}
                      className="project-card-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="project-card-placeholder">
                      <Layers size={32} />
                      <span>{info.categoryLabel}</span>
                    </div>
                  )}
                  <div className="project-media-overlay" />
                  <span className="project-category-badge">{info.categoryLabel}</span>
                </div>

                {/* 2. Content Body */}
                <div className="project-card-body">
                  <h3 className="project-title">
                    <Link to={`/projects/${proj.slug}`} className="title-link">
                      {proj.title}
                    </Link>
                  </h3>

                  <p className="project-description">{info.simpleDesc}</p>

                  {/* 3. Key Tech Tags (max 3 tags) */}
                  <div className="project-tech-pills" aria-label="Core technologies">
                    {info.tech.slice(0, 3).map((tag, tIdx) => (
                      <span key={tIdx} className="tech-pill">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 4. Clear View Project CTA Link */}
                  <div className="project-card-footer">
                    <Link
                      to={`/projects/${proj.slug}`}
                      className="project-cta-link"
                      aria-label={`View project details for ${proj.title}`}
                    >
                      <span>View Project</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
