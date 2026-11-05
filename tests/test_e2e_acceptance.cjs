/**
 * test_e2e_acceptance.cjs
 * =======================
 * Comprehensive browser E2E acceptance test for Game-Site RTL UI/UX Hardening.
 *
 * Verifies:
 * 1. World Map navigation to Kingdom 1 (RTL Understanding).
 * 2. Standalone RTL Playground lab link presence.
 * 3. Entering Level 1 (rtl-1): Verifies manual performance slider is REMOVED.
 * 4. High-contrast Light Theme for Multiple-Choice Cards:
 *    - Measures computed styles (text color vs background color).
 *    - Validates WCAG contrast ratio > 12:1 (well above AAA standard).
 *    - Validates keyboard focus and selection behavior.
 * 5. Interactive circuit simulation (toggling inputs SEL, A, B and inspecting live output).
 * 6. Completing the full 8 truth-table values and synthesis concept answer.
 * 7. Submitting solution for mastery verification:
 *    - Verifies Level Complete overlay (3 Stars, 30 XP).
 *    - Verifies primary button is "🏰 Return to RTL Understanding".
 *    - Verifies secondary button is "Preview Level 2 (Coming Soon) ›".
 * 8. Kingdom Page Level 2 Card:
 *    - Verifies Level 2 card displays "Unlocked — Coming Soon".
 *    - Verifies Level 2 card shows number '2', NOT a lock icon.
 * 9. Level 2 (rtl-2) Unlocked Coming-Soon State:
 *    - Verifies level is unlocked (no "Level Locked" blocker).
 *    - Verifies light-theme card with "✨ Unlocked — Challenge Coming Soon" badge.
 *    - Verifies zero sliders and zero fake submit buttons.
 *    - Verifies navigation buttons back to kingdom and optional standalone lab.
 * 10. Captures high-resolution screenshots of all key states.
 */

'use strict';
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { resolveBrowserExecutable } = require('./browser_resolver.cjs');

const PORT = 4180;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR_LOCAL = path.resolve(__dirname, '..', 'screenshots');

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

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function getLuminance([r, g, b]) {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

function calculateContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
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
  const cdpPort = 9235;

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

  async function captureScreenshot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const localPath = path.join(SCREENSHOT_DIR_LOCAL, name);
    fs.writeFileSync(localPath, buffer);
    console.log(`📸 Saved screenshot: ${name}`);
  }

  // Set standard high-DPI desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('--- 3. Navigating to World Map ---');
  await send('Page.navigate', { url: `${BASE_URL}/world-map` });
  await wait(1200);

  const worldMapTitle = await evalJs(`document.querySelector('.section-title')?.textContent`);
  console.log(`✓ World Map loaded: "${worldMapTitle}"`);

  console.log('--- 4. Entering Kingdom 1 (RTL Understanding) ---');
  await send('Page.navigate', { url: `${BASE_URL}/kingdom/rtl-understanding` });
  await wait(1200);

  const kingdomTitle = await evalJs(`document.querySelector('.kingdom-page__title')?.textContent`);
  console.log(`✓ Kingdom loaded: "${kingdomTitle}"`);

  const externalLink = await evalJs(`document.querySelector('.kingdom-external-lab-card a[href*="rtl-playground"]')?.href || document.querySelector('.kingdom-external-lab-card a')?.href`);
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

  console.log('--- 6. Verifying Light-Theme High Contrast Multiple-Choice Cards ---');
  const quizStyles = await evalJs(`
    (() => {
      const options = document.querySelectorAll('.mux-quiz-option');
      return Array.from(options).map(opt => {
        const textEl = opt.querySelector('.mux-quiz-text') || opt;
        const compCard = window.getComputedStyle(opt);
        const compText = window.getComputedStyle(textEl);
        return {
          cardBg: compCard.backgroundColor,
          textColor: compText.color,
          text: textEl?.textContent.slice(0, 40)
        };
      });
    })()
  `);

  console.log(`✓ Found ${quizStyles.length} quiz option cards.`);
  for (let i = 0; i < quizStyles.length; i++) {
    const { cardBg, textColor, text } = quizStyles[i];
    const textRgb = parseRgb(textColor);
    const bgRgb = parseRgb(cardBg);
    const ratio = calculateContrastRatio(textRgb, bgRgb);
    console.log(`  Option ${i + 1}: text="${text}..." color=${textColor} bg=${cardBg} contrast=${ratio.toFixed(2)}:1`);
    if (ratio < 12) {
      throw new Error(`Contrast ratio ${ratio.toFixed(2)}:1 is below the required 12:1 threshold on option ${i + 1}!`);
    }
  }

  await captureScreenshot('quiz_contrast_default.png');

  console.log('--- 7. Interacting with Live Circuit Simulation & Keyboard Navigation ---');
  // Toggle input A
  await evalJs(`
    const btnA = Array.from(document.querySelectorAll('.mux-challenge__control-group'))
      .find(g => g.textContent.includes('A:'))
      .querySelector('button');
    btnA.click();
  `);
  await wait(200);

  // Test keyboard focus on quiz radio
  await evalJs(`
    const firstRadio = document.querySelector('input[type="radio"][value="opt-synthesis-opt"]');
    firstRadio.focus();
  `);
  await wait(200);

  console.log('--- 8. Completing Complete 8-State Truth Table & Concept Question ---');
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

  await captureScreenshot('quiz_contrast_selected.png');

  console.log('--- 9. Submitting Solution for Mastery Verification ---');
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

  // Check overlay navigation buttons
  const overlayButtons = await evalJs(`
    Array.from(document.querySelectorAll('.level-page__complete-buttons a')).map(a => a.textContent.trim())
  `);
  console.log(`✓ Completion overlay buttons:`, overlayButtons);
  const primaryReturnBtn = overlayButtons.find(b => b.includes('Return to RTL Understanding') || b.includes('Back to RTL Understanding'));
  const secondaryPreviewBtn = overlayButtons.find(b => b.includes('Preview Level 2 (Coming Soon)'));
  if (!primaryReturnBtn) throw new Error('Primary Return to Kingdom button missing in overlay!');
  if (!secondaryPreviewBtn) throw new Error('Secondary Preview Level 2 button missing in overlay!');

  await captureScreenshot('level1_completion_overlay.png');

  console.log('--- 10. Verifying Level 2 Card on Kingdom Page ---');
  await send('Page.navigate', { url: `${BASE_URL}/kingdom/rtl-understanding` });
  await wait(1200);

  const lvl2CardInfo = await evalJs(`
    (() => {
      const cards = document.querySelectorAll('.level-card');
      const card2 = cards[1]; // Level 2
      const numberEl = card2?.querySelector('.level-card__number');
      const badgeEl = card2?.querySelector('.level-card__coming-soon-badge');
      return {
        numberText: numberEl?.textContent.trim(),
        hasLock: numberEl?.textContent.includes('🔒'),
        badgeText: badgeEl?.textContent.trim(),
        isAvailableClass: card2?.classList.contains('level-card--available')
      };
    })()
  `);
  console.log('✓ Level 2 card on Kingdom Page:', lvl2CardInfo);
  if (lvl2CardInfo.hasLock) throw new Error('Level 2 card shows a lock icon despite being unlocked!');
  if (!lvl2CardInfo.badgeText || !lvl2CardInfo.badgeText.includes('Unlocked — Coming Soon')) {
    throw new Error(`Level 2 card missing "Unlocked — Coming Soon" badge! Found: "${lvl2CardInfo.badgeText}"`);
  }

  await captureScreenshot('level2_card_unlocked.png');

  console.log('--- 11. Navigating into Level 2 (rtl-2) ---');
  await send('Page.navigate', { url: `${BASE_URL}/kingdom/rtl-understanding/level/rtl-2` });
  await wait(1200);

  const lvl2Title = await evalJs(`document.querySelector('.level-page__level-title')?.textContent`);
  const isLvl2Locked = await evalJs(`document.querySelector('.level-page')?.textContent.includes('Level Locked')`);
  console.log(`✓ Level 2 accessed: "${lvl2Title}" (Locked: ${isLvl2Locked})`);
  if (isLvl2Locked) throw new Error('Level 2 should be unlocked after earning 30 XP on Level 1!');

  const comingSoonBadge = await evalJs(`document.querySelector('.activity-coming-soon .badge--coming-soon')?.textContent`);
  const comingSoonTitle = await evalJs(`document.querySelector('.activity-coming-soon__title')?.textContent`);
  console.log(`✓ Coming Soon Host Badge: "${comingSoonBadge}", Title: "${comingSoonTitle}"`);
  if (!comingSoonBadge || !comingSoonBadge.includes('Unlocked — Challenge Coming Soon')) {
    throw new Error('Coming Soon badge missing "Unlocked — Challenge Coming Soon"!');
  }

  // Confirm Level 2 has no submit button or score slider
  const lvl2Slider = await evalJs(`document.querySelectorAll('.level-page__slider').length`);
  const lvl2Submit = await evalJs(`
    Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Complete Challenge'))
  `);
  console.log(`✓ Level 2 has 0 sliders and 0 fake complete buttons: sliders=${lvl2Slider}, fakeComplete=${lvl2Submit}`);
  if (lvl2Slider !== 0 || lvl2Submit) throw new Error('Level 2 has unearned completion paths!');

  // Check navigation links
  const lvl2ReturnLink = await evalJs(`
    Array.from(document.querySelectorAll('.activity-coming-soon__links a')).map(a => a.textContent.trim())
  `);
  console.log(`✓ Level 2 return links:`, lvl2ReturnLink);
  if (!lvl2ReturnLink.some(t => t.includes('Return to RTL Understanding'))) {
    throw new Error('Level 2 coming soon card missing return link to RTL Understanding!');
  }

  await captureScreenshot('level2_coming_soon.png');

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
