/**
 * validateRTMetalLayers.js
 * ========================
 * Pure deterministic validator for Level 2 (rt-2): Metal Layers.
 */

export const CORRECT_M2_DIR_ID = 'opt-m2-vertical';
export const CORRECT_ALTERNATE_ID = 'opt-avoid-interlayer-coupling';
export const CORRECT_GLOBAL_LAYER_ID = 'opt-top-thick-metals';

export function validateRTMetalLayers(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all metal layer questions.',
    };
  }

  const { m2Direction, alternateConcept, globalLayerChoice } = submission;

  const q1Ok = m2Direction === CORRECT_M2_DIR_ID;
  const q2Ok = alternateConcept === CORRECT_ALTERNATE_ID;
  const q3Ok = globalLayerChoice === CORRECT_GLOBAL_LAYER_ID;

  const score1 = q1Ok ? 10 : 0;
  const score2 = q2Ok ? 15 : 0;
  const score3 = q3Ok ? 10 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(35, rawScore);

  let stars = 0;
  if (score >= 35) stars = 3;
  else if (score >= 24) stars = 2;
  else if (score >= 12) stars = 1;

  const passed = (q1Ok || q3Ok) && q2Ok && score >= 24;

  let feedback = '';
  if (!q1Ok) {
    feedback = 'M2 direction error: Metal 2 runs vertically (V) orthogonal to Metal 1 (H).';
  } else if (!q2Ok) {
    feedback = 'Alternating direction concept: Alternating H and V preferred directions minimizes overlap surface area between adjacent metal layers, drastically reducing vertical inter-layer parasitic capacitance.';
  } else if (!q3Ok) {
    feedback = 'Layer selection error: Long clock trunks and power grids require top thick metal layers (M5/M6) to minimize IR drop and RC interconnect delay.';
  } else if (stars === 3) {
    feedback = 'Flawless Metal Stack Mastery! You understand layer hierarchy, preferred routing directions, and resistance characteristics from M1 to top global metals.';
  } else {
    feedback = `Good metal layer analysis (${score}/35 XP, ${stars} Stars)! You understand layer allocation in advanced physical design.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    q1Ok,
    q2Ok,
    q3Ok,
  };
}
