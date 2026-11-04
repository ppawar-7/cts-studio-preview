import { describe, it, expect } from 'vitest';
import {
  validatePLIntro,
  CORRECT_ROW_ABUT_ID,
  CORRECT_ORIENTATION_ID,
} from '../../activities/placement/validators/validatePLIntro.js';
import {
  validatePLGlobalDetailed,
  CORRECT_ANALYTICAL_ID,
} from '../../activities/placement/validators/validatePLGlobalDetailed.js';
import {
  validatePLTimingDriven,
  CORRECT_NET_WEIGHT_ID,
} from '../../activities/placement/validators/validatePLTimingDriven.js';
import {
  validatePLCongestion,
  CORRECT_CONGESTION_MITIGATION_ID,
} from '../../activities/placement/validators/validatePLCongestion.js';
import {
  validatePLKingdom,
  CORRECT_CAPSTONE_PLACER_CONCEPT_ID,
} from '../../activities/placement/validators/validatePLKingdom.js';

describe('Kingdom 4: Placement Validators', () => {
  describe('pl-1: validatePLIntro', () => {
    it('rejects empty or incomplete submission', () => {
      const res = validatePLIntro(null);
      expect(res.passed).toBe(false);
      expect(res.score).toBe(0);
      expect(res.stars).toBe(0);
    });

    it('validates perfect submission and awards 30 XP with 3 stars', () => {
      const res = validatePLIntro({
        rowHeightConcept: CORRECT_ROW_ABUT_ID,
        orientationConcept: CORRECT_ORIENTATION_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(30);
      expect(res.stars).toBe(3);
    });
  });

  describe('pl-2: validatePLGlobalDetailed', () => {
    it('validates legalized cell coordinates and displacement calculation', () => {
      const res = validatePLGlobalDetailed({
        legalizedCells: [
          { id: 'CELL_A', x: 40, y: 40 },
          { id: 'CELL_B', x: 80, y: 40 },
        ],
        displacementAns: 22,
        analyticalConcept: CORRECT_ANALYTICAL_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(35);
      expect(res.stars).toBe(3);
    });

    it('fails when cells overlap or are unaligned', () => {
      const res = validatePLGlobalDetailed({
        legalizedCells: [
          { id: 'CELL_A', x: 43, y: 55 },
          { id: 'CELL_B', x: 43, y: 55 },
        ],
        displacementAns: 0,
        analyticalConcept: 'wrong',
      });
      expect(res.passed).toBe(false);
      expect(res.score).toBe(0);
    });
  });

  describe('pl-3: validatePLTimingDriven', () => {
    it('validates timing-driven placement and critical path net weighting', () => {
      const res = validatePLTimingDriven({
        initialHPWL: 520,
        optimizedHPWL: 80,
        chosenPosition: 'pos-adjacent',
        netWeightConcept: CORRECT_NET_WEIGHT_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(40);
      expect(res.stars).toBe(3);
    });

    it('rejects wrong cell position choice', () => {
      const res = validatePLTimingDriven({
        initialHPWL: 520,
        optimizedHPWL: 80,
        chosenPosition: 'pos-distant',
        netWeightConcept: CORRECT_NET_WEIGHT_ID,
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('pl-4: validatePLCongestion', () => {
    it('validates GCell demand calculation and hotspot mitigation', () => {
      const res = validatePLCongestion({
        congestionRatio: 1.5,
        hotspotBin: 'R1C2',
        mitigationConcept: CORRECT_CONGESTION_MITIGATION_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(45);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect hotspot or ratio', () => {
      const res = validatePLCongestion({
        congestionRatio: 0.8,
        hotspotBin: 'R0C0',
        mitigationConcept: 'wrong',
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('pl-5: validatePLKingdom', () => {
    it('validates capstone legal placement, zero overlaps, HPWL <= 200, and concept', () => {
      const validCells = [
        { id: 'C1_DFF',  x: 20,  y: 40, width: 30, height: 40 },
        { id: 'C2_NAND', x: 60,  y: 40, width: 20, height: 40 },
        { id: 'C3_MUX',  x: 90,  y: 40, width: 30, height: 40 },
        { id: 'C4_DFF',  x: 130, y: 40, width: 30, height: 40 },
      ];
      const res = validatePLKingdom({
        cells: validCells,
        placerConcept: CORRECT_CAPSTONE_PLACER_CONCEPT_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(50);
      expect(res.stars).toBe(3);
    });

    it('fails when cells overlap in capstone', () => {
      const overlappingCells = [
        { id: 'C1_DFF',  x: 20, y: 40, width: 30, height: 40 },
        { id: 'C2_NAND', x: 25, y: 40, width: 20, height: 40 }, // overlap with C1!
        { id: 'C3_MUX',  x: 90, y: 40, width: 30, height: 40 },
        { id: 'C4_DFF',  x: 130, y: 40, width: 30, height: 40 },
      ];
      const res = validatePLKingdom({
        cells: overlappingCells,
        placerConcept: CORRECT_CAPSTONE_PLACER_CONCEPT_ID,
      });
      expect(res.passed).toBe(false);
    });
  });
});
