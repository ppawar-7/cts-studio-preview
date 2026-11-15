import { describe, it, expect } from 'vitest';
import {
  computeBufferDelay,
  computeClockTreeMetrics,
  calculateSkewImpact,
  balanceTwoSinks,
  CLOCK_TOPOLOGY_PROFILES,
  CLOCK_BUFFER_LIB,
  WIRE_PARASITICS,
  computeManhattanDistance,
  detectGraphCycles,
  solveClockTreeElmore,
  autoBalanceClockTree,
} from '../../engine/ctsEngine.js';

describe('CTS Engine', () => {
  it('computes linear buffer delay correctly from cell library parameters', () => {
    // CLKBUF_X1: tIntrinsic = 0.040, rDrive = 120. Load = 0.01 pF -> delay = 0.040 + 120*0.01*0.001 = 0.0412 ns
    const delayX1 = computeBufferDelay('CLKBUF_X1', 0.01);
    expect(delayX1).toBe(0.0412);

    // CLKBUF_X4: tIntrinsic = 0.030, rDrive = 30. Load = 0.02 pF -> delay = 0.030 + 30*0.02*0.001 = 0.0306 ns
    const delayX4 = computeBufferDelay('CLKBUF_X4', 0.02);
    expect(delayX4).toBe(0.0306);
  });

  it('computes latency, skew, and target balance threshold correctly', () => {
    const sinks = [
      { id: 'SINK_1', arrivalTime: 0.220 },
      { id: 'SINK_2', arrivalTime: 0.250 },
      { id: 'SINK_3', arrivalTime: 0.235 },
    ];
    const metrics = computeClockTreeMetrics(sinks, 0.040);
    expect(metrics.minArrival).toBe(0.220);
    expect(metrics.maxArrival).toBe(0.250);
    expect(metrics.latency).toBe(0.250);
    expect(metrics.skew).toBe(0.030);
    expect(metrics.isBalanced).toBe(true); // 0.030 <= 0.040
  });

  it('correctly models setup and hold slack variations from clock skew (STA vs CTS)', () => {
    // Launch at 0.20 ns, Capture at 0.24 ns -> Skew = +0.040 ns (useful skew for setup)
    const resultPositiveSkew = calculateSkewImpact({
      periodNs: 1.0,
      tCqNs: 0.10,
      tCombNs: 0.80,
      tSetupNs: 0.12,
      tHoldNs: 0.05,
      launchArrivalNs: 0.20,
      captureArrivalNs: 0.24,
    });
    // Setup slack = 1.0 - (0.10 + 0.80 + 0.12) + 0.040 = 1.0 - 1.02 + 0.040 = +0.020 ns
    expect(resultPositiveSkew.skew).toBe(0.040);
    expect(resultPositiveSkew.setupSlack).toBe(0.020);
    expect(resultPositiveSkew.setupPassed).toBe(true);

    // Hold slack = (0.10 + 0.80) - 0.05 - 0.040 = 0.90 - 0.09 = 0.81 ns
    expect(resultPositiveSkew.holdSlack).toBe(0.810);
    expect(resultPositiveSkew.holdPassed).toBe(true);
  });

  it('calculates buffer insertion to balance early and late clock branches', () => {
    // Early arrival = 0.100 ns, Late arrival = 0.250 ns. Delta = 0.150 ns. Buffer delay = 0.050 ns.
    const balancing = balanceTwoSinks(0.100, 0.250, 0.050);
    expect(balancing.deltaNs).toBe(0.150);
    expect(balancing.buffersNeeded).toBe(3);
    expect(balancing.balancedArrivalNs).toBe(0.250);
    expect(balancing.residualSkewNs).toBe(0.000);
  });

  it('provides comprehensive clock topology profiles', () => {
    expect(CLOCK_TOPOLOGY_PROFILES['h-tree']).toBeDefined();
    expect(CLOCK_TOPOLOGY_PROFILES['clock-mesh']).toBeDefined();
    expect(CLOCK_TOPOLOGY_PROFILES['balanced-tree']).toBeDefined();
    expect(CLOCK_TOPOLOGY_PROFILES['trunk-spine']).toBeDefined();
  });

  it('computes Manhattan distance correctly', () => {
    expect(computeManhattanDistance({ x: 10, y: 20 }, { x: 50, y: 70 })).toBe(90);
    expect(computeManhattanDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  it('performs hand-calculated Elmore RC path delay verification', () => {
    // Create simple tree: ROOT (0,0) -> SINK_1 (100, 0)
    // Distance = 100 um. Wire R = 100 * 0.05 = 5 Ohms. Wire C = 100 * 0.00015 = 0.015 pF.
    // Sink load = 0.005 pF.
    // Total load at root = wireC (0.015) + sinkCap (0.005) = 0.020 pF.
    // ROOT (CLKBUF_X4): tIntrinsic = 0.030 ns, rDrive = 30 Ohms.
    // Root delay = 0.030 + 30 * 0.020 * 1e-3 = 0.0306 ns.
    // Wire delay = R_wire * (C_wire/2 + C_sink) * 1e-3 = 5 * (0.0075 + 0.005) * 1e-3 = 5 * 0.0125 * 1e-3 = 0.0000625 ns.
    // Expected Arrival at SINK_1 ≈ 0.0306 + 0.0001 = ~0.0307 ns.
    const project = {
      core: { width: 300, height: 300 },
      root: { id: 'ROOT', x: 0, y: 0, cellType: 'CLKBUF_X4' },
      buffers: [],
      sinks: [{ id: 'SINK_1', x: 100, y: 0, loadCapPf: 0.005 }],
      branches: [{ from: 'ROOT', to: 'SINK_1' }],
    };

    const solution = solveClockTreeElmore(project);
    expect(solution.isValid).toBe(true);
    expect(solution.sinks[0].arrivalTime).toBeCloseTo(0.0307, 3);
    expect(solution.metrics.maxLatencyPs).toBeGreaterThan(30);
    expect(solution.metrics.maxLatencyPs).toBeLessThan(35);
  });

  it('demonstrates sensitivity to drive strength and capacitive loading', () => {
    // Tree A with CLKBUF_X1 vs Tree B with CLKBUF_X8 driving heavy 0.040 pF sink
    const projectA = {
      root: { id: 'ROOT', x: 0, y: 0, cellType: 'CLKBUF_X4' },
      buffers: [{ id: 'BUF_A', x: 50, y: 50, cellType: 'CLKBUF_X1' }],
      sinks: [{ id: 'SINK_A', x: 100, y: 50, loadCapPf: 0.040 }],
      branches: [{ from: 'ROOT', to: 'BUF_A' }, { from: 'BUF_A', to: 'SINK_A' }],
    };
    const projectB = {
      root: { id: 'ROOT', x: 0, y: 0, cellType: 'CLKBUF_X4' },
      buffers: [{ id: 'BUF_B', x: 50, y: 50, cellType: 'CLKBUF_X8' }],
      sinks: [{ id: 'SINK_B', x: 100, y: 50, loadCapPf: 0.040 }],
      branches: [{ from: 'ROOT', to: 'BUF_B' }, { from: 'BUF_B', to: 'SINK_B' }],
    };

    const solA = solveClockTreeElmore(projectA);
    const solB = solveClockTreeElmore(projectB);

    // CLKBUF_X8 has lower output impedance (15 Ohms vs 120 Ohms) -> significantly lower delay
    expect(solB.sinks[0].arrivalTime).toBeLessThan(solA.sinks[0].arrivalTime);
  });

  it('detects cycles and fails closed', () => {
    const cyclicProject = {
      root: { id: 'ROOT', x: 0, y: 0 },
      buffers: [
        { id: 'BUF_1', x: 50, y: 50 },
        { id: 'BUF_2', x: 100, y: 50 },
      ],
      sinks: [{ id: 'SINK_1', x: 150, y: 50 }],
      branches: [
        { from: 'ROOT', to: 'BUF_1' },
        { from: 'BUF_1', to: 'BUF_2' },
        { from: 'BUF_2', to: 'BUF_1' }, // Cycle!
        { from: 'BUF_2', to: 'SINK_1' },
      ],
    };
    const sol = solveClockTreeElmore(cyclicProject);
    expect(sol.isValid).toBe(false);
    expect(sol.errors.some((e) => e.includes('Cycle detected'))).toBe(true);
  });

  it('identifies disconnected or orphaned sinks', () => {
    const disconnectedProject = {
      root: { id: 'ROOT', x: 0, y: 0 },
      buffers: [{ id: 'BUF_1', x: 50, y: 50 }],
      sinks: [
        { id: 'SINK_CONNECTED', x: 100, y: 50 },
        { id: 'SINK_ORPHAN', x: 200, y: 200 }, // Disconnected!
      ],
      branches: [
        { from: 'ROOT', to: 'BUF_1' },
        { from: 'BUF_1', to: 'SINK_CONNECTED' },
      ],
    };
    const sol = solveClockTreeElmore(disconnectedProject);
    expect(sol.isValid).toBe(false);
    expect(sol.errors.some((e) => e.includes('not connected to the root'))).toBe(true);
  });

  it('detects buffer fanout and max capacitance violations', () => {
    // One buffer driving 6 sinks (limit for CLKBUF_X1 is 4)
    const overloadProject = {
      root: { id: 'ROOT', x: 0, y: 0 },
      buffers: [{ id: 'BUF_OVERLOAD', x: 50, y: 50, cellType: 'CLKBUF_X1' }],
      sinks: [
        { id: 'S1', x: 60, y: 20, loadCapPf: 0.02 },
        { id: 'S2', x: 60, y: 30, loadCapPf: 0.02 },
        { id: 'S3', x: 60, y: 40, loadCapPf: 0.02 },
        { id: 'S4', x: 60, y: 50, loadCapPf: 0.02 },
        { id: 'S5', x: 60, y: 60, loadCapPf: 0.02 },
      ],
      branches: [
        { from: 'ROOT', to: 'BUF_OVERLOAD' },
        { from: 'BUF_OVERLOAD', to: 'S1' },
        { from: 'BUF_OVERLOAD', to: 'S2' },
        { from: 'BUF_OVERLOAD', to: 'S3' },
        { from: 'BUF_OVERLOAD', to: 'S4' },
        { from: 'BUF_OVERLOAD', to: 'S5' },
      ],
    };
    const sol = solveClockTreeElmore(overloadProject);
    expect(sol.violations.some((v) => v.type === 'MAX_FANOUT')).toBe(true);
    expect(sol.violations.some((v) => v.type === 'MAX_CAPACITANCE')).toBe(true);
  });

  it('detects buffer collisions with macro blockages', () => {
    const blockageProject = {
      root: { id: 'ROOT', x: 0, y: 0 },
      buffers: [{ id: 'BUF_ILLEGAL', x: 120, y: 120 }], // Inside SRAM blockage!
      blockages: [{ id: 'MACRO_SRAM', name: 'SRAM_1', x: 100, y: 100, width: 80, height: 80 }],
      sinks: [{ id: 'S1', x: 250, y: 250 }],
      branches: [
        { from: 'ROOT', to: 'BUF_ILLEGAL' },
        { from: 'BUF_ILLEGAL', to: 'S1' },
      ],
    };
    const sol = solveClockTreeElmore(blockageProject);
    expect(sol.violations.some((v) => v.type === 'BLOCKAGE_COLLISION' || v.type === 'MACRO_OBSTRUCTION')).toBe(true);
  });

  it('proves that user edits to constraints (skew, latency, slew, voltage) directly affect solver metrics and violations', () => {
    const baseProject = {
      core: { width: 400, height: 400 },
      root: { id: 'ROOT', x: 200, y: 50, cellType: 'CLKBUF_X4' },
      buffers: [
        { id: 'BUF_1', x: 200, y: 150, cellType: 'CLKBUF_X2' },
      ],
      sinks: [
        { id: 'S1', x: 150, y: 300, loadCapPf: 0.005 },
        { id: 'S2', x: 250, y: 300, loadCapPf: 0.005 },
      ],
      branches: [
        { from: 'ROOT', to: 'BUF_1' },
        { from: 'BUF_1', to: 'S1' },
        { from: 'BUF_1', to: 'S2' },
      ],
      constraints: {
        maxSkewBudgetPs: 100,
        maxLatencyBudgetPs: 500,
        maxTransitionTimePs: 120,
        supplyVoltageV: 1.0,
        periodNs: 1.0,
      },
    };

    const sol1 = solveClockTreeElmore(baseProject);
    expect(sol1.violations.some((v) => v.type === 'SKEW_BUDGET_EXCEEDED')).toBe(false);
    expect(sol1.violations.some((v) => v.type === 'LATENCY_BUDGET_EXCEEDED')).toBe(false);
    expect(sol1.violations.some((v) => v.type === 'MAX_TRANSITION')).toBe(false);

    // 1. Tighten skew budget to 0 ps -> must trigger SKEW_BUDGET_EXCEEDED if residual skew > 0
    // Or tighten latency budget to 5 ps -> must trigger LATENCY_BUDGET_EXCEEDED
    const tightLatencyProj = {
      ...baseProject,
      constraints: {
        ...baseProject.constraints,
        maxLatencyBudgetPs: 10, // latency is ~60 ps, so 10 ps budget must fail!
      },
    };
    const solTightLatency = solveClockTreeElmore(tightLatencyProj);
    expect(solTightLatency.violations.some((v) => v.type === 'LATENCY_BUDGET_EXCEEDED')).toBe(true);

    // 2. Tighten transition time limit to 5 ps -> must trigger MAX_TRANSITION
    const tightSlewProj = {
      ...baseProject,
      constraints: {
        ...baseProject.constraints,
        maxTransitionTimePs: 5,
      },
    };
    const solTightSlew = solveClockTreeElmore(tightSlewProj);
    expect(solTightSlew.violations.some((v) => v.type === 'MAX_TRANSITION')).toBe(true);

    // 3. Edit voltage from 1.0 V to 1.5 V -> dynamic power must increase by (1.5 / 1.0)^2 = 2.25x
    const highVoltageProj = {
      ...baseProject,
      constraints: {
        ...baseProject.constraints,
        supplyVoltageV: 1.5,
      },
    };
    const solHighVoltage = solveClockTreeElmore(highVoltageProj);
    expect(solHighVoltage.dynamicPowerMw).toBeGreaterThan(sol1.dynamicPowerMw * 2.0);

    // 4. Edit periodNs from 1.0 ns (1 GHz) to 0.5 ns (2 GHz) -> dynamic power must double
    const highFreqProj = {
      ...baseProject,
      constraints: {
        ...baseProject.constraints,
        periodNs: 0.5,
      },
    };
    const solHighFreq = solveClockTreeElmore(highFreqProj);
    expect(solHighFreq.dynamicPowerMw).toBeCloseTo(sol1.dynamicPowerMw * 2.0, 1);
  });

  it('auto-balances a skewed clock tree by transforming the actual project graph', () => {
    // Initial skewed tree: S1 is close (delay ~35 ps), S2 is far through buffer (delay ~85 ps)
    const skewedProject = {
      core: { width: 400, height: 400 },
      root: { id: 'ROOT', x: 100, y: 100, cellType: 'CLKBUF_X4' },
      buffers: [
        { id: 'BUF_LATE', x: 200, y: 100, cellType: 'CLKBUF_X1' },
      ],
      sinks: [
        { id: 'SINK_EARLY', x: 105, y: 100, loadCapPf: 0.003 },
        { id: 'SINK_LATE', x: 300, y: 100, loadCapPf: 0.003 },
      ],
      branches: [
        { from: 'ROOT', to: 'SINK_EARLY' },
        { from: 'ROOT', to: 'BUF_LATE' },
        { from: 'BUF_LATE', to: 'SINK_LATE' },
      ],
      constraints: { skewBudgetPs: 30, maxLatencyBudgetPs: 200 },
    };

    const initialSol = solveClockTreeElmore(skewedProject);
    expect(initialSol.metrics.globalSkewPs).toBeGreaterThan(40);

    const balanceResult = autoBalanceClockTree(skewedProject);
    expect(balanceResult.changesCount).toBeGreaterThan(0);

    // Verify graph was actually modified (new buffer inserted or driver upsized)
    expect(balanceResult.updatedProject.buffers.length).toBeGreaterThan(skewedProject.buffers.length);

    // Verify skew was reduced
    expect(balanceResult.finalMetrics.globalSkewPs).toBeLessThan(initialSol.metrics.globalSkewPs);
  });

  it('models separate max and min data-path delays for accurate setup/hold skew sign analysis', () => {
    // Clock arrivals: Launch = 0.100 ns, Capture = 0.160 ns. Positive Skew = +60 ps.
    // Max data path = 0.700 ns (Setup), Min data path = 0.080 ns (Hold).
    const result = calculateSkewImpact({
      periodNs: 1.0,
      tCqMaxNs: 0.10,
      tCqMinNs: 0.05,
      tCombMaxNs: 0.70, // Long path
      tCombMinNs: 0.08, // Short path
      tSetupNs: 0.08,
      tHoldNs: 0.05,
      launchArrivalNs: 0.100,
      captureArrivalNs: 0.160,
    });

    expect(result.skew).toBe(0.060); // +60 ps
    // Setup Slack = 1.0 - (0.10 + 0.70 + 0.08) + 0.060 = 1.0 - 0.88 + 0.060 = +0.180 ns (Setup passes)
    expect(result.setupSlack).toBe(0.180);
    expect(result.setupPassed).toBe(true);

    // Hold Slack = (0.05 + 0.08) - 0.05 - 0.060 = 0.13 - 0.11 = +0.020 ns
    // If skew were +90 ps, hold would fail!
    expect(result.holdSlack).toBe(0.020);
    expect(result.holdPassed).toBe(true);

    // Test with excessive positive skew causing authentic hold violation
    const resultHoldViolation = calculateSkewImpact({
      periodNs: 1.0,
      tCqMaxNs: 0.10,
      tCqMinNs: 0.05,
      tCombMaxNs: 0.70,
      tCombMinNs: 0.08,
      tSetupNs: 0.08,
      tHoldNs: 0.05,
      launchArrivalNs: 0.100,
      captureArrivalNs: 0.200, // +100 ps skew
    });
    // Hold Slack = 0.13 - 0.05 - 0.100 = -0.020 ns (HOLD FAILS!)
    expect(resultHoldViolation.holdSlack).toBe(-0.020);
    expect(resultHoldViolation.holdPassed).toBe(false);
  });
});
