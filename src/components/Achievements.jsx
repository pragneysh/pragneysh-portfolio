import { useEffect, useRef } from "react";
import { achievements } from "../data";
import { Award, Zap, CheckCircle2 } from "lucide-react";
import "./Achievements.css";

export default function Achievements() {
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
    ref.current?.querySelectorAll(".achievement-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="achievements" className="section achievements-section" ref={ref}>
      <div id="engineering-highlights" style={{ position: "relative", top: "-80px" }} />
      <div className="section-inner">
        <div className="section-label">ENGINEERING HIGHLIGHTS</div>
        <h2 className="section-title">
          Technical Highlights &amp; <span className="text-gradient">Accomplishments</span>
        </h2>
        <p className="section-description">
          Demonstrated engineering milestones delivered across production cloud deployments, serverless systems, and full-stack architectures.
        </p>

        <div className="achievements-grid">
          {achievements.map((item, i) => (
            <div
              key={item.id}
              className="achievement-card reveal-card"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="ach-card-top">
                <div className="ach-icon-box">
                  <Award size={20} />
                </div>
                <div className="ach-meta">
                  <span className="ach-category">{item.category}</span>
                  <span className="ach-date">{item.date}</span>
                </div>
              </div>

              <h3 className="ach-title">{item.title}</h3>
              <p className="ach-desc">{item.description}</p>

              {item.metric && (
                <div className="ach-metric-box">
                  <div className="ach-metric-icon">
                    <Zap size={14} />
                  </div>
                  <div className="ach-metric-text">
                    <span className="metric-highlight">{item.metric}</span>
                    <span className="metric-context">Verified Engineering Benchmark</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
