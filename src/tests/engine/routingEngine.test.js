import { describe, it, expect } from 'vitest';
import {
  computeCouplingCapacitance,
  computeCrosstalkGlitch,
  checkRoutingShorts,
  solveMaze2D,
  METAL_LAYERS,
  VIA_RESISTANCE_OHM,
} from '../../engine/routingEngine.js';

describe('Routing Engine', () => {
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
