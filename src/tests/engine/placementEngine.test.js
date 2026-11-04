import { describe, it, expect } from 'vitest';
import {
  computeTotalHPWL,
  checkSiteAlignment,
  checkCellOverlaps,
  computeCongestionHeatmap,
  DEFAULT_ROW_CONFIG,
} from '../../engine/placementEngine.js';

describe('Standard Cell Placement Engine', () => {
  it('computes Half-Perimeter Wirelength (HPWL) for bounding boxes', () => {
    const nets = [
      {
        netId: 'NET_1',
        pins: [
          { x: 10, y: 20 },
          { x: 50, y: 80 },
        ],
      },
    ];
    // HPWL = (50 - 10) + (80 - 20) = 40 + 60 = 100
    const res = computeTotalHPWL(nets);
    expect(res.totalHPWL).toBe(100);
    expect(res.unweightedHPWL).toBe(100);
  });

  it('mathematically applies net weights to timing-critical nets', () => {
    const nets = [
      {
        netId: 'NET_CRITICAL',
        weight: 3.5,
        pins: [
          { x: 10, y: 10 },
          { x: 30, y: 30 }, // Unweighted HPWL = 20 + 20 = 40
        ],
      },
      {
        netId: 'NET_NORMAL',
        weight: 1.0,
        pins: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }, // Unweighted HPWL = 10 + 10 = 20
        ],
      },
    ];
    const res = computeTotalHPWL(nets);
    // Unweighted = 40 + 20 = 60
    expect(res.unweightedHPWL).toBe(60);
    // Weighted = (40 * 3.5) + (20 * 1.0) = 140 + 20 = 160
    expect(res.totalHPWL).toBe(160);
    expect(res.netDetails[0].weightedHpwl).toBe(140);
  });

  it('validates standard cell row alignment, site grid snapping, and core boundaries', () => {
    // Legal cell: y = 80 (Row 2, 2 * 40), x = 40 (multiple of siteWidth 10)
    const legalCell = { x: 40, y: 80, width: 30, height: 40 };
    expect(checkSiteAlignment(legalCell, DEFAULT_ROW_CONFIG).isAligned).toBe(true);

    // Illegal cell: y = 55 (not aligned to row boundary 40)
    const offRowCell = { x: 40, y: 55, width: 30, height: 40 };
    expect(checkSiteAlignment(offRowCell, DEFAULT_ROW_CONFIG).isAligned).toBe(false);

    // Illegal cell: x = 43 (not on site pitch grid of 10)
    const offPitchCell = { x: 43, y: 80, width: 30, height: 40 };
    expect(checkSiteAlignment(offPitchCell, DEFAULT_ROW_CONFIG).isAligned).toBe(false);

    // Illegal cell: extends beyond core width
    const outOfWidthCell = { x: 390, y: 80, width: 30, height: 40 };
    expect(checkSiteAlignment(outOfWidthCell, DEFAULT_ROW_CONFIG).isAligned).toBe(false);

    // Illegal cell: extends beyond core height
    const outOfHeightCell = { x: 40, y: 320, width: 30, height: 40 };
    expect(checkSiteAlignment(outOfHeightCell, DEFAULT_ROW_CONFIG).isAligned).toBe(false);

    // Illegal cell: negative coordinates
    const negativeCell = { x: -10, y: 40, width: 30, height: 40 };
    expect(checkSiteAlignment(negativeCell, DEFAULT_ROW_CONFIG).isAligned).toBe(false);
  });

  it('detects standard cell overlaps on the same row site', () => {
    const cells = [
      { id: 'CELL_A', x: 20, y: 40, width: 40, height: 40 },
      { id: 'CELL_B', x: 50, y: 40, width: 30, height: 40 }, // Overlaps with A (20..60 vs 50..80)
      { id: 'CELL_C', x: 90, y: 40, width: 30, height: 40 }, // Clean
    ];
    const check = checkCellOverlaps(cells);
    expect(check.hasOverlap).toBe(true);
    expect(check.collidingPairs).toEqual([['CELL_A', 'CELL_B']]);
  });

  it('evaluates 2D routing congestion density across GCells with bounding-box demand traversal', () => {
    const nets = [
      { netId: 'N1', pins: [{ x: 50, y: 50 }, { x: 250, y: 250 }] }, // Traverses multiple bins
    ];
    const map = computeCongestionHeatmap({
      gridRows: 4,
      gridCols: 4,
      coreWidth: 400,
      coreHeight: 320,
      nets,
      binCapacity: 2,
    });
    expect(map.binMatrix).toHaveLength(4);
    expect(map.binMatrix[0]).toHaveLength(4);
    expect(map.maxCongestion).toBeGreaterThan(0);
    // Bins along the route receive routing demand
    expect(map.binMatrix[0][0]).toBeGreaterThanOrEqual(0.5);
    expect(map.binMatrix[3][2]).toBeGreaterThanOrEqual(0.5);
  });
});
