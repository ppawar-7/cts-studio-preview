/**
 * validateSynCapstone.js
 * =======================
 * Pure deterministic validator for Level 5 (syn-5): Synthesis Kingdom Challenge.
 */

import { evaluateMappedNetwork, computeSetupSlack } from '../../../engine/synthesisEngine.js';

export const CORRECT_CAPSTONE_CELLS_ID = 'opt-and-xor-mux';
export const CORRECT_QOR_CONCEPT_ID = 'opt-ppa-pareto';

export function validateSynCapstone(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete the synthesis capstone mapping, metric calculations, and QoR concept questions.',
    };
  }

  const { cellMappingChoice, computedArea, computedDelay, computedSlack, qorConcept } = submission;

  const mappingOk = cellMappingChoice === CORRECT_CAPSTONE_CELLS_ID;
  const areaOk = Math.abs(Number(computedArea) - 8.5) <= 0.1;
  const delayOk = Math.abs(Number(computedDelay) - 0.38) <= 0.02;
  const slackOk = Math.abs(Number(computedSlack) - 0.09) <= 0.02;
  const qorOk = qorConcept === CORRECT_QOR_CONCEPT_ID;

  const mappingScore = mappingOk ? 15 : 0;
  const metricScore = (areaOk ? 8 : 0) + (delayOk ? 7 : 0); // 15 XP
  const slackScore = slackOk ? 10 : 0;                    // 10 XP
  const qorScore = qorOk ? 10 : 0;                        // 10 XP

  const rawScore = mappingScore + metricScore + slackScore + qorScore;
  const score = Math.min(50, rawScore);

  let stars = 0;
  if (score >= 50) stars = 3;
  else if (score >= 38) stars = 2;
  else if (score >= 20) stars = 1;

  const passed = mappingOk && (areaOk || delayOk || slackOk) && score >= 38;

  let feedback = '';
  if (!mappingOk) {
    feedback = 'Select the optimal combination: AND2_X1 (2.0 GE) + XOR2_X1 (3.0 GE) + MUX2_X1 (3.5 GE) to meet both area and timing targets!';
  } else if (!areaOk || !delayOk || !slackOk) {
    feedback = `Calculations: Area ${computedArea} (expected 8.5 GE), Delay ${computedDelay} ns (expected 0.38 ns), Slack ${computedSlack} ns (expected +0.09 ns under T_clk=0.70 ns).`;
  } else if (stars === 3) {
    feedback = 'Flawless Synthesis Capstone! You executed technology mapping, met the 0.40 ns delay budget, closed timing slack at +0.09 ns, and mastered PPA QoR trade-offs.';
  } else {
    feedback = `Great work on the Synthesis Capstone (${score}/50 XP, ${stars} Stars)! You are ready to advance to Floorplanning.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    mappingOk,
    areaOk,
    delayOk,
    slackOk,
    qorOk,
  };
}
