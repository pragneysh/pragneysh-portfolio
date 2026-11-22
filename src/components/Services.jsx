import { useEffect, useRef } from "react";
import { services } from "../data";
import { Check, ArrowRight } from "lucide-react";
import "./Services.css";

export default function Services() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.08 }
    );
    ref.current?.querySelectorAll(".service-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="services" className="section services-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">SERVICES OFFERED</div>
        <h2 className="section-title">
          Web &amp; Digital <span className="text-gradient">Services for Your Business</span>
        </h2>
        <p className="section-description">
          Professional, reliable web development and design services tailored to help businesses, professionals, and individuals succeed online.
        </p>

        <div className="services-grid">
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <div
                className="service-card reveal-card"
                key={i}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="service-card-top">
                  <div className="service-icon-wrapper">
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <span className="service-number">0{i + 1}</span>
                </div>

                <h3 className="service-title">{svc.title}</h3>
                <p className="service-desc">{svc.description}</p>

                {svc.deliverables && (
                  <div className="service-deliverables">
                    <div className="deliverables-heading">What you get:</div>
                    <ul className="deliverables-list">
                      {svc.deliverables.map((item, j) => (
                        <li key={j} className="deliverable-item">
                          <Check size={14} className="deliverable-check" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="service-footer">
                  <a href="#contact" className="service-cta">
                    Discuss this service <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
