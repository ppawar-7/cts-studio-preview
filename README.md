# ⚡ ASIC Physical Design (PD) Playground

[![Tests](https://img.shields.io/badge/Vitest-182%20passed-brightgreen.svg)]()
[![Build](https://img.shields.io/badge/Vite-production%20ready-blue.svg)]()
[![Kingdoms](https://img.shields.io/badge/ASIC%20Kingdoms-8%20of%208%20Complete-gold.svg)]()
[![Validation](https://img.shields.io/badge/Engineering%20Validation-Zero%20Sliders-purple.svg)]()

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

### Running Tests
```bash
# Run full Vitest test suite (182 unit/integration tests)
npm test -- --run

# Run full headless browser E2E acceptance test
node tests/test_full_platform_e2e.cjs
```

### Production Build
```bash
# Compile and optimize production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📚 Technical Documentation

- [`ENGINEERING_EQUATIONS.md`](./ENGINEERING_EQUATIONS.md): Complete mathematical reference for every physical design formula and unit conversion.
- [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md): Architecture diagrams, component hierarchy, pure validation pipeline, and state schema.
- [`PROGRESSION_RULES.md`](./PROGRESSION_RULES.md): Unlock gates, star thresholds, XP caps, and achievement conditions.
- [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md): Transparent disclosures of educational approximations vs foundry EDA sign-off.
- [`HANDOFF.md`](./HANDOFF.md): Engineering handoff guide for adding new levels, sanity checks, and deploying.

---

## 📄 License
MIT License. Created for ASIC Physical Design education.
