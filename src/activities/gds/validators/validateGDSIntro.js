/**
 * validateGDSIntro.js
 * ===================
 * Pure deterministic validator for Level 1 (gds-1): What is GDSII?
 */

export const CORRECT_GDS_CONTENTS_ID = 'opt-polygons-and-layers-only';
export const CORRECT_OASIS_ID = 'opt-oasis-compression';

export function validateGDSIntro(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all GDSII stream format questions.',
    };
  }

  const { gdsContentsConcept, oasisConcept } = submission;

  const q1Ok = gdsContentsConcept === CORRECT_GDS_CONTENTS_ID;
  const q2Ok = oasisConcept === CORRECT_OASIS_ID;

  const score1 = q1Ok ? 15 : 0;
  const score2 = q2Ok ? 15 : 0;

  const rawScore = score1 + score2;
  const score = Math.min(30, rawScore);

  let stars = 0;
  if (score >= 30) stars = 3;
  else if (score >= 20) stars = 2;
  else if (score >= 10) stars = 1;

  const passed = q1Ok && q2Ok && score >= 20;

  let feedback = '';
  if (!q1Ok) {
    feedback = 'GDSII content error: GDSII contains purely physical geometric shapes (boundary polygons, paths, cell instances, layer numbers); it contains zero timing constraints or logical netlist equations.';
  } else if (!q2Ok) {
    feedback = 'OASIS format error: Modern designs replace GDSII with OASIS (Open Artwork System Interchange Standard) to achieve ~10x file compression and faster streaming of multi-gigabyte mask files.';
  } else if (stars === 3) {
    feedback = 'Flawless GDSII Stream Mastery! You understand the binary layout representation, polygon hierarchy, and modern OASIS data exchange formats.';
  } else {
    feedback = `Good GDSII foundation (${score}/30 XP, ${stars} Stars)! You understand the tape-out mask data handover.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    q1Ok,
    q2Ok,
  };
}
