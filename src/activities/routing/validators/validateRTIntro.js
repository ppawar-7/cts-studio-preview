/**
 * validateRTIntro.js
 * ==================
 * Pure deterministic validator for Level 1 (rt-1): Introduction to Routing.
 */

export const CORRECT_ROUTING_PHASES_ID = 'opt-global-then-detailed';

export function validateRTIntro(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all routing introduction questions and calculations.',
    };
  }

  const { routingPhasesConcept, manhattanDistanceAns } = submission;

  const phasesOk = routingPhasesConcept === CORRECT_ROUTING_PHASES_ID;
  // Pin A (20, 30) to Pin B (140, 90) -> dx = 120, dy = 60 -> Manhattan = 180 um
  const distVal = Number(manhattanDistanceAns);
  const distOk = Math.abs(distVal - 180) <= 2;

  const phasesScore = phasesOk ? 15 : 0;
  const distScore = distOk ? 15 : 0;

  const rawScore = phasesScore + distScore;
  const score = Math.min(30, rawScore);

  let stars = 0;
  if (score >= 30) stars = 3;
  else if (score >= 20) stars = 2;
  else if (score >= 10) stars = 1;

  const passed = phasesOk && distOk && score >= 20;

  let feedback = '';
  if (!phasesOk) {
    feedback = 'Routing flow error: Global routing plans coarse tile paths and checks track capacity; Detailed routing assigns exact nanometer metal tracks and vias to satisfy all DRC design rules.';
  } else if (!distOk) {
    feedback = 'Manhattan distance error: Distance = |X2 - X1| + |Y2 - Y1| = |140 - 20| + |90 - 30| = 120 + 60 = 180 µm!';
  } else if (stars === 3) {
    feedback = 'Flawless Routing Introduction! You mastered the two-phase routing hierarchy and orthogonal Manhattan interconnect estimation.';
  } else {
    feedback = `Good routing foundation (${score}/30 XP, ${stars} Stars)! You understand how EDA routers translate netlists into physical wires.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    phasesOk,
    distOk,
  };
}
