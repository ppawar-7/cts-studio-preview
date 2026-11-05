# ASIC Physical Design Playground — Engineering Models & Mathematical Formulations

This document provides the complete theoretical foundations, mathematical derivations, units, and boundary conditions for all physical design equations implemented across PD Playground (`Game-Site`).

---

## 1. Physical Units & Conventions

| Physical Dimension | Standard Unit | Symbol | Typical Semiconductor Magnitude |
| :--- | :--- | :---: | :--- |
| **Time / Latency** | Nanoseconds / Picoseconds | $\text{ns} / \text{ps}$ | $10\,\text{ps} - 10\,\text{ns}$ |
| **Frequency** | Megahertz / Gigahertz | $\text{MHz} / \text{GHz}$ | $100\,\text{MHz} - 3\,\text{GHz}$ |
| **Distance / Length** | Microns / Nanometers | $\mu\text{m} / \text{nm}$ | $0.02\,\mu\text{m} - 5000\,\mu\text{m}$ |
| **Area** | Square Microns | $\mu\text{m}^2$ | $1\,\mu\text{m}^2 - 10^8\,\mu\text{m}^2$ |
| **Resistance** | Ohms / Sheet Resistance | $\Omega / \Omega/\square$ | $0.05\,\Omega/\square - 10\,\Omega/\square$ |
| **Capacitance** | Femtofarads / Picofarads | $\text{fF} / \text{pF}$ | $0.1\,\text{fF} - 500\,\text{pF}$ |
| **Voltage** | Volts / Millivolts | $\text{V} / \text{mV}$ | $0.7\,\text{V} - 1.2\,\text{V}$ |
| **Current** | Milliamps / Microamps | $\text{mA} / \mu\text{A}$ | $1\,\mu\text{A} - 500\,\text{mA}$ |

---

## 2. Floorplanning & Geometry Formulations

### 2.1 Core Area & Utilization
$$\text{Core Area} = \frac{\text{Standard Cell Area} + \sum \text{Macro Area}}{U_{\text{target}}}$$
Where $U_{\text{target}}$ is the target core utilization (typically $0.60 - 0.75$).

### 2.2 Die Dimensions from Aspect Ratio
Given target aspect ratio $\text{AR} = \frac{W_{\text{core}}}{H_{\text{core}}}$:
$$H_{\text{core}} = \sqrt{\frac{\text{Core Area}}{\text{AR}}}, \quad W_{\text{core}} = H_{\text{core}} \cdot \text{AR}$$
Die dimensions include I/O pad rings and core-to-die boundary clearance $M_{\text{io}}$:
$$W_{\text{die}} = W_{\text{core}} + 2 \cdot M_{\text{io}}, \quad H_{\text{die}} = H_{\text{core}} + 2 \cdot M_{\text{io}}$$

### 2.3 Macro Halo Keepout Constraint
Between any two hard macros $M_i$ and $M_j$:
$$\Delta X \ge \text{halo}_{\text{width}}, \quad \Delta Y \ge \text{halo}_{\text{height}}$$
To ensure adequate routing channel resources and avoid channel pin congestion.

---

## 3. Placement Formulations

### 3.1 Standard Cell Site Legalization
Standard cell rows have fixed height $H_{\text{row}}$ and discrete placement sites with width $W_{\text{site}}$. Continuous placement coordinates $(X, Y)$ are legalized to:
$$X_{\text{legal}} = \text{round}\left(\frac{X}{W_{\text{site}}}\right) \cdot W_{\text{site}}, \quad Y_{\text{legal}} = \left\lfloor \frac{Y}{H_{\text{row}}} \right\rfloor \cdot H_{\text{row}}$$

### 3.2 Half-Perimeter Wirelength (HPWL)
For an $N$-terminal net connecting pin locations $\{(x_1, y_1), \dots, (x_N, y_N)\}$:
$$\text{HPWL}(n) = \left(\max_{i=1}^N x_i - \min_{i=1}^N x_i\right) + \left(\max_{i=1}^N y_i - \min_{i=1}^N y_i\right)$$
Weighted Total Wirelength:
$$W_{\text{total}} = \sum_{n \in \text{Nets}} w_n \cdot \text{HPWL}(n)$$
Where critical timing nets receive higher weight ($w_n > 1.0$).

### 3.3 GCell Routing Congestion
The core is partitioned into a 2D matrix of Global Routing Cells (GCells).
$$\text{Congestion Ratio}(r, c) = \frac{\text{Tracks Demanded}(r, c)}{\text{Tracks Available}(r, c)}$$
A GCell is congested when $\text{Congestion Ratio} > 1.0$, requiring cell spread or detoured routing.

---

## 4. Clock Tree Synthesis & Timing Formulations

### 4.1 Clock Skew Definition
For a data path launching from register $R_{\text{launch}}$ at arrival time $T_{\text{launch}}$ and capturing at register $R_{\text{capture}}$ at arrival time $T_{\text{capture}}$:
$$T_{\text{skew}} = T_{\text{capture}} - T_{\text{launch}}$$

### 4.2 Setup Slack Equation
Setup timing constraint ensures data settles before the active capturing clock edge:
$$T_{\text{launch}} + T_{\text{clk}\to\text{q}} + T_{\text{datapath}} \le T_{\text{clk}} + T_{\text{capture}} - T_{\text{setup}} - \text{Jitter}$$
$$\text{Setup Slack} = \left(T_{\text{clk}} + T_{\text{capture}} - T_{\text{setup}} - \text{Jitter}\right) - \left(T_{\text{launch}} + T_{\text{clk}\to\text{q}} + T_{\text{datapath}}\right)$$
$$\text{Setup Slack} = T_{\text{clk}} + T_{\text{skew}} - T_{\text{clk}\to\text{q}} - T_{\text{datapath}} - T_{\text{setup}} - \text{Jitter}$$

### 4.3 Hold Slack Equation
Hold timing constraint ensures newly launched data does not overwrite currently captured data on the same clock cycle:
$$T_{\text{launch}} + T_{\text{clk}\to\text{q,min}} + T_{\text{data,min}} \ge T_{\text{capture}} + T_{\text{hold}}$$
$$\text{Hold Slack} = \left(T_{\text{launch}} + T_{\text{clk}\to\text{q,min}} + T_{\text{data,min}}\right) - \left(T_{\text{capture}} + T_{\text{hold}}\right)$$
$$\text{Hold Slack} = T_{\text{clk}\to\text{q,min}} + T_{\text{data,min}} - T_{\text{skew}} - T_{\text{hold}}$$

---

## 5. Interconnect & Routing Formulations

### 5.1 Wire Sheet Resistance
For a metal interconnect trace with length $L$, width $W$, thickness $t$, and resistivity $\rho$:
$$R_{\text{wire}} = R_{\square} \cdot \frac{L}{W}, \quad R_{\square} = \frac{\rho}{t}$$

### 5.2 Elmore Delay Model
For a distributed $RC$ line driven by an inverter with output resistance $R_{\text{driver}}$ and loading a destination gate capacitance $C_{\text{load}}$:
$$\tau_{\text{Elmore}} = R_{\text{driver}} \cdot (C_{\text{wire}} + C_{\text{load}}) + \frac{1}{2} R_{\text{wire}} \cdot C_{\text{wire}} + R_{\text{wire}} \cdot C_{\text{load}}$$

### 5.3 Crosstalk & Dynamic Delay Derating
Coupling capacitance $C_{\text{cross}}$ between parallel tracks on the same metal layer causes dynamic delay variations:
- **Same Direction Switching (In-Phase)**: Effective capacitance decreases $\implies$ delay decreases (speedup).
- **Opposite Direction Switching (Out-of-Phase)**: Miller effect doubles effective coupling capacitance:
  $$C_{\text{eff}} = C_{\text{ground}} + 2 \cdot C_{\text{cross}}$$
  $$\Delta V_{\text{noise}} = V_{\text{DD}} \cdot \frac{C_{\text{cross}}}{C_{\text{ground}} + C_{\text{cross}}}$$

---

## 6. Filler Cells & Reliability Formulations

### 6.1 Decoupling Capacitor Dynamic Droop Suppression
When digital logic switches simultaneously, high current $I_{\text{peak}}$ is drawn across power grid inductance/resistance:
$$\Delta V_{\text{droop}} = \frac{I_{\text{peak}} \cdot \Delta t}{C_{\text{grid}} + C_{\text{decap}}}$$
Target constraint: $\Delta V_{\text{droop}} \le 0.05 \cdot V_{\text{DD}}$ (5% maximum droop).

### 6.2 Decap Gate Leakage Penalty
Thin gate oxide in MOS decap capacitors induces quantum mechanical tunneling current:
$$I_{\text{leak}} = N_{\text{decap\_sites}} \cdot I_{\text{leak\_per\_site}}$$
Where $I_{\text{leak\_per\_site}} \approx 0.25\,\mu\text{A}$ at high temperature.

---

## 7. GDSII & Tape-Out Sign-Off Formulations

### 7.1 Plasma Antenna Ratio Rule
During dry plasma etching of metal layers, exposed interconnect antennas collect ion charges that discharge through thin gate oxide, causing dielectric breakdown:
$$R_{\text{antenna}} = \frac{\text{Area of Exposed Metal Interconnect}}{\text{Area of Attached Transistor Gate Oxide}}$$
Rule: If $R_{\text{antenna}} > 200 \implies$ insert reverse-biased diode to ground to bleed off plasma charge safely.

### 7.2 CMP Metal Density Rules
To prevent chemical-mechanical polishing (CMP) dishing and erosion defects:
$$\rho_{\text{metal}} = \frac{\sum \text{Metal Polygon Area}}{\text{Window Area}}$$
Ruledeck requirement: $0.35 \le \rho_{\text{metal}} \le 0.75$ across sliding $20\,\mu\text{m} \times 20\,\mu\text{m}$ windows on all routing layers.


---

## 9. Clock Dynamic Power & Buffer Tree Energy Budget Model

In Clock Tree Synthesis (`cts-5` and `cts-power`), dynamic switching power is derived from the clock frequency ($f = 1.0\text{ GHz}$), operating voltage ($V_{\text{DD}} = 1.0\text{ V}$), baseline clock distribution network cap, and inserted clock buffer instances ($N_{\text{buf}}$):

$$P_{\text{dyn}} = P_{\text{base}} + N_{\text{buf}} \times P_{\text{buffer}}$$

Where:
- $P_{\text{base}} = 1.8\text{ mW}$ (baseline root trunk and flip-flop sink pin switching)
- $P_{\text{buffer}} = 0.20\text{ mW}$ per inserted clock buffer
- **Foundry Sign-Off Budget:** $P_{\text{dyn}} \le 5.0\text{ mW}$

For a typical 6-buffer balanced clock tree:
$$P_{\text{dyn}} = 1.8 + (6 \times 0.20) = 3.0\text{ mW} \le 5.0\text{ mW} \quad \text{[COMPLIANT]}$$
