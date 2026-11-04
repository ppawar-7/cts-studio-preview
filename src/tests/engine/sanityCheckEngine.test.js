import { describe, it, expect } from 'vitest';
import { evaluateSanityCheck } from '../../engine/sanityCheckEngine.js';

describe('Sanity Check Engine', () => {
  it('evaluates floorplanning DRC and connectivity checks', () => {
    const res = evaluateSanityCheck('fp-drc', { margin: 25.0 });
    expect(res.passed).toBe(true);
    expect(res.logOutput).toContain('[DRC-FP] Core Boundary Margin: 25.0 µm -> PASSED');

    const resFail = evaluateSanityCheck('fp-drc', { margin: 10.0 });
    expect(resFail.passed).toBe(false);
  });

  it('evaluates placement legality and congestion checks', () => {
    const resLegality = evaluateSanityCheck('pl-legality');
    expect(resLegality.passed).toBe(true);

    const resCongestion = evaluateSanityCheck('pl-congestion', { peakRatio: 0.75 });
    expect(resCongestion.passed).toBe(true);
  });

  it('evaluates CTS reports and skew balancing', () => {
    const resCts = evaluateSanityCheck('cts-clock-tree-report', {
      sinks: [
        { id: 'FF1', arrivalTime: 0.200 },
        { id: 'FF2', arrivalTime: 0.215 },
      ],
    });
    expect(resCts.passed).toBe(true);
    expect(resCts.metrics.skewPs).toBe(15);
  });

  it('evaluates Routing LVS and shorts check', () => {
    const resLvs = evaluateSanityCheck('rt-lvs', {
      segments: [
        { netId: 'NET_1', layer: 'M1', x1: 20, y1: 60, x2: 160, y2: 60 },
        { netId: 'NET_2', layer: 'M2', x1: 90, y1: 20, x2: 90, y2: 140 },
      ],
    });
    expect(resLvs.passed).toBe(true);
  });

  it('evaluates Filler Cells continuity and CMP density', () => {
    const resFc = evaluateSanityCheck('fc-drc', { cells: [{ widthSites: 100 }] });
    expect(resFc.passed).toBe(true);

    const resCmp = evaluateSanityCheck('fc-qor');
    expect(resCmp.passed).toBe(true);
  });
});
