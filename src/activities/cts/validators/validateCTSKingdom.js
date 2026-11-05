/**
 * validateCTSKingdom.js
 * =====================
 * Pure deterministic validator for Level 5 (cts-5): CTS Kingdom Challenge.
 */

import { computeClockTreeMetrics } from '../../../engine/ctsEngine.js';
import {
  createDesignArtifact,
  ARTIFACT_KINDS,
} from '../../../logic/designArtifactContracts.js';

export const CORRECT_ICG_CONCEPT_ID = 'opt-icg-dynamic-power';

// Raw branch delays
const BASE_DELAYS = [0.120, 0.220, 0.170, 0.270]; // FF1, FF2, FF3, FF4

export function validateCTSKingdom(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please configure CTS branch buffer stages and complete the clock gating question.',
    };
  }

  const { bufferStages, icgConcept } = submission;

  if (!Array.isArray(bufferStages) || bufferStages.length < 4) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'Please configure buffer stages for all 4 clock tree branches.',
    };
  }

  // Calculate final arrival times (CLKBUF_X2 = +0.050 ns per stage)
  const arrivals = BASE_DELAYS.map((base, idx) => {
    const stages = Math.max(0, parseInt(bufferStages[idx], 10) || 0);
    return Number((base + (stages * 0.050)).toFixed(4));
  });

  const sinks = arrivals.map((arr, idx) => ({ id: `FF${idx + 1}`, arrivalTime: arr }));
  const metrics = computeClockTreeMetrics(sinks, 0.030); // 30 ps target

  const skewMet = metrics.skew <= 0.030;
  const latencyMet = metrics.latency <= 0.300;
  const conceptOk = icgConcept === CORRECT_ICG_CONCEPT_ID;

  // Perfect target is bufferStages = [3, 1, 2, 0]
  const exactStages = bufferStages[0] === 3 && bufferStages[1] === 1 && bufferStages[2] === 2 && bufferStages[3] === 0;

  const skewScore = skewMet ? 20 : 0;
  const latencyScore = latencyMet ? 15 : 0;
  const conceptScore = conceptOk ? 15 : 0;

  const rawScore = skewScore + latencyScore + conceptScore;
  const score = Math.min(50, rawScore);

  let stars = 0;
  if (score >= 50) stars = 3;
  else if (score >= 38) stars = 2;
  else if (score >= 20) stars = 1;

  const passed = skewMet && latencyMet && score >= 38;

  let feedback = '';
  if (!skewMet) {
    feedback = `Clock skew is ${Math.round(metrics.skew * 1000)} ps (target threshold: <= 30 ps). Add buffers to faster branches (FF1, FF2, FF3) to balance delay with FF4 (0.270 ns)!`;
  } else if (!latencyMet) {
    feedback = `Max insertion delay is ${(metrics.latency * 1000).toFixed(0)} ps (exceeds 300 ps limit). Remove excessive buffer stages!`;
  } else if (!conceptOk) {
    feedback = 'Clock Gating concept: Integrated Clock Gating (ICG) cells are inserted during CTS to disable clock pulses on inactive registers, saving massive dynamic power.';
  } else if (stars === 3) {
    feedback = `Flawless CTS Capstone! You balanced all 4 clock sinks to ${Math.round(metrics.skew * 1000)} ps skew, kept latency at ${(metrics.latency * 1000).toFixed(0)} ps, and mastered Integrated Clock Gating.`;
  } else {
    feedback = `Great CTS signoff (${score}/50 XP, ${stars} Stars)! You are ready to advance to Routing.`;
  }

  // Model dynamic power: Base clock mesh (1.8 mW) + buffer stages (0.2 mW / buffer)
  const totalBuffers = bufferStages.reduce((sum, s) => sum + (Math.max(0, parseInt(s, 10) || 0)), 0);
  const derivedPowerMw = Number((1.8 + totalBuffers * 0.2).toFixed(1));
  const skewPs = Math.round(metrics.skew * 1000);
  const latencyPs = Math.round(metrics.latency * 1000);

  const artifacts = createDesignArtifact({
    kind: ARTIFACT_KINDS.CTS_CLOCK_TREE,
    sourceLevelId: 'cts-5',
    inputs: {
      bufferStages: [...bufferStages],
      icgConcept,
    },
    measurements: {
      sinks,
      skewPs,
      latencyPs,
      maxLatencyPs: latencyPs,
      powerMw: derivedPowerMw,
      maxSlewPs: 45,
      maxTransitionPs: 45,
      stages: [...bufferStages],
      totalBuffers,
      skewMet,
      latencyMet,
    },
    units: {
      skewPs: 'ps',
      latencyPs: 'ps',
      powerMw: 'mW',
      maxSlewPs: 'ps',
    },
  });

  return {
    passed,
    score,
    stars,
    feedback,
    metrics,
    skewMet,
    latencyMet,
    exactStages,
    artifacts,
  };
}
