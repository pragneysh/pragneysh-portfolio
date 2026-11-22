import { useEffect, useRef } from "react";
import { certifications } from "../data";
import { Award, CheckCircle2, ShieldCheck } from "lucide-react";
import "./Certifications.css";

export default function Certifications() {
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
    ref.current?.querySelectorAll(".cert-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="certifications" className="section certifications-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">CONTINUOUS LEARNING &amp; MASTERY</div>
        <h2 className="section-title">
          Verified <span className="text-gradient">Certifications &amp; Credentials</span>
        </h2>
        <p className="section-description">
          Demonstrated technical competencies backed by structured curriculums, assessments, and continuous architectural upskilling.
        </p>

        <div className="certifications-grid">
          {certifications.map((cert, i) => (
            <div
              key={cert.id}
              className="cert-card reveal-card"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="cert-top">
                <div className="cert-icon-box">
                  <Award size={22} />
                </div>
                {cert.verified && (
                  <span className="cert-verified-badge">
                    <ShieldCheck size={12} /> Verified Credential
                  </span>
                )}
              </div>

              <h3 className="cert-title">{cert.title}</h3>
              <div className="cert-issuer">{cert.issuer}</div>

              <div className="cert-meta-row">
                <span className="cert-date">Issued: {cert.date}</span>
                <span className="cert-id">ID: {cert.credentialId}</span>
              </div>

              {cert.skills && (
                <div className="cert-skills">
                  {cert.skills.map((s, j) => (
                    <span key={j} className="cert-skill-tag">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
