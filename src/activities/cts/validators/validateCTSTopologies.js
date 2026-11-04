/**
 * validateCTSTopologies.js
 * =========================
 * Pure deterministic validator for Level 4 (cts-4): Clock Tree Topologies.
 */

export const CORRECT_ASIC_TOPOLOGY_ID = 'opt-balanced-tree';
export const CORRECT_MESH_TOPOLOGY_ID = 'opt-clock-mesh';
export const CORRECT_MESH_DRAWBACK_ID = 'opt-mesh-high-power';

export function validateCTSTopologies(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please complete all clock topology selection and trade-off questions.',
    };
  }

  const { asicTopology, highPerfTopology, meshDrawback } = submission;

  const q1Ok = asicTopology === CORRECT_ASIC_TOPOLOGY_ID;
  const q2Ok = highPerfTopology === CORRECT_MESH_TOPOLOGY_ID;
  const q3Ok = meshDrawback === CORRECT_MESH_DRAWBACK_ID;

  const score1 = q1Ok ? 15 : 0;
  const score2 = q2Ok ? 15 : 0;
  const score3 = q3Ok ? 15 : 0;

  const rawScore = score1 + score2 + score3;
  const score = Math.min(45, rawScore);

  let stars = 0;
  if (score >= 45) stars = 3;
  else if (score >= 32) stars = 2;
  else if (score >= 18) stars = 1;

  const passed = (q1Ok || q2Ok) && q3Ok && score >= 32;

  let feedback = '';
  if (!q1Ok) {
    feedback = 'General ASIC topology: Standard cells with irregular placement use automated Geometric Balanced Trees (CAD default) to optimize skew and dynamic power.';
  } else if (!q2Ok) {
    feedback = 'Extreme performance topology: Clock Mesh delivers the lowest possible skew and OCV variation tolerance in multi-GHz processors.';
  } else if (!q3Ok) {
    feedback = 'Clock Mesh drawback: A continuous clock grid switches enormous capacitive load every cycle, resulting in very high dynamic power consumption and metal track utilization.';
  } else if (stars === 3) {
    feedback = 'Flawless Topology Expertise! You understand the architectural trade-offs between H-trees, balanced binary trees, clock meshes, and spines.';
  } else {
    feedback = `Good topology analysis (${score}/45 XP, ${stars} Stars)! You understand how clock network architecture influences power and timing.`;
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
