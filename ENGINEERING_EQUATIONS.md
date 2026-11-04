# ASIC Physical Design Playground — Engineering Equations & Mathematical Formulations Reference

This document provides the complete, authoritative mathematical and algorithmic reference for all physical design and digital logic engines implemented in PD Playground (`Game-Site`).

Every formula below is actively used in the platform's client-side simulation, DRC/LVS validation, static timing estimation, or sanity check verification engines.

---

## Table of Contents

1. [Geometry & Die/Core Architecture](#1-geometry--diecore-architecture)
2. [Digital Logic & RTL Operations](#2-digital-logic--rtl-operations)
3. [Logic Synthesis & Boolean Optimization](#3-logic-synthesis--boolean-optimization)
4. [Standard Cell Placement & Congestion](#4-standard-cell-placement--congestion)
5. [Clock Tree Synthesis (CTS) & Timing Closure](#5-clock-tree-synthesis-cts--timing-closure)
6. [Global & Detailed Routing Models](#6-global--detailed-routing-models)
7. [Filler Cells & Physical Integrity](#7-filler-cells--physical-integrity)
8. [GDSII & Physical Verification Rules](#8-gdsii--physical-verification-rules)
9. [Physical Design Units & Conversions Reference](#9-physical-design-units--conversions-reference)

---

## 1. Geometry & Die/Core Architecture

**Engine**: `src/engine/geometryEngine.js`

### 1.1 Core Area & Utilization
The core utilization $\eta$ measures the ratio of standard cell / macro placed area to available placement core area:

$$\eta = \frac{A_{\text{cells}}}{A_{\text{core}}} = \frac{\sum_{i=1}^{N_{\text{cells}}} (W_i \times H_i)}{W_{\text{core}} \times H_{\text{core}}}$$

- **Variables**:
  - $A_{\text{cells}}$: Total area occupied by standard cells and placed macros ($\mu\text{m}^2$).
  - $A_{\text{core}}$: Total core placement canvas area ($\mu\text{m}^2$).
  - $W_{\text{core}}, H_{\text{core}}$: Width and height of core region ($\mu\text{m}$).
- **Boundary Conditions**:
  - Requires $W_{\text{core}} > 0$ and $H_{\text{core}} > 0$. If $W \le 0$ or $H \le 0$, $\eta = 0.0$.
  - Realistic targets: $0.60 \le \eta \le 0.75$ for high routability.
- **Approximations**: Macro blockage overlap is subtracted when placement blockages are defined.

### 1.2 Aspect Ratio
$$AR = \frac{H_{\text{die}}}{W_{\text{die}}}$$

- **Target**: $AR \approx 1.0$ (square die) minimizes package stress, wirelength asymmetry, and pad distribution penalties.

### 1.3 Core Inset Margin & I/O Ring
$$W_{\text{core}} = W_{\text{die}} - 2 \cdot M_{\text{io}}, \quad H_{\text{core}} = H_{\text{die}} - 2 \cdot M_{\text{io}}$$

- **Variables**:
  - $M_{\text{io}}$: Margin reserved between die outer perimeter and core boundary ($\mu\text{m}$) for power rings, I/O pads, and ESD structures ($M_{\text{io}} \ge 20.0\ \mu\text{m}$).

### 1.4 Macro Keep-Out Halo & Overlap
For macro $m$ with position $(x_m, y_m)$, dimensions $(w_m, h_m)$, and halo spacing $H$:
$$R_{\text{halo}} = [x_m - H, y_m - H, x_m + w_m + H, y_m + h_m + H]$$
Two rectangles $A$ and $B$ overlap if and only if:
$$\text{Overlap}(A, B) \iff (x_A < x_B + w_B) \land (x_A + w_A > x_B) \land (y_A < y_B + h_B) \land (y_A + h_A > y_B)$$

---

## 2. Digital Logic & RTL Operations

**Engine**: `src/engine/digitalLogic.js`

### 2.1 2:1 Multiplexer
$$Y = (\neg S \land D_0) \lor (S \land D_1) = S \mathbin{?} D_1 : D_0$$
Full Boolean coverage requires evaluating all $2^3 = 8$ truth table combinations for $\langle S, D_0, D_1 \rangle$.

### 2.2 8-bit Ripple-Carry Accumulator & Overflow
For unsigned 8-bit addition with carry:
$$\text{Sum}_{i} = A_i \oplus B_i \oplus C_i, \quad C_{i+1} = (A_i \land B_i) \lor (C_i \land (A_i \oplus B_i))$$
$$\text{Sum}_{\text{8bit}} = (A + B + C_{\text{in}}) \bmod 256, \quad C_{\text{out}} = \lfloor (A + B + C_{\text{in}}) / 256 \rfloor$$

For signed 2's complement arithmetic, signed overflow flag $V$ indicates arithmetic wrapping:
$$V = (A_7 \equiv B_7) \land (S_7 \neq A_7) = (C_7 \oplus C_8)$$

### 2.3 Finite State Machine (FSM) Transition Function
$$\mathbf{S}_{t+1} = \delta(\mathbf{S}_t, \mathbf{X}_t), \quad \mathbf{Y}_t = \lambda(\mathbf{S}_t, \mathbf{X}_t) \quad (\text{Mealy}) \quad \text{or} \quad \mathbf{Y}_t = \lambda(\mathbf{S}_t) \quad (\text{Moore})$$

---

## 3. Logic Synthesis & Boolean Optimization

**Engine**: `src/engine/synthesisEngine.js`

### 3.1 Technology Mapping & Cell Area
$$A_{\text{total}} = \sum_{g \in G} \text{Area}(\text{Map}(g))$$
Maps generic boolean primitives (GTECH) to target standard cell library gates (NAND2, NOR2, INVX1, DFFX1).

### 3.2 Combinational Path Delay (Linear Delay Model)
$$D_{\text{path}} = \sum_{i=1}^{k} \left( D_{\text{intrinsic}, i} + K_{\text{load}, i} \cdot C_{\text{load}, i} \right)$$

- **Variables**:
  - $D_{\text{intrinsic}}$: Internal gate propagation delay under zero load ($\text{ps}$).
  - $K_{\text{load}}$: Output drive resistance / slope factor ($\text{ps}/\text{fF}$).
  - $C_{\text{load}}$: Downstream wire and gate pin capacitance ($\text{fF}$).

### 3.3 Dynamic & Static Power Estimation
$$P_{\text{total}} = P_{\text{dynamic}} + P_{\text{static}}$$
$$P_{\text{dynamic}} = \alpha \cdot C_{\text{eff}} \cdot V_{\text{dd}}^2 \cdot f_{\text{clk}}$$
$$P_{\text{static}} = V_{\text{dd}} \cdot \sum_{i=1}^{N_{\text{cells}}} I_{\text{leak}, i}$$

- **Variables**:
  - $\alpha$: Switching activity factor ($0.0 \le \alpha \le 1.0$, typically $0.1$ for random logic).
  - $C_{\text{eff}}$: Total effective switching capacitance ($\text{pF}$).
  - $V_{\text{dd}}$: Operating supply voltage ($\text{V}$, e.g. $1.0\ \text{V}$ or $0.7\ \text{V}$).
  - $f_{\text{clk}}$: Clock frequency ($\text{MHz}$ or $\text{GHz}$).
  - $I_{\text{leak}}$: Subthreshold and gate leakage current ($\mu\text{A}$).

---

## 4. Standard Cell Placement & Congestion

**Engine**: `src/engine/placementEngine.js`

### 4.1 Half-Perimeter Wirelength (HPWL)
For a net $n$ connecting a set of pins $P_n = \{(x_1, y_1), (x_2, y_2), \dots, (x_k, y_k)\}$:
$$\text{HPWL}(n) = \left( \max_{p \in P_n} x_p - \min_{p \in P_n} x_p \right) + \left( \max_{p \in P_n} y_p - \min_{p \in P_n} y_p \right)$$
Total weighted wirelength across the design:
$$W_{\text{total}} = \sum_{n \in N} w_n \cdot \text{HPWL}(n)$$
where $w_n$ is the net timing/criticality weight (default $w_n = 1.0$, critical clock/reset $w_n \ge 2.0$).

### 4.2 Standard Cell Site Grid Alignment & Legality
For site width $W_{\text{site}}$ and row height $H_{\text{row}}$:
$$x_{\text{cell}} \bmod W_{\text{site}} = 0, \quad y_{\text{cell}} \bmod H_{\text{row}} = 0$$
$$\text{Overlap}(C_i, C_j) = 0 \quad \forall i \neq j$$

### 4.3 Global Routing Cell (GCell) Congestion
For routing grid cell $(i, j)$ with supply capacity $C_{\text{tracks}}$ and routing demand $D_{i, j}$:
$$\text{Congestion}(i, j) = \frac{D_{i, j}}{C_{\text{tracks}}}$$
$$\text{Overflow}(i, j) = \max(0, D_{i, j} - C_{\text{tracks}})$$
A placement is considered routable without severe pin starvation when $\max_{i, j} \text{Congestion}(i, j) \le 1.0$ and 99th percentile $\le 0.85$.

---

## 5. Clock Tree Synthesis (CTS) & Timing Closure

**Engine**: `src/engine/ctsEngine.js`

### 5.1 Clock Skew Convention
Following standard physical design and STA convention:
$$T_{\text{skew}} = T_{\text{capture}} - T_{\text{launch}}$$

- **Positive Skew** ($T_{\text{capture}} > T_{\text{launch}}$): Capture clock arrives later than launch clock.
  - *Setup Timing*: Favorable (relaxes setup constraint by increasing allowed combinational window).
  - *Hold Timing*: Unfavorable (erodes hold margin, increasing risk of hold race).
- **Negative Skew** ($T_{\text{capture}} < T_{\text{launch}}$):
  - *Setup Timing*: Unfavorable (reduces setup margin).
  - *Hold Timing*: Favorable.

### 5.2 Setup (Max Delay) Constraint & Slack
$$\text{Data Required Time} = T_{\text{period}} - T_{\text{setup}} + T_{\text{capture}}$$
$$\text{Data Arrival Time} = T_{\text{launch}} + T_{\text{cq}} + T_{\text{comb}}$$
$$\text{Setup Slack} = \text{Required} - \text{Arrival} = T_{\text{period}} - (T_{\text{cq}} + T_{\text{comb}} + T_{\text{setup}}) + T_{\text{skew}}$$

Setup violation occurs if $\text{Setup Slack} < 0$.

### 5.3 Hold (Min Delay) Constraint & Slack
$$\text{Data Required Time} = T_{\text{hold}} + T_{\text{capture}}$$
$$\text{Data Arrival Time} = T_{\text{launch}} + T_{\text{cq}} + T_{\text{comb}}$$
$$\text{Hold Slack} = \text{Arrival} - \text{Required} = T_{\text{cq}} + T_{\text{comb}} - T_{\text{hold}} - T_{\text{skew}}$$

Hold violation occurs if $\text{Hold Slack} < 0$.

### 5.4 Clock Slew / Transition Time
Clock buffer insertion limits transition degradation:
$$\tau_{\text{slew}} = R_{\text{driver}} \cdot C_{\text{net}} \cdot \ln(9) \approx 2.2 \cdot R_{\text{driver}} \cdot C_{\text{net}}$$
Target maximum clock slew: $\tau_{\text{slew}} \le 80\ \text{ps}$.

---

## 6. Global & Detailed Routing Models

**Engine**: `src/engine/routingEngine.js`

### 6.1 Wire Resistance
$$R_{\text{wire}} = R_{\square} \cdot \frac{L}{W_{\text{wire}}}$$

- **Variables**:
  - $R_{\square}$: Sheet resistance of metal layer ($\Omega/\square$, e.g. $0.15\ \Omega/\square$ for lower metal, $0.03\ \Omega/\square$ for top thick metal).
  - $L, W_{\text{wire}}$: Wire segment length and width ($\mu\text{m}$).

### 6.2 Wire Capacitance
$$C_{\text{wire}} = C_{\text{area}} \cdot (L \times W_{\text{wire}}) + 2 \cdot C_{\text{fringe}} \cdot L$$

- **Variables**:
  - $C_{\text{area}}$: Parallel plate capacitance per unit area ($\text{fF}/\mu\text{m}^2$).
  - $C_{\text{fringe}}$: Fringing dielectric capacitance per unit length ($\text{fF}/\mu\text{m}$).

### 6.3 Distributed RC (Elmore Delay)
For a uniform distributed RC wire driving lumped capacitive load $C_{\text{load}}$:
$$T_{\text{Elmore}} = R_{\text{wire}} \cdot \left( \frac{1}{2} C_{\text{wire}} + C_{\text{load}} \right)$$

### 6.4 Minimum Routing Track Pitch & Preferred Directions
$$\text{Pitch} = W_{\text{wire, min}} + S_{\text{wire, min}}$$
- Horizontal layers (e.g. M1, M3, M5) route along X-axis.
- Vertical layers (e.g. M2, M4, M6) route along Y-axis.
- DRC clearance violation occurs if distance between non-connected wire segments $< S_{\text{wire, min}}$.

---

## 7. Filler Cells & Physical Integrity

**Engine**: `src/engine/fillerCellsEngine.js`

### 7.1 Row Continuity & N-Well / Power Rail Integrity
In standard cell rows, unplaced gaps create floating substrate contacts and broken $V_{\text{dd}}/V_{\text{ss}}$ rails.
100% gap coverage requires:
$$\sum_{j=1}^{M_{\text{fillers}}} W_{\text{filler}, j} = W_{\text{gap}} \quad \text{for every void}$$
Using canonical library filler cell widths $\{16, 8, 4, 2, 1\}\ \text{sites}$.

### 7.2 Dynamic Decap IR Droop Suppression
When logic gates switch simultaneously during clock edges, transient surge current $I_{\text{transient}}$ causes supply voltage droop $\Delta V$:
$$\Delta V_{\text{droop}} = \frac{Q}{C_{\text{decap}}} = \frac{I_{\text{transient}} \cdot \Delta t}{C_{\text{decap}}}$$

- **Units**:
  - $I_{\text{transient}}$ in $\text{mA}$
  - $\Delta t$ in $\text{ps}$
  - $C_{\text{decap}}$ in $\text{pF}$
  - $\Delta V$ in $\text{mV}$: $\Delta V = \frac{I (\text{mA}) \times \Delta t (\text{ps})}{C (\text{pF})} = \frac{10^{-3} \times 10^{-12}}{10^{-12}} \times 10^{3} = 1.0\ \text{mV}$
- **Sign-Off Limit**: $\Delta V_{\text{droop}} \le 50.0\ \text{mV}$ ($5\%$ of $1.0\ \text{V}$ nominal $V_{\text{dd}}$).

### 7.3 Decap Gate Tunneling Leakage Penalty
Thin-oxide decap cells contribute standby gate oxide tunneling leakage:
$$I_{\text{leak, decap}} = N_{\text{decap sites}} \times I_{\text{leak/site}} \quad (I_{\text{leak/site}} = 0.25\ \mu\text{A})$$

---

## 8. GDSII & Physical Verification Rules

**Engine**: `src/engine/gdsEngine.js`

### 8.1 Antenna Ratio Rule (Plasma-Induced Gate Oxide Breakdown)
During reactive ion etching (RIE), metal interconnect collects plasma charge:
$$\text{Antenna Ratio} = \frac{\text{Area}_{\text{metal}}}{\text{Area}_{\text{gate}}}$$
$$\text{Antenna Ratio} \le \text{AR}_{\text{max}} \quad (\text{typically } 250:1)$$
If ratio is exceeded, an antenna protection diode (reverse-biased PN junction) is inserted to bleed plasma charge safely to ground.

### 8.2 Chemical-Mechanical Polishing (CMP) Metal Density
To prevent dishing (under-polishing) or oxide erosion during CMP:
$$D_{\text{layer}} = \frac{\text{Area}(\text{Metal}) + \text{Area}(\text{Dummy Fill})}{\text{Window Area}}$$
$$\text{Density Window}: 35.0\% \le D_{\text{layer}} \le 75.0\%$$

---

## 9. Physical Design Units & Conversions Reference

| Metric | Unit Symbol | SI Equivalent | Typical Range in PD Playground |
| :--- | :--- | :--- | :--- |
| **Length / Distance** | $\mu\text{m}$ | $10^{-6}\ \text{m}$ | $0.14\ \mu\text{m} - 1000\ \mu\text{m}$ |
| **Standard Cell Site** | $\text{site}$ | $0.14\ \mu\text{m}$ | $1 - 100\ \text{sites}$ |
| **Area** | $\mu\text{m}^2$ | $10^{-12}\ \text{m}^2$ | $100\ \mu\text{m}^2 - 1\,000\,000\ \mu\text{m}^2$ |
| **Time / Delay** | $\text{ps}$ | $10^{-12}\ \text{s}$ | $5\ \text{ps} - 2500\ \text{ps}$ |
| **Frequency** | $\text{MHz} / \text{GHz}$ | $10^6\ \text{Hz} / 10^9\ \text{Hz}$ | $100\ \text{MHz} - 2.0\ \text{GHz}$ |
| **Capacitance** | $\text{fF} / \text{pF}$ | $10^{-15}\ \text{F} / 10^{-12}\ \text{F}$ | $0.5\ \text{fF} - 500\ \text{pF}$ |
| **Resistance** | $\Omega / \text{k}\Omega$ | $1\ \Omega / 10^3\ \Omega$ | $0.05\ \Omega - 50\ \text{k}\Omega$ |
| **Current** | $\mu\text{A} / \text{mA}$ | $10^{-6}\ \text{A} / 10^{-3}\ \text{A}$ | $0.25\ \mu\text{A} - 250\ \text{mA}$ |
| **Voltage** | $\text{V} / \text{mV}$ | $1\ \text{V} / 10^{-3}\ \text{V}$ | $0.7\ \text{V} - 1.2\ \text{V} / 20\ \text{mV} - 50\ \text{mV}$ |
