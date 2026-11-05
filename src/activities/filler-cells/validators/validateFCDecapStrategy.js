/**
 * validateFCDecapStrategy.js
 * ===========================
 * Pure deterministic validator for Level 4 (fc-4): Decap Cell Strategy.
 */

import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_DECAP_PENALTY_ID = 'opt-decap-leakage-power';

export function validateFCDecapStrategy(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all decap droop calculations and trade-off questions.',
    };
  }

  const { droop100Ans, droop500Ans, decapPenaltyConcept } = submission;

  // I = 100 mA, dt = 200 ps
  // At 100 pF: Droop = (100 * 200) / 100 = 200 mV (0.20 V)
  const d100Val = Number(droop100Ans);
  const d100Ok = Math.abs(d100Val - 200) <= 5 || Math.abs(d100Val - 0.20) <= 0.01;

  // At 500 pF: Droop = (100 * 200) / 500 = 40 mV (0.04 V)
  const d500Val = Number(droop500Ans);
  const d500Ok = Math.abs(d500Val - 40) <= 2 || Math.abs(d500Val - 0.04) <= 0.005;

  const conceptOk = decapPenaltyConcept === CORRECT_DECAP_PENALTY_ID;

  const score1 = d100Ok ? 15 : 0;
  const score2 = d500Ok ? 15 : 0;
  const score3 = conceptOk ? 15 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(45, rawScore);

  let stars = 0;
  if (score >= 45) stars = 3;
  else if (score >= 32) stars = 2;
  else if (score >= 18) stars = 1;

  const passed = (d100Ok || d500Ok) && conceptOk && score >= 32;

  let feedback = '';
  if (!d100Ok || !d500Ok) {
    feedback = 'Droop calculation error: Delta_V = (I * dt) / C. For 100 pF: (100 * 200) / 100 = 200 mV. For 500 pF: (100 * 200) / 500 = 40 mV!';
  } else if (!conceptOk) {
    feedback = 'Decap trade-off concept: Adding decoupling capacitor cells inflates static gate tunneling leakage current and adds Time-Dependent Dielectric Breakdown (TDDB) reliability risk.';
  } else if (stars === 3) {
    feedback = 'Flawless Decap Strategy! You quantified dynamic IR drop suppression and mastered the trade-offs between switching droop and gate tunneling leakage.';
  } else {
    feedback = `Good decap analysis (${score}/45 XP, ${stars} Stars)! You understand how on-die capacitance stabilizes power delivery networks.`;
  }

  // Droop at 500 pF is 40 mV (<= 40 mV limit)
  // Decap standby leakage is 14.5 µA (<= 20.0 µA budget)
  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.FILLER_CELLS_DENSITY,
    sourceLevelId: 'fc-4',
    inputs: {
      droop100Ans,
      droop500Ans,
      decapPenaltyConcept,
    },
    measurements: {
      droopMv: d500Ok ? 40 : 200,
      maxAllowedDroopMv: 40,
      decapCapPf: 500,
      decapCapFf: 500000,
      leakageUa: 14.5,
      maxAllowedLeakageUa: 20.0,
      drcViolations: 0,
    },
    units: {
      droopMv: 'mV',
      decapCapPf: 'pF',
      leakageUa: 'µA',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    d100Ok,
    d500Ok,
    conceptOk,
    artifacts,
  };
}
