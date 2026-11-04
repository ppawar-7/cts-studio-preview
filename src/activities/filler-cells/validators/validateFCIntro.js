/**
 * validateFCIntro.js
 * ==================
 * Pure deterministic validator for Level 1 (fc-1): Why Filler Cells?
 */

export const CORRECT_WHY_FILLERS_ID = 'opt-well-continuity-and-density';

export function validateFCIntro(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete the filler cell foundation questions and gap calculations.',
    };
  }

  const { whyFillersConcept, emptySitesAns } = submission;

  const conceptOk = whyFillersConcept === CORRECT_WHY_FILLERS_ID;
  // Row of 100 sites with 65 logic sites -> 35 empty sites to fill
  const sitesVal = Number(emptySitesAns);
  const sitesOk = sitesVal === 35;

  const conceptScore = conceptOk ? 15 : 0;
  const sitesScore = sitesOk ? 15 : 0;

  const rawScore = conceptScore + sitesScore;
  const score = Math.min(30, rawScore);

  let stars = 0;
  if (score >= 30) stars = 3;
  else if (score >= 20) stars = 2;
  else if (score >= 10) stars = 1;

  const passed = conceptOk && sitesOk && score >= 20;

  let feedback = '';
  if (!conceptOk) {
    feedback = 'Filler cell purpose error: Filler cells are mandatory to guarantee continuous N-well & P-substrate implants, abut VDD/VSS power rails, and satisfy foundry CMP layer density rules.';
  } else if (!sitesOk) {
    feedback = 'Empty sites calculation error: Empty sites to fill = Total row width (100) - Placed logic cell width (65) = 35 sites!';
  } else if (stars === 3) {
    feedback = 'Flawless Filler Cell Foundation! You understand N-well continuity, power rail abutment, and CMP density requirements in physical design.';
  } else {
    feedback = `Good filler foundation (${score}/30 XP, ${stars} Stars)! You understand why empty silicon must be populated with physical-only cells.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    conceptOk,
    sitesOk,
  };
}
