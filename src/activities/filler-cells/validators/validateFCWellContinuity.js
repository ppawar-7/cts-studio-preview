/**
 * validateFCWellContinuity.js
 * ============================
 * Pure deterministic validator for Level 3 (fc-3): N-Well Continuity.
 */

import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_WELL_EDGE_ID = 'opt-well-edge-violation';

export function validateFCWellContinuity(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete the filler cell placement and N-well continuity question.',
    };
  }

  const { chosenFillers, wellEdgeConcept } = submission;

  // Gap is 12 sites.
  // chosenFillers should be an array of filler types, e.g. ['FILL8', 'FILL4']
  let totalFilledSites = 0;
  if (Array.isArray(chosenFillers)) {
    for (const f of chosenFillers) {
      if (f === 'FILL8') totalFilledSites += 8;
      else if (f === 'FILL4') totalFilledSites += 4;
      else if (f === 'FILL2') totalFilledSites += 2;
      else if (f === 'FILL1') totalFilledSites += 1;
    }
  }

  const fillOk = totalFilledSites === 12;
  const conceptOk = wellEdgeConcept === CORRECT_WELL_EDGE_ID;

  const fillScore = fillOk ? 25 : 0;
  const conceptScore = conceptOk ? 15 : 0;

  const rawScore = fillScore + conceptScore;
  const score = Math.min(40, rawScore);

  let stars = 0;
  if (score >= 40) stars = 3;
  else if (score >= 28) stars = 2;
  else if (score >= 15) stars = 1;

  const passed = fillOk && conceptOk && score >= 28;

  let feedback = '';
  if (!fillOk) {
    feedback = `N-Well bridging error: Selected fillers bridge ${totalFilledSites}/12 sites. Select fillers (e.g. FILL8 + FILL4) to exactly fill all 12 sites with zero remaining gap!`;
  } else if (!conceptOk) {
    feedback = 'N-Well spacing concept: Unfilled gaps cause severe DRC well-edge spacing violations and create localized substrate noise injection.';
  } else if (stars === 3) {
    feedback = 'Flawless N-Well Continuity! You bridged the 12-site gap cleanly, restored continuous N-well and power rail abutment, and cleared all DRC well-edge violations.';
  } else {
    feedback = `Good well continuity analysis (${score}/40 XP, ${stars} Stars)! You understand how filler cells preserve physical mask planarity.`;
  }

  const emptySites = Math.max(0, 12 - totalFilledSites);
  const rowFillPercent = Math.min(100, Math.round((totalFilledSites / 12) * 100));

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.FILLER_CELLS_DENSITY,
    sourceLevelId: 'fc-3',
    inputs: {
      chosenFillers: Array.isArray(chosenFillers) ? [...chosenFillers] : [],
      wellEdgeConcept,
    },
    measurements: {
      totalFilledSites,
      emptySites,
      rowFillPercent,
      wellContinuityMet: fillOk,
      chosenFillers: Array.isArray(chosenFillers) ? [...chosenFillers] : [],
      railGaps: emptySites === 0 ? 0 : emptySites,
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
    fillOk,
    conceptOk,
    totalFilledSites,
    artifacts,
  };
}
