/**
 * ctsCurriculumData.js
 * =====================
 * Expanded Curriculum Definitions for Clock Tree Synthesis (cts-6 through cts-12).
 * Provides authentic EDA theoretical content, formulas, guided assignments,
 * questions, and grading criteria for CTS Studio 1.0.
 */

export const CTS_EXPANDED_CURRICULUM = {
  'cts-6': {
    id: 'cts-6',
    title: 'Wire RC Delay and Slew Degradation',
    subtitle: 'Repeater Insertion & Quadratic Delay Mitigation',
    xpReward: 55,
    starThresholds: [20, 38, 55],
    duration: '~15 min',
    objective:
      'Analyze quadratic wire delay scaling (Elmore ~ 0.5 * r * c * L^2) and transition time degradation. Insert intermediate repeater buffers to break long interconnects and sharpen clock slew.',
    theory: `
### 1. The Quadratic Interconnect Delay Law
In unbuffered clock interconnects, both wire resistance and wire capacitance scale linearly with branch length $L$:
$$R_{\\text{wire}} = r_{\\text{unit}} \\cdot L, \\quad C_{\\text{wire}} = c_{\\text{unit}} \\cdot L$$

By Elmore's distributed RC formula, the delay of an unbuffered wire of length $L$ is:
$$\\tau_{\\text{wire}} = R_{\\text{driver}} C_{\\text{wire}} + \\frac{1}{2} R_{\\text{wire}} C_{\\text{wire}} + (R_{\\text{driver}} + R_{\\text{wire}}) C_{\\text{load}}$$

Notice the quadratic term $\\frac{1}{2} r_{\\text{unit}} c_{\\text{unit}} L^2$. As clock traces traverse across large dies (e.g. 1000 µm to 5000 µm), unbuffered delay and clock edge transition time (slew) explode quadratically!

### 2. Critical Repeater Insertion Distance
To linearize the delay, physical design engineers insert periodic repeater buffers of intrinsic delay $\\tau_b$, output resistance $R_b$, and input capacitance $C_b$. The optimal critical segment length is:
$$L_{\\text{crit}} = \\sqrt{\\frac{2 R_b C_b}{r_{\\text{unit}} c_{\\text{unit}}}}$$

Breaking an interconnect of length $L$ into $k$ buffered segments transforms $O(L^2)$ delay into $O(L)$ linear delay while maintaining crisp transition times ($t_{\\text{slew}} < 100\\,\\text{ps}$).
    `,
    assignment: {
      title: 'Lab 6: Repeater Slicing on Long Branches',
      scenarioId: 'scenario-asymmetric-6',
      instructions:
        'The far cluster (SINK_FAR_1, SINK_FAR_2) is located 500 µm from the trunk. Examine transition times and delay. Place repeater buffers along the trunk and branch corridors to keep maximum transition slew below 100 ps.',
      targetCriteria: [
        'All clock branches have maximum transition time <= 100 ps.',
        'Total insertion delay to far sinks reduced to <= 350 ps.',
        'Zero disconnected sinks.',
      ],
    },
    question: {
      prompt: 'Why does inserting repeater buffers into a long clock line reduce overall propagation delay despite adding intrinsic buffer switching delays?',
      options: [
        {
          value: 'opt-linearize-rc',
          label: 'It breaks the distributed wire length into smaller segments, replacing quadratic L² wire RC growth with linear L delay.',
        },
        {
          value: 'opt-reduce-vdd',
          label: 'Buffers reduce the supply voltage across the interconnect to accelerate electron velocity.',
        },
        {
          value: 'opt-bypass-capacitance',
          label: 'Buffers cancel out parasitic wire capacitance completely by acting as negative inductors.',
        },
        {
          value: 'opt-eliminate-skew',
          label: 'Every buffer automatically synchronizes its output to zero phase offset regardless of wirelength.',
        },
      ],
      correctValue: 'opt-linearize-rc',
      explanation:
        'Correct! Without buffers, distributed RC delay grows with the square of the length (L²). Inserting repeaters segments the line, converting quadratic growth into linear growth plus small buffer delays.',
    },
  },

  'cts-7': {
    id: 'cts-7',
    title: 'Fanout Limits and Capacitive Load Management',
    subtitle: 'Preventing Driver Overload & Transition Violations',
    xpReward: 60,
    starThresholds: [22, 42, 60],
    duration: '~15 min',
    objective:
      'Manage driver fanout and total downstream capacitive load. Resolve max fanout and max capacitance violations by constructing multi-stage repeater trees and upsizing buffer drive strengths.',
    theory: `
### 1. Buffer Drive Strength and Capacitive Loading
A standard cell clock buffer possesses an internal drive stage with effective channel on-resistance $R_{\\text{out}}$. When driving $N$ downstream branches and sinks with total load capacitance $C_{\\text{load}} = \\sum C_{\\text{wire}} + \\sum C_{\\text{gate}}$, the output stage delay is:
$$t_{\\text{stage}} = t_{\\text{intrinsic}} + R_{\\text{out}} \\cdot C_{\\text{load}}$$

- A weak buffer like **CLKBUF_X1** has high $R_{\\text{out}} = 120\\,\\Omega$. Driving a load of $0.08\\,\\text{pF}$ causes an enormous delay of $120 \\times 0.08 = 9.6\\,\\text{ns}$ (960 ps)!
- A strong buffer like **CLKBUF_X8** has low $R_{\\text{out}} = 15\\,\\Omega$. Driving that same load takes only $15 \\times 0.08 = 1.2\\,\\text{ns}$ (120 ps).

### 2. Max Fanout and Slew Rules
Foundry design rule manuals (DRMs) enforce:
1. **Max Fanout:** Limits the number of branch connections (typically $\\le 4$ for high-speed clock nets) to prevent unmanageable routing topology complexity.
2. **Max Capacitance:** Ensures output slew transition $t_{\\text{trans}} \\le t_{\\text{max}}$ (e.g. 100 ps). Exceeding max load creates slow edges, making sinks vulnerable to noise glitches and power dissipation.
    `,
    assignment: {
      title: 'Lab 7: Overloaded Clock Driver Repair',
      scenarioId: 'scenario-flawed-starter',
      instructions:
        'In scenario-flawed-starter, a single weak CLKBUF_X1 buffer is illegally driving 6 sinks directly, causing severe fanout and max capacitance violations. Upsize drivers to CLKBUF_X4 or insert an intermediate distribution stage so that no buffer drives more than 4 fanout branches or exceeds its load capacitance.',
      targetCriteria: [
        'Zero MAX_FANOUT violations across all buffers.',
        'Zero MAX_CAPACITANCE violations across all buffers.',
        'Global skew reduced to <= 50 ps.',
      ],
    },
    question: {
      prompt: 'If a clock buffer experiences a MAX_CAPACITANCE violation, which physical design adjustment will resolve the violation?',
      options: [
        {
          value: 'opt-upsize-or-split',
          label: 'Upsize the buffer to a higher drive strength (e.g. X1 -> X4) or insert intermediate repeaters to split the capacitive load.',
        },
        {
          value: 'opt-downsize-buffer',
          label: 'Downsize the buffer to X1 to decrease its output current.',
        },
        {
          value: 'opt-increase-wirelength',
          label: 'Add serpentine routing to increase branch length and wire resistance.',
        },
        {
          value: 'opt-disable-drc',
          label: 'Increase the clock frequency so the capacitor has less time to charge.',
        },
      ],
      correctValue: 'opt-upsize-or-split',
      explanation:
        'Correct! Upsizing the buffer lowers its internal output resistance (increasing current capability), and inserting intermediate distribution stages splits the total capacitive load among multiple drivers.',
    },
  },

  'cts-8': {
    id: 'cts-8',
    title: 'Sink Clustering and Hierarchical Tree Synthesis',
    subtitle: 'Centroid-Based Regional Tree Balancing',
    xpReward: 65,
    starThresholds: [25, 45, 65],
    duration: '~18 min',
    objective:
      'Learn how EDA clock synthesis algorithms group spatially localized flip-flops using geometric clustering (recursive bipartitioning or K-means) to construct balanced, low-skew hierarchical clock trees.',
    theory: `
### 1. Geometric Sink Clustering
In modern designs with tens of thousands of flip-flops, routing direct lines from the root is impossible. Instead, CTS tools perform **bottom-up sink clustering**:
1. Sinks are clustered into spatial groups based on Euclidean or Manhattan proximity.
2. For each cluster $C_k$, the centroid $(\\bar{x}_k, \\bar{y}_k)$ is computed:
$$\\bar{x}_k = \\frac{1}{|C_k|} \\sum_{i \\in C_k} x_i, \\quad \\bar{y}_k = \\frac{1}{|C_k|} \\sum_{i \\in C_k} y_i$$
3. A leaf clock buffer is placed at or near the centroid to drive the local cluster with minimal branch length.
4. Higher-level distribution buffers then drive the cluster centroids in a balanced, symmetric tree hierarchy.

### 2. Benefits for Skew and Power
Centroid placement minimizes intra-cluster wirelength, ensuring all sinks in the cluster receive clock edges nearly simultaneously. Furthermore, keeping high-frequency clock leaf wires short dramatically reduces total switched capacitance.
    `,
    assignment: {
      title: 'Lab 8: Two-Cluster Hierarchical Tree',
      scenarioId: 'scenario-asymmetric-6',
      instructions:
        'Group the 6 sinks into balanced regional clusters. Place intermediate buffers near the centroids of the near and far clusters, driving them from a central trunk buffer to achieve global skew under 35 ps.',
      targetCriteria: [
        'Global skew <= 35 ps.',
        'Zero disconnected sinks.',
        'Buffer count between 2 and 5 repeaters.',
      ],
    },
    question: {
      prompt: 'What is the primary motivation for placing leaf clock buffers at the spatial centroids of sink clusters?',
      options: [
        {
          value: 'opt-minimize-dispersion',
          label: 'It minimizes intra-cluster wirelength dispersion, equalizing local RC arrival delays across the cluster sinks.',
        },
        {
          value: 'opt-avoid-power-grid',
          label: 'It prevents clock wires from crossing under the power grid straps.',
        },
        {
          value: 'opt-reduce-leakage',
          label: 'Centroid locations run cooler, reducing semiconductor sub-threshold leakage.',
        },
        {
          value: 'opt-allow-asynchronous-clocking',
          label: 'It converts synchronous flip-flops into asynchronous latches.',
        },
      ],
      correctValue: 'opt-minimize-dispersion',
      explanation:
        'Correct! Placing the leaf driver at the cluster centroid minimizes the variance in wirelengths from the driver to the sinks, producing tightly matched local arrival times.',
    },
  },

  'cts-9': {
    id: 'cts-9',
    title: 'Obstruction-Aware Clock Routing',
    subtitle: 'Navigating Hard Macro Keepouts & Placement Blockages',
    xpReward: 70,
    starThresholds: [28, 50, 70],
    duration: '~20 min',
    objective:
      'Synthesize legal clock distribution networks around large hard macro blockages (SRAMs, PLLs, analog IP). Ensure zero buffer collisions with placement keepouts while keeping skew under budget.',
    theory: `
### 1. Placement Keepouts and Macro Blockages
Hard macros like embedded SRAM caches, boot ROMs, and RF/analog blocks occupy extensive silicon area across multiple metal layers. Standard cell clock buffers **cannot be legally placed inside macro boundaries** because the substrate and standard cell rows do not exist there.

### 2. Detour Routing and Corridor Channels
When clock signals must travel from one side of a macro to the other:
- Clock repeaters must be placed in **legal standard cell corridors** between macros or around the perimeter.
- Detour routing adds wire resistance and capacitance to one side of the tree.
- To maintain zero skew, the opposing (non-detoured) branches must have intentional balancing buffers or serpentine routes inserted to match the detour delay!
    `,
    assignment: {
      title: 'Lab 9: Obstruction-Aware CTS Corridor Synthesis',
      scenarioId: 'scenario-blockage-8',
      instructions:
        'In scenario-blockage-8, two large SRAM macros obstruct the center of the die. Place clock repeaters strictly within the peripheral and central corridors without overlapping the macro keepouts. Ensure zero BLOCKAGE_COLLISION violations and skew <= 40 ps.',
      targetCriteria: [
        'Zero BLOCKAGE_COLLISION violations.',
        'All 8 sinks connected with zero cycle errors.',
        'Global skew <= 40 ps.',
      ],
    },
    question: {
      prompt: 'If a clock branch must detour 300 µm around an SRAM memory macro while a parallel branch goes straight to an adjacent sink, how does CTS prevent severe clock skew?',
      options: [
        {
          value: 'opt-balance-delay',
          label: 'By inserting intentional delay buffers or routing delay on the shorter branch to match the detour latency.',
        },
        {
          value: 'opt-punch-through',
          label: 'By tunneling through the SRAM macro transistors regardless of blockages.',
        },
        {
          value: 'opt-double-frequency',
          label: 'By doubling the clock frequency on the longer branch.',
        },
        {
          value: 'opt-ignore-skew',
          label: 'Skew between different sides of a macro is ignored by static timing analysis.',
        },
      ],
      correctValue: 'opt-balance-delay',
      explanation:
        'Correct! When one branch must detour around a macro, its insertion delay increases. The CTS engine balances the tree by adding delay buffers to the shorter branch, equalizing arrival times at all sinks.',
    },
  },

  'cts-10': {
    id: 'cts-10',
    title: 'Clock Gating Architecture and Dynamic Power',
    subtitle: 'Integrated Clock Gating (ICG) & Switching Power Reduction',
    xpReward: 75,
    starThresholds: [30, 55, 75],
    duration: '~20 min',
    objective:
      'Model dynamic switching power P = alpha * C * V^2 * f and understand the architectural role of Integrated Clock Gating (ICG) cells in eliminating clock toggling on idle functional units.',
    theory: `
### 1. Clock Network Power Dominance
In high-performance digital ASICs, the clock network frequently accounts for **30% to 45% of total chip dynamic power** because clock wires and flip-flop clock pins toggle every single clock cycle (activity factor $\\alpha = 1.0$), unlike data paths which toggle intermittently (typically $\\alpha \\approx 0.1$ to $0.15$).

The dynamic power is governed by:
$$P_{\\text{dyn}} = \\alpha \\cdot C_{\\text{total}} \\cdot V_{\\text{dd}}^2 \\cdot f_{\\text{clk}}$$

Where:
- $C_{\\text{total}} = C_{\\text{wire}} + C_{\\text{buffers}} + C_{\\text{sinks}}$
- Reducing wirelength and eliminating unnecessary buffer stages directly slashes power.

### 2. Integrated Clock Gating (ICG)
An ICG cell consists of an active-low latch followed by an AND gate. When an enable signal is deasserted, the ICG prevents clock transitions from propagating downstream to entire register banks, reducing local activity factor $\\alpha$ to 0 and saving massive dynamic power.
    `,
    assignment: {
      title: 'Lab 10: Low-Power Clock Tree Optimization',
      scenarioId: 'scenario-balanced-4',
      instructions:
        'Analyze the power breakdown in the Power & Area panel. Optimize repeater sizing and eliminate redundant wirelength so that total dynamic switching power is minimized while maintaining skew <= 35 ps.',
      targetCriteria: [
        'Dynamic switching power <= 1.5 mW.',
        'Global skew <= 35 ps.',
        'Max transition time <= 100 ps.',
      ],
    },
    question: {
      prompt: 'Why are Integrated Clock Gating (ICG) cells designed with an internal latch before the gating AND gate, rather than just using a simple AND gate?',
      options: [
        {
          value: 'opt-prevent-glitches',
          label: 'To prevent output clock glitches and runt pulses when the enable signal transitions while the clock is high.',
        },
        {
          value: 'opt-double-voltage',
          label: 'To double the voltage level of the clock signal.',
        },
        {
          value: 'opt-invert-clock',
          label: 'To ensure the clock is permanently inverted during test mode.',
        },
        {
          value: 'opt-reduce-area',
          label: 'A latch takes less silicon area than an AND gate alone.',
        },
      ],
      correctValue: 'opt-prevent-glitches',
      explanation:
        'Correct! If an enable signal transitions while the clock is high, a simple AND gate would produce a clipped or runt pulse (glitch), causing timing failure. The latch captures the enable only when clock is low, guaranteeing glitch-free gating.',
    },
  },

  'cts-11': {
    id: 'cts-11',
    title: 'Useful Skew Optimization (Setup vs Hold Slack)',
    subtitle: 'Signed Skew Trade-Offs & Race Condition Prevention',
    xpReward: 80,
    starThresholds: [32, 60, 80],
    duration: '~22 min',
    objective:
      'Master signed clock skew analysis: Delta_t = t_capture - t_launch. Intentionally delay capture clocks to fix setup violations ("useful skew"), while strictly verifying that fast min-delay paths do not suffer catastrophic hold violations.',
    theory: `
### 1. The Signed Clock Skew Equation
Between a launching flip-flop $FF_1$ and capturing flip-flop $FF_2$, clock skew is defined with explicit sign:
$$\\Delta t = t_{\\text{capture}} - t_{\\text{launch}}$$

### 2. Setup Slack Equation (Max Timing)
Setup timing requires data to arrive before the capturing clock edge:
$$S_{\\text{setup}} = T_{\\text{period}} - (T_{\\text{cq,max}} + T_{\\text{comb,max}} + T_{\\text{setup}}) + \\Delta t$$
- If $\\Delta t > 0$ (**positive skew**: capture clock is late), setup slack **increases**! This extra time allows slower combinational logic to complete within the cycle. This is called **Useful Skew**.

### 3. Hold Slack Equation (Min Timing)
Hold timing requires data to remain stable after the capturing clock edge to prevent overwriting:
$$S_{\\text{hold}} = (T_{\\text{cq,min}} + T_{\\text{comb,min}}) - T_{\\text{hold}} - \\Delta t$$
- If $\\Delta t > 0$, hold slack **decreases**!
- If the capture clock arrives too late (excessive positive skew) and the data path is short ($T_{\\text{comb,min}}$ is small), $S_{\\text{hold}} < 0$, creating a fatal **hold race violation** that cannot be fixed by lowering clock frequency!
    `,
    assignment: {
      title: 'Lab 11: Setup Timing Closure without Hold Violations',
      scenarioId: 'scenario-asymmetric-6',
      instructions:
        'Inspect the Setup & Hold Slack panel. Adjust buffer delays on the capture path to provide positive skew resolving any setup slack violation, while ensuring hold slack on min-delay paths remains strictly >= 0 ps.',
      targetCriteria: [
        'Zero SETUP_TIMING_VIOLATION errors on all data paths.',
        'Zero HOLD_TIMING_VIOLATION errors on all data paths.',
        'All data paths report PASS for both Setup and Hold signoff.',
      ],
    },
    question: {
      prompt: 'Why is excessive positive clock skew (t_capture >> t_launch) extremely hazardous in physical design?',
      options: [
        {
          value: 'opt-hold-violation',
          label: 'It directly reduces hold slack, potentially causing new data to overwrite previous data before the capture register latches it.',
        },
        {
          value: 'opt-setup-violation',
          label: 'It reduces the available time for combinational logic propagation.',
        },
        {
          value: 'opt-drain-battery',
          label: 'It permanently disables the power supply to the capture flip-flop.',
        },
        {
          value: 'opt-destroys-clock-pin',
          label: 'It increases the operating voltage beyond transistor breakdown.',
        },
      ],
      correctValue: 'opt-hold-violation',
      explanation:
        'Correct! While positive skew gives extra time for setup, it steals time from hold. If positive skew exceeds the minimum data path delay (T_cq + T_comb,min), a hold violation occurs where data races through and corrupts the register state.',
    },
  },

  'cts-12': {
    id: 'cts-12',
    title: 'Advanced CTS Capstone Laboratory',
    subtitle: 'Comprehensive 12-Gate SoC Clock Distribution Signoff',
    xpReward: 100,
    starThresholds: [40, 75, 100],
    duration: '~30 min',
    objective:
      'The ultimate Clock Tree Synthesis Capstone. Design, balance, legalize, and sign off a production-scale 10-sink SoC clock tree meeting all 12 rigorous CAD engineering acceptance gates.',
    theory: `
### The 12 Golden Gates of Clock Tree Synthesis Signoff
In commercial ASIC design tape-outs, clock network closure requires passing all 12 golden criteria simultaneously:
1. **Sink Completeness:** All design sinks (>= 8 sinks) accounted for and reached.
2. **Core Boundary:** Zero nodes placed outside standard cell core area.
3. **Graph Integrity:** 100% reachability from root to every leaf.
4. **Acyclic Directed Tree:** Strict zero-cycle graph topology.
5. **Macro Legalization:** Zero buffer overlaps with macro keepouts.
6. **Max Fanout:** Fanout limit <= 4 per repeater stage.
7. **Max Capacitance:** Driver output load <= cell library limit.
8. **Max Transition Slew:** Clock edge slew <= 100 ps everywhere.
9. **Global Skew Budget:** Clock arrival dispersion <= 60 ps.
10. **Max Latency Budget:** Insertion delay <= 350 ps.
11. **Setup Timing Closure:** $S_{\\text{setup}} \\ge 0\\,\\text{ps}$ across all synchronous paths.
12. **Hold Timing Closure:** $S_{\\text{hold}} \\ge 0\\,\\text{ps}$ across all synchronous paths.
    `,
    assignment: {
      title: 'Capstone: 10-Sink SoC Clock Network Closure',
      scenarioId: 'scenario-capstone-soc',
      instructions:
        'Open scenario-capstone-soc in CTS Studio 1.0. Place repeater hierarchies to drive CPU, GPU, DMA, and peripheral sinks around macro keepouts. Auto-balance or manually tune buffers until all 12 Golden Gates pass, then save your design and export the signoff report.',
      targetCriteria: [
        'At least 8 connected sinks (10 in scenario-capstone-soc).',
        'Zero cycles, zero blockage overlaps, zero disconnected sinks.',
        'Global skew <= 60 ps, max latency <= 350 ps, max transition <= 100 ps.',
        'Setup and hold slack >= 0 ps on all 4 inter-sink data paths.',
        'Zero DRC diagnostics violations.',
        'Valid project saved to browser storage.',
      ],
    },
    question: {
      prompt: 'During CTS signoff, if a clock tree meets its global skew budget but has one buffer violating MAX_TRANSITION (slew > 100 ps), why must this be repaired before tape-out?',
      options: [
        {
          value: 'opt-slew-failure',
          label: 'Slow transition edges cause excessive short-circuit power, degrade noise immunity, and make downstream gate delays unpredictable.',
        },
        {
          value: 'opt-clock-stops',
          label: 'The clock signal will permanently convert from AC to DC.',
        },
        {
          value: 'opt-illegal-gds',
          label: 'GDSII file export tools refuse to compile nets with slow transition times.',
        },
        {
          value: 'opt-reverse-polarity',
          label: 'Slow edges cause the clock polarity to reverse at random intervals.',
        },
      ],
      correctValue: 'opt-slew-failure',
      explanation:
        'Correct! A slow clock transition keeps both PMOS and NMOS transistors partially on for extended periods, causing severe crowbar (short-circuit) power dissipation, heightened jitter, and extreme susceptibility to crosstalk noise.',
    },
  },
};
