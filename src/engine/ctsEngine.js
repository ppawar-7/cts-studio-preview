/**
 * ctsEngine.js
 * ============
 * Pure, deterministic ASIC Clock Tree Synthesis (CTS) electrical and timing engine.
 *
 * Core Physical Design and Educational CAD Capabilities:
 * 1. Clock Source, Tree Interconnect, and Leaf Sinks (Registers).
 * 2. Graph-based Elmore Delay Model for tree propagation with wire parasitics.
 * 3. Drive-strength-sensitive buffer delay and transition time (slew) estimation.
 * 4. Clock Latency (Insertion Delay) & Global Clock Skew (max arrival - min arrival).
 * 5. Signed Launch vs Capture Skew for Setup and Hold Slack Analysis (with distinct max/min data paths).
 * 6. Deterministic Auto-Balancing Graph Transformation Heuristic.
 * 7. Comprehensive Diagnostic Rule Checking (Cycles, Fanout, Capacitance, Slew, Blockages, Bounds).
 * 8. Clock Network Switching Dynamic Power & Static Leakage Estimation.
 *
 * References: OpenROAD CTS (TritonCTS) and OpenSTA architectural principles.
 */

// Educational Clock Buffer Cell Library
export const CLOCK_BUFFER_LIB = {
  CLKBUF_X1: {
    id: 'CLKBUF_X1',
    driveStrength: 1,
    tIntrinsic: 0.040, // 40 ps intrinsic delay
    rDrive: 120,       // 120 Ohms output resistance
    inputCap: 0.002,   // 2 fF input pin capacitance
    areaUm2: 2.4,      // 2.4 um^2 physical cell area
    leakageUw: 0.05,   // 50 nW static leakage
    maxLoadCapPf: 0.050, // 50 fF maximum safe load
    maxFanout: 4,
  },
  CLKBUF_X2: {
    id: 'CLKBUF_X2',
    driveStrength: 2,
    tIntrinsic: 0.035, // 35 ps
    rDrive: 60,        // 60 Ohms
    inputCap: 0.004,   // 4 fF
    areaUm2: 3.6,
    leakageUw: 0.10,
    maxLoadCapPf: 0.100, // 100 fF
    maxFanout: 6,
  },
  CLKBUF_X4: {
    id: 'CLKBUF_X4',
    driveStrength: 4,
    tIntrinsic: 0.030, // 30 ps
    rDrive: 30,        // 30 Ohms
    inputCap: 0.008,   // 8 fF
    areaUm2: 6.0,
    leakageUw: 0.20,
    maxLoadCapPf: 0.200, // 200 fF
    maxFanout: 8,
  },
  CLKBUF_X8: {
    id: 'CLKBUF_X8',
    driveStrength: 8,
    tIntrinsic: 0.025, // 25 ps
    rDrive: 15,        // 15 Ohms
    inputCap: 0.016,   // 16 fF
    areaUm2: 10.8,
    leakageUw: 0.40,
    maxLoadCapPf: 0.400, // 400 fF
    maxFanout: 12,
  },
};

// Interconnect Technology Parameters (e.g. Intermediate Metal Layers M3/M4)
export const WIRE_PARASITICS = {
  rPerUm: 0.05,       // 0.05 Ohms per micrometer
  cPerUmPf: 0.00015,  // 0.15 fF per micrometer = 0.00015 pF/um
  nominalSlewBasePs: 15, // Base transition time in picoseconds
  nominalSlewFactor: 1.8, // Slew sensitivity coefficient
};

// Clock Tree Topology Profiles (Architectural Trade-offs)
export const CLOCK_TOPOLOGY_PROFILES = {
  'h-tree': {
    name: 'Symmetric H-Tree',
    skewExpectationPs: 8,
    powerFactor: 1.2,
    routingArea: 'Medium',
    pros: 'Near-zero structural skew for uniformly distributed sinks across regular quadrants.',
    cons: 'Rigid layout geometry; highly vulnerable to asymmetric sink loads and macro blockages.',
  },
  'clock-mesh': {
    name: 'Clock Mesh / Grid',
    skewExpectationPs: 3,
    powerFactor: 2.8,
    routingArea: 'High',
    pros: 'Ultra-low skew and robust immunity to local on-chip process/temperature variations (OCV).',
    cons: 'Excessive dynamic switching power from shorted cross-grid driving buffers.',
  },
  'trunk-spine': {
    name: 'Trunk / Spine',
    skewExpectationPs: 25,
    powerFactor: 0.9,
    routingArea: 'Low',
    pros: 'Low routing resource utilization and straightforward CTS implementation.',
    cons: 'High latency gradient along the main spine trunk requires delay padding.',
  },
  'balanced-tree': {
    name: 'Balanced Binary Tree',
    skewExpectationPs: 15,
    powerFactor: 1.0,
    routingArea: 'Moderate',
    pros: 'Flexible buffer insertion and branch delay balancing around macro blockages.',
    cons: 'Sensitive to local interconnect RC parasitics and asymmetric branch taps.',
  },
};

/**
 * Compute buffer delay based on linear RC load model.
 * Delay = tIntrinsic + (rDrive * loadCapPf * 1e-3)
 *
 * @param {string} bufferType - Cell name in CLOCK_BUFFER_LIB
 * @param {number} loadCapPf - Output load capacitance in picofarads
 * @returns {number} Delay in nanoseconds (rounded to 4 decimal places)
 */
export function computeBufferDelay(bufferType, loadCapPf = 0.01) {
  const buf = CLOCK_BUFFER_LIB[bufferType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
  const safeCap = Math.max(0, Number(loadCapPf) || 0);
  const delay = buf.tIntrinsic + (buf.rDrive * safeCap * 0.001);
  return Number(delay.toFixed(4));
}

/**
 * Compute transition time (slew) in picoseconds for a given driver and capacitive load.
 *
 * @param {string} bufferType
 * @param {number} loadCapPf
 * @returns {number} Transition time in picoseconds
 */
export function computeTransitionTimePs(bufferType, loadCapPf = 0.01) {
  const buf = CLOCK_BUFFER_LIB[bufferType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
  const safeCap = Math.max(0, Number(loadCapPf) || 0);
  // tau = R * C (in picoseconds: Ohms * pF = ps)
  const rcPs = buf.rDrive * safeCap;
  const slewPs = WIRE_PARASITICS.nominalSlewBasePs + WIRE_PARASITICS.nominalSlewFactor * rcPs;
  return Number(slewPs.toFixed(1));
}

/**
 * Compute Manhattan distance between two 2D points.
 *
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @returns {number} Manhattan distance in micrometers
 */
export function computeManhattanDistance(p1, p2) {
  if (!p1 || !p2 || !Number.isFinite(p1.x) || !Number.isFinite(p1.y) || !Number.isFinite(p2.x) || !Number.isFinite(p2.y)) {
    return 0;
  }
  return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
}

/**
 * Compute clock latency, skew, and balance metrics across an array of sink arrival times.
 * Rejects invalid, non-finite or empty arrivals with fail-closed outputs.
 *
 * @param {Array<{id: string, arrivalTime: number}>} sinks
 * @param {number} skewTargetNs - Maximum allowable skew in nanoseconds (default 0.050 ns = 50 ps)
 * @returns {{ minArrival: number, maxArrival: number, latency: number, skew: number, isBalanced: boolean, valid: boolean }}
 */
export function computeClockTreeMetrics(sinks, skewTargetNs = 0.050) {
  if (!Array.isArray(sinks) || sinks.length === 0) {
    return { minArrival: 0, maxArrival: 0, latency: 0, skew: 0, isBalanced: false, valid: false };
  }

  // Validate that all arrivals are valid finite positive numbers
  const hasInvalid = sinks.some((s) => !s || typeof s.arrivalTime !== 'number' || !Number.isFinite(s.arrivalTime) || s.arrivalTime <= 0);
  if (hasInvalid) {
    return {
      minArrival: 0,
      maxArrival: 0,
      latency: 0,
      skew: 0,
      isBalanced: false,
      valid: false,
      error: 'One or more sinks have invalid or non-finite arrival times.',
    };
  }

  const arrivals = sinks.map((s) => s.arrivalTime);
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
    valid: true,
  };
}

/**
 * Calculate setup and hold slack given clock arrival times at launch and capture flip-flops.
 * Supports distinct max/min data path combinational delays to avoid false symmetric slack assumptions.
 *
 * Setup Slack: T_period - (T_cq_max + T_comb_max + T_setup) + (T_capture - T_launch)
 * Hold Slack:  (T_cq_min + T_comb_min) - T_hold - (T_capture - T_launch)
 *
 * @param {Object} params
 * @param {number} [params.periodNs=1.0]
 * @param {number} [params.tCqNs] - Default fallback for cq delay
 * @param {number} [params.tCqMaxNs] - Explicit max clk-to-q delay
 * @param {number} [params.tCqMinNs] - Explicit min clk-to-q delay
 * @param {number} [params.tCombNs] - Default fallback for data path delay
 * @param {number} [params.tCombMaxNs] - Max data path delay for Setup
 * @param {number} [params.tCombMinNs] - Min data path delay for Hold
 * @param {number} [params.tSetupNs=0.08]
 * @param {number} [params.tHoldNs=0.04]
 * @param {number} [params.launchArrivalNs=0.20]
 * @param {number} [params.captureArrivalNs=0.20]
 * @returns {{ skew: number, setupSlack: number, holdSlack: number, setupPassed: boolean, holdPassed: boolean }}
 */
export function calculateSkewImpact({
  periodNs = 1.0,
  tCqNs = 0.10,
  tCqMaxNs,
  tCqMinNs,
  tCombNs = 0.60,
  tCombMaxNs,
  tCombMinNs,
  tSetupNs = 0.08,
  tHoldNs = 0.04,
  launchArrivalNs = 0.20,
  captureArrivalNs = 0.20,
}) {
  const safePeriod = Math.max(0.001, Number(periodNs) || 1.0);
  const cqMax = Math.max(0, Number(tCqMaxNs ?? tCqNs) || 0);
  const cqMin = Math.max(0, Number(tCqMinNs ?? tCqNs) || 0);

  // Distinct max and min combinational delays (defaults to tCombNs if not explicitly separated)
  const combMax = Math.max(0, Number(tCombMaxNs ?? tCombNs) || 0);
  const combMin = Math.max(0, Number(tCombMinNs ?? tCombNs) || 0);

  const safeSetup = Math.max(0, Number(tSetupNs) || 0);
  const safeHold = Math.max(0, Number(tHoldNs) || 0);
  const safeLaunch = Number(launchArrivalNs) || 0;
  const safeCapture = Number(captureArrivalNs) || 0;

  // Signed clock skew: positive when capture is later than launch
  const skew = Number((safeCapture - safeLaunch).toFixed(4));
  const setupSlack = Number((safePeriod - (cqMax + combMax + safeSetup) + skew).toFixed(4));
  const holdSlack = Number(((cqMin + combMin) - safeHold - skew).toFixed(4));

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

/**
 * Detect cycles in a directed clock graph using Depth First Search (DFS).
 *
 * @param {Array<{id: string}>} nodes
 * @param {Array<{from: string, to: string}>} branches
 * @returns {{ hasCycle: boolean, cycleNodes: string[] }}
 */
export function detectGraphCycles(nodes = [], branches = []) {
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, []));
  branches.forEach((b) => {
    if (adj.has(b.from)) {
      adj.get(b.from).push(b.to);
    }
  });

  const visited = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited
  nodes.forEach((n) => visited.set(n.id, 0));

  let cycleFound = false;
  let cycleNodes = [];

  function dfs(curr, path = []) {
    visited.set(curr, 1);
    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      if (visited.get(next) === 1) {
        cycleFound = true;
        const cycleStartIdx = path.indexOf(next);
        cycleNodes = cycleStartIdx !== -1 ? path.slice(cycleStartIdx).concat(curr, next) : [curr, next];
        return true;
      }
      if (visited.get(next) === 0) {
        if (dfs(next, path.concat(curr))) return true;
      }
    }
    visited.set(curr, 2);
    return false;
  }

  for (const n of nodes) {
    if (visited.get(n.id) === 0) {
      if (dfs(n.id)) break;
    }
  }

  return { hasCycle: cycleFound, cycleNodes };
}

/**
 * Pure, comprehensive Elmore clock tree electrical solver.
 * Traverses root-to-sink clock paths, computes wire and buffer loads,
 * propagation arrival times, slew rates, power, area, and diagnostics.
 *
 * @param {Object} project - Standard CTS Project representation
 * @returns {Object} Comprehensive solved CTS results envelope
 */
export function solveClockTreeElmore(project) {
  if (!project || typeof project !== 'object') {
    return {
      isValid: false,
      errors: ['Project must be a valid non-null object.'],
    };
  }

  const {
    core = { width: 500, height: 400 },
    root,
    buffers = [],
    sinks = [],
    branches = [],
    blockages = [],
    constraints = {},
    dataPaths = [],
  } = project;

  const errors = [];
  const warnings = [];

  // 1. Root verification
  if (!root || !Number.isFinite(root.x) || !Number.isFinite(root.y)) {
    return {
      isValid: false,
      errors: ['Clock root is missing or has invalid coordinates.'],
    };
  }

  // 2. Build complete node lookup table
  const nodeMap = new Map();
  const rootNode = {
    ...root,
    id: root.id || 'ROOT',
    type: 'root',
    driveStrength: root.driveStrength || 4,
    cellType: root.cellType || 'CLKBUF_X4',
  };
  nodeMap.set(rootNode.id, rootNode);

  buffers.forEach((b) => {
    nodeMap.set(b.id, {
      ...b,
      type: 'buffer',
      cellType: b.cellType || 'CLKBUF_X2',
    });
  });

  sinks.forEach((s) => {
    nodeMap.set(s.id, {
      ...s,
      type: 'sink',
      loadCapPf: Number.isFinite(s.loadCapPf) ? s.loadCapPf : 0.004,
    });
  });

  // 3. Cycle Detection
  const allNodesList = Array.from(nodeMap.values());
  const cycleCheck = detectGraphCycles(allNodesList, branches);
  if (cycleCheck.hasCycle) {
    errors.push(`Cycle detected in clock tree involving nodes: ${cycleCheck.cycleNodes.join(' -> ')}`);
    return {
      isValid: false,
      errors,
      violations: [
        {
          type: 'GRAPH_CYCLE',
          message: `Cycle detected in clock tree involving nodes: ${cycleCheck.cycleNodes.join(' -> ')}`,
          suggestion: 'Remove feedback loops. Clock trees must be directed acyclic trees.',
        },
      ],
      sinks: sinks.map((s) => ({ ...s, arrivalTime: 0, arrivalPs: 0, isReached: false })),
      buffers: buffers.map((b) => ({ ...b, arrivalTime: 0, arrivalPs: 0, isReached: false })),
      branches: [],
      minArrivalPs: 0,
      maxArrivalPs: 0,
      skewPs: 0,
      insertionDelayPs: 0,
      wirelengthUm: 0,
      dynamicPowerMw: 0,
      leakagePowerUw: 0,
      totalPowerMw: 0,
      bufferAreaUm2: 0,
      dataPaths: [],
      diagnostics: {
        hasCycle: true,
        hasDisconnectedSinks: true,
        violatingSinksCount: sinks.length,
        violations: [
          {
            type: 'GRAPH_CYCLE',
            message: `Cycle detected in clock tree involving nodes: ${cycleCheck.cycleNodes.join(' -> ')}`,
            suggestion: 'Remove feedback loops. Clock trees must be directed acyclic trees.',
          },
        ],
      },
    };
  }

  // 4. Construct tree adjacency graphs (out-edges and in-edges)
  const childrenMap = new Map(); // parentId -> [ { toId, branchId, wireLength, wireR, wireC } ]
  const parentMap = new Map();   // childId -> { fromId, branchId, wireLength, wireR, wireC }
  allNodesList.forEach((n) => childrenMap.set(n.id, []));

  branches.forEach((b, idx) => {
    const fromNode = nodeMap.get(b.from);
    const toNode = nodeMap.get(b.to);

    if (!fromNode) {
      errors.push(`Branch ${b.id || idx} has nonexistent source node "${b.from}".`);
      return;
    }
    if (!toNode) {
      errors.push(`Branch ${b.id || idx} has nonexistent destination node "${b.to}".`);
      return;
    }

    if (parentMap.has(b.to)) {
      errors.push(`Node "${b.to}" has multiple drivers (reconvergence/multiple input branches are illegal in tree CTS).`);
    }

    const lengthUm = computeManhattanDistance(fromNode, toNode);
    const wireR = Number((lengthUm * WIRE_PARASITICS.rPerUm).toFixed(4));
    const wireC = Number((lengthUm * WIRE_PARASITICS.cPerUmPf).toFixed(6));

    const branchInfo = {
      id: b.id || `BRANCH_${idx}`,
      from: b.from,
      to: b.to,
      lengthUm,
      wireR,
      wireC,
    };

    childrenMap.get(b.from).push(branchInfo);
    parentMap.set(b.to, branchInfo);
  });

  // 5. Reachability and Disconnected Sink Checks
  const visitedFromRoot = new Set();
  function traverseReach(nodeId) {
    visitedFromRoot.add(nodeId);
    const children = childrenMap.get(nodeId) || [];
    children.forEach((c) => {
      if (!visitedFromRoot.has(c.to)) {
        traverseReach(c.to);
      }
    });
  }
  traverseReach(rootNode.id);

  const disconnectedSinks = sinks.filter((s) => !visitedFromRoot.has(s.id));
  if (disconnectedSinks.length > 0) {
    errors.push(`${disconnectedSinks.length} clock sink(s) are not connected to the root: ${disconnectedSinks.map((s) => s.id).join(', ')}`);
  }

  // 6. Post-order computation of Downstream Capacitance (Elmore load)
  const downstreamCapMap = new Map(); // nodeId -> total downstream capacitance in pF
  const bufferLoadMap = new Map();     // buffer/root -> output load capacitance in pF

  function computeDownstreamCap(nodeId) {
    const node = nodeMap.get(nodeId);
    if (!node) return 0;

    let cap = 0;
    if (node.type === 'sink') {
      cap = node.loadCapPf;
    }

    const children = childrenMap.get(nodeId) || [];
    let directOutputLoad = 0;

    children.forEach((branch) => {
      const childId = branch.to;
      const childNode = nodeMap.get(childId);
      const childDownstream = computeDownstreamCap(childId);

      // Branch wire capacitance
      directOutputLoad += branch.wireC;

      if (childNode.type === 'buffer') {
        const cell = CLOCK_BUFFER_LIB[childNode.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
        directOutputLoad += cell.inputCap;
      } else if (childNode.type === 'sink') {
        directOutputLoad += childDownstream;
      }
    });

    if (node.type === 'buffer' || node.type === 'root') {
      bufferLoadMap.set(nodeId, directOutputLoad);
      const cell = CLOCK_BUFFER_LIB[node.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X4;
      cap = cell.inputCap;
    }

    downstreamCapMap.set(nodeId, cap);
    return cap;
  }

  computeDownstreamCap(rootNode.id);

  // 7. Pre-order traversal to compute exact root-to-sink Elmore arrival times
  const arrivalMap = new Map(); // nodeId -> arrivalTime in ns
  const slewMap = new Map();    // nodeId -> transition time in ps
  arrivalMap.set(rootNode.id, 0.0);
  slewMap.set(rootNode.id, WIRE_PARASITICS.nominalSlewBasePs);

  function propagateDelays(nodeId) {
    const parentArrival = arrivalMap.get(nodeId) || 0;
    const parentNode = nodeMap.get(nodeId);
    const children = childrenMap.get(nodeId) || [];

    // Driver delay for buffers or root
    let driverDelay = 0;
    let driverSlew = WIRE_PARASITICS.nominalSlewBasePs;

    if (parentNode.type === 'buffer' || parentNode.type === 'root') {
      const cellType = parentNode.cellType || (parentNode.type === 'root' ? 'CLKBUF_X4' : 'CLKBUF_X2');
      const loadCap = bufferLoadMap.get(nodeId) || 0.01;
      driverDelay = computeBufferDelay(cellType, loadCap);
      driverSlew = computeTransitionTimePs(cellType, loadCap);
      slewMap.set(nodeId, driverSlew);
    }

    children.forEach((branch) => {
      const childNode = nodeMap.get(branch.to);
      const childDownstream = downstreamCapMap.get(branch.to) || 0;

      // Elmore wire delay: R_wire * (C_wire / 2 + C_downstream)
      // Units: Ohms * pF * 1e-3 = nanoseconds
      const wireDelayNs = Number((branch.wireR * (branch.wireC * 0.5 + childDownstream) * 0.001).toFixed(6));
      const totalArrival = Number((parentArrival + driverDelay + wireDelayNs).toFixed(4));

      arrivalMap.set(branch.to, totalArrival);

      // Propagate transition degradation along RC branch
      const branchSlewDegradation = branch.wireR * branch.wireC * 1.5;
      slewMap.set(branch.to, Number((driverSlew + branchSlewDegradation).toFixed(1)));

      propagateDelays(branch.to);
    });
  }

  propagateDelays(rootNode.id);

  // 8. Physical Design Rule Checks (Fanout, Max Cap, Max Slew, Blockages, Bounds)
  const maxFanoutConfig = constraints.maxFanout || 4;
  const maxSlewConfigPs = constraints.maxSlewPs || 120;
  const skewBudgetPs = constraints.skewBudgetPs || 40;
  const maxLatencyBudgetPs = constraints.maxLatencyBudgetPs || 350;

  const violations = [];

  // Check fanout and max load per driver
  nodeMap.forEach((node) => {
    if (node.type === 'buffer' || node.type === 'root') {
      const fanout = (childrenMap.get(node.id) || []).length;
      const cell = CLOCK_BUFFER_LIB[node.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
      const loadCap = bufferLoadMap.get(node.id) || 0;
      const maxAllowedFanout = cell.maxFanout || maxFanoutConfig;

      if (fanout > maxAllowedFanout) {
        violations.push({
          type: 'MAX_FANOUT',
          nodeId: node.id,
          message: `Buffer "${node.id}" (${cell.id}) drives ${fanout} branches (limit is <= ${maxAllowedFanout}).`,
          suggestion: 'Split branches or insert an intermediate distribution buffer stage.',
        });
      }

      if (loadCap > cell.maxLoadCapPf) {
        violations.push({
          type: 'MAX_CAPACITANCE',
          nodeId: node.id,
          message: `Buffer "${node.id}" output load is ${(loadCap * 1000).toFixed(1)} fF (limit is ${(cell.maxLoadCapPf * 1000).toFixed(1)} fF).`,
          suggestion: `Upsize buffer to higher drive strength or insert tree buffers closer to sinks.`,
        });
      }

      const slew = slewMap.get(node.id) || 0;
      if (slew > maxSlewConfigPs) {
        violations.push({
          type: 'MAX_TRANSITION',
          nodeId: node.id,
          message: `Transition time at "${node.id}" is ${slew.toFixed(0)} ps (limit is <= ${maxSlewConfigPs} ps).`,
          suggestion: 'Upsize driver to reduce output impedance and sharpen clock edges.',
        });
      }
    }

    // Boundary check
    if (core && Number.isFinite(core.width) && Number.isFinite(core.height)) {
      if (node.x < 0 || node.x > core.width || node.y < 0 || node.y > core.height) {
        violations.push({
          type: 'CORE_OUT_OF_BOUNDS',
          nodeId: node.id,
          message: `Node "${node.id}" is placed outside core boundary at (${node.x}, ${node.y}).`,
          suggestion: `Relocate node inside core area (0, 0) to (${core.width}, ${core.height}).`,
        });
      }
    }

    // Macro Blockage Overlap
    if (node.type === 'buffer') {
      blockages.forEach((blk) => {
        if (
          node.x >= blk.x &&
          node.x <= blk.x + blk.width &&
          node.y >= blk.y &&
          node.y <= blk.y + blk.height
        ) {
          violations.push({
            type: 'MACRO_OBSTRUCTION',
            nodeId: node.id,
            blockageId: blk.id,
            message: `Buffer "${node.id}" is illegally placed inside macro blockage "${blk.name || blk.id}".`,
            suggestion: 'Move buffer to legal standard-cell routing corridors outside macro halos.',
          });
        }
      });
    }
  });

  // 9. Sink Metrics Evaluation
  const sinkResults = sinks.map((s) => {
    const isReached = visitedFromRoot.has(s.id);
    const arrivalTime = isReached ? (arrivalMap.get(s.id) || 0) : null;
    const arrivalPs = isReached && arrivalTime !== null ? Math.round(arrivalTime * 1000) : null;
    const slew = isReached ? slewMap.get(s.id) || 0 : null;
    return {
      id: s.id,
      name: s.name || s.id,
      x: s.x,
      y: s.y,
      isReached,
      arrivalTime,
      arrivalPs,
      slewPs: slew,
      loadCapPf: s.loadCapPf,
    };
  });

  // Skew and Latency calculations
  const reachedSinks = sinkResults.filter((s) => s.isReached && s.arrivalTime !== null);
  let minArrival = 0;
  let maxArrival = 0;
  let latency = 0;
  let globalSkewNs = 0;
  let globalSkewPs = 0;
  let maxLatencyPs = 0;
  let isSkewMet = false;
  let isLatencyMet = false;

  if (reachedSinks.length > 0 && disconnectedSinks.length === 0 && !cycleCheck.hasCycle) {
    const arrivals = reachedSinks.map((s) => s.arrivalTime);
    minArrival = Math.min(...arrivals);
    maxArrival = Math.max(...arrivals);
    latency = maxArrival;
    globalSkewNs = Number((maxArrival - minArrival).toFixed(4));
    globalSkewPs = Math.round(globalSkewNs * 1000);
    maxLatencyPs = Math.round(maxArrival * 1000);

    isSkewMet = globalSkewPs <= skewBudgetPs;
    isLatencyMet = maxLatencyPs <= maxLatencyBudgetPs;

    if (!isSkewMet) {
      violations.push({
        type: 'SKEW_BUDGET_EXCEEDED',
        message: `Global clock skew is ${globalSkewPs} ps (exceeds budget of <= ${skewBudgetPs} ps).`,
        suggestion: 'Balance branch lengths, insert delay buffers on early paths, or size down early drivers.',
      });
    }
    if (!isLatencyMet) {
      violations.push({
        type: 'LATENCY_BUDGET_EXCEEDED',
        message: `Maximum insertion delay is ${maxLatencyPs} ps (exceeds budget of <= ${maxLatencyBudgetPs} ps).`,
        suggestion: 'Upsize trunk drivers or reduce tree depth.',
      });
    }
  }

  // 10. Setup and Hold Timing Analysis on Configured Data Paths
  const evaluatedDataPaths = dataPaths.map((dp, idx) => {
    const launchSink = sinkResults.find((s) => s.id === dp.fromSinkId);
    const captureSink = sinkResults.find((s) => s.id === dp.toSinkId);

    if (!launchSink || !captureSink || !launchSink.isReached || !captureSink.isReached) {
      return {
        id: dp.id || `PATH_${idx}`,
        fromSinkId: dp.fromSinkId,
        toSinkId: dp.toSinkId,
        isValid: false,
        error: 'Launch or capture sink not reached by clock.',
      };
    }

    const timing = calculateSkewImpact({
      periodNs: constraints.periodNs || 1.0,
      tCqMaxNs: dp.tCqMaxNs ?? 0.10,
      tCqMinNs: dp.tCqMinNs ?? 0.06,
      tCombMaxNs: dp.tCombMaxNs ?? 0.65,
      tCombMinNs: dp.tCombMinNs ?? 0.12,
      tSetupNs: dp.tSetupNs ?? 0.08,
      tHoldNs: dp.tHoldNs ?? 0.05,
      launchArrivalNs: launchSink.arrivalTime,
      captureArrivalNs: captureSink.arrivalTime,
    });

    if (!timing.setupPassed) {
      violations.push({
        type: 'SETUP_TIMING_VIOLATION',
        pathId: dp.id || `PATH_${idx}`,
        message: `Setup timing violated on path ${dp.fromSinkId} -> ${dp.toSinkId} (Slack: ${(timing.setupSlack * 1000).toFixed(0)} ps).`,
        suggestion: 'Increase capture clock delay (useful skew) or optimize data path combinational logic.',
      });
    }
    if (!timing.holdPassed) {
      violations.push({
        type: 'HOLD_TIMING_VIOLATION',
        pathId: dp.id || `PATH_${idx}`,
        message: `Hold timing violated on path ${dp.fromSinkId} -> ${dp.toSinkId} (Slack: ${(timing.holdSlack * 1000).toFixed(0)} ps).`,
        suggestion: 'Decrease capture clock delay, increase launch clock delay, or add data-path hold buffers.',
      });
    }

    return {
      id: dp.id || `PATH_${idx}`,
      fromSinkId: dp.fromSinkId,
      toSinkId: dp.toSinkId,
      launchArrivalPs: launchSink.arrivalPs,
      captureArrivalPs: captureSink.arrivalPs,
      skewPs: Math.round(timing.skew * 1000),
      setupSlackPs: Math.round(timing.setupSlack * 1000),
      holdSlackPs: Math.round(timing.holdSlack * 1000),
      setupPassed: timing.setupPassed,
      holdPassed: timing.holdPassed,
      isValid: true,
    };
  });

  // 11. Clock Network Power and Area Estimation
  let totalWirelengthUm = 0;
  let totalWireCapPf = 0;
  branches.forEach((b) => {
    const fromNode = nodeMap.get(b.from);
    const toNode = nodeMap.get(b.to);
    if (fromNode && toNode) {
      const len = computeManhattanDistance(fromNode, toNode);
      totalWirelengthUm += len;
      totalWireCapPf += len * WIRE_PARASITICS.cPerUmPf;
    }
  });

  let totalBufferAreaUm2 = 0;
  let totalBufferInputCapPf = 0;
  let totalLeakageUw = 0;
  buffers.forEach((b) => {
    const cell = CLOCK_BUFFER_LIB[b.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
    totalBufferAreaUm2 += cell.areaUm2;
    totalBufferInputCapPf += cell.inputCap;
    totalLeakageUw += cell.leakageUw;
  });

  let totalSinkCapPf = sinks.reduce((sum, s) => sum + (s.loadCapPf || 0.004), 0);
  const totalTreeCapPf = totalWireCapPf + totalBufferInputCapPf + totalSinkCapPf;

  // Dynamic Power: P_dyn = alpha * C_total * Vdd^2 * f_clk
  // Vdd = 1.0 V, f_clk = 1.0 GHz (1e9 Hz), alpha = 1.0 (clock switches every cycle)
  // P (mW) = 1.0 * (C in pF * 1e-12) * (1.0)^2 * 1e9 * 1e3 = C_total in pF * 1.0 mW
  const vdd = constraints.vdd || 1.0;
  const fClkGhz = (1.0 / (constraints.periodNs || 1.0));
  const activityFactor = 1.0; // Standard full-toggle clock network
  const dynamicPowerMw = Number((activityFactor * totalTreeCapPf * (vdd * vdd) * fClkGhz).toFixed(3));
  const leakagePowerMw = Number((totalLeakageUw * 0.001).toFixed(4));
  const totalPowerMw = Number((dynamicPowerMw + leakagePowerMw).toFixed(3));

  // Determine tree depth (max hops from root to any sink)
  function computeDepth(nodeId) {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return 0;
    const childDepths = children.map((c) => computeDepth(c.to));
    return 1 + Math.max(...childDepths);
  }
  const treeDepth = computeDepth(rootNode.id);

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    violations,
    skewPs: globalSkewPs,
    minArrivalPs: Math.round(minArrival * 1000),
    maxArrivalPs: maxLatencyPs,
    insertionDelayPs: maxLatencyPs,
    wirelengthUm: Number(totalWirelengthUm.toFixed(1)),
    dynamicPowerMw,
    leakagePowerMw,
    leakagePowerUw: Number(totalLeakageUw.toFixed(2)),
    totalPowerMw,
    bufferAreaUm2: Number(totalBufferAreaUm2.toFixed(1)),
    diagnostics: {
      violations,
      errors,
      warnings,
      hasCycle: false,
      hasDisconnectedSinks: disconnectedSinks.length > 0,
      violatingSinksCount: disconnectedSinks.length,
    },
    metrics: {
      minArrivalNs: minArrival,
      maxArrivalNs: maxArrival,
      latencyNs: latency,
      globalSkewNs,
      globalSkewPs,
      maxLatencyPs,
      minArrivalPs: Math.round(minArrival * 1000),
      isSkewMet,
      isLatencyMet,
      treeDepth,
      bufferCount: buffers.length,
      sinkCount: sinks.length,
      connectedSinkCount: reachedSinks.length,
      totalWirelengthUm: Number(totalWirelengthUm.toFixed(1)),
      totalBufferAreaUm2: Number(totalBufferAreaUm2.toFixed(1)),
      totalTreeCapPf: Number(totalTreeCapPf.toFixed(4)),
      dynamicPowerMw,
      leakagePowerMw,
      totalPowerMw,
      isBalanced: isSkewMet && isLatencyMet && violations.length === 0,
    },
    sinks: sinkResults,
    dataPaths: evaluatedDataPaths,
  };
}

/**
 * Deterministic Auto-Balancing Heuristic for Clock Trees.
 * Mutates the actual project graph:
 * - Upsizes high-load buffers on late paths.
 * - Inserts balancing delay buffers on early branches.
 * - Slices long branches to sharpen transition times.
 *
 * @param {Object} project
 * @returns {{ updatedProject: Object, report: string[], changesCount: number }}
 */
export function autoBalanceClockTree(project) {
  if (!project || typeof project !== 'object') {
    return { updatedProject: project, report: ['Invalid project input'], changesCount: 0 };
  }

  // Clone project
  const updated = JSON.parse(JSON.stringify(project));
  const initialSolution = solveClockTreeElmore(updated);
  const report = [];
  let changesCount = 0;

  if (!initialSolution.isValid) {
    report.push(`Cannot auto-balance invalid clock tree: ${initialSolution.errors.join('; ')}`);
    return { updatedProject: updated, report, changesCount: 0 };
  }

  report.push(`Initial Clock Skew: ${initialSolution.metrics.globalSkewPs} ps (Latency: ${initialSolution.metrics.maxLatencyPs} ps).`);

  // Target arrival time
  const targetArrivalPs = initialSolution.metrics.maxLatencyPs;
  const sinks = initialSolution.sinks || [];

  // Pass 1: Upsize buffers that drive excessive capacitive loads
  const currentBuffers = updated.buffers || [];
  currentBuffers.forEach((buf) => {
    const currentCell = CLOCK_BUFFER_LIB[buf.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
    // If buffer is currently X1 or X2 and has fanout >= 3, upsize to X4
    const fanout = (updated.branches || []).filter((b) => b.from === buf.id).length;
    if (fanout >= 3 && (buf.cellType === 'CLKBUF_X1' || buf.cellType === 'CLKBUF_X2')) {
      buf.cellType = 'CLKBUF_X4';
      report.push(`Upsized buffer "${buf.id}" to CLKBUF_X4 for load handling.`);
      changesCount++;
    }
  });

  // Pass 2: Delay padding on early sinks (inserting intermediate delay buffers)
  sinks.forEach((sink) => {
    if (!sink.isReached || sink.arrivalPs === null) return;
    const deltaPs = targetArrivalPs - sink.arrivalPs;

    // If sink arrives more than 25 ps earlier than target, insert delay buffer
    if (deltaPs >= 25) {
      // Find feeding branch
      const branchIdx = (updated.branches || []).findIndex((b) => b.to === sink.id);
      if (branchIdx !== -1) {
        const branch = updated.branches[branchIdx];
        const sourceNode = (updated.buffers || []).find((b) => b.id === branch.from) ||
                           (updated.root && updated.root.id === branch.from ? updated.root : null);

        if (sourceNode) {
          const midX = Math.round((sourceNode.x + sink.x) / 2);
          const midY = Math.round((sourceNode.y + sink.y) / 2);
          const newBufId = `BUF_BAL_${sink.id}_${Date.now() % 10000}`;

          // Choose drive strength based on required delay:
          // X1 adds ~40-50 ps, X2 adds ~35-45 ps
          const chosenCell = deltaPs > 45 ? 'CLKBUF_X1' : 'CLKBUF_X2';

          updated.buffers.push({
            id: newBufId,
            name: `clk_bal_${sink.id}`,
            x: midX,
            y: midY,
            type: 'buffer',
            cellType: chosenCell,
          });

          // Replace branch with two branches: source -> newBuf, newBuf -> sink
          updated.branches.splice(branchIdx, 1);
          updated.branches.push({ id: `BR_${branch.from}_${newBufId}`, from: branch.from, to: newBufId });
          updated.branches.push({ id: `BR_${newBufId}_${sink.id}`, from: newBufId, to: sink.id });

          report.push(`Inserted ${chosenCell} at (${midX}, ${midY}) to pad early sink "${sink.id}" (+${deltaPs} ps delta).`);
          changesCount++;
        }
      }
    }
  });

  const finalSolution = solveClockTreeElmore(updated);
  report.push(`Balanced Clock Skew: ${finalSolution.metrics.globalSkewPs} ps (Residual Skew: ${finalSolution.metrics.globalSkewPs} ps).`);

  return {
    updatedProject: updated,
    report,
    changesCount,
    finalMetrics: finalSolution.metrics,
  };
}
