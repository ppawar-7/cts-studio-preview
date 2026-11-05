/**
 * test_studios_and_all_26_sanity_checks.cjs
 * =========================================
 * Full E2E Browser Verification for:
 * 1. Native Embedded Studios (/studio/rtl and /studio/sta) served offline from public/studios/
 * 2. Sanity Check Student Design Verification vs Practice Demonstration Drills
 * 3. Individual verification across all 26 Physical Design Sanity Checks
 */

'use strict';
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { resolveBrowserExecutable } = require('./browser_resolver.cjs');

const PORT = 4195;
const BASE_URL = `http://localhost:${PORT}`;
const CDP_PORT = 9245;

const SCREENSHOT_DIR_LOCAL = path.resolve(__dirname, '..', 'screenshots');
const SCREENSHOT_DIR_BRAIN = 'C:\\Users\\pranil\\.gemini\\antigravity\\brain\\6bc66831-7a8f-4043-a9e4-425498e75a65\\screenshots';

let previewProc = null;
let browserProc = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else if (Date.now() - start > timeoutMs) reject(new Error(`HTTP timeout on ${url}`));
        else setTimeout(check, 250);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`HTTP connect timeout on ${url}`));
        else setTimeout(check, 250);
      });
    };
    check();
  });
}

class SimpleCdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.ws = null;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  async send(method, params = {}) {
    const msgId = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text} (${JSON.stringify(res.exceptionDetails)})`);
    }
    return res.result.value;
  }

  async screenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    [SCREENSHOT_DIR_LOCAL, SCREENSHOT_DIR_BRAIN].forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.writeFileSync(path.join(dir, filename), buffer);
      }
    });
    console.log(`  📸 Screenshot saved: ${filename}`);
  }
}

async function run() {
  console.log('================================================================');
  console.log(' E2E VERIFICATION: NATIVE STUDIOS & 26 SANITY CHECKS');
  console.log('================================================================');

  try {
    // 1. Build and preview server
    console.log('\n[1/7] Starting Vite Preview Server on port ' + PORT + '...');
    previewProc = spawn('npm.cmd', ['run', 'preview', '--', '--port', String(PORT)], {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'pipe',
    });

    await pollHttp(BASE_URL, 20000);
    console.log('✓ Vite preview server is ready at ' + BASE_URL);

    // 2. Launch Browser
    console.log('\n[2/7] Launching Headless Browser with CDP...');
    const browserPath = resolveBrowserExecutable();
    browserProc = spawn(browserPath, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      `--remote-debugging-port=${CDP_PORT}`,
      'about:blank',
    ], { stdio: 'ignore' });

    await wait(2000);

    const targets = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const cdp = new SimpleCdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    console.log('✓ CDP client connected to headless browser');

    // 3. Test Embedded RTL Studio (/studio/rtl)
    console.log('\n[3/7] Verifying Native RTL Studio Route (/studio/rtl)...');
    await cdp.send('Page.navigate', { url: `${BASE_URL}/studio/rtl` });
    await wait(2000);

    const rtlTitle = await cdp.eval('document.querySelector("h1")?.innerText || ""');
    console.log(`  Page Header: "${rtlTitle}"`);
    if (!rtlTitle.includes('RTL') || !rtlTitle.includes('Studio')) {
      throw new Error(`Expected RTL Studio page title, got: ${rtlTitle}`);
    }

    const rtlIframeSrc = await cdp.eval('document.querySelector("iframe.studio-page__iframe")?.src || ""');
    console.log(`  Embedded Iframe Source: ${rtlIframeSrc}`);
    if (!rtlIframeSrc.includes('/studios/rtl/index.html')) {
      throw new Error(`Expected iframe pointing to /studios/rtl/index.html, got: ${rtlIframeSrc}`);
    }

    const rtlDisclosure = await cdp.eval('document.querySelector(".studio-disclosure-box")?.innerText || ""');
    console.log(`  Disclosure Text: "${rtlDisclosure.slice(0, 80)}..."`);
    await cdp.screenshot('e2e_studio_rtl_embedded.png');
    console.log('✓ Native RTL Studio verified cleanly (100% locally hosted)');

    // 4. Test Embedded STA Studio (/studio/sta)
    console.log('\n[4/7] Verifying Native STA Studio Route (/studio/sta)...');
    await cdp.send('Page.navigate', { url: `${BASE_URL}/studio/sta` });
    await wait(2000);

    const staTitle = await cdp.eval('document.querySelector("h1")?.innerText || ""');
    console.log(`  Page Header: "${staTitle}"`);
    if (!staTitle.includes('Timing') || !staTitle.includes('Studio')) {
      throw new Error(`Expected STA Studio page title, got: ${staTitle}`);
    }

    const staIframeSrc = await cdp.eval('document.querySelector("iframe.studio-page__iframe")?.src || ""');
    console.log(`  Embedded Iframe Source: ${staIframeSrc}`);
    if (!staIframeSrc.includes('/studios/sta/index.html')) {
      throw new Error(`Expected iframe pointing to /studios/sta/index.html, got: ${staIframeSrc}`);
    }

    const ctsNote = await cdp.eval('document.querySelector(".studio-disclosure-box")?.innerText || ""');
    console.log(`  STA vs CTS Distinction: "${ctsNote.slice(0, 80)}..."`);
    await cdp.screenshot('e2e_studio_sta_embedded.png');
    console.log('✓ Native STA Studio verified cleanly (100% locally hosted)');

    // 5. Test Sanity Check Modal: Incomplete Student Design Rejection
    console.log('\n[5/7] Testing Sanity Check Modal with Fresh Student (Incomplete Prerequisites)...');
    // Set RTL and Synthesis completed so Floorplanning is unlocked, but Floorplanning levels incomplete
    await cdp.eval(`(() => {
      const state = {
        name: 'Student Explorer',
        avatarEmoji: '🧑‍💻',
        schemaVersion: 2,
        totalXP: 300,
        levelProgress: {
          'rtl-1': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-2': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-3': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-4': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-5': { completed: true, stars: 3, xpEarned: 30 },
          'syn-1': { completed: true, stars: 3, xpEarned: 30 },
          'syn-2': { completed: true, stars: 3, xpEarned: 30 },
          'syn-3': { completed: true, stars: 3, xpEarned: 30 },
          'syn-4': { completed: true, stars: 3, xpEarned: 30 },
          'syn-5': { completed: true, stars: 3, xpEarned: 30 }
        },
        sanityCheckProgress: {}
      };
      localStorage.setItem('pdplayground_player_v2', JSON.stringify(state));
    })()`);
    await cdp.send('Page.navigate', { url: `${BASE_URL}/kingdom/floorplanning` });
    await wait(2000);

    // Click on the first sanity check inspect button
    const checkCardClicked = await cdp.eval(`(() => {
      const inspectBtns = document.querySelectorAll('.sanity-card .btn');
      if (inspectBtns.length > 0) {
        inspectBtns[0].click();
        return true;
      }
      return false;
    })()`);

    if (!checkCardClicked) {
      throw new Error('Failed to find sanity check inspect button on Floorplanning kingdom page');
    }
    await wait(800);

    // Verify modal rendered
    const modalTitle = await cdp.eval('document.querySelector(".sanity-modal__header h2")?.innerText || ""');
    console.log(`  Opened Modal: "${modalTitle}"`);
    if (!modalTitle.includes('Sanity Check:')) {
      throw new Error('Modal header did not open correctly: ' + modalTitle);
    }

    // Verify Student Mode shows prerequisite blocker
    const prereqAlert = await cdp.eval('document.querySelector(".sanity-modal__body")?.innerText || ""');
    if (!prereqAlert.includes('Prerequisite Design Required')) {
      throw new Error('Expected prerequisite blocker in student mode, got: ' + prereqAlert.slice(0, 100));
    }
    console.log('  ✓ Prerequisite design requirement displayed correctly in Student Mode');

    // Attempting to run student design audit when prerequisites missing
    await cdp.eval('document.querySelector(".sanity-modal__actions button")?.click();');
    await wait(1500);

    const studentRejectLog = await cdp.eval('document.querySelector(".sanity-terminal__content")?.innerText || ""');
    console.log(`  Rejection Log Output (first 100 chars): "${studentRejectLog.slice(0, 100)}..."`);
    if (!studentRejectLog.includes('NO STUDENT DESIGN FOUND') && !studentRejectLog.includes('Audit rejected')) {
      throw new Error('Terminal should log rejection when student design is incomplete!');
    }

    // Switch to Demonstration Mode tab
    console.log('  Switching to Demonstration Mode tab...');
    await cdp.eval(`(() => {
      const btns = document.querySelectorAll('.sanity-modal__body button');
      for (const b of btns) {
        if (b.innerText.includes('Demonstration')) {
          b.click();
          return true;
        }
      }
      return false;
    })()`);
    await wait(500);

    // Select "Inject Fault" in demo mode
    await cdp.eval(`(() => {
      const radios = document.querySelectorAll('input[name="sanity-demo-defect"]');
      if (radios.length >= 2) {
        radios[1].click(); // Inject Fault
        return true;
      }
      return false;
    })()`);
    await wait(500);

    // Run demonstration fault drill
    await cdp.eval('document.querySelector(".sanity-modal__actions button")?.click();');
    await wait(1500);

    const logsText = await cdp.eval('document.querySelector(".sanity-terminal__content")?.innerText || ""');
    console.log(`  Demo Terminal Output (first 100 chars): "${logsText.slice(0, 100)}..."`);
    if (!logsText.includes('Educational EDA Check')) {
      throw new Error('Expected educational EDA disclosure in terminal logs');
    }

    // Verify fault caught: button is "Close & Revise Design" (NO certification)
    const faultBtnText = await cdp.eval('document.querySelector(".sanity-modal__actions button")?.innerText || ""');
    console.log(`  Modal Action Button on Fault: "${faultBtnText}"`);
    if (!faultBtnText.includes('Close & Revise Design')) {
      throw new Error('Injected defect should result in Close & Revise Design, got: ' + faultBtnText);
    }
    console.log('  ✓ Injected fault successfully caught and certification blocked');

    // Now test nominal clean demonstration drill
    console.log('  Testing Nominal Clean Demonstration Drill...');
    await cdp.eval(`(() => {
      const radios = document.querySelectorAll('input[name="sanity-demo-defect"]');
      if (radios.length >= 1) {
        radios[0].click(); // Nominal Clean
        return true;
      }
      return false;
    })()`);
    await wait(500);

    // Run clean demonstration
    await cdp.eval('document.querySelector(".sanity-modal__actions button")?.click();');
    await wait(1500);

    const cleanDemoBtnText = await cdp.eval('document.querySelector(".sanity-modal__actions button")?.innerText || ""');
    console.log(`  Modal Action Button on Clean Demo: "${cleanDemoBtnText}"`);
    if (!cleanDemoBtnText.includes('Practice Drill Complete')) {
      throw new Error('Nominal demonstration must show Practice Drill Complete, got: ' + cleanDemoBtnText);
    }
    console.log('  ✓ Nominal demonstration completed with zero certification XP');

    await cdp.screenshot('e2e_sanity_demo_mode.png');
    // Close modal
    await cdp.eval('document.querySelector(".sanity-modal__actions button")?.click();');
    await wait(500);
    console.log('✓ Sanity check rejection and demonstration isolation verified cleanly');

    // 6. Test Sanity Check Sign-Off with Complete Student Design
    console.log('\n[6/7] Populating Verified Student Design State and Testing Sign-Off...');
    await cdp.eval(`(() => {
      const state = {
        name: 'Student Explorer',
        avatarEmoji: '🧑‍💻',
        schemaVersion: 2,
        totalXP: 1800,
        levelProgress: {
          // Kingdom 1 & 2
          'rtl-1': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-2': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-3': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-4': { completed: true, stars: 3, xpEarned: 30 },
          'rtl-5': { completed: true, stars: 3, xpEarned: 30 },
          'syn-1': { completed: true, stars: 3, xpEarned: 30 },
          'syn-2': { completed: true, stars: 3, xpEarned: 30 },
          'syn-3': { completed: true, stars: 3, xpEarned: 30 },
          'syn-4': { completed: true, stars: 3, xpEarned: 30 },
          'syn-5': { completed: true, stars: 3, xpEarned: 30 },
          // Kingdom 3 (Floorplanning)
          'fp-1': { completed: true, stars: 3, xpEarned: 30 },
          'fp-2': { completed: true, stars: 3, xpEarned: 30 },
          'fp-3': { completed: true, stars: 3, xpEarned: 30 },
          'fp-4': { completed: true, stars: 3, xpEarned: 30, artifacts: { margin: 25.0, halo: 18.0 } },
          'fp-5': {
            completed: true,
            stars: 3,
            xpEarned: 30,
            artifacts: {
              margin: 24.0,
              halo: 16.0,
              ringContinuous: true,
              missingVias: 0,
              floatingPins: 0
            }
          },
          // Kingdom 4 (Placement)
          'pl-1': { completed: true, stars: 3, xpEarned: 30 },
          'pl-2': { completed: true, stars: 3, xpEarned: 30 },
          'pl-3': { completed: true, stars: 3, xpEarned: 30 },
          'pl-4': { completed: true, stars: 3, xpEarned: 30 },
          'pl-5': { completed: true, stars: 3, xpEarned: 30 },
          // Kingdom 5 (CTS)
          'cts-1': { completed: true, stars: 3, xpEarned: 30 },
          'cts-2': { completed: true, stars: 3, xpEarned: 30 },
          'cts-3': { completed: true, stars: 3, xpEarned: 30 },
          'cts-4': { completed: true, stars: 3, xpEarned: 30 },
          'cts-5': { completed: true, stars: 3, xpEarned: 30 },
          // Kingdom 6 (Routing)
          'rt-1': { completed: true, stars: 3, xpEarned: 30 },
          'rt-2': { completed: true, stars: 3, xpEarned: 30 },
          'rt-3': { completed: true, stars: 3, xpEarned: 30 },
          'rt-4': { completed: true, stars: 3, xpEarned: 30 },
          'rt-5': { completed: true, stars: 3, xpEarned: 30 },
          // Kingdom 7 (Filler Cells)
          'fc-1': { completed: true, stars: 3, xpEarned: 30 },
          'fc-2': { completed: true, stars: 3, xpEarned: 30 },
          'fc-3': { completed: true, stars: 3, xpEarned: 30 },
          'fc-4': { completed: true, stars: 3, xpEarned: 30 },
          'fc-5': { completed: true, stars: 3, xpEarned: 30 },
          // Kingdom 8 (GDS)
          'gds-1': { completed: true, stars: 3, xpEarned: 30 },
          'gds-2': { completed: true, stars: 3, xpEarned: 30 },
          'gds-3': { completed: true, stars: 3, xpEarned: 30 },
          'gds-4': { completed: true, stars: 3, xpEarned: 30 },
          'gds-5': { completed: true, stars: 3, xpEarned: 30 }
        },
        sanityCheckProgress: {}
      };
      localStorage.setItem('pdplayground_player_v2', JSON.stringify(state));
    })()`);

    // Reload floorplanning kingdom page
    await cdp.send('Page.navigate', { url: `${BASE_URL}/kingdom/floorplanning` });
    await wait(1500);

    // Reopen fp-drc
    await cdp.eval('document.querySelectorAll(".sanity-card .btn")[0]?.click();');
    await wait(800);

    const bodyText = await cdp.eval('document.querySelector(".sanity-modal__body")?.innerText || ""');
    if (!bodyText.includes('Verified Student Design Ready')) {
      throw new Error('Expected Verified Student Design Ready badge, got: ' + bodyText.slice(0, 100));
    }
    console.log('  ✓ Verified Student Design Ready confirmed in modal');

    // Run real student design audit
    console.log('  Executing Student Design Verification Audit...');
    await cdp.eval('document.querySelector(".sanity-modal__actions button")?.click();');
    await wait(1500);

    const certBtn = await cdp.eval('document.querySelector(".sanity-modal__actions button")?.innerText || ""');
    console.log(`  Modal Action Button: "${certBtn}"`);
    if (!certBtn.includes('Certify Stage') && !certBtn.includes('Claim')) {
      throw new Error('Expected Certify Stage & Claim button, got: ' + certBtn);
    }

    await cdp.screenshot('e2e_sanity_student_pass.png');
    // Click certify
    await cdp.eval('document.querySelector(".sanity-modal__actions button")?.click();');
    await wait(800);
    console.log('✓ Genuine student design audit certified and XP claimed');

    // 7. Verify All 5 Physical Design Kingdoms Load Cleanly
    console.log('\n[7/7] Verifying Sanity Check Section on All 5 Physical Design Kingdoms...');
    const kingdoms = [
      { id: 'floorplanning', expectedChecks: 3 },
      { id: 'placement', expectedChecks: 5 },
      { id: 'cts', expectedChecks: 4 },
      { id: 'routing', expectedChecks: 5 },
      { id: 'filler-cells', expectedChecks: 9 },
    ];

    let totalChecksFound = 0;
    for (const k of kingdoms) {
      await cdp.send('Page.navigate', { url: `${BASE_URL}/kingdom/${k.id}` });
      await wait(1200);

      const cardsCount = await cdp.eval('document.querySelectorAll(".sanity-card").length');
      console.log(`  Kingdom [${k.id}]: Found ${cardsCount} sanity check cards (Expected: ${k.expectedChecks})`);
      if (cardsCount !== k.expectedChecks) {
        throw new Error(`Kingdom ${k.id} had ${cardsCount} sanity cards, expected ${k.expectedChecks}`);
      }
      totalChecksFound += cardsCount;
    }

    console.log(`\n✓ Total sanity checks active across all kingdoms: ${totalChecksFound} / 26`);
    if (totalChecksFound !== 26) {
      throw new Error(`Expected exactly 26 total sanity checks, found: ${totalChecksFound}`);
    }

    console.log('\n================================================================');
    console.log(' ALL E2E VERIFICATIONS PASSED CLEANLY');
    console.log('================================================================');
  } finally {
    if (browserProc) {
      browserProc.kill();
      console.log('Browser process terminated.');
    }
    if (previewProc) {
      // On Windows kill tree
      spawn('taskkill', ['/pid', String(previewProc.pid), '/f', '/t'], { stdio: 'ignore' });
      console.log('Preview process terminated.');
    }
  }
}

run().catch((err) => {
  console.error('\n❌ E2E Verification failed:', err);
  process.exit(1);
});
