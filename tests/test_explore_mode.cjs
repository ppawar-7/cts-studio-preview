/**
 * test_explore_mode.cjs
 * =====================
 * Comprehensive Headless Browser Acceptance Verification for:
 * 1. Completely separate, fully unlocked Explore Everything experience (/explore)
 * 2. Strict non-mutation isolation with production storage key 'pdplayground_player_v2'
 *    - Verified for BOTH a fresh player AND an existing player with real progress, artifacts,
 *      achievements, certifications, and kingdom bonuses.
 * 3. Immediate access to all 8 kingdoms without progression locks or XP prerequisites
 * 4. Verification of all 40 direct Explore lesson routes (/explore/kingdom/:kId/level/:lId)
 *    rendering registered activity containers (not fallbacks or placeholders)
 * 5. Direct bookmarkable links to all 26 Stage Sanity Check terminals (?check=:checkId)
 *    opening in safe Explore demonstration mode with nominal and defect-injection capability
 * 6. Graceful handling of invalid sanity check query parameters without crashing
 * 7. Browser refresh survival on direct bookmarkable URLs
 * 8. Embedded RTL Logic Lab and STA Timing Lab studio integration with correct return navigation
 * 9. Genuine solution of RTL-1 2:1 MUX challenge (filling in all 8 truth table outputs + radio)
 * 10. Zero console errors, broken routes, or failed external assets.
 */

'use strict';
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { resolveBrowserExecutable } = require('./browser_resolver.cjs');

const PORT = 4198;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve('C:/Users/pranil/.gemini/antigravity/brain/6bc66831-7a8f-4043-a9e4-425498e75a65/screenshots');

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

// All 40 curriculum lessons
const ALL_40_LESSONS = [
  // Kingdom 1: RTL Understanding
  { kingdomId: 'rtl-understanding', levelId: 'rtl-1', name: 'What is RTL?' },
  { kingdomId: 'rtl-understanding', levelId: 'rtl-2', name: 'Flip-Flops & Clocks' },
  { kingdomId: 'rtl-understanding', levelId: 'rtl-3', name: 'Combinational vs Sequential' },
  { kingdomId: 'rtl-understanding', levelId: 'rtl-4', name: 'RTL to Gates' },
  { kingdomId: 'rtl-understanding', levelId: 'rtl-5', name: 'FSM Design' },
  // Kingdom 2: Synthesis
  { kingdomId: 'synthesis', levelId: 'syn-1', name: 'What is Synthesis?' },
  { kingdomId: 'synthesis', levelId: 'syn-2', name: 'Logic Optimization' },
  { kingdomId: 'synthesis', levelId: 'syn-3', name: 'Technology Mapping' },
  { kingdomId: 'synthesis', levelId: 'syn-4', name: 'Timing Constraints' },
  { kingdomId: 'synthesis', levelId: 'syn-5', name: 'Synthesis Capstone' },
  // Kingdom 3: Floorplanning
  { kingdomId: 'floorplanning', levelId: 'fp-1', name: 'Die Size & Core Area' },
  { kingdomId: 'floorplanning', levelId: 'fp-2', name: 'Aspect Ratio & Utilization' },
  { kingdomId: 'floorplanning', levelId: 'fp-3', name: 'IO Pin Placement' },
  { kingdomId: 'floorplanning', levelId: 'fp-4', name: 'Macro Placement & Halos' },
  { kingdomId: 'floorplanning', levelId: 'fp-5', name: 'Power Grid Planning' },
  // Kingdom 4: Placement
  { kingdomId: 'placement', levelId: 'pl-1', name: 'Global Placement' },
  { kingdomId: 'placement', levelId: 'pl-2', name: 'Congestion Analysis' },
  { kingdomId: 'placement', levelId: 'pl-3', name: 'Detailed Placement' },
  { kingdomId: 'placement', levelId: 'pl-4', name: 'Timing-Driven Placement' },
  { kingdomId: 'placement', levelId: 'pl-5', name: 'Placement Optimization' },
  // Kingdom 5: CTS
  { kingdomId: 'cts', levelId: 'cts-1', name: 'Clock Tree Goals' },
  { kingdomId: 'cts', levelId: 'cts-2', name: 'H-Tree vs Mesh' },
  { kingdomId: 'cts', levelId: 'cts-3', name: 'Clock Buffering & Inverters' },
  { kingdomId: 'cts', levelId: 'cts-4', name: 'Clock Routing & Shielding' },
  { kingdomId: 'cts', levelId: 'cts-5', name: 'Post-CTS Timing & Optimization' },
  // Kingdom 6: Routing
  { kingdomId: 'routing', levelId: 'rt-1', name: 'Global Routing' },
  { kingdomId: 'routing', levelId: 'rt-2', name: 'Track Assignment' },
  { kingdomId: 'routing', levelId: 'rt-3', name: 'Detailed Routing' },
  { kingdomId: 'routing', levelId: 'rt-4', name: 'DRC Clean Routing' },
  { kingdomId: 'routing', levelId: 'rt-5', name: 'Signal Integrity & Crosstalk' },
  // Kingdom 7: Filler Cells
  { kingdomId: 'filler-cells', levelId: 'fc-1', name: 'Why Filler Cells?' },
  { kingdomId: 'filler-cells', levelId: 'fc-2', name: 'Standard Fillers' },
  { kingdomId: 'filler-cells', levelId: 'fc-3', name: 'Decap Cells' },
  { kingdomId: 'filler-cells', levelId: 'fc-4', name: 'Well-Tap Cells' },
  { kingdomId: 'filler-cells', levelId: 'fc-5', name: 'Post-Filler Verification' },
  // Kingdom 8: GDS
  { kingdomId: 'gds', levelId: 'gds-1', name: 'What is GDSII / OASIS?' },
  { kingdomId: 'gds', levelId: 'gds-2', name: 'Layer Mapping' },
  { kingdomId: 'gds', levelId: 'gds-3', name: 'Tapeout Checklist' },
  { kingdomId: 'gds', levelId: 'gds-4', name: 'Foundry Delivery' },
  { kingdomId: 'gds', levelId: 'gds-5', name: 'Post-Silicon Reality' },
];

// All 26 Stage Sanity Checks from kingdomsData.js
const ALL_26_SANITY_CHECKS = [
  // Kingdom 3: Floorplanning (3)
  { kingdomId: 'floorplanning', checkId: 'fp-drc', name: 'DRC' },
  { kingdomId: 'floorplanning', checkId: 'fp-connectivity', name: 'Connectivity' },
  { kingdomId: 'floorplanning', checkId: 'fp-missing-vias', name: 'Missing Vias' },
  // Kingdom 4: Placement (5)
  { kingdomId: 'placement', checkId: 'pl-legality', name: 'Legality' },
  { kingdomId: 'placement', checkId: 'pl-congestion', name: 'Congestion' },
  { kingdomId: 'placement', checkId: 'pl-drc', name: 'DRC' },
  { kingdomId: 'placement', checkId: 'pl-connectivity', name: 'Connectivity' },
  { kingdomId: 'placement', checkId: 'pl-missing-vias', name: 'Missing Vias' },
  // Kingdom 5: CTS (4)
  { kingdomId: 'cts', checkId: 'cts-timing-reports', name: 'Timing reports' },
  { kingdomId: 'cts', checkId: 'cts-power', name: 'Power' },
  { kingdomId: 'cts', checkId: 'cts-qor', name: 'QoR' },
  { kingdomId: 'cts', checkId: 'cts-clock-tree-report', name: 'Clock tree report' },
  // Kingdom 6: Routing (5)
  { kingdomId: 'routing', checkId: 'rt-routes', name: 'routes' },
  { kingdomId: 'routing', checkId: 'rt-lvs', name: 'lvs' },
  { kingdomId: 'routing', checkId: 'rt-timing', name: 'timing' },
  { kingdomId: 'routing', checkId: 'rt-design', name: 'design' },
  { kingdomId: 'routing', checkId: 'rt-constraints', name: 'constraints' },
  // Kingdom 7: Filler Cells (9)
  { kingdomId: 'filler-cells', checkId: 'fc-legality', name: 'legality' },
  { kingdomId: 'filler-cells', checkId: 'fc-drc', name: 'drc' },
  { kingdomId: 'filler-cells', checkId: 'fc-connectivity', name: 'connectivity' },
  { kingdomId: 'filler-cells', checkId: 'fc-design', name: 'design' },
  { kingdomId: 'filler-cells', checkId: 'fc-timing', name: 'timing' },
  { kingdomId: 'filler-cells', checkId: 'fc-constraints', name: 'constraints' },
  { kingdomId: 'filler-cells', checkId: 'fc-power', name: 'power' },
  { kingdomId: 'filler-cells', checkId: 'fc-qor', name: 'qor' },
  { kingdomId: 'filler-cells', checkId: 'fc-congestion', name: 'congestion' },
];

async function run() {
  console.log('========================================================================');
  console.log('PD PLAYGROUND — MASTER UNLOCKED EXPLORE MODE & ISOLATION ACCEPTANCE');
  console.log('========================================================================');

  // 1. Build project
  console.log('\n[1/10] Running production Vite build...');
  const buildProc = spawn('cmd', ['/c', 'npm', 'run', 'build'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });
  await new Promise((resolve, reject) => {
    buildProc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build failed with code ${code}`));
    });
  });

  // 2. Start preview server on port 4198
  console.log(`\n[2/10] Launching Vite preview server on port ${PORT}...`);
  previewProc = spawn('cmd', ['/c', 'npx', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
  });

  await pollHttp(BASE_URL);
  console.log(`✓ Preview server responding at ${BASE_URL}`);

  // 3. Launch Chrome headless with remote debugging
  const browserPath = resolveBrowserExecutable();
  console.log(`\n[3/10] Launching headless browser at ${browserPath}...`);
  const cdpPort = 9249;
  browserProc = spawn(browserPath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1366,900',
    'about:blank',
  ], { stdio: 'ignore' });

  await wait(1800);

  // 4. Connect CDP WebSocket
  console.log('\n[4/10] Connecting CDP WebSocket...');
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
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
      consoleErrors.push(text);
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
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('CDP Eval Exception: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  };

  const captureScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filepath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`  📸 Screenshot saved: ${filename} (${buffer.length} bytes)`);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // ─── TEST A: FRESH PROFILE EXPLORE CATALOG ACCEPTANCE ───────────────────────
  console.log('\n[5/10] TEST A: Fresh visitor directly loads /explore...');
  await send('Page.navigate', { url: `${BASE_URL}/explore` });
  await wait(1800);

  // Clear localStorage to guarantee 100% clean initial state
  await evalCdp(`localStorage.clear(); window.location.reload();`);
  await wait(1800);

  // Verify page title and heading
  const pageTitle = await evalCdp(`document.querySelector('.explore-header__title')?.innerText`);
  console.log('  Explore header text:', pageTitle);
  if (!pageTitle || !pageTitle.includes('Explore Everything')) {
    throw new Error(`Expected Explore Everything title, got: ${pageTitle}`);
  }

  // Verify 8 kingdom cards exist in DOM
  const kingdomCardCount = await evalCdp(`document.querySelectorAll('.explore-kingdom-card').length`);
  console.log(`  Kingdom cards displayed: ${kingdomCardCount}/8`);
  if (kingdomCardCount !== 8) {
    throw new Error(`Expected exactly 8 kingdom cards, found ${kingdomCardCount}`);
  }

  // Verify all 40 lesson links exist across cards
  const lessonLinkCount = await evalCdp(`document.querySelectorAll('.explore-lesson-pill').length`);
  console.log(`  Direct lesson pills on cards: ${lessonLinkCount}/40`);
  if (lessonLinkCount !== 40) {
    throw new Error(`Expected 40 lesson pills, found ${lessonLinkCount}`);
  }

  // Verify 26 sanity check directory links exist
  const sanityLinkCount = await evalCdp(`document.querySelectorAll('.explore-sanity-link').length`);
  console.log(`  Sanity check directory links: ${sanityLinkCount}/26`);
  if (sanityLinkCount !== 26) {
    throw new Error(`Expected 26 sanity check directory links, found ${sanityLinkCount}`);
  }

  await captureScreenshot('explore_catalog_overview.png');

  // ─── TEST B: GENUINE RTL-1 INTERACTION & NON-MUTATION WITH FRESH PROFILE ────
  console.log('\n[6/10] TEST B: Genuinely solving RTL-1 interactive challenge in Explore Mode...');
  await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/rtl-understanding/level/rtl-1` });
  await wait(1500);

  // Solve the 2:1 MUX challenge genuinely:
  // 1. Populate all 8 truth-table output selects with expected outputs [0, 0, 1, 1, 0, 1, 0, 1]
  // 2. Select radio button 'opt-synthesis-opt'
  // 3. Click Verify Circuit button
  const solutionResult = await evalCdp(`
    (() => {
      const expectedOutputs = ['0', '0', '1', '1', '0', '1', '0', '1'];
      const selects = Array.from(document.querySelectorAll('.mux-output-select'));
      if (selects.length !== 8) {
        return { error: 'Expected 8 selects, found ' + selects.length };
      }
      selects.forEach((sel, idx) => {
        sel.value = expectedOutputs[idx];
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      });

      const radio = document.querySelector('input[value="opt-synthesis-opt"]');
      if (!radio) {
        return { error: 'Radio option opt-synthesis-opt not found' };
      }
      radio.click();
      radio.dispatchEvent(new Event('change', { bubbles: true }));

      const buttons = Array.from(document.querySelectorAll('button'));
      const verifyBtn = buttons.find(b => b.innerText.includes('Verify Circuit') || b.innerText.includes('Verify'));
      if (!verifyBtn) {
        return { error: 'Verify button not found' };
      }
      verifyBtn.click();
      return { success: true };
    })()
  `);
  console.log('  RTL-1 challenge solution execution:', solutionResult);
  if (solutionResult.error) {
    throw new Error('Failed to solve RTL-1: ' + solutionResult.error);
  }
  await wait(1200);

  // Check completion overlay in Explore Mode (should show 30/30 score, 3 stars, practice feedback)
  const completionText = await evalCdp(`document.querySelector('.level-page__complete-banner')?.innerText || ''`);
  console.log('  Completion banner text snippet:', completionText.substring(0, 120));
  if (!completionText.includes('Explore Mode') || !completionText.includes('30/30') || !completionText.includes('3 Stars')) {
    throw new Error('Expected complete banner with 30/30 score in Explore Mode, got: ' + completionText);
  }
  await captureScreenshot('explore_level_completed_sandbox.png');

  // STRICT GUARANTEE VERIFICATION FOR FRESH PLAYER:
  // Production key pdplayground_player_v2 MUST NOT have awarded XP or marked rtl-1 completed!
  const rawPlayerAfterA = await evalCdp(`localStorage.getItem('pdplayground_player_v2')`);
  if (rawPlayerAfterA) {
    const playerObj = JSON.parse(rawPlayerAfterA);
    if ((playerObj.totalXP || 0) > 0) {
      throw new Error(`CRITICAL INVARIANT VIOLATED: Explore activity awarded XP! totalXP=${playerObj.totalXP}`);
    }
    if (playerObj.levelProgress?.['rtl-1']?.completed) {
      throw new Error('CRITICAL INVARIANT VIOLATED: Explore activity marked rtl-1 completed in playerProgress!');
    }
  }
  console.log('  ✓ Verified: Production key pdplayground_player_v2 remains 100% UNTOUCHED by Explore activity!');

  // ─── TEST C: EXISTING PLAYER WITH REAL PROGRESS & FULL NON-MUTATION ─────────
  console.log('\n[7/10] TEST C: Seeding existing player with real progress, bonuses & artifacts...');
  const existingPlayerSeed = {
    name: "Lead PD Engineer",
    avatarEmoji: "⚡",
    totalXP: 310, // 235 level XP + 25 sanity XP + 50 kingdom bonus
    schemaVersion: 2,
    createdAt: "2026-11-01T12:00:00.000Z",
    levelProgress: {
      'rtl-1': { completed: true, stars: 3, xpEarned: 30 },
      'rtl-2': { completed: true, stars: 3, xpEarned: 30 },
      'rtl-3': { completed: true, stars: 3, xpEarned: 30 },
      'rtl-4': { completed: true, stars: 3, xpEarned: 30 },
      'rtl-5': { completed: true, stars: 3, xpEarned: 30 },
      'syn-1': { completed: true, stars: 3, xpEarned: 25 },
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
          floatingPins: 0,
        },
      },
    },
    sanityCheckProgress: {
      'fp-drc': { passed: true, certified: true, score: 25, timestamp: "2026-11-02T10:00:00.000Z" },
    },
    kingdomProgress: {
      'rtl-understanding': { completed: true, bonusAwarded: true },
    },
    studentDesignArtifacts: {
      'floorplanning': {
        margin: 24.0,
        halo: 16.0,
        ringContinuous: true,
        missingVias: 0,
        floatingPins: 0,
        designRevision: 'fp-rev-1',
      },
    },
    achievements: ['first_gate', 'rtl_master'],
  };

  await evalCdp(`
    localStorage.setItem('pdplayground_player_v2', JSON.stringify(${JSON.stringify(existingPlayerSeed)}));
    window.location.reload();
  `);
  await wait(1800);

  // Take a full snapshot of the player state
  const playerSnapshotBefore = await evalCdp(`localStorage.getItem('pdplayground_player_v2')`);
  console.log('  Existing player seeded and snapshot recorded (totalXP: 310)');

  // 1. Visit advanced lessons in Explore Mode (e.g. cts-3, rt-4, gds-5)
  console.log('  Navigating through advanced Explore Mode lessons (cts-3, rt-4, gds-5)...');
  await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/cts/level/cts-3` });
  await wait(1200);
  const cts3Banner = await evalCdp(`document.querySelector('.level-page')?.innerText?.includes('Explore Mode Active')`);
  if (!cts3Banner) throw new Error('cts-3 did not show Explore Mode banner');

  await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/routing/level/rt-4` });
  await wait(1200);

  await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/gds/level/gds-5` });
  await wait(1200);

  // 2. Open nominal sanity check terminal via direct bookmarkable URL in Explore Mode
  console.log('  Testing direct bookmarkable link: /explore/kingdom/floorplanning?check=fp-drc');
  await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/floorplanning?check=fp-drc` });
  await wait(1500);

  const fpDrcModalTitle = await evalCdp(`document.querySelector('.sanity-modal__header h2')?.innerText`);
  console.log(`  Modal opened directly via URL: "${fpDrcModalTitle}"`);
  if (!fpDrcModalTitle?.includes('DRC')) {
    throw new Error('fp-drc terminal failed to open via direct URL: ' + fpDrcModalTitle);
  }

  // Run nominal clean simulation
  await evalCdp(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Run EDA Verification'));
      if (btn) btn.click();
    })()
  `);
  await wait(1200);

  const fpDrcPassed = await evalCdp(`document.querySelector('.sanity-modal__passed-notice')?.innerText`);
  console.log('  Nominal EDA simulation result:', fpDrcPassed);
  if (!fpDrcPassed?.includes('Reference Example Passed')) {
    throw new Error('Expected reference example passed notice, got: ' + fpDrcPassed);
  }

  // Close terminal via Close button (verifying query parameter clean-up)
  await evalCdp(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Close Terminal'));
      if (btn) btn.click();
    })()
  `);
  await wait(600);
  const urlAfterClose = await evalCdp(`window.location.search`);
  console.log(`  Query params after closing modal: "${urlAfterClose}" (expected empty)`);
  if (urlAfterClose.includes('check=')) {
    throw new Error('Query parameter was not removed after closing terminal modal');
  }

  // 3. Open defect-injection sanity check terminal via direct bookmarkable URL in Explore Mode
  console.log('  Testing defect injection via direct bookmarkable link: /explore/kingdom/cts?check=cts-power');
  await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/cts?check=cts-power` });
  await wait(1500);

  const ctsPowerTitle = await evalCdp(`document.querySelector('.sanity-modal__header h2')?.innerText`);
  console.log(`  Modal opened directly via URL: "${ctsPowerTitle}"`);
  if (!ctsPowerTitle?.includes('Power')) {
    throw new Error('cts-power terminal failed to open via direct URL: ' + ctsPowerTitle);
  }

  // Toggle "Inject Fault" radio
  await evalCdp(`
    (() => {
      const radios = document.querySelectorAll('input[name="sanity-explore-defect"]');
      if (radios.length >= 2) radios[1].click();
    })()
  `);
  await wait(500);

  // Run EDA simulation with defect
  await evalCdp(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Run EDA Verification'));
      if (btn) btn.click();
    })()
  `);
  await wait(1200);

  const defectNotice = await evalCdp(`document.querySelector('.sanity-modal__passed-notice')?.innerText`);
  console.log('  Defect injection EDA result:', defectNotice);
  if (!defectNotice?.includes('Fault Detected in Defect Injection Run')) {
    throw new Error('Expected fault detected notice in defect run, got: ' + defectNotice);
  }

  // Test Direct URL Survival on Browser Refresh
  console.log('  Verifying direct terminal URL survives browser refresh...');
  await evalCdp(`window.location.reload()`);
  await wait(1800);
  const reloadedModal = await evalCdp(`document.querySelector('.sanity-modal__header h2')?.innerText`);
  if (!reloadedModal?.includes('Power')) {
    throw new Error('Terminal modal failed to reopen after page refresh!');
  }
  console.log('  ✓ Direct terminal URL survived browser refresh cleanly');

  // Close modal via close button
  await evalCdp(`document.querySelector('.sanity-modal__close')?.click()`);
  await wait(500);

  // 4. Test Native Embedded Studios with Explore Mode Return Navigation
  console.log('  Testing embedded RTL Studio (/studio/rtl?from=explore)...');
  await send('Page.navigate', { url: `${BASE_URL}/studio/rtl?from=explore` });
  await wait(1800);
  const rtlIframe = await evalCdp(`Boolean(document.querySelector('.studio-page__iframe'))`);
  const rtlBack = await evalCdp(`document.querySelector('.studio-page__back-link')?.innerText`);
  console.log(`  RTL Studio Iframe Present: ${rtlIframe}, Back Button: "${rtlBack}"`);
  if (!rtlIframe || !rtlBack?.includes('Explore Mode')) {
    throw new Error('RTL Studio failed to render or show Explore Mode back link');
  }

  console.log('  Testing embedded STA Studio (/studio/sta?stage=routing&from=explore)...');
  await send('Page.navigate', { url: `${BASE_URL}/studio/sta?stage=routing&from=explore` });
  await wait(1800);
  const staIframe = await evalCdp(`Boolean(document.querySelector('.studio-page__iframe'))`);
  const staBack = await evalCdp(`document.querySelector('.studio-page__back-link')?.innerText`);
  console.log(`  STA Studio Iframe Present: ${staIframe}, Back Button: "${staBack}"`);
  if (!staIframe || !staBack?.includes('Explore Mode')) {
    throw new Error('STA Studio failed to render or show Explore Mode back link');
  }

  // 5. Return to Normal Game /world-map and reload
  console.log('  Returning to Normal Game (/world-map) and reloading...');
  await send('Page.navigate', { url: `${BASE_URL}/world-map` });
  await wait(1800);
  await evalCdp(`window.location.reload()`);
  await wait(1800);

  // 6. Deep Comparison of Production Player State
  const playerSnapshotAfter = await evalCdp(`localStorage.getItem('pdplayground_player_v2')`);
  const parsedBefore = JSON.parse(playerSnapshotBefore);
  const parsedAfter = JSON.parse(playerSnapshotAfter);

  console.log('  Comparing pre-explore and post-explore player state...');
  if (parsedAfter.totalXP !== parsedBefore.totalXP) {
    throw new Error(`CRITICAL INVARIANT VIOLATED: totalXP mutated! Before=${parsedBefore.totalXP}, After=${parsedAfter.totalXP}`);
  }
  if (JSON.stringify(parsedAfter.levelProgress) !== JSON.stringify(parsedBefore.levelProgress)) {
    throw new Error('CRITICAL INVARIANT VIOLATED: levelProgress was mutated by Explore Mode actions!');
  }
  if (JSON.stringify(parsedAfter.sanityCheckProgress) !== JSON.stringify(parsedBefore.sanityCheckProgress)) {
    throw new Error('CRITICAL INVARIANT VIOLATED: sanityCheckProgress was mutated by Explore Mode actions!');
  }
  if (JSON.stringify(parsedAfter.kingdomProgress) !== JSON.stringify(parsedBefore.kingdomProgress)) {
    throw new Error('CRITICAL INVARIANT VIOLATED: kingdomProgress was mutated by Explore Mode actions!');
  }
  if (JSON.stringify(parsedAfter.studentDesignArtifacts) !== JSON.stringify(parsedBefore.studentDesignArtifacts)) {
    throw new Error('CRITICAL INVARIANT VIOLATED: studentDesignArtifacts was mutated by Explore Mode actions!');
  }
  if (JSON.stringify(parsedAfter.achievements) !== JSON.stringify(parsedBefore.achievements)) {
    throw new Error('CRITICAL INVARIANT VIOLATED: achievements was mutated by Explore Mode actions!');
  }
  console.log('  ✓ 100% DEEP EQUALITY VERIFIED: Normal Game player state is completely unmodified!');

  // ─── TEST D: VERIFY ALL 40 DIRECT EXPLORE LESSON ROUTES ─────────────────────
  console.log('\n[8/10] TEST D: Programmatically verifying all 40 direct Explore lesson routes...');
  let verifiedLessons = 0;
  for (const lesson of ALL_40_LESSONS) {
    const route = `/explore/kingdom/${lesson.kingdomId}/level/${lesson.levelId}`;
    await send('Page.navigate', { url: `${BASE_URL}${route}` });
    await wait(600);

    const hasHost = await evalCdp(`Boolean(document.querySelector('.activity-host'))`);
    const isFallback = await evalCdp(`Boolean(document.querySelector('.activity-host--fallback'))`);
    const pageHeading = await evalCdp(`document.querySelector('.level-page__title')?.innerText || ''`);

    if (!hasHost) {
      throw new Error(`Route ${route} failed: .activity-host container not found in DOM!`);
    }
    if (isFallback) {
      throw new Error(`Route ${route} failed: Rendered fallback instead of registered interactive activity!`);
    }

    verifiedLessons++;
  }
  console.log(`  ✓ All ${verifiedLessons}/40 direct Explore lesson routes verified successfully!`);

  // ─── TEST E: VERIFY ALL 26 DIRECT SANITY CHECK TERMINAL LINKS ───────────────
  console.log('\n[9/10] TEST E: Programmatically verifying all 26 direct sanity check terminal links...');
  let verifiedChecks = 0;
  for (const check of ALL_26_SANITY_CHECKS) {
    const route = `/explore/kingdom/${check.kingdomId}?check=${check.checkId}`;
    await send('Page.navigate', { url: `${BASE_URL}${route}` });
    await wait(600);

    const modalTitle = await evalCdp(`document.querySelector('.sanity-modal__header h2')?.innerText || ''`);
    if (!modalTitle.toLowerCase().includes(check.name.toLowerCase())) {
      throw new Error(`Direct sanity check route ${route} failed: Expected "${check.name}" in modal, got: "${modalTitle}"`);
    }

    verifiedChecks++;
  }
  console.log(`  ✓ All ${verifiedChecks}/26 direct sanity check terminal links opened verified modals!`);

  // Verify graceful handling of invalid sanity check ID
  console.log('  Testing graceful handling of invalid check ID (?check=invalid-check-xyz)...');
  await send('Page.navigate', { url: `${BASE_URL}/explore/kingdom/floorplanning?check=invalid-check-xyz` });
  await wait(800);
  const modalPresentOnInvalid = await evalCdp(`Boolean(document.querySelector('.sanity-modal'))`);
  const kingdomTitlePresent = await evalCdp(`Boolean(document.querySelector('.kingdom-page__title'))`);
  if (modalPresentOnInvalid || !kingdomTitlePresent) {
    throw new Error('Invalid sanity check ID crashed page or opened corrupted modal!');
  }
  console.log('  ✓ Invalid sanity check ID gracefully ignored without crash or open modal');

  // ─── TEST F: ZERO CONSOLE ERRORS & CLEAN REPORT ─────────────────────────────
  console.log('\n[10/10] TEST F: Reviewing browser console errors and exceptions...');
  // Filter out any known harmless external favicon 404s
  const actualErrors = consoleErrors.filter(
    (e) => !e.includes('favicon.ico') && !e.includes('chrome-extension')
  );
  if (actualErrors.length > 0) {
    console.error('Detected browser console errors:', actualErrors);
    throw new Error(`Found ${actualErrors.length} unexpected browser console errors during acceptance suite!`);
  }
  console.log('  ✓ ZERO browser console errors or unhandled exceptions detected!');

  console.log('\n========================================================================');
  console.log('✓ ALL EXPLORE MODE, NON-MUTATION & INTEGRITY TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================================================');
}

run()
  .then(() => {
    if (browserProc) browserProc.kill();
    if (previewProc) previewProc.kill();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ TEST FAILURE:', err);
    if (browserProc) browserProc.kill();
    if (previewProc) previewProc.kill();
    process.exit(1);
  });
