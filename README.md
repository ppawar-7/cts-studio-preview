# ⚡ ASIC Physical Design (PD) Playground

[![Tests](https://img.shields.io/badge/Vitest-303%20passed-brightgreen.svg)]()
[![Build](https://img.shields.io/badge/Vite-production%20ready-blue.svg)]()
[![Kingdoms](https://img.shields.io/badge/ASIC%20Kingdoms-8%20of%208%20Complete-gold.svg)]()
[![Validation](https://img.shields.io/badge/Engineering%20Validation-Zero%20Sliders-purple.svg)]()
[![Offline](https://img.shields.io/badge/Privacy-100%25%20Offline%20Ready-success.svg)]()

**PD Playground** is an interactive, gamified educational platform that teaches the complete application-specific integrated circuit (ASIC) digital physical design flow — from Register-Transfer Level (RTL) to GDSII tape-out.

Built with React and Vite, the platform executes 100% locally in the browser with zero external network or cloud backend dependencies, combining interactive engineering challenges with authentic electronic design automation (EDA) ruledeck sign-off checks.

---

## 🏰 The 8 ASIC Kingdoms

The curriculum spans the entire standard ASIC physical implementation flow across eight kingdoms, containing **40 core concept levels** and **26 stage sanity check audits**:

| # | Kingdom | Concept Focus | Core Levels | Sanity Checks | Companion Lab |
| :-: | :--- | :--- | :-: | :-: | :---: |
| **1** | **RTL Understanding** | Digital logic, 2:1 MUX truth tables, Verilog expressions, register-to-register transfers, FSMs | 5 | — | [RTL Playground](https://ppawar-7.github.io/rtl-playground/) |
| **2** | **Logic Synthesis** | GTECH translation, boolean optimization, technology mapping, linear delay models, power estimation | 5 | — | [STA Playground](https://ppawar-7.github.io/sta-playground/) |
| **3** | **Floorplanning** | Die vs core sizing, aspect ratios, I/O pin placement, macro placement halos, power ring continuity | 5 | 3 | — |
| **4** | **Placement** | Standard cell site grid snapping, weighted HPWL minimization, GCell routing congestion, well-tap spacing | 5 | 5 | — |
| **5** | **Clock Tree Synthesis (CTS)** | Clock skew conventions, setup/hold slack timing closure, buffer tree insertion, H-Tree vs mesh topologies | 5 | 4 | [STA Playground](https://ppawar-7.github.io/sta-playground/) |
| **6** | **Global & Detailed Routing** | Multi-layer track grids, Manhattan routing, sheet resistance, Elmore delay, DRC minimum spacing | 5 | 5 | — |
| **7** | **Filler Cells & Physical Integrity** | Standard cell row continuity, base layer DRC, decap dynamic IR droop suppression, leakage penalties | 5 | 9 | — |
| **8** | **GDSII & Tape-Out** | Stream format structures, layer stack mapping, antenna ratio diode rules, CMP metal density, final sign-off | 5 | — | — |

---

## 🛡️ Genuine Engineering Assessment & Zero Unearned Rewards

In PD Playground:
- **Zero Performance Sliders**: Reward sliders have been completely removed. Scores cannot be arbitrarily selected or spoofed.
- **Pure Functional Validators**: Every activity has an isolated, pure mathematical validator that recomputes scores, stars, and formative feedback exclusively from the student's actual circuit inputs.
- **Real EDA Ruledeck Terminal**: Stage sanity checks execute real physical design ruledecks (checking standard cell site legality, GCell congestion, well-tap pitch, skew budgets, dynamic IR droop, and DRC rules) before granting stage certification.
- **Fair Unlock Mathematics**: A student who achieves passing scores (2 stars) in each level can steadily unlock every subsequent level and kingdom without progression deadlock.

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
9. `src/engine/sanityCheckEngine.js`: Executes all 26 stage sanity check ruledecks.

Detailed mathematical formulas, units, derivations, and boundary conditions are documented in [`ENGINEERING_EQUATIONS.md`](./ENGINEERING_EQUATIONS.md).

---

## 🚀 Getting Started

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### Installation
```bash
# Clone the repository
git clone https://github.com/mvaghasiya7/Game-Site.git
cd Game-Site

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
# 1. Run full Vitest test suite (303 unit, integration, and curriculum validator tests)
npm test

# 2. Run mathematical calibration proof (validates zero-deadlock 2-star progression across all 8 kingdoms)
node tests/test_2star_progression_math.cjs

# 3. Run full 40-level authentic browser acceptance journey with CDP (verifies all 40 levels & sanity checks)
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

## 🔗 Standalone Companion Laboratories

PD Playground acts as the central gamified educational frontend and bridges directly into two authoritative companion studios:

- **[RTL Playground](https://ppawar-7.github.io/rtl-playground/)** (`ppawar-7/rtl-playground`): Full 24-lesson interactive digital logic simulator with dynamic schematics, waveforms, and Verilog generation.
- **[STA Playground](https://ppawar-7.github.io/sta-playground/)** (`ppawar-7/sta-playground`): Static Timing Analysis laboratory with full timing graph traversal, multi-corner PVT analysis, and path slack histograms. (Note: CTS builds physical clock distribution trees; STA verifies the resulting setup and hold margins across synthesis, placement, CTS, and routing).

---

## 📚 Technical Documentation Index

PD Playground maintains 12 comprehensive engineering and pedagogical documents in the repository root:

1. **[`README.md`](./README.md)**: Platform overview, kingdoms breakdown, installation, and test commands.
2. **[`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md)**: Architecture diagrams, React component hierarchy, state flow, and pure validation pipeline.
3. **[`GAME_ENGINE_SPEC.md`](./GAME_ENGINE_SPEC.md)**: Algorithmic specifications and deterministic contracts for the 9 domain engines.
4. **[`RTL_INTEGRATION.md`](./RTL_INTEGRATION.md)**: Architectural mapping between Game-Site's introductory RTL levels and the standalone 24-lesson RTL Playground.
5. **[`STA_INTEGRATION.md`](./STA_INTEGRATION.md)**: Accurate positioning of STA across the flow and strict engineering distinction between STA and CTS.
6. **[`ENGINEERING_MODELS.md`](./ENGINEERING_MODELS.md)**: Complete mathematical derivations, units, and boundary conditions for all physical design equations.
7. **[`LEARNING_CURRICULUM.md`](./LEARNING_CURRICULUM.md)**: Pedagogical roadmap for all 40 levels, mirrored industry EDA tools, and mastery gates.
8. **[`TEST_COVERAGE_MATRIX.md`](./TEST_COVERAGE_MATRIX.md)**: Complete test mapping across 23 Vitest suites (303 tests), browser E2E, and sanity check drills.
9. **[`PROGRESSION_RULES.md`](./PROGRESSION_RULES.md)**: Mathematical proof of unlock gates, 2-star scoring thresholds, and zero-deadlock guarantees.
10. **[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md)**: Transparent engineering disclosures of browser simulation approximations vs industrial EDA engines.
11. **[`PROGRESS.md`](./PROGRESS.md)**: Chronological project milestones, hardening iterations, bug fixes, and verification history.
12. **[`HANDOFF.md`](./HANDOFF.md)**: Developer handoff guide, directory map, and instructions for future AI assistants and engineers.

---

## 📄 License
MIT License. Created for ASIC Physical Design education.
