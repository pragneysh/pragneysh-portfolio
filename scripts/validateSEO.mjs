import { spawn } from 'child_process';
import fs from 'fs';

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
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_seo_audit_' + Date.now();

  console.log('=== 1. Starting Headless Chrome for Comprehensive SEO Audit ===');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9239',
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
      const res = await fetch('http://127.0.0.1:9239/json/list');
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        cdpUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!cdpUrl) {
    console.error('Failed to connect to Chrome debugging endpoint');
    chromeProcess.kill();
    process.exit(1);
  }

  const client = new SimpleCDP(cdpUrl);
  await client.connect();

  await client.send('Page.enable');

  try {
    // -------------------------------------------------------------
    // Test 1: Homepage SEO
    // -------------------------------------------------------------
    console.log('\n=== 2. Auditing Homepage SEO (http://127.0.0.1:5173/) ===');
    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await new Promise((r) => setTimeout(r, 1200));

    const hpSEO = await client.eval(`
      (() => {
        const title = document.title;
        const desc = document.querySelector('meta[name="description"]')?.content;
        const canonical = document.querySelector('link[rel="canonical"]')?.href;
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
        const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
        const ogUrl = document.querySelector('meta[property="og:url"]')?.content;
        const twTitle = document.querySelector('meta[name="twitter:title"]')?.content;
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.replace(/\\s+/g, ' ').trim());
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
          try { return JSON.parse(s.textContent); } catch (e) { return null; }
        });
        const imagesWithoutAlt = Array.from(document.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '').map(i => i.src);
        return {
          title, desc, canonical, ogTitle, ogDesc, ogUrl, twTitle, h1s, scripts, imagesWithoutAlt
        };
      })()
    `);

    console.log('Homepage Title:', hpSEO.title);
    console.log('Homepage Canonical:', hpSEO.canonical);
    console.log('Homepage Meta Description:', hpSEO.desc);
    console.log('H1 Headings found (count: ' + hpSEO.h1s.length + '):', hpSEO.h1s);
    console.log('Images without alt text:', hpSEO.imagesWithoutAlt.length);

    // Verify structured data
    const person = hpSEO.scripts.flatMap(s => s?.['@graph'] || [s]).find(item => item?.['@type'] === 'Person');
    console.log('\n--- Person Schema Verification ---');
    console.log('Name:', person?.name);
    console.log('Alternate Names:', person?.alternateName);
    console.log('Job Title:', person?.jobTitle);
    console.log('Address:', person?.address?.addressLocality + ', ' + person?.address?.addressRegion);
    console.log('SameAs Links:', person?.sameAs);

    // -------------------------------------------------------------
    // Test 2: Live Projects Page SEO
    // -------------------------------------------------------------
    console.log('\n=== 3. Auditing /live-projects Route SEO ===');
    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/live-projects' });
    await new Promise((r) => setTimeout(r, 1200));

    const lpSEO = await client.eval(`
      (() => {
        const title = document.title;
        const desc = document.querySelector('meta[name="description"]')?.content;
        const canonical = document.querySelector('link[rel="canonical"]')?.href;
        const h1 = document.querySelector('h1')?.textContent?.trim();
        const breadcrumbLinks = Array.from(document.querySelectorAll('.showcase-breadcrumb-trail a, .showcase-breadcrumb-trail span')).map(e => e.textContent.trim());
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
          try { return JSON.parse(s.textContent); } catch (e) { return null; }
        });
        const imagesWithoutAlt = Array.from(document.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '').map(i => i.src);
        return {
          title, desc, canonical, h1, breadcrumbLinks, scripts, imagesWithoutAlt
        };
      })()
    `);

    console.log('Live Projects Title:', lpSEO.title);
    console.log('Live Projects Canonical:', lpSEO.canonical);
    console.log('Live Projects Meta Description:', lpSEO.desc);
    console.log('Live Projects H1:', lpSEO.h1);
    console.log('Breadcrumb Trail Elements:', lpSEO.breadcrumbLinks.join(' '));
    console.log('Images without alt text on /live-projects:', lpSEO.imagesWithoutAlt.length);

    // -------------------------------------------------------------
    // Test 3: Project Case Studies (All 9)
    // -------------------------------------------------------------
    console.log('\n=== 4. Auditing All 9 Engineering Case Study Routes ===');
    const slugs = [
      'leavesmanagement',
      'tour-travel-booking',
      'tshirt-customization-platform',
      'client-portfolio-platforms',
      'auth-security-systems',
      'restaurant-ordering-system',
      'aws-control-center',
      'workly',
      'verticomply',
    ];

    const caseResults = [];
    for (const slug of slugs) {
      await client.send('Page.navigate', { url: `http://127.0.0.1:5173/projects/${slug}` });
      await new Promise((r) => setTimeout(r, 600));

      const res = await client.eval(`
        (() => {
          const title = document.title;
          const desc = document.querySelector('meta[name="description"]')?.content;
          const canonical = document.querySelector('link[rel="canonical"]')?.href;
          const h1 = document.querySelector('h1')?.textContent?.trim();
          const routeScript = document.getElementById('route-jsonld-schema');
          let parsedSchema = null;
          try { if (routeScript) parsedSchema = JSON.parse(routeScript.textContent); } catch (e) {}
          const imagesWithoutAlt = Array.from(document.querySelectorAll('img')).filter(i => !i.alt || i.alt.trim() === '').map(i => i.src);
          return {
            title, desc, canonical, h1, hasSchema: !!parsedSchema, imagesWithoutAlt: imagesWithoutAlt.length
          };
        })()
      `);
      caseResults.push({ slug, ...res });
    }

    caseResults.forEach(c => {
      console.log(`[${c.slug}]`);
      console.log(`  Title: ${c.title}`);
      console.log(`  Canonical: ${c.canonical}`);
      console.log(`  Description: ${c.desc.slice(0, 75)}...`);
      console.log(`  H1: ${c.h1} | Has Route Schema: ${c.hasSchema} | Broken Alt Imgs: ${c.imagesWithoutAlt}`);
    });

    // Check duplicate titles or canonicals among the 9 case studies
    const titlesSet = new Set(caseResults.map(c => c.title));
    const canonicalsSet = new Set(caseResults.map(c => c.canonical));
    console.log('\n--- Duplicate Check across Case Studies ---');
    console.log(`Unique Titles: ${titlesSet.size} / 9 (Expected 9) -> ${titlesSet.size === 9 ? 'PASSED' : 'FAILED'}`);
    console.log(`Unique Canonicals: ${cancals => canonicalsSet.size} / 9 (Expected 9) -> ${canonicalsSet.size === 9 ? 'PASSED' : 'FAILED'}`);

    // -------------------------------------------------------------
    // Test 4: Sitemap & Robots Validation
    // -------------------------------------------------------------
    console.log('\n=== 5. Auditing sitemap.xml & robots.txt ===');
    const sitemapContent = fs.readFileSync('public/sitemap.xml', 'utf8');
    const robotsContent = fs.readFileSync('public/robots.txt', 'utf8');

    const sitemapUrls = (sitemapContent.match(/<loc>(.*?)<\/loc>/g) || []).map(u => u.replace(/<\/?loc>/g, ''));
    console.log(`Sitemap total URLs: ${sitemapUrls.length}`);
    sitemapUrls.forEach(u => console.log('  ' + u));

    console.log('\nRobots.txt content:\n' + robotsContent.trim());

    console.log('\n=== ALL SEO AUDIT AND VERIFICATION CHECKS COMPLETED ===');
  } catch (err) {
    console.error('Error during SEO audit:', err);
  } finally {
    client.close();
    chromeProcess.kill();
  }
}

run();
