import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
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
          if (
            msg.method === "Runtime.consoleAPICalled" &&
            (msg.params.type === "error" || msg.params.type === "warning")
          ) {
            this.consoleErrors.push({
              type: msg.params.type,
              text: msg.params.args
                .map((a) => a.value || a.description || JSON.stringify(a))
                .join(" "),
            });
          }
          if (msg.method === "Runtime.exceptionThrown") {
            this.consoleErrors.push({
              type: "exception",
              text:
                msg.params.exceptionDetails.text +
                " " +
                (msg.params.exceptionDetails.exception?.description || ""),
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

async function run() {
  const targetDir = path.resolve("public/qa");
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_projects_qa_" + Date.now();

  console.log("=== 1. Starting Headless Chrome for Projects & Case Studies QA ===");
  const chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9228",
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
      const res = await fetch("http://127.0.0.1:9228/json/list");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome CDP at port 9228");
  }

  const client = new CDPClient(cdpUrl);
  await client.connect();

  await client.send("Page.enable");
  await client.send("DOM.enable");
  await client.send("Runtime.enable");

  // Step 1: Desktop 1440px Viewport
  console.log("\n=== 2. Desktop 1440px Audit: Header, Cards & Plain Language ===");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/#projects" });
  await new Promise((r) => setTimeout(r, 1800));

  await client.eval(`
    const el = document.getElementById('projects');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Inspect Section Header
  const headerInfo = await client.eval(`
    (() => {
      const sec = document.getElementById('projects');
      if (!sec) return null;
      const title = sec.querySelector('.section-title')?.textContent.trim();
      const desc = sec.querySelector('.section-description')?.textContent.trim();
      return { title, desc };
    })()
  `);
  console.log(`Header Title: "${headerInfo?.title}"`);
  console.log(`Header Description: "${headerInfo?.desc}"`);

  // Inspect Filter Tabs
  console.log("\n=== 3. Testing Category Filter Tabs & Counts ===");
  const filterTabs = await client.eval(`
    Array.from(document.querySelectorAll('#projects .filter-btn')).map(b => ({
      text: b.textContent.trim(),
      isActive: b.classList.contains('active'),
    }))
  `);
  filterTabs.forEach((t) => console.log(`  Tab: ${t.text} (Active: ${t.isActive})`));

  // Test Filter Switching
  const categoriesToTest = ["Cloud & Platforms", "Web Applications", "E-Commerce", "Security", "All Projects"];
  for (const catName of categoriesToTest) {
    const cardCount = await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#projects .filter-btn')).find(b => b.textContent.includes('${catName}'));
        if (btn) btn.click();
        return document.querySelectorAll('#projects .project-card').length;
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    console.log(`  Clicked "${catName}" -> Rendered Cards: ${cardCount}`);
  }

  // Ensure "All Projects" is active again
  await client.eval(`
    const allBtn = Array.from(document.querySelectorAll('#projects .filter-btn')).find(b => b.textContent.includes('All Projects'));
    if (allBtn) allBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Inspect all 9 cards in detail
  console.log("\n=== 4. Detailed Inspection of All 9 Project Cards ===");
  const cardsData = await client.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('#projects .project-card'));
      return cards.map((c, idx) => {
        const title = c.querySelector('.project-title')?.textContent.trim();
        const catBadge = c.querySelector('.project-category-badge')?.textContent.trim();
        const desc = c.querySelector('.project-description')?.textContent.trim();
        const highlights = Array.from(c.querySelectorAll('.project-highlight-item')).map(h => h.textContent.trim());
        const tech = Array.from(c.querySelectorAll('.tech-pill')).map(t => t.textContent.trim());
        const cta = c.querySelector('.project-cta-link')?.textContent.trim();
        const href = c.querySelector('.project-cta-link')?.getAttribute('href');
        const img = c.querySelector('.project-card-img');

        let imgInfo = null;
        if (img) {
          const r = img.getBoundingClientRect();
          imgInfo = {
            src: img.src ? img.src.split('/').pop() : null,
            loaded: img.complete && img.naturalWidth > 0,
            aspect: r.height > 0 ? (r.width / r.height).toFixed(2) : null,
          };
        }

        return {
          index: idx + 1,
          title,
          catBadge,
          desc,
          highlights,
          tech,
          cta,
          href,
          imgInfo,
        };
      });
    })()
  `);

  cardsData.forEach((c) => {
    console.log(`[Card ${c.index}] ${c.title}`);
    console.log(`  Category: ${c.catBadge}`);
    console.log(`  Plain Desc: "${c.desc}"`);
    console.log(`  Highlights (${c.highlights.length}): ${c.highlights.map(h => `"${h}"`).join(', ')}`);
    console.log(`  Tech Tags (${c.tech.length}): [${c.tech.join(', ')}]`);
    console.log(`  CTA: "${c.cta}" -> ${c.href}`);
    console.log(`  Image: ${c.imgInfo?.src} (Loaded: ${c.imgInfo?.loaded}, Aspect: ${c.imgInfo?.aspect})`);
    console.log("");
  });

  // Step 5: Responsive Grid & Overflow Check (6 Viewports)
  console.log("=== 5. Responsive Grid & Overflow Check (6 Viewports) ===");
  const viewports = [
    { width: 1920, height: 1080, expectedCols: 3, label: "Desktop 1920px" },
    { width: 1440, height: 900, expectedCols: 3, label: "Desktop 1440px" },
    { width: 1024, height: 768, expectedCols: 2, label: "Tablet 1024px" },
    { width: 768, height: 1024, expectedCols: 2, label: "Tablet 768px" },
    { width: 390, height: 844, expectedCols: 1, label: "Mobile 390px" },
    { width: 320, height: 568, expectedCols: 1, label: "Mobile 320px" },
  ];

  for (const vp of viewports) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768,
    });

    await client.send("Page.navigate", { url: "http://127.0.0.1:5173/#projects" });
    await new Promise((r) => setTimeout(r, 1200));

    await client.eval(`document.getElementById('projects')?.scrollIntoView({ behavior: 'instant', block: 'start' });`);
    await new Promise((r) => setTimeout(r, 600));

    const gridInfo = await client.eval(`
      (() => {
        const sec = document.getElementById('projects');
        const cards = sec ? Array.from(sec.querySelectorAll('.project-card')) : [];
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const hasOverflow = docW > winW + 1;

        let cols = 0;
        let cardW = 0;
        let cardH = 0;
        if (cards.length > 0) {
          const firstTop = Math.round(cards[0].getBoundingClientRect().top);
          cols = cards.filter(c => Math.round(c.getBoundingClientRect().top) === firstTop).length;
          const r = cards[0].getBoundingClientRect();
          cardW = Math.round(r.width);
          cardH = Math.round(r.height);
        }

        return { docW, winW, hasOverflow, cols, cardW, cardH };
      })()
    `);

    const colPass = gridInfo.cols === vp.expectedCols;
    console.log(
      `  [${vp.label}] Expected Cols: ${vp.expectedCols} | Actual: ${gridInfo.cols} (${colPass ? 'PASS' : 'FAIL'}) | Card: ${gridInfo.cardW}x${gridInfo.cardH}px | Overflow: ${gridInfo.hasOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`
    );
  }

  // Step 6: Case Study Pages Verification
  console.log("\n=== 6. Case Study Pages Verification (Plain Language + Technical Depth) ===");
  const testSlugs = ["leavesmanagement", "tour-travel-booking"];
  for (const slug of testSlugs) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Page.navigate", { url: `http://127.0.0.1:5173/projects/${slug}` });
    await new Promise((r) => setTimeout(r, 1500));

    const csData = await client.eval(`
      (() => {
        const h1 = document.querySelector('.case-study-title')?.textContent.trim();
        const plainLead = document.querySelector('.plain-lead-text')?.textContent.trim();
        const plainArch = document.querySelector('.plain-arch-intro')?.textContent.trim();
        const hasPipeline = !!document.querySelector('.arch-pipeline-wrapper');
        const notFound = document.body.textContent.includes('Case Study Not Found');

        return { h1, plainLead, plainArch, hasPipeline, notFound };
      })()
    `);

    console.log(`Route /projects/${slug}:`);
    console.log(`  Title: "${csData.h1}"`);
    console.log(`  Plain-Language Overview: "${csData.plainLead}"`);
    console.log(`  Plain Architecture Intro: "${csData.plainArch}"`);
    console.log(`  Technical Architecture Pipeline: ${csData.hasPipeline ? 'PRESENT (PASS)' : 'MISSING (FAIL)'}`);
    console.log(`  404: ${csData.notFound ? 'FAIL' : 'PASS'}`);
    console.log("");
  }

  // Step 7: Capture Fresh Screenshots
  console.log("=== 7. Capturing Screenshots ===");
  // 1440px desktop projects section
  await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/#projects" });
  await new Promise((r) => setTimeout(r, 1500));
  await client.eval(`document.getElementById('projects')?.scrollIntoView({ behavior: 'instant', block: 'start' });`);
  await new Promise((r) => setTimeout(r, 800));
  const ss1440 = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(targetDir, "projects-desktop-1440.png"), Buffer.from(ss1440.data, "base64"));
  console.log("  Saved public/qa/projects-desktop-1440.png");

  // 768px tablet projects section
  await client.send("Emulation.setDeviceMetricsOverride", { width: 768, height: 1100, deviceScaleFactor: 1, mobile: false });
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/#projects" });
  await new Promise((r) => setTimeout(r, 1500));
  await client.eval(`document.getElementById('projects')?.scrollIntoView({ behavior: 'instant', block: 'start' });`);
  await new Promise((r) => setTimeout(r, 800));
  const ss768 = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(targetDir, "projects-tablet-768.png"), Buffer.from(ss768.data, "base64"));
  console.log("  Saved public/qa/projects-tablet-768.png");

  // 390px mobile projects section
  await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 1000, deviceScaleFactor: 2, mobile: true });
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/#projects" });
  await new Promise((r) => setTimeout(r, 1500));
  await client.eval(`document.getElementById('projects')?.scrollIntoView({ behavior: 'instant', block: 'start' });`);
  await new Promise((r) => setTimeout(r, 800));
  const ss390 = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(targetDir, "projects-mobile-390.png"), Buffer.from(ss390.data, "base64"));
  console.log("  Saved public/qa/projects-mobile-390.png");

  // Case Study Page at 1440px
  await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/projects/leavesmanagement" });
  await new Promise((r) => setTimeout(r, 1500));
  const ssCS = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(targetDir, "case-study-leavesmanagement-1440.png"), Buffer.from(ssCS.data, "base64"));
  console.log("  Saved public/qa/case-study-leavesmanagement-1440.png");

  // Console Errors
  console.log("\n=== 8. Console Errors & Warnings ===");
  if (client.consoleErrors.length === 0) {
    console.log("  0 console errors or warnings recorded.");
  } else {
    client.consoleErrors.forEach((e) => console.log(`  [${e.type}] ${e.text}`));
  }

  client.close();
  chromeProcess.kill();
  console.log("\n=== PROJECTS SECTION QA RUN FINISHED SUCCESSFULLY ===");
}

run().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
