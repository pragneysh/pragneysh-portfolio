import { useEffect, useRef } from "react";
import { education } from "../data";
import { GraduationCap, Calendar, Award, BookOpen, CheckCircle2 } from "lucide-react";
import "./Education.css";

export default function Education() {
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
    ref.current?.querySelectorAll(".edu-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const degrees = education.filter((item) => item.isProminent);
  const schooling = education.filter((item) => !item.isProminent);

  return (
    <section id="education" className="section education-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">ACADEMIC FOUNDATION</div>
        <h2 className="section-title">
          Education &amp; <span className="text-gradient">Qualifications</span>
        </h2>
        <p className="section-description">
          Formal academic training in computer applications, software engineering principles, and distributed computing.
        </p>

        {/* Prominent University Degrees (MCA & BCA) */}
        <div className="education-degrees-grid">
          {degrees.map((item, i) => (
            <div key={i} className="edu-card edu-degree-card reveal-card">
              <div className="edu-card-top">
                <div className="edu-icon-badge">
                  <GraduationCap size={24} />
                </div>
                <div className="edu-meta">
                  <span className="edu-badge-prominent">University Degree</span>
                  <span className="edu-duration">
                    <Calendar size={13} /> Passout: {item.passoutYear}
                  </span>
                </div>
              </div>

              <h3 className="edu-degree">{item.degree}</h3>

              {item.highlights && item.highlights.length > 0 && (
                <ul className="edu-highlights-list">
                  {item.highlights.map((h, k) => (
                    <li key={k} className="edu-highlight-item">
                      <CheckCircle2 size={14} className="highlight-check" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Secondary Education (HSC & SSC) */}
        <div className="education-schooling-grid">
          {schooling.map((item, i) => (
            <div key={i} className="edu-card edu-school-card reveal-card">
              <div className="edu-school-header">
                <div className="edu-school-icon">
                  <BookOpen size={18} />
                </div>
                <div className="edu-school-meta">
                  <span className="edu-school-board">{item.board}</span>
                  <span className="edu-duration">
                    <Calendar size={12} /> {item.passoutYear}
                  </span>
                </div>
              </div>
              <h4 className="edu-school-title">{item.degree}</h4>
              <p className="edu-school-desc">Passout Year: {item.passoutYear}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
