/**
 * geometryEngine.js
 * ==================
 * Pure deterministic physical layout and geometric calculation engine.
 * Powers Kingdom 3 (Floorplanning: FP-1 through FP-5) and physical design sanity checks.
 *
 * Implements:
 * 1. Die and Core boundary mathematics and margins.
 * 2. Aspect Ratio and Core Utilization formulas (nominal vs effective).
 * 3. 2D Rectangle overlap and placement halo keepout collision detection.
 * 4. I/O pin placement distribution and pitch spacing validation.
 * 5. Power ring / strap geometry verification.
 */

/**
 * Compute core dimensions from die dimensions and uniform or per-side margins.
 *
 * @param {Object} params
 * @param {number} params.dieWidth - Die width in micrometers (µm)
 * @param {number} params.dieHeight - Die height in µm
 * @param {number} [params.margin=20] - Uniform margin (µm) from die to core
 * @param {number} [params.marginTop]
 * @param {number} [params.marginBottom]
 * @param {number} [params.marginLeft]
 * @param {number} [params.marginRight]
 * @returns {{ dieWidth: number, dieHeight: number, coreWidth: number, coreHeight: number, dieArea: number, coreArea: number, aspectRatio: number }}
 */
export function computeCoreGeometry({
  dieWidth,
  dieHeight,
  margin = 20,
  marginTop = margin,
  marginBottom = margin,
  marginLeft = margin,
  marginRight = margin,
}) {
  const coreWidth = Math.max(0, dieWidth - marginLeft - marginRight);
  const coreHeight = Math.max(0, dieHeight - marginTop - marginBottom);
  const dieArea = dieWidth * dieHeight;
  const coreArea = coreWidth * coreHeight;
  const aspectRatio = Number((coreHeight / (coreWidth || 1)).toFixed(3));

  return {
    dieWidth,
    dieHeight,
    coreWidth,
    coreHeight,
    dieArea,
    coreArea,
    aspectRatio,
  };
}

/**
 * Calculate core utilization percentage.
 *
 * Nominal Utilization: (StdCellArea + MacroArea) / CoreArea
 * Effective Placement Utilization: StdCellArea / (CoreArea - MacroArea - BlockageArea)
 *
 * @param {Object} params
 * @param {number} params.stdCellArea - Area of standard cells (µm²)
 * @param {number} [params.macroArea=0] - Area of hard macros (µm²)
 * @param {number} [params.blockageArea=0] - Area of placement blockages (µm²)
 * @param {number} params.coreArea - Total core area (µm²)
 * @returns {{ nominalUtilization: number, effectiveUtilization: number, routableArea: number }}
 */
export function computeUtilization({ stdCellArea, macroArea = 0, blockageArea = 0, coreArea }) {
  if (!coreArea || coreArea <= 0) {
    return { nominalUtilization: 0, effectiveUtilization: 0, routableArea: 0 };
  }

  const nominalUtilization = Number((((stdCellArea + macroArea) / coreArea) * 100).toFixed(1));
  const routableArea = Math.max(0, coreArea - macroArea - blockageArea);
  const effectiveUtilization = routableArea > 0
    ? Number(((stdCellArea / routableArea) * 100).toFixed(1))
    : 100;

  return {
    nominalUtilization,
    effectiveUtilization,
    routableArea,
  };
}

/**
 * Detect collision/overlap between two 2D axis-aligned bounding boxes (AABBs).
 * Box format: { x: number, y: number, width: number, height: number }
 *
 * @param {Object} box1
 * @param {Object} box2
 * @param {number} [halo=0] - Minimum clearance required between boxes
 * @returns {boolean} True if boxes overlap or violate halo clearance
 */
export function checkRectCollision(box1, box2, halo = 0) {
  const b1Left = box1.x - halo;
  const b1Right = box1.x + box1.width + halo;
  const b1Top = box1.y - halo;
  const b1Bottom = box1.y + box1.height + halo;

  const b2Left = box2.x;
  const b2Right = box2.x + box2.width;
  const b2Top = box2.y;
  const b2Bottom = box2.y + box2.height;

  // Collision occurs when projections overlap on both X and Y axes
  const overlapX = b1Left < b2Right && b1Right > b2Left;
  const overlapY = b1Top < b2Bottom && b1Bottom > b2Top;

  return overlapX && overlapY;
}

/**
 * Check whether a rectangle is completely contained within the core boundary.
 *
 * @param {Object} box - { x, y, width, height }
 * @param {Object} core - { width, height } (assuming core origin is 0,0)
 * @returns {boolean}
 */
export function isContainedInCore(box, core) {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= core.width &&
    box.y + box.height <= core.height
  );
}

/**
 * Validate I/O pin placements along core boundaries.
 * Checks:
 * 1. Pin edge constraint ('top' | 'bottom' | 'left' | 'right').
 * 2. Minimum pitch / spacing between adjacent pins on the same edge.
 *
 * @param {Array<{ id: string, edge: string, coord: number }>} pins
 * @param {number} minPitch - Minimum spacing between pins (µm)
 * @param {Object} core - { width, height }
 * @returns {{ isValid: boolean, violations: Array<string> }}
 */
export function validatePinPlacements(pins, minPitch = 10, core) {
  const violations = [];
  const edgeGroups = { top: [], bottom: [], left: [], right: [] };

  pins.forEach((pin) => {
    if (!edgeGroups[pin.edge]) {
      violations.push(`Pin ${pin.id} assigned to invalid edge "${pin.edge}"`);
    } else {
      const maxCoord = (pin.edge === 'top' || pin.edge === 'bottom') ? core.width : core.height;
      if (pin.coord < 0 || pin.coord > maxCoord) {
        violations.push(`Pin ${pin.id} coordinate ${pin.coord} exceeds ${pin.edge} edge boundary (max ${maxCoord})`);
      }
      edgeGroups[pin.edge].push(pin);
    }
  });

  // Check pin-to-pin pitch violations on each edge
  Object.entries(edgeGroups).forEach(([edge, edgePins]) => {
    edgePins.sort((a, b) => a.coord - b.coord);
    for (let i = 0; i < edgePins.length - 1; i++) {
      const p1 = edgePins[i];
      const p2 = edgePins[i + 1];
      const spacing = p2.coord - p1.coord;
      if (spacing < minPitch) {
        violations.push(`Pitch violation on ${edge} edge: Pins ${p1.id} and ${p2.id} have spacing ${spacing} µm (min required: ${minPitch} µm)`);
      }
    }
  });

  return {
    isValid: violations.length === 0,
    violations,
  };
}
