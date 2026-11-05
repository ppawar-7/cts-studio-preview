/**
 * review_floorplan_studio_browser.cjs
 * ===================================
 * Independent acceptance regression suite for the Floorplan Studio, driven with
 * REAL pointer, wheel and keyboard input through Playwright (no synthetic
 * `dispatchEvent` shortcuts, no setting input values to fake a drag).
 *
 * Usage (Linux/macOS/Windows):
 *   npm run build
 *   npx vite preview --port 4300 --strictPort &
 *   BASE=http://localhost:4300 node tests/review_floorplan_studio_browser.cjs
 *
 * Optional: SHOTS=/path/to/dir to save screenshots.
 * Exit code 0 only when every check passes.
 */

'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4300';
const SHOTS = process.env.SHOTS || '';
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

async function shot(page, name, opts = {}) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name + '.png'), ...opts });
}

function overlaps(a, b) {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.5 &&
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.5;
}

async function macroBody(page, id) {
  return page.locator(`[data-testid="macro-${id}"] [data-role="macro-body"], [data-testid="macro-${id}"] rect:nth-of-type(2)`).first();
}

async function freshPage(browser, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  page._logs = [];
  page._dialogs = [];
  page.on('console', (m) => { if (m.type() === 'error') page._logs.push(m.text()); });
  page.on('pageerror', (e) => page._logs.push('pageerror: ' + e.message));
  page.on('dialog', (d) => { page._dialogs.push(d.message()); d.accept().catch(() => {}); });
  return { context, page };
}

async function section(fn) {
  try {
    await fn();
  } catch (e) {
    check('section completed without crashing', false, String(e.message).split('\n')[0]);
  }
}

(async () => {
  const browser = await chromium.launch();

  // ── 1. Desktop studio: metrics, drag, undo, pan, zoom ─────────────────────
  await section(async () => {
    const { context, page } = await freshPage(browser);
    await page.goto(BASE + '/studio/floorplanning');
    await page.waitForSelector('[data-testid="fp-canvas"]');
    await shot(page, 'studio_1440');

    const ir = (await page.textContent('[data-testid="metric-ir-drop"]')) || '';
    check('IR-drop metric is a finite number', /\d/.test(ir) && !/NaN/.test(ir), ir.trim());

    const canvasBox = await page.locator('[data-testid="fp-canvas"]').boundingBox();
    const dieBox = await page.locator('[data-testid="die-boundary"], .fp-studio-canvas__svg rect[rx="4"]').first().boundingBox();
    const fill = Math.max(dieBox.width / canvasBox.width, dieBox.height / canvasBox.height);
    check('Die fills at least 70% of the canvas in one axis on load', fill >= 0.7, `fill=${(fill * 100).toFixed(0)}%`);

    const studioBottom = await page.evaluate(() => document.querySelector('[data-testid="analysis-panel"]').getBoundingClientRect().bottom);
    check('Analysis panel fully visible at 1440×900 (no clipped metrics)', studioBottom <= 900 + 0.5, `bottom=${studioBottom.toFixed(0)}`);

    const tabBg = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="tab-properties"]')).backgroundColor);
    check('Inspector tabs are styled (not browser default buttons)', tabBg !== 'rgb(239, 239, 239)' && tabBg !== 'rgb(240, 240, 240)', tabBg);

    // Real drag
    const body = await macroBody(page, 'SRAM_DATA');
    const b0 = await body.boundingBox();
    const sx = b0.x + b0.width / 2;
    const sy = b0.y + b0.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(sx + 12 * i, sy + 6 * i);
    await page.mouse.up();
    const b1 = await body.boundingBox();
    const dx = b1.x - b0.x;
    const dy = b1.y - b0.y;
    // grid snap is 5 µm; allow one grid step of on-screen error
    const pxPerUm = b0.width / 80;
    const tol = 5 * pxPerUm + 1;
    check('Dragged macro follows the cursor (120, 60 px)', Math.abs(dx - 120) <= tol && Math.abs(dy - 60) <= tol, `moved (${dx.toFixed(1)}, ${dy.toFixed(1)}) tol ${tol.toFixed(1)}`);
    const xAfter = Number(await page.inputValue('[data-testid="input-macro-x"]'));
    const expectX = 60 + 120 / pxPerUm;
    check('Inspector X updates to the dragged world coordinate', Math.abs(xAfter - expectX) <= 5.01, `x=${xAfter}, expected≈${expectX.toFixed(1)}`);

    await page.keyboard.press('Control+z');
    const xUndo = Number(await page.inputValue('[data-testid="input-macro-x"]'));
    check('Ctrl+Z undoes a canvas drag', xUndo === 60, `x after undo=${xUndo}`);
    await page.keyboard.press('Control+y');
    const xRedo = Number(await page.inputValue('[data-testid="input-macro-x"]'));
    check('Ctrl+Y redoes the drag', xRedo === xAfter, `x after redo=${xRedo}`);

    // Pan by dragging empty canvas
    const before = await body.boundingBox();
    const px = canvasBox.x + 12;
    const py = canvasBox.y + canvasBox.height - 60;
    await page.mouse.move(px, py);
    await page.mouse.down();
    await page.mouse.move(px + 80, py - 30, { steps: 6 });
    await page.mouse.up();
    const after = await body.boundingBox();
    check('Pan moves content 1:1 with the cursor', Math.abs(after.x - before.x - 80) <= 1.5 && Math.abs(after.y - before.y + 30) <= 1.5,
      `content moved (${(after.x - before.x).toFixed(1)}, ${(after.y - before.y).toFixed(1)})`);

    // Wheel zoom about cursor
    const anchor = await body.boundingBox();
    const ax = anchor.x + 5;
    const ay = anchor.y + 5;
    page._logs.length = 0;
    await page.mouse.move(ax, ay);
    await page.mouse.wheel(0, -240);
    await page.waitForTimeout(150);
    const zoomed = await body.boundingBox();
    const zoomText = await page.textContent('.fp-canvas-status');
    check('Wheel zoom changes zoom level', !/Zoom: 100%/.test(zoomText), zoomText.split('|')[0].trim());
    check('Wheel zoom keeps the point under the cursor fixed', Math.abs(zoomed.x - anchor.x) <= 6 && Math.abs(zoomed.y - anchor.y) <= 6,
      `macro corner drift (${(zoomed.x - anchor.x).toFixed(1)}, ${(zoomed.y - anchor.y).toFixed(1)})`);
    check('Wheel zoom raises no passive-listener console error', !page._logs.some((l) => /passive/i.test(l)), page._logs.join(' | '));

    await page.click('[data-testid="btn-fit-view"], button:has-text("Fit")');
    const fitBox = await page.locator('.fp-studio-canvas__svg rect[rx="4"]').first().boundingBox();
    check('Fit restores the full die into view', fitBox.x >= canvasBox.x - 1 && fitBox.x + fitBox.width <= canvasBox.x + canvasBox.width + 1);

    // Orientation sequence through the inspector
    await page.click('[data-testid="explorer-item-macro-SRAM_INST"]');
    const dims = [];
    for (const o of ['R90', 'R270', 'R0']) {
      await page.selectOption('[data-testid="select-macro-orient"]', o);
      const t = await page.textContent('[data-testid="macro-SRAM_INST"]');
      dims.push(`${o}:${(t.match(/\[(\d+)×(\d+)\]/) || [])[0]}`);
    }
    check('Orientation R90→R270→R0 gives 60×80, 60×80, 80×60', dims.join(' ') === 'R90:[60×80] R270:[60×80] R0:[80×60]', dims.join(' '));

    // Inspector typing produces exactly one undo step per edit
    await page.fill('[data-testid="input-macro-x"]', '250');
    await page.locator('[data-testid="input-macro-x"]').blur();
    await page.click('[data-testid="fp-canvas"]', { position: { x: 5, y: 5 } }).catch(() => {});
    await page.click('[data-testid="explorer-item-macro-SRAM_INST"]');
    await page.keyboard.press('Control+z');
    const xi = Number(await page.inputValue('[data-testid="input-macro-x"]'));
    check('One Ctrl+Z reverts one inspector edit', xi === 260, `x=${xi}`);

    // Labels: pin labels must not collide; macro names must fit their bodies
    const pinLabels = await page.$$eval('[data-testid^="pin-"] text', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, t: e.textContent }; }));
    let pinCollisions = 0;
    for (let i = 0; i < pinLabels.length; i++) for (let j = i + 1; j < pinLabels.length; j++) if (overlaps(pinLabels[i], pinLabels[j])) pinCollisions++;
    check('No pin label overlaps another pin label', pinCollisions === 0, `${pinCollisions} collisions`);
    const minPinFont = await page.$$eval('[data-testid^="pin-"] text', (els) => Math.min(...els.map((e) => e.getBoundingClientRect().height)));
    check('Pin labels render at a readable size (≥ 9 px)', minPinFont >= 9, `${minPinFont.toFixed(1)} px`);
    const macroFit = await page.$$eval('[data-testid^="macro-"]', (gs) => gs.map((g) => {
      const rects = g.querySelectorAll('rect');
      const bodyR = (g.querySelector('[data-role="macro-body"]') || rects[rects.length > 1 ? 1 : 0]).getBoundingClientRect();
      const t = g.querySelector('text').getBoundingClientRect();
      return { id: g.dataset.testid, fits: t.left >= bodyR.left - 0.5 && t.right <= bodyR.right + 0.5 };
    }));
    check('Macro name labels fit inside their macro body', macroFit.every((m) => m.fits), macroFit.filter((m) => !m.fits).map((m) => m.id).join(','));

    await context.close();
  });

  // ── 2. Save / reload / import / export ────────────────────────────────────
  await section(async () => {
    const { context, page } = await freshPage(browser);
    await page.goto(BASE + '/studio/floorplanning');
    await page.evaluate(() => localStorage.removeItem('pdplayground_floorplan_v1'));
    await page.reload();
    await page.click('[data-testid="explorer-item-macro-SRAM_DATA"]');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.click('button:has-text("Save")');
    await page.reload();
    await page.click('[data-testid="explorer-item-macro-SRAM_DATA"]');
    const x = Number(await page.inputValue('[data-testid="input-macro-x"]'));
    check('Save + reload restores the nudged macro position', x === 70, `x=${x}`);

    const dl = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    const file = await (await dl).path();
    const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
    check('Export produces a schema-v1 project with the edited macro', exported.schemaVersion === 1 && exported.macros.find((m) => m.id === 'SRAM_DATA').x === 70);

    page._dialogs.length = 0;
    const bad = path.join(require('os').tmpdir(), 'not_a_floorplan.json');
    fs.writeFileSync(bad, JSON.stringify({ hello: 'world' }));
    await page.setInputFiles('input[type="file"]', bad);
    await page.waitForTimeout(300);
    check('Importing a non-floorplan JSON is rejected', page._dialogs.some((d) => /fail/i.test(d)), page._dialogs.join(' | '));
    await page.click('[data-testid="explorer-item-macro-SRAM_DATA"]');
    const xAfterBad = Number(await page.inputValue('[data-testid="input-macro-x"]'));
    check('Rejected import leaves the current design untouched', xAfterBad === 70, `x=${xAfterBad}`);

    const good = path.join(require('os').tmpdir(), 'good_floorplan.json');
    exported.macros[0].x = 100;
    fs.writeFileSync(good, JSON.stringify(exported));
    await page.setInputFiles('input[type="file"]', good);
    await page.waitForTimeout(300);
    await page.click('[data-testid="explorer-item-macro-SRAM_DATA"]');
    check('Importing a valid exported file restores it', Number(await page.inputValue('[data-testid="input-macro-x"]')) === 100);
    await context.close();
  });

  // ── 3. Explore isolation ──────────────────────────────────────────────────
  await section(async () => {
    const { context, page } = await freshPage(browser);
    await page.goto(BASE + '/studio/floorplanning');
    await page.evaluate(() => localStorage.setItem('pdplayground_floorplan_v1', 'SENTINEL'));
    await page.goto(BASE + '/explore/studio/floorplanning');
    await page.waitForSelector('[data-testid="fp-canvas"]');
    await page.click('[data-testid="explorer-item-macro-SRAM_DATA"]');
    await page.keyboard.press('ArrowRight');
    page._dialogs.length = 0;
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(150);
    const stored = await page.evaluate(() => localStorage.getItem('pdplayground_floorplan_v1'));
    check('Explore Studio never writes the Normal Game project', stored === 'SENTINEL');
    check('Explore Save does not claim a permanent save', !page._dialogs.some((d) => /saved successfully/i.test(d)), page._dialogs.join(' | '));
    await page.goto(BASE + '/explore/kingdom/floorplanning/level/fp-10');
    const studioLink = await page.getAttribute('a:has-text("Open in Dedicated Studio")', 'href');
    check('Explore lessons link to the Explore Studio', studioLink === '/explore/studio/floorplanning', studioLink);
    await context.close();
  });

  // ── 4. Curriculum surface ─────────────────────────────────────────────────
  await section(async () => {
    const { context, page } = await freshPage(browser);
    await page.goto(BASE + '/explore/kingdom/floorplanning/level/fp-12');
    const badge = (await page.textContent('.level-page__badge')) || '';
    check('Expanded lesson badge shows a real lesson position', !/Level\s+of/.test(badge), badge.trim());
    const generic = await page.locator('text=Random Placement Approach').count();
    check('FP-12 no longer uses the shared generic A/B quiz', generic === 0);

    // Capstone cannot be passed by ticking boxes with no design
    await page.goto(BASE + '/explore/kingdom/floorplanning/level/fp-24');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    for (const cb of await page.$$('form input[type="checkbox"]')) await cb.check();
    await page.click('[data-testid="btn-verify-challenge"]');
    await page.waitForTimeout(200);
    const passedWithoutDesign = await page.locator('text=Simulation Completed').count();
    check('FP-24 does not pass on self-attested checkboxes', passedWithoutDesign === 0);

    // Repair the Dual SRAM benchmark in the Explore Studio, then grade it
    await page.goto(BASE + '/explore/studio/floorplanning');
    await page.selectOption('select.fp-toolbar-select, [data-testid="select-preset"], select', 'dual-sram');
    await page.click('[data-testid="tab-diagnostics"]');
    await page.click('[data-testid="btn-add-missing-via"]');
    await page.click('button:has-text("Save")');
    await page.goto(BASE + '/explore/kingdom/floorplanning/level/fp-24');
    await page.click('[data-testid="btn-verify-challenge"]');
    await page.waitForTimeout(200);
    const passedWithDesign = await page.locator('text=Simulation Completed').count();
    check('FP-24 passes after the student repairs a 4-macro benchmark in the Studio', passedWithDesign === 1);
    await shot(page, 'fp24_after_repair', { fullPage: true });

    await page.goto(BASE + '/explore/kingdom/floorplanning');
    const stat = await page.evaluate(() => {
      const item = document.querySelector('.kingdom-page__stat-item');
      if (!item) return null;
      const l = item.querySelector('.kingdom-page__stat-label').getBoundingClientRect();
      const v = item.querySelector('.kingdom-page__stat-value').getBoundingClientRect();
      return { labelBottom: l.bottom, valueTop: v.top, sameLine: Math.abs(l.top - v.top) < 4 && v.left - l.right < 4 };
    });
    check('Kingdom stat labels are not jammed against their values', stat && !stat.sameLine, JSON.stringify(stat));
    const sanityPad = await page.evaluate(() => {
      const f = document.querySelector('.kingdom-page__sanity-grid .sanity-card__footer');
      return f ? getComputedStyle(f).display : null;
    });
    check('Sanity card footers are laid out (flex)', sanityPad === 'flex', String(sanityPad));
    await context.close();
  });

  // ── 5. Mobile layout ──────────────────────────────────────────────────────
  for (const vp of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) await section(async () => {
    const { context, page } = await freshPage(browser, vp);
    await page.goto(BASE + '/studio/floorplanning');
    await page.waitForSelector('[data-testid="fp-canvas"]');
    await shot(page, `studio_${vp.width}`);
    const m = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="fp-canvas"]').getBoundingClientRect();
      const die = document.querySelector('.fp-studio-canvas__svg rect[rx="4"]').getBoundingClientRect();
      return { overflowX: document.documentElement.scrollWidth - innerWidth, canvasH: c.height, dieW: die.width, canvasW: c.width };
    });
    check(`${vp.width}px: no horizontal page overflow`, m.overflowX <= 0, `overflow ${m.overflowX}px`);
    // On a 390 px phone the outward pin labels (≈11 px text) need real space, so the
    // bar is lower there; the baseline drew the die at 40% with 8 px labels on top of the rings.
    const minFill = vp.width < 500 ? 0.5 : 0.7;
    check(`${vp.width}px: die drawn at ≥ ${minFill * 100}% of canvas width`, m.dieW / m.canvasW >= minFill, `${(100 * m.dieW / m.canvasW).toFixed(0)}%`);

    // Touch drag on a phone
    if (vp.width === 390) {
      const body = await macroBody(page, 'SRAM_INST');
      const b0 = await body.boundingBox();
      const cdp = await context.newCDPSession(page);
      const sx = b0.x + b0.width / 2;
      const sy = b0.y + b0.height / 2;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
      for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx - 5 * i, y: sy + 5 * i }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const b1 = await body.boundingBox();
      check('390px: touch drag moves a macro', Math.abs(b1.x - b0.x) > 10 || Math.abs(b1.y - b0.y) > 10, `moved (${(b1.x - b0.x).toFixed(1)}, ${(b1.y - b0.y).toFixed(1)})`);
    }
    await context.close();
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
