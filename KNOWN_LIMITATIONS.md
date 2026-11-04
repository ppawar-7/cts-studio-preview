# ASIC Physical Design Playground — Known Limitations & Engineering Disclosures

This document provides transparent, professional engineering disclosures regarding the educational models, mathematical simplifications, and architectural scope of PD Playground (`Game-Site`).

---

## 1. Educational Approximations vs Industrial EDA Sign-Off

PD Playground is designed to teach intuitive, rigorous, and technically authentic ASIC physical design principles directly in a web browser without requiring hundreds of gigabytes of commercial EDA licenses (Synopsys PrimeTime, Cadence Innovus, Siemens Calibre).

To deliver interactive, instant-feedback simulations in pure client-side JavaScript, certain advanced deep-submicron physical phenomena are approximated or abstracted:

### 1.1 Static Timing Analysis (STA)
- **Signal Integrity (SI) Crosstalk**: Cross-coupling capacitance ($C_{\text{cross}}$) between adjacent metal tracks and Miller effect dynamic delay variation are not modeled at the full spice netlist level. Coupling capacitance is treated as an effective grounded capacitance approximation.
- **On-Chip Variation (OCV / AOCV / POCV)**: The platform uses nominal corner analysis with derating factors, rather than statistical variation tables (AOCV stage/depth tables or POCV Gaussian distributions).
- **Non-Linear Delay Models (NLDM / CCS / ECSM)**: Gate delay uses a calibrated linear-load model ($D = D_0 + K \cdot C$) rather than multi-dimensional 7x7 transition-time vs load-capacitance lookup tables or Composite Current Source (CCS) models.

### 1.2 Clock Tree Synthesis (CTS)
- **CTS vs STA Disambiguation**: The CTS engine simulates topology construction, buffer sizing, and latency/skew trade-offs across H-Trees, Meshes, and Balanced Trees. For full multi-corner STA sign-off with arbitrary SDC constraints and PVT derates, students are directed to the linked standalone [STA Playground](https://ppawar-7.github.io/sta-playground/).
- **Clock Tree Synthesis Execution**: The engine calculates arrival latencies and skews analytically; it does not invoke an iterative Steiner-tree routing optimizer during browser rendering.

### 1.3 Routing & Parasitic Extraction
- **Global & Detailed Routing**: Routing models use 2D/2.5D rectilinear Manhattan grids with layer directionality and via cut checking. 3D electromigration flux divergence and corner fringing 3D field solvers (e.g. StarRC) are abstracted to closed-form unit resistance and fringe capacitance formulas.
- **Via Resistance**: Contact and via resistances are modeled as lumped resistances per cut rather than multi-cut current crowding finite element models.

### 1.4 Filler Cells & Dynamic Droop
- **Dynamic IR Droop**: Droop is calculated using charge conservation $\Delta V = (I \cdot \Delta t) / C_{\text{decap}}$. Full-chip transient power grid simulation involving distributed RLC mesh matrices (such as Apache RedHawk) is summarized into equivalent lumped grid impedances.
- **Decap Gate Leakage**: Gate oxide tunneling leakage is modeled as a uniform site-scaled penalty ($0.25\ \mu\text{A}/\text{site}$).

### 1.5 GDSII & Physical Verification
- **DRC / LVS Engines**: Physical verification checks operate on Manhattan boundary polygon approximations. Non-orthogonal (45-degree) geometries and complex optical proximity correction (OPC) inverse lithography simulations are demonstrated conceptually rather than computed via numerical Maxwell equations.

---

## 2. Browser Environment & Performance

### 2.1 Execution Boundary
- All simulation and verification happens in the student's browser thread.
- Pure JavaScript runtime with zero WebAssembly or native C++ EDA binary dependencies.
- Memory consumption is bounded to $< 50\ \text{MB}$ heap usage.

### 2.2 Device & Screen Responsiveness
- **Desktop Optimization**: The EDA schematic canvases, interactive truth tables, and placement grids are optimized for viewports $\ge 1024\ \text{px}$ wide.
- **Mobile Viewports**: On mobile screens ($< 768\ \text{px}$), complex multi-column layout tables and routing grid editors enable horizontal scrolling. For the best physical design laboratory experience, a desktop or laptop display is strongly recommended.

---

## 3. Relationship to Standalone Companion Playgrounds

The PD Playground ecosystem includes two specialized companion tools:

1. **RTL Playground** (`https://ppawar-7.github.io/rtl-playground/`):
   - Standalone Verilog editor, FSM state diagram visualizer, and 8-bit ALU simulator.
   - Preserved as an independent laboratory and cross-linked from the RTL Kingdom.

2. **STA Playground** (`https://ppawar-7.github.io/sta-playground/`):
   - Standalone Static Timing Analysis tool with graph-based path tracing, setup/hold slack histograms, and PVT deratings.
   - Preserved as an independent laboratory and cross-linked from the Synthesis and CTS Kingdoms.
