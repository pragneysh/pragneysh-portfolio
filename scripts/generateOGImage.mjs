import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background-color: #0c0e14;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    /* Background Elements */
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(circle at 50% 50%, black 60%, transparent 100%);
    }

    .glow-blue {
      position: absolute;
      top: -120px;
      left: -80px;
      width: 650px;
      height: 650px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(65, 105, 225, 0.28) 0%, rgba(65, 105, 225, 0) 70%);
      filter: blur(40px);
      pointer-events: none;
    }

    .glow-cyan {
      position: absolute;
      bottom: -150px;
      right: -80px;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0) 70%);
      filter: blur(50px);
      pointer-events: none;
    }

    .glow-accent {
      position: absolute;
      top: 40%;
      right: 25%;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%);
      filter: blur(60px);
      pointer-events: none;
    }

    /* Outer Container Frame */
    .og-container {
      position: relative;
      z-index: 10;
      width: 1200px;
      height: 630px;
      padding: 64px 72px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Left Column - Main Branding */
    .left-col {
      flex: 1;
      max-width: 640px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }

    .brand-top {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(30, 33, 45, 0.7);
      border: 1px solid rgba(65, 105, 225, 0.4);
      padding: 6px 16px;
      border-radius: 100px;
      width: fit-content;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
      box-shadow: 0 0 10px #10b981;
    }

    .badge-text {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #93c5fd;
    }

    .brand-name {
      font-family: 'Manrope', 'Inter', sans-serif;
      font-size: 64px;
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: #ffffff;
      text-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
    }

    .headline {
      font-size: 26px;
      font-weight: 600;
      line-height: 1.35;
      color: #cbd5e1;
      letter-spacing: -0.01em;
    }

    .headline-highlight {
      color: #60a5fa;
    }

    .brand-bottom {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    /* Tech Stack Pills */
    .tech-stack {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .tech-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(23, 25, 35, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 9px 18px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 600;
      color: #f1f5f9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .tech-pill svg {
      width: 16px;
      height: 16px;
    }

    .tech-pill.python {
      border-color: rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }
    .tech-pill.django {
      border-color: rgba(52, 211, 153, 0.3);
      color: #34d399;
    }
    .tech-pill.react {
      border-color: rgba(96, 165, 250, 0.3);
      color: #60a5fa;
    }
    .tech-pill.aws {
      border-color: rgba(251, 146, 60, 0.3);
      color: #fb923c;
    }

    /* Domain line */
    .domain-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      color: #94a3b8;
    }

    .domain-icon {
      color: #4169E1;
    }

    /* Right Column - Engineering Code / Architecture Card */
    .right-col {
      width: 440px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .code-card {
      width: 100%;
      background: rgba(18, 20, 29, 0.9);
      border: 1px solid rgba(65, 105, 225, 0.28);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 
        0 20px 50px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.04),
        0 0 35px rgba(65, 105, 225, 0.15);
      backdrop-filter: blur(12px);
      position: relative;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .window-dots {
      display: flex;
      gap: 6px;
    }

    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }

    .card-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      letter-spacing: 0.02em;
    }

    .card-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      line-height: 1.7;
      color: #e2e8f0;
    }

    .syn-keyword { color: #f43f5e; font-weight: 600; }
    .syn-var { color: #38bdf8; }
    .syn-prop { color: #93c5fd; }
    .syn-string { color: #a7f3d0; }
    .syn-comment { color: #64748b; font-style: italic; }
    .syn-punct { color: #94a3b8; }
    .syn-bool { color: #fb923c; }

    .card-footer-pill {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }

    .cf-status {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #34d399;
    }

    .cf-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 8px #34d399;
    }

    .cf-region {
      color: #64748b;
    }

    /* Border Corner accents */
    .corner-decor {
      position: absolute;
      width: 20px;
      height: 20px;
      border-color: rgba(65, 105, 225, 0.4);
      pointer-events: none;
    }
    .corner-tl { top: 20px; left: 20px; border-top: 2px solid; border-left: 2px solid; }
    .corner-tr { top: 20px; right: 20px; border-top: 2px solid; border-right: 2px solid; }
    .corner-bl { bottom: 20px; left: 20px; border-bottom: 2px solid; border-left: 2px solid; }
    .corner-br { bottom: 20px; right: 20px; border-bottom: 2px solid; border-right: 2px solid; }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="glow-blue"></div>
  <div class="glow-cyan"></div>
  <div class="glow-accent"></div>

  <div class="corner-decor corner-tl"></div>
  <div class="corner-decor corner-tr"></div>
  <div class="corner-decor corner-bl"></div>
  <div class="corner-decor corner-br"></div>

  <div class="og-container">
    <div class="left-col">
      <div class="brand-top">
        <div class="badge-pill">
          <span class="badge-dot"></span>
          <span class="badge-text">Developer Portfolio &amp; Systems</span>
        </div>

        <h1 class="brand-name">Pragneysh Dekate</h1>

        <p class="headline">
          Full-Stack Developer <span class="headline-highlight">|</span> Python, Cloud &amp; DevOps
        </p>
      </div>

      <div class="brand-bottom">
        <div class="tech-stack">
          <div class="tech-pill python">
            <span>Python</span>
          </div>
          <div class="tech-pill django">
            <span>Django</span>
          </div>
          <div class="tech-pill react">
            <span>React</span>
          </div>
          <div class="tech-pill aws">
            <span>AWS Cloud</span>
          </div>
        </div>

        <div class="domain-bar">
          <svg class="domain-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>https://pragneyshdekate.in</span>
        </div>
      </div>
    </div>

    <div class="right-col">
      <div class="code-card">
        <div class="card-header">
          <div class="window-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="card-title">engineer.config.ts</div>
        </div>

        <div class="card-code">
          <span class="syn-keyword">const</span> <span class="syn-var">engineer</span> <span class="syn-punct">=</span> <span class="syn-punct">{</span><br>
          &nbsp;&nbsp;<span class="syn-prop">name</span><span class="syn-punct">:</span> <span class="syn-string">"Pragneysh Dekate"</span><span class="syn-punct">,</span><br>
          &nbsp;&nbsp;<span class="syn-prop">role</span><span class="syn-punct">:</span> <span class="syn-string">"Full-Stack Developer"</span><span class="syn-punct">,</span><br>
          &nbsp;&nbsp;<span class="syn-prop">focus</span><span class="syn-punct">:</span> <span class="syn-punct">[</span><br>
          &nbsp;&nbsp;&nbsp;&nbsp;<span class="syn-string">"Python / Django"</span><span class="syn-punct">,</span><br>
          &nbsp;&nbsp;&nbsp;&nbsp;<span class="syn-string">"React / Web Apps"</span><span class="syn-punct">,</span><br>
          &nbsp;&nbsp;&nbsp;&nbsp;<span class="syn-string">"AWS Cloud &amp; DevOps"</span><br>
          &nbsp;&nbsp;<span class="syn-punct">]</span><span class="syn-punct">,</span><br>
          &nbsp;&nbsp;<span class="syn-prop">location</span><span class="syn-punct">:</span> <span class="syn-string">"Ahmedabad, IN"</span><span class="syn-punct">,</span><br>
          &nbsp;&nbsp;<span class="syn-prop">productionReady</span><span class="syn-punct">:</span> <span class="syn-bool">true</span><br>
          <span class="syn-punct">}</span><span class="syn-punct">;</span>
        </div>

        <div class="card-footer-pill">
          <div class="cf-status">
            <span class="cf-pulse"></span>
            <span>Architecture Verified</span>
          </div>
          <div class="cf-region">CloudFront &bull; S3</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

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

  close() {
    if (this.ws) this.ws.close();
  }
}

async function renderOGImage() {
  const templatePath = path.resolve('./scripts/og-template.html');
  fs.writeFileSync(templatePath, htmlContent, 'utf-8');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_og_gen_' + Date.now();

  console.log('Launching headless Chrome to render 1200x630 OG image...');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9244',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1200,630',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank',
  ]);

  let cdpUrl = null;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9244/json/list');
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    chromeProcess.kill();
    throw new Error('Could not connect to Chrome CDP');
  }

  const client = new SimpleCDP(cdpUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false
  });

  const fileUrl = 'file:///' + templatePath.replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await client.send('Page.navigate', { url: fileUrl });

  // Wait for Google Fonts to load
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Capturing screenshot of viewport (1200x630)...');
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
      scale: 1
    }
  });

  const buffer = Buffer.from(screenshot.data, 'base64');
  const outputPath = path.resolve('./public/og-image.png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully generated OG image: ${outputPath} (${buffer.length} bytes)`);

  client.close();
  chromeProcess.kill();

  // Clean up template file
  try {
    fs.unlinkSync(templatePath);
  } catch {}
}

renderOGImage().catch((err) => {
  console.error('Error generating OG image:', err);
  process.exit(1);
});
