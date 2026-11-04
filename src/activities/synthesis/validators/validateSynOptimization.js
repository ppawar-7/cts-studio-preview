/**
 * validateSynOptimization.js
 * ===========================
 * Pure deterministic validator for Level 2 (syn-2): Logic Optimization.
 */

export const OPTIMIZATION_EXERCISES = [
  { id: 'opt1', expr: 'A & 1', expected: 'A', reason: 'Identity law for AND: any signal AND 1 is the signal itself' },
  { id: 'opt2', expr: 'B | 0', expected: 'B', reason: 'Identity law for OR: any signal OR 0 is the signal itself' },
  { id: 'opt3', expr: 'C & 0', expected: '0', reason: 'Null law for AND: any signal AND 0 is constantly 0' },
  { id: 'opt4', expr: '~(~D)',  expected: 'D', reason: 'Involution law: double inversion cancels out in digital logic' },
];

export const CORRECT_FACTORING_ID = 'opt-factored-form';
export const CORRECT_DEMORGAN_ID = 'opt-demorgan-law';

export function validateSynOptimization(submission) {
  if (!submission || !submission.answers) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please simplify all Boolean expressions and answer the optimization concept questions.',
    };
  }

  const { answers, factoringAnswer, demorganAnswer } = submission;
  let correctCount = 0;
  const exerciseResults = [];

  OPTIMIZATION_EXERCISES.forEach((ex) => {
    const studentAns = (answers[ex.id] || '').trim().toUpperCase();
    const isCorrect = studentAns === ex.expected;
    if (isCorrect) correctCount++;
    exerciseResults.push({
      id: ex.id,
      expr: ex.expr,
      studentAns,
      expected: ex.expected,
      isCorrect,
      reason: ex.reason,
    });
  });

  const factoringCorrect = factoringAnswer === CORRECT_FACTORING_ID;
  const demorganCorrect = demorganAnswer === CORRECT_DEMORGAN_ID;

  // 4 exercises * 5 XP = 20 XP. Factoring = 10 XP. De Morgan = 5 XP. Total = 35 XP max.
  const score = Math.min(35, correctCount * 5 + (factoringCorrect ? 10 : 0) + (demorganCorrect ? 5 : 0));

  let stars = 0;
  if (score >= 35) stars = 3;
  else if (score >= 24) stars = 2;
  else if (score >= 12) stars = 1;

  const passed = correctCount >= 3 && factoringCorrect && score >= 24;

  let feedback = '';
  if (!passed) {
    feedback = `You solved ${correctCount}/4 algebraic simplifications. Remember: Constant inputs (0/1) allow complete gate pruning, and double inverters cancel out!`;
  } else if (stars === 3) {
    feedback = 'Flawless Boolean Optimization! You mastered constant propagation, gate reduction, factoring, and De Morgan laws.';
  } else {
    feedback = `Great logic minimization (${score}/35 XP, ${stars} Stars)! Your optimizations reduce both silicon area and dynamic power.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    exerciseResults,
    factoringCorrect,
    demorganCorrect,
  };
}
