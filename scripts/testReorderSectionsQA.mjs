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
  const userDataDir = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_reorder_qa_' + Date.now();

  console.log('=== 1. Starting Headless Chrome for Reordered Homepage QA ===');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9231',
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
      const res = await fetch('http://127.0.0.1:9231/json/list');
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
  console.log('\n=== 2. Desktop 1440px: Homepage Section Order Verification ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await new Promise((r) => setTimeout(r, 1800));

  // Inspect Homepage Main Sections Order
  const sectionAudit = await client.eval(`
    (() => {
      const mainSections = Array.from(document.querySelectorAll('main > section')).map(s => s.id);
      const footerPresent = Boolean(document.querySelector('footer'));
      return {
        mainSections,
        footerPresent,
        totalSections: mainSections.length
      };
    })()
  `);

  console.log('Main Sections Order:', sectionAudit.mainSections.join(' -> '));
  console.log('Footer Present:', sectionAudit.footerPresent);

  const expectedOrder = ['hero', 'about', 'skills', 'experience', 'live-projects', 'projects', 'contact'];
  const matchesExactOrder = sectionAudit.mainSections.length === expectedOrder.length &&
    sectionAudit.mainSections.every((id, idx) => id === expectedOrder[idx]);

  console.log(`Homepage Sections Match Exact Required Order: ${matchesExactOrder ? 'PASS (100% Match)' : 'FAIL'}`);
  console.log('  1. Hero ->', sectionAudit.mainSections[0]);
  console.log('  2. About / Introduction ->', sectionAudit.mainSections[1]);
  console.log('  3. Skills ->', sectionAudit.mainSections[2]);
  console.log('  4. Experience ->', sectionAudit.mainSections[3]);
  console.log('  5. Client Websites & Live Deployments ->', sectionAudit.mainSections[4]);
  console.log('  6. Projects & Case Studies ->', sectionAudit.mainSections[5]);
  console.log('  7. Contact ->', sectionAudit.mainSections[6]);
  console.log('  8. Footer ->', sectionAudit.footerPresent ? 'footer present' : 'missing');

  // 2. Navbar Link Order & Scroll Test
  console.log('\n=== 3. Navbar Order & Anchor Scrolling Test ===');
  const navLinks = await client.eval(`
    Array.from(document.querySelectorAll('.nav-desktop .nav-menu > li > a')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }))
  `);
  console.log('Navbar Primary Links in Order:');
  navLinks.forEach((l, idx) => console.log(`  ${idx + 1}. "${l.text}" (${l.href})`));

  // Test Clicking "Client Websites" anchor (#live-projects)
  console.log('\nTesting Click "Client Websites" -> #live-projects:');
  await client.eval(`
    const link = Array.from(document.querySelectorAll('.nav-desktop a')).find(a => a.textContent.includes('Client Websites'));
    if (link) link.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  const liveScroll = await client.eval(`
    (() => {
      const sec = document.getElementById('live-projects');
      if (!sec) return { error: 'not found' };
      const rect = sec.getBoundingClientRect();
      return { top: rect.top, inView: rect.top >= -50 && rect.top <= 200 };
    })()
  `);
  console.log(`  Scrolled to #live-projects: ${liveScroll.inView ? 'PASS' : 'FAIL'} (top offset: ${liveScroll.top}px)`);

  // Test Clicking "Projects" anchor (#projects)
  console.log('\nTesting Click "Projects" -> #projects:');
  const clickResult = await client.eval(`
    (() => {
      const links = Array.from(document.querySelectorAll('.nav-desktop a'));
      const link = links.find(a => a.textContent.trim() === 'Projects');
      if (!link) return { found: false, links: links.map(a => a.textContent) };
      link.click();
      return { found: true, text: link.textContent, href: link.getAttribute('href') };
    })()
  `);
  console.log('  Projects click result:', clickResult);
  await new Promise((r) => setTimeout(r, 1500));

  const projScroll = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      if (!sec) return { error: 'not found' };
      const rect = sec.getBoundingClientRect();
      return { top: rect.top, inView: rect.top >= -50 && rect.top <= 200, scrollY: window.scrollY };
    })()
  `);
  console.log(`  Scrolled to #projects: ${projScroll.inView ? 'PASS' : 'FAIL'} (top offset: ${projScroll.top}px, scrollY: ${projScroll.scrollY})`);

  // 3. Inspect Client Websites Section & Transition to Projects
  console.log('\n=== 4. Section Transition & Cards Audit ===');
  const liveSecInfo = await client.eval(`
    (() => {
      const sec = document.getElementById('live-projects');
      const title = sec.querySelector('.section-title')?.textContent.trim();
      const label = sec.querySelector('.section-label')?.textContent.trim();
      const cards = sec.querySelectorAll('.live-card').length;
      return { title, label, cardCount: cards };
    })()
  `);
  console.log(`Live Projects Section: "${liveSecInfo.title}" | Label: "${liveSecInfo.label}" | Cards: ${liveSecInfo.cardCount}`);

  const projSecInfo = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      const title = sec.querySelector('.section-title')?.textContent.trim();
      const label = sec.querySelector('.section-label')?.textContent.trim();
      const cards = sec.querySelectorAll('.project-card').length;
      return { title, label, cardCount: cards };
    })()
  `);
  console.log(`Projects Section: "${projSecInfo.title}" | Label: "${projSecInfo.label}" | Cards: ${projSecInfo.cardCount} (Expected: 9)`);

  // 4. Capture Screenshots
  console.log('\n=== 5. Capturing Screenshots ===');
  // Capture Transition Area (Live Projects & Projects)
  await client.eval(`
    const sec = document.getElementById('live-projects');
    if (sec) {
      const top = sec.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo(0, top);
    }
  `);
  await new Promise((r) => setTimeout(r, 700));
  const shotTransition = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'client-websites-before-projects-1440.png'), Buffer.from(shotTransition.data, 'base64'));
  console.log('  Saved public/qa/client-websites-before-projects-1440.png');

  // Capture Full Desktop View
  await client.eval(`window.scrollTo(0, 0);`);
  await new Promise((r) => setTimeout(r, 600));
  const shotDesktop = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'reordered-homepage-desktop-1440.png'), Buffer.from(shotDesktop.data, 'base64'));
  console.log('  Saved public/qa/reordered-homepage-desktop-1440.png');

  // 5. Responsive Checks Across 6 Viewports
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
        const liveSec = document.getElementById('live-projects');
        const projSec = document.getElementById('projects');
        const liveGrid = liveSec?.querySelector('.live-projects-grid');
        const projGrid = projSec?.querySelector('.projects-grid');
        return {
          overflow: bodyOverflow,
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          liveCols: liveGrid ? window.getComputedStyle(liveGrid).gridTemplateColumns.split(' ').length : 0,
          projCols: projGrid ? window.getComputedStyle(projGrid).gridTemplateColumns.split(' ').length : 0,
        };
      })()
    `);

    console.log(`  [${vp.name}] Live Cols: ${metrics.liveCols} | Proj Cols: ${metrics.projCols} | Overflow: ${metrics.overflow ? 'FAIL' : 'PASS'} (${metrics.scrollW}px / ${metrics.clientW}px)`);
  }

  // Mobile 390px Screenshot
  console.log('\n=== 7. Capturing Mobile 390px Screenshot ===');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 400));

  await client.eval(`
    const sec = document.getElementById('live-projects');
    if (sec) {
      const top = sec.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo(0, top);
    }
  `);
  await new Promise((r) => setTimeout(r, 800));

  const shotMobile = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(targetDir, 'reordered-homepage-mobile-390.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('  Saved public/qa/reordered-homepage-mobile-390.png');

  // 6. Case Study Route & Live Projects Route Verification
  console.log('\n=== 8. Route Verification ===');
  const routesToTest = [
    '/live-projects',
    '/projects/leavesmanagement',
    '/projects/tour-travel-booking',
    '/projects/workly',
  ];

  for (const route of routesToTest) {
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

  // 7. Console Errors Summary
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

  console.log('\n=== REORDER SECTIONS QA COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('QA run failed:', err);
  process.exit(1);
});
