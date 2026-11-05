/**
 * designArtifactContracts.js
 * ===========================
 * Formal, versioned engineering design artifact contracts for PD Playground.
 *
 * Establishes explicit boundaries between:
 * - Activity completion
 * - Artifact existence & schema validity
 * - Meaningful student design parameters
 * - Stage sanity check verification
 * - Stage certification awards
 *
 * Rules:
 * - Deterministic runtime validation
 * - Rejects NaN, Infinity, negative geometry, invalid arrays, and corrupt types
 * - Never replaces missing student measurements with passing defaults
 * - Keeps educational feedback separate from engineering measurements
 */

export const ARTIFACT_SCHEMA_VERSION = 1;
export const CURRENT_MODEL_VERSION = 1;

/**
 * Supported artifact kinds across the 8 ASIC kingdoms.
 */
export const ARTIFACT_KINDS = {
  RTL_CIRCUIT: 'rtl.circuit',
  SYNTHESIS_NETLIST: 'synthesis.netlist',
  FLOORPLAN_LAYOUT: 'floorplan.layout',
  PLACEMENT_LAYOUT: 'placement.layout',
  CTS_CLOCK_TREE: 'cts.clock_tree',
  ROUTING_INTERCONNECT: 'routing.interconnect',
  FILLER_CELLS_DENSITY: 'filler_cells.density',
  GDS_MASK_STREAM: 'gds.mask_stream',
};

/**
 * Explicit artifact and sanity check status codes.
 */
export const ARTIFACT_STATUS = {
  READY: 'READY',
  MISSING_PREREQUISITE: 'MISSING_PREREQUISITE',
  MISSING_ARTIFACT: 'MISSING_ARTIFACT',
  INVALID_ARTIFACT: 'INVALID_ARTIFACT',
  STALE_ARTIFACT: 'STALE_ARTIFACT',
  UNSUPPORTED_MODEL: 'UNSUPPORTED_MODEL',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CERTIFIED: 'CERTIFIED',
  PRACTICE_ONLY: 'PRACTICE_ONLY',
};

/**
 * Check classification policy.
 */
export const CHECK_CLASSIFICATION = {
  CERTIFIABLE_EDUCATIONAL_CHECK: 'CERTIFIABLE_EDUCATIONAL_CHECK',
  PRACTICE_ONLY: 'PRACTICE_ONLY',
  UNSUPPORTED_PENDING_MODEL: 'UNSUPPORTED_PENDING_MODEL',
};

/**
 * Helper to check if a value is a strictly finite number (not NaN, not Infinity).
 */
export function isFiniteNumber(val) {
  return typeof val === 'number' && Number.isFinite(val);
}

/**
 * Create a validated design artifact envelope.
 *
 * @param {Object} spec
 * @param {string} spec.kind - One of ARTIFACT_KINDS
 * @param {string} spec.sourceLevelId - e.g. 'fp-5', 'pl-5'
 * @param {Object} spec.inputs - Student-chosen design parameters
 * @param {Object} spec.measurements - Deterministic engine-derived measurements
 * @param {Object} [spec.units={}] - Measurement units
 * @param {number} [spec.schemaVersion=ARTIFACT_SCHEMA_VERSION]
 * @param {number} [spec.modelVersion=CURRENT_MODEL_VERSION]
 * @returns {Object} Validated design artifact
 */
export function createDesignArtifact({
  kind,
  sourceLevelId,
  inputs = {},
  measurements = {},
  units = {},
  schemaVersion = ARTIFACT_SCHEMA_VERSION,
  modelVersion = CURRENT_MODEL_VERSION,
}) {
  const artifact = {
    schemaVersion,
    kind,
    sourceLevelId,
    modelVersion,
    inputs: inputs && typeof inputs === 'object' ? { ...inputs } : {},
    measurements: measurements && typeof measurements === 'object' ? { ...measurements } : {},
    units: units && typeof units === 'object' ? { ...units } : {},
    createdAt: new Date().toISOString(),
  };

  const validation = validateDesignArtifact(artifact);
  if (!validation.isValid) {
    throw new Error(`Invalid design artifact creation: ${validation.errors.join('; ')}`);
  }

  return artifact;
}

/**
 * Deterministic runtime validator for any design artifact envelope.
 *
 * @param {any} artifact
 * @param {string} [expectedKind=null]
 * @returns {{ isValid: boolean, status: string, errors: string[] }}
 */
export function validateDesignArtifact(artifact, expectedKind = null) {
  const errors = [];

  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return {
      isValid: false,
      status: ARTIFACT_STATUS.INVALID_ARTIFACT,
      errors: ['Artifact must be a non-null object.'],
    };
  }

  // Schema version
  if (!Number.isInteger(artifact.schemaVersion) || artifact.schemaVersion < 1) {
    errors.push('artifact.schemaVersion must be a positive integer.');
  }

  // Kind
  const knownKinds = Object.values(ARTIFACT_KINDS);
  if (!knownKinds.includes(artifact.kind)) {
    errors.push(`Unknown artifact kind: "${artifact.kind}".`);
  } else if (expectedKind && artifact.kind !== expectedKind) {
    errors.push(`Kind mismatch: expected "${expectedKind}", received "${artifact.kind}".`);
  }

  // Source Level ID
  if (typeof artifact.sourceLevelId !== 'string' || !artifact.sourceLevelId.trim()) {
    errors.push('artifact.sourceLevelId must be a non-empty string.');
  }

  // Inputs & measurements containers
  if (!artifact.inputs || typeof artifact.inputs !== 'object') {
    errors.push('artifact.inputs must be an object.');
  }
  if (!artifact.measurements || typeof artifact.measurements !== 'object') {
    errors.push('artifact.measurements must be an object.');
  }

  // Reject NaN / Infinity anywhere in measurements
  if (artifact.measurements && typeof artifact.measurements === 'object') {
    for (const [key, val] of Object.entries(artifact.measurements)) {
      if (typeof val === 'number' && !Number.isFinite(val)) {
        errors.push(`Measurement "${key}" is not a finite number (${val}).`);
      }
    }
  }

  // Kind-specific structural validation
  if (artifact.kind === ARTIFACT_KINDS.FLOORPLAN_LAYOUT) {
    validateFloorplanArtifact(artifact, errors);
  } else if (artifact.kind === ARTIFACT_KINDS.PLACEMENT_LAYOUT) {
    validatePlacementArtifact(artifact, errors);
  } else if (artifact.kind === ARTIFACT_KINDS.CTS_CLOCK_TREE) {
    validateCTSArtifact(artifact, errors);
  } else if (artifact.kind === ARTIFACT_KINDS.ROUTING_INTERCONNECT) {
    validateRoutingArtifact(artifact, errors);
  } else if (artifact.kind === ARTIFACT_KINDS.FILLER_CELLS_DENSITY) {
    validateFillerCellsArtifact(artifact, errors);
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? ARTIFACT_STATUS.READY : ARTIFACT_STATUS.INVALID_ARTIFACT,
    errors,
  };
}

/**
 * Floorplan Layout validation
 */
function validateFloorplanArtifact(artifact, errors) {
  const { measurements } = artifact;
  if (measurements.margin !== undefined && (!isFiniteNumber(measurements.margin) || measurements.margin < 0)) {
    errors.push('Floorplan margin must be a non-negative finite number.');
  }
  if (measurements.halo !== undefined && (!isFiniteNumber(measurements.halo) || measurements.halo < 0)) {
    errors.push('Floorplan halo must be a non-negative finite number.');
  }
}

/**
 * Placement Layout validation
 */
function validatePlacementArtifact(artifact, errors) {
  const { measurements, inputs } = artifact;
  const cells = measurements.cells || inputs.cells;
  if (cells !== undefined) {
    if (!Array.isArray(cells)) {
      errors.push('Placement cells must be an array.');
    } else {
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (!c || typeof c !== 'object') {
          errors.push(`Cell at index ${i} is not an object.`);
        } else {
          if (!isFiniteNumber(c.x) || !isFiniteNumber(c.y)) {
            errors.push(`Cell "${c.id || i}" has invalid coordinates.`);
          }
          if (c.width !== undefined && (!isFiniteNumber(c.width) || c.width <= 0)) {
            errors.push(`Cell "${c.id || i}" has invalid width.`);
          }
          if (c.height !== undefined && (!isFiniteNumber(c.height) || c.height <= 0)) {
            errors.push(`Cell "${c.id || i}" has invalid height.`);
          }
        }
      }
    }
  }
}

/**
 * Clock Tree Synthesis validation
 */
function validateCTSArtifact(artifact, errors) {
  const { measurements } = artifact;
  if (measurements.skewPs !== undefined && (!isFiniteNumber(measurements.skewPs) || measurements.skewPs < 0)) {
    errors.push('CTS skewPs must be a non-negative finite number.');
  }
  if (measurements.latencyPs !== undefined && (!isFiniteNumber(measurements.latencyPs) || measurements.latencyPs < 0)) {
    errors.push('CTS latencyPs must be a non-negative finite number.');
  }
}

/**
 * Routing Interconnect validation
 */
function validateRoutingArtifact(artifact, errors) {
  const { measurements } = artifact;
  if (measurements.segments !== undefined && !Array.isArray(measurements.segments)) {
    errors.push('Routing segments must be an array.');
  }
}

/**
 * Filler Cells validation
 */
function validateFillerCellsArtifact(artifact, errors) {
  const { measurements } = artifact;
  if (measurements.emptySites !== undefined && (!isFiniteNumber(measurements.emptySites) || measurements.emptySites < 0)) {
    errors.push('Filler cells emptySites must be a non-negative integer.');
  }
}
