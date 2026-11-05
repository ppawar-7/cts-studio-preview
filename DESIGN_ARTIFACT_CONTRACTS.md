# PD Playground: Design Artifact Contracts & Verification Pipeline Specification

**Version:** 2.0.0  
**Status:** Certified Engineering Specification  
**Architecture Classification:** Authentic Stage-Contract Artifact Pipeline  

---

## 1. Overview & Architecture Motivation

In the PD Playground ASIC educational platform, physical design stage verification ("Sanity Checks") certifies student design readiness before progressing or committing signoff. 

Previously, sanity checks could fall back to unearned passing defaults when student design data was absent or incomplete. The **Design Artifact Contract Pipeline** replaces heuristic fallbacks with strict, versioned, fail-closed design artifact contracts (`src/logic/designArtifactContracts.js`).

### Core Contract Tenets:
1. **Zero Fake Passing Defaults:** If a student attempts stage certification without completing prerequisite activities or emitting required geometry artifacts, the sanity check engine **fails closed**, halts certification, awards 0 XP, and issues clear diagnostic instructions.
2. **Schema & Metric Immutability:** Artifacts emitted by activities conform to versioned contract schemas (`contractVersion: '2.0.0'`) and strict finite number constraints (rejecting `NaN`, `Infinity`, and unphysical negative dimensions).
3. **Practice & Demonstration Isolation:** Demonstration mode and defect injection drills allow interactive fault exploration on known golden circuits without mutating student progress or awarding stage certification XP.
4. **Pedagogical Scope Transparency:** All sanity checks and ruledeck models utilize closed-form analytical models, Manhattan grid approximations, and educational timing equations. They are pedagogical learning instruments, not foundry-certified signoff EDA tools.

---

## 2. Design Artifact Schema Specification

Every design artifact emitted by activity validators and stored in the student progression state adheres to the following structured contract:

### Header Contract Schema (`createDesignArtifact`)
```json
{
  "contractVersion": "2.0.0",
  "schemaVersion": 2,
  "artifactKind": "floorplan.layout | placement.layout | cts.clock_tree | routing.interconnect | filler_cells.density | gds.stream",
  "stageId": "floorplanning | placement | cts | routing | filler-cells | gds",
  "levelId": "fp-5 | pl-5 | cts-5 | rt-5 | fc-5 | ...",
  "timestamp": 1741200000000,
  "generator": "validateFPKingdom | validatePLKingdom | ...",
  "status": "VALIDATED | BLOCKED | REJECTED",
  "summary": "Human-readable summary of physical signoff metrics",
  "payload": { ... }
}
```

### Stage Payloads:
- **`floorplan.layout`**:
  `dieWidthUm` (10-1000 µm), `dieHeightUm` (10-1000 µm), `coreMarginUm` (>= 15 µm), `macroHaloUm` (>= 10 µm), `utilizationPct` (10-95%), `powerStripeCount` (>= 4), `powerStripeWidthUm` (>= 2 µm), `irDropEstimateMv` (<= 50 mV).
- **`placement.layout`**:
  `placedCellsCount` (> 0), `overlapCount` (=== 0), `densityRatio` (0.10-0.90), `hpwlScore` (> 0), `congestionScore` (<= 0.85), `siteSnappingViolations` (=== 0).
- **`cts.clock_tree`**:
  `skewPs` (<= 50 ps), `maxLatencyPs` (<= 1500 ps), `minLatencyPs` (>= 0 ps), `sinkCount` (>= 4), `bufferLevels` (>= 1), `powerMw` (<= 5.0 mW), `setupSlackPs` (>= 0 ps), `holdSlackPs` (>= 0 ps).
- **`routing.interconnect`**:
  `drcViolations` (=== 0), `lvsOpenCount` (=== 0), `lvsShortCount` (=== 0), `unconnectedPins` (=== 0), `maxVictimNoiseMv` (<= 50 mV), `viaResistanceEnclosureOk` (true).
- **`filler_cells.density`**:
  `metalDensityPct` (20-80%), `rowContinuityOk` (true), `wellSpacingDrc` (=== 0), `decapCount` (> 0), `tapPitchSites` (<= 30 sites), `worstVoltageDroopMv` (<= 50 mV), `gateLeakageUa` (<= 25 µA).

---

## 3. Comprehensive 26 Sanity Check Implementation Matrix

| Stage | Check ID | Display Name | Required Artifact Kind | Mandatory Metrics & Bounds | Pass/Fail Threshold | Fail-Closed Rejection Condition | Defect Drill Behavior | Pedagogical Objective |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Floorplanning** | `fp-drc` | Floorplan DRC | `floorplan.layout` | `coreMarginUm >= 15`, `macroHaloUm >= 10` | 0 DRC violations | Missing `fp-4`/`fp-5` layout geometry | Injects 5 µm halo encroachment | Enforces macro boundary clearance and foundry seal-ring margins. |
| Floorplanning | `fp-connectivity` | Power Mesh LVS | `floorplan.layout` | `powerStripeCount >= 4`, `powerStripeWidthUm >= 2` | 0 opens in PG straps | Missing power ring/stripe definition | Injects missing VDD trunk strap | Demonstrates power grid strap density needed to prevent supply disconnection. |
| Floorplanning | `fp-missing-vias` | PG Mesh Via Array | `floorplan.layout` | `viaCount >= stripeCount * 4` | 0 missing PG via cuts | Missing floorplan coordinates | Injects severed M4-M5 via matrix | Teaches via-array current density and electromigration prevention. |
| **Placement** | `pl-legality` | Cell Legality | `placement.layout` | `overlapCount === 0`, `siteSnappingViolations === 0` | Legal grid snapped, 0 overlaps | Missing `pl-2`/`pl-5` cell coordinates | Injects overlapping inverter pair | Teaches standard cell row site quantization and illegal cell overlaps. |
| Placement | `pl-congestion` | Global Congestion | `placement.layout` | `congestionScore <= 0.85` | GRC capacity overflow = 0 | Missing placement density metrics | Injects 1.25 overflow hotspot | Illustrates pin-density routability hotspots in dense standard cell blocks. |
| Placement | `pl-drc` | Boundary DRC | `placement.layout` | `boundaryViolations === 0`, `orientationsOk === true` | Clean cell abutment | Missing macro/cell placement | Injects flipped orientation cell | Demonstrates standard cell abutment and well tap alignment rules. |
| Placement | `pl-connectivity` | Netlist Binding | `placement.layout` | `unplacedPinCount === 0` | 100% logic pins placed | Missing netlist placement artifact | Injects unplaced memory macro pin | Validates that all netlist instances are assigned physical sites. |
| Placement | `pl-missing-vias` | Pin Access DRC | `placement.layout` | `accessiblePinsPct >= 98.0%` | 0 pin-access blockages | Missing pin coordinate payload | Injects blocked M1 pin target | Teaches M1 pin access routing feasibility in advanced sub-micron nodes. |
| **CTS** | `cts-timing-reports` | Clock Timing & Skew | `cts.clock_tree` | `skewPs <= 50`, `maxLatencyPs <= 1500` | Target skew & latency met | Missing `cts-2`/`cts-5` clock tree | Injects 120 ps skew mismatch | Demonstrates launch-capture clock skew impact on setup/hold timing margin. |
| CTS | `cts-power` | Clock Dynamic Power | `cts.clock_tree` | `powerMw <= 5.0` | Clock buffer power <= budget | Missing buffer count & frequency | Injects oversized buffer tree (8 mW) | Shows clock network switching power trade-offs vs tree skew balance. |
| CTS | `cts-qor` | Slew & Latency QoR | `cts.clock_tree` | `maxTransitionPs <= 100`, `minLatencyPs >= 100` | Slew targets achieved | Missing clock slew reports | Injects 180 ps degraded clock edge | Teaches clock signal slew rates required to maintain clean edge transitions. |
| CTS | `cts-clock-tree-report` | Clock Topology | `cts.clock_tree` | `sinkCount >= 4`, `bufferLevels >= 1` | Balanced H-tree / trunk network | Missing clock distribution tree | Injects single unbuffered daisy chain | Explains structured H-tree and fishbone balanced clock distributions. |
| **Routing** | `rt-routes` | Detailed Routing DRC | `routing.interconnect` | `drcViolations === 0` | 0 metal spacing/width errors | Missing `rt-1`/`rt-5` route segments | Injects M2 spacing violation (22 nm) | Enforces foundry metal minimum width and pitch design rules. |
| Routing | `rt-lvs` | Interconnect LVS | `routing.interconnect` | `lvsOpenCount === 0`, `lvsShortCount === 0` | 100% netlist topological match | Missing routed netlist artifact | Injects bridge short between Net_A and Net_B | Teaches schematic-vs-layout continuity and short circuit detection. |
| Routing | `rt-timing` | Post-Route RC Slack | `routing.interconnect` | `setupSlackPs >= 0`, `holdSlackPs >= 0` | Zero negative slack (WNS >= 0) | Missing parasitic RC extraction | Injects high-resistance wire segment | Demonstrates distributed wire RC delay effects on post-route timing closure. |
| Routing | `rt-design` | Antenna DRC | `routing.interconnect` | `antennaRatioViolations === 0` | Diode protection / layer jumper valid | Missing interconnect metal area | Injects unbridged gate antenna ratio | Teaches plasma-etch gate oxide antenna ratio protection rules. |
| Routing | `rt-constraints` | Crosstalk & SI | `routing.interconnect` | `maxVictimNoiseMv <= 50` | Victim glitch <= noise threshold | Missing `rt-4`/`rt-5` coupling cap | Injects 180 mV coupling glitch | Illustrates mutual capacitance crosstalk glitches and signal integrity mitigation. |
| **Filler Cells** | `fc-legality` | Continuous Base Layer | `filler_cells.density` | `rowContinuityOk === true`, `gapCount === 0` | Zero non-standard-cell gaps | Missing `fc-1`/`fc-5` row fill data | Injects 3-site unpopulated gap | Teaches continuous active diffusion layer requirements across cell rows. |
| Filler Cells | `fc-drc` | Well Continuity DRC | `filler_cells.density` | `wellSpacingDrc === 0` | Continuous N-well tap ring | Missing `fc-3`/`fc-5` well geometry | Injects 2-site N-well notch gap | Enforces N-well to P-substrate isolation and foundry well spacing rules. |
| Filler Cells | `fc-connectivity` | Substrate Tap Pitch | `filler_cells.density` | `tapPitchSites <= 30` | Tap cell distance <= rule limit | Missing tap cell insertion record | Injects 45-site un-tapped spacing | Explains CMOS latchup prevention and maximum well tap distance rules. |
| Filler Cells | `fc-design` | Dummy Poly/Diffusion | `filler_cells.density` | `polyDensityPct >= 15.0%` | Local poly uniformity satisfied | Missing dummy poly payload | Injects 8% depleted poly region | Demonstrates lithography optical proximity correction (OPC) uniformity. |
| Filler Cells | `fc-timing` | Post-Fill Parasitic Drift | `filler_cells.density` | `slackDeltaPs <= 5` | Timing slack preserved after fill | Missing post-fill extraction data | Injects excessive parasitic loading | Validates that passive dummy cell insertion does not perturb critical nets. |
| Filler Cells | `fc-constraints` | Power Integrity & Decap | `filler_cells.density` | `worstVoltageDroopMv <= 50` | Dynamic droop <= margin | Missing `fc-4`/`fc-5` decap metrics | Injects 85 mV IR/Ldi/dt droop | Teaches on-die decap capacitor placement for dynamic supply droop suppression. |
| Filler Cells | `fc-power` | Decap Gate Leakage | `filler_cells.density` | `gateLeakageUa <= 25` | Leakage current <= budget | Missing decap sizing payload | Injects thin-oxide leakage overload | Highlights trade-off between decap capacitance and sub-threshold/gate leakage. |
| Filler Cells | `fc-qor` | CMP Metal Density | `filler_cells.density` | `metalDensityPct >= 20 && <= 80` | Metal density in signoff window | Missing fill density map | Injects 12% under-dense metal tile | Teaches chemical mechanical planarization (CMP) oxide erosion/dishing limits. |
| Filler Cells | `fc-congestion` | Engineering ECO Margin | `filler_cells.density` | `spareGateAvailable === true` | Reserved spare cell sites intact | Missing ECO spare cell mapping | Injects 0% spare gate allocation | Explains functional ECO spare cell preservation for post-tapeout mask fixes. |

---

## 4. Replay & Idempotence Rules

1. **Earned XP Delta:** Replaying an activity or sanity check recalculates XP based on incremental improvement:
   $$\Delta \text{XP} = \max(0, \text{NewEarnedXP} - \text{PreviouslyRecordedXP})$$
2. **Artifact State Replacement:** Re-completing an activity replaces the prior stage artifact cleanly in `studentDesignArtifacts` without corrupting unrelated kingdom artifacts.
3. **No Certification Double-Dipping:** Passing an already certified sanity check confirms signoff status but awards $0\text{ XP}$ to preserve progressive merit integrity.
