/**
 * floorplanCongestion.js
 * =======================
 * Educational routability proxy using bin-based demand estimation.
 * NOT a replacement for commercial global routing.
 *
 * Demand is estimated from net bounding boxes (HPWL demand) and macro keepouts.
 * Capacity is derived from modeled metal routing tracks per bin.
 *
 * All coordinates in micrometers (µm).
 */

/**
 * Compute 2D routing congestion heatmap over the core area.
 *
 * @param {Object} project - FloorplanProject
 * @param {number} binCountX - Number of horizontal bins (default: 8)
 * @param {number} binCountY - Number of vertical bins (default: 8)
 */
export function computeCongestionMap(project, binCountX = 8, binCountY = 8) {
  const core = project?.core || { x: 40, y: 40, width: 320, height: 240 };
  const macros = project?.macros || [];
  const pins = project?.pins || [];
  const nets = project?.nets || [];

  const safeBinX = Math.max(2, binCountX);
  const safeBinY = Math.max(2, binCountY);

  const binW = core.width / safeBinX;
  const binH = core.height / safeBinY;

  // Track capacity model: 4 routing layers with 0.2µm pitch
  // Capacity = (binW / 0.2) * 2 (horizontal) + (binH / 0.2) * 2 (vertical)
  const baseCapacity = Math.round(((binW / 0.2) * 2) + ((binH / 0.2) * 2));

  // Initialize 2D grid
  const bins = [];
  for (let r = 0; r < safeBinY; r++) {
    const row = [];
    for (let c = 0; c < safeBinX; c++) {
      const bx = core.x + c * binW;
      const by = core.y + r * binH;
      row.push({
        row: r,
        col: c,
        x: Number(bx.toFixed(2)),
        y: Number(by.toFixed(2)),
        width: Number(binW.toFixed(2)),
        height: Number(binH.toFixed(2)),
        demand: 0,
        capacity: baseCapacity,
        ratio: 0,
      });
    }
    bins.push(row);
  }

  // 1. Demand from macros: macros reduce capacity in lower metal layers or block routing
  macros.forEach((m) => {
    for (let r = 0; r < safeBinY; r++) {
      for (let c = 0; c < safeBinX; c++) {
        const bin = bins[r][c];
        const overlapX = Math.max(0, Math.min(bin.x + bin.width, m.x + m.width) - Math.max(bin.x, m.x));
        const overlapY = Math.max(0, Math.min(bin.y + bin.height, m.y + m.height) - Math.max(bin.y, m.y));
        if (overlapX > 0 && overlapY > 0) {
          // Macro obstruction adds routing pressure around its perimeter
          const overlapArea = overlapX * overlapY;
          const binArea = bin.width * bin.height;
          const blockedFraction = overlapArea / binArea;
          bin.demand += Math.round(baseCapacity * blockedFraction * 0.45);
        }
      }
    }
  });

  // 2. Demand from nets: HPWL bounding box contributes wire demand to all traversed bins
  const macroMap = new Map(macros.map((m) => [m.id, m]));
  const pinMap = new Map(pins.map((p) => [p.id, p]));

  const getNodeCoord = (nodeId) => {
    if (macroMap.has(nodeId)) {
      const m = macroMap.get(nodeId);
      return { x: m.x + m.width / 2, y: m.y + m.height / 2 };
    }
    if (pinMap.has(nodeId)) {
      const p = pinMap.get(nodeId);
      let px = core.x, py = core.y;
      if (p.edge === 'top') { px += p.coord; }
      else if (p.edge === 'bottom') { px += p.coord; py += core.height; }
      else if (p.edge === 'left') { py += p.coord; }
      else if (p.edge === 'right') { px += core.width; py += p.coord; }
      return { x: px, y: py };
    }
    return null;
  };

  nets.forEach((net) => {
    const nodes = [...(net.sources || []), ...(net.sinks || [])];
    const coords = nodes.map(getNodeCoord).filter(Boolean);
    if (coords.length < 2) return;

    const minX = Math.min(...coords.map((c) => c.x));
    const maxX = Math.max(...coords.map((c) => c.x));
    const minY = Math.min(...coords.map((c) => c.y));
    const maxY = Math.max(...coords.map((c) => c.y));

    // Determine which bins fall inside this bounding box
    for (let r = 0; r < safeBinY; r++) {
      for (let c = 0; c < safeBinX; c++) {
        const bin = bins[r][c];
        const touches = bin.x + bin.width >= minX && bin.x <= maxX &&
                        bin.y + bin.height >= minY && bin.y <= maxY;
        if (touches) {
          bin.demand += 12; // Each signal net through bin adds wire routing demand
        }
      }
    }
  });

  // Calculate ratios and find hotspots
  let maxRatio = 0;
  const hotspots = [];

  for (let r = 0; r < safeBinY; r++) {
    for (let c = 0; c < safeBinX; c++) {
      const bin = bins[r][c];
      const ratio = Number((bin.demand / bin.capacity).toFixed(3));
      bin.ratio = ratio;
      if (ratio > maxRatio) maxRatio = ratio;
      if (ratio >= 0.8) {
        hotspots.push({
          row: r,
          col: c,
          ratio,
          x: bin.x,
          y: bin.y,
          level: getCongestionLevel(ratio),
        });
      }
    }
  }

  return {
    bins,
    binCountX: safeBinX,
    binCountY: safeBinY,
    maxRatio: Number(maxRatio.toFixed(3)),
    hotspots,
    educationalNote: 'Congestion heatmap is an analytical routing demand proxy based on net bounding-box density and macro keepouts.',
  };
}

/**
 * Return CSS color representation for a congestion ratio.
 */
export function getCongestionColor(ratio) {
  if (ratio < 0.5) return 'rgba(74, 222, 128, 0.2)'; // Nominal green
  if (ratio < 0.75) return 'rgba(250, 204, 21, 0.35)'; // Moderate yellow
  if (ratio < 0.9) return 'rgba(251, 146, 60, 0.5)'; // High orange
  return 'rgba(239, 68, 68, 0.65)'; // Critical red
}

/**
 * Return human-readable congestion severity level.
 */
export function getCongestionLevel(ratio) {
  if (ratio < 0.5) return 'low';
  if (ratio < 0.75) return 'moderate';
  if (ratio < 0.9) return 'high';
  return 'critical';
}
