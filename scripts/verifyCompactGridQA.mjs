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
  const targetDir = path.resolve("public/qa/featured-projects");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_compact_qa_" + Date.now();

  console.log("=== 1. Starting Chrome for Compact Featured Grid QA ===");
  const chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9225",
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
      const res = await fetch("http://127.0.0.1:9225/json/list");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome CDP at port 9225");
  }

  const client = new CDPClient(cdpUrl);
  await client.connect();

  await client.send("Page.enable");
  await client.send("DOM.enable");
  await client.send("Runtime.enable");

  const testViewports = [
    { width: 1920, height: 1080, expectedCols: 3, label: "Desktop 1920px", file: "desktop-1920.png" },
    { width: 1440, height: 900, expectedCols: 3, label: "Desktop 1440px", file: "desktop-1440.png" },
    { width: 1024, height: 768, expectedCols: 2, label: "Tablet 1024px", file: "tablet-1024.png" },
    { width: 768, height: 1024, expectedCols: 2, label: "Tablet 768px", file: "tablet-768.png" },
    { width: 390, height: 844, expectedCols: 1, label: "Mobile 390px", file: "mobile-390.png" },
    { width: 320, height: 568, expectedCols: 1, label: "Mobile 320px", file: "mobile-320.png" },
  ];

  console.log("\n=== 2. Testing Responsive Grid Across All 6 Viewports ===");

  for (const vp of testViewports) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768,
    });

    await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
    await new Promise((r) => setTimeout(r, 1500));

    // Scroll to #featured-projects
    await client.eval(`
      const el = document.getElementById('featured-projects');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    `);
    await new Promise((r) => setTimeout(r, 800));

    const metrics = await client.eval(`
      (() => {
        const sec = document.getElementById('featured-projects');
        const grid = sec ? sec.querySelector('.featured-grid') : null;
        const cards = grid ? Array.from(grid.querySelectorAll('.featured-project-card')) : [];
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const hasOverflow = docW > winW + 1;

        let colCount = 0;
        let cardW = 0;
        let cardH = 0;
        let imgW = 0;
        let imgH = 0;
        let aspect = 0;

        if (cards.length > 0) {
          const firstTop = Math.round(cards[0].getBoundingClientRect().top);
          colCount = cards.filter(c => Math.round(c.getBoundingClientRect().top) === firstTop).length;
          const r = cards[0].getBoundingClientRect();
          cardW = Math.round(r.width);
          cardH = Math.round(r.height);

          const img = cards[0].querySelector('.featured-media-img');
          if (img) {
            const ir = img.getBoundingClientRect();
            imgW = Math.round(ir.width);
            imgH = Math.round(ir.height);
            aspect = (ir.width / ir.height).toFixed(2);
          }
        }

        return {
          winW,
          docW,
          hasOverflow,
          cardsCount: cards.length,
          actualCols: colCount,
          cardW,
          cardH,
          imgW,
          imgH,
          aspect,
        };
      })()
    `);

    const colMatch = metrics.actualCols === vp.expectedCols;
    console.log(
      `[${vp.label}] Expected Cols: ${vp.expectedCols} | Actual: ${metrics.actualCols} (${colMatch ? 'PASS' : 'FAIL'}) | Card: ${metrics.cardW}x${metrics.cardH}px | Img: ${metrics.imgW}x${metrics.imgH}px (Aspect: ${metrics.aspect}) | Overflow: ${metrics.hasOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`
    );

    // Save screenshot
    const ss = await client.send("Page.captureScreenshot", { format: "png" });
    const outPath = path.join(targetDir, vp.file);
    fs.writeFileSync(outPath, Buffer.from(ss.data, "base64"));
  }

  // 3. Inspect cards content at Desktop 1440px
  console.log("\n=== 3. Card Content & Compactness Verification (1440px) ===");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await new Promise((r) => setTimeout(r, 1500));
  await client.eval(`document.getElementById('featured-projects')?.scrollIntoView({ behavior: 'instant', block: 'start' });`);
  await new Promise((r) => setTimeout(r, 800));

  const detailedCards = await client.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('#featured-projects .featured-project-card'));
      return cards.map((c, i) => {
        const title = c.querySelector('.featured-card-title')?.textContent.trim();
        const cat = c.querySelector('.featured-category-text')?.textContent.trim();
        const desc = c.querySelector('.featured-card-desc')?.textContent.trim();
        const tags = Array.from(c.querySelectorAll('.stack-pill')).map(p => p.textContent.trim());
        const hasBullets = !!c.querySelector('.featured-highlights-list');
        const link = c.querySelector('.featured-action-btn')?.getAttribute('href');
        const img = c.querySelector('.featured-media-img');

        return {
          index: i + 1,
          title,
          cat,
          descLength: desc ? desc.length : 0,
          tags,
          tagsCount: tags.length,
          hasBullets,
          link,
          imgComplete: img ? img.complete && img.naturalWidth > 0 : false,
          imgSrc: img ? img.src.split('/').pop() : null,
        };
      });
    })()
  `);

  detailedCards.forEach((c) => {
    console.log(`[Card ${c.index}] ${c.title}`);
    console.log(`  Category: ${c.cat}`);
    console.log(`  Tags (${c.tagsCount}): [${c.tags.join(', ')}] (Max 4-5: ${c.tagsCount <= 5 ? 'PASS' : 'FAIL'})`);
    console.log(`  Bullets Removed: ${!c.hasBullets ? 'PASS' : 'FAIL (Bullets still present)'}`);
    console.log(`  Image: ${c.imgSrc} (Loaded: ${c.imgComplete ? 'PASS' : 'FAIL'})`);
    console.log(`  Case Study Link: ${c.link}`);
    console.log("");
  });

  // 4. Verify Case Study Links
  console.log("=== 4. Verifying Case Study Routes ===");
  const slugs = [
    "leavesmanagement",
    "tour-travel-booking",
    "client-portfolio-platforms",
    "restaurant-ordering-system",
    "tshirt-customization-platform",
    "auth-security-systems",
  ];

  for (const slug of slugs) {
    await client.send("Page.navigate", { url: `http://127.0.0.1:5173/projects/${slug}` });
    await new Promise((r) => setTimeout(r, 1000));
    const res = await client.eval(`
      (() => {
        const h1 = document.querySelector('h1')?.textContent.trim();
        const notFound = document.body.textContent.includes('Project not found') || document.body.textContent.includes('404');
        return { h1, notFound };
      })()
    `);
    console.log(`  Route /projects/${slug} -> "${res.h1}" (404: ${res.notFound ? 'FAIL' : 'PASS'})`);
  }

  // 5. Check Console Errors
  console.log("\n=== 5. Console Errors & Warnings ===");
  if (client.consoleErrors.length === 0) {
    console.log("  0 console errors or warnings recorded.");
  } else {
    client.consoleErrors.forEach((e) => console.log(`  [${e.type}] ${e.text}`));
  }

  client.close();
  chromeProcess.kill();
  console.log("\n=== COMPACT GRID QA RUN FINISHED SUCCESSFULLY ===");
}

run().catch((err) => {
  console.error("QA Error:", err);
  process.exit(1);
});
