import http from 'http';
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
  const userDataDir = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_showcase_qa_' + Date.now();

  console.log('=== 1. Starting Headless Chrome for Curated Showcase QA ===');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
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
      const res = await fetch('http://127.0.0.1:9229/json/list');
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

  // 1. Desktop 1440px
  console.log('\n=== 2. Desktop 1440px: Featured Showcase & Projects Catalogue Audit ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll to featured section first so lazy images load
  await client.eval(`
    const sec = document.getElementById('featured-projects');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Inspect Featured Projects Section
  const featuredAudit = await client.eval(`
    (() => {
      const sec = document.getElementById('featured-projects');
      if (!sec) return { error: 'Section #featured-projects not found' };
      const label = sec.querySelector('.section-label')?.textContent.trim();
      const title = sec.querySelector('.section-title')?.textContent.trim();
      const desc = sec.querySelector('.section-description')?.textContent.trim();
      const cards = Array.from(sec.querySelectorAll('.featured-showcase-card')).map(c => {
        const badge = c.querySelector('.featured-showcase-badge')?.textContent.trim();
        const cardTitle = c.querySelector('.featured-showcase-title')?.textContent.trim();
        const sentence = c.querySelector('.featured-showcase-sentence')?.textContent.trim();
        const cta = c.querySelector('.featured-explore-btn')?.textContent.trim();
        const ctaHref = c.querySelector('.featured-explore-btn')?.getAttribute('href');
        const img = c.querySelector('.featured-showcase-img');
        const hasTechPills = Boolean(c.querySelector('.stack-pill, .featured-stack-pills'));
        const hasBullets = Boolean(c.querySelector('ul, ol, .project-highlights'));
        return {
          badge,
          cardTitle,
          sentence,
          cta,
          ctaHref,
          imgLoaded: img?.complete && img?.naturalWidth > 0,
          imgSrc: img?.getAttribute('src'),
          hasTechPills,
          hasBullets
        };
      });
      const bottomCta = sec.querySelector('.featured-all-projects-link');
      return {
        label,
        title,
        desc,
        cardCount: cards.length,
        cards,
        bottomCtaText: bottomCta?.textContent.trim(),
        bottomCtaHref: bottomCta?.getAttribute('href')
      };
    })()
  `);

  console.log('Featured Section Label:', featuredAudit.label);
  console.log('Featured Section Title:', featuredAudit.title);
  console.log('Featured Section Description:', featuredAudit.desc);
  console.log(`Featured Card Count: ${featuredAudit.cardCount} (Expected: 3)`);
  featuredAudit.cards.forEach((c, idx) => {
    console.log(`  [Card ${idx + 1}] "${c.cardTitle}" | Badge: ${c.badge} | Image Loaded: ${c.imgLoaded} | Tech Pills: ${c.hasTechPills} | Bullets: ${c.hasBullets}`);
    console.log(`    Sentence: "${c.sentence}"`);
    console.log(`    CTA: "${c.cta}" -> ${c.ctaHref}`);
  });
  console.log('Bottom CTA:', `"${featuredAudit.bottomCtaText}" -> ${featuredAudit.bottomCtaHref}`);

  // Capture Desktop Featured Showcase Screenshot
  await client.eval(`
    const sec = document.getElementById('featured-projects');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 600));

  const shotFeaturedDesktop = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'featured-showcase-desktop-1440.png'), Buffer.from(shotFeaturedDesktop.data, 'base64'));
  console.log('  Saved public/qa/featured-showcase-desktop-1440.png');

  // Test Explore All Projects CTA Navigation
  console.log('\n=== 3. Testing "Explore All Projects" CTA Navigation ===');
  await client.eval(`
    const btn = document.querySelector('.featured-all-projects-link');
    if (btn) btn.click();
  `);
  await new Promise((r) => setTimeout(r, 1400));

  const projectsAudit = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      if (!sec) return { error: 'Section #projects not found' };
      const label = sec.querySelector('.section-label')?.textContent.trim();
      const title = sec.querySelector('.section-title')?.textContent.trim();
      const cards = sec.querySelectorAll('.project-card');
      const tabs = Array.from(sec.querySelectorAll('.filter-btn')).map(b => b.textContent.trim());
      const rect = sec.getBoundingClientRect();
      const isVisibleInViewport = rect.top >= -50 && rect.top <= 200;
      return {
        label,
        title,
        cardCount: cards.length,
        tabs,
        topOffset: rect.top,
        isVisibleInViewport
      };
    })()
  `);
  console.log('Projects Catalogue Label:', projectsAudit.label);
  console.log('Projects Catalogue Title:', projectsAudit.title);
  console.log(`Projects Total Card Count: ${projectsAudit.cardCount} (Expected: 9)`);
  console.log('Filter Tabs:', projectsAudit.tabs.join(' | '));
  console.log(`Scrolled to #projects successfully: ${projectsAudit.isVisibleInViewport ? 'PASS' : 'FAIL'} (top offset: ${projectsAudit.topOffset}px)`);

  // Capture Desktop Projects Catalogue Screenshot
  await client.eval(`
    const sec = document.getElementById('projects');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 600));

  const shotProjectsDesktop = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'projects-catalogue-desktop-1440.png'), Buffer.from(shotProjectsDesktop.data, 'base64'));
  console.log('  Saved public/qa/projects-catalogue-desktop-1440.png');

  // Responsive Checks Across 6 Viewports
  console.log('\n=== 4. Responsive Layout & Horizontal Overflow Audit (6 Viewports) ===');
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
        const featSec = document.getElementById('featured-projects');
        const projSec = document.getElementById('projects');
        const featGrid = featSec?.querySelector('.featured-showcase-grid');
        const projGrid = projSec?.querySelector('.projects-grid');
        return {
          overflow: bodyOverflow,
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          featCols: featGrid ? window.getComputedStyle(featGrid).gridTemplateColumns.split(' ').length : 0,
          projCols: projGrid ? window.getComputedStyle(projGrid).gridTemplateColumns.split(' ').length : 0,
        };
      })()
    `);

    console.log(`  [${vp.name}] Feat Cols: ${metrics.featCols} | Proj Cols: ${metrics.projCols} | Overflow: ${metrics.overflow ? 'FAIL' : 'PASS'} (${metrics.scrollW}px / ${metrics.clientW}px)`);
  }

  // 5. Mobile 390px Screenshots
  console.log('\n=== 5. Capturing Mobile 390px Screenshots ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));

  // Featured Mobile
  const featScroll = await client.eval(`
    (() => {
      const sec = document.getElementById('featured-projects');
      if (sec) {
        const top = sec.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo(0, top);
      }
      return { scrollY: window.scrollY, top: sec ? sec.getBoundingClientRect().top : -1 };
    })()
  `);
  console.log('  Featured mobile scroll:', featScroll);
  await new Promise((r) => setTimeout(r, 800));
  const shotFeatMobile = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'featured-showcase-mobile-390.png'), Buffer.from(shotFeatMobile.data, 'base64'));
  console.log('  Saved public/qa/featured-showcase-mobile-390.png');

  // Projects Mobile
  const projScroll = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      if (sec) {
        const top = sec.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo(0, top);
      }
      return { scrollY: window.scrollY, top: sec ? sec.getBoundingClientRect().top : -1 };
    })()
  `);
  console.log('  Projects mobile scroll:', projScroll);
  await new Promise((r) => setTimeout(r, 800));
  const shotProjMobile = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'projects-catalogue-mobile-390.png'), Buffer.from(shotProjMobile.data, 'base64'));
  console.log('  Saved public/qa/projects-catalogue-mobile-390.png');

  // 6. Case Study Route Verification for 3 Featured Projects
  console.log('\n=== 6. Case Study Route Verification for Featured Projects ===');
  const routesToTest = ['/projects/leavesmanagement', '/projects/tour-travel-booking', '/projects/workly'];
  for (const route of routesToTest) {
    await client.send('Page.navigate', { url: `http://127.0.0.1:5173${route}` });
    await new Promise((r) => setTimeout(r, 1200));

    const pageInfo = await client.eval(`
      (() => {
        const title = document.querySelector('h1')?.textContent.trim();
        const is404 = document.body.textContent.includes('Page Not Found');
        return { title, is404 };
      })()
    `);
    console.log(`  Route ${route} -> Title: "${pageInfo.title}" | 404: ${pageInfo.is404 ? 'FAIL' : 'PASS'}`);
  }

  // 7. Console Errors Summary
  console.log('\n=== 7. Console Errors & Warnings ===');
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

  console.log('\n=== QA RUN FINISHED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('QA run failed:', err);
  process.exit(1);
});
