/**
 * validatePLIntro.js
 * ==================
 * Pure deterministic validator for Level 1 (pl-1): What is Placement?
 */

export const CORRECT_ROW_ABUT_ID = 'opt-shared-power-rails';
export const CORRECT_ORIENTATION_ID = 'opt-mx-alternating-rows';

export function validatePLIntro(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all standard cell placement questions.',
    };
  }

  const { rowHeightConcept, orientationConcept } = submission;

  const q1Ok = rowHeightConcept === CORRECT_ROW_ABUT_ID;
  const q2Ok = orientationConcept === CORRECT_ORIENTATION_ID;

  const score = (q1Ok ? 15 : 0) + (q2Ok ? 15 : 0);

  let stars = 0;
  if (score >= 30) stars = 3;
  else if (score >= 20) stars = 2;
  else if (score >= 10) stars = 1;

  const passed = q1Ok && q2Ok && score >= 20;

  let feedback = '';
  if (!passed) {
    feedback = 'Review standard cell rows: All cells in a library share uniform height so VDD/VSS rails abut continuously, and alternating rows flip (MX) to share rails!';
  } else if (stars === 3) {
    feedback = 'Flawless! You understand standard cell row structure, continuous power rail abutment, and row orientation flipping (R0 / MX).';
  } else {
    feedback = `Good placement foundation (${score}/30 XP, ${stars} Stars)! You are ready to explore global and detailed placement.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    q1Ok,
    q2Ok,
  };
}
