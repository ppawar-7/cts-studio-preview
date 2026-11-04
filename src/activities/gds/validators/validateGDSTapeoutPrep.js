/**
 * validateGDSTapeoutPrep.js
 * =========================
 * Pure deterministic validator for Level 4 (gds-4): Tape-Out Preparation.
 */

export const CORRECT_ANTENNA_DIODE_ID = 'opt-antenna-diode-required';
export const CORRECT_OPC_ID = 'opt-opc-diffraction-correction';

export function validateGDSTapeoutPrep(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all antenna calculation and mask data preparation questions.',
    };
  }

  const { antennaRatioAns, diodeDecision, opcConcept } = submission;

  // Metal Area = 60 um2, Gate Area = 0.20 um2 -> AR = 60 / 0.20 = 300
  const arVal = Number(antennaRatioAns);
  const arOk = Math.abs(arVal - 300) <= 2;
  const diodeOk = diodeDecision === CORRECT_ANTENNA_DIODE_ID;
  const opcOk = opcConcept === CORRECT_OPC_ID;

  const score1 = arOk ? 15 : 0;
  const score2 = diodeOk ? 15 : 0;
  const score3 = opcOk ? 15 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(45, rawScore);

  let stars = 0;
  if (score >= 45) stars = 3;
  else if (score >= 32) stars = 2;
  else if (score >= 18) stars = 1;

  const passed = (arOk || diodeOk) && opcOk && score >= 32;

  let feedback = '';
  if (!arOk) {
    feedback = 'Antenna Ratio calculation error: AR = Metal Area / Gate Oxide Area = 60 / 0.20 = 300.';
  } else if (!diodeOk) {
    feedback = 'Antenna diode error: Because calculated ratio (300) exceeds foundry limit (200), an antenna diode MUST be inserted to bleed plasma charge to substrate.';
  } else if (!opcOk) {
    feedback = 'Mask Data Prep concept error: Optical Proximity Correction (OPC) modifies mask reticles with serifs and assist features to counteract sub-wavelength optical diffraction.';
  } else if (stars === 3) {
    feedback = 'Flawless Tape-Out Preparation! You calculated antenna ratios, inserted protective bleed diodes, and mastered foundry Optical Proximity Correction (OPC).';
  } else {
    feedback = `Good tape-out prep analysis (${score}/45 XP, ${stars} Stars)! You understand mask data preparation.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    arOk,
    diodeOk,
    opcOk,
  };
}
