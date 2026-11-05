/**
 * validateFCKingdom.js
 * ====================
 * Pure deterministic validator for Level 5 (fc-5): Filler Cells Kingdom Challenge.
 */

import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_CMP_DENSITY_ID = 'opt-drc-density-cmp';

export function validateFCKingdom(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please configure filler and physical cell insertion and complete the CMP signoff question.',
    };
  }

  const { cellPlan, cmpConcept } = submission;

  if (!Array.isArray(cellPlan) || cellPlan.length === 0) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please insert physical cells to fill all 60 empty sites in the row.',
    };
  }

  // Calculate total sites filled and verify cell types
  let totalSitesFilled = 0;
  let hasDecap = false;
  let hasTap = false;

  const SIZES = {
    DECAP16: 16,
    DECAP8: 8,
    TAPCELL4: 4,
    FILL8: 8,
    FILL4: 4,
    FILL2: 2,
  };

  for (const item of cellPlan) {
    const size = SIZES[item.type] || 0;
    const count = parseInt(item.count, 10) || 0;
    totalSitesFilled += size * count;

    if (item.type.startsWith('DECAP') && count > 0) hasDecap = true;
    if (item.type.startsWith('TAPCELL') && count > 0) hasTap = true;
  }

  // Target: exactly 60 sites filled
  const fillMet = totalSitesFilled === 60;
  const typesMet = hasDecap && hasTap;
  const conceptOk = cmpConcept === CORRECT_CMP_DENSITY_ID;

  const fillScore = fillMet ? 20 : 0;
  const typesScore = typesMet ? 15 : 0;
  const conceptScore = conceptOk ? 15 : 0;

  const rawScore = fillScore + typesScore + conceptScore;
  const score = Math.min(50, rawScore);

  let stars = 0;
  if (score >= 50) stars = 3;
  else if (score >= 38) stars = 2;
  else if (score >= 20) stars = 1;

  const passed = fillMet && typesMet && score >= 38;

  let feedback = '';
  if (!fillMet) {
    feedback = `Row filling error: Currently filled ${totalSitesFilled}/60 empty sites. Adjust cell counts so total filled sites equals exactly 60 with 0 gap!`;
  } else if (!typesMet) {
    feedback = 'Physical cell mix error: Your row plan must include at least one DECAP cell (for dynamic IR drop) and at least one TAPCELL (for latch-up prevention)!';
  } else if (!conceptOk) {
    feedback = 'Signoff concept error: DRC density verification runs across moving window frames (e.g. 20x20 µm) to verify that metal and poly fill prevent chemical mechanical polishing (CMP) erosion and dishing.';
  } else if (stars === 3) {
    feedback = 'Flawless Filler Cells Capstone! You achieved 100% row continuity across 60 empty sites, integrated Decaps and Tap cells, and mastered CMP density signoff.';
  } else {
    feedback = `Great physical-only signoff (${score}/50 XP, ${stars} Stars)! You are ready to advance to GDSII & Tape-Out.`;
  }

  const emptySites = Math.max(0, 60 - totalSitesFilled);
  const rowFillPercent = Math.min(100, Math.round((totalSitesFilled / 60) * 100));

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.FILLER_CELLS_DENSITY,
    sourceLevelId: 'fc-5',
    inputs: {
      cellPlan: cellPlan.map((c) => ({ ...c })),
      cmpConcept,
    },
    measurements: {
      totalSitesFilled,
      emptySites,
      rowFillPercent,
      hasDecap,
      hasTap,
      tapCellsContinuous: hasTap,
      baseDrcViolations: emptySites === 0 ? 0 : emptySites,
    },
    units: {
      rowFillPercent: '%',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    fillMet,
    typesMet,
    conceptOk,
    totalSitesFilled,
    artifacts,
  };
}
