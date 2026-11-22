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
  const userDataDir = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_restore_sections_qa_' + Date.now();

  console.log('=== 1. Starting Headless Chrome for Restored Sections QA ===');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9234',
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
      const res = await fetch('http://127.0.0.1:9234/json/list');
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
  console.log('Connected to Chrome DevTools Protocol');

  await client.send('Page.enable');
  await client.send('DOM.enable');

  try {
    // 1. Navigate to Homepage at 1440px
    console.log('\n=== 2. Loading Homepage at 1440x900 ===');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await new Promise((r) => setTimeout(r, 1500));

    // 2. Audit Section Ordering in DOM
    const sectionOrder = await client.eval(`
      (() => {
        const main = document.getElementById('main-content');
        if (!main) return { error: 'No main content found' };
        const sections = Array.from(main.querySelectorAll(':scope > section'));
        return sections.map(s => s.id);
      })()
    `);
    console.log('Rendered Main Sections in Order:', sectionOrder);

    const expectedOrder = [
      'hero',
      'about',
      'skills',
      'experience',
      'live-projects',
      'projects',
      'achievements',
      'education',
      'certifications',
      'contact',
    ];

    const orderMatches = JSON.stringify(sectionOrder) === JSON.stringify(expectedOrder);
    console.log(`Section order check: ${orderMatches ? 'PASSED' : 'FAILED'}`);

    // Check alias #engineering-highlights
    const aliasCheck = await client.eval(`!!document.getElementById('engineering-highlights')`);
    console.log(`Alias #engineering-highlights present: ${aliasCheck ? 'PASSED' : 'FAILED'}`);

    // 3. Audit Engineering Highlights (Achievements) Content
    const achDetails = await client.eval(`
      (() => {
        const sec = document.getElementById('achievements');
        if (!sec) return null;
        const title = sec.querySelector('.section-title')?.textContent?.trim();
        const cards = Array.from(sec.querySelectorAll('.achievement-card')).map(c => ({
          title: c.querySelector('.ach-title')?.textContent?.trim(),
          category: c.querySelector('.ach-category')?.textContent?.trim(),
          metric: c.querySelector('.metric-highlight')?.textContent?.trim(),
          context: c.querySelector('.metric-context')?.textContent?.trim(),
        }));
        return { title, cardCount: cards.length, cards };
      })()
    `);
    console.log(`\n=== 3. Achievements Section Audit ===`);
    console.log(`Title: ${achDetails?.title}`);
    console.log(`Card count: ${achDetails?.cardCount}`);
    achDetails?.cards.forEach((c, idx) => {
      console.log(`  ${idx + 1}. [${c.category}] ${c.title} -> ${c.metric} (${c.context})`);
    });

    // 4. Audit Education Content
    const eduDetails = await client.eval(`
      (() => {
        const sec = document.getElementById('education');
        if (!sec) return null;
        const title = sec.querySelector('.section-title')?.textContent?.trim();
        const degreeCards = Array.from(sec.querySelectorAll('.edu-degree-card')).map(c => ({
          degree: c.querySelector('.edu-degree')?.textContent?.trim(),
          highlights: Array.from(c.querySelectorAll('.edu-highlight-item')).map(h => h.textContent.trim()),
        }));
        const schoolingCards = Array.from(sec.querySelectorAll('.edu-school-card')).map(c => ({
          title: c.querySelector('.edu-school-title')?.textContent?.trim(),
          board: c.querySelector('.edu-school-board')?.textContent?.trim(),
          desc: c.querySelector('.edu-school-desc')?.textContent?.trim(),
        }));
        return { title, degreeCount: degreeCards.length, degrees: degreeCards, schoolingCount: schoolingCards.length, schooling: schoolingCards };
      })()
    `);
    console.log(`\n=== 4. Education Section Audit ===`);
    console.log(`Title: ${eduDetails?.title}`);
    console.log(`Degree count: ${eduDetails?.degreeCount}`);
    eduDetails?.degrees.forEach((d, idx) => {
      console.log(`  Degree ${idx + 1}: ${d.degree}`);
      d.highlights.forEach(h => console.log(`    - ${h}`));
    });
    console.log(`Schooling count: ${eduDetails?.schoolingCount}`);
    eduDetails?.schooling.forEach((s, idx) => {
      console.log(`  School ${idx + 1}: ${s.title} (${s.board}) - ${s.desc}`);
    });

    // 5. Audit Certifications Content
    const certDetails = await client.eval(`
      (() => {
        const sec = document.getElementById('certifications');
        if (!sec) return null;
        const title = sec.querySelector('.section-title')?.textContent?.trim();
        const certCards = Array.from(sec.querySelectorAll('.cert-card')).map(c => ({
          title: c.querySelector('.cert-title')?.textContent?.trim(),
          issuer: c.querySelector('.cert-issuer')?.textContent?.trim(),
          hasVerifiedBadge: !!c.querySelector('.cert-verified-badge'),
          id: c.querySelector('.cert-id')?.textContent?.trim(),
          skills: Array.from(c.querySelectorAll('.cert-skill-tag')).map(t => t.textContent.trim())
        }));
        return { title, certCount: certCards.length, certs: certCards };
      })()
    `);
    console.log(`\n=== 5. Certifications Section Audit ===`);
    console.log(`Title: ${certDetails?.title}`);
    console.log(`Cert count: ${certDetails?.certCount}`);
    certDetails?.certs.forEach((c, idx) => {
      console.log(`  Cert ${idx + 1}: ${c.title} (${c.issuer}) - Verified: ${c.hasVerifiedBadge} | ID: ${c.id}`);
      console.log(`    Skills: ${c.skills.join(', ')}`);
    });

    // 6. Navigation Audit: More dropdown in Navbar
    console.log(`\n=== 6. Navbar and Dropdown Audit ===`);
    const navItems = await client.eval(`
      (() => {
        const desktopMenu = document.querySelector('.nav-desktop .nav-menu');
        if (!desktopMenu) return null;
        const primaries = Array.from(desktopMenu.querySelectorAll(':scope > li > a.nav-link')).map(a => a.textContent.trim());
        const dropdownToggle = desktopMenu.querySelector('.dropdown-toggle')?.textContent?.trim();
        return { primaries, dropdownToggle };
      })()
    `);
    console.log('Primary Navbar Links:', navItems?.primaries);
    console.log('Dropdown Toggle Button:', navItems?.dropdownToggle);

    // Open More dropdown and verify secondary links
    console.log('Opening "More" dropdown...');
    await client.eval(`
      (() => {
        const toggle = document.querySelector('.dropdown-toggle');
        if (toggle) toggle.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 300));

    const dropdownContents = await client.eval(`
      (() => {
        const menu = document.querySelector('.dropdown-menu');
        if (!menu) return null;
        return Array.from(menu.querySelectorAll('.dropdown-item')).map(a => ({
          label: a.textContent.trim(),
          href: a.getAttribute('href')
        }));
      })()
    `);
    console.log('Dropdown Menu Items:', dropdownContents);

    // Close More dropdown
    await client.eval(`
      (() => {
        const toggle = document.querySelector('.dropdown-toggle');
        if (toggle) toggle.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    // Audit Mobile Drawer navigation items
    const mobileDrawerItems = await client.eval(`
      (() => {
        const drawer = document.querySelector('.mobile-drawer');
        if (!drawer) return null;
        const links = Array.from(drawer.querySelectorAll('.drawer-link')).map(a => ({
          label: a.querySelector('span')?.textContent?.trim(),
          href: a.getAttribute('href')
        }));
        const sectionLabel = drawer.querySelector('.drawer-section-label')?.textContent?.trim();
        return { links, sectionLabel };
      })()
    `);
    console.log('Mobile Drawer Links count:', mobileDrawerItems?.links?.length);
    console.log('Mobile Drawer Secondary Section Heading:', mobileDrawerItems?.sectionLabel);
    mobileDrawerItems?.links?.forEach(l => console.log(`  Drawer Link: ${l.label} (${l.href})`));

    // 7. Anchor Scroll & Offset Check
    console.log(`\n=== 7. Anchor Scroll Offset Test ===`);
    for (const targetId of ['achievements', 'education', 'certifications']) {
      await client.eval(`
        (() => {
          const el = document.getElementById('${targetId}');
          const navHeight = 75;
          const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top, behavior: 'instant' });
        })()
      `);
      await new Promise((r) => setTimeout(r, 400));

      const rect = await client.eval(`
        (() => {
          const el = document.getElementById('${targetId}');
          const bounding = el.getBoundingClientRect();
          return { top: Math.round(bounding.top), height: Math.round(bounding.height) };
        })()
      `);
      console.log(`Section #${targetId} bounding rect top after nav-offset scroll: ${rect.top}px (Expect ~75px)`);
    }

    // 8. Capture Screenshots for each restored section
    console.log(`\n=== 8. Capturing Section Screenshots ===`);
    
    // Screenshot 1: Achievements at 1440px
    await client.eval(`
      (() => {
        const el = document.getElementById('achievements');
        window.scrollTo({ top: el.offsetTop - 75, behavior: 'instant' });
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    const shotAchievements = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(targetDir, 'restored-achievements-1440.png'), Buffer.from(shotAchievements.data, 'base64'));
    console.log('Saved public/qa/restored-achievements-1440.png');

    // Screenshot 2: Education at 1440px
    await client.eval(`
      (() => {
        const el = document.getElementById('education');
        window.scrollTo({ top: el.offsetTop - 75, behavior: 'instant' });
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    const shotEducation = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(targetDir, 'restored-education-1440.png'), Buffer.from(shotEducation.data, 'base64'));
    console.log('Saved public/qa/restored-education-1440.png');

    // Screenshot 3: Certifications at 1440px
    await client.eval(`
      (() => {
        const el = document.getElementById('certifications');
        window.scrollTo({ top: el.offsetTop - 75, behavior: 'instant' });
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    const shotCertifications = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(targetDir, 'restored-certifications-1440.png'), Buffer.from(shotCertifications.data, 'base64'));
    console.log('Saved public/qa/restored-certifications-1440.png');

    // Screenshot 4: Mobile 390px
    console.log(`\n=== 9. Mobile Responsive QA & Screenshot (390px) ===`);
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.eval(`
      (() => {
        const el = document.getElementById('achievements');
        window.scrollTo({ top: el.offsetTop - 65, behavior: 'instant' });
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    const shotMobile = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(targetDir, 'restored-homepage-mobile-390.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('Saved public/qa/restored-homepage-mobile-390.png');

    // 10. Horizontal Overflow check across viewports
    console.log(`\n=== 10. Horizontal Overflow Audit Across 6 Viewports ===`);
    const viewports = [
      { name: 'Desktop Ultrawide', width: 1920, height: 1080 },
      { name: 'Desktop Standard', width: 1440, height: 900 },
      { name: 'Small Laptop / Tablet Landscape', width: 1024, height: 768 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Mobile Standard (iPhone 12/13/14)', width: 390, height: 844 },
      { name: 'Mobile Narrow (SE / Fold)', width: 320, height: 650 },
    ];

    let overflowFailed = false;
    for (const vp of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });
      await new Promise((r) => setTimeout(r, 250));

      const overflow = await client.eval(`
        (() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          const bodyW = document.body.scrollWidth;
          return {
            scrollWidth: docW,
            innerWidth: winW,
            bodyWidth: bodyW,
            hasOverflow: docW > winW || bodyW > winW
          };
        })()
      `);
      const status = overflow.hasOverflow ? 'FAIL - Overflow Detected!' : 'PASS (0 overflow)';
      console.log(`Viewport ${vp.width}x${vp.height} (${vp.name}): ${status} [doc: ${overflow.scrollWidth}px, win: ${overflow.innerWidth}px]`);
      if (overflow.hasOverflow) overflowFailed = true;
    }
    console.log(`\nHorizontal Overflow Summary: ${overflowFailed ? 'FAILED' : 'ALL 6 VIEWPORTS PASSED'}`);

    console.log('\n=== ALL QA CHECKS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error during QA execution:', err);
  } finally {
    client.close();
    chromeProcess.kill();
  }
}

run();
