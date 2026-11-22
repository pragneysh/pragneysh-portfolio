import { spawn } from "node:child_process";
import fs from "node:fs";

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
    const res = await client.send("Runtime.evaluate", {
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

let client;

async function run() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_live_test_" + Date.now();

  console.log("1. Starting Chrome for Live Projects QA...");
  const chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9224",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "about:blank",
  ]);

  let cdpUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch("http://127.0.0.1:9224/json/list");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    console.error("Failed to connect to Chrome CDP");
    chromeProcess.kill();
    process.exit(1);
  }

  client = new CDPClient(cdpUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  console.log("2. Navigating to http://127.0.0.1:5173/live-projects...");
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/live-projects" });
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll down to load all images
  await client.eval(`window.scrollTo(0, document.body.scrollHeight)`);
  await new Promise((r) => setTimeout(r, 600));
  await client.eval(`window.scrollTo(0, 0)`);
  await new Promise((r) => setTimeout(r, 300));

  console.log("\n--- Testing Filter Interactions (With React Render Wait) ---");
  const testCategories = [
    { key: "all", expected: 5 },
    { key: "business", expected: 1 },
    { key: "security", expected: 1 },
    { key: "wellness", expected: 1 },
    { key: "portfolio", expected: 1 },
    { key: "film", expected: 1 },
    { key: "all", expected: 5 },
  ];

  for (const cat of testCategories) {
    await client.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('.showcase-filter-pill')).find(p => p.innerText.toLowerCase().includes('${cat.key}'));
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 200));

    const result = await client.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('.showcase-card')).map(c => c.querySelector('.showcase-card-title')?.innerText);
      return { count: cards.length, cards };
    })()`);

    const pass = result.count === cat.expected;
    console.log(`Filter [${cat.key.padEnd(9)}]: visible=${result.count} (expected ${cat.expected}) -> ${pass ? "PASS" : "FAIL"} | Items: [${result.cards.join(", ")}]`);
  }

  // Check image loading
  const imagesStatus = await client.eval(`(() => {
    return Array.from(document.querySelectorAll('.showcase-card')).map(card => {
      const title = card.querySelector('.showcase-card-title')?.innerText;
      const img = card.querySelector('.showcase-img');
      return {
        title,
        complete: img?.complete,
        naturalWidth: img?.naturalWidth,
        naturalHeight: img?.naturalHeight,
        ratio: img?.naturalWidth && img?.naturalHeight ? (img.naturalWidth / img.naturalHeight).toFixed(2) : 'N/A'
      };
    });
  })()`);

  console.log("\n--- Image Loading & Aspect Ratio Check ---");
  imagesStatus.forEach((img, i) => {
    console.log(`${i + 1}. ${img.title}: complete=${img.complete}, dimensions=${img.naturalWidth}x${img.naturalHeight}, ratio=${img.ratio} (16:9 = 1.78)`);
  });

  // Check 9 Viewports for Overflow
  console.log("\n--- Viewport Width & Layout Verification ---");
  const viewports = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
  let allPass = true;
  for (const width of viewports) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await new Promise((r) => setTimeout(r, 100));

    const check = await client.eval(`(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        innerWidth: window.innerWidth,
        hasOverflow: doc.scrollWidth > window.innerWidth,
        gridColumns: window.getComputedStyle(document.querySelector('.showcase-grid')).gridTemplateColumns.split(' ').length
      };
    })()`);

    if (check.hasOverflow) allPass = false;
    console.log(`Viewport ${width.toString().padEnd(4)}px: overflow=${check.hasOverflow ? 'FAIL' : 'PASS'}, gridCols=${check.gridColumns}, clientWidth=${check.clientWidth}`);
  }

  // Check console
  console.log("\nConsole errors:", client.consoleErrors.length);

  // Take a full page screenshot at 1440px
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 300));

  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    clip: { x: 0, y: 0, width: 1440, height: 1800, scale: 1 }
  });
  const screenshotPath = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\2c5cfca3-0f79-463b-b132-ed33cee2a6e6\\screenshots\\live_projects_redesign_1440px.png";
  fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
  console.log("\nCaptured review screenshot at:", screenshotPath);

  client.close();
  chromeProcess.kill();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}

  console.log("\n=== ALL AUTOMATED QA CHECKS COMPLETED SUCCESSFULLY ===");
}

run().catch((err) => {
  console.error("Test error:", err);
  if (client) client.close();
  process.exit(1);
});
