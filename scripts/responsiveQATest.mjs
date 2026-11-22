import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
    this.consoleErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method) {
          this.events.push(msg);
          if (msg.method === "Runtime.consoleAPICalled" && (msg.params.type === "error" || msg.params.type === "warning")) {
            this.consoleErrors.push({
              type: msg.params.type,
              text: msg.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(" "),
            });
          }
          if (msg.method === "Runtime.exceptionThrown") {
            this.consoleErrors.push({
              type: "exception",
              text: msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""),
            });
          }
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runQA() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_qa_suite_" + Date.now();
  const screenshotDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\2c5cfca3-0f79-463b-b132-ed33cee2a6e6\\screenshots";
  const reportDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\2c5cfca3-0f79-463b-b132-ed33cee2a6e6\\qa_reports";

  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  console.log("1. Launching headless Chrome...");
  const chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "about:blank",
  ]);

  let cdpUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/list");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome DevTools Protocol at http://127.0.0.1:9222");
  }

  console.log("2. Connected to CDP target:", cdpUrl);
  const cdp = new CDPClient(cdpUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("DOM.enable");

  console.log("3. Navigating to http://localhost:4173/ ...");
  await cdp.send("Page.navigate", { url: "http://localhost:4173/" });
  await new Promise((r) => setTimeout(r, 2000));

  const testReport = {
    viewports: {},
    skipLink: {},
    functional: {},
    accessibility: {},
    caseStudyRoutes: {},
    liveProjectsPage: {},
    screenshots: [],
    consoleErrors: [],
  };

  // 11 Exact Viewports
  const viewports = [
    { width: 320, height: 568, label: "320px (iPhone SE Small)" },
    { width: 360, height: 800, label: "360px (Galaxy S Small)" },
    { width: 375, height: 667, label: "375px (iPhone Standard)" },
    { width: 390, height: 844, label: "390px (iPhone 13/14 Pro)" },
    { width: 430, height: 932, label: "430px (iPhone 14/15 Pro Max)" },
    { width: 768, height: 1024, label: "768px (iPad Portrait / Tablet)" },
    { width: 820, height: 1180, label: "820px (iPad Air Portrait)" },
    { width: 1024, height: 768, label: "1024px (iPad Landscape / Small Desktop)" },
    { width: 1280, height: 800, label: "1280px (Standard Laptop)" },
    { width: 1440, height: 900, label: "1440px (Modern Desktop)" },
    { width: 1920, height: 1080, label: "1920px (Full HD Monitor)" },
  ];

  console.log("\n4. Testing All 11 Responsive Viewports on Homepage...");

  for (const vp of viewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 900,
    });
    await new Promise((r) => setTimeout(r, 500));

    const vpMetrics = await cdp.eval(`
      (() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasHorizontalOverflow = docWidth > winWidth + 1;

        const overflowingElements = [];
        if (hasHorizontalOverflow) {
          document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 2) {
              overflowingElements.push({
                tag: el.tagName,
                className: el.className,
                id: el.id,
                right: rect.right,
                excess: Math.round(rect.right - winWidth)
              });
            }
          });
        }

        const sections = ['hero', 'featured-projects', 'about', 'skills', 'services', 'projects', 'architecture', 'live-projects', 'experience', 'achievements', 'contributions', 'education', 'certifications', 'contact'];
        const sectionStatus = {};
        sections.forEach(id => {
          const el = document.getElementById(id);
          sectionStatus[id] = el ? { found: true, visible: el.getBoundingClientRect().height > 0 } : { found: false };
        });

        const hamburger = document.querySelector('.mobile-toggle-btn');
        const headlineEl = document.querySelector('.hero-headline, h1, .hero-title');
        const featuredCards = document.querySelectorAll('.featured-project-card');
        const projectCards = document.querySelectorAll('#projects .project-card');
        const footer = document.querySelector('footer');

        return {
          winWidth,
          docWidth,
          hasHorizontalOverflow,
          overflowCount: overflowingElements.length,
          overflowSample: overflowingElements.slice(0, 3),
          sectionStatus,
          hamburgerVisible: !!(hamburger && window.getComputedStyle(hamburger).display !== 'none'),
          headlineText: headlineEl ? headlineEl.textContent.trim().slice(0, 50) : null,
          featuredCount: featuredCards.length,
          projectsCount: projectCards.length,
          footerFound: !!footer
        };
      })()
    `);

    testReport.viewports[vp.width] = vpMetrics;
    console.log(`- [${vp.label}] Win: ${vpMetrics.winWidth}px | Doc: ${vpMetrics.docWidth}px | Overflow: ${vpMetrics.hasHorizontalOverflow ? "FAIL" : "PASSED (No Overflow)"}`);

    // Capture Full Page Screenshots at 390px, 768px, 1440px
    if ([390, 768, 1440].includes(vp.width)) {
      console.log(`  -> Capturing full-page screenshot at ${vp.width}px...`);
      // Get full layout height
      const layoutMetrics = await cdp.send("Page.getLayoutMetrics");
      const pageHeight = Math.ceil(layoutMetrics.contentSize.height);

      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: pageHeight,
        deviceScaleFactor: 1,
        mobile: vp.width < 900,
      });
      await new Promise((r) => setTimeout(r, 600));

      const screenshot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });

      const shotPath = path.join(screenshotDir, `screenshot_${vp.width}px.png`);
      fs.writeFileSync(shotPath, Buffer.from(screenshot.data, "base64"));
      testReport.screenshots.push({ width: vp.width, path: shotPath, height: pageHeight });
      console.log(`  -> Saved ${shotPath} (${pageHeight}px height)`);

      // Reset height
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 900,
      });
    }
  }

  // Restore Desktop Viewport for Skip Link & Functional Tests
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 600));

  // 5. Test Skip Link Accessibility & Keyboard Interaction
  console.log("\n5. Testing 'Skip to main content' Accessibility...");

  const initialSkip = await cdp.eval(`
    (() => {
      const skip = document.querySelector('.skip-link');
      if (!skip) return { found: false };
      const rect = skip.getBoundingClientRect();
      return {
        found: true,
        initiallyHidden: rect.top < 0 || rect.bottom <= 0,
        initialTop: Math.round(rect.top)
      };
    })()
  `);

  // Send real keyboard Tab key to focus the skip-link
  await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 9, key: "Tab", code: "Tab" });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 9, key: "Tab", code: "Tab" });
  await new Promise((r) => setTimeout(r, 350));

  const afterTabSkip = await cdp.eval(`
    (() => {
      const active = document.activeElement;
      const skip = document.querySelector('.skip-link');
      const isSkipFocused = active === skip;
      const rect = skip.getBoundingClientRect();
      const visibleOnFocus = rect.top >= 0 && rect.bottom > 0;

      // Click skip link
      skip.click();
      const activeAfterClick = document.activeElement;
      const targetMoved = activeAfterClick && (activeAfterClick.id === 'main-content' || activeAfterClick.tagName === 'MAIN');

      return {
        isSkipFocused,
        visibleOnFocus,
        focusedTop: Math.round(rect.top),
        targetMoved,
        activeElementId: activeAfterClick?.id,
        activeElementTag: activeAfterClick?.tagName
      };
    })()
  `);

  const skipLinkTest = {
    found: initialSkip.found,
    initiallyHidden: initialSkip.initiallyHidden,
    visibleOnFocus: afterTabSkip.visibleOnFocus,
    focusedTop: afterTabSkip.focusedTop,
    isFocused: afterTabSkip.isSkipFocused,
    targetMoved: afterTabSkip.targetMoved,
    activeElementId: afterTabSkip.activeElementId,
    activeElementTag: afterTabSkip.activeElementTag,
    href: "#main-content"
  };

  testReport.skipLink = skipLinkTest;
  console.log(`- Skip Link Found: ${skipLinkTest.found}`);
  console.log(`- Hidden during normal browsing: ${skipLinkTest.initiallyHidden ? "PASSED" : "FAIL"}`);
  console.log(`- Visible on Keyboard Focus (Tab key): ${skipLinkTest.visibleOnFocus ? "PASSED (top: " + skipLinkTest.focusedTop + "px)" : "FAIL"}`);
  console.log(`- Shifts focus to #main-content on click: ${skipLinkTest.targetMoved ? "PASSED" : "FAIL"}`);

  // 6. Test All 9 Case Study Routes
  console.log("\n6. Testing All 9 Case-Study Routes...");
  const slugs = [
    "leavesmanagement",
    "tour-travel-booking",
    "tshirt-customization-platform",
    "client-portfolio-platforms",
    "auth-security-systems",
    "restaurant-ordering-system",
    "aws-control-center",
    "workly",
    "verticomply",
  ];

  for (const slug of slugs) {
    await cdp.send("Page.navigate", { url: `http://localhost:4173/projects/${slug}` });
    await new Promise((r) => setTimeout(r, 700));

    const check = await cdp.eval(`
      (() => {
        const notFound = document.querySelector('.case-study-not-found');
        const title = document.querySelector('.case-study-title')?.textContent.trim();
        const main = document.querySelector('main#main-content');
        const footer = document.querySelector('footer');
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasHorizontalOverflow = docWidth > winWidth + 1;

        return {
          resolved: !notFound,
          title,
          hasMainId: !!main,
          hasFooter: !!footer,
          hasHorizontalOverflow
        };
      })()
    `);
    testReport.caseStudyRoutes[slug] = check;
    console.log(`- /projects/${slug} -> Resolved: ${check.resolved} | Overflow: ${check.hasHorizontalOverflow ? "FAIL" : "PASSED"} | Title: "${check.title?.slice(0, 35)}..."`);
  }

  // 7. Test Live Projects Page (/live-projects)
  console.log("\n7. Testing Live Projects Page (/live-projects)...");
  await cdp.send("Page.navigate", { url: "http://localhost:4173/live-projects" });
  await new Promise((r) => setTimeout(r, 700));

  const livePageCheck = await cdp.eval(`
    (() => {
      const title = document.querySelector('.live-page-title')?.textContent.trim();
      const main = document.querySelector('main#main-content');
      const footer = document.querySelector('footer');
      const cards = document.querySelectorAll('.live-detail-card');
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const hasHorizontalOverflow = docWidth > winWidth + 1;
      const metricText = document.querySelector('.live-metric-number')?.textContent.trim();
      const inquirySection = document.getElementById('client-inquiry');
      const serviceCards = document.querySelectorAll('.service-highlight-card');
      const discussBtn = document.querySelector('.inquiry-primary-btn');
      const domainLinks = Array.from(document.querySelectorAll('.detail-domain-link')).map(a => a.textContent.trim());

      return {
        title,
        hasMainId: !!main,
        hasFooter: !!footer,
        cardsCount: cards.length,
        hasHorizontalOverflow,
        metricText,
        hasInquirySection: !!inquirySection,
        serviceCardsCount: serviceCards.length,
        hasDiscussBtn: !!discussBtn,
        domains: domainLinks
      };
    })()
  `);
  testReport.liveProjectsPage = livePageCheck;
  console.log(`- /live-projects -> Title: "${livePageCheck.title}" | Cards: ${livePageCheck.cardsCount} | Metric: ${livePageCheck.metricText} | Overflow: ${livePageCheck.hasHorizontalOverflow ? "FAIL" : "PASSED"}`);
  console.log(`- Client Inquiry Section: ${livePageCheck.hasInquirySection ? "PASSED" : "FAIL"} | Services: ${livePageCheck.serviceCardsCount} | Primary CTA: ${livePageCheck.hasDiscussBtn ? "PASSED" : "FAIL"}`);
  console.log(`- Prominent Domains: ${livePageCheck.domains.join(", ")}`);

  // Test responsive overflow on /live-projects at 320px, 390px, 768px
  for (const vpWidth of [320, 390, 768]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vpWidth,
      height: 800,
      deviceScaleFactor: 1,
      mobile: vpWidth < 900,
    });
    await new Promise((r) => setTimeout(r, 400));
    const vpOverflow = await cdp.eval(`
      (() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        return { docWidth, winWidth, hasOverflow: docWidth > winWidth + 1 };
      })()
    `);
    console.log(`- /live-projects at ${vpWidth}px -> Win: ${vpOverflow.winWidth}px | Doc: ${vpOverflow.docWidth}px | Overflow: ${vpOverflow.hasOverflow ? "FAIL" : "PASSED"}`);
  }

  // Restore Desktop Viewport
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 8. Mobile Navigation & Hamburger Interaction
  console.log("\n8. Testing Mobile Navigation & Drawer...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:4173/" });
  await new Promise((r) => setTimeout(r, 1000));

  const navInteraction = await cdp.eval(`
    (async () => {
      const toggle = document.querySelector('.mobile-toggle-btn');
      const drawer = document.querySelector('.mobile-drawer');
      const initialOpen = drawer.classList.contains('open');

      // Click to open
      toggle.click();
      await new Promise(r => setTimeout(r, 400));
      const openedAfterClick = drawer.classList.contains('open');
      const bodyOverflowHidden = document.body.style.overflow === 'hidden';

      return {
        initialOpen,
        openedAfterClick,
        bodyOverflowHidden
      };
    })()
  `);

  // Test Escape key closes the menu
  await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 27, key: "Escape", code: "Escape" });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 27, key: "Escape", code: "Escape" });
  await new Promise((r) => setTimeout(r, 400));

  const afterEscape = await cdp.eval(`
    (() => {
      const drawer = document.querySelector('.mobile-drawer');
      return {
        closedAfterEscape: !drawer.classList.contains('open'),
        bodyOverflowRestored: document.body.style.overflow === ''
      };
    })()
  `);

  // Open again and click nav link
  const afterNavClick = await cdp.eval(`
    (async () => {
      const toggle = document.querySelector('.mobile-toggle-btn');
      const drawer = document.querySelector('.mobile-drawer');
      toggle.click();
      await new Promise(r => setTimeout(r, 400));

      const firstLink = document.querySelector('.drawer-link');
      if (firstLink) firstLink.click();
      await new Promise(r => setTimeout(r, 400));
      return {
        closedAfterNav: !drawer.classList.contains('open')
      };
    })()
  `);

  testReport.functional.mobileNav = {
    ...navInteraction,
    ...afterEscape,
    ...afterNavClick,
  };
  console.log(`- Mobile Menu Opens on click: ${navInteraction.openedAfterClick ? "PASSED" : "FAIL"}`);
  console.log(`- Body scroll locked when open: ${navInteraction.bodyOverflowHidden ? "PASSED" : "FAIL"}`);
  console.log(`- Mobile Menu Closes on Escape key: ${afterEscape.closedAfterEscape ? "PASSED" : "FAIL"}`);
  console.log(`- Body scroll restored after Escape: ${afterEscape.bodyOverflowRestored ? "PASSED" : "FAIL"}`);
  console.log(`- Mobile Menu Closes on nav click: ${afterNavClick.closedAfterNav ? "PASSED" : "FAIL"}`);

  // 9. Accessibility, Heading Count, Alt Text, and Krishna Exclusion
  console.log("\n9. General Accessibility & Security Checks...");
  const generalChecks = await cdp.eval(`
    (() => {
      const h1Count = document.querySelectorAll('h1').length;
      const images = Array.from(document.querySelectorAll('img'));
      const brokenImages = images.filter(i => i.complete && i.naturalWidth === 0);
      const missingAlt = images.filter(i => !i.alt || i.alt.trim().length === 0);
      const krishnaFound = /krishna|birthday surprise/i.test(document.body.innerText);

      return {
        h1Count,
        imagesTotal: images.length,
        brokenImagesCount: brokenImages.length,
        missingAltCount: missingAlt.length,
        krishnaFound
      };
    })()
  `);
  testReport.accessibility = generalChecks;
  testReport.consoleErrors = cdp.consoleErrors;

  console.log(`- Exactly one H1 per page: ${generalChecks.h1Count === 1 ? "PASSED (1 H1)" : "FAIL (" + generalChecks.h1Count + ")"}`);
  console.log(`- Images verified: ${generalChecks.imagesTotal} | Broken: ${generalChecks.brokenImagesCount} | Missing Alt: ${generalChecks.missingAltCount}`);
  console.log(`- Krishna Birthday excluded from DOM: ${!generalChecks.krishnaFound ? "PASSED (Excluded)" : "FAIL (Found)"}`);
  console.log(`- Console errors captured: ${cdp.consoleErrors.length}`);

  // Write QA report to external artifact directory
  fs.writeFileSync(path.join(reportDir, "qa-report.json"), JSON.stringify(testReport, null, 2));
  console.log(`\nSuccessfully wrote QA report to ${path.join(reportDir, "qa-report.json")}`);

  cdp.close();
  chromeProcess.kill();
  console.log("Headless Chrome closed cleanly.");
}

runQA().catch((err) => {
  console.error("QA execution error:", err);
  process.exit(1);
});
