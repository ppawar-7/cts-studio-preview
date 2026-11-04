import { describe, it, expect } from 'vitest';
import {
  calculateAntennaRatio,
  evaluateSignoffReadiness,
  GDS_LAYER_MAP,
  SIGNOFF_CHECKLIST,
} from '../../engine/gdsEngine.js';

describe('GDS & Tape-Out Engine', () => {
  it('calculates antenna ratio and flags when diode protection is mandatory', () => {
    // Metal area = 50 um2, Gate area = 0.20 um2 -> AR = 50 / 0.20 = 250 > 200 (violates limit)
    const resBad = calculateAntennaRatio(50, 0.20, 200);
    expect(resBad.ratio).toBe(250.0);
    expect(resBad.isExceeded).toBe(true);
    expect(resBad.diodeRequired).toBe(true);

    // Metal area = 30 um2, Gate area = 0.20 um2 -> AR = 30 / 0.20 = 150 <= 200 (meets rule)
    const resGood = calculateAntennaRatio(30, 0.20, 200);
    expect(resGood.ratio).toBe(150.0);
    expect(resGood.isExceeded).toBe(false);
    expect(resGood.diodeRequired).toBe(false);
  });

  it('evaluates signoff readiness across all mandatory verification checks', () => {
    const perfectStatus = {
      DRC: true,
      LVS: true,
      STA: true,
      ERC: true,
      ANTENNA: true,
      CMP: true,
    };
    const evalClean = evaluateSignoffReadiness(perfectStatus);
    expect(evalClean.isReadyForTapeout).toBe(true);
    expect(evalClean.passedCount).toBe(6);
    expect(evalClean.failingChecks).toHaveLength(0);

    const incompleteStatus = {
      DRC: true,
      LVS: false, // Unresolved short!
      STA: true,
      ERC: true,
      ANTENNA: false, // Antenna violation
      CMP: true,
    };
    const evalIncomplete = evaluateSignoffReadiness(incompleteStatus);
    expect(evalIncomplete.isReadyForTapeout).toBe(false);
    expect(evalIncomplete.passedCount).toBe(4);
    expect(evalIncomplete.failingChecks).toContain('Layout Versus Schematic');
    expect(evalIncomplete.failingChecks).toContain('Antenna Effect DRC');
  });

  it('defines comprehensive GDSII layer map distinguishing FEOL and BEOL', () => {
    expect(GDS_LAYER_MAP.POLY.category).toBe('FEOL');
    expect(GDS_LAYER_MAP.M1.category).toBe('BEOL');
    expect(GDS_LAYER_MAP.M1.gdsLayer).toBe(30);
    expect(SIGNOFF_CHECKLIST).toHaveLength(6);
  });
});
