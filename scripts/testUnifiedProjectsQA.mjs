import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
    this.ws = null;
  }

  async connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = res;
      this.ws.onerror = rej;
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
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

async function run() {
  const targetDir = path.resolve('public/qa');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_unified_qa_' + Date.now();

  console.log('=== 1. Starting Headless Chrome for Unified Projects Section QA ===');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank',
  ]);

  let cdpUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch('http://127.0.0.1:9230/json/list');
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    console.error('Failed to connect to Chrome CDP.');
    chromeProcess.kill();
    process.exit(1);
  }

  const client = new SimpleCDP(cdpUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  const consoleErrors = [];
  client.ws.addEventListener('message', (event) => {
    const d = JSON.parse(event.data);
    if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) {
      consoleErrors.push(d.params.args?.map((a) => a.value || a.description).join(' '));
    }
  });

  // 1. Desktop 1440px Audit
  console.log('\n=== 2. Desktop 1440px: Homepage Architecture & Single Projects Section Audit ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await new Promise((r) => setTimeout(r, 1800));

  // Verify Duplicate Section Elimination
  const sectionCheck = await client.eval(`
    (() => {
      const featuredSec = document.getElementById('featured-projects');
      const projectsSec = document.getElementById('projects');
      const liveProjectsSec = document.getElementById('live-projects');
      const mainSections = Array.from(document.querySelectorAll('main > section')).map(s => s.id);
      return {
        hasFeaturedProjects: Boolean(featuredSec),
        hasProjects: Boolean(projectsSec),
        hasLiveProjects: Boolean(liveProjectsSec),
        mainSections
      };
    })()
  `);
  console.log('Homepage Sections in Order:', sectionCheck.mainSections.join(' -> '));
  console.log(`Featured Systems & Applications Removed: ${!sectionCheck.hasFeaturedProjects ? 'PASS (0 duplicate sections)' : 'FAIL'}`);
  console.log(`Single Unified Projects Section Present: ${sectionCheck.hasProjects ? 'PASS' : 'FAIL'}`);
  console.log(`Separate Live Deployments Section Present: ${sectionCheck.hasLiveProjects ? 'PASS' : 'FAIL'}`);

  // Inspect Navbar Links
  console.log('\n=== 3. Navbar Structure & Link Verification ===');
  const navCheck = await client.eval(`
    (() => {
      const primaryLinks = Array.from(document.querySelectorAll('.nav-desktop .nav-menu > li > a, .nav-desktop .nav-menu > li > .nav-link')).map(a => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href')
      }));
      const moreBtn = document.querySelector('.dropdown-toggle');
      let moreLinks = [];
      if (moreBtn) {
        moreBtn.click();
        moreLinks = Array.from(document.querySelectorAll('.dropdown-item')).map(a => ({
          text: a.textContent.trim(),
          href: a.getAttribute('href')
        }));
      }
      return { primaryLinks, moreLinks };
    })()
  `);
  console.log('Primary Navbar Links:', navCheck.primaryLinks.map(l => `${l.text} (${l.href})`).join(' | '));
  const hasProjectsInPrimary = navCheck.primaryLinks.some(l => l.text === 'Projects' && l.href === '/#projects');
  console.log(`Primary "Projects" points to /#projects: ${hasProjectsInPrimary ? 'PASS' : 'FAIL'}`);
  const duplicateInMore = navCheck.moreLinks.some(l => l.text.toLowerCase().includes('all projects'));
  console.log(`Duplicate "All Projects" removed from More dropdown: ${!duplicateInMore ? 'PASS' : 'FAIL'}`);

  // Test Navbar "Projects" link click & smooth scroll
  await client.eval(`
    const projLink = Array.from(document.querySelectorAll('.nav-link')).find(a => a.textContent.trim() === 'Projects');
    if (projLink) projLink.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  const scrollStatus = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      if (!sec) return { error: 'not found' };
      const rect = sec.getBoundingClientRect();
      return {
        top: rect.top,
        inViewport: rect.top >= -50 && rect.top <= 200
      };
    })()
  `);
  console.log(`Navbar click scrolled to #projects: ${scrollStatus.inViewport ? 'PASS' : 'FAIL'} (top offset: ${scrollStatus.top}px)`);

  const shotNavProjects = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'homepage-navbar-projects-1440.png'), Buffer.from(shotNavProjects.data, 'base64'));
  console.log('  Saved public/qa/homepage-navbar-projects-1440.png');

  // Inspect Single Unified Projects Section Header & Content
  console.log('\n=== 4. Inspecting Unified Projects Section (Heading, Copy & Filter Tabs) ===');
  const headerInfo = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      return {
        label: sec.querySelector('.section-label')?.textContent.trim(),
        title: sec.querySelector('.section-title')?.textContent.trim(),
        desc: sec.querySelector('.section-description')?.textContent.trim(),
      };
    })()
  `);
  console.log('Eyebrow Label:', `"${headerInfo.label}" (Expected: "SELECTED WORK")`);
  console.log('Heading:', `"${headerInfo.title}" (Expected: "Projects")`);
  console.log('Description:', `"${headerInfo.desc}"`);

  // Inspect Filter Tabs
  const filterTabs = await client.eval(`
    Array.from(document.querySelectorAll('#projects .filter-btn')).map(b => b.textContent.trim())
  `);
  console.log('Category Tabs:', filterTabs.join(' | '));

  // Inspect All 9 Project Cards in Detail
  console.log('\n=== 5. Audit of All 9 Project Cards (Card Structure, Plain Language, Tags & CTAs) ===');
  const cardsAudit = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      const cards = Array.from(sec.querySelectorAll('.project-card')).map((c, idx) => {
        const title = c.querySelector('.project-title')?.textContent.trim();
        const category = c.querySelector('.project-category-badge')?.textContent.trim();
        const desc = c.querySelector('.project-description')?.textContent.trim();
        const techPills = Array.from(c.querySelectorAll('.tech-pill')).map(p => p.textContent.trim());
        const cta = c.querySelector('.project-cta-link')?.textContent.trim();
        const ctaHref = c.querySelector('.project-cta-link')?.getAttribute('href');
        const img = c.querySelector('.project-card-img');
        const hasBullets = Boolean(c.querySelector('ul, ol, li'));
        const totalButtonsOrLinks = c.querySelectorAll('button, a').length;
        return {
          title,
          category,
          desc,
          techPills,
          techCount: techPills.length,
          cta,
          ctaHref,
          imgLoaded: img?.complete && img?.naturalWidth > 0,
          imgSrc: img?.getAttribute('src'),
          hasBullets,
          totalButtonsOrLinks
        };
      });
      return {
        totalCards: cards.length,
        cards
      };
    })()
  `);

  console.log(`Total Cards in Unified Section: ${cardsAudit.totalCards} (Expected: 9)`);
  cardsAudit.cards.forEach((c, idx) => {
    console.log(`  [Card ${idx + 1}] "${c.title}"`);
    console.log(`    Category: "${c.category}" | Tech: [${c.techPills.join(', ')}] (count: ${c.techCount} <= 3: ${c.techCount <= 3 ? 'PASS' : 'FAIL'})`);
    console.log(`    Description: "${c.desc}"`);
    console.log(`    CTA: "${c.cta}" -> ${c.ctaHref}`);
    console.log(`    Bullets Present: ${c.hasBullets ? 'FAIL (bullet list found)' : 'PASS (no bullets)'} | Image Loaded: ${c.imgLoaded}`);
  });

  // Capture Desktop Screenshot
  await client.eval(`
    const sec = document.getElementById('projects');
    if (sec) {
      const top = sec.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo(0, top);
    }
  `);
  await new Promise((r) => setTimeout(r, 700));

  const shotDesktop = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'unified-projects-desktop-1440.png'), Buffer.from(shotDesktop.data, 'base64'));
  console.log('  Saved public/qa/unified-projects-desktop-1440.png');

  // 6. Responsive Checks Across 6 Viewports
  console.log('\n=== 6. Responsive Layout & Horizontal Overflow Audit (6 Viewports) ===');
  const viewports = [
    { name: 'Desktop 1920px', width: 1920, height: 1080 },
    { name: 'Desktop 1440px', width: 1440, height: 900 },
    { name: 'Tablet 1024px', width: 1024, height: 768 },
    { name: 'Tablet 768px', width: 768, height: 1024 },
    { name: 'Mobile 390px', width: 390, height: 844 },
    { name: 'Mobile 320px', width: 320, height: 568 },
  ];

  for (const vp of viewports) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width <= 768,
    });
    await new Promise((r) => setTimeout(r, 400));

    const metrics = await client.eval(`
      (() => {
        const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        const projSec = document.getElementById('projects');
        const projGrid = projSec?.querySelector('.projects-grid');
        const cardCount = projSec?.querySelectorAll('.project-card').length;
        const cols = projGrid ? window.getComputedStyle(projGrid).gridTemplateColumns.split(' ').length : 0;
        return {
          overflow: bodyOverflow,
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          cols,
          cardCount
        };
      })()
    `);

    console.log(`  [${vp.name}] Cols: ${metrics.cols} | Cards: ${metrics.cardCount} | Overflow: ${metrics.overflow ? 'FAIL' : 'PASS'} (${metrics.scrollW}px / ${metrics.clientW}px)`);
  }

  // 7. Mobile 390px Screenshot
  console.log('\n=== 7. Capturing Mobile 390px Screenshot ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 400));

  await client.eval(`
    const sec = document.getElementById('projects');
    if (sec) {
      const top = sec.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo(0, top);
    }
  `);
  await new Promise((r) => setTimeout(r, 800));

  const shotMobile = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'unified-projects-mobile-390.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('  Saved public/qa/unified-projects-mobile-390.png');

  // 8. Case Study Route Verification for All 9 Projects
  console.log('\n=== 8. Case Study Route Verification for All 9 Projects ===');
  const allRoutes = [
    '/projects/leavesmanagement',
    '/projects/tour-travel-booking',
    '/projects/tshirt-customization-platform',
    '/projects/client-portfolio-platforms',
    '/projects/auth-security-systems',
    '/projects/restaurant-ordering-system',
    '/projects/aws-control-center',
    '/projects/workly',
    '/projects/verticomply'
  ];

  for (const route of allRoutes) {
    await client.send('Page.navigate', { url: `http://127.0.0.1:5173${route}` });
    await new Promise((r) => setTimeout(r, 1000));

    const pageInfo = await client.eval(`
      (() => {
        const title = document.querySelector('h1')?.textContent.trim();
        const is404 = document.body.textContent.includes('Page Not Found');
        return { title, is404 };
      })()
    `);
    console.log(`  Route ${route} -> Title: "${pageInfo.title}" | 404: ${pageInfo.is404 ? 'FAIL' : 'PASS'}`);
  }

  // 9. Console Errors Summary
  console.log('\n=== 9. Console Errors & Warnings ===');
  if (consoleErrors.length === 0) {
    console.log('  0 console errors or warnings recorded.');
  } else {
    consoleErrors.forEach((e) => console.log('  [Console]', e));
  }

  client.close();
  chromeProcess.kill();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}

  console.log('\n=== UNIFIED PROJECTS SECTION QA COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('QA run failed:', err);
  process.exit(1);
});
