import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Universal SEO manager for SPA route transitions.
 * Dynamically updates document title, canonical link, meta descriptions,
 * Open Graph / Twitter tags, and injects route-specific JSON-LD structured data.
 */
export default function SEO({
  title = "Pragneysh Dekate | Full-Stack Developer, Python & AWS",
  description = "Portfolio of Pragneysh Dekate (Pragnesh), Full-Stack Developer & Cloud Engineer in Ahmedabad, Gujarat. Building scalable web applications, Python & Django backends, React interfaces, and AWS cloud systems.",
  canonical,
  ogType = "website",
  ogImage = "https://pragneyshdekate.in/logo512.png",
  schema = null,
}) {
  const location = useLocation();
  const currentCanonical = canonical || `https://pragneyshdekate.in${location.pathname === "/" ? "" : location.pathname}`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // Helper to get or create a meta tag
    const setMetaTag = (attribute, name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Helper to get or create a link tag
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // 2. Standard Meta Tags
    setMetaTag("name", "title", title);
    setMetaTag("name", "description", description);
    setMetaTag("name", "author", "Pragneysh Dekate");
    setMetaTag("name", "robots", "index, follow");

    // 3. Canonical URL
    setLinkTag("canonical", currentCanonical);

    // 4. Open Graph / Facebook
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:url", currentCanonical);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("property", "og:site_name", "Pragneysh Dekate Portfolio");

    // 5. Twitter Card
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:url", currentCanonical);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", ogImage);

    // 6. Route-Specific JSON-LD Structured Data
    const SCRIPT_ID = "route-jsonld-schema";
    let scriptEl = document.getElementById(SCRIPT_ID);

    if (schema) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = SCRIPT_ID;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schema, null, 2);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, currentCanonical, ogType, ogImage, schema]);

  return null;
}
