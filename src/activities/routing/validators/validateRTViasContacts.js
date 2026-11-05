/**
 * validateRTViasContacts.js
 * =========================
 * Pure deterministic validator for Level 3 (rt-3): Vias and Contacts.
 */

import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_VIA_ENCLOSURE_ID = 'opt-misalign-open';
export const CORRECT_REDUNDANT_VIA_ID = 'opt-double-via-reliability';

export function validateRTViasContacts(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all via resistance calculations and DRC questions.',
    };
  }

  const { singleViaResistanceAns, doubleViaResistanceAns, enclosureConcept, redundantViaConcept } = submission;

  // 4 series vias at 5 Ohm each = 20 Ohm
  const rSingleOk = Number(singleViaResistanceAns) === 20;
  // Double vias in parallel = 20 / 2 = 10 Ohm
  const rDoubleOk = Number(doubleViaResistanceAns) === 10;
  const encOk = enclosureConcept === CORRECT_VIA_ENCLOSURE_ID;
  const redOk = redundantViaConcept === CORRECT_REDUNDANT_VIA_ID;

  const score1 = (rSingleOk && rDoubleOk) ? 15 : (rSingleOk || rDoubleOk) ? 8 : 0;
  const score2 = encOk ? 15 : 0;
  const score3 = redOk ? 10 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(40, rawScore);

  let stars = 0;
  if (score >= 40) stars = 3;
  else if (score >= 28) stars = 2;
  else if (score >= 15) stars = 1;

  const passed = (rSingleOk || rDoubleOk) && encOk && score >= 28;

  let feedback = '';
  if (!rSingleOk || !rDoubleOk) {
    feedback = 'Via resistance calculation error: 4 series single vias = 4 * 5 = 20 &Omega;. Replacing each with double parallel vias halves resistance to 10 &Omega;!';
  } else if (!encOk) {
    feedback = 'Via enclosure concept error: If metal does not adequately enclose a via hole, slight mask misalignment during photolithography leaves the via uncontacted, creating a fatal open circuit.';
  } else if (stars === 3) {
    feedback = 'Flawless Via & Contact Analysis! You accurately computed parasitic via resistance and mastered DRC enclosure and redundant multi-cut via rules.';
  } else {
    feedback = `Good via analysis (${score}/40 XP, ${stars} Stars)! You understand how inter-layer transitions affect chip yield and parasitics.`;
  }

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.ROUTING_INTERCONNECT,
    sourceLevelId: 'rt-3',
    inputs: {
      singleViaResistanceAns,
      doubleViaResistanceAns,
      enclosureConcept,
      redundantViaConcept,
    },
    measurements: {
      viaEnclosureUm: encOk ? 0.06 : 0.02,
      enclosureUm: encOk ? 0.06 : 0.02,
      drcViolations: encOk ? 0 : 1,
      drcErrors: encOk ? 0 : 1,
      singleViaResistance: Number(singleViaResistanceAns) || 20,
      doubleViaResistance: Number(doubleViaResistanceAns) || 10,
    },
    units: {
      viaEnclosureUm: 'µm',
      enclosureUm: 'µm',
      singleViaResistance: 'Ω',
      doubleViaResistance: 'Ω',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    rSingleOk,
    rDoubleOk,
    encOk,
    redOk,
    artifacts,
  };
}
