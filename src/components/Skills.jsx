import { useEffect, useRef } from "react";
import { skills } from "../data";
import "./Skills.css";

export default function Skills() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1 },
    );
    ref.current
      ?.querySelectorAll(".skill-card")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="skills" className="section skills-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">Skills</div>
        <h2 className="section-title">
          Tech <em>stack</em>
        </h2>
        <div className="skills-grid">
          {skills.map((skill, i) => {
            const Icon = skill.icon;

            return (
              <div
                className="skill-card reveal-card"
                key={i}
                style={{ transitionDelay: `${i * 0.07}s` }}
              >
                <div className={`skill-icon icon-${skill.color}`}>
                  <Icon size={28} strokeWidth={2} />
                </div>

                <div className="skill-title">{skill.title}</div>

                <ul className="skill-list">
                  {skill.items.map((item, j) => (
                    <li key={j}>
                      <span className="skill-bullet">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
