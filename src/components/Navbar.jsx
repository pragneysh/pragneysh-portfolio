import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { navigation, profile } from '../data';
import './Navbar.css';
import { Sun, Moon, Download, ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('hero');
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // Default to light theme as requested, persist in localStorage
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
  });

  // Primary vs Secondary links
  const primaryLinks = navigation.filter((item) => item.isPrimary);
  const moreLinks = navigation.filter((item) => !item.isPrimary);

  // Ordered sections on homepage for scroll spy
  const sectionIds = [
    'hero',
    'about',
    'skills',
    'experience',
    'live-projects',
    'projects',
    'achievements',
    'education',
    'certifications',
    'contact',
  ];

  // Track scroll position for navbar styling & active spy (on homepage)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);

      if (location.pathname === '/') {
        let current = 'hero';
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 140 && rect.bottom >= 140) {
              current = id;
              break;
            }
          }
        }
        setActive(current);
      } else if (location.pathname.startsWith('/projects')) {
        setActive('projects');
      } else if (location.pathname === '/live-projects') {
        setActive('live-projects');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Sync theme attribute on document root & localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMoreDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMoreDropdownOpen(false);
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleNav = (e, id, item) => {
    e.preventDefault();
    setMenuOpen(false);
    setMoreDropdownOpen(false);

    if (item?.isRoute && item?.path) {
      navigate(item.path);
      return;
    }

    if (id === 'hero' && location.pathname !== '/') {
      navigate('/');
      return;
    }

    if (location.pathname === '/') {
      const targetId = id === 'engineering-highlights' ? 'achievements' : id;
      const el = document.getElementById(targetId);
      if (el) {
        const navOffset = 75;
        const targetTop = el.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
        window.history.pushState(null, '', `#${targetId}`);
      }
    } else {
      navigate(`/#${id}`);
    }
  };

  const isMoreActive = moreLinks.some((m) => m.id === active);

  return (
    <header className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
      <nav className="navbar-container" aria-label="Main Navigation">
        {/* Brand Logo */}
        <Link
          to="/"
          className="nav-brand"
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <span className="brand-dot" />
          <span className="brand-text">Pragneysh</span>
          <span className="brand-badge">Full-Stack &amp; Cloud</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-desktop">
          <ul className="nav-menu">
            {primaryLinks.map((item) => (
              <li key={item.id}>
                <a
                  href={`/#${item.id}`}
                  className={`nav-link ${location.pathname === '/' && active === item.id ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, item.id, item)}
                >
                  {item.label}
                </a>
              </li>
            ))}

            {/* "More" Dropdown */}
            {moreLinks.length > 0 && (
              <li
                ref={dropdownRef}
                className="nav-item-dropdown"
                onMouseEnter={() => setMoreDropdownOpen(true)}
                onMouseLeave={() => setMoreDropdownOpen(false)}
              >
                <button
                  className={`nav-link dropdown-toggle ${isMoreActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen((o) => !o)}
                  aria-expanded={moreDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>More</span>
                  <ChevronDown size={14} className={`dropdown-icon ${moreDropdownOpen ? 'rotated' : ''}`} />
                </button>

                {moreDropdownOpen && (
                  <div className="dropdown-menu" role="menu">
                    {moreLinks.map((item) => (
                      <a
                        key={item.id}
                        href={`/#${item.id}`}
                        role="menuitem"
                        className={`dropdown-item ${active === item.id ? 'active' : ''}`}
                        onClick={(e) => handleNav(e, item.id, item)}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>

        {/* Action Controls: Theme Switcher & Resume CTA */}
        <div className="nav-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <a
            href={profile.resumeUrl}
            download="Pragneysh_Dekate_Resume.pdf"
            className="btn-primary resume-nav-btn"
            aria-label="Download Pragneysh Dekate Resume"
          >
            <Download size={14} />
            <span>Resume</span>
          </a>

          {/* Mobile menu trigger */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="drawer-header">
          <span className="drawer-title">Navigation</span>
          <button
            className="drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <ul className="drawer-nav">
          {/* Primary Links */}
          {primaryLinks.map((item) => (
            <li key={item.id}>
              <a
                href={`/#${item.id}`}
                className={`drawer-link ${location.pathname === '/' && active === item.id ? 'active' : ''}`}
                onClick={(e) => handleNav(e, item.id, item)}
              >
                <span>{item.label}</span>
                <ArrowUpRight size={14} className="drawer-arrow" />
              </a>
            </li>
          ))}

          {/* Secondary Links Header */}
          {moreLinks.length > 0 && (
            <>
              <li className="drawer-section-label">More Sections</li>
              {moreLinks.map((item) => (
                <li key={item.id}>
                  <a
                    href={`/#${item.id}`}
                    className={`drawer-link ${active === item.id ? 'active' : ''}`}
                    onClick={(e) => handleNav(e, item.id, item)}
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight size={14} className="drawer-arrow" />
                  </a>
                </li>
              ))}
            </>
          )}
        </ul>

        <div className="drawer-footer">
          <a
            href={profile.resumeUrl}
            download="Pragneysh_Dekate_Resume.pdf"
            className="btn-primary drawer-resume-btn"
          >
            <Download size={16} />
            <span>Download Resume (PDF)</span>
          </a>
        </div>
      </div>
      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
