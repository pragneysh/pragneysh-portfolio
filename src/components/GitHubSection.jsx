import { useEffect, useRef } from "react";
import { githubData } from "../data";
import { GitBranch, Star, GitFork, ExternalLink, Activity } from "lucide-react";
import "./GitHubSection.css";

function GitHubLogo({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function GitHubSection() {
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
    ref.current?.querySelectorAll(".github-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="github" className="section github-section" ref={ref}>
      <div className="section-inner">
        <div className="section-label">CODE REPOSITORIES</div>
        <h2 className="section-title">
          Open Source Code &amp; <span className="text-gradient">Activity</span>
        </h2>
        <p className="section-description">
          A record of code repositories, web starter templates, and ongoing development on GitHub.
        </p>

        {/* GitHub Stat Header Card */}
        <div className="github-overview-card github-card reveal-card">
          <div className="gh-overview-left">
            <div className="gh-avatar-badge">
              <GitHubLogo size={32} />
            </div>
            <div>
              <div className="gh-handle-row">
                <span className="gh-username">@{githubData.username}</span>
                <span className="gh-activity-badge">
                  <Activity size={12} /> Active Contributor
                </span>
              </div>
              <p className="gh-bio-note">
                Focusing on Python/Django backends, serverless AWS patterns, and component-driven React applications.
              </p>
            </div>
          </div>

          <div className="gh-overview-stats">
            <div className="gh-stat-box">
              <span className="gh-stat-val">{githubData.totalCommits}</span>
              <span className="gh-stat-lbl">Commits Authored</span>
            </div>
            <div className="gh-stat-box">
              <span className="gh-stat-val">{githubData.publicRepos}+</span>
              <span className="gh-stat-lbl">Public Repositories</span>
            </div>
            <div className="gh-stat-box">
              <span className="gh-stat-val">{githubData.activeYears}</span>
              <span className="gh-stat-lbl">Active Cadence</span>
            </div>
          </div>
        </div>

        {/* Pinned Repositories Grid */}
        <div className="gh-repos-grid">
          {githubData.pinnedRepos.map((repo, i) => (
            <div
              key={i}
              className="repo-card github-card reveal-card"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="repo-card-top">
                <div className="repo-title-row">
                  <GitBranch size={16} className="repo-card-icon" />
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="repo-card-link"
                  >
                    {repo.name}
                  </a>
                </div>
                <span className="repo-public-badge">Public</span>
              </div>

              <p className="repo-card-desc">{repo.description}</p>

              <div className="repo-card-meta">
                <div className="repo-lang-box">
                  <span className="repo-lang-dot" />
                  <span className="repo-lang-name">{repo.language}</span>
                </div>

                <div className="repo-social-stats">
                  <span className="repo-stat-item">
                    <Star size={13} /> {repo.stars}
                  </span>
                  <span className="repo-stat-item">
                    <GitFork size={13} /> {repo.forks}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GitHub Profile CTA */}
        <div className="github-cta-banner">
          <a
            href={githubData.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <GitHubLogo size={16} />
            Explore Full GitHub Profile (@{githubData.username}) ↗
          </a>
        </div>
      </div>
    </section>
  );
}
