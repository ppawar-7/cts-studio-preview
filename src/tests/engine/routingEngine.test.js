import { describe, it, expect } from 'vitest';
import {
  computeCouplingCapacitance,
  computeCrosstalkGlitch,
  checkRoutingShorts,
  solveMaze2D,
  computeWireResistance,
  computeElmoreWireDelay,
  METAL_LAYERS,
  VIA_RESISTANCE_OHM,
} from '../../engine/routingEngine.js';

describe('Routing Engine', () => {
  it('computes wire resistance from sheet resistance and dimensions', () => {
    // M1 has rSheet = 0.18 Ohm/sq, width = 0.07 um. Length = 70 um -> 1000 squares -> R = 180 Ohm
    const rM1 = computeWireResistance('M1', 70, 0.07);
    expect(rM1).toBe(180.0);

    // M3 has rSheet = 0.08 Ohm/sq, width = 0.14 um. Length = 140 um -> 1000 squares -> R = 80 Ohm
    const rM3 = computeWireResistance('M3', 140, 0.14);
    expect(rM3).toBe(80.0);
  });

  it('computes distributed Elmore delay for an interconnect wire', () => {
    // R = 100 Ohm, Cwire = 0.010 pF (10 fF), Cload = 0.005 pF (5 fF)
    // T_elmore = 100 * (0.5 * 0.010 + 0.005) = 100 * 0.010 = 1.00 ps
    const delay = computeElmoreWireDelay(100, 0.010, 0.005);
    expect(delay).toBe(1.00);
  });

  it('computes coupling capacitance and crosstalk glitch voltage correctly', () => {
    // 100 um parallel run, 0.20 um spacing -> Cc = 0.04 * (100 / 0.20) = 20.0 fF
    const cc = computeCouplingCapacitance(100, 0.20, 0.04);
    expect(cc).toBe(20.0);

    // Victim Cground = 60.0 fF, Vdd = 1.0V. Total C = 80.0 fF. Glitch = 1.0 * (20 / 80) = 0.25 V
    const glitch = computeCrosstalkGlitch(20.0, 60.0, 1.0);
    expect(glitch.noiseGlitchV).toBe(0.250);
    expect(glitch.noiseRatio).toBe(0.250);
    expect(glitch.isGlitchCritical).toBe(true);
  });

  it('detects electrical shorts when two distinct nets intersect on the same metal layer', () => {
    const segmentsWithShort = [
      { netId: 'NET_A', layer: 'M2', x1: 50, y1: 20, x2: 50, y2: 180 }, // Vertical on M2
      { netId: 'NET_B', layer: 'M2', x1: 20, y1: 100, x2: 120, y2: 100 }, // Crosses NET_A on M2!
    ];
    const shortCheck = checkRoutingShorts(segmentsWithShort);
    expect(shortCheck.hasShort).toBe(true);
    expect(shortCheck.shortPairs.length).toBeGreaterThan(0);

    // If NET_B is on M3 (different layer with a via), no short occurs!
    const segmentsDifferentLayers = [
      { netId: 'NET_A', layer: 'M2', x1: 50, y1: 20, x2: 50, y2: 180 },
      { netId: 'NET_B', layer: 'M3', x1: 20, y1: 100, x2: 120, y2: 100 },
    ];
    const noShortCheck = checkRoutingShorts(segmentsDifferentLayers);
    expect(noShortCheck.hasShort).toBe(false);
  });

  it('detects spacing violations when minSpacing > 0 is enforced', () => {
    // Two parallel wires on M1 separated by 5 units
    const segmentsParallel = [
      { netId: 'N1', layer: 'M1', x1: 10, y1: 20, x2: 100, y2: 20 },
      { netId: 'N2', layer: 'M1', x1: 10, y1: 25, x2: 100, y2: 25 },
    ];
    // No direct intersection
    expect(checkRoutingShorts(segmentsParallel, 0).hasShort).toBe(false);
    // Violates minSpacing of 6 units
    expect(checkRoutingShorts(segmentsParallel, 6).hasShort).toBe(true);
  });

  it('solves 2D grid maze routing with obstacle avoidance using BFS', () => {
    const start = { x: 0, y: 0 };
    const target = { x: 2, y: 2 };
    // Obstacle blocks direct diagonal path
    const obstacles = [{ x: 1, y: 0 }, { x: 1, y: 1 }];
    const res = solveMaze2D(start, target, obstacles, 5, 5);
    expect(res.success).toBe(true);
    expect(res.length).toBe(4); // Down to (0,2), then right to (2,2)
    expect(res.path[0]).toEqual(start);
    expect(res.path[res.path.length - 1]).toEqual(target);
  });

  it('defines metal layer properties with alternating preferred routing directions', () => {
    expect(METAL_LAYERS.M1.direction).toBe('H');
    expect(METAL_LAYERS.M2.direction).toBe('V');
    expect(METAL_LAYERS.M3.direction).toBe('H');
    expect(METAL_LAYERS.M4.direction).toBe('V');
    expect(VIA_RESISTANCE_OHM.VIA1).toBe(5.0);
  });
});
