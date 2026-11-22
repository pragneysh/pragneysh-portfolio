import { useState, useEffect, useRef } from "react";
import { profile } from "../data";
import {
  Mail,
  MapPin,
  Copy,
  Check,
  Send,
  ExternalLink,
  Sparkles,
  PhoneCall,
  Clock,
} from "lucide-react";
import "./Contact.css";

function GitHubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedInIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Contact() {
  const ref = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "Full-Time Engineering Role",
    message: "",
  });
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);
  const [error, setError] = useState("");

  const presetSubjects = [
    "Full-Time Engineering Role",
    "Full-Stack Web Application",
    "Python & Django Backend",
    "AWS Cloud & Serverless Project",
    "DevOps & CI/CD Pipeline",
  ];

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
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubjectSelect = (sub) => {
    setForm((f) => ({ ...f, subject: sub }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Please complete all required fields (Name, Email, Message).");
      return;
    }
    setError("");

    const encodedSub = encodeURIComponent(`[Portfolio] ${form.subject}`);
    const encodedBody = encodeURIComponent(
      `Hi Pragneysh,\n\nName: ${form.name}\nEmail: ${form.email}\nTopic: ${form.subject}\n\nMessage:\n${form.message}\n\nSent via pragneysh.dev`
    );

    window.location.href = `mailto:${profile.email}?subject=${encodedSub}&body=${encodedBody}`;
    setSentNotice(true);
    setForm({
      name: "",
      email: "",
      subject: "New Website Development",
      message: "",
    });
    setTimeout(() => setSentNotice(false), 6000);
  };

  return (
    <section id="contact" className="section contact-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">GET IN TOUCH</div>
        <h2 className="section-title">
          Let&apos;s Connect &amp; <span className="text-gradient">Build Together</span>
        </h2>
        <p className="section-description">
          Looking for a Full-Stack Developer with Python, React, AWS, and DevOps capabilities? Let&apos;s connect about full-time roles, engineering contracts, or system architecture.
        </p>

        <div className="contact-grid">
          {/* Left Column: Direct Channels */}
          <div className="contact-left-card reveal-card">
            <div className="recruiter-status-box">
              <div className="status-indicator-ping">
                <span className="ping-dot" />
                <span className="ping-text">Available for Opportunities</span>
              </div>
              <h3 className="recruiter-box-title">Engineering Collaboration</h3>
              <p className="recruiter-box-p">
                Open to full-time engineering roles, backend development, and AWS cloud projects. Ready for remote, hybrid, or on-site opportunities in Ahmedabad and relocation.
              </p>
              <div className="recruiter-specs">
                <div className="spec-item">
                  <Clock size={13} className="spec-icon" />
                  <span>Availability: Full-time roles &amp; select contracts</span>
                </div>
                <div className="spec-item">
                  <MapPin size={13} className="spec-icon" />
                  <span>Ahmedabad, Gujarat, India · Remote Friendly</span>
                </div>
              </div>
            </div>

            {/* One-click email copy button */}
            <div className="copy-email-card">
              <div className="copy-email-info">
                <span className="copy-email-lbl">// Direct Email</span>
                <span className="copy-email-address">{profile.email}</span>
              </div>
              <button
                className="btn-copy-email"
                onClick={handleCopyEmail}
                title="Copy email address"
              >
                {copied ? (
                  <>
                    <Check size={14} className="copied-check" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Email
                  </>
                )}
              </button>
            </div>

            {/* Direct Channel Links */}
            <div className="channel-links-list">
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="channel-link-item"
              >
                <div className="channel-icon-box">
                  <LinkedInIcon size={18} />
                </div>
                <div className="channel-text">
                  <div className="channel-lbl">LinkedIn Profile</div>
                  <div className="channel-val">Connect &amp; Message on LinkedIn</div>
                </div>
                <ExternalLink size={14} className="channel-arrow" />
              </a>

              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="channel-link-item"
              >
                <div className="channel-icon-box">
                  <GitHubIcon size={18} />
                </div>
                <div className="channel-text">
                  <div className="channel-lbl">GitHub Repository</div>
                  <div className="channel-val">Review Code &amp; Repositories</div>
                </div>
                <ExternalLink size={14} className="channel-arrow" />
              </a>

              <a
                href="/resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="channel-link-item"
              >
                <div className="channel-icon-box">
                  <Sparkles size={18} />
                </div>
                <div className="channel-text">
                  <div className="channel-lbl">Curriculum Vitae</div>
                  <div className="channel-val">Download Pragneysh_CV.pdf</div>
                </div>
                <ExternalLink size={14} className="channel-arrow" />
              </a>
            </div>
          </div>

          {/* Right Column: Pre-filled Contact Form */}
          <div className="contact-form-card reveal-card" style={{ transitionDelay: "0.12s" }}>
            <div className="form-card-header">
              <div className="form-card-title">// Dispatch a Message</div>
              <p className="form-card-subtitle">
                Fill out the form below; clicking Send opens your email client with the details pre-formatted.
              </p>
            </div>

            {sentNotice && (
              <div className="form-alert alert-success">
                <Check size={16} /> Email client opened with your pre-formatted message!
              </div>
            )}

            {error && (
              <div className="form-alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form-element">
              {/* Preset Subjects */}
              <div className="form-field-group">
                <label className="field-label">Purpose / Subject Preset:</label>
                <div className="subject-preset-pills">
                  {presetSubjects.map((sub, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`preset-pill ${form.subject === sub ? "active" : ""}`}
                      onClick={() => handleSubjectSelect(sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field-group">
                  <label className="field-label" htmlFor="name">
                    Your Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="form-input-field"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Alex Morgan"
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="email">
                    Your Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input-field"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. alex@company.com"
                    required
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="subject">
                  Subject Line
                </label>
                <input
                  id="subject"
                  name="subject"
                  className="form-input-field"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Subject of your message"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="message">
                  Project Details / Role Scope *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="form-textarea-field"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell me about the engineering role, team, or project requirements..."
                  required
                />
              </div>

              <button type="submit" className="btn-primary form-submit-btn">
                <Send size={15} />
                Send Message via Email Client
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
