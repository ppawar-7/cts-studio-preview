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
 * 5. Clock Topologies: H-Tree, Balanced Binary Tree, Clock Mesh, Spine.
 */

export const CLOCK_BUFFER_LIB = {
  CLKBUF_X1: { id: 'CLKBUF_X1', driveStrength: 1, tIntrinsic: 0.040, rDrive: 120, inputCap: 0.002 }, // ns, Ohm, pF
  CLKBUF_X2: { id: 'CLKBUF_X2', driveStrength: 2, tIntrinsic: 0.035, rDrive: 60,  inputCap: 0.004 },
  CLKBUF_X4: { id: 'CLKBUF_X4', driveStrength: 4, tIntrinsic: 0.030, rDrive: 30,  inputCap: 0.008 },
  CLKBUF_X8: { id: 'CLKBUF_X8', driveStrength: 8, tIntrinsic: 0.025, rDrive: 15,  inputCap: 0.016 },
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
  // Delay = tIntrinsic + (rDrive * loadCapPf * 1e-3)
  const delay = buf.tIntrinsic + (buf.rDrive * loadCapPf * 0.001);
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
  const skew = Number((captureArrivalNs - launchArrivalNs).toFixed(4));
  const setupSlack = Number((periodNs - (tCqNs + tCombNs + tSetupNs) + skew).toFixed(4));
  const holdSlack = Number(((tCqNs + tCombNs) - tHoldNs - skew).toFixed(4));

  return {
    skew,
    setupSlack,
    holdSlack,
    setupPassed: setupSlack >= 0,
    holdPassed: holdSlack >= 0,
  };
}

/**
 * Returns trade-off profile and metadata for standard clock distribution topologies.
 */
export const CLOCK_TOPOLOGY_PROFILES = {
  'h-tree': {
    name: 'Symmetric H-Tree',
    skewQuality: 'Excellent (Theoretical zero skew with perfect symmetry)',
    powerConsumption: 'Moderate',
    routingOverhead: 'Moderate to High',
    flexibility: 'Low (requires uniform sink distribution)',
    bestUse: 'Symmetric arrays, processors with structured clock distributions',
  },
  'balanced-tree': {
    name: 'Geometric Balanced Binary Tree (CAD standard)',
    skewQuality: 'Very Good (Min-max delay balancing via automated buffer insertion)',
    powerConsumption: 'Low to Moderate (Dynamic power optimized via clock gating)',
    routingOverhead: 'Low (Follows standard routing tracks)',
    flexibility: 'High (Handles irregular standard cell sink distributions)',
    bestUse: 'General ASIC standard cell designs',
  },
  'clock-mesh': {
    name: 'Clock Mesh (Grid)',
    skewQuality: 'Outstanding (Extremely low skew, highly resilient to OCV/PVT variations)',
    powerConsumption: 'Very High (Continuous grid capacitance switched every cycle)',
    routingOverhead: 'High (Dedicated metal layers reserved for mesh grid)',
    flexibility: 'High (Taps can connect anywhere on the grid)',
    bestUse: 'Ultra-high performance microprocessors, GPUs, and >3 GHz cores',
  },
  'trunk-spine': {
    name: 'Trunk & Spine (Fishbone)',
    skewQuality: 'Moderate',
    powerConsumption: 'Moderate',
    routingOverhead: 'Low',
    flexibility: 'Moderate',
    bestUse: 'Data paths, bit-sliced memories, structured datapath macros',
  },
};

/**
 * Determine the number of buffer stages needed to balance two unequal clock branches.
 *
 * @param {number} earlyArrivalNs - Arrival time of earlier branch
 * @param {number} lateArrivalNs - Arrival time of slower branch
 * @param {number} delayPerBufferNs - Delay added per buffer stage (e.g. 0.050 ns)
 * @returns {{ deltaNs: number, buffersNeeded: number, balancedArrivalNs: number, residualSkewNs: number }}
 */
export function balanceTwoSinks(earlyArrivalNs, lateArrivalNs, delayPerBufferNs = 0.050) {
  const delta = Math.max(0, lateArrivalNs - earlyArrivalNs);
  const buffersNeeded = Math.round(delta / delayPerBufferNs);
  const addedDelay = buffersNeeded * delayPerBufferNs;
  const balancedArrivalNs = Number((earlyArrivalNs + addedDelay).toFixed(4));
  const residualSkewNs = Number(Math.abs(lateArrivalNs - balancedArrivalNs).toFixed(4));

  return {
    deltaNs: Number(delta.toFixed(4)),
    buffersNeeded,
    balancedArrivalNs,
    residualSkewNs,
  };
}
