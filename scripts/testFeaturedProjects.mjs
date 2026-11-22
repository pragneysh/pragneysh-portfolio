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
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_feat_test_" + Date.now();
  const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\2c5cfca3-0f79-463b-b132-ed33cee2a6e6\\screenshots";

  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  console.log("1. Starting Chrome for Featured Projects QA...");
  const chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9223",
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
      const res = await fetch("http://127.0.0.1:9223/json/list");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome CDP at port 9223");
  }

  console.log("2. Connected to Chrome CDP target:", cdpUrl);
  const client = new CDPClient(cdpUrl);
  await client.connect();

  await client.send("Page.enable");
  await client.send("DOM.enable");
  await client.send("Runtime.enable");

  // Step 1: Set 1440x900 viewport
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log("3. Navigating to http://127.0.0.1:5173/ ...");
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await new Promise((r) => setTimeout(r, 2000));

  // Scroll to #featured-projects
  await client.eval(`
    const el = document.getElementById('featured-projects');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 1000));

  console.log("4. Inspecting Featured Projects section cards and visuals...");
  const cardsData = await client.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('#featured-projects .featured-project-card'));
      return cards.map((card, idx) => {
        const titleEl = card.querySelector('.featured-card-title');
        const badgeEl = card.querySelector('.featured-type-badge');
        const indexEl = card.querySelector('.featured-index-pill');
        const imgEl = card.querySelector('.featured-media-img');
        const placeholderEl = card.querySelector('.featured-media-placeholder');
        const tags = Array.from(card.querySelectorAll('.stack-pill')).map(p => p.textContent.trim());
        const linkEl = card.querySelector('.featured-action-btn');

        let imgInfo = null;
        if (imgEl) {
          const rect = imgEl.getBoundingClientRect();
          imgInfo = {
            src: imgEl.src,
            currentSrc: imgEl.currentSrc,
            complete: imgEl.complete,
            naturalWidth: imgEl.naturalWidth,
            naturalHeight: imgEl.naturalHeight,
            renderedWidth: Math.round(rect.width),
            renderedHeight: Math.round(rect.height),
            aspectRatio: rect.height > 0 ? (rect.width / rect.height).toFixed(2) : null,
          };
        }

        return {
          index: indexEl ? indexEl.textContent.trim() : idx + 1,
          title: titleEl ? titleEl.textContent.trim() : 'Unknown',
          badge: badgeEl ? badgeEl.textContent.trim() : 'None',
          hasImage: !!imgEl,
          hasPlaceholder: !!placeholderEl,
          imgInfo,
          tagsCount: tags.length,
          caseStudyHref: linkEl ? linkEl.getAttribute('href') : null,
        };
      });
    })()
  `);

  console.log("\n--- FEATURED PROJECTS CARDS INSPECTION ---");
  cardsData.forEach((c) => {
    console.log(`[Card ${c.index}] ${c.title}`);
    console.log(`  Badge: ${c.badge}`);
    console.log(`  Has Img: ${c.hasImage} | Has Placeholder: ${c.hasPlaceholder}`);
    if (c.imgInfo) {
      console.log(`  Img Natural: ${c.imgInfo.naturalWidth}x${c.imgInfo.naturalHeight} | Rendered: ${c.imgInfo.renderedWidth}x${c.imgInfo.renderedHeight} (Aspect: ${c.imgInfo.aspectRatio}) | Complete: ${c.imgInfo.complete}`);
      console.log(`  Src: ${c.imgInfo.currentSrc.split('/').pop()}`);
    }
    console.log(`  Case Study Link: ${c.caseStudyHref}`);
    console.log(`  Tags Count: ${c.tagsCount}`);
    console.log("");
  });

  // Capture screenshot of featured projects at 1440px
  console.log("5. Capturing screenshot at 1440px...");
  const ss1440 = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifactDir, "featured_projects_1440px.png"), Buffer.from(ss1440.data, "base64"));
  console.log("  Saved featured_projects_1440px.png");

  // Viewport at 768px (Tablet)
  console.log("6. Testing 768px tablet layout...");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 600));
  await client.eval(`
    const el = document.getElementById('featured-projects');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 600));
  const ss768 = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifactDir, "featured_projects_768px.png"), Buffer.from(ss768.data, "base64"));
  console.log("  Saved featured_projects_768px.png");

  // Viewport at 390px (Mobile)
  console.log("7. Testing 390px mobile layout...");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));
  await client.eval(`
    const el = document.getElementById('featured-projects');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise((r) => setTimeout(r, 600));
  const ss390 = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifactDir, "featured_projects_390px.png"), Buffer.from(ss390.data, "base64"));
  console.log("  Saved featured_projects_390px.png");

  // Step 8: Verify Case Study Routes for each of the 6 projects
  console.log("\n8. Verifying all 6 Case Study Routes...");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const slugs = [
    "leavesmanagement",
    "tour-travel-booking",
    "client-portfolio-platforms",
    "restaurant-ordering-system",
    "tshirt-customization-platform",
    "auth-security-systems",
  ];

  for (const slug of slugs) {
    const routeUrl = `http://127.0.0.1:5173/projects/${slug}`;
    await client.send("Page.navigate", { url: routeUrl });
    await new Promise((r) => setTimeout(r, 1200));

    const pageInfo = await client.eval(`
      (() => {
        const titleEl = document.querySelector('h1') || document.querySelector('.case-study-title') || document.querySelector('.project-header h1');
        const heroImg = document.querySelector('.case-study-hero-img') || document.querySelector('.project-media img') || document.querySelector('img');
        const notFound = document.body.textContent.includes('Project not found') || document.body.textContent.includes('404');
        return {
          title: titleEl ? titleEl.textContent.trim() : null,
          notFound,
          heroImgSrc: heroImg ? heroImg.src.split('/').pop() : null,
          heroImgLoaded: heroImg ? heroImg.complete && heroImg.naturalWidth > 0 : false,
        };
      })()
    `);

    console.log(`Route /projects/${slug}:`);
    console.log(`  Page Title: ${pageInfo.title}`);
    console.log(`  404 / Not Found: ${pageInfo.notFound}`);
    console.log(`  Hero Image: ${pageInfo.heroImgSrc} (Loaded: ${pageInfo.heroImgLoaded})`);
  }

  // Console errors check
  console.log("\n9. Console errors/warnings during test:");
  if (client.consoleErrors.length === 0) {
    console.log("  No console errors or warnings recorded.");
  } else {
    client.consoleErrors.forEach((e) => console.log(`  [${e.type}] ${e.text}`));
  }

  client.close();
  chromeProcess.kill();
  console.log("\n--- TEST COMPLETED SUCCESSFULLY ---");
}

run().catch((err) => {
  console.error("QA Test Error:", err);
  process.exit(1);
});
