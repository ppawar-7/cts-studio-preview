/**
 * ctsProjectModel.js
 * ===================
 * CTSProject Data Model, Serialization, Local Storage, Undo/Redo,
 * and Engineering Signoff Reporting for CTS Studio 1.0.
 */

import { solveClockTreeElmore, CLOCK_BUFFER_LIB } from './ctsEngine.js';
import { CTS_SCENARIOS } from './ctsScenarios.js';

export const CTS_SCHEMA_VERSION = 1;

export const CTS_STORAGE_KEY_ACTIVE = 'pd_cts_active_project_v1';
export const CTS_STORAGE_KEY_EXPLORE = 'pd_cts_explore_project_v1';
export const CTS_STORAGE_KEY_CANDIDATE_PREFIX = 'pd_cts_candidate_';

export const DEFAULT_CTS_CONSTRAINTS = {
  periodNs: 1.0,
  maxSkewBudgetPs: 50,
  maxLatencyBudgetPs: 400,
  maxTransitionTimePs: 100,
  maxFanout: 4,
  maxCapacitancePf: 0.08,
  supplyVoltageV: 1.1,
  operatingFrequencyGhz: 1.0,
};

/**
 * Creates a new CTS Project with full default structure or initialized from a benchmark preset.
 */
export function createCTSProject(options = {}) {
  const {
    id = `cts_project_${Date.now()}`,
    name = 'Custom Clock Tree Design',
    scenarioId = null,
    core = { width: 500, height: 500 },
    root = { id: 'CLK_ROOT', x: 250, y: 30, cellType: 'CLKBUF_X8' },
    buffers = [],
    sinks = [],
    branches = [],
    blockages = [],
    dataPaths = [],
    constraints = {},
  } = options;

  if (scenarioId && CTS_SCENARIOS[scenarioId]) {
    const sc = CTS_SCENARIOS[scenarioId];
    return {
      schemaVersion: CTS_SCHEMA_VERSION,
      id: `${sc.id}_${Date.now()}`,
      name: sc.name,
      description: sc.description,
      scenarioId: sc.id,
      core: { ...sc.core },
      root: { ...sc.root },
      buffers: sc.buffers.map((b) => ({ ...b })),
      sinks: sc.sinks.map((s) => ({ ...s })),
      branches: sc.branches.map((br) => ({ ...br })),
      blockages: (sc.blockages || []).map((blk) => ({ ...blk })),
      dataPaths: (sc.dataPaths || []).map((dp) => ({ ...dp })),
      constraints: { ...DEFAULT_CTS_CONSTRAINTS, ...sc.constraints },
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    schemaVersion: CTS_SCHEMA_VERSION,
    id,
    name,
    description: options.description || 'Interactive Clock Tree Synthesis Project',
    scenarioId: null,
    core: { ...core },
    root: { ...root },
    buffers: buffers.map((b) => ({ ...b })),
    sinks: sinks.map((s) => ({ ...s })),
    branches: branches.map((br) => ({ ...br })),
    blockages: blockages.map((blk) => ({ ...blk })),
    dataPaths: dataPaths.map((dp) => ({ ...dp })),
    constraints: { ...DEFAULT_CTS_CONSTRAINTS, ...constraints },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates the basic structural integrity of a CTS project object.
 */
export function validateCTSProject(project) {
  const errors = [];
  if (!project || typeof project !== 'object') {
    return { isValid: false, errors: ['Project must be an object.'] };
  }
  if (!project.root || typeof project.root.x !== 'number' || typeof project.root.y !== 'number') {
    errors.push('Project missing valid clock root pin.');
  }
  if (!Array.isArray(project.sinks) || project.sinks.length === 0) {
    errors.push('Project must define at least one clock sink.');
  }
  if (!Array.isArray(project.buffers)) {
    errors.push('Buffers must be an array.');
  }
  if (!Array.isArray(project.branches)) {
    errors.push('Branches must be an array.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

const memoryStorage = new Map();

/**
 * Saves a CTS project into storage (with strict Explore-mode session isolation
 * and in-memory fallback for test/node environments).
 */
export function saveCTSProjectToStorage(project, slot = 'active', isExplore = false) {
  try {
    let key = '';
    if (isExplore) {
      key = slot === 'active' ? CTS_STORAGE_KEY_EXPLORE : `${CTS_STORAGE_KEY_CANDIDATE_PREFIX}explore_${slot}`;
    } else {
      key = slot === 'active' ? CTS_STORAGE_KEY_ACTIVE : `${CTS_STORAGE_KEY_CANDIDATE_PREFIX}${slot}`;
    }

    const cleanProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(cleanProject);

    if (isExplore) {
      if (typeof window !== 'undefined' && window.sessionStorage?.setItem) {
        window.sessionStorage.setItem(key, serialized);
      } else if (typeof localStorage !== 'undefined' && localStorage?.setItem) {
        localStorage.setItem(key, serialized);
      } else {
        memoryStorage.set(key, serialized);
      }
    } else {
      if (typeof localStorage !== 'undefined' && localStorage?.setItem) {
        localStorage.setItem(key, serialized);
      } else {
        memoryStorage.set(key, serialized);
      }
    }
    return { success: true, key };
  } catch (err) {
    console.error('Failed to save CTS project:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Loads a CTS project from storage (with strict Explore-mode session isolation
 * and in-memory fallback for test/node environments).
 */
export function loadCTSProjectFromStorage(slot = 'active', isExplore = false) {
  try {
    let key = '';
    if (isExplore) {
      key = slot === 'active' ? CTS_STORAGE_KEY_EXPLORE : `${CTS_STORAGE_KEY_CANDIDATE_PREFIX}explore_${slot}`;
    } else {
      key = slot === 'active' ? CTS_STORAGE_KEY_ACTIVE : `${CTS_STORAGE_KEY_CANDIDATE_PREFIX}${slot}`;
    }

    let raw = null;
    if (isExplore) {
      if (typeof window !== 'undefined' && window.sessionStorage?.getItem) {
        raw = window.sessionStorage.getItem(key);
      } else if (typeof localStorage !== 'undefined' && localStorage?.getItem) {
        raw = localStorage.getItem(key);
      } else {
        raw = memoryStorage.get(key) || null;
      }
    } else {
      if (typeof localStorage !== 'undefined' && localStorage?.getItem) {
        raw = localStorage.getItem(key);
      } else {
        raw = memoryStorage.get(key) || null;
      }
    }

    if (!raw) return null;
    const project = JSON.parse(raw);
    const valid = validateCTSProject(project);
    if (!valid.isValid) {
      console.warn('Stored CTS project is invalid:', valid.errors);
      return null;
    }
    return project;
  } catch (err) {
    console.error('Failed to load CTS project:', err);
    return null;
  }
}

/**
 * Exports project as formatted JSON string.
 */
export function exportCTSProjectToJSON(project) {
  return JSON.stringify(project, null, 2);
}

/**
 * Imports project from JSON string with validation.
 */
export function importCTSProjectFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const val = validateCTSProject(parsed);
    if (!val.isValid) {
      throw new Error(`Invalid CTS Project: ${val.errors.join(', ')}`);
    }
    return { success: true, project: parsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Generates an engineering signoff report in Markdown and ASCII format.
 */
export function exportCTSReport(project, solution = null) {
  const sol = solution || solveClockTreeElmore(project);
  const dateStr = new Date().toISOString();

  let rep = `# CLOCK TREE SYNTHESIS (CTS) SIGNOFF REPORT\n`;
  rep += `Project: ${project.name || project.id}\n`;
  rep += `Generated: ${dateStr}\n`;
  rep += `Schema Version: ${project.schemaVersion || 1}\n\n`;

  rep += `## 1. EXECUTIVE SUMMARY\n`;
  rep += `- Status: ${sol.isValid && (sol.diagnostics?.violations?.length === 0) ? 'APPROVED (ZERO VIOLATIONS)' : 'NEEDS OPTIMIZATION'}\n`;
  rep += `- Clock Period: ${(project.constraints?.periodNs || 1.0).toFixed(3)} ns (F_clk = ${(1 / (project.constraints?.periodNs || 1.0)).toFixed(2)} GHz)\n`;
  rep += `- Clock Skew: ${sol.skewPs} ps (Target: <= ${project.constraints?.maxSkewBudgetPs || 50} ps) [${sol.skewPs <= (project.constraints?.maxSkewBudgetPs || 50) ? 'PASS' : 'FAIL'}]\n`;
  rep += `- Min Insertion Delay: ${sol.minArrivalPs} ps\n`;
  rep += `- Max Insertion Delay: ${sol.maxArrivalPs} ps (Budget: <= ${project.constraints?.maxLatencyBudgetPs || 400} ps) [${sol.maxArrivalPs <= (project.constraints?.maxLatencyBudgetPs || 400) ? 'PASS' : 'FAIL'}]\n`;
  rep += `- Total Wirelength: ${sol.wirelengthUm.toFixed(1)} µm\n`;
  rep += `- Dynamic Switching Power: ${sol.dynamicPowerMw.toFixed(3)} mW\n`;
  const leakageUw = sol.leakagePowerUw ?? (sol.leakagePowerMw !== undefined ? sol.leakagePowerMw * 1000 : 0);
  rep += `- Static Leakage Power: ${Number(leakageUw).toFixed(2)} µW\n`;
  rep += `- Buffer Count: ${project.buffers.length} (Silicon Area: ${sol.bufferAreaUm2.toFixed(1)} µm²)\n`;
  rep += `- Sink Count: ${project.sinks.length}\n`;
  rep += `- Total Violations: ${sol.diagnostics?.violations?.length || 0}\n\n`;

  rep += `## 2. CLOCK SINKS & ARRIVAL LATENCY\n`;
  rep += `| Sink ID | (X, Y) µm | Load (fF) | Arrival (ps) | Transition (ps) | Status |\n`;
  rep += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  sol.sinks.forEach((s) => {
    rep += `| ${s.id} | (${s.x}, ${s.y}) | ${(s.loadCapPf * 1000).toFixed(1)} | ${s.arrivalPs} | ${s.transitionPs} | ${s.isReached ? 'REACHED' : 'DISCONNECTED'} |\n`;
  });
  rep += `\n`;

  rep += `## 3. DATA PATH TIMING (SETUP & HOLD ANALYSIS)\n`;
  if (!sol.dataPaths || sol.dataPaths.length === 0) {
    rep += `No inter-sink synchronous data paths configured in this project.\n\n`;
  } else {
    rep += `| Path ID | Launch -> Capture | Clock Skew (ps) | Setup Slack (ps) | Hold Slack (ps) | Setup Status | Hold Status |\n`;
    rep += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    sol.dataPaths.forEach((dp) => {
      rep += `| ${dp.id} | ${dp.fromSinkId} -> ${dp.toSinkId} | ${dp.skewPs} | ${dp.setupSlackPs} | ${dp.holdSlackPs} | ${dp.setupPassed ? 'PASS' : 'FAIL'} | ${dp.holdPassed ? 'PASS' : 'FAIL'} |\n`;
    });
    rep += `\n`;
  }

  rep += `## 4. DESIGN VIOLATIONS & DIAGNOSTICS\n`;
  if (!sol.diagnostics?.violations || sol.diagnostics.violations.length === 0) {
    rep += `Clean design. No max fanout, max capacitance, transition slew, core boundary, or blockage overlap violations found.\n\n`;
  } else {
    sol.diagnostics.violations.forEach((v, idx) => {
      rep += `${idx + 1}. [${v.type}] ${v.message}\n   Recommendation: ${v.suggestion}\n`;
    });
    rep += `\n`;
  }

  rep += `## 5. REPEATERS & TREE STRUCTURE\n`;
  project.buffers.forEach((b) => {
    const lib = CLOCK_BUFFER_LIB[b.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
    rep += `- Buffer ${b.id}: Cell ${lib.id} at (${b.x}, ${b.y}), Area ${lib.areaUm2} µm², Max Fanout: ${lib.maxFanout}\n`;
  });

  return rep;
}

/**
 * Undo / Redo history state manager.
 */
export function initHistoryState(initialProject) {
  return {
    past: [],
    present: JSON.parse(JSON.stringify(initialProject)),
    future: [],
  };
}

export function pushHistorySnapshot(historyState, newProject) {
  return {
    past: [...historyState.past.slice(-20), historyState.present],
    present: JSON.parse(JSON.stringify(newProject)),
    future: [],
  };
}

export function undoProject(historyState) {
  if (historyState.past.length === 0) return historyState;
  const previous = historyState.past[historyState.past.length - 1];
  const newPast = historyState.past.slice(0, historyState.past.length - 1);
  return {
    past: newPast,
    present: previous,
    future: [historyState.present, ...historyState.future],
  };
}

export function redoProject(historyState) {
  if (historyState.future.length === 0) return historyState;
  const next = historyState.future[0];
  const newFuture = historyState.future.slice(1);
  return {
    past: [...historyState.past, historyState.present],
    present: next,
    future: newFuture,
  };
}
