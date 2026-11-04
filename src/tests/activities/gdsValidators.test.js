import { describe, it, expect } from 'vitest';
import {
  validateGDSIntro,
  CORRECT_GDS_CONTENTS_ID,
  CORRECT_OASIS_ID,
} from '../../activities/gds/validators/validateGDSIntro.js';
import {
  validateGDSSignoffChecks,
  CORRECT_SIGNOFF_GATE_ID,
  CORRECT_LVS_ERROR_ID,
} from '../../activities/gds/validators/validateGDSSignoffChecks.js';
import {
  validateGDSLayerStack,
  CORRECT_FEOL_ID,
  CORRECT_DATATYPE_ID,
  CORRECT_M1_LAYER_ID,
} from '../../activities/gds/validators/validateGDSLayerStack.js';
import {
  validateGDSTapeoutPrep,
  CORRECT_ANTENNA_DIODE_ID,
  CORRECT_OPC_ID,
} from '../../activities/gds/validators/validateGDSTapeoutPrep.js';
import {
  validateGDSFinalCapstone,
  CORRECT_FLOW_SUMMARY_ID,
} from '../../activities/gds/validators/validateGDSFinalCapstone.js';

describe('Kingdom 8: GDS & Tape-Out Validators', () => {
  describe('gds-1: validateGDSIntro', () => {
    it('rejects empty submission', () => {
      const res = validateGDSIntro(null);
      expect(res.passed).toBe(false);
      expect(res.score).toBe(0);
    });

    it('validates GDSII geometric content and OASIS compression format', () => {
      const res = validateGDSIntro({
        gdsContentsConcept: CORRECT_GDS_CONTENTS_ID,
        oasisConcept: CORRECT_OASIS_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(30);
      expect(res.stars).toBe(3);
    });
  });

  describe('gds-2: validateGDSSignoffChecks', () => {
    it('validates tapeout signoff gate strictness, LVS open-circuit debug, and checks', () => {
      const res = validateGDSSignoffChecks({
        signoffGateConcept: CORRECT_SIGNOFF_GATE_ID,
        lvsErrorConcept: CORRECT_LVS_ERROR_ID,
        checksPassed: { drc: true, lvs: true, sta: true, erc: true },
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(35);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect signoff gate concept', () => {
      const res = validateGDSSignoffChecks({
        signoffGateConcept: 'opt-foundry-fixes-it',
        lvsErrorConcept: 'opt-overclock',
        checksPassed: null,
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('gds-3: validateGDSLayerStack', () => {
    it('validates FEOL active transistors, GDS datatypes, and Layer 30 (M1)', () => {
      const res = validateGDSLayerStack({
        feolConcept: CORRECT_FEOL_ID,
        datatypeConcept: CORRECT_DATATYPE_ID,
        m1LayerChoice: CORRECT_M1_LAYER_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(40);
      expect(res.stars).toBe(3);
    });

    it('fails when incorrect manufacturing phases or layer numbers are chosen', () => {
      const res = validateGDSLayerStack({
        feolConcept: 'opt-feol-packaging',
        datatypeConcept: 'opt-random-numbers',
        m1LayerChoice: 'opt-layer-1-nwell',
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('gds-4: validateGDSTapeoutPrep', () => {
    it('validates antenna ratio (300), mandatory diode insertion, and OPC diffraction correction', () => {
      const res = validateGDSTapeoutPrep({
        antennaRatioAns: 300,
        diodeDecision: CORRECT_ANTENNA_DIODE_ID,
        opcConcept: CORRECT_OPC_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(45);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect antenna ratio or decision', () => {
      const res = validateGDSTapeoutPrep({
        antennaRatioAns: 100,
        diodeDecision: 'opt-no-diode-needed',
        opcConcept: 'opt-opc-zoom',
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('gds-5: validateGDSFinalCapstone', () => {
    it('validates full 6-gate signoff audit and comprehensive physical design flow summary', () => {
      const res = validateGDSFinalCapstone({
        signoffAudit: {
          drc: true,
          lvs: true,
          sta: true,
          erc: true,
          antenna: true,
          cmp: true,
        },
        flowSummaryConcept: CORRECT_FLOW_SUMMARY_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(50);
      expect(res.stars).toBe(3);
      expect(res.auditOk).toBe(true);
      expect(res.summaryOk).toBe(true);
    });

    it('fails if any signoff gate is unconfirmed', () => {
      const res = validateGDSFinalCapstone({
        signoffAudit: {
          drc: true,
          lvs: false, // Unaudited!
          sta: true,
          erc: true,
          antenna: true,
          cmp: true,
        },
        flowSummaryConcept: CORRECT_FLOW_SUMMARY_ID,
      });
      expect(res.passed).toBe(false);
      expect(res.auditOk).toBe(false);
    });
  });
});
