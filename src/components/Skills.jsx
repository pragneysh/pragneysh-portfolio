import { useState, useEffect, useRef } from "react";
import { skillsCategories } from "../data";
import { CheckCircle2, Sparkles, Filter, Cloud, Terminal, Server, Code2, DatabaseZap } from "lucide-react";
import "./Skills.css";

export default function Skills() {
  const ref = useRef(null);
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
    ref.current?.querySelectorAll(".reveal-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  const filteredCategories =
    activeTab === "all"
      ? skillsCategories
      : skillsCategories.filter((c) => c.id === activeTab);

  const totalSkillsCount = skillsCategories.reduce((acc, c) => acc + c.skills.length, 0);

  return (
    <section id="skills" className="section skills-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">TECHNICAL COMPETENCIES</div>
        <h2 className="section-title">
          Technical <span className="text-gradient">Skills &amp; Capabilities</span>
        </h2>
        <p className="section-description">
          A structured engineering skillset organized across cloud infrastructure, DevOps pipelines, backend APIs, frontend interfaces, and databases.
        </p>

        {/* Filter Tabs */}
        <div className="skills-filter-bar">
          <div className="filter-label">
            <Filter size={14} /> Filter Stack:
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Skills ({totalSkillsCount})
            </button>
            {skillsCategories.map((cat) => (
              <button
                key={cat.id}
                className={`filter-tab ${activeTab === cat.id ? "active" : ""}`}
                onClick={() => setActiveTab(cat.id)}
              >
                {cat.title} ({cat.skills.length})
              </button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="skills-grid">
          {filteredCategories.map((cat, i) => {
            const Icon = cat.icon || Server;
            return (
              <div
                className="category-card reveal-card"
                key={cat.id}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="category-header">
                  <div className={`category-icon-wrapper icon-${cat.color || "blue"}`}>
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="category-title">{cat.title}</h3>
                    <p className="category-desc">{cat.description}</p>
                  </div>
                </div>

                <div className="skills-badge-list">
                  {cat.skills.map((skill, j) => (
                    <div
                      key={j}
                      className={`skill-pill ${skill.highlight ? "skill-highlight" : ""}`}
                    >
                      <div className="skill-pill-main">
                        {skill.highlight && (
                          <Sparkles size={11} className="skill-sparkle" />
                        )}
                        <span className="skill-name">{skill.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Strengths Summary Banner */}
        <div className="skills-recruiter-banner">
          <div className="banner-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="banner-content">
            <div className="banner-title">Engineering Core at a Glance</div>
            <div className="banner-tags">
              <span className="core-tag">Python &amp; Django</span>
              <span className="core-tag">React &amp; Vite</span>
              <span className="core-tag">AWS (Lambda, EC2, S3, CloudFront)</span>
              <span className="core-tag">Docker &amp; Kubernetes</span>
              <span className="core-tag">CI/CD &amp; Infrastructure as Code</span>
              <span className="core-tag">MySQL &amp; DynamoDB</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
