/**
 * sanityCheckEngine.js
 * ====================
 * Real engineering verification engine for Physical Design Stage Sanity Checks.
 * Evaluates student layouts, placement, clock trees, routing, and filler cell designs
 * against physical design rules and engineering requirements.
 *
 * Checks implemented across 5 Physical Design Kingdoms:
 * - Floorplanning (3): fp-drc, fp-connectivity, fp-missing-vias
 * - Placement (5): pl-legality, pl-congestion, pl-drc, pl-connectivity, pl-missing-vias
 * - CTS (4): cts-timing-reports, cts-power, cts-qor, cts-clock-tree-report
 * - Routing (5): rt-routes, rt-lvs, rt-timing, rt-design, rt-constraints
 * - Filler Cells (9): fc-legality, fc-drc, fc-connectivity, fc-design, fc-timing,
 *                     fc-constraints, fc-power, fc-qor, fc-congestion
 *
 * Educational Scope Note:
 * All evaluations use closed-form analytical models and Manhattan boundary approximations.
 * These are Educational Rule Checks designed for pedagogy, not foundry-qualified EDA signoff.
 */

import { checkCellOverlaps } from './placementEngine.js';
import { computeClockTreeMetrics, calculateSkewImpact } from './ctsEngine.js';
import { checkRoutingShorts } from './routingEngine.js';
import { calculateDecapDroop, checkRowContinuity } from './fillerCellsEngine.js';
import { SANITY_CHECK_REQUIREMENTS } from '../logic/studentDesignContext.js';
import { CHECK_CLASSIFICATION } from '../logic/designArtifactContracts.js';

/**
 * Execute real engineering evaluation for a given sanity check.
 *
 * @param {string} checkId - e.g. 'pl-legality', 'cts-clock-tree-report', 'rt-lvs', etc.
 * @param {Object} [arg2={}] - Context or designData
 * @param {Object} [arg3=null] - Options when called with (checkId, data, options)
 * @returns {{ checkId: string, passed: boolean, canCertify: boolean, isDemonstration: boolean, metrics: Object, logOutput: Array<string> }}
 */
export function evaluateSanityCheck(checkId, arg2 = {}, arg3 = null) {
  const logs = [];
  let passed = true;
  const metrics = {};

  // Support both (checkId, context) and (checkId, data, options)
  let context = {};
  if (arg3 && typeof arg3 === 'object') {
    context = { ...arg3, designData: arg2 };
  } else {
    context = arg2 || {};
  }

  const isStudentDesign = Boolean(context.isStudentDesign);
  const isDefect = Boolean(context.injectDefect);
  const data = context.designData || context;

  logs.push(`[RULE-ENGINE] Initializing Educational Rule Check: ${checkId}`);

  // Rejection check 1: Unknown sanity check ID
  const requirement = SANITY_CHECK_REQUIREMENTS[checkId];
  if (!requirement) {
    logs.push(`[RULE-ENGINE] ❌ Unknown sanity check identifier: "${checkId}"`);
    logs.push('[RESULT] Check rejected: Unknown ruledeck.');
    return {
      checkId,
      passed: false,
      canCertify: false,
      isDemonstration: false,
      metrics: {},
      logOutput: logs,
    };
  }

  // Rejection check 2: Student mode requested but student lacks design artifacts or hasStudentDesign is false
  if (isStudentDesign && context.hasStudentDesign === false) {
    const reason =
      context.reason ||
      context.studentDesignReason ||
      'You must complete the prerequisite design levels to generate your layout geometry first.';
    logs.push(`[STUDENT-AUDIT] ❌ NO STUDENT DESIGN FOUND for check: ${checkId}`);
    logs.push(`[PREREQUISITE] ${reason}`);
    logs.push('[RESULT] Audit rejected: Incomplete student design context.');
    logs.push('[DISCLOSURE] ℹ️ Educational EDA Check: Closed-form analytical models for learning. Not foundry-qualified signoff.');
    return {
      checkId,
      passed: false,
      canCertify: false,
      isDemonstration: false,
      metrics: {},
      logOutput: logs,
    };
  }

  // Rejection check 3: Student mode requested for a PRACTICE_ONLY check
  if (isStudentDesign && requirement.classification === CHECK_CLASSIFICATION.PRACTICE_ONLY) {
    logs.push(`[STUDENT-AUDIT] ℹ️ Check is classified as PRACTICE_ONLY: ${checkId}`);
    logs.push('[RESULT] Audit rejected: Stage certification XP is not available for practice drills.');
    logs.push('[DISCLOSURE] ℹ️ Educational EDA Check: Closed-form analytical models for learning. Not foundry-qualified signoff.');
    return {
      checkId,
      passed: false,
      canCertify: false,
      isDemonstration: true,
      metrics: {},
      logOutput: logs,
    };
  }

  if (isStudentDesign) {
    logs.push('[STUDENT-AUDIT] 🎓 Mode: Verifying Genuine Student Design Artifacts (Sign-Off Audit)');
  } else {
    logs.push('[DEMO-MODE] 🔬 Mode: Demonstration & Fault Drill Inspection (Stage Certification XP Disabled)');
    logs.push('[DEMO-MODE] DEMONSTRATION DRILL: Practice-only mode.');
    if (isDefect) {
      logs.push('[AUDIT-TEST] ⚠️ Intentional Defect Injection Active: Evaluating ruledeck fault tolerance...');
    }
  }

  switch (checkId) {
    // ─── Floorplanning Sanity Checks (3) ─────────────────────────
    case 'fp-drc': {
      logs.push('[DRC-FP] Initializing Macro Boundary Spacing Ruledeck...');
      logs.push('[DRC-FP] Checking Core Boundary Margin: Required >= 20.0 µm');
      let margin;
      let halo;
      if (isStudentDesign) {
        if (
          typeof data.margin !== 'number' ||
          !Number.isFinite(data.margin) ||
          typeof data.halo !== 'number' ||
          !Number.isFinite(data.halo)
        ) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing margin or halo in floorplan artifact.');
          passed = false;
          break;
        }
        margin = data.margin;
        halo = data.halo;
      } else {
        margin = typeof data.margin === 'number' ? data.margin : (isDefect ? 14.0 : 20.0);
        halo = typeof data.halo === 'number' ? data.halo : (isDefect ? 8.0 : 15.0);
      }

      const marginMet = Number.isFinite(margin) && margin >= 20.0;
      const haloMet = Number.isFinite(halo) && halo >= 15.0;
      metrics.margin = margin;
      metrics.halo = halo;
      logs.push(`[DRC-FP] Core Boundary Margin: ${Number.isFinite(margin) ? margin.toFixed(1) : 'INVALID'} µm -> ${marginMet ? 'PASSED' : 'VIOLATION (< 20.0 µm)'}`);
      logs.push(`[DRC-FP] Macro-to-Macro Halo: ${Number.isFinite(halo) ? halo.toFixed(1) : 'INVALID'} µm -> ${haloMet ? 'PASSED' : 'VIOLATION (< 15.0 µm)'}`);
      passed = marginMet && haloMet;
      break;
    }
    case 'fp-connectivity': {
      // PRACTICE ONLY
      logs.push('[CONN-FP] Tracing VDD/VSS Power Rings and Macro I/O Pins...');
      const floatingPins = typeof data.floatingPins === 'number' ? data.floatingPins : (isDefect ? 2 : 0);
      const ringContinuous = typeof data.ringContinuous === 'boolean' ? data.ringContinuous : (!isDefect);
      metrics.floatingPins = floatingPins;
      metrics.ringContinuous = ringContinuous;
      logs.push(`[CONN-FP] Power Rings: ${ringContinuous ? '100% Continuous (PASSED)' : 'OPEN RING SEGMENT DETECTED'}`);
      logs.push(`[CONN-FP] Floating Macro I/O Pins: ${floatingPins} -> ${floatingPins === 0 ? 'PASSED' : 'VIOLATION'}`);
      passed = ringContinuous && floatingPins === 0;
      break;
    }
    case 'fp-missing-vias': {
      // PRACTICE ONLY
      logs.push('[POWER-FP] Verifying VDD/VSS Power Ring Cross-Over Via Drops...');
      const missingVias = typeof data.missingVias === 'number' ? data.missingVias : (isDefect ? 4 : 0);
      metrics.missingVias = missingVias;
      logs.push(`[POWER-FP] Power Mesh Via Intersections: ${missingVias === 0 ? '100% Validated (PASSED)' : `${missingVias} MISSING VIAS DETECTED`}`);
      passed = missingVias === 0;
      break;
    }

    // ─── Placement Sanity Checks (5) ─────────────────────────────
    case 'pl-legality': {
      logs.push('[LEGAL-PL] Verifying Standard Cell Row Site Snapping & Overlaps...');
      let cells;
      if (isStudentDesign) {
        if (!Array.isArray(data.cells) || data.cells.length === 0) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing cells array in placement artifact.');
          passed = false;
          break;
        }
        cells = data.cells;
      } else if (Array.isArray(data.cells) && data.cells.length > 0) {
        cells = data.cells;
      } else {
        cells = isDefect
          ? [
              { id: 'C1', x: 20, y: 40, width: 40, height: 40 },
              { id: 'C2', x: 30, y: 40, width: 40, height: 40 }, // Overlaps C1!
            ]
          : [
              { id: 'C1', x: 20, y: 40, width: 30, height: 40 },
              { id: 'C2', x: 60, y: 40, width: 20, height: 40 },
            ];
      }
      const overlapResult = checkCellOverlaps(cells);
      metrics.hasOverlap = overlapResult.hasOverlap;
      logs.push(`[LEGAL-PL] Overlap status: ${overlapResult.hasOverlap ? 'VIOLATION DETECTED' : '0 Overlaps (Clean)'}`);
      passed = !overlapResult.hasOverlap;
      break;
    }
    case 'pl-congestion': {
      logs.push('[CONG-PL] Evaluating Global Routing Tile (GCell) Demand vs Capacity...');
      let peakRatio;
      if (isStudentDesign) {
        const val = typeof data.peakRatio === 'number' ? data.peakRatio : data.maxCongestion;
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing congestion ratio in placement artifact.');
          passed = false;
          break;
        }
        peakRatio = val;
      } else {
        peakRatio = typeof data.peakRatio === 'number' ? data.peakRatio : (typeof data.maxCongestion === 'number' ? data.maxCongestion : (isDefect ? 1.35 : 0.85));
      }
      metrics.peakCongestionRatio = peakRatio;
      const congMet = Number.isFinite(peakRatio) && peakRatio <= 1.0;
      logs.push(`[CONG-PL] Peak GCell Congestion Index: ${(peakRatio * 100).toFixed(0)}% (Limit: 100%) -> ${congMet ? 'PASSED' : 'OVERFLOW'}`);
      passed = congMet;
      break;
    }
    case 'pl-drc': {
      // PRACTICE ONLY
      logs.push('[DRC-PL] Inspecting Well-Tap Cell Distance (Max Spacing <= 30 µm)...');
      const maxTapPitch = typeof data.maxTapPitch === 'number' ? data.maxTapPitch : (isDefect ? 38.0 : 28.0);
      metrics.maxTapPitch = maxTapPitch;
      const tapMet = Number.isFinite(maxTapPitch) && maxTapPitch <= 30.0;
      logs.push(`[DRC-PL] Max Well-Tap Pitch: ${maxTapPitch.toFixed(1)} µm -> ${tapMet ? 'PASSED' : 'VIOLATION (Latch-up risk)'}`);
      passed = tapMet;
      break;
    }
    case 'pl-connectivity': {
      // PRACTICE ONLY
      logs.push('[CONN-PL] Checking Placed Instance Logical Signal Net Pins...');
      const unplacedPins = typeof data.unplacedPins === 'number' ? data.unplacedPins : (isDefect ? 3 : 0);
      metrics.unplacedPins = unplacedPins;
      logs.push(`[CONN-PL] Unplaced/Floating Net Pins: ${unplacedPins} -> ${unplacedPins === 0 ? 'PASSED' : 'VIOLATION'}`);
      passed = unplacedPins === 0;
      break;
    }
    case 'pl-missing-vias': {
      logs.push('[POWER-PL] Checking Standard Cell Power Pin Rail Abutment...');
      let offRailCells;
      if (isStudentDesign) {
        if (typeof data.offRailCells !== 'number' || !Number.isFinite(data.offRailCells)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing offRailCells in placement artifact.');
          passed = false;
          break;
        }
        offRailCells = data.offRailCells;
      } else {
        offRailCells = typeof data.offRailCells === 'number' ? data.offRailCells : (isDefect ? 2 : 0);
      }
      metrics.offRailCells = offRailCells;
      logs.push(`[POWER-PL] Cell-to-Rail Contact: ${offRailCells === 0 ? '100% Abutted (PASSED)' : `${offRailCells} OFF-RAIL INSTANCES DETECTED`}`);
      passed = offRailCells === 0;
      break;
    }

    // ─── Clock Tree Synthesis Sanity Checks (4) ───────────────────
    case 'cts-clock-tree-report': {
      logs.push('[CTS-REPORT] Extracting Clock Arrival Latency Across All Leaf Sinks...');
      let skew;
      let latency;
      if (isStudentDesign) {
        if (
          typeof data.skewPs !== 'number' ||
          !Number.isFinite(data.skewPs) ||
          typeof data.latencyPs !== 'number' ||
          !Number.isFinite(data.latencyPs)
        ) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing skewPs or latencyPs in clock tree artifact.');
          passed = false;
          break;
        }
        skew = data.skewPs;
        latency = data.latencyPs;
        metrics.skewPs = skew;
        metrics.latencyPs = latency;
        const skewMet = Number.isFinite(skew) && skew <= 50;
        logs.push(`[CTS-REPORT] Clock Skew: ${metrics.skewPs} ps (Target: <= 50 ps) -> ${skewMet ? 'PASSED' : 'VIOLATION'}`);
        logs.push(`[CTS-REPORT] Clock Latency: ${metrics.latencyPs} ps (Limit: <= 1500 ps)`);
        passed = skewMet;
      } else if (Array.isArray(data.sinks) && data.sinks.length > 0) {
        const treeMetrics = computeClockTreeMetrics(data.sinks, 0.030);
        skew = Math.round(treeMetrics.skew * 1000);
        latency = Math.round(treeMetrics.latency * 1000);
        metrics.skewPs = skew;
        metrics.latencyPs = latency;
        const skewMet = treeMetrics.isBalanced;
        logs.push(`[CTS-REPORT] Clock Skew: ${metrics.skewPs} ps (Target: <= 30 ps) -> ${skewMet ? 'PASSED' : 'VIOLATION'}`);
        logs.push(`[CTS-REPORT] Clock Latency: ${metrics.latencyPs} ps (Limit: <= 1500 ps)`);
        passed = skewMet;
      } else {
        skew = typeof data.skewPs === 'number' ? data.skewPs : (isDefect ? 110 : 25);
        latency = typeof data.latencyPs === 'number' ? data.latencyPs : (isDefect ? 320 : 180);
        metrics.skewPs = skew;
        metrics.latencyPs = latency;
        const skewMet = Number.isFinite(skew) && skew <= 50;
        logs.push(`[CTS-REPORT] Clock Skew: ${metrics.skewPs} ps (Target: <= 50 ps) -> ${skewMet ? 'PASSED' : 'VIOLATION'}`);
        logs.push(`[CTS-REPORT] Clock Latency: ${metrics.latencyPs} ps (Limit: <= 1500 ps)`);
        passed = skewMet;
      }
      break;
    }
    case 'cts-timing-reports': {
      logs.push('[CTS-TIMING] Verifying Setup and Hold Slacks with CTS Skew Injection...');
      let setupSlack;
      let holdSlack;
      if (isStudentDesign) {
        if (
          typeof data.setupSlack !== 'number' ||
          !Number.isFinite(data.setupSlack) ||
          typeof data.holdSlack !== 'number' ||
          !Number.isFinite(data.holdSlack)
        ) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing setupSlack or holdSlack in CTS timing artifact.');
          passed = false;
          break;
        }
        setupSlack = data.setupSlack;
        holdSlack = data.holdSlack;
      } else {
        const combNs = typeof data.tCombNs === 'number' ? data.tCombNs : (isDefect ? 0.88 : 0.60);
        const captureArrivalNs = typeof data.captureArrivalNs === 'number' ? data.captureArrivalNs : 0.21;
        const timing = calculateSkewImpact({
          periodNs: 1.0,
          tCqNs: 0.10,
          tCombNs: combNs,
          tSetupNs: 0.08,
          tHoldNs: 0.04,
          launchArrivalNs: 0.20,
          captureArrivalNs: captureArrivalNs,
        });
        setupSlack = typeof data.setupSlack === 'number' ? data.setupSlack : timing.setupSlack;
        holdSlack = typeof data.holdSlack === 'number' ? data.holdSlack : timing.holdSlack;
      }
      metrics.setupSlackPs = Math.round(setupSlack * 1000);
      metrics.holdSlackPs = Math.round(holdSlack * 1000);
      const setupPassed = setupSlack >= 0;
      const holdPassed = holdSlack >= 0;
      logs.push(`[CTS-TIMING] Setup Slack: ${metrics.setupSlackPs >= 0 ? '+' : ''}${metrics.setupSlackPs} ps -> ${setupPassed ? 'MET (PASSED)' : 'VIOLATION'}`);
      logs.push(`[CTS-TIMING] Hold Slack: ${metrics.holdSlackPs >= 0 ? '+' : ''}${metrics.holdSlackPs} ps -> ${holdPassed ? 'MET (PASSED)' : 'VIOLATION'}`);
      passed = setupPassed && holdPassed;
      break;
    }
    case 'cts-power': {
      logs.push('[CTS-POWER] Quantifying Clock Network Buffer Dynamic Dissipation...');
      let powerMw;
      if (isStudentDesign) {
        if (typeof data.powerMw !== 'number' || !Number.isFinite(data.powerMw)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing powerMw in CTS power artifact.');
          passed = false;
          break;
        }
        powerMw = data.powerMw;
      } else {
        powerMw = typeof data.powerMw === 'number' ? data.powerMw : (isDefect ? 8.5 : 3.0);
      }
      metrics.clockPowerMw = powerMw;
      const powerMet = Number.isFinite(powerMw) && powerMw <= 5.0;
      logs.push(`[CTS-POWER] Clock Tree Dynamic Power: ${powerMw.toFixed(1)} mW (Budget: <= 5.0 mW) -> ${powerMet ? 'PASSED' : 'OVER_BUDGET'}`);
      passed = powerMet;
      break;
    }
    case 'cts-qor': {
      // PRACTICE ONLY
      logs.push('[CTS-QOR] Verifying Maximum Clock Transition Time (Slew)...');
      const maxSlewPs = typeof data.maxSlewPs === 'number' ? data.maxSlewPs : (isDefect ? 110 : 42);
      metrics.maxSlewPs = maxSlewPs;
      const slewMet = Number.isFinite(maxSlewPs) && maxSlewPs <= 80;
      logs.push(`[CTS-QOR] Max Clock Slew: ${maxSlewPs} ps (Limit: <= 80 ps) -> ${slewMet ? 'PASSED' : 'SLEW_VIOLATION'}`);
      passed = slewMet;
      break;
    }

    // ─── Routing Sanity Checks (5) ───────────────────────────────
    case 'rt-routes': {
      // PRACTICE ONLY
      logs.push('[ROUTE-CHK] Inspecting Detailed Routing Track Continuity...');
      const unrouted = typeof data.unroutedNets === 'number' ? data.unroutedNets : (typeof data.unrouted === 'number' ? data.unrouted : (isDefect ? 2 : 0));
      metrics.unroutedNets = unrouted;
      logs.push(`[ROUTE-CHK] Unrouted Nets (Opens): ${unrouted} -> ${unrouted === 0 ? '100% Routed (PASSED)' : 'OPEN NETS DETECTED'}`);
      passed = unrouted === 0;
      break;
    }
    case 'rt-lvs': {
      logs.push('[LVS-CHK] Extracting Physical Polygon Netlist & Comparing to Schematic...');
      let hasShort;
      let lvsMatch;
      if (isStudentDesign) {
        if (typeof data.shorts !== 'number' || typeof data.lvsMatch !== 'boolean') {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing shorts count or lvsMatch boolean in routing artifact.');
          passed = false;
          break;
        }
        hasShort = data.shorts > 0;
        lvsMatch = data.lvsMatch;
      } else if (Array.isArray(data.segments) && data.segments.length > 0) {
        const shortCheck = checkRoutingShorts(data.segments);
        hasShort = shortCheck.hasShort;
        lvsMatch = !shortCheck.hasShort;
      } else {
        hasShort = typeof data.shorts === 'number' ? data.shorts > 0 : (typeof data.hasShort === 'boolean' ? data.hasShort : isDefect);
        lvsMatch = typeof data.lvsMatch === 'boolean' ? data.lvsMatch : !hasShort;
      }
      metrics.hasShort = hasShort;
      metrics.lvsMatch = lvsMatch;
      logs.push(`[LVS-CHK] Electrical Shorts: ${hasShort ? 'FAIL (Short detected)' : '0 Shorts (PASSED)'}`);
      logs.push(`[LVS-CHK] Topological LVS Match: ${lvsMatch ? 'MATCHED (PASSED)' : 'MISMATCH'}`);
      passed = !hasShort && lvsMatch;
      break;
    }
    case 'rt-timing': {
      // PRACTICE ONLY
      logs.push('[TIMING-RT] Extracting Detailed RC Parasitics (SPEF) & Running Post-Route STA...');
      const wnsPs = typeof data.wnsPs === 'number' ? data.wnsPs : (isDefect ? -55 : 18);
      metrics.wnsPs = wnsPs;
      const timingMet = Number.isFinite(wnsPs) && wnsPs >= 0;
      logs.push(`[TIMING-RT] Post-Route Worst Negative Slack (WNS): ${wnsPs >= 0 ? '+' : ''}${wnsPs} ps -> ${timingMet ? 'MET (PASSED)' : 'TIMING_VIOLATION'}`);
      passed = timingMet;
      break;
    }
    case 'rt-design': {
      logs.push('[DRC-RT] Verifying Via Enclosure and Preferred Routing Metal Spacing...');
      let viaEnclosureUm;
      let drcErrors;
      if (isStudentDesign) {
        const enc = typeof data.viaEnclosureUm === 'number' ? data.viaEnclosureUm : data.enclosureUm;
        if (typeof enc !== 'number' || !Number.isFinite(enc) || typeof data.drcErrors !== 'number') {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing via enclosure or DRC error count in routing artifact.');
          passed = false;
          break;
        }
        viaEnclosureUm = enc;
        drcErrors = data.drcErrors;
      } else {
        viaEnclosureUm = typeof data.viaEnclosureUm === 'number' ? data.viaEnclosureUm : (isDefect ? 0.005 : 0.012);
        drcErrors = typeof data.drcErrors === 'number' ? data.drcErrors : (isDefect ? 3 : 0);
      }
      metrics.viaEnclosureUm = viaEnclosureUm;
      metrics.drcErrors = drcErrors;
      const encMet = Number.isFinite(viaEnclosureUm) && viaEnclosureUm >= 0.010;
      const drcMet = drcErrors === 0;
      logs.push(`[DRC-RT] Via Layer Enclosure: ${(viaEnclosureUm * 1000).toFixed(0)} nm (Rule: >= 10 nm) -> ${encMet ? 'PASSED' : 'ENCLOSURE_VIOLATION'}`);
      logs.push(`[DRC-RT] Preferred Directions & Min Pitch DRC: ${drcMet ? '0 Violations (PASSED)' : `${drcErrors} DRC VIOLATIONS DETECTED`}`);
      passed = encMet && drcMet;
      break;
    }
    case 'rt-constraints': {
      logs.push('[CONST-RT] Checking Signal Integrity and Peak Crosstalk Glitch Noise...');
      let noiseMv;
      let maxLimit = 50;
      if (isStudentDesign) {
        const val = typeof data.glitchVoltageMv === 'number' ? data.glitchVoltageMv : data.maxVictimNoiseMv;
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing glitchVoltageMv in routing artifact.');
          passed = false;
          break;
        }
        noiseMv = val;
        maxLimit = typeof data.maxAllowedNoiseMv === 'number' ? data.maxAllowedNoiseMv : 50;
        metrics.noiseMv = noiseMv;
        const noiseMet = Number.isFinite(noiseMv) && noiseMv <= maxLimit;
        logs.push(`[CONST-RT] Peak Crosstalk Glitch Noise: ${noiseMv} mV (Budget: <= ${maxLimit} mV) -> ${noiseMet ? 'PASSED' : 'SI_NOISE_VIOLATION'}`);
        passed = noiseMet;
      } else if (typeof data.unconstrained === 'number') {
        const unconstrainedMet = data.unconstrained === 0;
        metrics.unconstrainedPaths = data.unconstrained;
        logs.push(`[CONST-RT] Unconstrained Timing Paths: ${data.unconstrained} -> ${unconstrainedMet ? 'PASSED' : 'VIOLATION'}`);
        passed = unconstrainedMet;
      } else {
        noiseMv = typeof data.glitchVoltageMv === 'number' ? data.glitchVoltageMv : (typeof data.noiseMv === 'number' ? data.noiseMv : (isDefect ? 65 : 25));
        metrics.noiseMv = noiseMv;
        const noiseMet = Number.isFinite(noiseMv) && noiseMv <= maxLimit;
        logs.push(`[CONST-RT] Peak Crosstalk Glitch Noise: ${noiseMv} mV (Budget: <= ${maxLimit} mV) -> ${noiseMet ? 'PASSED' : 'SI_NOISE_VIOLATION'}`);
        passed = noiseMet;
      }
      break;
    }

    // ─── Filler Cells Sanity Checks (9) ──────────────────────────
    case 'fc-legality': {
      logs.push('[FC-LEGAL] Verifying Filler Cell Row Site Snapping & Alignment...');
      let emptySites;
      if (isStudentDesign) {
        if (typeof data.emptySites !== 'number' || !Number.isFinite(data.emptySites)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing emptySites in filler cell artifact.');
          passed = false;
          break;
        }
        emptySites = data.emptySites;
      } else {
        emptySites = typeof data.emptySites === 'number' ? data.emptySites : (typeof data.offSiteCount === 'number' ? data.offSiteCount : (isDefect ? 4 : 0));
      }
      metrics.offSiteCount = emptySites;
      logs.push(`[FC-LEGAL] Unfilled or off-grid sites: ${emptySites} -> ${emptySites === 0 ? 'PASSED' : 'LEGALITY_VIOLATION'}`);
      passed = emptySites === 0;
      break;
    }
    case 'fc-drc': {
      logs.push('[FC-DRC] Inspecting N-Well Continuity & Base Layer Row Site Filling...');
      let baseDrcViolations;
      if (isStudentDesign) {
        if (typeof data.baseDrcViolations !== 'number' || !Number.isFinite(data.baseDrcViolations)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing baseDrcViolations in filler cell artifact.');
          passed = false;
          break;
        }
        baseDrcViolations = data.baseDrcViolations;
        metrics.baseDrcViolations = baseDrcViolations;
        logs.push(`[FC-DRC] Base DRC Violations: ${baseDrcViolations} -> ${baseDrcViolations === 0 ? 'PASSED' : 'VIOLATION'}`);
        passed = baseDrcViolations === 0;
      } else if (Array.isArray(data.cells)) {
        const continuity = checkRowContinuity(100, data.cells);
        metrics.gapRemaining = continuity.gapRemaining;
        logs.push(`[FC-DRC] Void Gap Remaining: ${continuity.gapRemaining} sites -> ${continuity.gapRemaining === 0 ? 'PASSED' : 'VIOLATION'}`);
        passed = continuity.gapRemaining === 0;
      } else {
        baseDrcViolations = typeof data.baseDrcViolations === 'number' ? data.baseDrcViolations : (isDefect ? 3 : 0);
        metrics.baseDrcViolations = baseDrcViolations;
        logs.push(`[FC-DRC] Base DRC Violations: ${baseDrcViolations} -> ${baseDrcViolations === 0 ? 'PASSED' : 'VIOLATION'}`);
        passed = baseDrcViolations === 0;
      }
      break;
    }
    case 'fc-connectivity': {
      logs.push('[FC-POWER] Checking VDD and VSS Power Rail Abutment & Well Bias...');
      let wellContinuityMet;
      if (isStudentDesign) {
        if (typeof data.wellContinuityMet !== 'boolean') {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing wellContinuityMet boolean in filler artifact.');
          passed = false;
          break;
        }
        wellContinuityMet = data.wellContinuityMet;
        metrics.wellContinuityMet = wellContinuityMet;
        logs.push(`[FC-POWER] N-Well Bias Continuity: ${wellContinuityMet ? '100% Continuous (PASSED)' : 'FLOATING WELL GAP DETECTED'}`);
        passed = wellContinuityMet;
      } else if (typeof data.railGaps === 'number') {
        const railGapsMet = data.railGaps === 0;
        metrics.railGaps = data.railGaps;
        logs.push(`[FC-POWER] Rail Gaps: ${data.railGaps} -> ${railGapsMet ? 'PASSED' : 'VIOLATION'}`);
        passed = railGapsMet;
      } else {
        wellContinuityMet = typeof data.wellContinuityMet === 'boolean' ? data.wellContinuityMet : !isDefect;
        metrics.wellContinuityMet = wellContinuityMet;
        logs.push(`[FC-POWER] N-Well Bias Continuity: ${wellContinuityMet ? '100% Continuous (PASSED)' : 'FLOATING WELL GAP DETECTED'}`);
        passed = wellContinuityMet;
      }
      break;
    }
    case 'fc-design': {
      // PRACTICE ONLY
      logs.push('[FC-CMP] Checking Poly and Metal Density Planarity for CMP...');
      const density = typeof data.densityPercent === 'number' ? data.densityPercent : (isDefect ? 26.5 : 48.5);
      metrics.densityPercent = density;
      const densityMet = Number.isFinite(density) && density >= 35.0 && density <= 75.0;
      logs.push(`[FC-CMP] Layer Density: ${density.toFixed(1)}% (Allowed Window: 35%-75%) -> ${densityMet ? 'PASSED' : 'CMP_OUT_OF_SPEC'}`);
      passed = densityMet;
      break;
    }
    case 'fc-timing': {
      // PRACTICE ONLY
      logs.push('[FC-TIMING] Verifying Post-Filler Timing Preservation (No Slack Regressions)...');
      const slackDeltaPs = typeof data.slackDeltaPs === 'number' ? data.slackDeltaPs : (isDefect ? -18 : 0);
      metrics.slackDeltaPs = slackDeltaPs;
      const timingMet = Number.isFinite(slackDeltaPs) && slackDeltaPs >= -5;
      logs.push(`[FC-TIMING] Timing Delta post-filler: ${slackDeltaPs >= 0 ? '+' : ''}${slackDeltaPs} ps -> ${timingMet ? 'PRESERVED (PASSED)' : 'TIMING_REGRESSION'}`);
      passed = timingMet;
      break;
    }
    case 'fc-constraints': {
      logs.push('[FC-CONST] Validating Dynamic Power Rail Droop Suppression...');
      let droopMv;
      let maxDroop = 40;
      if (isStudentDesign) {
        if (typeof data.droopMv !== 'number' || !Number.isFinite(data.droopMv)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing droopMv in decap artifact.');
          passed = false;
          break;
        }
        droopMv = data.droopMv;
        maxDroop = typeof data.maxAllowedDroopMv === 'number' ? data.maxAllowedDroopMv : 40;
        metrics.droopMv = droopMv;
        const droopOk = Number.isFinite(droopMv) && droopMv <= maxDroop;
        logs.push(`[FC-CONST] Dynamic IR Droop: ${droopMv.toFixed(1)} mV (Limit: <= ${maxDroop} mV) -> ${droopOk ? 'PASSED' : 'DROOP_VIOLATION'}`);
        passed = droopOk;
      } else if (typeof data.drcViolations === 'number') {
        const drcOk = data.drcViolations === 0;
        metrics.drcViolations = data.drcViolations;
        logs.push(`[FC-CONST] Transition/Capacitance Violations: ${data.drcViolations} -> ${drcOk ? 'PASSED' : 'VIOLATION'}`);
        passed = drcOk;
      } else {
        droopMv = typeof data.droopMv === 'number' ? data.droopMv : (isDefect ? 75 : 40);
        metrics.droopMv = droopMv;
        const droopOk = Number.isFinite(droopMv) && droopMv <= maxDroop;
        logs.push(`[FC-CONST] Dynamic IR Droop: ${droopMv.toFixed(1)} mV (Limit: <= ${maxDroop} mV) -> ${droopOk ? 'PASSED' : 'DROOP_VIOLATION'}`);
        passed = droopOk;
      }
      break;
    }
    case 'fc-power': {
      logs.push('[FC-POWER] Evaluating Decap Gate Oxide Tunneling Leakage Current...');
      let leakageUa;
      let maxLeakage = 20.0;
      if (isStudentDesign) {
        if (typeof data.leakageUa !== 'number' || !Number.isFinite(data.leakageUa)) {
          logs.push('[STUDENT-AUDIT] ❌ INSUFFICIENT OR INVALID MEASUREMENTS: Missing leakageUa in decap artifact.');
          passed = false;
          break;
        }
        leakageUa = data.leakageUa;
        maxLeakage = typeof data.maxAllowedLeakageUa === 'number' ? data.maxAllowedLeakageUa : 20.0;
        metrics.leakageUa = leakageUa;
        const leakageOk = Number.isFinite(leakageUa) && leakageUa <= maxLeakage;
        logs.push(`[FC-POWER] Standby Gate Leakage: ${leakageUa.toFixed(1)} µA (Budget: <= ${maxLeakage.toFixed(1)} µA) -> ${leakageOk ? 'PASSED' : 'LEAKAGE_OVERLOAD'}`);
        passed = leakageOk;
      } else if (typeof data.decapCapPf === 'number') {
        const decapDroop = calculateDecapDroop(100, 200, data.decapCapPf, data.decapSites || 20);
        metrics.droopMv = decapDroop.droopMv;
        metrics.leakageUa = decapDroop.leakageCurrentUa;
        logs.push(`[FC-POWER] Dynamic IR Droop: ${decapDroop.droopMv} mV (Limit: <= 50 mV) -> ${decapDroop.isAcceptable ? 'PASSED' : 'DROOP_EXCEEDED'}`);
        logs.push(`[FC-POWER] Decap Standby Leakage: ${decapDroop.leakageCurrentUa} µA`);
        passed = decapDroop.isAcceptable;
      } else {
        leakageUa = typeof data.leakageUa === 'number' ? data.leakageUa : (isDefect ? 35.0 : 14.5);
        metrics.leakageUa = leakageUa;
        const leakageOk = Number.isFinite(leakageUa) && leakageUa <= maxLeakage;
        logs.push(`[FC-POWER] Standby Gate Leakage: ${leakageUa.toFixed(1)} µA (Budget: <= ${maxLeakage.toFixed(1)} µA) -> ${leakageOk ? 'PASSED' : 'LEAKAGE_OVERLOAD'}`);
        passed = leakageOk;
      }
      break;
    }
    case 'fc-qor': {
      // PRACTICE ONLY
      logs.push('[FC-QOR] Conducting Comprehensive Signoff Quality of Results (QoR) Audit...');
      const irMarginPercent = typeof data.irMarginPercent === 'number' ? data.irMarginPercent : (isDefect ? 88.5 : 96.5);
      metrics.irMarginPercent = irMarginPercent;
      const qorMet = Number.isFinite(irMarginPercent) && irMarginPercent >= 95.0;
      logs.push(`[FC-QOR] IR Drop Supply Margin: ${irMarginPercent.toFixed(1)}% of VDD (Target: >= 95.0%) -> ${qorMet ? 'PASSED' : 'POOR_QOR'}`);
      passed = qorMet;
      break;
    }
    case 'fc-congestion': {
      // PRACTICE ONLY
      logs.push('[FC-CONG] Checking Pin Accessibility and Final Routing Track Availability...');
      const pinBlocks = typeof data.pinBlocks === 'number' ? data.pinBlocks : (isDefect ? 3 : 0);
      metrics.pinBlocks = pinBlocks;
      logs.push(`[FC-CONG] Blocked Standard Cell Pin Access Sites: ${pinBlocks} -> ${pinBlocks === 0 ? 'PASSED' : 'CONGESTION_BLOCK'}`);
      passed = pinBlocks === 0;
      break;
    }

    default: {
      logs.push(`[RULE-ENGINE] ❌ Unknown sanity check identifier: "${checkId}"`);
      logs.push('[RESULT] Check rejected: Unknown ruledeck.');
      passed = false;
      break;
    }
  }

  logs.push(`[RESULT] Verification completed with status: ${passed ? 'CLEAN_PASS' : 'RULE_VIOLATION'}`);
  logs.push('[DISCLOSURE] ℹ️ Educational EDA Check: Closed-form analytical models for learning. Not foundry-qualified signoff.');

  const canCertify =
    isStudentDesign &&
    passed &&
    requirement.classification === CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK;

  return {
    checkId,
    passed,
    canCertify,
    isDemonstration: !isStudentDesign,
    metrics,
    logOutput: logs,
  };
}
