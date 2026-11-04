/**
 * validateCTSSkewLatency.js
 * =========================
 * Pure deterministic validator for Level 2 (cts-2): Clock Skew and Latency.
 */

export const CORRECT_HOLD_HAZARD_ID = 'opt-positive-skew-hurts-hold';

export function validateCTSSkewLatency(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all skew, latency, and slack calculations.',
    };
  }

  const { launchLatency, captureLatency, setupSlackAns, holdRiskConcept } = submission;

  // Launch=0.20 ns, Capture=0.28 ns -> Skew = +0.08 ns (80 ps)
  const lOk = Math.abs(Number(launchLatency) - 0.20) <= 0.02 || Math.abs(Number(launchLatency) - 200) <= 10;
  const cOk = Math.abs(Number(captureLatency) - 0.28) <= 0.02 || Math.abs(Number(captureLatency) - 280) <= 10;
  // Setup slack with +0.08 ns skew: 1.00 - (0.10 + 0.85 + 0.10) + 0.08 = +0.03 ns (30 ps)
  const slackVal = Number(setupSlackAns);
  const slackOk = Math.abs(slackVal - 0.03) <= 0.01 || Math.abs(slackVal - 30) <= 5;
  const conceptOk = holdRiskConcept === CORRECT_HOLD_HAZARD_ID;

  const latencyScore = (lOk && cOk) ? 10 : 0;
  const slackScore = slackOk ? 15 : 0;
  const conceptScore = conceptOk ? 10 : 0;

  const rawScore = latencyScore + slackScore + conceptScore;
  const score = Math.min(35, rawScore);

  let stars = 0;
  if (score >= 35) stars = 3;
  else if (score >= 24) stars = 2;
  else if (score >= 12) stars = 1;

  const passed = (slackOk || conceptOk) && score >= 24;

  let feedback = '';
  if (!slackOk) {
    feedback = 'Setup slack formula: Slack = Period (1.00 ns) - (T_cq + T_comb + T_setup [1.05 ns]) + Skew (+0.08 ns) = +0.03 ns (30 ps).';
  } else if (!conceptOk) {
    feedback = 'Timing hazard concept: While positive clock skew helps setup timing, it directly worsens hold time margins and causes dangerous hold violations!';
  } else if (stars === 3) {
    feedback = 'Flawless Skew & Latency Mastery! You accurately evaluated insertion delay, useful clock skew setup benefits, and race condition hold hazards.';
  } else {
    feedback = `Good skew & latency analysis (${score}/35 XP, ${stars} Stars)! You understand how clock latency deltas govern flip-flop timing windows.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    latencyScore,
    slackScore,
    conceptScore,
  };
}
