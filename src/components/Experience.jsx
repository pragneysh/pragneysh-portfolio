import { useEffect, useRef } from "react";
import { experience } from "../data";
import { Briefcase, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import "./Experience.css";

export default function Experience() {
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
    ref.current?.querySelectorAll(".timeline-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="experience" className="section experience-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">WORK HISTORY</div>
        <h2 className="section-title">
          Professional <span className="text-gradient">Experience</span>
        </h2>
        <p className="section-description">
          Demonstrated track record engineering full-stack web platforms, serverless AWS architectures, and automated CI/CD pipelines.
        </p>

        <div className="experience-timeline">
          {experience.map((item, i) => {
            const isCurrent = item.date.includes("Present");
            return (
              <div
                className="timeline-row timeline-card reveal-card"
                key={i}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                {/* Timeline Axis Node */}
                <div className="timeline-axis">
                  <div className={`timeline-node ${isCurrent ? "node-active" : ""}`}>
                    {isCurrent ? <span className="active-pulse" /> : <Briefcase size={12} />}
                  </div>
                  <div className="timeline-line" />
                </div>

                {/* Timeline Content Card */}
                <div className="timeline-body">
                  <div className="timeline-header">
                    <div className="role-company-group">
                      <h3 className="timeline-role">{item.role}</h3>
                      <div className="timeline-company-row">
                        <span className="timeline-company">{item.company}</span>
                        {item.location && (
                          <span className="timeline-location">
                            <MapPin size={12} /> {item.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="timeline-meta-badges">
                      <span className="timeline-date-badge">
                        <Calendar size={12} /> {item.date}
                      </span>
                      {item.type && (
                        <span className={`type-badge type-${item.type.toLowerCase().replace(/[^a-z]/g, "")}`}>
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bullet points */}
                  <ul className="timeline-bullets">
                    {item.points.map((pt, j) => (
                      <li key={j} className="timeline-bullet-item">
                        <CheckCircle2 size={14} className="bullet-check" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Tech stack badges */}
                  {item.tech && item.tech.length > 0 && (
                    <div className="timeline-tech-row">
                      <span className="tech-row-lbl">// Environment:</span>
                      <div className="timeline-tech-badges">
                        {item.tech.map((tag, k) => (
                          <span key={k} className="exp-tech-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
