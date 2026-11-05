/**
 * validateRTSignalIntegrity.js
 * ============================
 * Pure deterministic validator for Level 4 (rt-4): Signal Integrity.
 */

import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_CROSSTALK_MITIGATION_ID = 'opt-shielding-spacing';

export function validateRTSignalIntegrity(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all crosstalk noise calculations and mitigation questions.',
    };
  }

  const { couplingCapAns, glitchVoltageAns, mitigationConcept } = submission;

  // L = 100 um, S = 0.20 um -> Cc = 0.04 * (100 / 0.20) = 20.0 fF
  const ccVal = Number(couplingCapAns);
  const ccOk = Math.abs(ccVal - 20.0) <= 0.5;

  // Cg = 60 fF, Vdd = 1.0 V -> Glitch = 1.0 * (20 / 80) = 0.25 V
  const glitchVal = Number(glitchVoltageAns);
  const glitchOk = Math.abs(glitchVal - 0.25) <= 0.02 || Math.abs(glitchVal - 250) <= 10;

  const conceptOk = mitigationConcept === CORRECT_CROSSTALK_MITIGATION_ID;

  const score1 = ccOk ? 15 : 0;
  const score2 = glitchOk ? 15 : 0;
  const score3 = conceptOk ? 15 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(45, rawScore);

  let stars = 0;
  if (score >= 45) stars = 3;
  else if (score >= 32) stars = 2;
  else if (score >= 18) stars = 1;

  const passed = (ccOk || glitchOk) && conceptOk && score >= 32;

  let feedback = '';
  if (!ccOk) {
    feedback = 'Coupling capacitance calculation error: Cc = k * (L / S) = 0.04 * (100 / 0.20) = 20.0 fF.';
  } else if (!glitchOk) {
    feedback = 'Glitch voltage calculation error: Delta_V = Vdd * [Cc / (Cc + Cg)] = 1.0 * [20 / (20 + 60)] = 0.25 V (250 mV).';
  } else if (!conceptOk) {
    feedback = 'Signal integrity mitigation concept: Crosstalk noise is mitigated by inserting constant VSS/VDD shield traces between aggressor and victim, or by applying double spacing rules.';
  } else if (stars === 3) {
    feedback = 'Flawless Signal Integrity Analysis! You accurately calculated sidewall coupling capacitance, predicted victim noise glitches, and applied physical shielding mitigations.';
  } else {
    feedback = `Good signal integrity analysis (${score}/45 XP, ${stars} Stars)! You understand how deep submicron capacitive crosstalk impacts timing and functional reliability.`;
  }

  // When mitigated via shielding, victim noise glitch drops to 25 mV (limit: 50 mV)
  const mitigatedGlitchMv = conceptOk ? 25.0 : 250.0;

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.ROUTING_INTERCONNECT,
    sourceLevelId: 'rt-4',
    inputs: {
      couplingCapAns,
      glitchVoltageAns,
      mitigationConcept,
    },
    measurements: {
      couplingCapFf: ccVal || 20.0,
      glitchVoltageMv: mitigatedGlitchMv,
      maxVictimNoiseMv: mitigatedGlitchMv,
      maxAllowedNoiseMv: 50.0,
      unconstrained: 0,
      timingSlackNs: 0.020,
      wnsPs: 20,
    },
    units: {
      couplingCapFf: 'fF',
      glitchVoltageMv: 'mV',
      maxVictimNoiseMv: 'mV',
      maxAllowedNoiseMv: 'mV',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    ccOk,
    glitchOk,
    conceptOk,
    artifacts,
  };
}
