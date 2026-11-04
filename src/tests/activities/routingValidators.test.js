import { describe, it, expect } from 'vitest';
import {
  validateRTIntro,
  CORRECT_ROUTING_PHASES_ID,
} from '../../activities/routing/validators/validateRTIntro.js';
import {
  validateRTMetalLayers,
  CORRECT_M2_DIR_ID,
  CORRECT_ALTERNATE_ID,
  CORRECT_GLOBAL_LAYER_ID,
} from '../../activities/routing/validators/validateRTMetalLayers.js';
import {
  validateRTViasContacts,
  CORRECT_VIA_ENCLOSURE_ID,
  CORRECT_REDUNDANT_VIA_ID,
} from '../../activities/routing/validators/validateRTViasContacts.js';
import {
  validateRTSignalIntegrity,
  CORRECT_CROSSTALK_MITIGATION_ID,
} from '../../activities/routing/validators/validateRTSignalIntegrity.js';
import {
  validateRTKingdom,
  CORRECT_LVS_CONCEPT_ID,
} from '../../activities/routing/validators/validateRTKingdom.js';

describe('Kingdom 6: Routing Validators', () => {
  describe('rt-1: validateRTIntro', () => {
    it('rejects empty submission', () => {
      const res = validateRTIntro(null);
      expect(res.passed).toBe(false);
      expect(res.score).toBe(0);
    });

    it('validates global/detailed routing phases and 180 um Manhattan distance', () => {
      const res = validateRTIntro({
        routingPhasesConcept: CORRECT_ROUTING_PHASES_ID,
        manhattanDistanceAns: 180,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(30);
      expect(res.stars).toBe(3);
    });
  });

  describe('rt-2: validateRTMetalLayers', () => {
    it('validates M2 vertical direction, alternating preferred layers, and top thick metals', () => {
      const res = validateRTMetalLayers({
        m2Direction: CORRECT_M2_DIR_ID,
        alternateConcept: CORRECT_ALTERNATE_ID,
        globalLayerChoice: CORRECT_GLOBAL_LAYER_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(35);
      expect(res.stars).toBe(3);
    });

    it('rejects wrong preferred direction or layer choice', () => {
      const res = validateRTMetalLayers({
        m2Direction: 'opt-m2-horizontal',
        alternateConcept: 'opt-aesthetic',
        globalLayerChoice: 'opt-bottom-m1',
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('rt-3: validateRTViasContacts', () => {
    it('validates single (20 Ohm) and double (10 Ohm) via resistance and enclosure rules', () => {
      const res = validateRTViasContacts({
        singleViaResistanceAns: 20,
        doubleViaResistanceAns: 10,
        enclosureConcept: CORRECT_VIA_ENCLOSURE_ID,
        redundantViaConcept: CORRECT_REDUNDANT_VIA_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(40);
      expect(res.stars).toBe(3);
    });

    it('fails when via calculations or enclosure concept is incorrect', () => {
      const res = validateRTViasContacts({
        singleViaResistanceAns: 5,
        doubleViaResistanceAns: 5,
        enclosureConcept: 'opt-enc-irrelevant',
        redundantViaConcept: 'opt-make-slower',
      });
      expect(res.passed).toBe(false);
    });
  });

  describe('rt-4: validateRTSignalIntegrity', () => {
    it('validates coupling capacitance (20.0 fF), glitch voltage (0.25 V), and shielding', () => {
      const res = validateRTSignalIntegrity({
        couplingCapAns: 20.0,
        glitchVoltageAns: 0.25,
        mitigationConcept: CORRECT_CROSSTALK_MITIGATION_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(45);
      expect(res.stars).toBe(3);
    });

    it('rejects incorrect glitch voltage calculation', () => {
      const res = validateRTSignalIntegrity({
        couplingCapAns: 20.0,
        glitchVoltageAns: 0.90,
        mitigationConcept: CORRECT_CROSSTALK_MITIGATION_ID,
      });
      expect(res.glitchOk).toBe(false);
    });
  });

  describe('rt-5: validateRTKingdom', () => {
    it('validates capstone orthogonal M1/M2 layer assignment with zero shorts and LVS concept', () => {
      const res = validateRTKingdom({
        net1Layer: 'M1',
        net2Layer: 'M2',
        lvsConcept: CORRECT_LVS_CONCEPT_ID,
      });
      expect(res.passed).toBe(true);
      expect(res.score).toBe(50);
      expect(res.stars).toBe(3);
      expect(res.noShorts).toBe(true);
      expect(res.layerOk).toBe(true);
    });

    it('fails with DRC short when both intersecting nets share M1', () => {
      const res = validateRTKingdom({
        net1Layer: 'M1',
        net2Layer: 'M1',
        lvsConcept: CORRECT_LVS_CONCEPT_ID,
      });
      expect(res.passed).toBe(false);
      expect(res.noShorts).toBe(false);
    });
  });
});
