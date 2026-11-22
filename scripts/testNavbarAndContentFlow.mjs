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
  const userDataDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_nav_flow_" + Date.now();

  console.log("=== 1. Starting Chrome for Navbar & Content Flow QA ===");
  const chromeProcess = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9227",
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
      const res = await fetch("http://127.0.0.1:9227/json/list");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    chromeProcess.kill();
    throw new Error("Could not connect to Chrome CDP at port 9226");
  }

  const client = new CDPClient(cdpUrl);
  await client.connect();

  await client.send("Page.enable");
  await client.send("DOM.enable");
  await client.send("Runtime.enable");

  // Step 1: Check Navbar items rendered on 1440px desktop
  console.log("\n=== 2. Desktop Navbar Audit (1440px) ===");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await new Promise((r) => setTimeout(r, 2000));

  const navInfo = await client.eval(`
    (() => {
      const primaryItems = Array.from(document.querySelectorAll('.nav-desktop .nav-menu > li:not(.nav-item-dropdown)')).map(li => {
        const a = li.querySelector('a');
        return {
          label: a ? a.textContent.trim() : '',
          href: a ? a.getAttribute('href') : '',
        };
      });

      const moreToggle = document.querySelector('.dropdown-toggle');
      const moreText = moreToggle ? moreToggle.textContent.trim() : null;

      // Click more dropdown
      if (moreToggle) {
        moreToggle.click();
      }

      return {
        primaryItems,
        moreText,
      };
    })()
  `);

  await new Promise((r) => setTimeout(r, 200));

  const dropdownItems = await client.eval(`
    Array.from(document.querySelectorAll('.dropdown-menu .dropdown-item')).map(a => ({
      label: a.textContent.trim(),
      href: a.getAttribute('href'),
    }));
  `);

  console.log("Primary Navbar Links:");
  navInfo.primaryItems.forEach((p, idx) => console.log(`  ${idx + 1}. [${p.label}] -> ${p.href}`));
  console.log(`Dropdown Toggle: "${navInfo.moreText}"`);
  console.log("More Dropdown Items:");
  dropdownItems.forEach((d, idx) => console.log(`  ${idx + 1}. [${d.label}] -> ${d.href}`));

  // Step 2: Verify Homepage Section Order in DOM
  console.log("\n=== 3. Homepage Section Flow Audit ===");
  const sectionOrder = await client.eval(`
    (() => {
      const sections = Array.from(document.querySelectorAll('main > section[id]')).map((s, idx) => {
        const titleEl = s.querySelector('.section-title') || s.querySelector('h1') || s.querySelector('h2');
        return {
          index: idx + 1,
          id: s.id,
          title: titleEl ? titleEl.textContent.trim().replace(/\\s+/g, ' ') : 'N/A',
        };
      });
      return sections;
    })()
  `);

  sectionOrder.forEach((s) => console.log(`  ${s.index}. #${s.id}: "${s.title}"`));

  // Step 3: Test Scroll Offset & Section Heading Visibility
  console.log("\n=== 4. Testing Navbar Scroll Offset (No Heading Overlap) ===");
  const testIds = ['about', 'skills', 'experience', 'featured-projects', 'contact'];
  for (const id of testIds) {
    await client.eval(`
      const a = document.querySelector('.nav-desktop a[href="/#${id}"]');
      if (a) a.click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    const offsetCheck = await client.eval(`
      (() => {
        const el = document.getElementById('${id}');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          clearOfNavbar: rect.top >= 60,
        };
      })()
    `);

    console.log(`  Navigate to #${id} -> Element rect.top: ${offsetCheck.top}px (Clear of navbar >= 60px: ${offsetCheck.clearOfNavbar ? 'PASS' : 'FAIL'})`);
  }

  // Step 4: Test Mobile Drawer at 390px
  console.log("\n=== 5. Mobile Drawer Audit (390px) ===");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await new Promise((r) => setTimeout(r, 1500));

  // Open mobile drawer
  await client.eval(`
    const btn = document.querySelector('.mobile-toggle-btn');
    if (btn) btn.click();
  `);
  await new Promise((r) => setTimeout(r, 200));

  const drawerInfo = await client.eval(`
    (() => {
      const drawer = document.querySelector('.mobile-drawer');
      const isOpen = drawer ? drawer.classList.contains('open') : false;
      const links = Array.from(drawer.querySelectorAll('.drawer-link')).map(a => ({
        label: a.querySelector('span') ? a.querySelector('span').textContent.trim() : a.textContent.trim(),
        href: a.getAttribute('href'),
      }));
      const labels = Array.from(drawer.querySelectorAll('.drawer-section-label')).map(l => l.textContent.trim());
      return { isOpen, linksCount: links.length, links, labels };
    })()
  `);

  console.log(`  Mobile Toggle Clicked -> Drawer Open: ${drawerInfo.isOpen ? 'PASS' : 'FAIL'}`);
  console.log(`  Drawer Links Total: ${drawerInfo.linksCount}`);
  drawerInfo.links.forEach((l, idx) => console.log(`    ${idx + 1}. [${l.label}] -> ${l.href}`));
  console.log(`  Section Labels: [${drawerInfo.labels.join(', ')}]`);

  // Step 5: Test All 6 Viewports for Overflow
  console.log("\n=== 6. Responsive Overflow Check (6 Viewports) ===");
  const viewports = [1920, 1440, 1024, 768, 390, 320];
  for (const w of viewports) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: w < 768,
    });
    await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
    await new Promise((r) => setTimeout(r, 1200));

    const overflow = await client.eval(`
      (() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return { docW, winW, hasOverflow: docW > winW + 1 };
      })()
    `);

    console.log(`  Viewport ${w}px -> docW: ${overflow.docW}px | winW: ${overflow.winW}px | Overflow: ${overflow.hasOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`);
  }

  // Step 6: Capture Full Homepage Flow Screenshot at 1440px
  console.log("\n=== 7. Capturing Homepage Flow Screenshot ===");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await new Promise((r) => setTimeout(r, 1500));

  const ssTop = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(targetDir, "homepage-hero-navbar-1440.png"), Buffer.from(ssTop.data, "base64"));
  console.log("  Saved public/qa/homepage-hero-navbar-1440.png");

  // Console errors check
  console.log("\n=== 8. Console Errors & Warnings ===");
  if (client.consoleErrors.length === 0) {
    console.log("  0 console errors or warnings recorded.");
  } else {
    client.consoleErrors.forEach((e) => console.log(`  [${e.type}] ${e.text}`));
  }

  client.close();
  chromeProcess.kill();
  console.log("\n=== NAVBAR & CONTENT FLOW AUDIT COMPLETED SUCCESSFULLY ===");
}

run().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
