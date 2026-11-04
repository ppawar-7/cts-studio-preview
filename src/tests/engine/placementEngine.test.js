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
  });

  it('validates standard cell row alignment and site grid snapping', () => {
    // Legal cell: y = 80 (Row 2, 2 * 40), x = 40 (multiple of siteWidth 10)
    const legalCell = { x: 40, y: 80, width: 30, height: 40 };
    expect(checkSiteAlignment(legalCell, DEFAULT_ROW_CONFIG).isAligned).toBe(true);

    // Illegal cell: y = 55 (not aligned to row boundary 40)
    const offRowCell = { x: 40, y: 55, width: 30, height: 40 };
    expect(checkSiteAlignment(offRowCell, DEFAULT_ROW_CONFIG).isAligned).toBe(false);

    // Illegal cell: x = 43 (not on site pitch grid of 10)
    const offPitchCell = { x: 43, y: 80, width: 30, height: 40 };
    expect(checkSiteAlignment(offPitchCell, DEFAULT_ROW_CONFIG).isAligned).toBe(false);
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

  it('evaluates 2D routing congestion density across GCells', () => {
    const nets = [
      { netId: 'N1', pins: [{ x: 50, y: 50 }, { x: 60, y: 60 }] },
      { netId: 'N2', pins: [{ x: 55, y: 55 }, { x: 70, y: 70 }] },
      { netId: 'N3', pins: [{ x: 65, y: 65 }, { x: 75, y: 75 }] },
    ];
    const map = computeCongestionHeatmap({
      gridRows: 4,
      gridCols: 4,
      coreWidth: 400,
      coreHeight: 320,
      nets,
      binCapacity: 4,
    });
    expect(map.binMatrix).toHaveLength(4);
    expect(map.binMatrix[0]).toHaveLength(4);
    expect(map.maxCongestion).toBeGreaterThan(0);
  });
});
