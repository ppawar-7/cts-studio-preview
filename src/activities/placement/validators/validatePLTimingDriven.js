/**
 * validatePLTimingDriven.js
 * ==========================
 * Pure deterministic validator for Level 3 (pl-3): Timing-Driven Placement.
 */

import { computeTotalHPWL } from '../../../engine/placementEngine.js';

export const CORRECT_NET_WEIGHT_ID = 'opt-high-net-weight-critical';

export function validatePLTimingDriven(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all HPWL calculations and timing-driven placement questions.',
    };
  }

  const { initialHPWL, optimizedHPWL, chosenPosition, netWeightConcept } = submission;

  const initOk = Math.abs(Number(initialHPWL) - 520) <= 5;
  const optOk = Math.abs(Number(optimizedHPWL) - 80) <= 2;
  const posOk = chosenPosition === 'pos-adjacent'; // (100, 40)
  const conceptOk = netWeightConcept === CORRECT_NET_WEIGHT_ID;

  const initScore = initOk ? 10 : 0;
  const optScore = optOk ? 10 : 0;
  const posScore = posOk ? 10 : 0;
  const conceptScore = conceptOk ? 10 : 0;

  const rawScore = initScore + optScore + posScore + conceptScore;
  const score = Math.min(40, rawScore);

  let stars = 0;
  if (score >= 40) stars = 3;
  else if (score >= 28) stars = 2;
  else if (score >= 15) stars = 1;

  const passed = (initOk || optOk) && posOk && score >= 28;

  let feedback = '';
  if (!initOk || !optOk) {
    feedback = `HPWL calculations: Initial (20,40) to (340,240) = (340-20)+(240-40) = 520 µm. Optimized (20,40) to (100,40) = (100-20)+(40-40) = 80 µm!`;
  } else if (!posOk) {
    feedback = 'Move Flop B adjacent to Flop A on Row 1 (100, 40) to minimize critical interconnect delay!';
  } else if (stars === 3) {
    feedback = 'Flawless Timing-Driven Placement! You calculated bounding-box wirelength, clustered timing-critical paths, and mastered net weighting in physical design.';
  } else {
    feedback = `Great timing-driven placement (${score}/40 XP, ${stars} Stars)! You understand how cell placement directly dictates interconnect RC delay.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    initOk,
    optOk,
    posOk,
    conceptOk,
  };
}
