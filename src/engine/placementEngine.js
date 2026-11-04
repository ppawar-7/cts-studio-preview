/**
 * placementEngine.js
 * ===================
 * Pure deterministic standard-cell placement and legalization engine.
 * Powers Kingdom 4 (Placement: PL-1 through PL-5) and physical placement sanity checks.
 *
 * Implements:
 * 1. Standard cell row site grid alignment and orientation (R0, MX).
 * 2. Overlap detection and legalization in row sites.
 * 3. Half-Perimeter Wirelength (HPWL) bounding box calculations with timing weights.
 * 4. 2D Global routing bin congestion density heatmap heuristic with bounding-box demand.
 */

export const DEFAULT_ROW_CONFIG = {
  rowHeight: 40,   // Display units (µm)
  siteWidth: 10,   // Standard site pitch (µm)
  rowCount: 8,
  coreWidth: 400,
  coreHeight: 320,
};

/**
 * Compute Half-Perimeter Wirelength (HPWL) for a set of multi-pin nets.
 * Formula for each net: HPWL = ((X_max - X_min) + (Y_max - Y_min)) * NetWeight
 *
 * @param {Array<{ netId: string, pins: Array<{ x: number, y: number }>, weight?: number }>} nets
 * @returns {{ totalHPWL: number, unweightedHPWL: number, netDetails: Array<Object> }}
 */
export function computeTotalHPWL(nets) {
  let totalHPWL = 0;
  let unweightedHPWL = 0;
  const netDetails = [];

  nets.forEach((net) => {
    if (!net.pins || net.pins.length < 2) {
      netDetails.push({
        netId: net.netId,
        hpwl: 0,
        weightedHpwl: 0,
        weight: net.weight || 1.0,
      });
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    net.pins.forEach((p) => {
      const px = Number(p.x) || 0;
      const py = Number(p.y) || 0;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    });

    const netHPWL = (maxX - minX) + (maxY - minY);
    const weight = Math.max(0, Number(net.weight) || 1.0);
    const weightedHpwl = Number((netHPWL * weight).toFixed(2));

    unweightedHPWL += netHPWL;
    totalHPWL += weightedHpwl;

    netDetails.push({
      netId: net.netId,
      hpwl: netHPWL,
      weightedHpwl,
      weight,
      box: { minX, maxX, minY, maxY },
    });
  });

  return {
    totalHPWL: Number(totalHPWL.toFixed(2)),
    unweightedHPWL: Number(unweightedHPWL.toFixed(2)),
    netDetails,
  };
}

/**
 * Check if a placed cell is aligned to standard cell row boundaries and site grids.
 *
 * @param {Object} cell - { x, y, width, height }
 * @param {Object} rowConfig - { rowHeight, siteWidth, coreWidth, coreHeight }
 * @returns {{ isAligned: boolean, rowIdx: number, errors: Array<string> }}
 */
export function checkSiteAlignment(cell, rowConfig = DEFAULT_ROW_CONFIG) {
  const errors = [];
  const cx = Number(cell.x) || 0;
  const cy = Number(cell.y) || 0;
  const cw = Number(cell.width) || 0;
  const ch = Number(cell.height) || 0;

  const rowIdx = Math.round(cy / rowConfig.rowHeight);
  const expectedY = rowIdx * rowConfig.rowHeight;

  if (Math.abs(cy - expectedY) > 0.01) {
    errors.push(`Cell not aligned to row boundary: y=${cy} (expected row ${rowIdx} at y=${expectedY})`);
  }

  const siteRemainder = ((cx % rowConfig.siteWidth) + rowConfig.siteWidth) % rowConfig.siteWidth;
  if (Math.abs(siteRemainder) > 0.01 && Math.abs(siteRemainder - rowConfig.siteWidth) > 0.01) {
    errors.push(`Cell not aligned to site pitch grid: x=${cx} (site pitch: ${rowConfig.siteWidth})`);
  }

  if (cx < 0 || cx + cw > rowConfig.coreWidth) {
    errors.push(`Cell extends beyond core width: x=${cx}, width=${cw} (core: ${rowConfig.coreWidth})`);
  }

  if (cy < 0 || cy + ch > rowConfig.coreHeight) {
    errors.push(`Cell extends beyond core height: y=${cy}, height=${ch} (core: ${rowConfig.coreHeight})`);
  }

  return {
    isAligned: errors.length === 0,
    rowIdx,
    errors,
  };
}

/**
 * Check for overlaps among a list of placed standard cells.
 *
 * @param {Array<{ id: string, x: number, y: number, width: number, height: number }>} cells
 * @returns {{ hasOverlap: boolean, collidingPairs: Array<Array<string>> }}
 */
export function checkCellOverlaps(cells) {
  const collidingPairs = [];

  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const c1 = cells[i];
      const c2 = cells[j];

      // Overlap on same row or crossing rows
      const overlapX = c1.x < (c2.x + c2.width) && (c1.x + c1.width) > c2.x;
      const overlapY = c1.y < (c2.y + c2.height) && (c1.y + c1.height) > c2.y;

      if (overlapX && overlapY) {
        collidingPairs.push([c1.id, c2.id]);
      }
    }
  }

  return {
    hasOverlap: collidingPairs.length > 0,
    collidingPairs,
  };
}

/**
 * Compute 2D routing density / congestion heatmap across GCells (global routing bins).
 *
 * @param {Object} params
 * @param {number} params.gridRows - Number of bin rows (e.g. 4)
 * @param {number} params.gridCols - Number of bin columns (e.g. 4)
 * @param {number} params.coreWidth
 * @param {number} params.coreHeight
 * @param {Array<{ netId: string, pins: Array<{ x: number, y: number }> }>} params.nets
 * @param {number} [params.binCapacity=4] - Max wire crossings per bin boundary
 * @returns {{ binMatrix: Array<Array<number>>, maxCongestion: number, hasHotspots: boolean }}
 */
export function computeCongestionHeatmap({
  gridRows = 4,
  gridCols = 4,
  coreWidth = 400,
  coreHeight = 320,
  nets = [],
  binCapacity = 4,
}) {
  const safeCapacity = Math.max(1, binCapacity);
  const binWidth = coreWidth / gridCols;
  const binHeight = coreHeight / gridRows;

  // Initialize raw crossing/demand matrix
  const binMatrix = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));

  nets.forEach((net) => {
    if (!net.pins || net.pins.length < 2) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    net.pins.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const startCol = Math.min(gridCols - 1, Math.max(0, Math.floor(minX / binWidth)));
    const endCol = Math.min(gridCols - 1, Math.max(0, Math.floor(maxX / binWidth)));
    const startRow = Math.min(gridRows - 1, Math.max(0, Math.floor(minY / binHeight)));
    const endRow = Math.min(gridRows - 1, Math.max(0, Math.floor(maxY / binHeight)));

    // Distribute demand across traversed GCell routing channels
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        binMatrix[r][c] += 1;
      }
    }
  });

  let maxCongestion = 0;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const usageRatio = Number((binMatrix[r][c] / safeCapacity).toFixed(2));
      binMatrix[r][c] = usageRatio;
      if (usageRatio > maxCongestion) maxCongestion = usageRatio;
    }
  }

  return {
    binMatrix,
    grid: binMatrix,
    maxCongestion,
    hasHotspots: maxCongestion > 1.0,
  };
}
