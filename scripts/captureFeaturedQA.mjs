import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
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
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_qa_capture_" + Date.now();

  console.log("1. Starting Chrome for Featured Projects QA Capture...");
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
    await new Promise((r) => setTimeout(r, 400));
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
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome CDP at port 9224");
  }

  const client = new CDPClient(cdpUrl);
  await client.connect();

  await client.send("Page.enable");
  await client.send("DOM.enable");
  await client.send("Runtime.enable");

  const viewports = [
    {
      name: "Desktop: 1440px",
      filename: "desktop-1440.png",
      width: 1440,
      height: 1900,
      scale: 1,
      mobile: false,
    },
    {
      name: "Tablet: 768px",
      filename: "tablet-768.png",
      width: 768,
      height: 2200,
      scale: 1,
      mobile: false,
    },
    {
      name: "Mobile: 390px",
      filename: "mobile-390.png",
      width: 390,
      height: 2400,
      scale: 2,
      mobile: true,
    },
  ];

  for (const vp of viewports) {
    console.log(`\nCapturing ${vp.name} (${vp.width}x${vp.height})...`);
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.scale,
      mobile: vp.mobile,
    });

    await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to #featured-projects smoothly and ensure all images are loaded
    const rect = await client.eval(`
      (() => {
        const el = document.getElementById('featured-projects');
        if (!el) return null;
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        const b = el.getBoundingClientRect();
        return {
          top: Math.round(b.top + window.scrollY),
          height: Math.round(b.height),
          cardCount: el.querySelectorAll('.featured-project-card').length,
        };
      })()
    `);

    console.log(`  Section Top: ${rect?.top}px, Total Height: ${rect?.height}px, Cards: ${rect?.cardCount}`);
    await new Promise((r) => setTimeout(r, 1200));

    // Capture screenshot of viewport after scrolling
    const ss = await client.send("Page.captureScreenshot", {
      format: "png",
    });

    const outPath = path.join(targetDir, vp.filename);
    fs.writeFileSync(outPath, Buffer.from(ss.data, "base64"));
    const stats = fs.statSync(outPath);
    console.log(`  Saved: ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  client.close();
  chromeProcess.kill();
  console.log("\nAll screenshots captured successfully in:", targetDir);
}

run().catch((err) => {
  console.error("QA Capture Error:", err);
  process.exit(1);
});
