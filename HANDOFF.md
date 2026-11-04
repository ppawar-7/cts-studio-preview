# ASIC Physical Design Playground — Engineering Handoff & Developer Guide

This document serves as the primary developer handoff manual for future engineers maintaining, extending, or deploying PD Playground (`Game-Site`).

---

## 1. Directory Layout & Architecture Map

```
Game-Site/
├── src/
│   ├── activities/                 # Native interactive activities for all 40 levels
│   │   ├── rtl/                    # Kingdom 1: RTL Understanding (rtl-1 to rtl-5)
│   │   ├── synthesis/              # Kingdom 2: Logic Synthesis (syn-1 to syn-5)
│   │   ├── floorplanning/          # Kingdom 3: Floorplanning (fp-1 to fp-5)
│   │   ├── placement/              # Kingdom 4: Placement (pl-1 to pl-5)
│   │   ├── cts/                    # Kingdom 5: Clock Tree Synthesis (cts-1 to cts-5)
│   │   ├── routing/                # Kingdom 6: Global & Detailed Routing (rt-1 to rt-5)
│   │   ├── filler-cells/           # Kingdom 7: Filler Cells (fc-1 to fc-5)
│   │   └── gds/                    # Kingdom 8: GDSII & Tape-Out (gds-1 to gds-5)
│   │       └── activityRegistry.js # Central dispatch map connecting level IDs to components & validators
│   │
│   ├── engine/                     # 9 Pure mathematical & EDA numerical engines
│   │   ├── geometryEngine.js       # Core area, aspect ratio, macro halos, rectangle overlap
│   │   ├── digitalLogic.js         # MUX truth tables, 8-bit adder, signed overflow, FSM
│   │   ├── synthesisEngine.js      # GTECH mapping, combinational delay, boolean equivalence
│   │   ├── placementEngine.js      # Site alignment, weighted HPWL, GCell congestion
│   │   ├── ctsEngine.js            # Skew, setup/hold slack, clock topologies, buffer sizing
│   │   ├── routingEngine.js        # Manhattan routing, sheet resistance, Elmore delay, DRC clearance
│   │   ├── fillerCellsEngine.js    # Row continuity, filler legalization, decap droop, leakage
│   │   ├── gdsEngine.js            # Layer mapping, antenna ratio, CMP density, signoff checklists
│   │   └── sanityCheckEngine.js    # Ruledeck executor for all 26 stage sanity checks
│   │
│   ├── components/                 # Shared UI chrome & widgets
│   │   ├── ActivityHost/           # Wraps activity components, executes pure validators, controls feedback
│   │   ├── KingdomCard/            # Renders kingdom progress & unlock states on world map
│   │   ├── LevelCard/              # Level cards on kingdom pages with star badges
│   │   ├── Navbar/                 # Header navigation & XP badge
│   │   └── XPBar/                  # Animated level progress bar
│   │
│   ├── context/                    # State management
│   │   └── PlayerContext.jsx       # Player state, localStorage sync, level/sanity check completion
│   │
│   ├── data/                       # Static game curriculum metadata
│   │   ├── kingdomsData.js         # The 8 kingdoms, 40 levels, and 26 sanity checks definitions
│   │   └── playerDefaults.js       # Initial player schema (v2) and achievements catalog
│   │
│   ├── logic/                      # Pure functional progression rules
│   │   ├── progressionEngine.js    # Unlock conditions, star mathematics, XP calculation
│   │   └── storageMigration.js     # Schema v1 -> v2 migration logic
│   │
│   ├── pages/                      # Top-level view routes
│   │   ├── DashboardPage/          # Stats overview & progress matrix
│   │   ├── KingdomPage/            # Part 1 Levels + Part 2 Sanity Checks + EDA Signoff Terminal
│   │   ├── LandingPage/            # Landing splash & curriculum introduction
│   │   ├── LevelPage/              # Level header, breadcrumb navigation, and ActivityHost mount
│   │   └── WorldMapPage/           # The 8 ASIC kingdoms journey road
│   │
│   └── tests/                      # 23 Vitest test suites (303+ unit & integration tests)
│       ├── activities/             # Unit tests for level validators across all 8 kingdoms
│       ├── components/             # ActivityHost tests
│       ├── engine/                 # Domain engine mathematical unit tests
│       └── logic/                  # Progression rules & curriculum unlock tests
│
├── tests/                          # Browser E2E verification scripts (Headless Chromium / CDP)
│   ├── browser_resolver.cjs        # Cross-platform browser discovery (Chrome, Edge)
│   ├── test_2star_progression_math.cjs # Zero-deadlock 2-star progression verification
│   ├── test_full_40_browser_journey.cjs # Full 40-level authentic browser acceptance journey
│   ├── test_all_40_activities_e2e.cjs # Complete 40-activity test suite
│   ├── test_fresh_student_journey.cjs # Real fresh-student browser user-journey test
│   └── test_full_platform_e2e.cjs  # Comprehensive 8-kingdom E2E test with screenshots
│
├── README.md                       # Platform overview & quick start
├── SYSTEM_ARCHITECTURE.md          # Architecture, data flow, and engine interfaces
├── GAME_ENGINE_SPEC.md             # Algorithmic specifications for all 9 domain engines
├── RTL_INTEGRATION.md              # Architectural bridge to standalone RTL Playground
├── STA_INTEGRATION.md              # STA positioning and strict CTS vs STA distinction
├── ENGINEERING_MODELS.md           # Physical design formulas, derivations, and units
├── LEARNING_CURRICULUM.md          # 40-level pedagogical roadmap & mirrored tools
├── TEST_COVERAGE_MATRIX.md         # Mapping of 303 Vitest tests and browser E2E journeys
├── PROGRESSION_RULES.md            # Unlock gates, scoring rubrics, and achievement triggers
├── KNOWN_LIMITATIONS.md            # Transparent engineering disclosures & approximations
├── PROGRESS.md                     # Chronological milestone log & hardening history
└── HANDOFF.md                      # This handoff manual
```

---

## 2. Essential Commands

All commands should be executed from the `Game-Site` root directory:

### Run Development Server
```powershell
npm run dev
```
Starts Vite dev server at `http://localhost:5173`.

### Run Automated Unit & Integration Tests (Vitest)
```powershell
npm test
```
Executes all 23 test suites (303 tests) headlessly with zero interactive prompts.

### Run Mathematical Progression Calibration Proof
```powershell
node tests/test_2star_progression_math.cjs
```
Verifies mathematically that 2-star scores ($score \ge 24\ \text{XP}$) continuously unlock all 40 levels and 8 kingdoms without deadlocks.

### Run Full 40-Level Browser Acceptance Journey (CDP)
```powershell
node tests/test_full_40_browser_journey.cjs
```
Launches headless Chromium, plays through all 40 levels, executes defect injection drills on all 26 sanity checks, captures full-page kingdom screenshots, certifies the taped-out World Map, and confirms zero external network requests.

### Build Production Bundle
```powershell
npm run build
```
Compiles and tree-shakes the entire application into `dist/` with zero build errors.

### Preview Production Build
```powershell
npm run preview
```
Serves the production build locally at `http://localhost:4173`.

---

## 3. How to Add a New Level

To add or extend a level in any kingdom:

1. **Define Level Metadata** in `src/data/kingdomsData.js`:
   ```javascript
   {
     id: 'pl-6',
     name: 'Thermal Hotspot Placement',
     order: 6,
     pointsRequired: 180,
     xpReward: 50,
     starThresholds: [25, 40, 50],
     conceptSummary: 'Mitigating localized power density via thermal-aware placement.',
   }
   ```
2. **Implement Pure Validator** in `src/activities/<kingdom>/validators/validatePl6.js`:
   ```javascript
   export function validatePl6(answers) {
     if (!answers) return { passed: false, score: 0, stars: 0, feedback: ['No solution provided.'] };
     // Evaluate engineering criteria...
     const score = isCorrect ? 50 : 25;
     return {
       passed: score >= 25,
       score,
       stars: score === 50 ? 3 : 2,
       feedback: ['Thermal gradient verified.'],
     };
   }
   ```
3. **Implement UI Component** in `src/activities/<kingdom>/Pl6ThermalPlacement.jsx`:
   - Accept `{ onComplete, isCompleted, bestScore }` props.
   - Call `onComplete(studentAnswers)` upon submission.
4. **Register in Activity Registry** (`src/activities/activityRegistry.js`):
   ```javascript
   import Pl6ThermalPlacement from './placement/Pl6ThermalPlacement.jsx';
   import { validatePl6 } from './placement/validators/validatePl6.js';
   
   registerActivity('pl-6', Pl6ThermalPlacement, validatePl6);
   ```
5. **Add Unit Test** in `src/tests/activities/placementValidators.test.js`.

---

## 4. How to Add a New Sanity Check

1. **Define Check Metadata** in `src/data/kingdomsData.js` under the relevant kingdom's `sanityChecks` array:
   ```javascript
   {
     id: 'pl-thermal',
     name: 'Thermal Gradient Sign-Off',
     fullName: 'Standard Cell Localized Thermal Gradient Audit',
     order: 6,
     category: 'PHYSICAL_VERIFICATION',
     command: 'check_thermal_map -peak_temp 85C',
     criteria: 'Peak temperature <= 85.0 deg C',
     xpReward: 20,
     icon: '🌡️',
   }
   ```
2. **Add Ruledeck Evaluation** in `src/engine/sanityCheckEngine.js`:
   ```javascript
   case 'pl-thermal': {
     logs.push('[THERMAL] Checking localized power dissipation & temperature gradient...');
     const peakTemp = context.peakTemp || 72.4;
     const passed = peakTemp <= 85.0;
     logs.push(`[THERMAL] Peak Junction Temp: ${peakTemp} C (Limit: <= 85.0 C) -> ${passed ? 'PASSED' : 'THERMAL_RUNAWAY'}`);
     break;
   }
   ```
3. **Add Test Case** in `src/tests/engine/sanityCheckEngine.test.js`.

---

## 5. Deployment Instructions

1. Run `npm run build` to generate `dist/`.
2. The output in `dist/` is 100% static HTML, CSS, and JavaScript.
3. Deploy to any static web hosting provider (GitHub Pages, Cloudflare Pages, Netlify, Vercel, S3):
   - For GitHub Pages with HashRouter: configure `base: './'` in `vite.config.js` (already configured).
   - Ensure `404.html` copies `index.html` for single-page routing if using standard HTML5 browser history.
