# ⚡ ASIC Physical Design (PD) Playground

[![Tests](https://img.shields.io/badge/Vitest-436%20passed-brightgreen.svg)]()
[![Build](https://img.shields.io/badge/Vite-production%20ready-blue.svg)]()
[![Kingdoms](https://img.shields.io/badge/ASIC%20Kingdoms-8%20of%208%20Complete-gold.svg)]()
[![Validation](https://img.shields.io/badge/Engineering%20Validation-Zero%20Sliders-purple.svg)]()
[![Offline](https://img.shields.io/badge/Privacy-100%25%20Offline%20Ready-success.svg)]()

**PD Playground** is an interactive, gamified educational platform that teaches the complete application-specific integrated circuit (ASIC) digital physical design flow — from Register-Transfer Level (RTL) to GDSII tape-out.

Built with React and Vite, the platform executes 100% locally in the browser with zero external network or cloud backend dependencies, combining interactive engineering challenges with authentic electronic design automation (EDA) ruledeck sign-off checks and natively embedded full-scale companion studios.

---

## 🏰 The 8 ASIC Kingdoms & Integrated Studios

The curriculum spans the entire standard ASIC physical implementation flow across eight kingdoms, containing **40 core concept levels**, **26 stage sanity check audits**, and **2 fully integrated native studios**:

| # | Kingdom | Concept Focus | Core Levels | Sanity Checks | Integrated Native Studio |
| :-: | :--- | :--- | :-: | :-: | :---: |
| **1** | **RTL Understanding** | Digital logic, 2:1 MUX truth tables, Verilog expressions, register-to-register transfers, FSMs | 5 | — | **[⚡ RTL Studio](/studio/rtl)** (24 Lessons, Waveforms, Schematics) |
| **2** | **Logic Synthesis** | GTECH translation, boolean optimization, technology mapping, linear delay models, power estimation | 5 | — | **[⏱️ STA Studio](/studio/sta?stage=synthesis)** (Pre-Layout STA) |
| **3** | **Floorplanning** | Die vs core sizing, aspect ratios, I/O pin placement, macro placement halos, power ring continuity | 5 | 3 | Real Student Layout Verification |
| **4** | **Placement** | Standard cell site grid snapping, weighted HPWL minimization, GCell routing congestion, well-tap spacing | 5 | 5 | **[⏱️ STA Studio](/studio/sta?stage=placement)** (Wire-Delay STA) |
| **5** | **Clock Tree Synthesis (CTS)** | Clock skew conventions, setup/hold slack timing closure, buffer tree insertion, H-Tree vs mesh topologies | 5 | 4 | **[⏱️ STA Studio](/studio/sta?stage=cts)** (Propagated Clock STA) |
| **6** | **Global & Detailed Routing** | Multi-layer track grids, Manhattan routing, sheet resistance, Elmore delay, DRC minimum spacing | 5 | 5 | **[⏱️ STA Studio](/studio/sta?stage=routing)** (Post-Route Sign-Off STA) |
| **7** | **Filler Cells & Physical Integrity** | Standard cell row continuity, base layer DRC, decap dynamic IR droop suppression, leakage penalties | 5 | 9 | Real Student Layout Verification |
| **8** | **GDSII & Tape-Out** | Stream format structures, layer stack mapping, antenna ratio diode rules, CMP metal density, final sign-off | 5 | — | Full Sign-Off Audit |

---

## 🛠️ Genuine Native Studio Embedding (Zero Cloud / Offline Ready)

PD Playground features genuine, offline-first native studio integration rather than superficial outbound link wrappers:

1. **Dedicated Full-Page Studio Workspaces**:
   - `/studio/rtl`: Houses the complete 24-lesson RTL Playground suite, schematic canvas, digital waveform generator, 8-bit ALU/datapath designer, and FSM studio.
   - `/studio/sta`: Houses the Static Timing Analysis engine, allowing students to inspect timing graphs, slack histograms, and PVT deratings across Synthesis, Placement, CTS, and Routing stages.
2. **In-Page Collapsible Workspaces**:
   - Every kingdom and level page features an inline laboratory workspace (`Open In-Page Studio`) and companion modal, enabling students to inspect live waveforms or timing margins without navigating away from their current challenge.
3. **100% Offline Asset Delivery**:
   - All studio simulation engines and HTML/JS bundles reside locally in `public/studios/` (`/studios/rtl/` and `/studios/sta/`). The platform functions completely offline with zero external network requests.
4. **Authoritative Engineering Disclosures**:
   - Strict pedagogical disambiguation between **Clock Tree Synthesis (CTS)** (which physically constructs the clock distribution network) and **Static Timing Analysis (STA)** (which mathematically verifies path timing across PVT corners).

---

## 🛡️ Genuine Engineering Assessment: Student Design Sign-Off vs Demonstration Drills

In PD Playground:
- **Zero Performance Sliders**: Reward sliders have been completely removed. Scores cannot be arbitrarily selected or spoofed.
- **Pure Functional Validators**: Every activity has an isolated, pure mathematical validator that recomputes scores, stars, and formative feedback exclusively from the student's actual circuit inputs.
- **Student Design Sanity Checks**: Stage sanity checks evaluate **genuine student-created layout geometry** (margins, halos, placed cell overlap, well-tap pitch, clock skew, routing opens, decap droop) generated during prerequisite levels.
- **Strict Prerequisite Gating**: Attempting to run a sanity check without completing the required prerequisite levels rejects the audit with clear guidance. Unearned certification is impossible.
- **Isolated Demonstration Mode**: Students can practice fault drills on preset reference designs with simulated defect injection. Demonstration mode never awards certification XP.
- **Educational Scope Disclosure**: All ruledecks transparently disclose that calculations use closed-form analytical approximations designed for education, not commercial foundry-qualified signoff.

---

## 🧮 9 Pure Mathematical & EDA Numerical Engines

All physical simulation and design rule calculations are performed by 9 pure, deterministic ES modules:

1. `src/engine/geometryEngine.js`: Die/core area, aspect ratio, macro halos, rectangle overlap detection.
2. `src/engine/digitalLogic.js`: MUX truth tables, 8-bit ripple adder/accumulator, signed overflow ($V = (A_7 \equiv B_7) \land (S_7 \neq A_7)$), FSM state transitions.
3. `src/engine/synthesisEngine.js`: Generic cell mapping, linear load delay, multi-input boolean equivalence checking.
4. `src/engine/placementEngine.js`: Site snapping, weighted HPWL ($\sum w_n \cdot \text{HPWL}(n)$), GCell 2D congestion heatmaps, well-tap pitch.
5. `src/engine/ctsEngine.js`: Clock skew ($T_{\text{skew}} = T_{\text{capture}} - T_{\text{launch}}$), setup slack, hold slack, buffer sizing, topology profiles.
6. `src/engine/routingEngine.js`: Manhattan routing, wire sheet resistance ($R = R_{\square} \cdot L/W$), Elmore delay, DRC clearance.
7. `src/engine/fillerCellsEngine.js`: Filler legalization, row continuity interval analysis, decap droop ($\Delta V = I \cdot \Delta t / C_{\text{decap}}$), oxide leakage.
8. `src/engine/gdsEngine.js`: Layer mapping, antenna ratio rule ($\text{Area}_{\text{metal}}/\text{Area}_{\text{gate}} \le 250$), CMP layer density ($35\% - 75\%$).
9. `src/engine/sanityCheckEngine.js`: Evaluates all 26 stage sanity check ruledecks.
10. `src/logic/studentDesignContext.js`: Maps all 26 sanity checks to their prerequisite levels and extracts real student layout geometry.

---

## 🚀 Getting Started

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### Installation
```bash
# Clone the private repository
git clone https://github.com/ppawar-7/pd-playground-game-private.git
cd pd-playground-game-private

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

### Running Tests & Verification
```bash
# 1. Run full Vitest test suite (436 unit, integration, and contract, and sanity check tests across 27 suites)
npm test

# 2. Run mathematical calibration proof (validates zero-deadlock 2-star progression across all 8 kingdoms)
node tests/test_2star_progression_math.cjs

# 3. Run full native studio & 26 sanity checks E2E browser acceptance suite with CDP
node tests/test_studios_and_all_26_sanity_checks.cjs

# 4. Run full 40-level authentic browser acceptance journey with CDP
node tests/test_full_40_browser_journey.cjs
```

### Production Build
```bash
# Compile and optimize production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📚 Technical Documentation Index

PD Playground maintains 13 comprehensive engineering and pedagogical documents in the repository root:

1. **[`README.md`](./README.md)**: Platform overview, kingdoms breakdown, installation, and test commands.
2. **[`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md)**: Architecture diagrams, React component hierarchy, state flow, and pure validation pipeline.
3. **[`GAME_ENGINE_SPEC.md`](./GAME_ENGINE_SPEC.md)**: Algorithmic specifications and deterministic contracts for the domain engines.
4. **[`RTL_INTEGRATION.md`](./RTL_INTEGRATION.md)**: 4-tier architectural integration of the standalone 24-lesson RTL Playground.
5. **[`STA_INTEGRATION.md`](./STA_INTEGRATION.md)**: 4-tier architectural integration of the standalone STA Playground and strict STA vs CTS disambiguation.
6. **[`ENGINEERING_MODELS.md`](./ENGINEERING_MODELS.md)**: Complete mathematical derivations, units, and boundary conditions for all physical design equations.
7. **[`LEARNING_CURRICULUM.md`](./LEARNING_CURRICULUM.md)**: Pedagogical roadmap for all 40 levels, mirrored industry EDA tools, and mastery gates.
8. **[`TEST_COVERAGE_MATRIX.md`](./TEST_COVERAGE_MATRIX.md)**: Complete test mapping across 25 Vitest suites (419 tests), browser E2E, and sanity check drills.
9. **[`PROGRESSION_RULES.md`](./PROGRESSION_RULES.md)**: Mathematical proof of unlock gates, 2-star scoring thresholds, and zero-deadlock guarantees.
10. **[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md)**: Transparent engineering disclosures of browser simulation approximations vs industrial EDA engines.
11. **[`PROGRESS.md`](./PROGRESS.md)**: Chronological project milestones, hardening iterations, bug fixes, and verification history.
12. **[`DESIGN_ARTIFACT_CONTRACTS.md`](./DESIGN_ARTIFACT_CONTRACTS.md)**: Formal contract schemas and fail-closed implementation matrix for all 26 stage sanity checks.
13. **[`HANDOFF.md`](./HANDOFF.md)**: Developer handoff guide, directory map, and instructions for future AI assistants and engineers.

---

## 📄 Source Provenance & Intellectual Property

- **Scaffold Provenance**: The foundational UI scaffold and visual theme were adapted from the open-source repository `mvaghasiya7/Game-Site` (which carries no declared root license).
- **Domain Engine & Curriculum Provenance**: The complete ASIC digital physical design educational curriculum, 40 interactive activities, 9 domain calculation engines, 26 stage sanity check ruledecks, student design context schemas, dedicated studio routes (`/studio/rtl`, `/studio/sta`), offline studio embedding, and automated verification suites were authored, architected, and verified by **Pranil Pawar** (`ppawar-7`).
- **Repository Visibility**: This repository (`ppawar-7/pd-playground-game-private`) is maintained as a **strictly private** engineering repository. Do not redistribute or publish without authorization.
