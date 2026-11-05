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
3. **Practice & Demonstration Isolation:** Exactly 11 stage sanity checks are classified as `PRACTICE_ONLY`. They serve as interactive demonstration drills and fault exploration sandboxes without mutating student progress or awarding stage certification XP.
4. **Honest 15-Check Certification:** Exactly 15 stage sanity checks are classified as `CERTIFIABLE_EDUCATIONAL_CHECK`. They extract genuine student design measurements and evaluate them against strict physical design rules for +25 XP certification.
5. **Pedagogical Scope Transparency:** All sanity checks and ruledeck models utilize closed-form analytical models, Manhattan grid approximations, and educational timing equations. They are pedagogical learning instruments, not foundry-certified signoff EDA tools.

---

## 2. Design Artifact Schema Specification

Every design artifact emitted by activity validators and stored in the student progression state adheres to the following structured contract:

### Header Contract Schema (`createDesignArtifact`)
```json
{
  "contractVersion": "2.0.0",
  "schemaVersion": 2,
  "kind": "floorplan.layout | placement.layout | cts.clock_tree | routing.interconnect | filler_cells.density | gds.mask_stream",
  "sourceLevelId": "fp-5 | pl-5 | cts-5 | rt-5 | fc-5 | ...",
  "modelVersion": 2,
  "createdAt": "2026-11-05T12:00:00.000Z",
  "inputs": { ... },
  "measurements": { ... },
  "units": { ... }
}
```

### Stage Artifact Payloads:
- **`floorplan.layout`**:
  `margin` (>= 20 µm), `halo` (>= 15 µm), `dieWidth`, `dieHeight`, `utilization`.
- **`placement.layout`**:
  `cells` (Array of legal non-overlapping `{ id, x, y, width, height }`), `maxCongestion` (<= 1.0), `offRailCells` (=== 0).
- **`cts.clock_tree`**:
  `skewPs` (<= 50 ps), `latencyPs` (<= 1500 ps), `powerMw` (<= 5.0 mW), `setupSlack` (>= 0), `holdSlack` (>= 0).
- **`routing.interconnect`**:
  `shorts` (=== 0), `lvsMatch` (true), `viaEnclosureUm` (>= 0.010 µm), `drcErrors` (=== 0), `glitchVoltageMv` (<= 50 mV).
- **`filler_cells.density`**:
  `emptySites` (=== 0), `baseDrcViolations` (=== 0), `wellContinuityMet` (true), `droopMv` (<= 40 mV), `leakageUa` (<= 20.0 µA).

---

## 3. Comprehensive 26 Sanity Check Implementation Matrix

| Kingdom | Check ID | Classification | Prerequisite Levels | Required Artifact Kind | Mandatory Metrics | Sign-Off Threshold | Practice Drill / Defect Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Floorplanning** | `fp-drc` | **CERTIFIABLE** | `fp-4`, `fp-5` | `floorplan.layout` | `margin`, `halo` | `margin >= 20`, `halo >= 15` | Injects 8 µm halo defect (fails) |
| Floorplanning | `fp-connectivity` | **PRACTICE ONLY** | `fp-5` | N/A | Practice demo | 0 floating pins, ring continuous | Injects broken power ring and floating pins |
| Floorplanning | `fp-missing-vias` | **PRACTICE ONLY** | `fp-5` | N/A | Practice demo | 0 missing via cuts | Injects missing via matrix cuts |
| **Placement** | `pl-legality` | **CERTIFIABLE** | `pl-2`, `pl-5` | `placement.layout` | `cells` array | 0 active cell overlaps | Injects overlapping cell pair |
| Placement | `pl-congestion` | **CERTIFIABLE** | `pl-4` | `placement.layout` | `maxCongestion` | `maxCongestion <= 1.0` | Injects 1.35 GCell congestion overflow |
| Placement | `pl-drc` | **PRACTICE ONLY** | `pl-5` | N/A | Practice demo | Well tap pitch <= 30 µm | Injects 38 µm latchup tap violation |
| Placement | `pl-connectivity` | **PRACTICE ONLY** | `pl-5` | N/A | Practice demo | 0 unplaced signal pins | Injects unplaced logic terminals |
| Placement | `pl-missing-vias` | **CERTIFIABLE** | `pl-5` | `placement.layout` | `offRailCells` | `offRailCells === 0` | Injects off-rail cell instances |
| **CTS** | `cts-clock-tree-report` | **CERTIFIABLE** | `cts-5` | `cts.clock_tree` | `skewPs`, `latencyPs` | `skewPs <= 50 ps` | Injects 110 ps clock skew mismatch |
| CTS | `cts-timing-reports` | **CERTIFIABLE** | `cts-2` | `cts.clock_tree` | `setupSlack`, `holdSlack` | `setupSlack >= 0 && holdSlack >= 0` | Injects excessive combinational path delay |
| CTS | `cts-power` | **CERTIFIABLE** | `cts-3`, `cts-5` | `cts.clock_tree` | `powerMw` | `powerMw <= 5.0 mW` | Injects 8.5 mW oversized clock buffers |
| CTS | `cts-qor` | **PRACTICE ONLY** | `cts-5` | N/A | Practice demo | Clock slew <= 80 ps | Injects 110 ps degraded transition slew |
| **Routing** | `rt-lvs` | **CERTIFIABLE** | `rt-5` | `routing.interconnect` | `shorts`, `lvsMatch` | `shorts === 0 && lvsMatch === true` | Injects bridge short between M1 tracks |
| Routing | `rt-design` | **CERTIFIABLE** | `rt-3` | `routing.interconnect` | `viaEnclosureUm`, `drcErrors` | `viaEnclosureUm >= 0.010 && drcErrors === 0` | Injects 5 nm via enclosure violation |
| Routing | `rt-constraints` | **CERTIFIABLE** | `rt-4` | `routing.interconnect` | `glitchVoltageMv` | `glitchVoltageMv <= 50 mV` | Injects 65 mV crosstalk coupling noise |
| Routing | `rt-routes` | **PRACTICE ONLY** | `rt-5` | N/A | Practice demo | 0 unrouted nets (opens) | Injects 2 open route segments |
| Routing | `rt-timing` | **PRACTICE ONLY** | `rt-5` | N/A | Practice demo | Post-route WNS >= 0 ps | Injects -55 ps worst negative slack |
| **Filler Cells** | `fc-legality` | **CERTIFIABLE** | `fc-5` | `filler_cells.density` | `emptySites` | `emptySites === 0` | Injects unfilled discrete row voids |
| Filler Cells | `fc-drc` | **CERTIFIABLE** | `fc-5` | `filler_cells.density` | `baseDrcViolations` | `baseDrcViolations === 0` | Injects base diffusion notch violations |
| Filler Cells | `fc-connectivity` | **CERTIFIABLE** | `fc-3` | `filler_cells.density` | `wellContinuityMet` | `wellContinuityMet === true` | Injects floating N-well bias gap |
| Filler Cells | `fc-constraints` | **CERTIFIABLE** | `fc-4` | `filler_cells.density` | `droopMv` | `droopMv <= 40 mV` | Injects 75 mV dynamic IR droop |
| Filler Cells | `fc-power` | **CERTIFIABLE** | `fc-4` | `filler_cells.density` | `leakageUa` | `leakageUa <= 20.0 µA` | Injects 35 µA gate tunneling overload |
| Filler Cells | `fc-design` | **PRACTICE ONLY** | `fc-5` | N/A | Practice demo | CMP density 35% - 75% | Injects 26.5% under-dense metal region |
| Filler Cells | `fc-timing` | **PRACTICE ONLY** | `fc-5` | N/A | Practice demo | Post-fill timing delta >= -5 ps | Injects -18 ps timing regression |
| Filler Cells | `fc-qor` | **PRACTICE ONLY** | `fc-5` | N/A | Practice demo | IR supply margin >= 95.0% | Injects 88.5% degraded supply margin |
| Filler Cells | `fc-congestion` | **PRACTICE ONLY** | `fc-5` | N/A | Practice demo | 0 blocked pin access sites | Injects blocked pin sites |

---

## 4. Replay & Idempotence Rules

1. **Earned XP Delta:** Replaying an activity or sanity check recalculates XP based on incremental improvement:
   $$\Delta \text{XP} = \max(0, \text{NewEarnedXP} - \text{PreviouslyRecordedXP})$$
2. **Artifact State Replacement:** Re-completing an activity replaces the prior stage artifact cleanly in `studentDesignArtifacts` without corrupting unrelated kingdom artifacts.
3. **No Certification Double-Dipping:** Passing an already certified sanity check confirms signoff status but awards $0\text{ XP}$ to preserve progressive merit integrity.
4. **Stale Certification Revalidation:** If a student modifies their design such that a previously certified sanity check is invalidated, that certification is flagged `stale: true, certified: false` until re-verified.
