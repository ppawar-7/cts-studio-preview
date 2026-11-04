/**
 * ctsEngine.js
 * ============
 * Pure, deterministic ASIC Clock Tree Synthesis (CTS) engine.
 *
 * Core physical design concepts:
 * 1. Clock Source, Tree, and Leaf Sinks (Registers).
 * 2. Clock Latency (Insertion Delay) & Clock Skew (Delta between max and min arrival).
 * 3. Buffer Insertion: T_delay = T_intrinsic + R_drive * C_load.
 * 4. Timing Impact: Setup Slack vs Hold Slack with clock skew.
 *    (Crucial distinction: STA evaluates timing slacks; CTS physically constructs the tree!)
 *    - Setup Slack: T_period - (T_cq + T_comb + T_setup) + T_skew
 *    - Hold Slack:  (T_cq + T_comb_min) - T_hold - T_skew
 * 5. Clock Topologies: H-Tree, Balanced Binary Tree, Clock Mesh, Spine.
 * 6. Branch Balancing: Delay padding with buffer insertion.
 */

export const CLOCK_BUFFER_LIB = {
  CLKBUF_X1: { id: 'CLKBUF_X1', driveStrength: 1, tIntrinsic: 0.040, rDrive: 120, inputCap: 0.002 }, // ns, Ohm, pF
  CLKBUF_X2: { id: 'CLKBUF_X2', driveStrength: 2, tIntrinsic: 0.035, rDrive: 60,  inputCap: 0.004 },
  CLKBUF_X4: { id: 'CLKBUF_X4', driveStrength: 4, tIntrinsic: 0.030, rDrive: 30,  inputCap: 0.008 },
  CLKBUF_X8: { id: 'CLKBUF_X8', driveStrength: 8, tIntrinsic: 0.025, rDrive: 15,  inputCap: 0.016 },
};

export const CLOCK_TOPOLOGY_PROFILES = {
  'h-tree': {
    name: 'Symmetric H-Tree',
    skewExpectationPs: 8,
    powerFactor: 1.2,
    routingArea: 'Medium',
    pros: 'Near-zero structural skew for uniformly distributed sinks.',
    cons: 'Rigid layout geometry; highly vulnerable to asymmetric sink loads and macro blockages.',
  },
  'clock-mesh': {
    name: 'Clock Mesh / Grid',
    skewExpectationPs: 3,
    powerFactor: 2.8,
    routingArea: 'High',
    pros: 'Ultra-low skew and robust immunity to On-Chip Variation (OCV).',
    cons: 'Excessive dynamic power consumption from shorted cross-grid drivers.',
  },
  'trunk-spine': {
    name: 'Trunk / Spine',
    skewExpectationPs: 25,
    powerFactor: 0.9,
    routingArea: 'Low',
    pros: 'Low routing resource utilization and simple CTS implementation.',
    cons: 'High latency gradient along the main spine trunk.',
  },
  'balanced-tree': {
    name: 'Balanced Binary Tree',
    skewExpectationPs: 15,
    powerFactor: 1.0,
    routingArea: 'Moderate',
    pros: 'Flexible buffer insertion and branch delay balancing around macro blockages.',
    cons: 'Sensitive to local process variation and interconnect RC parasitics.',
  },
};

/**
 * Compute buffer delay based on linear RC load model.
 *
 * @param {string} bufferType - Cell name in CLOCK_BUFFER_LIB
 * @param {number} loadCapPf - Output load capacitance in picofarads
 * @returns {number} Delay in nanoseconds (rounded to 4 decimal places)
 */
export function computeBufferDelay(bufferType, loadCapPf = 0.01) {
  const buf = CLOCK_BUFFER_LIB[bufferType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
  const safeCap = Math.max(0, Number(loadCapPf) || 0);
  // Delay = tIntrinsic + (rDrive * loadCapPf * 1e-3)
  const delay = buf.tIntrinsic + (buf.rDrive * safeCap * 0.001);
  return Number(delay.toFixed(4));
}

/**
 * Compute clock latency, skew, and balance metrics across an array of sink arrival times.
 *
 * @param {Array<{id: string, arrivalTime: number}>} sinks
 * @param {number} skewTargetNs - Maximum allowable skew in nanoseconds (default 0.050 ns = 50 ps)
 * @returns {{ minArrival: number, maxArrival: number, latency: number, skew: number, isBalanced: boolean }}
 */
export function computeClockTreeMetrics(sinks, skewTargetNs = 0.050) {
  if (!Array.isArray(sinks) || sinks.length === 0) {
    return { minArrival: 0, maxArrival: 0, latency: 0, skew: 0, isBalanced: false };
  }

  const arrivals = sinks.map((s) => Number(s.arrivalTime) || 0);
  const minArrival = Math.min(...arrivals);
  const maxArrival = Math.max(...arrivals);
  const latency = maxArrival;
  const skew = Number((maxArrival - minArrival).toFixed(4));
  const isBalanced = skew <= skewTargetNs;

  return {
    minArrival: Number(minArrival.toFixed(4)),
    maxArrival: Number(maxArrival.toFixed(4)),
    latency: Number(latency.toFixed(4)),
    skew,
    isBalanced,
  };
}

/**
 * Calculate setup and hold slack given clock arrival times at launch and capture flops.
 *
 * Setup Slack Formula:
 *   T_skew = T_capture - T_launch
 *   T_arrival = T_launch + T_cq + T_comb
 *   T_required = T_period + T_capture - T_setup
 *   Slack_setup = T_required - T_arrival = T_period - (T_cq + T_comb + T_setup) + T_skew
 *
 * Hold Slack Formula:
 *   T_arrival = T_launch + T_cq + T_comb
 *   T_required = T_capture + T_hold
 *   Slack_hold = T_arrival - T_required = (T_cq + T_comb) - T_hold - T_skew
 *
 * @param {Object} params
 * @param {number} params.periodNs - Clock period (e.g. 1.0 ns for 1 GHz)
 * @param {number} params.tCqNs - Flop clk-to-q delay
 * @param {number} params.tCombNs - Data path combinational delay
 * @param {number} params.tSetupNs - Flop setup time
 * @param {number} params.tHoldNs - Flop hold time
 * @param {number} params.launchArrivalNs - Clock arrival at launch flip-flop
 * @param {number} params.captureArrivalNs - Clock arrival at capture flip-flop
 * @returns {{ skew: number, setupSlack: number, holdSlack: number, setupPassed: boolean, holdPassed: boolean }}
 */
export function calculateSkewImpact({
  periodNs = 1.0,
  tCqNs = 0.10,
  tCombNs = 0.60,
  tSetupNs = 0.08,
  tHoldNs = 0.04,
  launchArrivalNs = 0.20,
  captureArrivalNs = 0.20,
}) {
  const safePeriod = Math.max(0.001, Number(periodNs) || 1.0);
  const safeCq = Math.max(0, Number(tCqNs) || 0);
  const safeComb = Math.max(0, Number(tCombNs) || 0);
  const safeSetup = Math.max(0, Number(tSetupNs) || 0);
  const safeHold = Math.max(0, Number(tHoldNs) || 0);
  const safeLaunch = Number(launchArrivalNs) || 0;
  const safeCapture = Number(captureArrivalNs) || 0;

  const skew = Number((safeCapture - safeLaunch).toFixed(4));
  const setupSlack = Number((safePeriod - (safeCq + safeComb + safeSetup) + skew).toFixed(4));
  const holdSlack = Number(((safeCq + safeComb) - safeHold - skew).toFixed(4));

  return {
    skew,
    setupSlack,
    holdSlack,
    setupPassed: setupSlack >= 0,
    holdPassed: holdSlack >= 0,
  };
}

/**
 * Calculate buffer insertion to balance two clock branches with different arrival delays.
 *
 * @param {number} earlyArrivalNs
 * @param {number} lateArrivalNs
 * @param {number} [bufferDelayNs=0.050]
 * @returns {{ deltaNs: number, buffersNeeded: number, balancedArrivalNs: number, residualSkewNs: number }}
 */
export function balanceTwoSinks(earlyArrivalNs, lateArrivalNs, bufferDelayNs = 0.050) {
  const deltaNs = Number(Math.max(0, lateArrivalNs - earlyArrivalNs).toFixed(4));
  const buffersNeeded = Math.round(deltaNs / bufferDelayNs);
  const balancedArrivalNs = Number((earlyArrivalNs + buffersNeeded * bufferDelayNs).toFixed(4));
  const residualSkewNs = Number(Math.abs(lateArrivalNs - balancedArrivalNs).toFixed(4));
  return {
    deltaNs,
    buffersNeeded,
    balancedArrivalNs,
    residualSkewNs,
  };
}

/**
 * Model architectural trade-offs across common Clock Tree Topologies.
 *
 * @param {string} topology - 'h-tree' | 'balanced-tree' | 'clock-mesh' | 'trunk-spine'
 * @returns {{ name: string, skewExpectationPs: number, powerFactor: number, routingArea: string, pros: string, cons: string }}
 */
export function getTopologyProfile(topology) {
  const key = String(topology).toLowerCase().replace(/_/g, '-');
  return CLOCK_TOPOLOGY_PROFILES[key] || CLOCK_TOPOLOGY_PROFILES['balanced-tree'];
}
