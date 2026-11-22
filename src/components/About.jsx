import { useEffect, useRef } from 'react';
import { profile, workflow } from '../data';
import './About.css';
import { CheckCircle2, Workflow, Terminal, Compass, ShieldCheck, Cloud, Server, Code2 } from 'lucide-react';

export default function About() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    ref.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const engineeringHighlights = [
    { label: 'Role & Positioning', value: 'Full-Stack Developer | Python, Cloud & DevOps' },
    { label: 'Core Backend', value: 'Python, Django, Django REST Framework, NestJS' },
    { label: 'Frontend Stack', value: 'React (Vite), Modern JavaScript, HTML5, CSS3, Bootstrap 5' },
    { label: 'Cloud & Infrastructure', value: 'AWS (EC2, Lambda, API Gateway, S3, CloudFront, IAM)' },
    { label: 'DevOps & Tooling', value: 'Docker, Kubernetes, GitHub Actions CI/CD, IaC' },
    { label: 'Databases', value: 'MySQL, DynamoDB, Relational Database Design' },
    { label: 'Location', value: profile.location },
    { label: 'Work Preference', value: profile.workPreference },
  ];

  return (
    <section id="about" className="section about-section" ref={ref}>
      <div className="section-inner">
        {/* Section Header */}
        <div className="section-header reveal">
          <div className="section-label">PROFESSIONAL SUMMARY</div>
          <h2 className="section-title">
            Engineering Scalable Systems &amp; <span className="text-gradient">Cloud Infrastructure</span>
          </h2>
          <p className="section-description">
            Full-stack engineer building end-to-end web applications, robust backend APIs, and production-grade AWS cloud environments.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="about-grid">
          {/* Left Column: Professional Summary & Engineering Highlights */}
          <div className="about-narrative reveal">
            <div className="about-bio-text">
              <p className="bio-paragraph highlight-lead">
                I'm <strong>Pragneysh Dekate</strong> (often known as <strong>Pragnesh</strong>), a <strong>Full-Stack Developer</strong> and Cloud Engineer based in Ahmedabad, Gujarat, focused on building scalable web applications and cloud-native systems.
              </p>
              <p className="bio-paragraph">
                My core expertise is in <strong>Python, Django, React</strong> and backend development, complemented by hands-on experience designing, deploying and managing applications on <strong>AWS</strong>.
              </p>
              <p className="bio-paragraph">
                I work across the full development lifecycle — from database design, API development and frontend integration to cloud infrastructure, deployment automation and CI/CD.
              </p>
              <p className="bio-paragraph">
                My current focus is growing deeper into <strong>Cloud Engineering and DevOps</strong>, building secure, scalable and production-ready systems using AWS, Docker, Kubernetes and Infrastructure as Code.
              </p>
            </div>

            {/* Philosophy Quote */}
            <blockquote className="philosophy-card">
              <div className="quote-mark">“</div>
              <p className="quote-text">{profile.tagline}</p>
              <footer className="quote-author">
                — {profile.fullName} · <em>Full-Stack &amp; Cloud Engineer</em>
              </footer>
            </blockquote>

            {/* Technical Capability Sheet */}
            <div className="facts-card">
              <div className="facts-header">
                <Compass size={16} className="text-accent" />
                <span>Technical &amp; Professional Snapshot</span>
              </div>
              <div className="facts-grid">
                {engineeringHighlights.map((fact, i) => (
                  <div className="fact-item" key={i}>
                    <span className="fact-label">{fact.label}</span>
                    <span className="fact-value">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Engineering Lifecycle */}
          <div className="about-workflow-col reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="workflow-container">
              <div className="workflow-header-box">
                <div className="wf-title-row">
                  <Workflow size={18} className="text-accent" />
                  <h3 className="wf-title">Full Engineering Lifecycle</h3>
                </div>
                <p className="wf-desc">
                  How I design, develop, containerize, and deploy production-grade software:
                </p>
              </div>

              <div className="workflow-timeline">
                {workflow.map((step, i) => (
                  <div className="workflow-step-card" key={i}>
                    <div className="step-badge">
                      <span className="step-number">{step.num}</span>
                    </div>
                    <div className="step-content">
                      <h4 className="step-title">{step.label}</h4>
                      <p className="step-desc">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
