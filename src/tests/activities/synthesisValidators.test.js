import { describe, it, expect } from 'vitest';
import { validateSynIntro } from '../../activities/synthesis/validators/validateSynIntro.js';
import { validateSynOptimization } from '../../activities/synthesis/validators/validateSynOptimization.js';
import { validateSynTechMapping } from '../../activities/synthesis/validators/validateSynTechMapping.js';
import { validateSynTiming } from '../../activities/synthesis/validators/validateSynTiming.js';
import { validateSynCapstone } from '../../activities/synthesis/validators/validateSynCapstone.js';

describe('Synthesis Kingdom Activity Validators (Levels 1–5)', () => {
  describe('Level 1: validateSynIntro', () => {
    it('accepts correct phase mappings and concept answer for 30 XP (3 Stars)', () => {
      const res = validateSynIntro({
        stageMappings: {
          translation: 'gtech',
          optimization: 'boolean-min',
          mapping: 'cell-bind',
        },
        conceptAnswer: 'opt-generic-decoupling',
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(30);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect phase mappings', () => {
      const res = validateSynIntro({
        stageMappings: {
          translation: 'cell-bind',
          optimization: 'gtech',
          mapping: 'boolean-min',
        },
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('Level 2: validateSynOptimization', () => {
    it('verifies constant folding, double inversion, and factoring for 35 XP (3 Stars)', () => {
      const res = validateSynOptimization({
        answers: {
          opt1: 'A',
          opt2: 'B',
          opt3: '0',
          opt4: 'D',
        },
        factoringAnswer: 'opt-factored-form',
        demorganAnswer: 'opt-demorgan-law',
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(35);
      expect(res.stars).toBe(3);
    });
  });

  describe('Level 3: validateSynTechMapping', () => {
    it('validates All-NAND calculations and optimal complex cell selection for 40 XP (3 Stars)', () => {
      const res = validateSynTechMapping({
        calculatedArea: '5.5',
        calculatedDelay: '0.21',
        chosenMapping: 'MUX2_X1',
        libertyConcept: 'opt-nldm-liberty',
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(40);
      expect(res.stars).toBe(3);
    });
  });

  describe('Level 4: validateSynTiming', () => {
    it('validates setup slack calculations and pipelining remediation for 45 XP (3 Stars)', () => {
      const res = validateSynTiming({
        sc1Arrival: '0.67',
        sc1Required: '0.92',
        sc1Slack: '0.25',
        sc2Slack: '-0.08',
        fixStrategy: 'opt-retiming-pipeline',
        sdcConcept: 'opt-sdc-uncertainty',
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(45);
      expect(res.stars).toBe(3);
    });
  });

  describe('Level 5: validateSynCapstone', () => {
    it('certifies synthesis capstone with QoR calculations for 50 XP (3 Stars)', () => {
      const res = validateSynCapstone({
        cellMappingChoice: 'opt-and-xor-mux',
        computedArea: '8.5',
        computedDelay: '0.38',
        computedSlack: '0.09',
        qorConcept: 'opt-ppa-pareto',
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(50);
      expect(res.stars).toBe(3);
    });
  });
});
