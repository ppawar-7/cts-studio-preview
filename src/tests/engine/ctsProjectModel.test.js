/**
 * ctsProjectModel.test.js
 * ========================
 * Tests for CTS Project Model schema, serialization, report generation,
 * undo/redo management, and benchmark scenarios.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCTSProject,
  validateCTSProject,
  exportCTSProjectToJSON,
  importCTSProjectFromJSON,
  exportCTSReport,
  saveCTSProjectToStorage,
  loadCTSProjectFromStorage,
  initHistoryState,
  pushHistorySnapshot,
  undoProject,
  redoProject,
  CTS_SCHEMA_VERSION,
} from '../../engine/ctsProjectModel.js';
import { CTS_SCENARIOS } from '../../engine/ctsScenarios.js';
import { solveClockTreeElmore } from '../../engine/ctsEngine.js';

describe('CTS Project Model', () => {
  it('creates a fresh CTS project with schema v1 and defaults', () => {
    const proj = createCTSProject({
      name: 'Test Project',
      core: { width: 400, height: 400 },
      sinks: [
        { id: 'S1', x: 100, y: 100, loadCapPf: 0.005 },
        { id: 'S2', x: 300, y: 300, loadCapPf: 0.005 },
      ],
      branches: [
        { from: 'CLK_ROOT', to: 'S1' },
        { from: 'CLK_ROOT', to: 'S2' },
      ],
    });

    expect(proj.schemaVersion).toBe(CTS_SCHEMA_VERSION);
    expect(proj.name).toBe('Test Project');
    expect(proj.sinks).toHaveLength(2);
    expect(proj.branches).toHaveLength(2);
    expect(proj.constraints.periodNs).toBe(1.0);
  });

  it('initializes from a benchmark scenario template', () => {
    const proj = createCTSProject({ scenarioId: 'scenario-balanced-4' });
    expect(proj.scenarioId).toBe('scenario-balanced-4');
    expect(proj.sinks).toHaveLength(4);
    expect(proj.buffers).toHaveLength(3);
    expect(proj.branches).toHaveLength(7);
    expect(proj.dataPaths).toHaveLength(2);

    const val = validateCTSProject(proj);
    expect(val.isValid).toBe(true);
  });

  it('validates project structures and detects corrupt payloads', () => {
    expect(validateCTSProject(null).isValid).toBe(false);
    expect(validateCTSProject({}).isValid).toBe(false);
    expect(validateCTSProject({ root: { x: 0, y: 0 }, sinks: [] }).isValid).toBe(false);

    const validProj = createCTSProject({
      sinks: [{ id: 'S1', x: 10, y: 10 }],
    });
    expect(validateCTSProject(validProj).isValid).toBe(true);
  });

  it('exports and imports project JSON losslessly', () => {
    const original = createCTSProject({ scenarioId: 'scenario-asymmetric-6' });
    const jsonStr = exportCTSProjectToJSON(original);
    expect(typeof jsonStr).toBe('string');

    const imported = importCTSProjectFromJSON(jsonStr);
    expect(imported.success).toBe(true);
    expect(imported.project.name).toBe(original.name);
    expect(imported.project.sinks).toHaveLength(original.sinks.length);
    expect(imported.project.branches).toHaveLength(original.branches.length);
  });

  it('generates an engineering signoff report with all sections', () => {
    const proj = createCTSProject({ scenarioId: 'scenario-balanced-4' });
    const sol = solveClockTreeElmore(proj);
    const report = exportCTSReport(proj, sol);

    expect(report).toContain('CLOCK TREE SYNTHESIS (CTS) SIGNOFF REPORT');
    expect(report).toContain('1. EXECUTIVE SUMMARY');
    expect(report).toContain('Clock Skew:');
    expect(report).toContain('Min Insertion Delay:');
    expect(report).toContain('Max Insertion Delay:');
    expect(report).toContain('2. CLOCK SINKS & ARRIVAL LATENCY');
    expect(report).toContain('3. DATA PATH TIMING');
    expect(report).toContain('4. DESIGN VIOLATIONS & DIAGNOSTICS');
  });

  it('supports undo and redo transitions smoothly', () => {
    const p1 = createCTSProject({ name: 'State 1', sinks: [{ id: 'S1', x: 10, y: 10 }] });
    let history = initHistoryState(p1);
    expect(history.present.name).toBe('State 1');

    const p2 = { ...p1, name: 'State 2' };
    history = pushHistorySnapshot(history, p2);
    expect(history.present.name).toBe('State 2');

    const p3 = { ...p2, name: 'State 3' };
    history = pushHistorySnapshot(history, p3);
    expect(history.present.name).toBe('State 3');

    // Undo to State 2
    history = undoProject(history);
    expect(history.present.name).toBe('State 2');

    // Undo to State 1
    history = undoProject(history);
    expect(history.present.name).toBe('State 1');

    // Redo to State 2
    history = redoProject(history);
    expect(history.present.name).toBe('State 2');

    // Redo to State 3
    history = redoProject(history);
    expect(history.present.name).toBe('State 3');
  });

  it('verifies that all benchmark scenarios solve successfully in Elmore engine', () => {
    const scenarioKeys = Object.keys(CTS_SCENARIOS);
    expect(scenarioKeys.length).toBeGreaterThanOrEqual(5);

    scenarioKeys.forEach((key) => {
      const proj = createCTSProject({ scenarioId: key });
      const sol = solveClockTreeElmore(proj);

      expect(sol).toBeDefined();
      expect(Number.isFinite(sol.skewPs)).toBe(true);
      expect(Number.isFinite(sol.minArrivalPs)).toBe(true);
      expect(Number.isFinite(sol.maxArrivalPs)).toBe(true);
      expect(Number.isFinite(sol.wirelengthUm)).toBe(true);
      expect(Number.isFinite(sol.dynamicPowerMw)).toBe(true);

      // Sinks must all be evaluated
      expect(sol.sinks.length).toBe(proj.sinks.length);
    });
  });

  it('correctly simulates storage persistence save and load', () => {
    const proj = createCTSProject({ scenarioId: 'scenario-blockage-8' });
    const saveRes = saveCTSProjectToStorage(proj, 'test_slot');
    expect(saveRes.success).toBe(true);

    const loaded = loadCTSProjectFromStorage('test_slot');
    expect(loaded).toBeDefined();
    expect(loaded.id).toBe(proj.id);
  });
});
