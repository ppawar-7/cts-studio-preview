# ASIC Physical Design Playground — Project Milestones & Progress Log

This document records the chronological development, architectural evolutions, bug fixes, hardening passes, and verification milestones of PD Playground (`Game-Site`).

---

## Milestone 0: Upstream Baseline & Initial Audit
- **Baseline Commit**: `b5749d86f2f6c27e6587e211cc1982411ed17d16` (by `mvaghasiya7`).
- **Initial State**: Static UI prototype with World Map, mock Level Pages, and simulated XP increments. No interactive engineering activities, no pure validators, no physics engines.
- **Direction Alignment**:
  - Recognized that standalone repositories `ppawar-7/rtl-playground` and `ppawar-7/sta-playground` already exist as full laboratories.
  - Game-Site designated as the **central gamified UI and progression gating engine**, with the remaining physical design kingdoms built around it.

---

## Milestone 1: RTL Kingdom Implementation & UI/UX Hardening
- **Completed Level**: `rtl-1` interactive 2:1 MUX challenge.
- **Architectural Overhaul**:
  - Implemented `ActivityHost` architecture to decouple UI components from pure validators.
  - Replaced low-contrast dark-on-dark multiple choice cards with high-contrast, accessible light-themed learning options.
  - Created pure mathematical validator `validateMuxChallenge.js` evaluating all 8 truth table rows.
  - Fixed Level 2 navigation: correctly displaying "Unlocked — Coming Soon" instead of showing a lock icon while claiming unlock.
  - Added standalone RTL Playground studio card linking to `https://ppawar-7.github.io/rtl-playground/`.

---

## Milestone 2: Full 8-Kingdom Platform Architecture & Implementation
- **Implementation Scope**: Built all remaining 7 kingdoms and 39 interactive activities:
  - **Kingdom 1 (RTL)**: Levels 1–5 (`rtl-1` to `rtl-5`)
  - **Kingdom 2 (Synthesis)**: Levels 1–5 (`syn-1` to `syn-5`)
  - **Kingdom 3 (Floorplanning)**: Levels 1–5 (`fp-1` to `fp-5`)
  - **Kingdom 4 (Placement)**: Levels 1–5 (`pl-1` to `pl-5`)
  - **Kingdom 5 (CTS)**: Levels 1–5 (`cts-1` to `cts-5`)
  - **Kingdom 6 (Routing)**: Levels 1–5 (`rt-1` to `rt-5`)
  - **Kingdom 7 (Filler Cells)**: Levels 1–5 (`fc-1` to `fc-5`)
  - **Kingdom 8 (GDSII & Tape-Out)**: Levels 1–5 (`gds-1` to `gds-5`)
- **Domain Engines**: Created 9 deterministic numerical engines (`digitalLogic`, `synthesisEngine`, `geometryEngine`, `placementEngine`, `ctsEngine`, `routingEngine`, `fillerCellsEngine`, `gdsEngine`, `sanityCheckEngine`).
- **Sanity Checks**: Integrated 26 interactive stage sanity check ruledecks into an interactive EDA terminal.
- **Vitest Suites**: Added unit test suites expanding coverage to 182 tests.

---

## Milestone 3: Progression Mathematics & Engine Hardening Pass
- **Audit Findings**: Independent review detected that cumulative XP required to unlock levels ($0, 25, 60, 105, 160$) was misaligned with 2-star scoring awards.
- **Progression Recalibration**:
  - Established uniform 2-star threshold: any score $\ge 24\ \text{XP}$ awards 2 stars.
  - Level unlock gates adjusted to: $0, 20, 44, 72, 104\ \text{XP}$.
  - Kingdom unlock gate set to: $140\ \text{XP}$.
  - Verified with `test_2star_progression_math.cjs`: Zero progression deadlocks across all 8 kingdoms.
- **Formula Auditing**: Corrected Elmore delay models, signed two's complement overflow logic ($V$), and DRC spacing calculations.
- **Vitest Expansion**: Expanded test suite from 182 to 303 automated tests across 23 test suites.

---

## Milestone 4: Headless Browser Acceptance & Full Acceptance Journey
- **Browser Automation Harness**: Created `tests/test_full_40_browser_journey.cjs` driving real headless Chromium via Chrome DevTools Protocol (CDP).
- **Closure Fixes**:
  - Resolved React stale closure issues in `RTLMuxChallenge.jsx`, `FCWellContinuityChallenge.jsx`, and `CTSKingdomChallenge.jsx` by migrating state setters to functional updater form `setState(prev => ...)`.
  - Fixed GCell congestion ratio matrix indexing in `PLCongestionChallenge.jsx`.
  - Disambiguated submit buttons from interactive audit cards in `GDSSignoffChecksChallenge.jsx`.
- **Journey Results**:
  - Completed all 40 levels across all 8 kingdoms with 100% pass rate.
  - Verified defect injection drills in all sanity check terminals.
  - Captured 8 full-page screenshots of each kingdom and the final taped-out World Map.
  - Confirmed 100% offline execution with zero external network requests.

---

## Milestone 5: Studio Integration & Private Repository Setup
- **Studio Bridge Enhancement**:
  - Clarified STA's role across Synthesis, Placement, CTS, and Routing in `KingdomPage.jsx` and `LevelPage.jsx`.
  - Added explicit technical guidance that CTS builds clock trees while STA verifies timing.
  - Embedded direct launch links to `https://ppawar-7.github.io/rtl-playground/` and `https://ppawar-7.github.io/sta-playground/`.
- **Complete Documentation Matrix**: Finalized all 12 root engineering documents.
- **Private Repository Preparation**: Configured private remote and verified zero secrets/tokens.

---

## Milestone 6: Native Studio Embedding, Student Design Sanity Checks & 26-Check Verification
- **Native Studio Embedding (Zero Cloud / Offline)**:
  - Copied compiled standalone suites directly into `public/studios/rtl/` and `public/studios/sta/`.
  - Created dedicated full-page routes: `/studio/rtl` (full 24-lesson simulator, schematic viewer, waveforms, ALU, FSM) and `/studio/sta` (timing graph analyzer, setup/hold histograms, stage context selectors).
  - Added collapsible in-page studio workspaces on Kingdom pages and studio companion modals on Level pages.
- **Student Design Context Schema & Sanity Check Engine**:
  - Implemented `src/logic/studentDesignContext.js` mapping all 26 checks to prerequisite levels (`fp-4/5`, `pl-1..5`, `cts-2..5`, `rt-1..5`, `fc-1..5`).
  - Gated sanity check certification behind genuine student design artifacts. Rejects audits if prerequisite levels are incomplete.
  - Separated demonstration fault drills into practice-only mode (`canCertify: false`, zero certification XP).
  - Appended educational EDA scope disclosures across all ruledecks.
- **Test Matrix Expansion**:
  - Created `src/tests/logic/studentDesignContext.test.js` (6 tests).
  - Created `src/tests/engine/all26SanityChecksIndividual.test.js` (105 tests verifying all 26 checks across prerequisite rejection, demo isolation, defect injection, and valid sign-off).
  - Vitest test suite expanded to **419 passed tests across 25 suites**.
- **Browser E2E Verification**:
  - Created `tests/test_studios_and_all_26_sanity_checks.cjs` verifying both embedded studios, prerequisite gating, demonstration drills, and genuine student design certification.
- **Repository Provenance & Licensing**:
  - Updated `README.md` with private clone URL (`https://github.com/ppawar-7/pd-playground-game-private.git`).
  - Replaced unsupported MIT claims with accurate Source Provenance & Intellectual Property disclosure.



---

## Milestone 4: Design Artifact Contract Pipeline & Final Full-Platform Hardening (Completed)
- **Design Artifact Contracts**: Implemented `src/logic/designArtifactContracts.js` with versioned schemas (`contractVersion: '2.0.0'`), finite number validation, and strict property checking.
- **Activity Validator Connections**: Connected all capstone and prerequisite validators (`fp-4`, `fp-5`, `pl-2`, `pl-4`, `pl-5`, `cts-2`, `cts-5`, `rt-3`, `rt-4`, `rt-5`, `fc-3`, `fc-4`, `fc-5`) to emit genuine physical design artifacts.
- **Fail-Closed Sanity Check Engine**: Updated `src/engine/sanityCheckEngine.js` and `src/logic/studentDesignContext.js` to fail closed on missing student designs, removing unearned passing fallbacks.
- **Replay & Progression Engine**: Enhanced `progressionEngine.js` and `LevelPage.jsx` to compute clean XP deltas and prevent duplicate stage check rewards.
- **100% Offline Isolation**: Removed external Google Fonts calls from `public/studios/sta/index.html`, ensuring zero external network requests.
- **Test Suite Verification**: Vitest test suite expanded to 436 tests across 27 suites (all passing). Browser E2E test suites verified 100% across all 8 kingdoms.
