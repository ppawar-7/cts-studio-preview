/**
 * activityRegistry.js
 * ====================
 * Decoupled registry mapping level IDs to educational interactive challenge components
 * and deterministic validators.
 *
 * Keeps LevelPage.jsx clean and extensible as new kingdom activities are added.
 */

import React from 'react';
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
