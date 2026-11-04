import { describe, it, expect } from 'vitest';
import {
  validateCTSIntro,
  CORRECT_STA_VS_CTS_ID,
  CORRECT_LEAF_SINK_ID,
} from '../../activities/cts/validators/validateCTSIntro.js';
import {
  validateCTSSkewLatency,
  CORRECT_HOLD_HAZARD_ID,
} from '../../activities/cts/validators/validateCTSSkewLatency.js';
import {
  validateCTSBufferInsertion,
  CORRECT_SLEW_CONCEPT_ID,
} from '../../activities/cts/validators/validateCTSBufferInsertion.js';
import {
  validateCTSTopologies,
  CORRECT_ASIC_TOPOLOGY_ID,
  CORRECT_MESH_TOPOLOGY_ID,
  CORRECT_MESH_DRAWBACK_ID,
} from '../../activities/cts/validators/validateCTSTopologies.js';
import {
  validateCTSKingdom,
  CORRECT_ICG_CONCEPT_ID,
} from '../../activities/cts/validators/validateCTSKingdom.js';

describe('Kingdom 5: CTS Validators', () => {
  describe('cts-1: validateCTSIntro', () => {
    it('rejects empty submission', () => {
      const res = validateCTSIntro(null);
      expect(res.passed).toBe(false);
      expect(res.score).toBe(0);
    });

    it('validates correct STA vs CTS distinction, leaf sinks, and skew calculation', () => {
      const res = validateCTSIntro({
        staVsCtsConcept: CORRECT_STA_VS_CTS_ID,
        leafSinkConcept: CORRECT_LEAF_SINK_ID,
        skewAnswer: 0.07,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(30);
      expect(res.stars).toBe(3);
    });
  });

  describe('cts-2: validateCTSSkewLatency', () => {
    it('validates setup slack with useful skew and identifies hold race hazards', () => {
      const res = validateCTSSkewLatency({
        launchLatency: 0.20,
        captureLatency: 0.28,
        setupSlackAns: 0.03,
        holdRiskConcept: CORRECT_HOLD_HAZARD_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(35);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect setup slack calculation', () => {
      const res = validateCTSSkewLatency({
        launchLatency: 0.20,
        captureLatency: 0.28,
        setupSlackAns: -0.50,
        holdRiskConcept: CORRECT_HOLD_HAZARD_ID,
      });
      expect(res.slackScore).toBe(0);
    });
  });

  describe('cts-3: validateCTSBufferInsertion', () => {
    it('validates 3 buffer stages to balance Branch A with Branch B', () => {
      const res = validateCTSBufferInsertion({
        bufferStages: 3,
        chosenBuffer: 'CLKBUF_X2',
        slewConcept: CORRECT_SLEW_CONCEPT_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(40);
      expect(res.stars).toBe(3);
    });

    it('fails when buffer count leaves excessive skew', () => {
      const res = validateCTSBufferInsertion({
        bufferStages: 1,
        chosenBuffer: 'CLKBUF_X2',
        slewConcept: CORRECT_SLEW_CONCEPT_ID,
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('cts-4: validateCTSTopologies', () => {
    it('validates balanced tree for standard ASICs, clock mesh for high-GHz, and power penalty', () => {
      const res = validateCTSTopologies({
        asicTopology: CORRECT_ASIC_TOPOLOGY_ID,
        highPerfTopology: CORRECT_MESH_TOPOLOGY_ID,
        meshDrawback: CORRECT_MESH_DRAWBACK_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(45);
      expect(res.stars).toBe(3);
    });

    it('fails when incorrect topologies are selected', () => {
      const res = validateCTSTopologies({
        asicTopology: 'opt-h-tree-only',
        highPerfTopology: 'opt-serial-chain',
        meshDrawback: 'opt-too-cheap',
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('cts-5: validateCTSKingdom', () => {
    it('validates capstone 4-sink balancing [3, 1, 2, 0] stages, latency <= 300ps, and ICG concept', () => {
      const res = validateCTSKingdom({
        bufferStages: [3, 1, 2, 0],
        icgConcept: CORRECT_ICG_CONCEPT_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(50);
      expect(res.stars).toBe(3);
      expect(res.skewMet).toBe(true);
      expect(res.latencyMet).toBe(true);
      expect(res.exactStages).toBe(true);
    });

    it('fails when branches remain unbalanced (e.g. all 0 stages)', () => {
      const res = validateCTSKingdom({
        bufferStages: [0, 0, 0, 0],
        icgConcept: CORRECT_ICG_CONCEPT_ID,
      });
      expect(res.passed).toBe(false);
      expect(res.skewMet).toBe(false);
    });
  });
});
