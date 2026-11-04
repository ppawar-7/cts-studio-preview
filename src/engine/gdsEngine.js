/**
 * gdsEngine.js
 * ============
 * Pure, deterministic ASIC GDSII & Tape-Out Signoff engine.
 *
 * Core physical design concepts:
 * 1. GDSII Stream Format Hierarchy:
 *    Library (BGNLIB) -> Structures/Cells (BGNSTR) -> Elements (BOUNDARY, PATH, SREF instances).
 * 2. GDS Layer and Datatype Mapping (FEOL: Diffusion, Poly; BEOL: Metals, Vias).
 * 3. Tape-Out Signoff Verification Matrix:
 *    - DRC (Design Rule Check): 0 violations (Width, Spacing, Enclosure)
 *    - LVS (Layout Versus Schematic): Clean device and netlist isomorphism (0 opens, 0 shorts)
 *    - STA (Static Timing Analysis Signoff): Setup WNS >= 0, Hold WNS >= 0 across all PVT corners
 *    - ERC (Electrical Rule Check): Well tap bias, floating gates
 *    - Antenna DRC: Diode protection for plasma etch gate charge accumulation
 *    - Metal & Poly CMP Density: Uniform density (30%-70%)
 * 4. Antenna Ratio calculation: AR = Metal Area / Gate Area.
 */

export const GDS_LAYER_MAP = {
  NWELL:   { gdsLayer: 1,  datatype: 0, category: 'FEOL', name: 'N-Well Implant' },
  DIFF:    { gdsLayer: 2,  datatype: 0, category: 'FEOL', name: 'Active Diffusion (OD)' },
  POLY:    { gdsLayer: 15, datatype: 0, category: 'FEOL', name: 'Polysilicon Gate (PO)' },
  CONTACT: { gdsLayer: 20, datatype: 0, category: 'FEOL', name: 'Contact to Active/Poly (CO)' },
  M1:      { gdsLayer: 30, datatype: 0, category: 'BEOL', name: 'Metal 1 (M1)' },
  VIA1:    { gdsLayer: 35, datatype: 0, category: 'BEOL', name: 'Via 1 (V1)' },
  M2:      { gdsLayer: 40, datatype: 0, category: 'BEOL', name: 'Metal 2 (M2)' },
  VIA2:    { gdsLayer: 45, datatype: 0, category: 'BEOL', name: 'Via 2 (V2)' },
  M3:      { gdsLayer: 50, datatype: 0, category: 'BEOL', name: 'Metal 3 (M3)' },
};

export const SIGNOFF_CHECKLIST = [
  { id: 'DRC',     name: 'Design Rule Check', description: 'Zero geometric width, spacing, and enclosure violations' },
  { id: 'LVS',     name: 'Layout Versus Schematic', description: 'Extracted polygon netlist matches golden schematic 100%' },
  { id: 'STA',     name: 'Static Timing Signoff', description: 'Setup WNS >= 0 and Hold WNS >= 0 across all PVT corners' },
  { id: 'ERC',     name: 'Electrical Rule Check', description: 'No floating inputs, well bias errors, or high-impedance nodes' },
  { id: 'ANTENNA', name: 'Antenna Effect DRC', description: 'Metal area to gate area ratio within foundry limits' },
  { id: 'CMP',     name: 'CMP Density Check', description: 'Dummy metal and poly fill density within 30%-70% window' },
];

/**
 * Calculate Antenna Ratio (AR) and determine if an antenna diode is required.
 * AR = Metal Area / Gate Oxide Area
 *
 * @param {number} metalAreaUm2 - Total area of metal attached to gate during etch
 * @param {number} gateAreaUm2 - Area of the MOS transistor gate oxide
 * @param {number} maxAllowedRatio - Foundry rule limit (default 200)
 * @returns {{ ratio: number, isExceeded: boolean, diodeRequired: boolean }}
 */
export function calculateAntennaRatio(metalAreaUm2, gateAreaUm2, maxAllowedRatio = 200) {
  if (gateAreaUm2 <= 0) return { ratio: 0, isExceeded: false, diodeRequired: false };
  const ratio = Number((metalAreaUm2 / gateAreaUm2).toFixed(1));
  const isExceeded = ratio > maxAllowedRatio;

  return {
    ratio,
    isExceeded,
    diodeRequired: isExceeded,
  };
}

/**
 * Evaluate chip tape-out signoff readiness across all mandatory checks.
 *
 * @param {Object} statusMap - Map of check ID to boolean { DRC: true, LVS: true, STA: true, ... }
 * @returns {{ isReadyForTapeout: boolean, passedCount: number, totalCount: number, failingChecks: Array<string> }}
 */
export function evaluateSignoffReadiness(statusMap = {}) {
  const failingChecks = [];
  let passedCount = 0;

  for (const check of SIGNOFF_CHECKLIST) {
    if (statusMap[check.id] === true) {
      passedCount++;
    } else {
      failingChecks.push(check.name);
    }
  }

  const isReadyForTapeout = passedCount === SIGNOFF_CHECKLIST.length;

  return {
    isReadyForTapeout,
    passedCount,
    totalCount: SIGNOFF_CHECKLIST.length,
    failingChecks,
  };
}
