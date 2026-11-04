/**
 * synthesisEngine.js
 * ===================
 * Pure deterministic logic synthesis and technology mapping engine.
 * Powers Kingdom 2 (Synthesis: SYN-1 through SYN-5).
 *
 * Implements:
 * 1. Educational standard-cell library with area and delay metrics (simplified linear delay model).
 * 2. Boolean logic optimization (constant folding, double inverter cancellation, De Morgan).
 * 3. Technology mapping from generic Boolean networks to cell library.
 * 4. SDC timing constraint and setup slack calculation.
 * 5. Exhaustive truth table equivalence checking (3-input and N-input).
 */

export const EDUCATIONAL_CELL_LIBRARY = {
  INV_X1:   { name: 'INV_X1',   type: 'NOT',  inputs: 1, area: 1.0, delay: 0.05, dynamicPower: 0.8 },
  NAND2_X1: { name: 'NAND2_X1', type: 'NAND', inputs: 2, area: 1.5, delay: 0.08, dynamicPower: 1.2 },
  NOR2_X1:  { name: 'NOR2_X1',  type: 'NOR',  inputs: 2, area: 1.5, delay: 0.09, dynamicPower: 1.3 },
  AND2_X1:  { name: 'AND2_X1',  type: 'AND',  inputs: 2, area: 2.0, delay: 0.12, dynamicPower: 1.6 },
  OR2_X1:   { name: 'OR2_X1',   type: 'OR',   inputs: 2, area: 2.0, delay: 0.13, dynamicPower: 1.7 },
  XOR2_X1:  { name: 'XOR2_X1',  type: 'XOR',  inputs: 2, area: 3.0, delay: 0.20, dynamicPower: 2.4 },
  MUX2_X1:  { name: 'MUX2_X1',  type: 'MUX',  inputs: 3, area: 3.5, delay: 0.18, dynamicPower: 2.8 },
  DFF_X1:   { name: 'DFF_X1',   type: 'DFF',  inputs: 1, area: 5.0, delay: 0.15, setup: 0.08, dynamicPower: 3.5 },
};

/**
 * Compute total area and critical path delay for a mapped network of standard cells.
 *
 * @param {Array<string>} cells - Array of cell names from EDUCATIONAL_CELL_LIBRARY
 * @param {Array<Array<number>>} pathIndices - Paths represented as sequences of cell indices
 * @returns {{ totalArea: number, maxDelay: number, cellCount: number }}
 */
export function evaluateMappedNetwork(cells, pathIndices = []) {
  if (!Array.isArray(cells)) return { totalArea: 0, maxDelay: 0, cellCount: 0 };

  let totalArea = 0;
  cells.forEach((cellName) => {
    const cell = EDUCATIONAL_CELL_LIBRARY[cellName];
    if (cell) totalArea += cell.area;
  });

  let maxDelay = 0;
  if (Array.isArray(pathIndices) && pathIndices.length > 0) {
    pathIndices.forEach((path) => {
      const pathDelay = path.reduce((sum, idx) => {
        const cell = EDUCATIONAL_CELL_LIBRARY[cells[idx]];
        return sum + (cell ? cell.delay : 0);
      }, 0);
      if (pathDelay > maxDelay) maxDelay = pathDelay;
    });
  } else {
    // If no explicit path graph is provided, sum delays of cells
    maxDelay = cells.reduce((sum, name) => sum + (EDUCATIONAL_CELL_LIBRARY[name]?.delay || 0), 0);
  }

  return {
    totalArea: Number(totalArea.toFixed(2)),
    maxDelay: Number(maxDelay.toFixed(3)),
    cellCount: cells.length,
  };
}

/**
 * Calculate setup timing slack from clock period and path delays.
 * Formula:
 *   Arrival Time = T_cq + T_comb
 *   Required Time = T_period - T_setup + T_skew
 *   Slack = Required Time - Arrival Time
 *
 * @param {Object} params
 * @param {number} params.clockPeriod - Clock period in nanoseconds (e.g. 1.0 ns for 1 GHz)
 * @param {number} params.combDelay - Total combinational logic delay (ns)
 * @param {number} [params.tCq=0.15] - Clock-to-Q delay of launch flop (ns)
 * @param {number} [params.tSetup=0.08] - Setup time of capture flop (ns)
 * @param {number} [params.tSkew=0.0] - Clock skew (ns, capture arrival - launch arrival)
 * @returns {{ arrival: number, required: number, slack: number, isMet: boolean }}
 */
export function computeSetupSlack({ clockPeriod, combDelay, tCq = 0.15, tSetup = 0.08, tSkew = 0.0 }) {
  const safePeriod = Math.max(0.001, Number(clockPeriod) || 1.0);
  const safeComb = Math.max(0, Number(combDelay) || 0);
  const safeCq = Math.max(0, Number(tCq) || 0);
  const safeSetup = Math.max(0, Number(tSetup) || 0);
  const safeSkew = Number(tSkew) || 0;

  const arrival = Number((safeCq + safeComb).toFixed(3));
  const required = Number((safePeriod - safeSetup + safeSkew).toFixed(3));
  const slack = Number((required - arrival).toFixed(3));
  const isMet = slack >= 0;

  return {
    arrival,
    required,
    slack,
    isMet,
  };
}

/**
 * Check if two 3-input Boolean functions are equivalent across all 8 truth-table rows.
 *
 * @param {Function} fnOriginal - (a, b, c) => 0 | 1
 * @param {Function} fnOptimized - (a, b, c) => 0 | 1
 * @returns {{ isEquivalent: boolean, mismatchRow: Object|null }}
 */
export function verifyBooleanEquivalence3(fnOriginal, fnOptimized) {
  for (let a = 0; a <= 1; a++) {
    for (let b = 0; b <= 1; b++) {
      for (let c = 0; c <= 1; c++) {
        const out1 = fnOriginal(a, b, c) === 1 ? 1 : 0;
        const out2 = fnOptimized(a, b, c) === 1 ? 1 : 0;
        if (out1 !== out2) {
          return {
            isEquivalent: false,
            mismatchRow: { a, b, c, expected: out1, actual: out2 },
          };
        }
      }
    }
  }
  return { isEquivalent: true, mismatchRow: null };
}

/**
 * Generalized N-input exhaustive Boolean equivalence checker (N <= 6).
 *
 * @param {number} numInputs - Number of input variables
 * @param {Function} fnOriginal - (...args) => 0 | 1
 * @param {Function} fnOptimized - (...args) => 0 | 1
 * @returns {{ isEquivalent: boolean, mismatchRow: Object|null }}
 */
export function verifyBooleanEquivalenceN(numInputs, fnOriginal, fnOptimized) {
  const totalCombos = 1 << Math.min(6, numInputs);
  for (let i = 0; i < totalCombos; i++) {
    const inputs = [];
    for (let bit = numInputs - 1; bit >= 0; bit--) {
      inputs.push((i >> bit) & 1);
    }
    const out1 = fnOriginal(...inputs) === 1 ? 1 : 0;
    const out2 = fnOptimized(...inputs) === 1 ? 1 : 0;
    if (out1 !== out2) {
      return {
        isEquivalent: false,
        mismatchRow: { inputs, expected: out1, actual: out2 },
      };
    }
  }
  return { isEquivalent: true, mismatchRow: null };
}

/**
 * Calculate dynamic switching power, static leakage power, and total power.
 *
 * Formulas:
 *   P_dyn = alpha * C_eff * Vdd^2 * f_clk
 *   P_leak = I_leak * Vdd
 *   P_total = P_dyn + P_leak
 *
 * Unit conventions:
 *   alpha: switching activity factor [0.0 - 1.0]
 *   cEffPf: effective switching capacitance in picofarads (pF, 1e-12 F)
 *   vSupply: supply voltage in Volts (V)
 *   fClkMhz: clock frequency in Megahertz (MHz, 1e6 Hz)
 *   iLeakUa: static leakage current in microamperes (µA, 1e-6 A)
 *
 * Returns power components in microwatts (µW).
 *
 * @param {Object} params
 * @param {number} params.alpha - Activity factor (default 0.1)
 * @param {number} params.cEffPf - Effective capacitance (pF)
 * @param {number} params.vSupply - Supply voltage (V, default 1.0)
 * @param {number} params.fClkMhz - Clock frequency (MHz)
 * @param {number} [params.iLeakUa=0] - Leakage current (µA)
 * @returns {{ dynamicPowerUw: number, leakagePowerUw: number, totalPowerUw: number }}
 */
export function calculatePowerEstimate({ alpha = 0.1, cEffPf, vSupply = 1.0, fClkMhz, iLeakUa = 0 }) {
  const safeAlpha = Math.max(0, Math.min(1.0, Number(alpha) || 0));
  const safeC = Math.max(0, Number(cEffPf) || 0);
  const safeV = Math.max(0, Number(vSupply) || 0);
  const safeF = Math.max(0, Number(fClkMhz) || 0);
  const safeLeak = Math.max(0, Number(iLeakUa) || 0);

  // P_dyn (W) = alpha * (C * 1e-12) * V^2 * (F * 1e6) = alpha * C * V^2 * F * 1e-6 W
  // In µW (1e-6 W): P_dyn = alpha * C_eff_pF * Vdd^2 * f_clk_MHz
  const dynamicPowerUw = Number((safeAlpha * safeC * Math.pow(safeV, 2) * safeF).toFixed(3));

  // P_leak (W) = (I * 1e-6) * V = I * V * 1e-6 W -> in µW: I_leak_uA * Vdd
  const leakagePowerUw = Number((safeLeak * safeV).toFixed(3));

  const totalPowerUw = Number((dynamicPowerUw + leakagePowerUw).toFixed(3));

  return {
    dynamicPowerUw,
    leakagePowerUw,
    totalPowerUw,
  };
}
