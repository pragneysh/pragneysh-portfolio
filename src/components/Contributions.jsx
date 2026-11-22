import { useEffect, useRef } from "react";
import { contributions } from "../data";
import { GitBranch, ExternalLink, Code2 } from "lucide-react";
import "./Contributions.css";

export default function Contributions() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08 }
    );
    ref.current?.querySelectorAll(".contrib-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="contributions" className="section contributions-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">OPEN SOURCE WORK</div>
        <h2 className="section-title">
          Starter Kits &amp; <span className="text-gradient">Open Source Projects</span>
        </h2>
        <p className="section-description">
          Reusable templates, design patterns, and web starter kits created to help developers and businesses build faster.
        </p>

        <div className="contributions-grid">
          {contributions.map((item, i) => (
            <div
              key={item.id}
              className="contrib-card reveal-card"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="contrib-header">
                <div className="contrib-type-badge">
                  <Code2 size={12} />
                  <span>{item.type}</span>
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="contrib-ext-link"
                  title="View on GitHub"
                >
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="contrib-repo-name">
                <GitBranch size={14} className="repo-icon" />
                <span className="repo-path">{item.repo}</span>
              </div>

              <h3 className="contrib-title">{item.title}</h3>
              <p className="contrib-desc">{item.description}</p>

              <div className="contrib-tags">
                {item.tags.map((tag, j) => (
                  <span key={j} className="contrib-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="contrib-footer">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="contrib-cta"
                >
                  Inspect Repository ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
