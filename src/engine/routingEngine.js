/**
 * routingEngine.js
 * ================
 * Pure, deterministic ASIC Routing engine.
 *
 * Core physical design concepts:
 * 1. Multilayer Metal Stack (M1-M6) with alternating preferred routing directions (H / V).
 * 2. Vias: Vertical inter-layer transitions (Via1: M1-M2, Via2: M2-M3, etc.) with via resistance.
 * 3. Short & Open Circuit Detection: DRC verification of interconnect integrity.
 * 4. Signal Integrity (SI): Coupling capacitance (Cc = k * L_parallel / Spacing) and crosstalk noise bump (dV = Vdd * Cc / Ctotal).
 * 5. Grid Graph Maze Routing (Lee / BFS shortest path on routing track grid).
 */

export const METAL_LAYERS = {
  M1: { name: 'M1', direction: 'H', pitchUm: 0.14, rSheetOhm: 0.18, cUnitFf: 0.20 },
  M2: { name: 'M2', direction: 'V', pitchUm: 0.14, rSheetOhm: 0.15, cUnitFf: 0.18 },
  M3: { name: 'M3', direction: 'H', pitchUm: 0.28, rSheetOhm: 0.08, cUnitFf: 0.15 },
  M4: { name: 'M4', direction: 'V', pitchUm: 0.28, rSheetOhm: 0.05, cUnitFf: 0.12 },
  M5: { name: 'M5', direction: 'H', pitchUm: 0.56, rSheetOhm: 0.02, cUnitFf: 0.08 },
  M6: { name: 'M6', direction: 'V', pitchUm: 0.56, rSheetOhm: 0.01, cUnitFf: 0.05 },
};

export const VIA_RESISTANCE_OHM = {
  VIA1: 5.0, // M1-M2
  VIA2: 4.0, // M2-M3
  VIA3: 3.0, // M3-M4
  VIA4: 2.0, // M4-M5
  VIA5: 1.0, // M5-M6
};

/**
 * Compute coupling capacitance between two parallel routing wires.
 * Cc = k * (L_parallel / Spacing)
 *
 * @param {number} parallelLengthUm - Overlap length in micrometers
 * @param {number} spacingUm - Center-to-center spacing in micrometers
 * @param {number} kCoeff - Dielectric coupling coefficient (default 0.04 fF)
 * @returns {number} Coupling capacitance in fF (femtofarads)
 */
export function computeCouplingCapacitance(parallelLengthUm, spacingUm, kCoeff = 0.04) {
  if (spacingUm <= 0) return 0;
  const cc = (kCoeff * parallelLengthUm) / spacingUm;
  return Number(cc.toFixed(3));
}

/**
 * Compute crosstalk noise voltage glitch induced on victim net by aggressor switching.
 * Delta_V = V_aggressor * [ Cc / (Cc + C_ground) ]
 *
 * @param {number} ccFf - Coupling capacitance between aggressor and victim (fF)
 * @param {number} cGroundFf - Victim net ground capacitance (fF)
 * @param {number} vSupply - Supply voltage Vdd (default 1.0 V)
 * @returns {{ noiseGlitchV: number, noiseRatio: number, isGlitchCritical: boolean }}
 */
export function computeCrosstalkGlitch(ccFf, cGroundFf, vSupply = 1.0) {
  const cTotal = ccFf + cGroundFf;
  if (cTotal <= 0) {
    return { noiseGlitchV: 0, noiseRatio: 0, isGlitchCritical: false };
  }
  const noiseRatio = ccFf / cTotal;
  const noiseGlitchV = Number((vSupply * noiseRatio).toFixed(3));
  // Critical if glitch exceeds 25% of Vdd (0.25 V)
  const isGlitchCritical = noiseGlitchV >= 0.25 * vSupply;

  return {
    noiseGlitchV,
    noiseRatio: Number(noiseRatio.toFixed(3)),
    isGlitchCritical,
  };
}

/**
 * Check a list of routed point-to-point wires for DRC shorts on the same metal layer.
 *
 * @param {Array<{netId: string, layer: string, x1: number, y1: number, x2: number, y2: number}>} segments
 * @returns {{ hasShort: boolean, shortPairs: Array<string> }}
 */
export function checkRoutingShorts(segments) {
  if (!Array.isArray(segments) || segments.length < 2) {
    return { hasShort: false, shortPairs: [] };
  }

  const shortPairs = [];

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const s1 = segments[i];
      const s2 = segments[j];

      // Only segments on the SAME metal layer with DIFFERENT net IDs can short!
      if (s1.layer === s2.layer && s1.netId !== s2.netId) {
        const minX1 = Math.min(s1.x1, s1.x2);
        const maxX1 = Math.max(s1.x1, s1.x2);
        const minY1 = Math.min(s1.y1, s1.y2);
        const maxY1 = Math.max(s1.y1, s1.y2);

        const minX2 = Math.min(s2.x1, s2.x2);
        const maxX2 = Math.max(s2.x1, s2.x2);
        const minY2 = Math.min(s2.y1, s2.y2);
        const maxY2 = Math.max(s2.y1, s2.y2);

        // Bounding boxes intersect
        const isIntersecting = (minX1 <= maxX2 && maxX1 >= minX2) && (minY1 <= maxY2 && maxY1 >= minY2);
        if (isIntersecting) {
          shortPairs.push(`${s1.netId} & ${s2.netId} on ${s1.layer}`);
        }
      }
    }
  }

  return {
    hasShort: shortPairs.length > 0,
    shortPairs,
  };
}

/**
 * Breadth-First-Search (BFS) / Lee's algorithm 2D grid pathfinder.
 *
 * @param {{x: number, y: number}} start
 * @param {{x: number, y: number}} target
 * @param {Array<{x: number, y: number}>} obstacles
 * @param {number} width - grid width (columns)
 * @param {number} height - grid height (rows)
 * @returns {{ path: Array<{x: number, y: number}>|null, length: number, success: boolean }}
 */
export function solveMaze2D(start, target, obstacles = [], width = 10, height = 10) {
  const isObstacle = (x, y) => obstacles.some((obs) => obs.x === x && obs.y === y);

  const queue = [{ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] }];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.x === target.x && current.y === target.y) {
      return {
        path: current.path,
        length: current.path.length - 1,
        success: true,
      };
    }

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const key = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(key) && !isObstacle(nx, ny)) {
        visited.add(key);
        queue.push({
          x: nx,
          y: ny,
          path: [...current.path, { x: nx, y: ny }],
        });
      }
    }
  }

  return { path: null, length: Infinity, success: false };
}
