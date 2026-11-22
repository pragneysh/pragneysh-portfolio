import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Services from "./components/Services";
import Projects from "./components/Projects";
import ArchitectureShowcase from "./components/ArchitectureShowcase";
import LiveProjects from "./components/LiveProjects";
import Experience from "./components/Experience";
import Achievements from "./components/Achievements";
import Contributions from "./components/Contributions";
import Education from "./components/Education";
import Certifications from "./components/Certifications";
import GitHubSection from "./components/GitHubSection";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import CaseStudy from "./components/CaseStudy";
import LiveProjectsPage from "./components/LiveProjectsPage";

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const elementId = hash.replace("#", "");
      const timer = setTimeout(() => {
        const targetId = elementId === "engineering-highlights" ? "achievements" : elementId;
        const el = document.getElementById(targetId);
        if (el) {
          const navHeight = 75;
          const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 70);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, hash]);

  return null;
}

function HomePage() {
  return (
    <main id="main-content" tabIndex="-1">
      <Hero />
      <About />
      <Skills />
      <Experience />
      <LiveProjects />
      <Projects />
      <Achievements />
      <Education />
      <Certifications />
      <Contact />
    </main>
  );
}

export default function App() {
  const handleSkip = (e) => {
    e.preventDefault();
    const target = document.getElementById("main-content");
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <BrowserRouter>
      <ScrollManager />
      <a href="#main-content" className="skip-link" onClick={handleSkip}>
        Skip to main content
      </a>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:slug" element={<CaseStudy />} />
        <Route path="/live-projects" element={<LiveProjectsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
