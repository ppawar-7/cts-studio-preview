/**
 * fpExpandedCurriculumData.js
 * ============================
 * Definitions, pedagogical narratives, parameters, and deterministic validators
 * for Floorplanning 2.0 Lessons fp-6 through fp-24 across Modules 2 to 6.
 *
 * Uses genuine mathematical formulas from floorplanGeometry, floorplanPDN, and floorplanCongestion.
 */

import {
  computeCoreArea,
  computeUtilization,
  checkMacroOverlap,
  computeHPWL,
  computePlacementRows,
  checkPinSpacing,
  computeAspectRatio,
} from '../../../engine/floorplanGeometry.js';
import {
  detectOpenConnections,
  detectMissingVias,
  computeIRDropEstimate,
} from '../../../engine/floorplanPDN.js';
import { computeCongestionMap } from '../../../engine/floorplanCongestion.js';
import { evaluateFloorplanSignoff } from '../../../engine/floorplanSignoff.js';

export const EXPANDED_LESSONS = {
  // ─── MODULE 2: DIE & CORE ARCHITECTURE ───────────────────────────────────
  'fp-6': {
    id: 'fp-6',
    module: 2,
    moduleTitle: 'Module 2: Die & Core Architecture',
    title: 'Aspect Ratio & Core Shape Tradeoffs',
    description: 'Analyze rectangular vs square aspect ratios and wirelength distribution.',
    xpReward: 35,
    starThresholds: [12, 24, 35],
    duration: '~8 min',
    concept: `Die aspect ratio (AR = Height / Width) impacts global interconnect distribution.
    A square core (AR = 1.0) minimizes average Manhattan distance between random points.
    Rectangular cores (AR = 0.5 or 2.0) stretch horizontal or vertical tracks, increasing RC latency in the stretched axis by up to 25%.`,
    canvas: { dieWidth: 600, dieHeight: 400, coreWidth: 500, coreHeight: 300, margin: 50 },
    questions: [
      {
        field: "bestRatioQuiz",
        prompt: "Which core shape minimises the average Manhattan wirelength between randomly placed flip-flops, all else equal?",
        options: [
        { value: "ar-square", label: "Square core (AR = 1.0): the expected |Δx| + |Δy| between random points is smallest for a fixed area." },
        { value: "ar-extreme", label: "Extreme rectangle (AR = 4.0): wirelength does not depend on the core shape." },
        { value: "ar-wide", label: "Wide core (AR = 0.5): horizontal wires are always faster than vertical ones, so stretch X." },
        ],
      },
    ],
    validate: (inputs) => {
      // Inputs: { aspectRatio, latencyImpact, bestRatioQuiz }
      const ar = Number(inputs.aspectRatio);
      const isArOk = Math.abs(ar - 0.6) <= 0.05; // 300 / 500 = 0.6
      const isQuizOk = inputs.bestRatioQuiz === 'ar-square';
      const passed = isArOk && isQuizOk;
      return {
        passed,
        score: passed ? 35 : isArOk ? 20 : 10,
        stars: passed ? 3 : isArOk ? 2 : 1,
        feedback: passed
          ? '✓ Aspect ratio accurately computed (0.60) and interconnect physics verified!'
          : '⚠️ Check your aspect ratio formula (Height / Width = 300 / 500) and interconnect physics.',
      };
    },
  },

  'fp-7': {
    id: 'fp-7',
    module: 2,
    moduleTitle: 'Module 2: Die & Core Architecture',
    title: 'Core Area Estimation from Gate Count',
    description: 'Calculate placeable core area from synthesized NAND2 gate equivalents.',
    xpReward: 35,
    starThresholds: [12, 24, 35],
    duration: '~10 min',
    concept: `In early physical planning, total standard cell area is estimated using Gate Equivalents (GE).
    For this exercise use a planning figure of 12.5 µm² per gate equivalent. (That is a routing-inclusive
    budgeting number, not a cell size: the sky130_fd_sc_hd nand2_1 cell itself is only about 3.75 µm².)
    For a 100,000 GE design at 70% target utilization:
    StdCell Area = 100,000 × 12.5 µm² = 1,250,000 µm².
    Required Core Area = StdCell Area / 0.70 = 1,785,714 µm².`,
    canvas: { dieWidth: 700, dieHeight: 550, coreWidth: 600, coreHeight: 450, margin: 50 },
    validate: (inputs) => {
      const stdCell = Number(inputs.stdCellArea);
      const reqCore = Number(inputs.requiredCoreArea);
      const isStdOk = Math.abs(stdCell - 1250000) <= 5000;
      const isCoreOk = Math.abs(reqCore - 1785714) <= 10000;
      const passed = isStdOk && isCoreOk;
      return {
        passed,
        score: passed ? 35 : (isStdOk || isCoreOk) ? 20 : 10,
        stars: passed ? 3 : (isStdOk || isCoreOk) ? 2 : 1,
        feedback: passed
          ? '✓ Gate equivalent sizing and target utilization area budget certified!'
          : '⚠️ Double-check: StdCell = 100k × 12.5 = 1,250,000 µm². Core = 1,250,000 / 0.70.',
      };
    },
  },

  'fp-8': {
    id: 'fp-8',
    module: 2,
    moduleTitle: 'Module 2: Die & Core Architecture',
    title: 'Standard Cell Placement Row Generation',
    description: 'Synthesize standard cell rows with legal site widths and alternating power rail flips.',
    xpReward: 40,
    starThresholds: [15, 28, 40],
    duration: '~10 min',
    concept: `Placement tools tile the core with horizontal site rows.
    Row height is fixed to standard cell height (e.g. 2.72 µm in Sky130).
    Alternating rows are mirrored (R0, MX, R0, MX) so adjacent rows share VDD and VSS rails.`,
    canvas: { dieWidth: 600, dieHeight: 450, coreWidth: 500, coreHeight: 350, margin: 50 },
    questions: [
      {
        field: "flipQuiz",
        prompt: "Why are alternate placement rows flipped (R0, MX, R0, MX …)?",
        options: [
        { value: "flip-share-rails", label: "Adjacent rows abut like rails (VDD-VDD, VSS-VSS), so one rail is shared by two rows." },
        { value: "flip-timing", label: "Flipped rows have faster cells because the transistors are mirrored." },
        { value: "flip-density", label: "Flipping doubles the number of sites per row." },
        ],
      },
    ],
    validate: (inputs) => {
      // Core height 350, row height 2.72 -> floor(350 / 2.72) = 128 rows
      const rowCount = Number(inputs.rowCount);
      const isRowsOk = Math.abs(rowCount - 128) <= 2;
      const isFlipQuizOk = inputs.flipQuiz === 'flip-share-rails';
      const passed = isRowsOk && isFlipQuizOk;
      return {
        passed,
        score: passed ? 40 : isRowsOk ? 25 : 10,
        stars: passed ? 3 : isRowsOk ? 2 : 1,
        feedback: passed
          ? '✓ Placement rows legal row count (128) and alternating power rail sharing confirmed!'
          : '⚠️ Verify row count = floor(350 / 2.72) and the reason for alternating row orientation.',
      };
    },
  },

  'fp-9': {
    id: 'fp-9',
    module: 2,
    moduleTitle: 'Module 2: Die & Core Architecture',
    title: 'Placement Blockages & Keepout Zones',
    description: 'Configure hard and soft placement blockages to prevent cell density hotspots.',
    xpReward: 40,
    starThresholds: [15, 28, 40],
    duration: '~10 min',
    concept: `Blockages restrict placement:
    1. Hard Blockage: Zero standard cells may be placed inside (e.g. analog IP isolation).
    2. Soft Blockage: Only low-priority non-timing-critical cells allowed during global placement.
    3. Halo Keepout: Automatically enforced around macro boundaries for pin breakout.`,
    canvas: { dieWidth: 600, dieHeight: 450, coreWidth: 500, coreHeight: 350, margin: 50 },
    questions: [
      {
        field: "hardBlockQuiz",
        prompt: "What does a HARD placement blockage allow inside its area?",
        options: [
        { value: "hard-zero-cells", label: "No standard cells at all — the placer must keep the region empty." },
        { value: "hard-buffers-only", label: "Only buffers and inverters inserted during optimisation." },
        { value: "hard-50-percent", label: "Standard cells up to 50% local density." },
        ],
      },
      {
        field: "softBlockQuiz",
        prompt: "What does a SOFT placement blockage do?",
        options: [
        { value: "soft-coarse-allow", label: "Blocks the initial (global) placement but lets legalisation/optimisation put cells there later." },
        { value: "soft-routing", label: "Blocks routing wires but never standard cells." },
        { value: "soft-ignored", label: "Nothing — soft blockages are advisory comments only." },
        ],
      },
    ],
    validate: (inputs) => {
      const isHardQuizOk = inputs.hardBlockQuiz === 'hard-zero-cells';
      const isSoftQuizOk = inputs.softBlockQuiz === 'soft-coarse-allow';
      const passed = isHardQuizOk && isSoftQuizOk;
      return {
        passed,
        score: passed ? 40 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Hard vs Soft placement blockage constraints verified!'
          : '⚠️ Hard blockages strictly forbid all standard cells, whereas soft blockages allow relaxed global placement.',
      };
    },
  },

  // ─── MODULE 3: ADVANCED HARD MACRO PLACEMENT ──────────────────────────────
  'fp-10': {
    id: 'fp-10',
    module: 3,
    moduleTitle: 'Module 3: Advanced Hard Macro Placement',
    title: 'Macro Orientation & Symmetry (R0, R90, MY, MX)',
    description: 'Orient hard macro pin ports towards core center to eliminate outer routing blockages.',
    xpReward: 40,
    starThresholds: [15, 28, 40],
    duration: '~12 min',
    concept: `Hard memory macros have pin ports on one or two edges.
    If macro ports face the die boundary, wires must wrap around the macro body, causing routing congestion.
    Flipping orientation (e.g. MY for right-side macros) directs pin escape ports inward towards the standard cell area.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "chosenOrientation",
        prompt: "An SRAM on the RIGHT side of the core has its pins on its right edge in R0, facing the die boundary. Which orientation turns the pins toward the core centre without rotating the footprint?",
        options: [
        { value: "MY", label: "MY — mirror about the Y axis: left and right edges swap, pins now face left (inward)." },
        { value: "MX", label: "MX — mirror about the X axis: top and bottom swap, pins still face right." },
        { value: "R90", label: "R90 — rotate 90°: the footprint becomes tall and the pins face up or down." },
        { value: "R0", label: "R0 — keep it as is; the router will go around the macro." },
        ],
      },
      {
        field: "pinFacingQuiz",
        prompt: "Why should macro pins face the standard-cell area?",
        options: [
        { value: "face-inward", label: "Pin escape wires reach the logic directly instead of detouring around the macro body." },
        { value: "face-outward", label: "Pins facing the die edge are closer to the I/O pads, which always matters more." },
        { value: "face-irrelevant", label: "Pin side does not matter once the macro is placed." },
        ],
      },
    ],
    validate: (inputs) => {
      const isOrientOk = inputs.chosenOrientation === 'MY';
      const isPinQuizOk = inputs.pinFacingQuiz === 'face-inward';
      const passed = isOrientOk && isPinQuizOk;
      return {
        passed,
        score: passed ? 40 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Memory orientation symmetry (MY) verified! Pin escape channels face inward.'
          : '⚠️ Orient right-hand memory blocks with MY (Mirror Y) so pins face inward into the core.',
      };
    },
  },

  'fp-11': {
    id: 'fp-11',
    module: 3,
    moduleTitle: 'Module 3: Advanced Hard Macro Placement',
    title: 'Macro Keepout Halos & Routing Channels',
    description: 'Enforce independent per-macro halos and calculate minimum channel widths.',
    xpReward: 45,
    starThresholds: [18, 32, 45],
    duration: '~12 min',
    concept: `Each macro has an independent keepout halo.
    If Macro A has halo = 15 µm and Macro B has halo = 20 µm, the minimum physical separation channel between them must be:
    Channel Width >= haloA + haloB = 15 + 20 = 35 µm!
    Narrow routing corridors (< 30 µm) cause DRC pin congestion errors during detailed routing.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "corridorQuiz",
        prompt: "Why are narrow channels between macros a problem?",
        options: [
        { value: "corridor-congestion", label: "Too few routing tracks for the pin escapes of two facing macros, which leads to congestion and DRC shorts." },
        { value: "corridor-heat", label: "Narrow channels overheat because macros radiate into each other." },
        { value: "corridor-area", label: "They waste area; they are never a routing problem." },
        ],
      },
    ],
    validate: (inputs) => {
      const sep = Number(inputs.requiredSeparation);
      const isSepOk = sep === 35;
      const isCorridorQuizOk = inputs.corridorQuiz === 'corridor-congestion';
      const passed = isSepOk && isCorridorQuizOk;
      return {
        passed,
        score: passed ? 45 : isSepOk ? 30 : 15,
        stars: passed ? 3 : isSepOk ? 2 : 1,
        feedback: passed
          ? '✓ Per-macro halo sum rule (15 + 20 = 35 µm) and narrow channel avoidance verified!'
          : '⚠️ Remember: Halos are per-macro keepouts. Minimum separation is haloA + haloB = 15 + 20 = 35 µm.',
      };
    },
  },

  'fp-12': {
    id: 'fp-12',
    module: 3,
    moduleTitle: 'Module 3: Advanced Hard Macro Placement',
    title: 'Macro Placement Constraints & Fixed Pins',
    description: 'Lock critical macros and define forbidden routing and placement regions.',
    xpReward: 45,
    starThresholds: [18, 32, 45],
    duration: '~10 min',
    concept: `Floorplanners mark pre-placed macros with "fixed: true" to prevent placement engines from moving them.
    Power rings and analog PLL macros must be fixed before automated standard cell global placement begins.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "fixedConcept",
        prompt: "Why mark pre-placed macros as fixed before standard-cell placement?",
        options: [
        { value: "lock-prevent-drift", label: "So the placer and later optimisation cannot move them away from the planned power, pin and channel arrangement." },
        { value: "lock-faster-timing", label: "Fixed macros have lower internal delay." },
        { value: "lock-remove-halo", label: "Fixing a macro removes the need for a keepout halo." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.fixedConcept === 'lock-prevent-drift';
      return {
        passed,
        score: passed ? 45 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Macro fixed status lock and placement immutability verified!'
          : '⚠️ Fixed macros prevent downstream analytical engines from perturbing manual block placement.',
      };
    },
  },

  'fp-13': {
    id: 'fp-13',
    module: 3,
    moduleTitle: 'Module 3: Advanced Hard Macro Placement',
    title: 'Macro Dataflow & Flyline Connectivity',
    description: 'Use net flylines to cluster interconnected macros and minimize bus crossing wirelength.',
    xpReward: 45,
    starThresholds: [18, 32, 45],
    duration: '~12 min',
    concept: `Flylines display straight-line net connectivity between blocks.
    When bus flylines cross diagonally, routing congestion skyrockets.
    Placing sender and receiver macros along the same die edge eliminates bus crossings and cuts wirelength by up to 60%.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "flylineQuiz",
        prompt: "Flylines show a wide bus between an SRAM and the I/O pins on the opposite side of the die, crossing other busses diagonally. What is the best floorplan response?",
        options: [
        { value: "flyline-cluster-bus", label: "Move the SRAM (or the pins) so the connected blocks sit on the same side and the bus does not cross others." },
        { value: "flyline-more-layers", label: "Leave placement alone and request extra routing layers." },
        { value: "flyline-hide", label: "Turn off flylines; they are only a display aid." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.flylineQuiz === 'flyline-cluster-bus';
      return {
        passed,
        score: passed ? 45 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Flyline dataflow clustering and bus crossover minimization verified!'
          : '⚠️ Cluster communicating blocks adjacent to one another along the dataflow pipeline.',
      };
    },
  },

  // ─── MODULE 4: I/O & POWER DISTRIBUTION NETWORK (PDN) ─────────────────────
  'fp-14': {
    id: 'fp-14',
    module: 4,
    moduleTitle: 'Module 4: I/O & Power Distribution Network (PDN)',
    title: 'I/O Pad Ring & Boundary Pin Assignment',
    description: 'Distribute chip I/O pads around die perimeter and enforce pitch DRC rules.',
    xpReward: 45,
    starThresholds: [18, 32, 45],
    duration: '~10 min',
    concept: `I/O boundary pins must respect minimum physical spacing rules (pitch DRC).
    Pins placed closer than the design rule threshold (< 10 µm) cause DRC violations and bond pad manufacturing shorts.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "pinPitchQuiz",
        prompt: "Why is a minimum pin-to-pin pitch enforced on the die edge?",
        options: [
        { value: "prevent-shorts", label: "Pins closer than the pitch cannot be drawn and routed without spacing violations or shorts." },
        { value: "prevent-esd", label: "Pitch only matters for electrostatic discharge cells." },
        { value: "prevent-none", label: "It is a cosmetic convention." },
        ],
      },
    ],
    validate: (inputs) => {
      // Two pins on the top edge of a 500 µm-wide core, minimum pitch 10 µm (same rule as the Studio).
      const raw1 = inputs.pinCoord1;
      const raw2 = inputs.pinCoord2;
      const entered = raw1 !== undefined && raw1 !== '' && raw2 !== undefined && raw2 !== '';
      const p1 = Number(raw1);
      const p2 = Number(raw2);
      const pinCheck = entered
        ? checkPinSpacing([{ id: 'pin_a', edge: 'top', coord: p1 }, { id: 'pin_b', edge: 'top', coord: p2 }], 'top', 10, 500, 400)
        : { valid: false, violations: [{ message: 'Enter both pin coordinates.' }] };
      const isSpacingOk = entered && Number.isFinite(p1) && Number.isFinite(p2) && pinCheck.valid;
      const passed = isSpacingOk && inputs.pinPitchQuiz === 'prevent-shorts';
      return {
        passed,
        score: passed ? 45 : isSpacingOk ? 30 : 15,
        stars: passed ? 3 : isSpacingOk ? 2 : 1,
        feedback: passed
          ? `✓ Pins at ${p1} µm and ${p2} µm are ${Math.abs(p2 - p1)} µm apart on the edge — pitch DRC clean.`
          : `⚠️ ${pinCheck.violations[0]?.message || 'Explain why pitch is enforced.'}`,
      };
    },
  },

  'fp-15': {
    id: 'fp-15',
    module: 4,
    moduleTitle: 'Module 4: I/O & Power Distribution Network (PDN)',
    title: 'Pin-to-Macro Net Wirelength Optimization',
    description: 'Align memory address and data pins directly adjacent to corresponding I/O pads.',
    xpReward: 45,
    starThresholds: [18, 32, 45],
    duration: '~10 min',
    concept: `Aligning external memory pins on the left edge with SRAM blocks placed on the left side of the core
    shortens I/O bus trace HPWL from 500 µm down to under 80 µm, improving setup slack by over 1.2 ns!`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "alignQuiz",
        prompt: "Memory address/data pins and the SRAM they feed — where should they be placed relative to each other?",
        options: [
        { value: "align-adjacent-edge", label: "On the same side: pins on the edge adjacent to the SRAM, so the nets are short and do not cross the core." },
        { value: "align-opposite-edge", label: "On opposite edges to spread the wires across the whole core." },
        { value: "align-random", label: "Anywhere; the router equalises wirelength." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.alignQuiz === 'align-adjacent-edge';
      return {
        passed,
        score: passed ? 45 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ I/O pad to macro pin alignment strategy verified!'
          : '⚠️ Align I/O pads on the boundary edge closest to the corresponding memory block.',
      };
    },
  },

  'fp-16': {
    id: 'fp-16',
    module: 4,
    moduleTitle: 'Module 4: I/O & Power Distribution Network (PDN)',
    title: 'Power Ring Synthesis & Sizing (VDD/VSS)',
    description: 'Synthesize low-impedance VDD and VSS rings on thick upper metal layers.',
    xpReward: 45,
    starThresholds: [18, 32, 45],
    duration: '~12 min',
    concept: `Power rings encircle the core to distribute current evenly from bond pads.
    Upper metal layers (Metal 5, Metal 6) are chosen because their thickness provides much lower sheet resistance (0.04 Ω/sq vs 0.15 Ω/sq on M1).
    Wider rings handle higher current density without electromigration (EM) failure.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "layerQuiz",
        prompt: "Which layers are normally used for core power rings?",
        options: [
        { value: "upper-thick-metal", label: "Upper, thick metal layers — lowest sheet resistance and they do not block lower signal routing." },
        { value: "lower-thin-metal", label: "Metal 1, because it is closest to the transistors." },
        { value: "poly", label: "Polysilicon, because it is the gate material." },
        ],
      },
      {
        field: "emQuiz",
        prompt: "Why are power rings made wide?",
        options: [
        { value: "em-current-density", label: "To keep current density below the electromigration limit and lower resistance." },
        { value: "em-capacitance", label: "Wider rings add capacitance that speeds up signals." },
        { value: "em-looks", label: "Width only affects how the layout looks." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.layerQuiz === 'upper-thick-metal' && inputs.emQuiz === 'em-current-density';
      return {
        passed,
        score: passed ? 45 : 25,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Power ring layer selection (thick upper metals) and electromigration sizing verified!'
          : '⚠️ Use thick upper metal layers (M5/M6) for low resistance and wide tracks to satisfy electromigration.',
      };
    },
  },

  'fp-17': {
    id: 'fp-17',
    module: 4,
    moduleTitle: 'Module 4: I/O & Power Distribution Network (PDN)',
    title: 'Power Strap Meshes & Interlayer Vias',
    description: 'Build intermediate power strap grids and ensure complete via arrays at layer crossings.',
    xpReward: 50,
    starThresholds: [20, 38, 50],
    duration: '~15 min',
    concept: `Orthogonal power straps (horizontal M4, vertical M5) create a robust low-resistance power grid.
    Crucially: Metal layer crossings without physical vias do NOT conduct electricity.
    A dropped via causes an open net failure in power routing checks!`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "viaQuiz",
        prompt: "An M4 strap crosses an M5 ring with no via. What is the electrical result?",
        options: [
        { value: "via-electrical-connection", label: "No connection — different layers only connect through a via, so the strap may be floating." },
        { value: "via-auto-connect", label: "They connect automatically wherever they overlap." },
        { value: "via-short", label: "It creates a short to the other supply." },
        ],
      },
      {
        field: "meshQuiz",
        prompt: "Why use a mesh of orthogonal straps instead of one strap?",
        options: [
        { value: "mesh-low-resistance", label: "Many parallel paths lower the effective resistance and IR drop." },
        { value: "mesh-fewer-vias", label: "A mesh needs fewer vias." },
        { value: "mesh-routing", label: "A mesh frees more signal tracks than a single strap." },
        ],
      },
    ],
    validate: (inputs) => {
      const isViaQuizOk = inputs.viaQuiz === 'via-electrical-connection';
      const isMeshQuizOk = inputs.meshQuiz === 'mesh-low-resistance';
      const passed = isViaQuizOk && isMeshQuizOk;
      return {
        passed,
        score: passed ? 50 : 25,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Power strap mesh architecture and interlayer via continuity verified!'
          : '⚠️ Metal crossings require physical vias to conduct current; without vias, the strap remains floating.',
      };
    },
  },

  'fp-18': {
    id: 'fp-18',
    module: 4,
    moduleTitle: 'Module 4: I/O & Power Distribution Network (PDN)',
    title: 'IR-Drop Analysis & Static Rail Integrity',
    description: 'Calculate static voltage drop (V = I * R) across the power grid to prevent logic failure.',
    xpReward: 50,
    starThresholds: [20, 38, 50],
    duration: '~12 min',
    concept: `Current flowing through metal resistance causes voltage droop: V_drop = I_load × R_grid.
    If supply voltage drops by more than 5% (e.g. > 90 mV on 1.8V supply), standard cells slow down, causing setup timing failures or functional corruption.
    Adding more power straps reduces strap resistance and cures IR-drop.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "irFixQuiz",
        prompt: "Analysis shows a 60 mV IR-drop hotspot in the middle of a strap. Which change reduces it?",
        options: [
        { value: "add-more-straps", label: "Add straps / widen them and feed them from both ends, lowering the grid resistance." },
        { value: "raise-frequency", label: "Raise the clock frequency so the drop lasts for less time." },
        { value: "remove-vias", label: "Remove vias to break the current loop." },
        ],
      },
    ],
    validate: (inputs) => {
      // Current = 20mA, R = 1.5 Ohm -> IR = 30 mV
      const drop = Number(inputs.calculatedDrop);
      const isDropOk = Math.abs(drop - 30) <= 2;
      const isFixOk = inputs.irFixQuiz === 'add-more-straps';
      const passed = isDropOk && isFixOk;
      return {
        passed,
        score: passed ? 50 : isDropOk ? 30 : 15,
        stars: passed ? 3 : isDropOk ? 2 : 1,
        feedback: passed
          ? '✓ Static IR drop calculation (30 mV) and strap pitch remediation verified!'
          : '⚠️ V_drop = I × R = 20 mA × 1.5 Ω = 30 mV. Adding straps in parallel lowers overall resistance.',
      };
    },
  },

  // ─── MODULE 5: ANALYSIS & OPTIMIZATION ────────────────────────────────────
  'fp-19': {
    id: 'fp-19',
    module: 5,
    moduleTitle: 'Module 5: Analysis & Optimization',
    title: 'Early Routing Congestion Estimation',
    description: 'Evaluate bin routing capacity vs net wire demand to eliminate placement bottlenecks.',
    xpReward: 50,
    starThresholds: [20, 38, 50],
    duration: '~12 min',
    concept: `Congestion is modeled by dividing the core into 2D routing bins.
    When estimated wire demand exceeds available metal track capacity (ratio > 1.0), the router will fail or generate thousands of DRC shorts.
    Spacing macros apart spreads wire demand across multiple bins.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "congestionQuiz",
        prompt: "Several routing bins between two macros show demand/capacity above 1.0. What is the floorplan fix?",
        options: [
        { value: "congestion-spread-macros", label: "Widen the channel or move the macros apart so demand spreads over more bins." },
        { value: "congestion-raise-util", label: "Increase utilisation so cells are closer together." },
        { value: "congestion-ignore", label: "Ignore it; detailed routing always resolves global overflow." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.congestionQuiz === 'congestion-spread-macros';
      return {
        passed,
        score: passed ? 50 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Routing congestion bin capacity model and hotspot alleviation verified!'
          : '⚠️ Alleviate routing hotspots by increasing macro separation channels.',
      };
    },
  },

  'fp-20': {
    id: 'fp-20',
    module: 5,
    moduleTitle: 'Module 5: Analysis & Optimization',
    title: 'Floorplan DRC & Clearance Diagnostics',
    description: 'Diagnose and resolve macro-to-macro keepouts, boundary notch errors, and core clearance.',
    xpReward: 50,
    starThresholds: [20, 38, 50],
    duration: '~12 min',
    concept: `Physical Design Rules (DRC) mandate:
    1. Zero macro-to-macro physical body overlaps.
    2. Minimum clearance channels between keepout halos.
    3. No narrow notch channels where standard cells cannot be legalized.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "drcQuiz",
        prompt: "What does floorplan sign-off require from the DRC report?",
        options: [
        { value: "drc-zero-tolerances", label: "Zero violations: no overlaps, no core-boundary violations, no pin-pitch violations." },
        { value: "drc-under-ten", label: "Fewer than ten violations; routing will fix the rest." },
        { value: "drc-warnings-only", label: "Only that the report runs without crashing." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.drcQuiz === 'drc-zero-tolerances';
      return {
        passed,
        score: passed ? 50 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Floorplan DRC rule criteria and notch clearance certified!'
          : '⚠️ Foundry DRC is fail-closed: zero boundary or overlap violations are permitted for signoff.',
      };
    },
  },

  'fp-21': {
    id: 'fp-21',
    module: 5,
    moduleTitle: 'Module 5: Analysis & Optimization',
    title: 'PPA Tradeoff Analysis (Area vs Wirelength)',
    description: 'Evaluate PPA balance: compact die area vs increased routing congestion.',
    xpReward: 50,
    starThresholds: [20, 38, 50],
    duration: '~12 min',
    concept: `PPA Tradeoff:
    Smaller die size saves silicon fabrication cost, but pushes core utilization above 85%, causing massive routing congestion and longer detour wirelengths.
    A well-balanced floorplan targets 65% - 75% utilization.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "ppaQuiz",
        prompt: "Which initial core utilisation target is the usual balance between area and routability?",
        options: [
        { value: "ppa-balance-65-75", label: "Roughly 65–75%: small enough die, with room for buffering and routing." },
        { value: "ppa-max-95", label: "95% or more, to minimise area." },
        { value: "ppa-min-30", label: "About 30%, so routing is never a concern." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.ppaQuiz === 'ppa-balance-65-75';
      return {
        passed,
        score: passed ? 50 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ PPA optimization balance (65-75% target utilization) verified!'
          : '⚠️ Optimal commercial ASIC floorplans target 65-75% utilization to guarantee routability.',
      };
    },
  },

  'fp-22': {
    id: 'fp-22',
    module: 5,
    moduleTitle: 'Module 5: Analysis & Optimization',
    title: 'Comparative Floorplan Candidate Evaluation',
    description: 'Score two competing candidate floorplans against HPWL, utilization, and IR-drop metrics.',
    xpReward: 50,
    starThresholds: [20, 38, 50],
    duration: '~15 min',
    concept: `Engineers generate multiple candidate floorplans (e.g. corner placement vs center placement).
    Candidates are evaluated across a weighted score matrix:
    Score = w1*(1/HPWL) + w2*(1/IR_Drop) + w3*(1/Congestion).
    Corner macro placement consistently beats center placement by preserving contiguous placeable area.`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "candidateChoice",
        prompt: "Candidate A puts four SRAMs against the core corners/edges; candidate B places them in the centre. Which usually wins, and why?",
        options: [
        { value: "candidate-corner-placement", label: "A — edge/corner macros leave one large contiguous region for standard cells and keep channels to a minimum." },
        { value: "candidate-center-placement", label: "B — central macros are equidistant from everything, so they never cause congestion." },
        { value: "candidate-equal", label: "They are always equivalent; only utilisation matters." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.candidateChoice === 'candidate-corner-placement';
      return {
        passed,
        score: passed ? 50 : 20,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Candidate floorplan scoring matrix and corner placement choice verified!'
          : '⚠️ Placing large hard macros against corners and edges preserves contiguous placeable area for standard cells.',
      };
    },
  },

  // ─── MODULE 6: MASTER CAPSTONE ───────────────────────────────────────────
  'fp-23': {
    id: 'fp-23',
    module: 6,
    moduleTitle: 'Module 6: Master Floorplan Capstone',
    title: 'Floorplan Signoff & Quality Metrics',
    description: 'Execute complete sign-off verification report covering DRC, PDN continuity, and routability.',
    xpReward: 55,
    starThresholds: [22, 42, 55],
    duration: '~15 min',
    concept: `Final sign-off requires passing all three physical gates:
    1. DRC Clearance (0 violations)
    2. Power Grid Continuity (0 open VDD/VSS segments, 0 missing vias)
    3. Routability Margin (Max routing bin demand < 0.90).`,
    canvas: { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 },
    questions: [
      {
        field: "signoffChecklist",
        prompt: "What must hold before the floorplan is signed off?",
        options: [
        { value: "all-three-gates-pass", label: "All three gates together: zero DRC violations, a continuous power grid with no missing vias, and routability margin." },
        { value: "drc-only", label: "DRC clean is enough; power and routability are checked after routing." },
        { value: "pdn-only", label: "A connected power grid is enough." },
        ],
      },
    ],
    validate: (inputs) => {
      const passed = inputs.signoffChecklist === 'all-three-gates-pass';
      return {
        passed,
        score: passed ? 55 : 25,
        stars: passed ? 3 : 2,
        feedback: passed
          ? '✓ Comprehensive physical design sign-off verification criteria certified!'
          : '⚠️ Signoff requires passing DRC, PDN continuity, and routability margins simultaneously.',
      };
    },
  },

  'fp-24': {
    id: 'fp-24',
    module: 6,
    moduleTitle: 'Module 6: Master Floorplan Capstone',
    title: 'Full Chip Floorplan Master Capstone',
    description: 'Repair and sign off a 4-macro floorplan in the Studio; graded on your saved design, not on checkboxes.',
    xpReward: 60,
    starThresholds: [24, 45, 60],
    duration: '~20 min',
    concept: `The Grand Capstone is graded on your real Floorplan Studio project, using the same rule deck as the Studio's Diagnostics tab.
    Start from a 4-macro benchmark (Dual SRAM Controller or Small SoC Subsystem), find its defect, repair it, and keep every macro legal:
    no overlaps or halo conflicts, macros inside the core, I/O pitch respected, VDD/VSS continuous with every strap-to-ring via present, no shorts, and utilization within budget.
    Save the project in the Studio, then verify here.`,
    canvas: { dieWidth: 700, dieHeight: 550, coreWidth: 600, coreHeight: 450, margin: 50 },
    requiresStudioProject: true,
    minMacros: 4,
    validate: (inputs) => {
      // Grades the student's saved Floorplan Studio project with the same rule deck the Studio uses.
      // Self-attested checkboxes are not accepted.
      const project = inputs && inputs.project;
      if (!project) {
        return {
          passed: false,
          score: 0,
          stars: 0,
          feedback: '⚠️ No saved Studio project found. Open the Floorplan Studio, build or repair a design, press Save, then come back.',
        };
      }
      const report = evaluateFloorplanSignoff(project);
      const macrosOk = report.metrics.macroCount >= 4;
      const errorsOk = report.errorCount === 0;
      const cleanOk = report.clean;
      const passed = macrosOk && cleanOk;
      const firstIssue = report.violations[0];
      return {
        passed,
        score: passed ? 60 : (macrosOk && errorsOk) ? 40 : macrosOk ? 20 : 10,
        stars: passed ? 3 : (macrosOk && errorsOk) ? 2 : 1,
        report,
        feedback: passed
          ? `🏆 Signed off: ${report.metrics.macroCount} macros, 0 DRC/PDN violations, utilization ${report.metrics.nominalUtilization}%, worst IR drop ${report.metrics.maxIRDropMv} mV.`
          : !macrosOk
          ? `⚠️ The capstone needs at least 4 hard macros (your project has ${report.metrics.macroCount}). Load the Dual SRAM or Small SoC benchmark in the Studio and repair it.`
          : `⚠️ ${report.violations.length} violation(s) remain. First: ${firstIssue.rule} — ${firstIssue.message}`,
      };
    },
  },
};
