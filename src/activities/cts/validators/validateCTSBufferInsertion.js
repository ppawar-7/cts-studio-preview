/**
 * validateCTSBufferInsertion.js
 * ==============================
 * Pure deterministic validator for Level 3 (cts-3): Buffer Insertion.
 */

export const CORRECT_SLEW_CONCEPT_ID = 'opt-transition-slew-control';

export function validateCTSBufferInsertion(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please configure buffer insertion and complete the slew control question.',
    };
  }

  const { bufferStages, chosenBuffer, slewConcept } = submission;

  const numStages = parseInt(bufferStages, 10);
  // Early=0.100 ns, Late=0.250 ns -> Delta = 0.150 ns.
  // With CLKBUF_X2 (0.050 ns each), 3 stages gives exact balance (0.150 ns added).
  const stagesOk = numStages === 3;
  const bufferOk = chosenBuffer === 'CLKBUF_X2';
  const conceptOk = slewConcept === CORRECT_SLEW_CONCEPT_ID;

  const stagesScore = stagesOk ? 15 : 0;
  const bufferScore = bufferOk ? 10 : 0;
  const conceptScore = conceptOk ? 15 : 0;

  const rawScore = stagesScore + bufferScore + conceptScore;
  const score = Math.min(40, rawScore);

  let stars = 0;
  if (score >= 40) stars = 3;
  else if (score >= 28) stars = 2;
  else if (score >= 15) stars = 1;

  const passed = stagesOk && bufferOk && score >= 28;

  let feedback = '';
  if (!stagesOk || !bufferOk) {
    feedback = 'Buffer balancing error: Branch A needs exactly 3 stages of CLKBUF_X2 (3 * 0.050 ns = 0.150 ns) to match Branch B (0.250 ns) and achieve 0 ps residual skew!';
  } else if (!conceptOk) {
    feedback = 'Slew control concept: CTS buffers are placed not only to balance skew, but also to maintain sharp clock slew (transition time) and limit capacitive RC degradation.';
  } else if (stars === 3) {
    feedback = 'Flawless Buffer Balancing! You equalized clock branch arrival times, achieved 0 ps residual skew, and mastered clock slew rate control.';
  } else {
    feedback = `Good buffer insertion design (${score}/40 XP, ${stars} Stars)! You understand how repeater insertion balances clock networks.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    stagesOk,
    bufferOk,
    conceptOk,
  };
}
