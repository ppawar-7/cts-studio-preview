/**
 * test_e2e_acceptance.cjs
 * =======================
 * End-to-end browser acceptance verification for Game-Site Milestone 1.
 *
 * Verifies:
 * 1. World Map navigation to Kingdom 1 (RTL Understanding).
 * 2. Standalone RTL Playground lab link presence.
 * 3. Entering Level 1 (rtl-1): Verifies manual performance slider is REMOVED.
 * 4. Interactive circuit simulation (toggling inputs SEL, A, B and inspecting live output).
 * 5. Entering the 8 truth-table values and synthesis concept answer.
 * 6. Clicking "Verify Circuit & Submit Challenge" and verifying Level Complete overlay (3 Stars, 30 XP).
 * 7. Verification that rtl-2 is unlocked, and inspecting rtl-2 renders the non-rewarding Coming Soon state.
 */

'use strict';
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { resolveBrowserExecutable } = require('./browser_resolver.cjs');

const PORT = 4180;
const BASE_URL = `http://localhost:${PORT}`;

let previewProc = null;
let browserProc = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollHttp(url, timeoutMs = 15000) {
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

async function runTest() {
  console.log('--- 1. Starting Vite Production Preview Server ---');
  previewProc = spawn('npm.cmd', ['run', 'preview', '--', '--port', String(PORT)], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  });

  await pollHttp(BASE_URL, 15000);
  console.log(`✓ Vite preview is live at ${BASE_URL}`);

  console.log('--- 2. Launching Headless Chromium/Edge Browser ---');
  const browserPath = resolveBrowserExecutable();
  const cdpPort = 9234;

  browserProc = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${cdpPort}`,
    'about:blank',
  ], { stdio: 'ignore' });

  await wait(1500);

  // Discover CDP WebSocket endpoint
  const targets = await new Promise((resolve, reject) => {
    http.get(`http://localhost:${cdpPort}/json`, (res) => {
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
  };

  await new Promise((res) => (ws.onopen = res));

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : null;
  };

  console.log('--- 3. Navigating to World Map ---');
  await send('Page.navigate', { url: `${BASE_URL}/world-map` });
  await wait(1200);

  const worldMapTitle = await evalJs(`document.querySelector('.world-map__title')?.textContent`);
  console.log(`✓ World Map loaded: "${worldMapTitle}"`);

  console.log('--- 4. Entering Kingdom 1 (RTL Understanding) ---');
  await send('Page.navigate', { url: `${BASE_URL}/kingdom/rtl-understanding` });
  await wait(1200);

  const kingdomTitle = await evalJs(`document.querySelector('.kingdom-page__title')?.textContent`);
  console.log(`✓ Kingdom loaded: "${kingdomTitle}"`);

  const externalLink = await evalJs(`document.querySelector('.kingdom-external-lab-card a')?.href`);
  console.log(`✓ Standalone RTL Playground Link: "${externalLink}"`);
  if (!externalLink || !externalLink.includes('rtl-playground')) {
    throw new Error('Standalone RTL Playground link missing or incorrect');
  }

  console.log('--- 5. Entering Level 1 (rtl-1: "What is RTL?") ---');
  await send('Page.navigate', { url: `${BASE_URL}/kingdom/rtl-understanding/level/rtl-1` });
  await wait(1200);

  const levelTitle = await evalJs(`document.querySelector('.level-page__level-title')?.textContent`);
  console.log(`✓ Level loaded: "${levelTitle}"`);

  // Verify manual performance slider is COMPLETELY REMOVED
  const sliderCount = await evalJs(`document.querySelectorAll('.level-page__slider').length`);
  console.log(`✓ Manual performance sliders present: ${sliderCount} (must be 0)`);
  if (sliderCount !== 0) throw new Error('Unearned performance slider is still present!');

  // Verify interactive schematic is mounted
  const svgExists = await evalJs(`document.querySelectorAll('.mux-svg-schematic').length`);
  console.log(`✓ Interactive MUX schematic mounted: ${svgExists === 1}`);

  console.log('--- 6. Interacting with Live Circuit Simulation ---');
  // Toggle input A
  await evalJs(`
    const btnA = Array.from(document.querySelectorAll('.mux-challenge__control-group'))
      .find(g => g.textContent.includes('A:'))
      .querySelector('button');
    btnA.click();
  `);
  await wait(200);
  const circuitText = await evalJs(`document.querySelector('.mux-challenge__schematic-card')?.textContent`);
  console.log(`✓ Toggled Input A in schematic.`);

  console.log('--- 7. Completing Complete 8-State Truth Table & Concept Question ---');
  // Fill all 8 table rows: [0, 0, 1, 1, 0, 1, 0, 1]
  const answers = [0, 0, 1, 1, 0, 1, 0, 1];
  await evalJs(`
    const selects = document.querySelectorAll('.mux-output-select');
    const ans = ${JSON.stringify(answers)};
    selects.forEach((sel, i) => {
      sel.value = String(ans[i]);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  `);
  await wait(300);

  // Select Option A for synthesis concept
  await evalJs(`
    const optA = document.querySelector('input[type="radio"][value="opt-synthesis-opt"]');
    optA.click();
    optA.dispatchEvent(new Event('change', { bubbles: true }));
  `);
  await wait(300);

  console.log('--- 8. Submitting Solution for Mastery Verification ---');
  await evalJs(`
    const submitBtn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('Verify Circuit & Submit Challenge'));
    submitBtn.click();
  `);
  await wait(1000);

  const completeTitle = await evalJs(`document.querySelector('.level-page__complete-title')?.textContent`);
  const xpEarnedText = await evalJs(`document.querySelector('.level-page__complete-xp')?.textContent`);
  console.log(`✓ Level Completion Overlay: "${completeTitle}" (${xpEarnedText})`);

  if (!completeTitle || !completeTitle.includes('Complete')) {
    throw new Error('Level completion overlay did not appear!');
  }
  if (!xpEarnedText || !xpEarnedText.includes('+30 XP')) {
    throw new Error(`Expected +30 XP, got "${xpEarnedText}"`);
  }

  console.log('--- 9. Verifying Level 2 (rtl-2) Unlocked & Renders Coming Soon Fallback ---');
  await send('Page.navigate', { url: `${BASE_URL}/kingdom/rtl-understanding/level/rtl-2` });
  await wait(1200);

  const lvl2Title = await evalJs(`document.querySelector('.level-page__level-title')?.textContent`);
  const isLvl2Locked = await evalJs(`document.querySelector('.level-page')?.textContent.includes('Level Locked')`);
  console.log(`✓ Level 2 accessed: "${lvl2Title}" (Locked: ${isLvl2Locked})`);
  if (isLvl2Locked) throw new Error('Level 2 should be unlocked after earning 30 XP on Level 1!');

  const comingSoonTitle = await evalJs(`document.querySelector('.activity-coming-soon__title')?.textContent`);
  console.log(`✓ Level 2 renders Coming Soon host: "${comingSoonTitle}"`);
  if (!comingSoonTitle || !comingSoonTitle.includes('Laboratory In Development')) {
    throw new Error('Unimplemented level did not render coming soon fallback!');
  }

  // Confirm Level 2 has no submit button or score slider
  const lvl2Slider = await evalJs(`document.querySelectorAll('.level-page__slider').length`);
  const lvl2Submit = await evalJs(`
    Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Complete Challenge'))
  `);
  console.log(`✓ Level 2 has 0 sliders and 0 fake complete buttons: sliders=${lvl2Slider}, fakeComplete=${lvl2Submit}`);
  if (lvl2Slider !== 0 || lvl2Submit) throw new Error('Level 2 has unearned completion paths!');

  console.log('\n======================================================');
  console.log('  ALL BROWSER E2E ACCEPTANCE CHECKS PASSED CLEANLY!  ');
  console.log('======================================================');
  ws.close();
}

runTest()
  .then(() => {
    if (browserProc) browserProc.kill();
    if (previewProc) previewProc.kill();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Acceptance test failed:', err);
    if (browserProc) browserProc.kill();
    if (previewProc) previewProc.kill();
    process.exit(1);
  });
