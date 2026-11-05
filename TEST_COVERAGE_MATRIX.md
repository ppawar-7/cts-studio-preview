# ASIC Physical Design Playground — Test Coverage & Verification Matrix

This document provides a comprehensive test coverage matrix detailing the **25 automated Vitest test suites (419 tests)**, browser-based headless CDP tests, sanity check test harnesses, and end-to-end verification scripts in PD Playground (`Game-Site`).

---

## 1. Test Architecture Overview

PD Playground utilizes a multi-tiered verification strategy designed to ensure complete mathematical, logical, and user-experience correctness:

```mermaid
flowchart TD
    subgraph Tier1 ["Tier 1: Pure Unit & Integration Tests (Vitest)"]
        EngTests["10 Domain & Sanity Check Test Suites (180 tests)"]
        ValTests["8 Activity Validator Suites (74 tests)"]
        ProgTests["Logic, Schema & Progression Suites (27 tests)"]
        CurricTests["Curriculum Full-Matrix Suites (120 tests)"]
        CompTests["ActivityHost Component Tests (10 tests)"]
        StudioTests["Student Design Extraction & 26-Check Suites (111 tests)"]
    end

    subgraph Tier2 ["Tier 2: Mathematical Calibration Scripts (Node.js)"]
        ProgMath["test_2star_progression_math.cjs (Zero Deadlock Proof)"]
    end

    subgraph Tier3 ["Tier 3: Browser E2E Headless CDP Journeys (Chromium/Edge)"]
        CDPStudios["test_studios_and_all_26_sanity_checks.cjs (Native Studios & 26 Checks)"]
        CDPAll["test_full_40_browser_journey.cjs (40/40 Levels + 26 Sanity Checks)"]
        Screenshots["Native Studios & Modal Certification Proofs"]
        Offline["Network Privacy & 100% Offline Audit"]
    end

    Tier1 --> Tier2 --> Tier3
```

---

## 2. Vitest Test Suite Breakdown (419 Tests Across 25 Suites)

All Vitest tests run locally via `npm test` or `npx vitest run`:

| Category | Test Suite File | Tests | Focus Area & Verified Behaviors |
| :--- | :--- | :---: | :--- |
| **Logic & Progression** | `src/tests/logic/curriculumProgression.test.js` | 7 | Next level unlocks, kingdom thresholds, 2-star progression, edge cases. |
| **Logic & Progression** | `src/tests/logic/progressionIntegration.test.js` | 5 | End-to-end multi-kingdom unlocking, cumulative score updates, star persistence. |
| **Logic & Progression** | `src/tests/logic/storageMigration.test.js` | 4 | Backward-compatible schema migration (v1 legacy to v2 structured). |
| **Logic & Progression** | `src/tests/logic/studentDesignContext.test.js` | 6 | Prerequisite mapping, artifact extraction across all 26 checks, missing prerequisite rejection. |
| **Domain Engine** | `src/tests/engine/digitalLogic.test.js` | 15 | 2:1 MUX, DFF async reset, 8-bit ripple adder, signed overflow ($V$), 4-state FSM. |
| **Domain Engine** | `src/tests/engine/geometryEngine.test.js` | 9 | Core/die sizing, aspect ratios, macro keepouts, DC IR ring drop. |
| **Domain Engine** | `src/tests/engine/synthesisEngine.test.js` | 3 | Combinational load delay, dynamic switching power, Boolean equivalence. |
| **Domain Engine** | `src/tests/engine/placementEngine.test.js` | 5 | Site grid alignment, weighted HPWL, GCell congestion, well-tap pitch. |
| **Domain Engine** | `src/tests/engine/ctsEngine.test.js` | 5 | Skew sign conventions, setup/hold slack formulas, clock tree topologies. |
| **Domain Engine** | `src/tests/engine/routingEngine.test.js` | 7 | Wire sheet resistance, Elmore delay, DRC clearance, crosstalk derating. |
| **Domain Engine** | `src/tests/engine/fillerCellsEngine.test.js` | 6 | Standard cell row continuity, decap droop suppression, gate oxide leakage. |
| **Domain Engine** | `src/tests/engine/gdsEngine.test.js` | 3 | Antenna area ratios, CMP metal density sliding windows, sign-off gating. |
| **Domain Engine** | `src/tests/engine/sanityCheckEngine.test.js` | 32 | All 26 physical design ruledeck checks, defect injection tolerance, student vs demo modes. |
| **Domain Engine** | `src/tests/engine/all26SanityChecksIndividual.test.js` | 105 | **Comprehensive 26-Check Matrix**: Evaluates every single sanity check across missing-prerequisite rejection (26), demo certification isolation (26), demo defect injection (26), and valid student design sign-off (26). |
| **Activity Validators** | `src/tests/activities/rtlValidators.test.js` | 9 | Validators for `rtl-1` through `rtl-5`: rejection of incomplete inputs, exact scores. |
| **Activity Validators** | `src/tests/activities/rtlMuxChallenge.test.js` | 6 | Detailed 8-row truth table verification for `rtl-1`. |
| **Activity Validators** | `src/tests/activities/synthesisValidators.test.js` | 6 | Validators for `syn-1` through `syn-5`. |
| **Activity Validators** | `src/tests/activities/floorplanningValidators.test.js` | 6 | Validators for `fp-1` through `fp-5`. |
| **Activity Validators** | `src/tests/activities/placementValidators.test.js` | 10 | Validators for `pl-1` through `pl-5`. |
| **Activity Validators** | `src/tests/activities/ctsValidators.test.js` | 10 | Validators for `cts-1` through `cts-5`. |
| **Activity Validators** | `src/tests/activities/routingValidators.test.js` | 10 | Validators for `rt-1` through `rt-5`. |
| **Activity Validators** | `src/tests/activities/fillerCellsValidators.test.js` | 10 | Validators for `fc-1` through `fc-5`. |
| **Activity Validators** | `src/tests/activities/gdsValidators.test.js` | 10 | Validators for `gds-1` through `gds-5`. |
| **Curriculum Full-Matrix** | `src/tests/activities/allFortyCurriculumActivities.test.js` | 120 | Full 40-level test battery: evaluates valid inputs, invalid/empty inputs, and boundary scores. |
| **UI Component** | `src/tests/components/activityHost.test.js` | 10 | ActivityHost mounting, score calculation, star dispatch, and retry workflows. |
| **TOTAL** | **25 Test Suites** | **419 Tests** | **100% Passing (Execution duration: ~1.06s)** |

---

## 3. Dedicated 26 Sanity Check Verification Matrix

Every physical design sanity check is tested across four distinct lifecycle conditions:
1. **Missing Prerequisite Rejection**: Verifies that when a student has not completed the prerequisite level(s), `canCertify` is `false`, audit terminates with `passed: false`, and clear prerequisite violation logs are issued.
2. **Demonstration Certification Isolation**: Verifies that in Demonstration Mode (`isStudentDesign: false`), `isDemonstration` is `true` and `canCertify` is `false` (guaranteeing that practice fault drills never award certification XP).
3. **Fault Injection Detection**: Verifies that when intentional physical defects are injected in demonstration mode, the ruledeck detects the fault and fails (`passed: false`).
4. **Valid Student Design Sign-Off**: Verifies that when prerequisites are completed and valid student layout parameters exist, the audit completes clean (`passed: true`), awards stage certification (`canCertify: true`), and logs educational scope disclosures.

| Sanity Check ID | Stage | Prerequisite Levels | Key Verified Parameter |
| :--- | :--- | :--- | :--- |
| `fp-drc` | Floorplanning | `fp-4`, `fp-5` | Core boundary margin (>= 20 µm) & macro halo (>= 15 µm) |
| `fp-connectivity` | Floorplanning | `fp-5` | Closed-loop VDD/VSS power ring continuity |
| `fp-missing-vias` | Floorplanning | `fp-5` | Orthogonal power mesh via cut completeness |
| `pl-legality` | Placement | `pl-1`, `pl-2` | Site row grid alignment & zero cell active area overlap |
| `pl-congestion` | Placement | `pl-4` | GCell 2D routing demand overflow ($D/C \le 1.0$) |
| `pl-drc` | Placement | `pl-2`, `pl-5` | N-well abutment & minimum cell clearance |
| `pl-connectivity` | Placement | `pl-3`, `pl-5` | Standard cell logical signal net pin connections |
| `pl-missing-vias` | Placement | `pl-5` | Well-tap cell spacing ($\le 30$ µm) & rail tie-offs |
| `cts-timing-reports` | CTS | `cts-2` | Setup & hold slack margins with real clock skew |
| `cts-power` | CTS | `cts-3`, `cts-5` | Clock tree buffer switching power budget ($\le 5.0$ mW) |
| `cts-qor` | CTS | `cts-4`, `cts-5` | Maximum clock transition slew ($\le 80$ ps) |
| `cts-clock-tree-report`| CTS | `cts-5` | Clock arrival variance across sinks ($\text{skew} \le 30$ ps) |
| `rt-routes` | Routing | `rt-1`, `rt-5` | Detailed route track continuity & zero open nets |
| `rt-lvs` | Routing | `rt-5` | Physical interconnect vs netlist electrical shorts |
| `rt-timing` | Routing | `rt-4`, `rt-5` | Post-route distributed SPEF RC timing slack |
| `rt-design` | Routing | `rt-3`, `rt-5` | Via layer enclosure ($\ge 0.05$ µm) & metal pitch DRC |
| `rt-constraints` | Routing | `rt-4`, `rt-5` | Crosstalk noise glitch budget ($\le 50$ mV) |
| `fc-legality` | Filler Cells | `fc-1`, `fc-3` | Standard cell row site alignment & discrete cell snapping |
| `fc-drc` | Filler Cells | `fc-3`, `fc-5` | Continuous N-well & 100% standard cell row void filling |
| `fc-connectivity` | Filler Cells | `fc-3` | VDD/VSS rail abutment & substrate well bias |
| `fc-design` | Filler Cells | `fc-2`, `fc-5` | CMP poly and metal layer density window ($35\% - 75\%$) |
| `fc-timing` | Filler Cells | `fc-4`, `fc-5` | Post-filler parasitic capacitance loading ($\le 5$ ps regression)|
| `fc-constraints` | Filler Cells | `fc-4` | Transition time and max capacitance design limits |
| `fc-power` | Filler Cells | `fc-4`, `fc-5` | Decap dynamic IR droop suppression vs gate tunneling leakage|
| `fc-qor` | Filler Cells | `fc-5` | Sign-off QoR composite scorecard ($\text{score} \ge 95\%$) |
| `fc-congestion` | Filler Cells | `fc-5` | Filler pin access availability & non-blocking upper metals |

---

## 4. Browser E2E Headless CDP Acceptance Suites

### 1. `tests/test_studios_and_all_26_sanity_checks.cjs`
- **Scope**: Headless Chromium/Edge E2E verification using Chrome DevTools Protocol.
- **Key Assertions**:
  1. Route `/studio/rtl` mounts and loads the complete 24-lesson RTL studio from `/studios/rtl/index.html` with zero external network requests.
  2. Route `/studio/sta` mounts and loads the Static Timing Analysis studio from `/studios/sta/index.html` with zero external network requests.
  3. Strict architectural disclosure verified on both studio pages.
  4. Sanity check modal rejects unearned certification when student design prerequisites are incomplete.
  5. Demonstration fault drill runs with simulated defect injection, detects defect, and blocks certification XP (`canCertify: false`).
  6. Nominal demonstration drill completes with `Practice Drill Complete` and zero certification XP.
  7. Genuine student design audit certifies and awards XP when student layout geometry is present.
  8. All 26 sanity checks active and rendered across the 5 physical design kingdoms.

### 2. `tests/test_full_40_browser_journey.cjs`
- **Scope**: Complete student walkthrough of all 8 kingdoms, solving all 40 interactive activities with verified passing scores.
