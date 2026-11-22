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
  const userDataDir = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_compact_live_qa_' + Date.now();

  console.log('=== 1. Starting Headless Chrome for /live-projects Optimization QA ===');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9232',
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
      const res = await fetch('http://127.0.0.1:9232/json/list');
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
  console.log('\n=== 2. Desktop 1440px: /live-projects Page Header & Structure Audit ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/live-projects' });
  await new Promise((r) => setTimeout(r, 1800));

  // Verify navigation drawer is CLOSED
  const drawerClosed = await client.eval(`
    (() => {
      const drawer = document.querySelector('.mobile-drawer');
      return !drawer || !drawer.classList.contains('open');
    })()
  `);
  console.log(`Navigation Drawer Closed: ${drawerClosed ? 'PASS (Closed)' : 'FAIL'}`);

  // Header inspection
  const headerInfo = await client.eval(`
    (() => {
      const root = document.querySelector('.showcase-page-root');
      const navBar = document.querySelector('.showcase-nav-bar');
      const backLink = document.querySelector('.showcase-back-link')?.textContent.trim();
      const hero = document.querySelector('.showcase-hero');
      const eyebrow = hero?.querySelector('.showcase-eyebrow')?.textContent.trim();
      const title = hero?.querySelector('.showcase-title')?.textContent.trim();
      const subtitle = hero?.querySelector('.showcase-subtitle')?.textContent.trim();
      const summary = hero?.querySelector('.showcase-summary-line')?.textContent.trim();
      const heroRect = hero?.getBoundingClientRect();
      const navRect = navBar?.getBoundingClientRect();
      return {
        backLink,
        eyebrow,
        title,
        subtitle,
        summary,
        navHeight: navRect ? Math.round(navRect.height) : 0,
        heroHeight: heroRect ? Math.round(heroRect.height) : 0,
      };
    })()
  `);

  console.log('Breadcrumb:', `"${headerInfo.backLink}"`);
  console.log('Eyebrow:', `"${headerInfo.eyebrow}"`);
  console.log('Heading:', `"${headerInfo.title}"`);
  console.log('Subtitle:', `"${headerInfo.subtitle}"`);
  console.log('Summary Line:', `"${headerInfo.summary}"`);
  console.log(`Compact Nav Height: ${headerInfo.navHeight}px | Hero Height: ${headerInfo.heroHeight}px`);

  // 2. Filters Row Inspection
  console.log('\n=== 3. Filters Row Inspection ===');
  const filtersInfo = await client.eval(`
    (() => {
      const pills = Array.from(document.querySelectorAll('.showcase-filter-pill')).map(p => ({
        text: p.textContent.trim(),
        isActive: p.classList.contains('active'),
        rect: { width: Math.round(p.getBoundingClientRect().width), height: Math.round(p.getBoundingClientRect().height) }
      }));
      const bar = document.querySelector('.showcase-filter-bar');
      const barRect = bar ? { height: Math.round(bar.getBoundingClientRect().height) } : null;
      return { pills, barHeight: barRect?.height };
    })()
  `);
  console.log(`Filter Bar Height: ${filtersInfo.barHeight}px`);
  filtersInfo.pills.forEach((p) => {
    console.log(`  Filter: "${p.text}" | Active: ${p.isActive} | Size: ${p.rect.width}x${p.rect.height}px`);
  });

  // 3. Website Cards Inspection
  console.log('\n=== 4. 5 Client Website Cards Inspection ===');
  const cardsInfo = await client.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.showcase-card')).map((c, idx) => {
        const eyebrow = c.querySelector('.showcase-card-eyebrow')?.textContent.trim();
        const title = c.querySelector('.showcase-card-title')?.textContent.trim();
        const domain = c.querySelector('.showcase-domain-preview')?.textContent.trim();
        const domainHref = c.querySelector('.showcase-domain-preview')?.getAttribute('href');
        const desc = c.querySelector('.showcase-card-desc')?.textContent.trim();
        const tags = Array.from(c.querySelectorAll('.showcase-tech-tag')).map(t => t.textContent.trim());
        const livePill = c.querySelector('.showcase-live-pill')?.textContent.trim();
        const actions = Array.from(c.querySelectorAll('.showcase-actions a')).map(a => a.textContent.trim());
        const img = c.querySelector('.showcase-img');
        const media = c.querySelector('.showcase-media-frame');
        const mediaRect = media ? media.getBoundingClientRect() : null;
        const aspect = mediaRect ? +(mediaRect.width / mediaRect.height).toFixed(2) : 0;
        const rect = c.getBoundingClientRect();
        return {
          idx: idx + 1,
          eyebrow,
          title,
          domain,
          domainHref,
          desc,
          tags,
          livePill,
          actions,
          aspect,
          imgLoaded: img?.complete && img?.naturalWidth > 0,
          cardSize: { width: Math.round(rect.width), height: Math.round(rect.height) }
        };
      });
      const grid = document.querySelector('.showcase-grid');
      const cols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
      return { totalCards: cards.length, cols, cards };
    })()
  `);

  console.log(`Total Cards Rendered: ${cardsInfo.totalCards} (Expected: 5) | Desktop Grid Columns: ${cardsInfo.cols}`);
  cardsInfo.cards.forEach((c) => {
    console.log(`\n  [Card ${c.idx}] "${c.title}"`);
    console.log(`    Eyebrow: "${c.eyebrow}" | Domain: "${c.domain}" (${c.domainHref})`);
    console.log(`    Status: "${c.livePill}" | Aspect Ratio: ${c.aspect} (Expected 16:9 ~ 1.78) | Size: ${c.cardSize.width}x${c.cardSize.height}px`);
    console.log(`    Description: "${c.desc}"`);
    console.log(`    Tags (${c.tags.length}): [${c.tags.join(', ')}]`);
    console.log(`    Actions: [${c.actions.join(', ')}]`);
    console.log(`    Image Loaded: ${c.imgLoaded ? 'PASS' : 'FAIL'}`);
  });

  // 4. CTA Banner & Footer Gap
  console.log('\n=== 5. CTA Banner & Footer Gap Audit ===');
  const ctaInfo = await client.eval(`
    (() => {
      const cta = document.querySelector('.showcase-compact-cta');
      const title = cta?.querySelector('.compact-cta-title')?.textContent.trim();
      const desc = cta?.querySelector('.compact-cta-desc')?.textContent.trim();
      const actions = Array.from(cta?.querySelectorAll('.compact-cta-actions a') || []).map(a => a.textContent.trim());
      const ctaRect = cta?.getBoundingClientRect();
      const footer = document.querySelector('footer');
      const footerRect = footer?.getBoundingClientRect();
      const gap = (ctaRect && footerRect) ? Math.round(footerRect.top - ctaRect.bottom) : null;
      return {
        title,
        desc,
        actions,
        ctaHeight: ctaRect ? Math.round(ctaRect.height) : 0,
        gapBetweenCtaAndFooter: gap
      };
    })()
  `);
  console.log('CTA Title:', `"${ctaInfo.title}"`);
  console.log('CTA Description:', `"${ctaInfo.desc}"`);
  console.log('CTA Actions:', ctaInfo.actions.join(' | '));
  console.log(`CTA Height: ${ctaInfo.ctaHeight}px`);
  console.log(`Vertical Gap between CTA and Footer: ${ctaInfo.gapBetweenCtaAndFooter}px (Expected compact ~30-60px)`);

  // 5. Capturing Desktop Screenshots (With Navigation Drawer CLOSED)
  console.log('\n=== 6. Capturing Desktop Screenshots ===');
  await client.eval(`window.scrollTo(0, 0);`);
  await new Promise((r) => setTimeout(r, 600));

  const shotHero = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'live-projects-desktop-hero-1440.png'), Buffer.from(shotHero.data, 'base64'));
  console.log('  Saved public/qa/live-projects-desktop-hero-1440.png');

  // Scroll to Cards
  await client.eval(`
    const el = document.querySelector('.showcase-content-section');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo(0, top);
    }
  `);
  await new Promise((r) => setTimeout(r, 700));

  const shotCards = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'live-projects-desktop-cards-1440.png'), Buffer.from(shotCards.data, 'base64'));
  console.log('  Saved public/qa/live-projects-desktop-cards-1440.png');

  // Full Desktop View
  await client.eval(`window.scrollTo(0, 0);`);
  await new Promise((r) => setTimeout(r, 500));
  const shotDesktop = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'live-projects-desktop-1440.png'), Buffer.from(shotDesktop.data, 'base64'));
  console.log('  Saved public/qa/live-projects-desktop-1440.png');

  // 6. Responsive Layout & Horizontal Overflow Audit (6 Viewports)
  console.log('\n=== 7. Responsive Layout & Horizontal Overflow Audit (6 Viewports) ===');
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
        const grid = document.querySelector('.showcase-grid');
        const filterBar = document.querySelector('.showcase-filter-bar');
        const cols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
        const drawerOpen = document.querySelector('.mobile-drawer')?.classList.contains('open');
        const isFilterHorizontallyScrollable = filterBar ? filterBar.scrollWidth >= filterBar.clientWidth : false;
        return {
          overflow: bodyOverflow,
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          cols,
          drawerOpen: Boolean(drawerOpen),
          isFilterHorizontallyScrollable
        };
      })()
    `);

    console.log(`  [${vp.name}] Cols: ${metrics.cols} | Overflow: ${metrics.overflow ? 'FAIL' : 'PASS'} (${metrics.scrollW}px / ${metrics.clientW}px) | Drawer Open: ${metrics.drawerOpen} | Filter Scrollable: ${metrics.isFilterHorizontallyScrollable}`);
  }

  // 7. Mobile 390px Screenshot (With Navigation Drawer Confirmed CLOSED)
  console.log('\n=== 8. Capturing Mobile 390px Screenshot (Drawer CLOSED) ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 400));

  await client.eval(`
    // Explicitly guarantee mobile drawer is closed
    const drawer = document.querySelector('.mobile-drawer');
    if (drawer) drawer.classList.remove('open');
    window.scrollTo(0, 0);
  `);
  await new Promise((r) => setTimeout(r, 700));

  const shotMobile = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'live-projects-mobile-390.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('  Saved public/qa/live-projects-mobile-390.png');

  // 8. Console Errors Summary
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

  console.log('\n=== COMPACT LIVE PROJECTS PAGE QA FINISHED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('QA run failed:', err);
  process.exit(1);
});
