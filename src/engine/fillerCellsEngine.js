/**
 * fillerCellsEngine.js
 * ====================
 * Pure, deterministic ASIC Physical-Only & Filler Cells engine.
 *
 * Core physical design concepts:
 * 1. Standard Cell Row Gap Detection: Finding empty site voids between placed logic gates.
 * 2. Physical-Only Cell Types:
 *    - Standard Fillers (FILL1, FILL2, FILL4, FILL8, FILL16, FILL32, FILL64)
 *    - Decoupling Capacitor Cells (DECAP) for dynamic IR drop / power droop suppression
 *    - Well Tap Cells (TAPCELL) to bias N-well / substrate and prevent latch-up
 *    - Endcap / Boundary Cells (ENDCAP) to terminate diffusion and protect gate oxide during CMP
 *    - Tie-High / Tie-Low Cells (TIEHI, TIELO) to provide static 1/0 without gate oxide breakdown
 * 3. N-Well, P-Substrate, and VDD/VSS Power Rail Abutment Continuity.
 * 4. Dynamic IR Droop Mitigation: Delta_V = (I_transient * dt) / C_decap.
 * 5. Decap Leakage Penalty: Standby gate tunneling leakage current.
 */

export const PHYSICAL_ONLY_CELLS = {
  FILLER: {
    category: 'Filler',
    sizes: [64, 32, 16, 8, 4, 2, 1],
    purpose: 'Fills gaps between standard cells to ensure continuous N-well, implant, and power rail abutment; satisfies DRC metal density.',
  },
  DECAP: {
    category: 'Decap',
    sizes: [16, 8, 4],
    capPerSitePf: 0.05, // 50 fF per site
    leakagePerSiteUa: 0.25, // 0.25 µA per site gate oxide tunneling leakage
    purpose: 'Provides on-die charge reservoir between VDD and VSS to supply transient switching currents and suppress dynamic IR droop.',
  },
  TAPCELL: {
    category: 'WellTap',
    maxDistanceUm: 30.0, // Foundry DRC rule: max distance from any transistor to nearest tap
    purpose: 'Ties N-well to VDD and P-substrate to VSS to prevent parasitic PNPN SCR thyristor triggering (CMOS Latch-Up).',
  },
  ENDCAP: {
    category: 'Boundary',
    purpose: 'Placed at the left and right boundaries of cell rows to terminate wells and protect oxide layers during Chemical Mechanical Polishing (CMP).',
  },
  TIE_CELLS: {
    category: 'TieOff',
    purpose: 'Provides static logic-1 and logic-0 references without connecting transistor gate oxide directly to VDD/VSS rails, preventing ESD and overvoltage gate rupture.',
  },
};

/**
 * Identify empty site gaps in a standard cell row given a list of placed logic cells.
 *
 * @param {number} rowWidthSites - Total width of row in placement sites (e.g. 100 sites)
 * @param {Array<{id: string, startSite: number, widthSites: number}>} placedCells
 * @returns {Array<{ startSite: number, endSite: number, widthSites: number }>}
 */
export function findRowGaps(rowWidthSites, placedCells) {
  if (!Array.isArray(placedCells) || placedCells.length === 0) {
    return [{ startSite: 0, endSite: rowWidthSites, widthSites: rowWidthSites }];
  }

  // Sort cells by start site
  const sorted = [...placedCells]
    .filter((c) => c && typeof c.startSite === 'number')
    .sort((a, b) => a.startSite - b.startSite);

  const gaps = [];
  let currentSite = 0;

  for (const cell of sorted) {
    if (cell.startSite > currentSite) {
      gaps.push({
        startSite: currentSite,
        endSite: cell.startSite,
        widthSites: cell.startSite - currentSite,
      });
    }
    currentSite = Math.max(currentSite, cell.startSite + cell.widthSites);
  }

  if (currentSite < rowWidthSites) {
    gaps.push({
      startSite: currentSite,
      endSite: rowWidthSites,
      widthSites: rowWidthSites - currentSite,
    });
  }

  return gaps;
}

/**
 * Fill a gap using greedy change-making algorithm with available filler sizes.
 *
 * @param {number} gapWidthSites - Width of gap in placement sites
 * @param {Array<number>} availableSizes - Standard filler widths [32, 16, 8, 4, 2, 1]
 * @returns {{ filledSites: number, remainingSites: number, cellPlan: Array<{size: number, count: number, type: string}> }}
 */
export function greedyFillGap(gapWidthSites, availableSizes = [32, 16, 8, 4, 2, 1]) {
  const sortedSizes = [...availableSizes].sort((a, b) => b - a);
  let remaining = Math.max(0, Number(gapWidthSites) || 0);
  const cellPlan = [];

  for (const size of sortedSizes) {
    if (remaining >= size && size > 0) {
      const count = Math.floor(remaining / size);
      cellPlan.push({ size, count, type: `FILL${size}` });
      remaining -= count * size;
    }
  }

  return {
    filledSites: gapWidthSites - remaining,
    remainingSites: remaining,
    cellPlan,
  };
}

/**
 * Calculate dynamic power supply droop (IR drop) voltage with and without decap capacitance,
 * including gate oxide leakage penalty.
 * Delta_V = (I_transient * dt) / C_decap
 *
 * @param {number} transientCurrentMa - Transient switching surge current in mA
 * @param {number} deltaTimePs - Switching duration in picoseconds
 * @param {number} decapCapPf - On-die decap capacitance in picofarads
 * @param {number} [decapSites=0] - Number of placed decap sites (for leakage estimate)
 * @returns {{ droopMv: number, isAcceptable: boolean, leakageCurrentUa: number }}
 */
export function calculateDecapDroop(transientCurrentMa = 100, deltaTimePs = 200, decapCapPf = 50, decapSites = 0) {
  if (decapCapPf <= 0) {
    return { droopMv: Infinity, isAcceptable: false, leakageCurrentUa: 0 };
  }
  // Q = I * dt = (mA * 1e-3) * (ps * 1e-12) = C
  // V = Q / C = [ (mA * 1e-3) * (ps * 1e-12) ] / (pF * 1e-12) = (mA * 1e-3 * ps) / pF volts
  // In mV: V * 1000 = (mA * ps) / pF mV
  const droopMv = Number(((transientCurrentMa * deltaTimePs) / decapCapPf).toFixed(2));
  // Acceptable if droop is <= 50 mV (5% of 1.0V supply)
  const isAcceptable = droopMv <= 50.0;
  const leakageCurrentUa = Number((decapSites * PHYSICAL_ONLY_CELLS.DECAP.leakagePerSiteUa).toFixed(2));

  return {
    droopMv,
    isAcceptable,
    leakageCurrentUa,
  };
}

/**
 * Check N-well and power rail abutment continuity across a placed row.
 * Evaluates true spatial interval coverage when startSite is present; falls back to width sum.
 *
 * @param {number} rowWidthSites
 * @param {Array<{widthSites: number, startSite?: number}>} allCells
 * @returns {{ isContinuous: boolean, totalCellWidth: number, gapRemaining: number }}
 */
export function checkRowContinuity(rowWidthSites, allCells) {
  if (!Array.isArray(allCells) || allCells.length === 0) {
    return { isContinuous: false, totalCellWidth: 0, gapRemaining: rowWidthSites };
  }

  const hasStartSites = allCells.every((c) => typeof c.startSite === 'number');

  if (hasStartSites) {
    // Spatial interval coverage check
    const sorted = [...allCells].sort((a, b) => a.startSite - b.startSite);
    let coveredUpTo = 0;
    let totalCovered = 0;

    for (const c of sorted) {
      if (c.startSite > coveredUpTo) {
        // Gap detected!
        break;
      }
      coveredUpTo = Math.max(coveredUpTo, c.startSite + c.widthSites);
      totalCovered += c.widthSites;
    }

    const gapRemaining = Math.max(0, rowWidthSites - coveredUpTo);
    return {
      isContinuous: gapRemaining === 0 && coveredUpTo >= rowWidthSites,
      totalCellWidth: totalCovered,
      gapRemaining,
    };
  }

  // Fallback: Scalar width summation
  const totalCellWidth = allCells.reduce((sum, c) => sum + (Number(c.widthSites) || 0), 0);
  const gapRemaining = Math.max(0, rowWidthSites - totalCellWidth);
  return {
    isContinuous: gapRemaining === 0,
    totalCellWidth,
    gapRemaining,
  };
}
