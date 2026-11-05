/**
 * validatePLCongestion.js
 * ========================
 * Pure deterministic validator for Level 4 (pl-4): Congestion and Placement.
 */

import { computeCongestionHeatmap } from '../../../engine/placementEngine.js';
import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_CONGESTION_MITIGATION_ID = 'opt-cell-padding-spreading';

export function validatePLCongestion(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all congestion calculations and mitigation questions.',
    };
  }

  const { congestionRatio, hotspotBin, mitigationConcept } = submission;

  // Congestion = 6 / 4 = 1.50
  const ratioOk = Math.abs(Number(congestionRatio) - 1.50) <= 0.05 || Math.abs(Number(congestionRatio) - 150) <= 5;
  // Hotspot at Row 1, Col 2 (or 'R1C2')
  const binOk = hotspotBin === 'R1C2' || hotspotBin === '1,2';
  const conceptOk = mitigationConcept === CORRECT_CONGESTION_MITIGATION_ID;

  const ratioScore = ratioOk ? 15 : 0;
  const binScore = binOk ? 15 : 0;
  const conceptScore = conceptOk ? 15 : 0;

  const rawScore = ratioScore + binScore + conceptScore;
  const score = Math.min(45, rawScore);

  let stars = 0;
  if (score >= 45) stars = 3;
  else if (score >= 32) stars = 2;
  else if (score >= 18) stars = 1;

  const passed = (ratioOk || binOk) && conceptOk && score >= 32;

  let feedback = '';
  if (!ratioOk) {
    feedback = 'Congestion calculation error: Congestion = Demand / Capacity = 6 / 4 = 1.50 (150% capacity overflow).';
  } else if (!binOk) {
    feedback = 'Locate the hotspot: Row 1, Column 2 has the highest wire demand in the GCell routing grid!';
  } else if (stars === 3) {
    feedback = 'Flawless Congestion Analysis! You evaluated GCell routing demand, identified localized routing hotspots, and applied cell inflation/padding mitigations.';
  } else {
    feedback = `Good congestion management (${score}/45 XP, ${stars} Stars)! You understand how placer cell spreading prevents unroutable shorts during detailed routing.`;
  }

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.PLACEMENT_LAYOUT,
    sourceLevelId: 'pl-4',
    inputs: {
      congestionRatio,
      hotspotBin,
      mitigationConcept,
    },
    measurements: {
      rawCongestionRatio: Number(congestionRatio) || 1.50,
      maxCongestion: conceptOk ? 0.75 : 1.50,
      hotspotResolved: conceptOk,
      peakRatio: conceptOk ? 0.75 : 1.50,
    },
    units: {
      maxCongestion: 'ratio',
      peakRatio: 'ratio',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    ratioOk,
    binOk,
    conceptOk,
    artifacts,
  };
}
