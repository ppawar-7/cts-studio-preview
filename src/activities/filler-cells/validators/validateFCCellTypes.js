/**
 * validateFCCellTypes.js
 * ======================
 * Pure deterministic validator for Level 2 (fc-2): Types of Physical-Only Cells.
 */

export const CORRECT_TAPCELL_ID = 'opt-tapcell-latchup';
export const CORRECT_ENDCAP_ID = 'opt-endcap-boundary';
export const CORRECT_TIE_ID = 'opt-prevent-oxide-breakdown';

export function validateFCCellTypes(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all physical-only cell taxonomy questions.',
    };
  }

  const { tapcellConcept, endcapConcept, tieConcept } = submission;

  const tapOk = tapcellConcept === CORRECT_TAPCELL_ID;
  const endOk = endcapConcept === CORRECT_ENDCAP_ID;
  const tieOk = tieConcept === CORRECT_TIE_ID;

  const score1 = tapOk ? 15 : 0;
  const score2 = endOk ? 10 : 0;
  const score3 = tieOk ? 10 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(35, rawScore);

  let stars = 0;
  if (score >= 35) stars = 3;
  else if (score >= 24) stars = 2;
  else if (score >= 12) stars = 1;

  const passed = (tapOk || tieOk) && endOk && score >= 24;

  let feedback = '';
  if (!tapOk) {
    feedback = 'Well Tap error: Tap cells (TAPCELL) bias the N-well and P-substrate to prevent CMOS latch-up (parasitic SCR thyristor triggering).';
  } else if (!endOk) {
    feedback = 'Endcap error: Endcap cells (ENDCAP) are placed at the outer ends/boundaries of cell rows to terminate diffusion and protect gate oxide during CMP.';
  } else if (!tieOk) {
    feedback = 'Tie cell error: Tie-high and tie-low cells protect fragile transistor gate oxide from ESD spikes and dielectric rupture, which occurs if gates are tied directly to VDD/VSS rails.';
  } else if (stars === 3) {
    feedback = 'Flawless Physical-Only Cell Mastery! You understand the critical roles of Tap cells, Endcaps, and Tie cells in modern chip reliability.';
  } else {
    feedback = `Good cell types analysis (${score}/35 XP, ${stars} Stars)! You understand physical-only cell libraries.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    tapOk,
    endOk,
    tieOk,
  };
}
