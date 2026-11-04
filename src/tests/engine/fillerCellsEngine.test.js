import { describe, it, expect } from 'vitest';
import {
  findRowGaps,
  greedyFillGap,
  calculateDecapDroop,
  checkRowContinuity,
  PHYSICAL_ONLY_CELLS,
} from '../../engine/fillerCellsEngine.js';

describe('Filler Cells Engine', () => {
  it('detects multiple empty intervals/gaps between placed logic cells in a row', () => {
    // Row of 100 sites.
    // Cell 1: sites 10..29 (width 20)
    // Cell 2: sites 50..69 (width 20)
    const placed = [
      { id: 'C1', startSite: 10, widthSites: 20 },
      { id: 'C2', startSite: 50, widthSites: 20 },
    ];
    const gaps = findRowGaps(100, placed);
    expect(gaps).toHaveLength(3);
    // Gap 0: 0 to 10 (width 10)
    expect(gaps[0]).toEqual({ startSite: 0, endSite: 10, widthSites: 10 });
    // Gap 1: 30 to 50 (width 20)
    expect(gaps[1]).toEqual({ startSite: 30, endSite: 50, widthSites: 20 });
    // Gap 2: 70 to 100 (width 30)
    expect(gaps[2]).toEqual({ startSite: 70, endSite: 100, widthSites: 30 });
  });

  it('fills empty gaps greedily using standard filler sizes with zero remaining gap', () => {
    // Gap of 27 sites. With sizes [32, 16, 8, 4, 2, 1]:
    // 16 (rem 11), 8 (rem 3), 2 (rem 1), 1 (rem 0) -> 16+8+2+1 = 27 sites!
    const result = greedyFillGap(27, [32, 16, 8, 4, 2, 1]);
    expect(result.remainingSites).toBe(0);
    expect(result.filledSites).toBe(27);
    expect(result.cellPlan).toEqual([
      { size: 16, count: 1, type: 'FILL16' },
      { size: 8,  count: 1, type: 'FILL8' },
      { size: 2,  count: 1, type: 'FILL2' },
      { size: 1,  count: 1, type: 'FILL1' },
    ]);
  });

  it('calculates dynamic power supply droop suppression with decap capacitance and leakage penalty', () => {
    // I = 100 mA, dt = 200 ps. Decap = 500 pF, 40 decap sites -> Droop = (100 * 200) / 500 = 40 mV <= 50 mV (acceptable)
    // Leakage = 40 * 0.25 µA = 10.0 µA
    const resGood = calculateDecapDroop(100, 200, 500, 40);
    expect(resGood.droopMv).toBe(40.0);
    expect(resGood.isAcceptable).toBe(true);
    expect(resGood.leakageCurrentUa).toBe(10.0);

    // If Decap is only 100 pF -> Droop = (100 * 200) / 100 = 200 mV > 50 mV (unacceptable violation)
    const resBad = calculateDecapDroop(100, 200, 100, 8);
    expect(resBad.droopMv).toBe(200.0);
    expect(resBad.isAcceptable).toBe(false);
  });

  it('verifies row continuity via scalar sum when startSite is omitted', () => {
    const cells = [
      { widthSites: 40 },
      { widthSites: 35 },
      { widthSites: 25 },
    ];
    const continuity = checkRowContinuity(100, cells);
    expect(continuity.isContinuous).toBe(true);
    expect(continuity.gapRemaining).toBe(0);
    expect(continuity.totalCellWidth).toBe(100);
  });

  it('verifies spatial row interval coverage when startSite is present', () => {
    // Complete spatial coverage with no gaps
    const continuousCells = [
      { startSite: 0, widthSites: 40 },
      { startSite: 40, widthSites: 30 },
      { startSite: 70, widthSites: 30 },
    ];
    const passResult = checkRowContinuity(100, continuousCells);
    expect(passResult.isContinuous).toBe(true);
    expect(passResult.gapRemaining).toBe(0);

    // Spatial gap: cell 1 covers 0..40, cell 2 starts at 50 (gap from 40 to 50!)
    const gappedCells = [
      { startSite: 0, widthSites: 40 },
      { startSite: 50, widthSites: 50 },
    ];
    const failResult = checkRowContinuity(100, gappedCells);
    expect(failResult.isContinuous).toBe(false);
    expect(failResult.gapRemaining).toBe(60); // stops at 40
  });

  it('identifies distinct physical-only cell categories and their engineering roles', () => {
    expect(PHYSICAL_ONLY_CELLS.FILLER.category).toBe('Filler');
    expect(PHYSICAL_ONLY_CELLS.DECAP.category).toBe('Decap');
    expect(PHYSICAL_ONLY_CELLS.TAPCELL.maxDistanceUm).toBe(30.0);
    expect(PHYSICAL_ONLY_CELLS.ENDCAP.category).toBe('Boundary');
    expect(PHYSICAL_ONLY_CELLS.TIE_CELLS.category).toBe('TieOff');
  });
});
