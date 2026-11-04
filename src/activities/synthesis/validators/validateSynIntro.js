/**
 * validateSynIntro.js
 * ===================
 * Pure deterministic validator for Level 1 (syn-1): What is Synthesis?
 */

export const SYNTHESIS_STAGES = [
  { id: 'translation', name: 'Phase 1: Translation (Elaboration)', expectedTarget: 'gtech', desc: 'Parses RTL HDL into an abstract syntax tree and generic Boolean logic network (GTECH)' },
  { id: 'optimization', name: 'Phase 2: Logic Optimization', expectedTarget: 'boolean-min', desc: 'Applies Boolean algebra (De Morgan, constant folding, common subexpressions) to minimize literal count' },
  { id: 'mapping', name: 'Phase 3: Technology Mapping', expectedTarget: 'cell-bind', desc: 'Binds generic gates to physical standard cells (NAND, NOR, DFF) from the target foundry library' },
];

export const CORRECT_SYN_INTRO_CONCEPT_ID = 'opt-generic-decoupling';

export function validateSynIntro(submission) {
  if (!submission || !submission.stageMappings) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please map all three synthesis phases to their functions and complete the concept question.',
    };
  }

  const { stageMappings, conceptAnswer } = submission;
  let correctStages = 0;
  const stageResults = [];

  SYNTHESIS_STAGES.forEach((stage) => {
    const studentChoice = stageMappings[stage.id];
    const isCorrect = studentChoice === stage.expectedTarget;
    if (isCorrect) correctStages++;
    stageResults.push({
      stageId: stage.id,
      name: stage.name,
      studentChoice,
      expectedTarget: stage.expectedTarget,
      isCorrect,
    });
  });

  const conceptCorrect = conceptAnswer === CORRECT_SYN_INTRO_CONCEPT_ID;
  const stageScore = correctStages * 7; // up to 21 XP
  const conceptScore = conceptCorrect ? 9 : 0;
  const score = Math.min(30, stageScore + conceptScore);

  let stars = 0;
  if (score >= 30) stars = 3;
  else if (score >= 20) stars = 2;
  else if (score >= 10) stars = 1;

  const passed = correctStages === 3 && score >= 20;

  let feedback = '';
  if (!passed) {
    feedback = `You matched ${correctStages} of 3 synthesis phases. Remember: Translation produces generic unmapped logic, Optimization simplifies Boolean equations, and Mapping binds to library cells!`;
  } else if (stars === 3) {
    feedback = 'Flawless! You demonstrated complete understanding of the three foundational phases of ASIC logic synthesis.';
  } else {
    feedback = `Well done (${score}/30 XP, ${stars} Stars)! You correctly mapped the synthesis pipeline.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    stageResults,
    conceptCorrect,
  };
}
