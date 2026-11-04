/**
 * validateGDSSignoffChecks.js
 * ===========================
 * Pure deterministic validator for Level 2 (gds-2): Final Sign-Off Checks.
 */

export const CORRECT_SIGNOFF_GATE_ID = 'opt-tapeout-signoff-gate';
export const CORRECT_LVS_ERROR_ID = 'opt-lvs-open-circuit';

export function validateGDSSignoffChecks(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all sign-off verification questions.',
    };
  }

  const { signoffGateConcept, lvsErrorConcept, checksPassed } = submission;

  const gateOk = signoffGateConcept === CORRECT_SIGNOFF_GATE_ID;
  const lvsOk = lvsErrorConcept === CORRECT_LVS_ERROR_ID;
  // All 4 audit checks toggled clean in the interactive UI
  const auditOk = Boolean(checksPassed && checksPassed.drc && checksPassed.lvs && checksPassed.sta && checksPassed.erc);

  const score1 = gateOk ? 15 : 0;
  const score2 = lvsOk ? 10 : 0;
  const score3 = auditOk ? 10 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(35, rawScore);

  let stars = 0;
  if (score >= 35) stars = 3;
  else if (score >= 24) stars = 2;
  else if (score >= 12) stars = 1;

  const passed = gateOk && (lvsOk || auditOk) && score >= 24;

  let feedback = '';
  if (!gateOk) {
    feedback = 'Sign-off gate concept error: Tape-out signoff mandates 100% clean DRC, LVS, and STA with zero violations because fabricating an unverified mask set costs millions of dollars and takes months to refabricate.';
  } else if (!lvsOk) {
    feedback = 'LVS error debugging: An "unconnected pin" or missing polygon indicates an electrical open circuit where a wire failed to reach a destination cell pin.';
  } else if (stars === 3) {
    feedback = 'Flawless Sign-Off Mastery! You completed the comprehensive sign-off audit and understand the critical gates governing foundry tape-out.';
  } else {
    feedback = `Good sign-off analysis (${score}/35 XP, ${stars} Stars)! You understand physical verification quality gates.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    gateOk,
    lvsOk,
    auditOk,
  };
}
