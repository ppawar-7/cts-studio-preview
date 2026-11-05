/**
 * validatePLGlobalDetailed.js
 * =============================
 * Pure deterministic validator for Level 2 (pl-2): Global vs Detailed Placement.
 */

import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const LEGALIZATION_CASES = [
  // Cell A: at x=43, y=55 (Rough global). Legal row Y=40, legal site X=40. Displ = |40-43| + |40-55| = 3 + 15 = 18
  { id: 'CELL_A', roughX: 43, roughY: 55, expectedLegalX: 40, expectedLegalY: 40, expectedDisp: 18 },
  // Cell B: at x=78, y=38 (Rough global). Legal row Y=40, legal site X=80. Displ = |80-78| + |40-38| = 2 + 2 = 4
  { id: 'CELL_B', roughX: 78, roughY: 38, expectedLegalX: 80, expectedLegalY: 40, expectedDisp: 4 },
];

export const CORRECT_ANALYTICAL_ID = 'opt-quadratic-force-directed';

export function validatePLGlobalDetailed(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete cell legalization coordinates and concept questions.',
    };
  }

  const { legalizedCells, displacementAns, analyticalConcept } = submission;

  let legalOk = false;
  if (Array.isArray(legalizedCells) && legalizedCells.length >= 2) {
    const aOk = Number(legalizedCells[0]?.x) === 40 && Number(legalizedCells[0]?.y) === 40;
    const bOk = Number(legalizedCells[1]?.x) === 80 && Number(legalizedCells[1]?.y) === 40;
    legalOk = aOk && bOk;
  }

  // Total displacement = 18 + 4 = 22
  const dispOk = Math.abs(Number(displacementAns) - 22) <= 1;
  const conceptOk = analyticalConcept === CORRECT_ANALYTICAL_ID;

  const legalScore = legalOk ? 15 : 0;
  const dispScore = dispOk ? 10 : 0;
  const conceptScore = conceptOk ? 10 : 0;

  const rawScore = legalScore + dispScore + conceptScore;
  const score = Math.min(35, rawScore);

  let stars = 0;
  if (score >= 35) stars = 3;
  else if (score >= 24) stars = 2;
  else if (score >= 12) stars = 1;

  const passed = legalOk && (dispOk || conceptOk) && score >= 24;

  let feedback = '';
  if (!legalOk) {
    feedback = 'Legalization error: Snap CELL_A to (x=40, y=40) and CELL_B to (x=80, y=40) so they align to Row 1 (y=40) and site pitch 10 µm without overlapping!';
  } else if (!dispOk) {
    feedback = `Displacement calculation: Cell A moved (|40-43| + |40-55| = 18), Cell B moved (|80-78| + |40-38| = 4). Total displacement = 22 µm.`;
  } else if (stars === 3) {
    feedback = 'Flawless Legalization! You solved row snapping, eliminated cell overlaps, minimized displacement, and mastered analytical placement theory.';
  } else {
    feedback = `Good legalization analysis (${score}/35 XP, ${stars} Stars)! You understand how detailed placers clean up continuous global approximations.`;
  }

  const cells = legalOk
    ? [
        { id: 'CELL_A', x: 40, y: 40, width: 30, height: 40 },
        { id: 'CELL_B', x: 80, y: 40, width: 30, height: 40 },
      ]
    : [
        { id: 'CELL_A', x: 43, y: 55, width: 30, height: 40 },
        { id: 'CELL_B', x: 78, y: 38, width: 30, height: 40 },
      ];

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.PLACEMENT_LAYOUT,
    sourceLevelId: 'pl-2',
    inputs: {
      legalizedCells: Array.isArray(legalizedCells) ? legalizedCells.map((c) => ({ ...c })) : [],
      displacementAns,
      analyticalConcept,
    },
    measurements: {
      cells,
      overlapsResolved: legalOk,
      totalDisplacement: Number(displacementAns) || 0,
      legalOk,
    },
    units: {
      totalDisplacement: 'µm',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    legalOk,
    dispOk,
    conceptOk,
    artifacts,
  };
}
