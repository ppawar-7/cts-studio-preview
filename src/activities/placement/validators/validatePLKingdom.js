/**
 * validatePLKingdom.js
 * =====================
 * Pure deterministic validator for Level 5 (pl-5): Placement Kingdom Challenge.
 */

import {
  checkCellOverlaps,
  checkSiteAlignment,
  computeTotalHPWL,
  DEFAULT_ROW_CONFIG,
} from '../../../engine/placementEngine.js';

export const CORRECT_CAPSTONE_PLACER_CONCEPT_ID = 'opt-global-legalize-detail';

export function validatePLKingdom(submission) {
  if (!submission || !Array.isArray(submission.cells)) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please place all 4 standard cells and complete the concept question.',
    };
  }

  const { cells, placerConcept } = submission;

  if (cells.length < 4) {
    return { passed: false, score: 0, stars: 0, feedback: 'All 4 standard cells must be placed.' };
  }

  // 1. Check overlaps
  const overlapCheck = checkCellOverlaps(cells);
  const noOverlaps = !overlapCheck.hasOverlap;

  // 2. Check site alignment for all cells
  const alignmentChecks = cells.map((c) => checkSiteAlignment(c, DEFAULT_ROW_CONFIG));
  const allAligned = alignmentChecks.every((chk) => chk.isAligned);

  // 3. Compute total HPWL for the 3 pipeline nets
  const nets = [
    { netId: 'NET_1', pins: [{ x: cells[0].x, y: cells[0].y }, { x: cells[1].x, y: cells[1].y }] },
    { netId: 'NET_2', pins: [{ x: cells[1].x, y: cells[1].y }, { x: cells[2].x, y: cells[2].y }] },
    { netId: 'NET_3', pins: [{ x: cells[2].x, y: cells[2].y }, { x: cells[3].x, y: cells[3].y }] },
  ];
  const hpwlResult = computeTotalHPWL(nets);
  const hpwlMet = hpwlResult.totalHPWL <= 200;

  // 4. Concept question
  const conceptOk = placerConcept === CORRECT_CAPSTONE_PLACER_CONCEPT_ID;

  const legalityScore = (noOverlaps ? 10 : 0) + (allAligned ? 10 : 0); // 20 XP
  const hpwlScore = hpwlMet ? 15 : 0;                                 // 15 XP
  const conceptScore = conceptOk ? 15 : 0;                            // 15 XP

  const rawScore = legalityScore + hpwlScore + conceptScore;
  const score = Math.min(50, rawScore);

  let stars = 0;
  if (score >= 50) stars = 3;
  else if (score >= 38) stars = 2;
  else if (score >= 20) stars = 1;

  const passed = noOverlaps && allAligned && hpwlMet && score >= 38;

  let feedback = '';
  if (!noOverlaps) {
    feedback = `Placement error: Overlap detected between cells: ${overlapCheck.collidingPairs.map((p) => p.join(' & ')).join(', ')}.`;
  } else if (!allAligned) {
    feedback = 'Site alignment error: Ensure all cells are snapped to Row Y multiples of 40 µm and Site X multiples of 10 µm!';
  } else if (!hpwlMet) {
    feedback = `Total HPWL is ${hpwlResult.totalHPWL} µm (target threshold: <= 200 µm). Cluster connected cells closer together to reduce wirelength!`;
  } else if (stars === 3) {
    feedback = 'Flawless Placement Capstone! You legalized all standard cells with zero overlaps, minimized HPWL to ' + hpwlResult.totalHPWL + ' µm, and achieved clean row alignment.';
  } else {
    feedback = `Great placement optimization (${score}/50 XP, ${stars} Stars)! You are ready to advance to Clock Tree Synthesis.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    noOverlaps,
    allAligned,
    hpwlResult,
    hpwlMet,
    conceptOk,
  };
}
