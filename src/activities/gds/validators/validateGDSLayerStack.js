/**
 * validateGDSLayerStack.js
 * ========================
 * Pure deterministic validator for Level 3 (gds-3): Layer Stack in GDS.
 */

export const CORRECT_FEOL_ID = 'opt-feol-transistors';
export const CORRECT_DATATYPE_ID = 'opt-datatype-drawing-vs-pin';
export const CORRECT_M1_LAYER_ID = 'opt-layer-30-m1';

export function validateGDSLayerStack(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all GDS layer stack and datatype questions.',
    };
  }

  const { feolConcept, datatypeConcept, m1LayerChoice } = submission;

  const q1Ok = feolConcept === CORRECT_FEOL_ID;
  const q2Ok = datatypeConcept === CORRECT_DATATYPE_ID;
  const q3Ok = m1LayerChoice === CORRECT_M1_LAYER_ID;

  const score1 = q1Ok ? 15 : 0;
  const score2 = q2Ok ? 15 : 0;
  const score3 = q3Ok ? 10 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(40, rawScore);

  let stars = 0;
  if (score >= 40) stars = 3;
  else if (score >= 28) stars = 2;
  else if (score >= 15) stars = 1;

  const passed = (q1Ok || q3Ok) && q2Ok && score >= 28;

  let feedback = '';
  if (!q1Ok) {
    feedback = 'FEOL concept error: Front-End of Line (FEOL) is the semiconductor process phase that fabricates active MOS transistors (wells, diffusions, and poly gates) in the silicon substrate.';
  } else if (!q2Ok) {
    feedback = 'GDS Datatype purpose error: Datatypes distinguish physical etched mask geometries (Datatype 0) from logical pin labels and pin boundary annotations (Datatype 20) used by LVS tools.';
  } else if (!q3Ok) {
    feedback = 'Layer number error: Metal 1 is mapped to GDS Layer 30 in the foundry layer table.';
  } else if (stars === 3) {
    feedback = 'Flawless GDS Layer Stack Mastery! You understand the FEOL/BEOL division, GDS layer mapping, and datatype separation between mask shapes and LVS pins.';
  } else {
    feedback = `Good layer stack analysis (${score}/40 XP, ${stars} Stars)! You understand layout data representation.`;
  }

  return {
    passed,
    score,
    stars,
    feedback,
    q1Ok,
    q2Ok,
    q3Ok,
  };
}
