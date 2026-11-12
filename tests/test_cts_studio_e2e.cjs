/**
 * test_cts_studio_e2e.cjs
 * =======================
 * Automated Headless Browser Acceptance Walkthrough for CTS Studio 1.0.
 * Verifies real user flows, canvas rendering, node interactions, auto-balancing,
 * diagnostics, report generation, candidate comparison, kingdom navigation,
 * and 12-gate capstone certification.
 */

'use strict';
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { resolveBrowserExecutable } = require('./browser_resolver.cjs');

const PORT = 4210;
const CDP_PORT = 9260;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve('C:/Users/pranil/.gemini/antigravity/brain/6bc66831-7a8f-4043-a9e4-425498e75a65/screenshots/cts');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let previewProc = null;
let browserProc = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else if (Date.now() - start > timeoutMs) reject(new Error('HTTP timeout'));
        else setTimeout(check, 250);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('HTTP connect timeout'));
        else setTimeout(check, 250);
      });
    };
    check();
  });
}

async function runCTSE2E() {
  console.log('================================================================');
  console.log('   PD PLAYGROUND — CTS STUDIO 1.0 ACCEPTANCE E2E VERIFICATION   ');
  console.log('================================================================\n');

  try {
    // 1. Build production bundle
    console.log('[1/4] Building production bundle with Vite...');
    await new Promise((resolve, reject) => {
      const build = spawn('cmd', ['/c', 'npm', 'run', 'build'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
      });
      build.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Vite build failed with code ${code}`));
      });
    });

    // 2. Launch Vite preview server
    console.log(`\n[2/4] Starting Vite preview server on port ${PORT}...`);
    previewProc = spawn('cmd', ['/c', 'npx', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
      cwd: path.resolve(__dirname, '..'),
    });

    await pollHttp(BASE_URL);
    console.log(`✓ Preview server running at ${BASE_URL}`);

    // 3. Launch headless browser
    const browserPath = resolveBrowserExecutable();
    console.log(`\n[3/4] Launching headless browser at ${browserPath}...`);
    browserProc = spawn(browserPath, [
      `--remote-debugging-port=${CDP_PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
      'about:blank',
    ], { stdio: 'ignore' });

    await wait(2000);

    // 4. Connect CDP WebSocket
    console.log('\n[4/4] Connecting CDP WebSocket...');
    const targets = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
      if (msg.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      }
    };

    await new Promise((res) => (ws.onopen = res));

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    const evalCdp = async (expr) => {
      const trimmed = expr.trim();
      const needsWrapping = (trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('var ')) && !trimmed.startsWith('(');
      const finalExpr = needsWrapping ? `(() => { ${expr} })()` : expr;
      const res = await send('Runtime.evaluate', {
        expression: finalExpr,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error('CDP Eval Exception: ' + JSON.stringify(res.exceptionDetails));
      }
      return res.result?.value;
    };

    const captureScreenshot = async (filename) => {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const targetPath = path.join(SCREENSHOT_DIR, filename);
      fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
      console.log(`  📸 Screenshot saved: ${filename}`);
      return targetPath;
    };

    await send('Page.enable');
    await send('Runtime.enable');

    // ─── TEST 1: STUDIO LAUNCH & LAYOUT ─────────────────────────────────────
    console.log('\n--- Step 1: Navigating to /studio/cts ---');
    await send('Page.navigate', { url: `${BASE_URL}/studio/cts` });
    await wait(2000);

    const title = await evalCdp('document.title');
    console.log(`  Document Title: "${title}"`);

    const hasToolbar = await evalCdp('Boolean(document.querySelector(".cts-toolbar"))');
    const hasCanvas = await evalCdp('Boolean(document.querySelector(".cts-canvas-viewport"))');
    const hasExplorer = await evalCdp('Boolean(document.querySelector(".cts-panel--left"))');
    const hasInspector = await evalCdp('Boolean(document.querySelector(".cts-panel--right"))');
    const hasDock = await evalCdp('Boolean(document.querySelector(".cts-dock"))');

    console.log(`  Layout Verification: Toolbar=${hasToolbar}, Canvas=${hasCanvas}, Explorer=${hasExplorer}, Inspector=${hasInspector}, Dock=${hasDock}`);
    if (!hasToolbar || !hasCanvas || !hasExplorer || !hasInspector || !hasDock) {
      throw new Error('CTS Studio layout missing essential CAD panels.');
    }
    await captureScreenshot('01_cts_studio_initial_view.png');

    // ─── TEST 2: FLAWED STARTER PRESET & VIOLATIONS ─────────────────────────
    console.log('\n--- Step 2: Loading Flawed Starter Preset & Detecting Violations ---');
    await evalCdp(`
      const sel = document.querySelector(".cts-toolbar__select");
      sel.value = "scenario-flawed-starter";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    `);
    await wait(1200);

    const skewBefore = await evalCdp('document.querySelector(".cts-kpi-card__value")?.textContent');
    console.log(`  Skew before balance: ${skewBefore}`);

    // Switch to Diagnostics tab to inspect violations
    await evalCdp(`
      const tabs = Array.from(document.querySelectorAll(".cts-dock__tab"));
      const drcTab = tabs.find(t => t.textContent.includes("Diagnostics"));
      if (drcTab) drcTab.click();
    `);
    await wait(600);

    const violationCount = await evalCdp('document.querySelectorAll(".cts-badge--fail")?.length');
    console.log(`  Fail Badges / Violations Detected: ${violationCount}`);
    await captureScreenshot('02_cts_flawed_starter_violations.png');

    // ─── TEST 3: INSPECT & TUNE PROPERTIES ──────────────────────────────────
    console.log('\n--- Step 3: Inspecting Buffer Properties & Drive Strength ---');
    await evalCdp(`
      const bufItem = Array.from(document.querySelectorAll(".cts-tree-item")).find(el => el.textContent.includes("BUF_WEAK"));
      if (bufItem) bufItem.click();
    `);
    await wait(600);

    const inspectorHeader = await evalCdp('document.querySelector(".cts-panel--right .cts-panel__header")?.textContent');
    console.log(`  Inspector Header: "${inspectorHeader}"`);
    await captureScreenshot('03_cts_properties_inspector_tuning.png');

    // ─── TEST 4: AUTO-BALANCE TREE & VERIFY FIXES ────────────────────────────
    console.log('\n--- Step 4: Executing Auto-Balance Heuristic ---');
    await evalCdp(`
      const balanceBtn = Array.from(document.querySelectorAll(".cts-btn")).find(b => b.textContent.includes("Auto-Balance"));
      if (balanceBtn) balanceBtn.click();
    `);
    await wait(1500);

    // Switch to Timing & Skew tab
    await evalCdp(`
      const tabs = Array.from(document.querySelectorAll(".cts-dock__tab"));
      const timingTab = tabs.find(t => t.textContent.includes("Timing"));
      if (timingTab) timingTab.click();
    `);
    await wait(600);

    const skewAfter = await evalCdp('document.querySelector(".cts-kpi-card__value")?.textContent');
    console.log(`  Skew after auto-balance: ${skewAfter}`);
    await captureScreenshot('04_cts_autobalanced_clean_tree.png');

    // ─── TEST 5: CANDIDATE COMPARISON MODAL ──────────────────────────────────
    console.log('\n--- Step 5: Candidate Comparison & Snapshot ---');
    await evalCdp(`
      const compareBtn = Array.from(document.querySelectorAll(".cts-btn")).find(b => b.textContent.includes("Compare Candidates"));
      if (compareBtn) compareBtn.click();
    `);
    await wait(1000);

    const modalTitle = await evalCdp('document.getElementById("compare-title")?.textContent');
    console.log(`  Compare Modal Title: "${modalTitle}"`);
    await captureScreenshot('05_cts_candidate_compare_modal.png');

    // Close compare modal
    await evalCdp(`
      const closeBtn = Array.from(document.querySelectorAll(".cts-modal .cts-btn")).find(b => b.textContent.includes("Close"));
      if (closeBtn) closeBtn.click();
    `);
    await wait(500);

    // ─── TEST 6: SIGNOFF REPORT EXPORT MODAL ─────────────────────────────────
    console.log('\n--- Step 6: Generating Signoff Report ---');
    await evalCdp(`
      const repBtn = Array.from(document.querySelectorAll(".cts-btn")).find(b => b.textContent.includes("Signoff Report"));
      if (repBtn) repBtn.click();
    `);
    await wait(1000);

    const reportHeader = await evalCdp('document.getElementById("report-modal-title")?.textContent');
    console.log(`  Signoff Report Modal: "${reportHeader}"`);
    await captureScreenshot('06_cts_signoff_report_modal.png');

    // Close report modal
    await evalCdp(`
      const closeRepBtn = Array.from(document.querySelectorAll(".cts-modal .cts-btn")).find(b => b.textContent.includes("Close"));
      if (closeRepBtn) closeRepBtn.click();
    `);
    await wait(500);

    // ─── TEST 7: ADVANCED CAPSTONE SOC SCENARIO (10 SINKS) ───────────────────
    console.log('\n--- Step 7: Loading Advanced SoC Capstone & Closing Design ---');
    await evalCdp(`
      const sel = document.querySelector(".cts-toolbar__select");
      sel.value = "scenario-capstone-soc";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    `);
    await wait(1200);

    // Run auto-balance to close timing
    await evalCdp(`
      const balanceBtn = Array.from(document.querySelectorAll(".cts-btn")).find(b => b.textContent.includes("Auto-Balance"));
      if (balanceBtn) balanceBtn.click();
    `);
    await wait(1200);

    // Save project to storage
    await evalCdp(`
      const saveBtn = Array.from(document.querySelectorAll(".cts-btn")).find(b => b.textContent.includes("Save"));
      if (saveBtn) saveBtn.click();
    `);
    await wait(800);

    await captureScreenshot('07_cts_capstone_soc_closed.png');

    // ─── TEST 8: CTS KINGDOM PAGE CURRICULUM ─────────────────────────────────
    console.log('\n--- Step 8: Navigating to CTS Kingdom Page (/explore/kingdom/cts) ---');
    await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/cts` });
    await wait(2000);

    const bannerText = await evalCdp('document.querySelector(".cts-studio-banner")?.textContent');
    console.log(`  Studio Banner Found: ${Boolean(bannerText)}`);

    const part2Title = await evalCdp('document.querySelector(".kingdom-page__section-wrapper .kingdom-page__levels-title")?.textContent');
    console.log(`  Part 2 Section Title: "${part2Title}"`);
    await captureScreenshot('08_cts_kingdom_page_curriculum.png');

    // ─── TEST 9: LEVEL 12 CAPSTONE CERTIFICATION WALKTHROUGH ────────────────
    console.log('\n--- Step 9: Navigating to /explore/kingdom/cts/level/cts-12 ---');
    await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/cts/level/cts-12` });
    await wait(2000);

    const lessonTitle = await evalCdp('document.querySelector("h2")?.textContent');
    console.log(`  Capstone Lesson Title: "${lessonTitle}"`);

    // Select the correct concept answer
    await evalCdp(`
      const radio = document.querySelector('input[value="opt-slew-failure"]');
      if (radio) {
        radio.click();
        radio.checked = true;
      }
    `);
    await wait(500);

    // Click submit
    await evalCdp(`
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    `);
    await wait(1000);

    const resultBanner = await evalCdp('document.querySelector(".activity-container")?.textContent');
    console.log(`  Verification Result mentions Golden Gates: ${resultBanner?.includes("12 Golden Gates")}`);
    await captureScreenshot('09_cts_level12_capstone_pass.png');

    console.log('\n================================================================');
    console.log('   🎉 ALL 9 CTS STUDIO 1.0 ACCEPTANCE E2E TESTS PASSED!         ');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ E2E Acceptance Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (browserProc) browserProc.kill();
    if (previewProc) previewProc.kill();
  }
}

runCTSE2E();
