import { describe, it, expect } from 'vitest';
import {
  computeCoreGeometry,
  computeUtilization,
  checkRectCollision,
  isContainedInCore,
  validatePinPlacements,
} from '../../engine/geometryEngine.js';

describe('Geometry & Floorplanning Engine', () => {
  it('computes core dimensions and aspect ratio from die dimensions and margins', () => {
    // 500 x 400 die, 25 um margin
    const geom = computeCoreGeometry({ dieWidth: 500, dieHeight: 400, margin: 25 });
    expect(geom.coreWidth).toBe(450); // 500 - 50
    expect(geom.coreHeight).toBe(350); // 400 - 50
    expect(geom.coreArea).toBe(157500);
    expect(geom.aspectRatio).toBe(0.778); // 350 / 450
  });

  it('computes nominal vs effective placement utilization accurately', () => {
    // Core area = 100,000 um^2. StdCell = 40,000 um^2. Macro = 20,000 um^2. Blockage = 10,000 um^2.
    const util = computeUtilization({
      stdCellArea: 40000,
      macroArea: 20000,
      blockageArea: 10000,
      coreArea: 100000,
    });
    expect(util.nominalUtilization).toBe(60.0); // (40k + 20k) / 100k = 60%
    expect(util.routableArea).toBe(70000); // 100k - 20k - 10k
    expect(util.effectiveUtilization).toBe(57.1); // 40k / 70k = 57.1%
  });

  it('detects rectangle overlaps and halo clearance violations', () => {
    const box1 = { x: 50, y: 50, width: 100, height: 100 };
    const box2 = { x: 120, y: 120, width: 100, height: 100 }; // Direct overlap
    const box3 = { x: 160, y: 50, width: 50, height: 50 };   // 10 um gap from box1 (150 to 160)

    expect(checkRectCollision(box1, box2, 0)).toBe(true);
    expect(checkRectCollision(box1, box3, 0)).toBe(false); // No overlap without halo
    expect(checkRectCollision(box1, box3, 15)).toBe(true);  // Violates 15 um halo clearance!
  });

  it('verifies boundary containment and reports out-of-core placement', () => {
    const core = { width: 500, height: 400 };
    expect(isContainedInCore({ x: 50, y: 50, width: 200, height: 150 }, core)).toBe(true);
    expect(isContainedInCore({ x: 400, y: 50, width: 150, height: 100 }, core)).toBe(false); // extends to 550 > 500
    expect(isContainedInCore({ x: -10, y: 50, width: 50, height: 50 }, core)).toBe(false);
  });

  it('validates I/O pin pitch spacing and identifies violations', () => {
    const core = { width: 500, height: 500 };
    const validPins = [
      { id: 'CLK', edge: 'bottom', coord: 100 },
      { id: 'RST', edge: 'bottom', coord: 120 }, // 20 um spacing >= 10 um min
      { id: 'DATA0', edge: 'top', coord: 50 },
    ];
    expect(validatePinPlacements(validPins, 10, core).isValid).toBe(true);

    const violatingPins = [
      { id: 'D0', edge: 'top', coord: 100 },
      { id: 'D1', edge: 'top', coord: 105 }, // 5 um spacing < 10 um min
    ];
    const check = validatePinPlacements(violatingPins, 10, core);
    expect(check.isValid).toBe(false);
    expect(check.violations[0]).toContain('Pitch violation');
  });
});
