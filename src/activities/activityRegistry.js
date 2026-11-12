import FPExpandedLessonChallenge from './floorplanning/expanded/FPExpandedLessonChallenge.jsx';
import { EXPANDED_LESSONS } from './floorplanning/expanded/fpExpandedCurriculumData.js';
/**
 * activityRegistry.js
 * ====================
 * Decoupled registry mapping level IDs to educational interactive challenge components
 * and deterministic validators.
 *
 * Keeps LevelPage.jsx clean and extensible as new kingdom activities are added.
 */

import React from 'react';

// Kingdom 1: RTL Understanding
import RTLMuxChallenge from './rtl/RTLMuxChallenge.jsx';
import { validateMuxChallenge } from './rtl/validators/validateMuxChallenge.js';
import RTLDFFChallenge from './rtl/RTLDFFChallenge.jsx';
import { validateDFFChallenge } from './rtl/validators/validateDFFChallenge.js';
import RTLCombSeqChallenge from './rtl/RTLCombSeqChallenge.jsx';
import { validateCombSeqChallenge } from './rtl/validators/validateCombSeqChallenge.js';
import RTLAccumulatorChallenge from './rtl/RTLAccumulatorChallenge.jsx';
import { validateAccumulatorChallenge } from './rtl/validators/validateAccumulatorChallenge.js';
import RTLFSMChallenge from './rtl/RTLFSMChallenge.jsx';
import { validateFSMChallenge } from './rtl/validators/validateFSMChallenge.js';

// Kingdom 2: Synthesis
import SynIntroChallenge from './synthesis/SynIntroChallenge.jsx';
import { validateSynIntro } from './synthesis/validators/validateSynIntro.js';
import SynOptimizationChallenge from './synthesis/SynOptimizationChallenge.jsx';
import { validateSynOptimization } from './synthesis/validators/validateSynOptimization.js';
import SynTechMappingChallenge from './synthesis/SynTechMappingChallenge.jsx';
import { validateSynTechMapping } from './synthesis/validators/validateSynTechMapping.js';
import SynTimingChallenge from './synthesis/SynTimingChallenge.jsx';
import { validateSynTiming } from './synthesis/validators/validateSynTiming.js';
import SynCapstoneChallenge from './synthesis/SynCapstoneChallenge.jsx';
import { validateSynCapstone } from './synthesis/validators/validateSynCapstone.js';

// Kingdom 3: Floorplanning
import FPIntroChallenge from './floorplanning/FPIntroChallenge.jsx';
import { validateFPIntro } from './floorplanning/validators/validateFPIntro.js';
import FPGeometryChallenge from './floorplanning/FPGeometryChallenge.jsx';
import { validateFPGeometry } from './floorplanning/validators/validateFPGeometry.js';
import FPPinPlacementChallenge from './floorplanning/FPPinPlacementChallenge.jsx';
import { validateFPPinPlacement } from './floorplanning/validators/validateFPPinPlacement.js';
import FPMacroPlacementChallenge from './floorplanning/FPMacroPlacementChallenge.jsx';
import { validateFPMacroPlacement } from './floorplanning/validators/validateFPMacroPlacement.js';
import FPKingdomChallenge from './floorplanning/FPKingdomChallenge.jsx';
import { validateFPKingdom } from './floorplanning/validators/validateFPKingdom.js';

// Kingdom 4: Placement
import PLIntroChallenge from './placement/PLIntroChallenge.jsx';
import { validatePLIntro } from './placement/validators/validatePLIntro.js';
import PLGlobalDetailedChallenge from './placement/PLGlobalDetailedChallenge.jsx';
import { validatePLGlobalDetailed } from './placement/validators/validatePLGlobalDetailed.js';
import PLTimingDrivenChallenge from './placement/PLTimingDrivenChallenge.jsx';
import { validatePLTimingDriven } from './placement/validators/validatePLTimingDriven.js';
import PLCongestionChallenge from './placement/PLCongestionChallenge.jsx';
import { validatePLCongestion } from './placement/validators/validatePLCongestion.js';
import PLKingdomChallenge from './placement/PLKingdomChallenge.jsx';
import { validatePLKingdom } from './placement/validators/validatePLKingdom.js';

// Kingdom 5: Clock Tree Synthesis (CTS)
import CTSIntroChallenge from './cts/CTSIntroChallenge.jsx';
import { validateCTSIntro } from './cts/validators/validateCTSIntro.js';
import CTSSkewLatencyChallenge from './cts/CTSSkewLatencyChallenge.jsx';
import { validateCTSSkewLatency } from './cts/validators/validateCTSSkewLatency.js';
import CTSBufferInsertionChallenge from './cts/CTSBufferInsertionChallenge.jsx';
import { validateCTSBufferInsertion } from './cts/validators/validateCTSBufferInsertion.js';
import CTSTopologiesChallenge from './cts/CTSTopologiesChallenge.jsx';
import { validateCTSTopologies } from './cts/validators/validateCTSTopologies.js';
import CTSKingdomChallenge from './cts/CTSKingdomChallenge.jsx';
import { validateCTSKingdom } from './cts/validators/validateCTSKingdom.js';
import CTSExpandedLessonChallenge from './cts/expanded/CTSExpandedLessonChallenge.jsx';
import { validateCTSExpandedLesson } from './cts/validators/validateCTSExpandedLesson.js';

// Kingdom 6: Routing
import RTIntroChallenge from './routing/RTIntroChallenge.jsx';
import { validateRTIntro } from './routing/validators/validateRTIntro.js';
import RTMetalLayersChallenge from './routing/RTMetalLayersChallenge.jsx';
import { validateRTMetalLayers } from './routing/validators/validateRTMetalLayers.js';
import RTViasContactsChallenge from './routing/RTViasContactsChallenge.jsx';
import { validateRTViasContacts } from './routing/validators/validateRTViasContacts.js';
import RTSignalIntegrityChallenge from './routing/RTSignalIntegrityChallenge.jsx';
import { validateRTSignalIntegrity } from './routing/validators/validateRTSignalIntegrity.js';
import RTKingdomChallenge from './routing/RTKingdomChallenge.jsx';
import { validateRTKingdom } from './routing/validators/validateRTKingdom.js';

// Kingdom 7: Filler Cells
import FCIntroChallenge from './filler-cells/FCIntroChallenge.jsx';
import { validateFCIntro } from './filler-cells/validators/validateFCIntro.js';
import FCCellTypesChallenge from './filler-cells/FCCellTypesChallenge.jsx';
import { validateFCCellTypes } from './filler-cells/validators/validateFCCellTypes.js';
import FCWellContinuityChallenge from './filler-cells/FCWellContinuityChallenge.jsx';
import { validateFCWellContinuity } from './filler-cells/validators/validateFCWellContinuity.js';
import FCDecapStrategyChallenge from './filler-cells/FCDecapStrategyChallenge.jsx';
import { validateFCDecapStrategy } from './filler-cells/validators/validateFCDecapStrategy.js';
import FCKingdomChallenge from './filler-cells/FCKingdomChallenge.jsx';
import { validateFCKingdom } from './filler-cells/validators/validateFCKingdom.js';

// Kingdom 8: GDS & Tape-Out
import GDSIntroChallenge from './gds/GDSIntroChallenge.jsx';
import { validateGDSIntro } from './gds/validators/validateGDSIntro.js';
import GDSSignoffChecksChallenge from './gds/GDSSignoffChecksChallenge.jsx';
import { validateGDSSignoffChecks } from './gds/validators/validateGDSSignoffChecks.js';
import GDSLayerStackChallenge from './gds/GDSLayerStackChallenge.jsx';
import { validateGDSLayerStack } from './gds/validators/validateGDSLayerStack.js';
import GDSTapeoutPrepChallenge from './gds/GDSTapeoutPrepChallenge.jsx';
import { validateGDSTapeoutPrep } from './gds/validators/validateGDSTapeoutPrep.js';
import GDSFinalCapstoneChallenge from './gds/GDSFinalCapstoneChallenge.jsx';
import { validateGDSFinalCapstone } from './gds/validators/validateGDSFinalCapstone.js';

const ACTIVITY_REGISTRY = {
  // ─── Kingdom 1: RTL Understanding ──────────────────────────────────────────
  'rtl-1': {
    levelId: 'rtl-1',
    kingdomId: 'rtl-understanding',
    title: '2:1 Multiplexer — The Core of RTL Dataflow Steering',
    component: RTLMuxChallenge,
    validator: validateMuxChallenge,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'rtl-2': {
    levelId: 'rtl-2',
    kingdomId: 'rtl-understanding',
    title: 'Signals and Registers — Edge-Triggered Sequential Storage',
    component: RTLDFFChallenge,
    validator: validateDFFChallenge,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'rtl-3': {
    levelId: 'rtl-3',
    kingdomId: 'rtl-understanding',
    title: 'Combinational vs Sequential Logic — Latch Hazards & Propagation',
    component: RTLCombSeqChallenge,
    validator: validateCombSeqChallenge,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'rtl-4': {
    levelId: 'rtl-4',
    kingdomId: 'rtl-understanding',
    title: 'Block Diagram Challenge — 8-Bit Pipelined Accumulator',
    component: RTLAccumulatorChallenge,
    validator: validateAccumulatorChallenge,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'rtl-5': {
    levelId: 'rtl-5',
    kingdomId: 'rtl-understanding',
    title: 'RTL Kingdom Capstone — 1011 Sequence Detector FSM',
    component: RTLFSMChallenge,
    validator: validateFSMChallenge,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },

  // ─── Kingdom 2: Synthesis ──────────────────────────────────────────────────
  'syn-1': {
    levelId: 'syn-1',
    kingdomId: 'synthesis',
    title: 'What is Synthesis? — RTL to Gate Netlist Transformation',
    component: SynIntroChallenge,
    validator: validateSynIntro,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'syn-2': {
    levelId: 'syn-2',
    kingdomId: 'synthesis',
    title: 'Logic Optimization — Constant Folding & Boolean Minimization',
    component: SynOptimizationChallenge,
    validator: validateSynOptimization,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'syn-3': {
    levelId: 'syn-3',
    kingdomId: 'synthesis',
    title: 'Technology Mapping — Standard-Cell Library Binding',
    component: SynTechMappingChallenge,
    validator: validateSynTechMapping,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'syn-4': {
    levelId: 'syn-4',
    kingdomId: 'synthesis',
    title: 'Timing Constraints — SDC & Setup Slack Closure',
    component: SynTimingChallenge,
    validator: validateSynTiming,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'syn-5': {
    levelId: 'syn-5',
    kingdomId: 'synthesis',
    title: 'Synthesis Kingdom Challenge — ALU PPA Optimization & Signoff',
    component: SynCapstoneChallenge,
    validator: validateSynCapstone,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },

  // ─── Kingdom 3: Floorplanning ──────────────────────────────────────────────
  'fp-1': {
    levelId: 'fp-1',
    kingdomId: 'floorplanning',
    title: 'Introduction to Floorplanning — Die, Core, and Power Grid',
    component: FPIntroChallenge,
    validator: validateFPIntro,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'fp-2': {
    levelId: 'fp-2',
    kingdomId: 'floorplanning',
    title: 'Die Size and Aspect Ratio — Geometry & Utilization Formulas',
    component: FPGeometryChallenge,
    validator: validateFPGeometry,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'fp-3': {
    levelId: 'fp-3',
    kingdomId: 'floorplanning',
    title: 'I/O Placement — Boundary Pitch Spacing & Bus Grouping',
    component: FPPinPlacementChallenge,
    validator: validateFPPinPlacement,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'fp-4': {
    levelId: 'fp-4',
    kingdomId: 'floorplanning',
    title: 'Macro Placement Basics — SRAM Blocks, Keepout Halos & Overlaps',
    component: FPMacroPlacementChallenge,
    validator: validateFPMacroPlacement,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'fp-5': {
    levelId: 'fp-5',
    kingdomId: 'floorplanning',
    title: 'Floorplan Kingdom Challenge — Complete Chip Floorplan Signoff',
    component: FPKingdomChallenge,
    validator: validateFPKingdom,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },

  // ─── Kingdom 4: Placement ──────────────────────────────────────────────────
  'pl-1': {
    levelId: 'pl-1',
    kingdomId: 'placement',
    title: 'What is Placement? — Row Sites, Legalization & Wirelength',
    component: PLIntroChallenge,
    validator: validatePLIntro,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'pl-2': {
    levelId: 'pl-2',
    kingdomId: 'placement',
    title: 'Global vs Detailed Placement — Abutment, Grid Snapping & Legalization',
    component: PLGlobalDetailedChallenge,
    validator: validatePLGlobalDetailed,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'pl-3': {
    levelId: 'pl-3',
    kingdomId: 'placement',
    title: 'Timing-Driven Placement — Critical Paths, Weights & Net Slack',
    component: PLTimingDrivenChallenge,
    validator: validatePLTimingDriven,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'pl-4': {
    levelId: 'pl-4',
    kingdomId: 'placement',
    title: 'Congestion & Placement — Routing Track Capacity & Density Heatmap',
    component: PLCongestionChallenge,
    validator: validatePLCongestion,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'pl-5': {
    levelId: 'pl-5',
    kingdomId: 'placement',
    title: 'Placement Kingdom Challenge — Standard Cell Layout & HPWL Minimization',
    component: PLKingdomChallenge,
    validator: validatePLKingdom,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },

  // ─── Kingdom 5: Clock Tree Synthesis (CTS) ─────────────────────────────────
  'cts-1': {
    levelId: 'cts-1',
    kingdomId: 'cts',
    title: 'What is CTS? — Physical Tree Synthesis vs Timing Analysis',
    component: CTSIntroChallenge,
    validator: validateCTSIntro,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'cts-2': {
    levelId: 'cts-2',
    kingdomId: 'cts',
    title: 'Clock Skew and Latency — Setup Slack Margins & Hold Race Hazards',
    component: CTSSkewLatencyChallenge,
    validator: validateCTSSkewLatency,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'cts-3': {
    levelId: 'cts-3',
    kingdomId: 'cts',
    title: 'Buffer Insertion — Delay Equalization & Clock Slew Control',
    component: CTSBufferInsertionChallenge,
    validator: validateCTSBufferInsertion,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'cts-4': {
    levelId: 'cts-4',
    kingdomId: 'cts',
    title: 'Clock Tree Topologies — H-Tree, Balanced Tree & Mesh Trade-offs',
    component: CTSTopologiesChallenge,
    validator: validateCTSTopologies,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'cts-5': {
    levelId: 'cts-5',
    kingdomId: 'cts',
    title: 'CTS Kingdom Challenge — Multi-Sink Balancing & ICG Signoff',
    component: CTSKingdomChallenge,
    validator: validateCTSKingdom,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },
  'cts-6': {
    levelId: 'cts-6',
    kingdomId: 'cts',
    title: 'Wire RC Delay and Slew Degradation',
    component: CTSExpandedLessonChallenge,
    validator: validateCTSExpandedLesson,
    maxScore: 55,
    starThresholds: [20, 38, 55],
  },
  'cts-7': {
    levelId: 'cts-7',
    kingdomId: 'cts',
    title: 'Fanout Limits and Capacitive Load Management',
    component: CTSExpandedLessonChallenge,
    validator: validateCTSExpandedLesson,
    maxScore: 60,
    starThresholds: [22, 42, 60],
  },
  'cts-8': {
    levelId: 'cts-8',
    kingdomId: 'cts',
    title: 'Sink Clustering and Hierarchical Tree Synthesis',
    component: CTSExpandedLessonChallenge,
    validator: validateCTSExpandedLesson,
    maxScore: 65,
    starThresholds: [25, 45, 65],
  },
  'cts-9': {
    levelId: 'cts-9',
    kingdomId: 'cts',
    title: 'Obstruction-Aware Clock Routing',
    component: CTSExpandedLessonChallenge,
    validator: validateCTSExpandedLesson,
    maxScore: 70,
    starThresholds: [28, 50, 70],
  },
  'cts-10': {
    levelId: 'cts-10',
    kingdomId: 'cts',
    title: 'Clock Gating Architecture and Dynamic Power',
    component: CTSExpandedLessonChallenge,
    validator: validateCTSExpandedLesson,
    maxScore: 75,
    starThresholds: [30, 55, 75],
  },
  'cts-11': {
    levelId: 'cts-11',
    kingdomId: 'cts',
    title: 'Useful Skew Optimization (Setup vs Hold Slack)',
    component: CTSExpandedLessonChallenge,
    validator: validateCTSExpandedLesson,
    maxScore: 80,
    starThresholds: [32, 60, 80],
  },
  'cts-12': {
    levelId: 'cts-12',
    kingdomId: 'cts',
    title: 'Advanced CTS Capstone Laboratory',
    component: CTSExpandedLessonChallenge,
    validator: validateCTSExpandedLesson,
    maxScore: 100,
    starThresholds: [40, 75, 100],
  },

  // ─── Kingdom 6: Routing ────────────────────────────────────────────────────
  'rt-1': {
    levelId: 'rt-1',
    kingdomId: 'routing',
    title: 'Introduction to Routing — Global Corridors, Detailed Tracks & Manhattan Grid',
    component: RTIntroChallenge,
    validator: validateRTIntro,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'rt-2': {
    levelId: 'rt-2',
    kingdomId: 'routing',
    title: 'Metal Layers — Pitch, Sheet Resistance & Alternating Directions',
    component: RTMetalLayersChallenge,
    validator: validateRTMetalLayers,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'rt-3': {
    levelId: 'rt-3',
    kingdomId: 'routing',
    title: 'Vias and Contacts — Layer Transitions, Resistance & DRC Enclosure',
    component: RTViasContactsChallenge,
    validator: validateRTViasContacts,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'rt-4': {
    levelId: 'rt-4',
    kingdomId: 'routing',
    title: 'Signal Integrity — Sidewall Coupling Capacitance & Crosstalk Glitches',
    component: RTSignalIntegrityChallenge,
    validator: validateRTSignalIntegrity,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'rt-5': {
    levelId: 'rt-5',
    kingdomId: 'routing',
    title: 'Routing Kingdom Challenge — Multilayer Interconnect & DRC / LVS Signoff',
    component: RTKingdomChallenge,
    validator: validateRTKingdom,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },

  // ─── Kingdom 7: Filler Cells ───────────────────────────────────────────────
  'fc-1': {
    levelId: 'fc-1',
    kingdomId: 'filler-cells',
    title: 'Why Filler Cells? — N-Well Continuity, Power Rails & CMP Density',
    component: FCIntroChallenge,
    validator: validateFCIntro,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'fc-2': {
    levelId: 'fc-2',
    kingdomId: 'filler-cells',
    title: 'Types of Physical-Only Cells — Tap Cells, Endcaps, Decap & Tie Cells',
    component: FCCellTypesChallenge,
    validator: validateFCCellTypes,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'fc-3': {
    levelId: 'fc-3',
    kingdomId: 'filler-cells',
    title: 'N-Well Continuity — Bridging Standard Cell Gaps & DRC Spacing',
    component: FCWellContinuityChallenge,
    validator: validateFCWellContinuity,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'fc-4': {
    levelId: 'fc-4',
    kingdomId: 'filler-cells',
    title: 'Decap Cell Strategy — Power Supply Droop Mitigation & Leakage Trade-off',
    component: FCDecapStrategyChallenge,
    validator: validateFCDecapStrategy,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'fc-5': {
    levelId: 'fc-5',
    kingdomId: 'filler-cells',
    title: 'Filler Cells Kingdom Challenge — Multi-Void Physical Row Filling & CMP Signoff',
    component: FCKingdomChallenge,
    validator: validateFCKingdom,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },

  // ─── Kingdom 8: GDS & Tape-Out ─────────────────────────────────────────────
  'gds-1': {
    levelId: 'gds-1',
    kingdomId: 'gds',
    title: 'What is GDSII? — The Universal Tape-Out Mask Stream Format',
    component: GDSIntroChallenge,
    validator: validateGDSIntro,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
  'gds-2': {
    levelId: 'gds-2',
    kingdomId: 'gds',
    title: 'Final Sign-Off Checks — DRC, LVS, STA & ERC Verification Matrix',
    component: GDSSignoffChecksChallenge,
    validator: validateGDSSignoffChecks,
    maxScore: 35,
    starThresholds: [12, 24, 35],
  },
  'gds-3': {
    levelId: 'gds-3',
    kingdomId: 'gds',
    title: 'Layer Stack in GDS — FEOL vs BEOL Hierarchy & Mask Datatypes',
    component: GDSLayerStackChallenge,
    validator: validateGDSLayerStack,
    maxScore: 40,
    starThresholds: [15, 28, 40],
  },
  'gds-4': {
    levelId: 'gds-4',
    kingdomId: 'gds',
    title: 'Tape-Out Preparation — Antenna Diodes, Dummy Fill & OPC Mask Prep',
    component: GDSTapeoutPrepChallenge,
    validator: validateGDSTapeoutPrep,
    maxScore: 45,
    starThresholds: [18, 32, 45],
  },
  'gds-5': {
    levelId: 'gds-5',
    kingdomId: 'gds',
    title: 'Final ASIC Kingdom Challenge — The Grand Tape-Out Signoff',
    component: GDSFinalCapstoneChallenge,
    validator: validateGDSFinalCapstone,
    maxScore: 50,
    starThresholds: [20, 38, 50],
  },
};

/**
 * Register a new activity into the runtime registry.
 */

// Register Floorplanning 2.0 Studio Mastery Track (fp-6 through fp-24)
Object.entries(EXPANDED_LESSONS).forEach(([id, lesson]) => {
  ACTIVITY_REGISTRY[id] = {
    levelId: id,
    kingdomId: 'floorplanning',
    title: `${lesson.title} — ${lesson.moduleTitle}`,
    component: FPExpandedLessonChallenge,
    validator: lesson.validate,
    maxScore: lesson.xpReward,
    starThresholds: lesson.starThresholds,
  };
});

export function registerActivity(descriptor) {
  if (descriptor && descriptor.levelId) {
    ACTIVITY_REGISTRY[descriptor.levelId] = descriptor;
  }
}

/**
 * Retrieve the registered activity descriptor for a given level.
 * Returns null if the level does not have an activity implemented yet.
 *
 * @param {string} levelId
 * @returns {Object|null}
 */
export function getActivity(levelId) {
  return ACTIVITY_REGISTRY[levelId] || null;
}

/**
 * Check whether a level has an interactive activity implementation.
 *
 * @param {string} levelId
 * @returns {boolean}
 */
export function hasActivity(levelId) {
  return Boolean(ACTIVITY_REGISTRY[levelId]);
}
