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

  close() {
    if (this.ws) this.ws.close();
  }
}

async function capture() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_capture_" + Date.now();
  const outputDir = path.resolve("D:/Projects/pragneysh/pragneysh-portfolio/src/assets/deployments");

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("1. Launching headless Chrome for screenshots...");
  const chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9223",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1440,810",
    "about:blank",
  ]);

  let cdpUrl = null;
  for (let i = 0; i < 25; i++) {
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
    throw new Error("Could not connect to Chrome DevTools Protocol at http://127.0.0.1:9223");
  }

  console.log("2. Connected to Chrome CDP target:", cdpUrl);
  const cdp = new CDPClient(cdpUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("DOM.enable");

  // Set 16:9 Viewport (1440x810, Desktop, 1.25x scale factor for crisp text)
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 810,
    deviceScaleFactor: 1.25,
    mobile: false,
  });

  // Client sites to capture
  const sites = [
    {
      id: "aurexon",
      name: "Aurexon International",
      url: "https://aurexoninternational.com",
      filename: "aurexon.jpg",
    },
    {
      id: "fortinexus",
      name: "FortiNexus Security Solutions",
      url: "https://fortinexus.in",
      filename: "fortinexus.jpg",
    },
    {
      id: "theyogahub",
      name: "The Yoga Hub",
      url: "https://theyogahub.in",
      filename: "theyogahub.jpg",
    },
    {
      id: "durgeshkoshti",
      name: "Durgesh Koshti Portfolio",
      url: "https://durgeshkoshti.com",
      filename: "durgeshkoshti.jpg",
    },
    {
      id: "palfilms",
      name: "Pal Films Production",
      url: "https://d34feofwsvq55x.cloudfront.net",
      filename: "palfilms.jpg",
    },
  ];

  const results = [];

  for (const site of sites) {
    console.log(`\nNavigating to ${site.name} (${site.url})...`);
    try {
      await cdp.send("Page.navigate", { url: site.url });
      
      // Wait for network idle and animations to settle
      await new Promise((r) => setTimeout(r, 4500));

      // Capture visible viewport (exactly the 16:9 top fold/hero area)
      const screenshot = await cdp.send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 90,
        clip: {
          x: 0,
          y: 0,
          width: 1440,
          height: 810,
          scale: 1,
        },
      });

      const buffer = Buffer.from(screenshot.data, "base64");
      const targetPath = path.join(outputDir, site.filename);
      fs.writeFileSync(targetPath, buffer);

      const stats = fs.statSync(targetPath);
      console.log(`✓ Saved ${site.filename} (${(stats.size / 1024).toFixed(1)} KB)`);
      results.push({
        id: site.id,
        name: site.name,
        url: site.url,
        file: site.filename,
        path: targetPath,
        sizeKb: (stats.size / 1024).toFixed(1),
        success: true,
      });
    } catch (err) {
      console.error(`✗ Error capturing ${site.name}:`, err.message);
      results.push({
        id: site.id,
        name: site.name,
        url: site.url,
        error: err.message,
        success: false,
      });
    }
  }

  cdp.close();
  chromeProcess.kill();
  console.log("\nScreenshot capture process finished.");
  console.log(JSON.stringify(results, null, 2));
}

capture().catch((err) => {
  console.error("Fatal capture error:", err);
  process.exit(1);
});
