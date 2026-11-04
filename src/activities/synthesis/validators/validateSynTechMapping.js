/**
 * validateSynTechMapping.js
 * ==========================
 * Pure deterministic validator for Level 3 (syn-3): Technology Mapping.
 */

import { evaluateMappedNetwork, EDUCATIONAL_CELL_LIBRARY } from '../../../engine/synthesisEngine.js';

export const CORRECT_OPTIMAL_CELL_ID = 'MUX2_X1';
export const CORRECT_LIBERTY_CONCEPT_ID = 'opt-nldm-liberty';

export function validateSynTechMapping(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete technology mapping calculations and concept questions.',
    };
  }

  const { calculatedArea, calculatedDelay, chosenMapping, libertyConcept } = submission;

  // Expected metrics for All-NAND mapping: 1x INV_X1 (1.0) + 3x NAND2_X1 (4.5) = 5.5 area
  // Critical path: INV_X1 (0.05) + NAND2_X1 (0.08) + NAND2_X1 (0.08) = 0.21 ns
  const expectedArea = 5.5;
  const expectedDelay = 0.21;

  const areaOk = Math.abs(Number(calculatedArea) - expectedArea) <= 0.05;
  const delayOk = Math.abs(Number(calculatedDelay) - expectedDelay) <= 0.01;
  const calcScore = (areaOk ? 10 : 0) + (delayOk ? 10 : 0); // up to 20 XP

  const optimalChosen = chosenMapping === CORRECT_OPTIMAL_CELL_ID; // 10 XP
  const libertyCorrect = libertyConcept === CORRECT_LIBERTY_CONCEPT_ID; // 10 XP

  const rawScore = calcScore + (optimalChosen ? 10 : 0) + (libertyCorrect ? 10 : 0);
  const score = Math.min(40, rawScore);

  let stars = 0;
  if (score >= 40) stars = 3;
  else if (score >= 28) stars = 2;
  else if (score >= 15) stars = 1;

  const passed = (areaOk || delayOk) && optimalChosen && score >= 28;

  let feedback = '';
  if (!areaOk || !delayOk) {
    feedback = `Calculations: Area ${calculatedArea} (expected ${expectedArea}), Delay ${calculatedDelay} ns (expected ${expectedDelay} ns). Sum cell areas: 1x INV (1.0) + 3x NAND2 (4.5) = 5.5!`;
  } else if (!optimalChosen) {
    feedback = 'Under strict constraints (Area <= 4.0, Delay <= 0.20 ns), select the dedicated complex standard cell (MUX2_X1) to achieve optimal density.';
  } else if (stars === 3) {
    feedback = 'Flawless Technology Mapping! You calculated cell metrics, performed multi-gate substitution, and selected dedicated library macro cells.';
  } else {
    feedback = `Good technology mapping (${score}/40 XP, ${stars} Stars)! You understand how synthesis binders choose foundry cells based on Area/Delay trade-offs.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    areaOk,
    delayOk,
    optimalChosen,
    libertyCorrect,
  };
}
