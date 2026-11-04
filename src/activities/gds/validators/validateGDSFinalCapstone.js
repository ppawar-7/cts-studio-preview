/**
 * validateGDSFinalCapstone.js
 * ===========================
 * Pure deterministic validator for Level 5 (gds-5): Final ASIC Kingdom Capstone Challenge.
 */

export const CORRECT_FLOW_SUMMARY_ID = 'opt-full-flow-summary';

export function validateGDSFinalCapstone(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete the final tape-out signoff audit and comprehensive curriculum question.',
    };
  }

  const { signoffAudit, flowSummaryConcept } = submission;

  // Verify all 6 signoff criteria confirmed
  const auditOk = Boolean(
    signoffAudit &&
    signoffAudit.drc &&
    signoffAudit.lvs &&
    signoffAudit.sta &&
    signoffAudit.antenna &&
    signoffAudit.cmp &&
    signoffAudit.erc
  );

  const summaryOk = flowSummaryConcept === CORRECT_FLOW_SUMMARY_ID;

  const score1 = auditOk ? 25 : 0;
  const score2 = summaryOk ? 25 : 0;

  const rawScore = score1 + score2;
  const score = Math.min(50, rawScore);

  let stars = 0;
  if (score >= 50) stars = 3;
  else if (score >= 38) stars = 2;
  else if (score >= 20) stars = 1;

  const passed = auditOk && summaryOk && score >= 38;

  let feedback = '';
  if (!auditOk) {
    feedback = 'Sign-off audit incomplete: Confirm all 6 signoff verification checkpoints (DRC, LVS, STA, ERC, Antenna, CMP) to certify chip tape-out readiness!';
  } else if (!summaryOk) {
    feedback = 'Curriculum flow summary error: Physical design takes RTL, synthesizes standard gates, establishes floorplan boundaries, legalizes placement, builds balanced clock trees, routes multilayer interconnects, bridges gaps with filler cells, and signs off GDSII mask stream files to the foundry.';
  } else if (stars === 3) {
    feedback = '🏆 CONGRATULATIONS! YOU HAVE COMPLETED THE ENTIRE ASIC PHYSICAL DESIGN JOURNEY! All 8 Kingdoms certified, 40/40 levels mastered, and your GDSII chip is officially taped out to the semiconductor foundry!';
  } else {
    feedback = `Great tape-out completion (${score}/50 XP, ${stars} Stars)! You have mastered the complete ASIC physical design flow.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    auditOk,
    summaryOk,
  };
}
