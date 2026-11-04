import { describe, it, expect } from 'vitest';
import {
  computeBufferDelay,
  computeClockTreeMetrics,
  calculateSkewImpact,
  balanceTwoSinks,
  CLOCK_TOPOLOGY_PROFILES,
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
});
