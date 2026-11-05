/**
 * designArtifactContracts.test.js
 * ================================
 * Comprehensive test suite for design artifact contracts, runtime validation,
 * boundary conditions, NaN/Infinity rejection, and schema versioning.
 */

import { describe, it, expect } from 'vitest';
import {
  ARTIFACT_KINDS,
  ARTIFACT_STATUS,
  CHECK_CLASSIFICATION,
  createDesignArtifact,
  validateDesignArtifact,
  isFiniteNumber,
  ARTIFACT_SCHEMA_VERSION,
  CURRENT_MODEL_VERSION,
} from '../../logic/designArtifactContracts.js';

describe('Design Artifact Contracts — Specification & Runtime Validation', () => {
  it('exports all 8 required ASIC kingdom artifact kinds', () => {
    expect(ARTIFACT_KINDS.RTL_CIRCUIT).toBe('rtl.circuit');
    expect(ARTIFACT_KINDS.SYNTHESIS_NETLIST).toBe('synthesis.netlist');
    expect(ARTIFACT_KINDS.FLOORPLAN_LAYOUT).toBe('floorplan.layout');
    expect(ARTIFACT_KINDS.PLACEMENT_LAYOUT).toBe('placement.layout');
    expect(ARTIFACT_KINDS.CTS_CLOCK_TREE).toBe('cts.clock_tree');
    expect(ARTIFACT_KINDS.ROUTING_INTERCONNECT).toBe('routing.interconnect');
    expect(ARTIFACT_KINDS.FILLER_CELLS_DENSITY).toBe('filler_cells.density');
    expect(ARTIFACT_KINDS.GDS_MASK_STREAM).toBe('gds.mask_stream');
  });

  it('exports all explicit lifecycle status codes', () => {
    expect(ARTIFACT_STATUS.READY).toBe('READY');
    expect(ARTIFACT_STATUS.MISSING_PREREQUISITE).toBe('MISSING_PREREQUISITE');
    expect(ARTIFACT_STATUS.MISSING_ARTIFACT).toBe('MISSING_ARTIFACT');
    expect(ARTIFACT_STATUS.INVALID_ARTIFACT).toBe('INVALID_ARTIFACT');
    expect(ARTIFACT_STATUS.STALE_ARTIFACT).toBe('STALE_ARTIFACT');
    expect(ARTIFACT_STATUS.UNSUPPORTED_MODEL).toBe('UNSUPPORTED_MODEL');
    expect(ARTIFACT_STATUS.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    expect(ARTIFACT_STATUS.CERTIFIED).toBe('CERTIFIED');
    expect(ARTIFACT_STATUS.PRACTICE_ONLY).toBe('PRACTICE_ONLY');
  });

  it('creates a valid floorplan layout artifact envelope', () => {
    const art = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      inputs: {
        macros: [{ id: 'SRAM1', x: 20, y: 20, width: 100, height: 80 }],
      },
      measurements: {
        margin: 20.0,
        halo: 16.0,
      },
      units: {
        margin: 'µm',
        halo: 'µm',
      },
    });

    expect(art.schemaVersion).toBe(ARTIFACT_SCHEMA_VERSION);
    expect(art.modelVersion).toBe(CURRENT_MODEL_VERSION);
    expect(art.kind).toBe(ARTIFACT_KINDS.FLOORPLAN_LAYOUT);
    expect(art.sourceLevelId).toBe('fp-5');
    expect(art.measurements.margin).toBe(20.0);
    expect(art.measurements.halo).toBe(16.0);
    expect(art.units.margin).toBe('µm');
    expect(art.createdAt).toBeDefined();

    const val = validateDesignArtifact(art);
    expect(val.isValid).toBe(true);
    expect(val.status).toBe(ARTIFACT_STATUS.READY);
    expect(val.errors).toHaveLength(0);
  });

  it('rejects artifact creation with unknown kind', () => {
    expect(() => {
      createDesignArtifact({
        kind: 'unsupported.quantum_chip',
        sourceLevelId: 'fp-1',
      });
    }).toThrow(/Unknown artifact kind/);
  });

  it('rejects artifact with NaN in measurements', () => {
    const corrupt = {
      schemaVersion: 1,
      modelVersion: 1,
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      inputs: {},
      measurements: {
        margin: NaN,
        halo: 15.0,
      },
      units: {},
      createdAt: new Date().toISOString(),
    };

    const val = validateDesignArtifact(corrupt);
    expect(val.isValid).toBe(false);
    expect(val.status).toBe(ARTIFACT_STATUS.INVALID_ARTIFACT);
    expect(val.errors.some((e) => e.includes('margin'))).toBe(true);
  });

  it('rejects artifact with Infinity in measurements', () => {
    const corrupt = {
      schemaVersion: 1,
      modelVersion: 1,
      kind: ARTIFACT_KINDS.CTS_CLOCK_TREE,
      sourceLevelId: 'cts-5',
      inputs: {},
      measurements: {
        skewPs: Infinity,
        latencyPs: 180,
      },
      units: {},
      createdAt: new Date().toISOString(),
    };

    const val = validateDesignArtifact(corrupt);
    expect(val.isValid).toBe(false);
    expect(val.status).toBe(ARTIFACT_STATUS.INVALID_ARTIFACT);
    expect(val.errors.some((e) => e.includes('skewPs'))).toBe(true);
  });

  it('rejects artifact with negative dimension measurements', () => {
    const corrupt = {
      schemaVersion: 1,
      modelVersion: 1,
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      inputs: {},
      measurements: {
        margin: -5.0,
        halo: 15.0,
      },
      units: {},
      createdAt: new Date().toISOString(),
    };

    const val = validateDesignArtifact(corrupt);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('non-negative'))).toBe(true);
  });

  it('rejects corrupt placement cells array containing non-finite coordinates', () => {
    const corrupt = {
      schemaVersion: 1,
      modelVersion: 1,
      kind: ARTIFACT_KINDS.PLACEMENT_LAYOUT,
      sourceLevelId: 'pl-5',
      inputs: {},
      measurements: {
        cells: [{ id: 'C1', x: NaN, y: 40, width: 20, height: 40 }],
      },
      units: {},
      createdAt: new Date().toISOString(),
    };

    const val = validateDesignArtifact(corrupt);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('invalid coordinates'))).toBe(true);
  });

  it('rejects corrupt placement cell with non-positive dimensions', () => {
    const corrupt = {
      schemaVersion: 1,
      modelVersion: 1,
      kind: ARTIFACT_KINDS.PLACEMENT_LAYOUT,
      sourceLevelId: 'pl-5',
      inputs: {},
      measurements: {
        cells: [{ id: 'C1', x: 20, y: 40, width: -10, height: 40 }],
      },
      units: {},
      createdAt: new Date().toISOString(),
    };

    const val = validateDesignArtifact(corrupt);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('invalid width'))).toBe(true);
  });

  it('detects artifact kind mismatch when expectedKind is specified', () => {
    const fpArt = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      inputs: {},
      measurements: { margin: 20.0, halo: 15.0 },
    });

    const val = validateDesignArtifact(fpArt, ARTIFACT_KINDS.PLACEMENT_LAYOUT);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('Kind mismatch'))).toBe(true);
  });

  it('rejects non-object or null artifact inputs', () => {
    expect(validateDesignArtifact(null).isValid).toBe(false);
    expect(validateDesignArtifact(undefined).isValid).toBe(false);
    expect(validateDesignArtifact('string').isValid).toBe(false);
    expect(validateDesignArtifact([]).isValid).toBe(false);
    expect(validateDesignArtifact(123).isValid).toBe(false);
  });
});
