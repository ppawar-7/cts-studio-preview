/**
 * validateSynTiming.js
 * =====================
 * Pure deterministic validator for Level 4 (syn-4): Timing Constraints.
 */

import { computeSetupSlack } from '../../../engine/synthesisEngine.js';

export const CORRECT_TIMING_FIX_ID = 'opt-retiming-pipeline';
export const CORRECT_SDC_CONCEPT_ID = 'opt-sdc-uncertainty';

export function validateSynTiming(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all timing calculations and constraint questions.',
    };
  }

  const { sc1Arrival, sc1Required, sc1Slack, sc2Slack, fixStrategy, sdcConcept } = submission;

  // Scenario 1: T_comb = 0.52 ns. Arrival = 0.67 ns, Required = 0.92 ns, Slack = +0.25 ns
  const sc1ArrOk = Math.abs(Number(sc1Arrival) - 0.67) <= 0.02;
  const sc1ReqOk = Math.abs(Number(sc1Required) - 0.92) <= 0.02;
  const sc1SlkOk = Math.abs(Number(sc1Slack) - 0.25) <= 0.02;

  // Scenario 2: T_comb = 0.85 ns. Arrival = 1.00 ns, Required = 0.92 ns, Slack = -0.08 ns
  const sc2SlkOk = Math.abs(Number(sc2Slack) - (-0.08)) <= 0.02;

  const sc1Score = (sc1ArrOk ? 5 : 0) + (sc1ReqOk ? 5 : 0) + (sc1SlkOk ? 5 : 0); // up to 15 XP
  const sc2Score = sc2SlkOk ? 10 : 0; // 10 XP
  const fixScore = fixStrategy === CORRECT_TIMING_FIX_ID ? 10 : 0; // 10 XP
  const sdcScore = sdcConcept === CORRECT_SDC_CONCEPT_ID ? 10 : 0; // 10 XP

  const rawScore = sc1Score + sc2Score + fixScore + sdcScore;
  const score = Math.min(45, rawScore);

  let stars = 0;
  if (score >= 45) stars = 3;
  else if (score >= 32) stars = 2;
  else if (score >= 18) stars = 1;

  const passed = (sc1SlkOk || sc2SlkOk) && fixScore > 0 && score >= 32;

  let feedback = '';
  if (!sc1SlkOk || !sc2SlkOk) {
    feedback = 'Check your slack calculations! Remember: Arrival = T_cq + T_comb, Required = T_period - T_setup, and Slack = Required - Arrival. Negative slack indicates a timing violation!';
  } else if (fixScore === 0) {
    feedback = 'To resolve negative setup slack, engineers pipeline long combinational paths or size up driving gates, rather than making the clock period shorter!';
  } else if (stars === 3) {
    feedback = 'Flawless Static Timing Analysis! You calculated arrival/required times, analyzed positive/negative slack, and identified pipelining remediation techniques.';
  } else {
    feedback = `Good timing analysis (${score}/45 XP, ${stars} Stars)! You understand how synthesis constraints guide timing closure.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    sc1ArrOk,
    sc1ReqOk,
    sc1SlkOk,
    sc2SlkOk,
    fixCorrect: fixScore > 0,
    sdcCorrect: sdcScore > 0,
  };
}
