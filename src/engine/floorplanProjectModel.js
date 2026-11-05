/**
 * floorplanProjectModel.js
 * =========================
 * FloorplanProject Schema v1 and lifecycle utilities.
 * Defines canonical data model for Floorplanning Kingdom 2.0 and Floorplan Studio.
 *
 * All coordinates and dimensions are in micrometers (µm).
 */

export const SCHEMA_VERSION = 1;

/**
 * Creates a brand new default FloorplanProject.
 *
 * @param {string} name
 * @param {'beginner'|'intermediate'|'advanced'} preset
 * @returns {Object}
 */
export function createDefaultProject(name = 'Untitled Floorplan', preset = 'beginner') {
  const projectId = `fp_proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (preset === 'beginner') {
    return {
      schemaVersion: SCHEMA_VERSION,
      projectId,
      name,
      technologyPreset: 'sky130_educational',
      die: { x: 0, y: 0, width: 400, height: 320 },
      core: { x: 40, y: 40, width: 320, height: 240 },
      standardCellAreaUm2: 28000,
      macros: [
        { id: 'SRAM_DATA', name: 'SRAM Data (80×60)', x: 60, y: 60, width: 80, height: 60, orientation: 'R0', halo: 15, fixed: false },
        { id: 'SRAM_INST', name: 'SRAM Inst (80×60)', x: 260, y: 60, width: 80, height: 60, orientation: 'R0', halo: 15, fixed: false },
      ],
      pins: [
        { id: 'clk', net: 'clk', edge: 'top', coord: 160, layer: 'M3' },
        { id: 'rst_n', net: 'rst_n', edge: 'top', coord: 180, layer: 'M3' },
        { id: 'data_in[0]', net: 'data_in[0]', edge: 'left', coord: 80, layer: 'M4' },
        { id: 'data_in[1]', net: 'data_in[1]', edge: 'left', coord: 120, layer: 'M4' },
        { id: 'data_out[0]', net: 'data_out[0]', edge: 'right', coord: 80, layer: 'M4' },
        { id: 'data_out[1]', net: 'data_out[1]', edge: 'right', coord: 120, layer: 'M4' },
      ],
      nets: [
        { id: 'net_clk', name: 'clk', type: 'clock', sources: ['clk'], sinks: ['SRAM_DATA', 'SRAM_INST'] },
        { id: 'net_data', name: 'data_bus', type: 'signal', sources: ['data_in[0]', 'data_in[1]'], sinks: ['SRAM_DATA'] },
        { id: 'net_out', name: 'out_bus', type: 'signal', sources: ['SRAM_DATA'], sinks: ['data_out[0]', 'data_out[1]'] },
      ],
      placementRows: [
        { x: 40, y: 40, width: 320, height: 240, siteWidth: 0.46, rowHeight: 2.72 },
      ],
      blockages: [],
      placementRegions: [],
      powerNetwork: {
        rings: [
          { id: 'ring_vdd', net: 'VDD', layer: 'M5', x: 28, y: 28, width: 344, height: 264, lineWidth: 6 },
          { id: 'ring_vss', net: 'VSS', layer: 'M5', x: 18, y: 18, width: 364, height: 284, lineWidth: 6 },
        ],
        straps: [
          { id: 'strap_vdd_1', net: 'VDD', layer: 'M4', x1: 28, y1: 140, x2: 372, y2: 140, width: 4 },
          { id: 'strap_vss_1', net: 'VSS', layer: 'M4', x1: 18, y1: 180, x2: 382, y2: 180, width: 4 },
        ],
        vias: [
          { id: 'via_1', layer1: 'M4', layer2: 'M5', x: 28, y: 140, net: 'VDD' },
          { id: 'via_2', layer1: 'M4', layer2: 'M5', x: 372, y: 140, net: 'VDD' },
          { id: 'via_3', layer1: 'M4', layer2: 'M5', x: 18, y: 180, net: 'VSS' },
          { id: 'via_4', layer1: 'M4', layer2: 'M5', x: 382, y: 180, net: 'VSS' },
        ],
        sources: [
          { nodeId: 'ring_vdd', net: 'VDD' },
          { nodeId: 'ring_vss', net: 'VSS' },
        ],
        loads: [
          { nodeId: 'strap_vdd_1', net: 'VDD' },
          { nodeId: 'strap_vss_1', net: 'VSS' },
        ],
      },
      constraints: {
        maxUtilization: 70,
        minMacroHalo: 15,
        minPinSpacing: 10,
        targetAspectRatio: 1.0,
      },
    };
  }

  if (preset === 'intermediate') {
    return {
      schemaVersion: SCHEMA_VERSION,
      projectId,
      name,
      technologyPreset: 'sky130_educational',
      die: { x: 0, y: 0, width: 560, height: 460 },
      core: { x: 40, y: 40, width: 480, height: 380 },
      standardCellAreaUm2: 60000,
      macros: [
        { id: 'MEM_BANK0', name: 'MEM Bank 0', x: 60, y: 60, width: 100, height: 80, orientation: 'R0', halo: 15, fixed: false },
        { id: 'MEM_BANK1', name: 'MEM Bank 1', x: 60, y: 280, width: 100, height: 80, orientation: 'R0', halo: 15, fixed: false },
        { id: 'MEM_BANK2', name: 'MEM Bank 2', x: 400, y: 60, width: 100, height: 80, orientation: 'MY', halo: 15, fixed: false },
        { id: 'MEM_BANK3', name: 'MEM Bank 3', x: 400, y: 280, width: 100, height: 80, orientation: 'MY', halo: 15, fixed: false },
      ],
      pins: [
        { id: 'clk_sys', net: 'clk_sys', edge: 'top', coord: 200, layer: 'M3' },
        { id: 'clk_mem', net: 'clk_mem', edge: 'top', coord: 240, layer: 'M3' },
        { id: 'd_in[0]', net: 'd_in[0]', edge: 'left', coord: 120, layer: 'M4' },
        { id: 'd_in[1]', net: 'd_in[1]', edge: 'left', coord: 140, layer: 'M4' },
        { id: 'd_out[0]', net: 'd_out[0]', edge: 'right', coord: 120, layer: 'M4' },
        { id: 'd_out[1]', net: 'd_out[1]', edge: 'right', coord: 140, layer: 'M4' },
      ],
      nets: [],
      placementRows: [{ x: 40, y: 40, width: 480, height: 380, siteWidth: 0.46, rowHeight: 2.72 }],
      blockages: [],
      placementRegions: [],
      powerNetwork: {
        rings: [
          { id: 'ring_vdd', net: 'VDD', layer: 'M5', x: 28, y: 28, width: 504, height: 404, lineWidth: 8 },
          { id: 'ring_vss', net: 'VSS', layer: 'M5', x: 16, y: 16, width: 528, height: 428, lineWidth: 8 },
        ],
        straps: [
          { id: 'strap_vdd_1', net: 'VDD', layer: 'M4', x1: 28, y1: 200, x2: 532, y2: 200, width: 6 },
          { id: 'strap_vss_1', net: 'VSS', layer: 'M4', x1: 16, y1: 250, x2: 544, y2: 250, width: 6 },
        ],
        vias: [
          { id: 'via_1', layer1: 'M4', layer2: 'M5', x: 28, y: 200, net: 'VDD' },
          { id: 'via_2', layer1: 'M4', layer2: 'M5', x: 532, y: 200, net: 'VDD' },
          { id: 'via_3', layer1: 'M4', layer2: 'M5', x: 16, y: 250, net: 'VSS' },
          { id: 'via_4', layer1: 'M4', layer2: 'M5', x: 544, y: 250, net: 'VSS' },
        ],
        sources: [{ nodeId: 'ring_vdd', net: 'VDD' }, { nodeId: 'ring_vss', net: 'VSS' }],
        loads: [{ nodeId: 'strap_vdd_1', net: 'VDD' }, { nodeId: 'strap_vss_1', net: 'VSS' }],
      },
      constraints: { maxUtilization: 75, minMacroHalo: 15, minPinSpacing: 10, targetAspectRatio: 1.0 },
    };
  }

  // Advanced SoC
  return {
    schemaVersion: SCHEMA_VERSION,
    projectId,
    name,
    technologyPreset: 'sky130_educational',
    die: { x: 0, y: 0, width: 720, height: 540 },
    core: { x: 50, y: 50, width: 620, height: 440 },
    standardCellAreaUm2: 120000,
    macros: [
      { id: 'CPU_ROM', name: 'Boot ROM', x: 70, y: 70, width: 100, height: 80, orientation: 'R0', halo: 15, fixed: false },
      { id: 'CPU_SRAM', name: 'L1 Data SRAM', x: 70, y: 310, width: 120, height: 100, orientation: 'R0', halo: 20, fixed: false },
      { id: 'PERIPH_SRAM', name: 'DMA Buffer', x: 520, y: 70, width: 120, height: 100, orientation: 'MY', halo: 15, fixed: false },
      { id: 'DSP_ACCEL', name: 'MAC Accelerator', x: 500, y: 310, width: 140, height: 110, orientation: 'MY', halo: 20, fixed: false },
    ],
    pins: [
      { id: 'clk_core', net: 'clk_core', edge: 'top', coord: 220, layer: 'M3' },
      { id: 'rst_sys_n', net: 'rst_sys_n', edge: 'top', coord: 250, layer: 'M3' },
    ],
    nets: [],
    placementRows: [{ x: 50, y: 50, width: 620, height: 440, siteWidth: 0.46, rowHeight: 2.72 }],
    blockages: [{ id: 'blk_pll', x: 300, y: 60, width: 80, height: 60, type: 'placement_hard' }],
    placementRegions: [],
    powerNetwork: {
      rings: [
        { id: 'ring_vdd', net: 'VDD', layer: 'M5', x: 35, y: 35, width: 650, height: 470, lineWidth: 10 },
        { id: 'ring_vss', net: 'VSS', layer: 'M5', x: 20, y: 20, width: 680, height: 500, lineWidth: 10 },
      ],
      straps: [
        { id: 'strap_vdd_1', net: 'VDD', layer: 'M4', x1: 35, y1: 200, x2: 685, y2: 200, width: 6 },
        { id: 'strap_vdd_2', net: 'VDD', layer: 'M4', x1: 35, y1: 360, x2: 685, y2: 360, width: 6 },
        { id: 'strap_vss_1', net: 'VSS', layer: 'M4', x1: 20, y1: 260, x2: 700, y2: 260, width: 6 },
        { id: 'strap_vss_2', net: 'VSS', layer: 'M4', x1: 20, y1: 420, x2: 700, y2: 420, width: 6 },
      ],
      vias: [
        { id: 'via_1', layer1: 'M4', layer2: 'M5', x: 35, y: 200, net: 'VDD' },
        { id: 'via_2', layer1: 'M4', layer2: 'M5', x: 685, y: 200, net: 'VDD' },
        { id: 'via_3', layer1: 'M4', layer2: 'M5', x: 35, y: 360, net: 'VDD' },
        { id: 'via_4', layer1: 'M4', layer2: 'M5', x: 685, y: 360, net: 'VDD' },
        { id: 'via_5', layer1: 'M4', layer2: 'M5', x: 20, y: 260, net: 'VSS' },
        { id: 'via_6', layer1: 'M4', layer2: 'M5', x: 700, y: 260, net: 'VSS' },
        { id: 'via_7', layer1: 'M4', layer2: 'M5', x: 20, y: 420, net: 'VSS' },
        { id: 'via_8', layer1: 'M4', layer2: 'M5', x: 700, y: 420, net: 'VSS' },
      ],
      sources: [{ nodeId: 'ring_vdd', net: 'VDD' }, { nodeId: 'ring_vss', net: 'VSS' }],
      loads: [{ nodeId: 'strap_vdd_1', net: 'VDD' }, { nodeId: 'strap_vss_1', net: 'VSS' }],
    },
    constraints: { maxUtilization: 80, minMacroHalo: 15, minPinSpacing: 10, targetAspectRatio: 1.0 },
  };
}

/**
 * Serialize a project to deterministic formatted JSON.
 */
export function serializeProject(project) {
  if (!project) throw new Error('Cannot serialize null or undefined project');
  return JSON.stringify(project, null, 2);
}

/**
 * Deserialize JSON to a FloorplanProject, applying migrations if necessary.
 */
export function deserializeProject(json) {
  if (typeof json !== 'string') {
    throw new Error('Project JSON must be a string');
  }
  const parsed = JSON.parse(json);
  const problems = validateProjectShape(parsed);
  if (problems.length > 0) {
    throw new Error(`Not a valid floorplan project: ${problems.join('; ')}`);
  }
  return migrateProject(parsed);
}

/**
 * Structural validation for imported/loaded projects. Returns a list of problems
 * (empty when the JSON is a usable floorplan). Migration fills optional fields,
 * but die/core geometry must exist and be positive or the Studio would silently
 * replace the user's file with a default project.
 */
export function validateProjectShape(raw) {
  const problems = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return ['top-level value must be a JSON object'];
  }
  const rect = (r, label) => {
    if (!r || typeof r !== 'object') { problems.push(`missing ${label} rectangle`); return; }
    ['width', 'height'].forEach((k) => {
      if (!(Number(r[k]) > 0)) problems.push(`${label}.${k} must be a positive number`);
    });
    ['x', 'y'].forEach((k) => {
      if (r[k] !== undefined && !Number.isFinite(Number(r[k]))) problems.push(`${label}.${k} must be numeric`);
    });
  };
  rect(raw.die, 'die');
  rect(raw.core, 'core');
  if (raw.macros !== undefined && !Array.isArray(raw.macros)) problems.push('macros must be an array');
  (Array.isArray(raw.macros) ? raw.macros : []).forEach((m, i) => {
    if (!m || !(Number(m.width) > 0) || !(Number(m.height) > 0)) problems.push(`macros[${i}] needs positive width and height`);
  });
  if (raw.pins !== undefined && !Array.isArray(raw.pins)) problems.push('pins must be an array');
  (Array.isArray(raw.pins) ? raw.pins : []).forEach((p, i) => {
    if (!p || !p.id) problems.push(`pins[${i}] needs an id`);
    if (p && p.edge && !['top', 'bottom', 'left', 'right'].includes(p.edge)) problems.push(`pins[${i}].edge must be top/bottom/left/right`);
  });
  return problems;
}

/**
 * Migrate older or incomplete project shapes to Schema v1.
 */
export function migrateProject(raw) {
  if (!raw || typeof raw !== 'object') {
    return createDefaultProject('Recovered Project', 'beginner');
  }

  const base = createDefaultProject(raw.name || 'Migrated Project', 'beginner');

  return {
    schemaVersion: SCHEMA_VERSION,
    projectId: raw.projectId || base.projectId,
    name: raw.name || base.name,
    technologyPreset: raw.technologyPreset || 'sky130_educational',
    die: raw.die ? { ...raw.die } : base.die,
    core: raw.core ? { ...raw.core } : base.core,
    standardCellAreaUm2: Number(raw.standardCellAreaUm2) || base.standardCellAreaUm2,
    macros: Array.isArray(raw.macros) ? raw.macros.map((m) => ({
      id: m.id || `macro_${Math.random().toString(36).substring(2, 6)}`,
      name: m.name || m.id,
      x: Number(m.x) || 0,
      y: Number(m.y) || 0,
      width: Number(m.width) || 60,
      height: Number(m.height) || 40,
      orientation: m.orientation || 'R0',
      halo: Number(m.halo) >= 0 ? Number(m.halo) : 15,
      fixed: Boolean(m.fixed),
    })) : [],
    pins: Array.isArray(raw.pins) ? raw.pins.map((p) => ({
      id: p.id,
      net: p.net || p.id,
      edge: p.edge || 'top',
      coord: Number(p.coord) || 0,
      layer: p.layer || 'M3',
    })) : [],
    nets: Array.isArray(raw.nets) ? raw.nets : [],
    placementRows: Array.isArray(raw.placementRows) ? raw.placementRows : base.placementRows,
    blockages: Array.isArray(raw.blockages) ? raw.blockages : [],
    placementRegions: Array.isArray(raw.placementRegions) ? raw.placementRegions : [],
    powerNetwork: raw.powerNetwork ? {
      rings: Array.isArray(raw.powerNetwork.rings) ? raw.powerNetwork.rings : [],
      straps: Array.isArray(raw.powerNetwork.straps) ? raw.powerNetwork.straps : [],
      vias: Array.isArray(raw.powerNetwork.vias) ? raw.powerNetwork.vias : [],
      sources: Array.isArray(raw.powerNetwork.sources) ? raw.powerNetwork.sources : [],
      loads: Array.isArray(raw.powerNetwork.loads) ? raw.powerNetwork.loads : [],
    } : base.powerNetwork,
    constraints: raw.constraints ? { ...raw.constraints } : base.constraints,
  };
}

// ─── THREE SPECIFIED BENCHMARK EXAMPLES ─────────────────────────────────────

/**
 * Example 1: Small Controller
 * Die: 240×200 µm, Core: 200×160 µm.
 * Has an intentional defect: Macro overlap between SRAM1 and SRAM2!
 */
export const EXAMPLE_SMALL_CONTROLLER = {
  schemaVersion: SCHEMA_VERSION,
  projectId: 'example_small_controller',
  name: 'Small Controller (Benchmark)',
  technologyPreset: 'sky130_educational',
  die: { x: 0, y: 0, width: 240, height: 200 },
  core: { x: 20, y: 20, width: 200, height: 160 },
  standardCellAreaUm2: 12000,
  macros: [
    { id: 'SRAM1', name: 'SRAM1 (60×40)', x: 30, y: 30, width: 60, height: 40, orientation: 'R0', halo: 15, fixed: false },
    // SRAM2 intentionally placed at (70, 45) which overlaps with SRAM1 (x: 30..90, y: 30..70)
    { id: 'SRAM2', name: 'SRAM2 (60×40)', x: 70, y: 45, width: 60, height: 40, orientation: 'R0', halo: 15, fixed: false },
  ],
  pins: [
    { id: 'clk', net: 'clk', edge: 'top', coord: 60, layer: 'M3' },
    { id: 'rst_n', net: 'rst_n', edge: 'top', coord: 100, layer: 'M3' },
    { id: 'in[0]', net: 'in[0]', edge: 'left', coord: 40, layer: 'M4' },
    { id: 'in[1]', net: 'in[1]', edge: 'left', coord: 80, layer: 'M4' },
    { id: 'out[0]', net: 'out[0]', edge: 'right', coord: 40, layer: 'M4' },
    { id: 'out[1]', net: 'out[1]', edge: 'right', coord: 80, layer: 'M4' },
    { id: 'out[2]', net: 'out[2]', edge: 'bottom', coord: 60, layer: 'M3' },
    { id: 'out[3]', net: 'out[3]', edge: 'bottom', coord: 100, layer: 'M3' },
  ],
  nets: [
    { id: 'n_clk', name: 'clk', type: 'clock', sources: ['clk'], sinks: ['SRAM1', 'SRAM2'] },
  ],
  placementRows: [{ x: 20, y: 20, width: 200, height: 160, siteWidth: 0.46, rowHeight: 2.72 }],
  blockages: [],
  placementRegions: [],
  powerNetwork: {
    rings: [
      { id: 'ring_vdd', net: 'VDD', layer: 'M5', x: 12, y: 12, width: 216, height: 176, lineWidth: 4 },
      { id: 'ring_vss', net: 'VSS', layer: 'M5', x: 6, y: 6, width: 228, height: 188, lineWidth: 4 },
    ],
    straps: [
      { id: 'strap_vdd_1', net: 'VDD', layer: 'M4', x1: 12, y1: 100, x2: 228, y2: 100, width: 3 },
      { id: 'strap_vss_1', net: 'VSS', layer: 'M4', x1: 6, y1: 130, x2: 234, y2: 130, width: 3 },
    ],
    vias: [
      { id: 'v1', layer1: 'M4', layer2: 'M5', x: 12, y: 100, net: 'VDD' },
      { id: 'v2', layer1: 'M4', layer2: 'M5', x: 228, y: 100, net: 'VDD' },
      { id: 'v3', layer1: 'M4', layer2: 'M5', x: 6, y: 130, net: 'VSS' },
      { id: 'v4', layer1: 'M4', layer2: 'M5', x: 234, y: 130, net: 'VSS' },
    ],
    sources: [{ nodeId: 'ring_vdd', net: 'VDD' }, { nodeId: 'ring_vss', net: 'VSS' }],
    loads: [{ nodeId: 'strap_vdd_1', net: 'VDD' }, { nodeId: 'strap_vss_1', net: 'VSS' }],
  },
  constraints: { maxUtilization: 70, minMacroHalo: 15, minPinSpacing: 10, targetAspectRatio: 1.0 },
};

/**
 * Example 2: Dual SRAM Controller
 * Die: 480×360 µm, Core: 420×300 µm.
 * Has an intentional defect: Missing Via on VDD strap right-hand intersection!
 */
export const EXAMPLE_DUAL_SRAM_CONTROLLER = {
  schemaVersion: SCHEMA_VERSION,
  projectId: 'example_dual_sram_controller',
  name: 'Dual SRAM Controller (Benchmark)',
  technologyPreset: 'sky130_educational',
  die: { x: 0, y: 0, width: 480, height: 360 },
  core: { x: 30, y: 30, width: 420, height: 300 },
  standardCellAreaUm2: 40000,
  macros: [
    { id: 'SRAM_A', name: 'SRAM A', x: 45, y: 45, width: 90, height: 70, orientation: 'R0', halo: 15, fixed: false },
    { id: 'SRAM_B', name: 'SRAM B', x: 45, y: 240, width: 90, height: 70, orientation: 'R0', halo: 15, fixed: false },
    { id: 'SRAM_C', name: 'SRAM C', x: 340, y: 45, width: 90, height: 70, orientation: 'MY', halo: 15, fixed: false },
    { id: 'SRAM_D', name: 'SRAM D', x: 340, y: 240, width: 90, height: 70, orientation: 'MY', halo: 15, fixed: false },
  ],
  pins: [
    { id: 'clk', net: 'clk', edge: 'top', coord: 150, layer: 'M3' },
    { id: 'rst', net: 'rst', edge: 'top', coord: 180, layer: 'M3' },
    { id: 'd0', net: 'd0', edge: 'left', coord: 60, layer: 'M4' },
    { id: 'd1', net: 'd1', edge: 'left', coord: 80, layer: 'M4' },
    { id: 'd2', net: 'd2', edge: 'left', coord: 100, layer: 'M4' },
    { id: 'd3', net: 'd3', edge: 'left', coord: 120, layer: 'M4' },
    { id: 'q0', net: 'q0', edge: 'right', coord: 60, layer: 'M4' },
    { id: 'q1', net: 'q1', edge: 'right', coord: 80, layer: 'M4' },
    { id: 'q2', net: 'q2', edge: 'right', coord: 100, layer: 'M4' },
    { id: 'q3', net: 'q3', edge: 'right', coord: 120, layer: 'M4' },
  ],
  nets: [],
  placementRows: [{ x: 30, y: 30, width: 420, height: 300, siteWidth: 0.46, rowHeight: 2.72 }],
  blockages: [],
  placementRegions: [],
  powerNetwork: {
    rings: [
      { id: 'ring_vdd', net: 'VDD', layer: 'M5', x: 20, y: 20, width: 440, height: 320, lineWidth: 6 },
      { id: 'ring_vss', net: 'VSS', layer: 'M5', x: 10, y: 10, width: 460, height: 340, lineWidth: 6 },
    ],
    straps: [
      { id: 'strap_vdd_1', net: 'VDD', layer: 'M4', x1: 20, y1: 180, x2: 460, y2: 180, width: 4 },
      { id: 'strap_vss_1', net: 'VSS', layer: 'M4', x1: 10, y1: 210, x2: 470, y2: 210, width: 4 },
    ],
    // Intentional defect: via connecting strap_vdd_1 to ring_vdd at x=460 is missing!
    vias: [
      { id: 'v1', layer1: 'M4', layer2: 'M5', x: 20, y: 180, net: 'VDD' },
      // MISSING: { id: 'v2', layer1: 'M4', layer2: 'M5', x: 460, y: 180, net: 'VDD' }
      { id: 'v3', layer1: 'M4', layer2: 'M5', x: 10, y: 210, net: 'VSS' },
      { id: 'v4', layer1: 'M4', layer2: 'M5', x: 470, y: 210, net: 'VSS' },
    ],
    sources: [{ nodeId: 'ring_vdd', net: 'VDD' }, { nodeId: 'ring_vss', net: 'VSS' }],
    loads: [{ nodeId: 'strap_vdd_1', net: 'VDD' }, { nodeId: 'strap_vss_1', net: 'VSS' }],
  },
  constraints: { maxUtilization: 72, minMacroHalo: 15, minPinSpacing: 10, targetAspectRatio: 1.0 },
};

/**
 * Example 3: Small SoC Subsystem
 * Die: 720×540 µm, Core: 640×460 µm.
 * Has an intentional defect: Pin pitch spacing violation between pins p1 and p2!
 */
export const EXAMPLE_SMALL_SOC_SUBSYSTEM = {
  schemaVersion: SCHEMA_VERSION,
  projectId: 'example_small_soc_subsystem',
  name: 'Small SoC Subsystem (Benchmark)',
  technologyPreset: 'sky130_educational',
  die: { x: 0, y: 0, width: 720, height: 540 },
  core: { x: 40, y: 40, width: 640, height: 460 },
  standardCellAreaUm2: 95000,
  macros: [
    { id: 'CPU_CORE', name: 'RISC-V Core', x: 55, y: 55, width: 140, height: 110, orientation: 'R0', halo: 15, fixed: false },
    { id: 'DCACHE', name: 'Data Cache', x: 55, y: 320, width: 130, height: 95, orientation: 'R0', halo: 15, fixed: false },
    { id: 'ICACHE', name: 'Inst Cache', x: 510, y: 55, width: 130, height: 95, orientation: 'MY', halo: 15, fixed: false },
    { id: 'SYS_DMA', name: 'DMA Ctrl', x: 510, y: 320, width: 120, height: 85, orientation: 'MY', halo: 15, fixed: false },
  ],
  pins: [
    // Intentional defect: pin p1 and pin p2 have spacing = 3µm (< min required 10µm)
    { id: 'pin_irq0', net: 'irq0', edge: 'top', coord: 120, layer: 'M3' },
    { id: 'pin_irq1', net: 'irq1', edge: 'top', coord: 123, layer: 'M3' },
    { id: 'clk_osc', net: 'clk_osc', edge: 'top', coord: 200, layer: 'M3' },
    { id: 'rst_top', net: 'rst_top', edge: 'top', coord: 230, layer: 'M3' },
    { id: 'gpio_0', net: 'gpio_0', edge: 'bottom', coord: 150, layer: 'M3' },
    { id: 'gpio_1', net: 'gpio_1', edge: 'bottom', coord: 180, layer: 'M3' },
  ],
  nets: [],
  placementRows: [{ x: 40, y: 40, width: 640, height: 460, siteWidth: 0.46, rowHeight: 2.72 }],
  blockages: [],
  placementRegions: [],
  powerNetwork: {
    rings: [
      { id: 'ring_vdd', net: 'VDD', layer: 'M5', x: 26, y: 26, width: 668, height: 488, lineWidth: 8 },
      { id: 'ring_vss', net: 'VSS', layer: 'M5', x: 14, y: 14, width: 692, height: 512, lineWidth: 8 },
    ],
    straps: [
      { id: 'strap_vdd_1', net: 'VDD', layer: 'M4', x1: 26, y1: 220, x2: 694, y2: 220, width: 6 },
      { id: 'strap_vss_1', net: 'VSS', layer: 'M4', x1: 14, y1: 280, x2: 706, y2: 280, width: 6 },
    ],
    vias: [
      { id: 'v1', layer1: 'M4', layer2: 'M5', x: 26, y: 220, net: 'VDD' },
      { id: 'v2', layer1: 'M4', layer2: 'M5', x: 694, y: 220, net: 'VDD' },
      { id: 'v3', layer1: 'M4', layer2: 'M5', x: 14, y: 280, net: 'VSS' },
      { id: 'v4', layer1: 'M4', layer2: 'M5', x: 706, y: 280, net: 'VSS' },
    ],
    sources: [{ nodeId: 'ring_vdd', net: 'VDD' }, { nodeId: 'ring_vss', net: 'VSS' }],
    loads: [{ nodeId: 'strap_vdd_1', net: 'VDD' }, { nodeId: 'strap_vss_1', net: 'VSS' }],
  },
  constraints: { maxUtilization: 75, minMacroHalo: 15, minPinSpacing: 10, targetAspectRatio: 1.0 },
};
