/**
 * validateCTSIntro.js
 * ===================
 * Pure deterministic validator for Level 1 (cts-1): What is CTS?
 */

export const CORRECT_STA_VS_CTS_ID = 'opt-cts-builds-sta-checks';
export const CORRECT_LEAF_SINK_ID = 'opt-flops-latches-icg';

export function validateCTSIntro(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete the CTS foundation questions and metrics calculation.',
    };
  }

  const { staVsCtsConcept, leafSinkConcept, skewAnswer } = submission;

  const staCtsOk = staVsCtsConcept === CORRECT_STA_VS_CTS_ID;
  const leafOk = leafSinkConcept === CORRECT_LEAF_SINK_ID;
  // Sinks: 0.18 ns, 0.25 ns, 0.21 ns -> Skew = 0.25 - 0.18 = 0.07 ns (70 ps)
  const skewVal = Number(skewAnswer);
  const skewOk = Math.abs(skewVal - 0.07) <= 0.005 || Math.abs(skewVal - 70) <= 2;

  const staCtsScore = staCtsOk ? 10 : 0;
  const leafScore = leafOk ? 10 : 0;
  const skewScore = skewOk ? 10 : 0;

  const rawScore = staCtsScore + leafScore + skewScore;
  const score = Math.min(30, rawScore);

  let stars = 0;
  if (score >= 30) stars = 3;
  else if (score >= 20) stars = 2;
  else if (score >= 10) stars = 1;

  const passed = staCtsOk && (leafOk || skewOk) && score >= 20;

  let feedback = '';
  if (!staCtsOk) {
    feedback = 'Key concept error: STA is NOT CTS! CTS constructs the physical clock distribution network; STA evaluates timing slack.';
  } else if (!skewOk) {
    feedback = 'Skew calculation error: Clock skew = max arrival (0.25 ns) - min arrival (0.18 ns) = 0.070 ns (70 ps).';
  } else if (stars === 3) {
    feedback = 'Flawless CTS Foundation! You clearly understand the distinction between CTS network construction and STA timing verification, leaf sinks, and clock skew.';
  } else {
    feedback = `Good CTS foundation (${score}/30 XP, ${stars} Stars)! You understand how clock propagation transforms ideal clocks into physical networks.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    staCtsOk,
    leafOk,
    skewOk,
  };
}
