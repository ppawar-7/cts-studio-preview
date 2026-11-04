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

const ACTIVITY_REGISTRY = {
  'rtl-1': {
    levelId: 'rtl-1',
    kingdomId: 'rtl-understanding',
    title: '2:1 Multiplexer — The Core of RTL Dataflow Steering',
    component: RTLMuxChallenge,
    validator: validateMuxChallenge,
    maxScore: 30,
    starThresholds: [10, 20, 30],
  },
};

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
