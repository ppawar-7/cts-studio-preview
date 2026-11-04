import { describe, it, expect } from 'vitest';
import {
  validateFCIntro,
  CORRECT_WHY_FILLERS_ID,
} from '../../activities/filler-cells/validators/validateFCIntro.js';
import {
  validateFCCellTypes,
  CORRECT_TAPCELL_ID,
  CORRECT_ENDCAP_ID,
  CORRECT_TIE_ID,
} from '../../activities/filler-cells/validators/validateFCCellTypes.js';
import {
  validateFCWellContinuity,
  CORRECT_WELL_EDGE_ID,
} from '../../activities/filler-cells/validators/validateFCWellContinuity.js';
import {
  validateFCDecapStrategy,
  CORRECT_DECAP_PENALTY_ID,
} from '../../activities/filler-cells/validators/validateFCDecapStrategy.js';
import {
  validateFCKingdom,
  CORRECT_CMP_DENSITY_ID,
} from '../../activities/filler-cells/validators/validateFCKingdom.js';

describe('Kingdom 7: Filler Cells Validators', () => {
  describe('fc-1: validateFCIntro', () => {
    it('rejects empty submission', () => {
      const res = validateFCIntro(null);
      expect(res.passed).toBe(false);
      expect(res.score).toBe(0);
    });

    it('validates well continuity concept and 35 empty sites calculation', () => {
      const res = validateFCIntro({
        whyFillersConcept: CORRECT_WHY_FILLERS_ID,
        emptySitesAns: 35,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(30);
      expect(res.stars).toBe(3);
    });
  });

  describe('fc-2: validateFCCellTypes', () => {
    it('validates TAPCELL (latch-up), ENDCAP (boundary), and TIE cells (gate oxide protection)', () => {
      const res = validateFCCellTypes({
        tapcellConcept: CORRECT_TAPCELL_ID,
        endcapConcept: CORRECT_ENDCAP_ID,
        tieConcept: CORRECT_TIE_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(35);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect cell taxonomy selections', () => {
      const res = validateFCCellTypes({
        tapcellConcept: 'opt-random-inverter',
        endcapConcept: 'opt-center-only',
        tieConcept: 'opt-save-wires',
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('fc-3: validateFCWellContinuity', () => {
    it('validates bridging 12-site gap (e.g. FILL8 + FILL4) and well spacing concept', () => {
      const res = validateFCWellContinuity({
        chosenFillers: ['FILL8', 'FILL4'],
        wellEdgeConcept: CORRECT_WELL_EDGE_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(40);
      expect(res.stars).toBe(3);
    });

    it('fails when selected fillers leave remaining gap in N-well', () => {
      const res = validateFCWellContinuity({
        chosenFillers: ['FILL8'], // only 8 sites out of 12!
        wellEdgeConcept: CORRECT_WELL_EDGE_ID,
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('fc-4: validateFCDecapStrategy', () => {
    it('validates droop at 100 pF (200 mV) and 500 pF (40 mV) plus gate leakage trade-off', () => {
      const res = validateFCDecapStrategy({
        droop100Ans: 200,
        droop500Ans: 40,
        decapPenaltyConcept: CORRECT_DECAP_PENALTY_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(45);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect droop calculations', () => {
      const res = validateFCDecapStrategy({
        droop100Ans: 50,
        droop500Ans: 50,
        decapPenaltyConcept: CORRECT_DECAP_PENALTY_ID,
      });
      expect(res.d100Ok).toBe(false);
    });
  });

  describe('fc-5: validateFCKingdom', () => {
    it('validates capstone 60-site filling with Decap, Tap, and CMP concept', () => {
      const plan = [
        { type: 'DECAP16', count: 2 }, // 32
        { type: 'DECAP8',  count: 1 }, // 8
        { type: 'TAPCELL4',count: 2 }, // 8
        { type: 'FILL8',   count: 1 }, // 8
        { type: 'FILL4',   count: 1 }, // 4 -> Total = 60 sites!
      ];
      const res = validateFCKingdom({
        cellPlan: plan,
        cmpConcept: CORRECT_CMP_DENSITY_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(50);
      expect(res.stars).toBe(3);
      expect(res.fillMet).toBe(true);
      expect(res.typesMet).toBe(true);
    });

    it('fails when physical cell plan does not include Decap cells', () => {
      const noDecapPlan = [
        { type: 'FILL8', count: 7 }, // 56
        { type: 'TAPCELL4', count: 1 }, // 4 -> Total = 60 sites, but no DECAP!
      ];
      const res = validateFCKingdom({
        cellPlan: noDecapPlan,
        cmpConcept: CORRECT_CMP_DENSITY_ID,
      });
      expect(res.passed).toBe(false);
      expect(res.typesMet).toBe(false);
    });
  });
});
