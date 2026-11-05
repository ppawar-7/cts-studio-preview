/**
 * validateRTKingdom.js
 * ====================
 * Pure deterministic validator for Level 5 (rt-5): Routing Kingdom Challenge.
 */

import { checkRoutingShorts } from '../../../engine/routingEngine.js';
import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_LVS_CONCEPT_ID = 'opt-lvs-connectivity-check';

export function validateRTKingdom(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please configure metal layer assignments and complete the LVS signoff question.',
    };
  }

  const { net1Layer, net2Layer, lvsConcept } = submission;

  // Net 1 is horizontal (20, 60) to (160, 60)
  // Net 2 is vertical (90, 20) to (90, 140)
  // Crossing point is at (90, 60)
  const segments = [
    { netId: 'NET_1', layer: net1Layer, x1: 20, y1: 60, x2: 160, y2: 60 },
    { netId: 'NET_2', layer: net2Layer, x1: 90, y1: 20, x2: 90, y2: 140 },
  ];

  const shortCheck = checkRoutingShorts(segments);
  const noShorts = !shortCheck.hasShort;

  // Layer direction adherence: Net 1 (H) should be M1 or M3; Net 2 (V) should be M2 or M4
  const layerOk = (net1Layer === 'M1' || net1Layer === 'M3') && (net2Layer === 'M2' || net2Layer === 'M4');
  const conceptOk = lvsConcept === CORRECT_LVS_CONCEPT_ID;

  // Educational LVS: Compare extracted physical net count with intended schematic nets (2)
  const extractedNetCount = noShorts ? 2 : 1; // When shorted, both nets merge into 1 electrical node
  const lvsMatch = extractedNetCount === 2 && noShorts;

  const shortScore = noShorts ? 20 : 0;
  const layerScore = layerOk ? 15 : 0;
  const conceptScore = conceptOk ? 15 : 0;

  const rawScore = shortScore + layerScore + conceptScore;
  const score = Math.min(50, rawScore);

  let stars = 0;
  if (score >= 50) stars = 3;
  else if (score >= 38) stars = 2;
  else if (score >= 20) stars = 1;

  const passed = noShorts && layerOk && score >= 38;

  let feedback = '';
  if (!noShorts) {
    feedback = `DRC Short Circuit Violation! Both nets are assigned to ${net1Layer} and intersect at coordinate (90, 60). Assign Net 1 to M1 (Horizontal) and Net 2 to M2 (Vertical) to eliminate the short!`;
  } else if (!layerOk) {
    feedback = 'Preferred direction violation: Assign horizontal Net 1 to M1 (H) and vertical Net 2 to M2 (V) to respect design track rules!';
  } else if (!conceptOk) {
    feedback = 'Signoff verification concept: Layout Versus Schematic (LVS) compares the extracted physical layout netlist against the logical design schematic to catch shorts, opens, and device mismatches.';
  } else if (stars === 3) {
    feedback = 'Flawless Routing Kingdom Capstone! You eliminated interconnect DRC shorts using multilayer orthogonal routing, respected preferred directions, and mastered LVS signoff.';
  } else {
    feedback = `Great routing optimization (${score}/50 XP, ${stars} Stars)! You are ready to advance to Physical Filler Cells.`;
  }

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.ROUTING_INTERCONNECT,
    sourceLevelId: 'rt-5',
    inputs: {
      net1Layer,
      net2Layer,
      lvsConcept,
    },
    measurements: {
      segments,
      hasShorts: !noShorts,
      shorts: noShorts ? 0 : 1,
      opens: 0,
      unroutedNets: 0,
      openSegments: 0,
      lvsMatch,
      drcErrors: noShorts && layerOk ? 0 : (!noShorts ? 1 : 0) + (!layerOk ? 1 : 0),
      wnsPs: 18,
      timingSlackNs: 0.018,
    },
    units: {
      wnsPs: 'ps',
      timingSlackNs: 'ns',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    noShorts,
    layerOk,
    conceptOk,
    artifacts,
  };
}
