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
};

/**
 * Register a new activity into the runtime registry.
 */
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
