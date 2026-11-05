/**
 * studentDesignContext.js
 * =======================
 * Pure helper module that extracts and validates student design artifacts
 * created during level play for use in Physical Design Stage Sanity Checks.
 *
 * Guarantees that sanity check certifications evaluate genuine student designs
 * rather than unearned defaults, while cleanly supporting separate demonstration drills.
 */

import {
  ARTIFACT_STATUS,
  CHECK_CLASSIFICATION,
} from './designArtifactContracts.js';

/**
 * Helper to safely extract verified measurements or raw artifacts from levelProgress.
 */
function getValidMeasurements(player, levelId) {
  const levelData = player?.levelProgress?.[levelId];
  if (!levelData?.completed || !levelData?.artifacts) {
    return null;
  }
  const art = levelData.artifacts;
  if (art.measurements && typeof art.measurements === 'object') {
    return art.measurements;
  }
  return art;
}

/**
 * Mapping of sanity check IDs to their prerequisite level IDs, design requirements, and classifications.
 */
export const SANITY_CHECK_REQUIREMENTS = {
  // ─── Floorplanning (3 checks) ───────────────────────────────────
  'fp-drc': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fp-4', 'fp-5'],
    title: 'Core Margin & Macro Halo Spacing',
    description: 'Validates that your macro placement satisfies core boundary margin (>= 20 µm) and macro-to-macro keepout halos (>= 15 µm).',
    extractData: (player) => {
      const fp5 = getValidMeasurements(player, 'fp-5') || {};
      const fp4 = getValidMeasurements(player, 'fp-4') || {};
      return {
        margin: fp5.margin ?? fp4.margin,
        halo: fp5.halo ?? fp4.halo,
      };
    },
  },
  'fp-connectivity': {
    classification: CHECK_CLASSIFICATION.PRACTICE_ONLY,
    prerequisiteLevels: ['fp-5'],
    title: 'VDD/VSS Power Ring Continuity',
    description: 'Traces power and ground distribution rings around your core boundary to ensure complete closed loops with zero open segments.',
    extractData: (player) => {
      const fp5 = getValidMeasurements(player, 'fp-5') || {};
      return {
        ringContinuous: fp5.ringContinuous ?? (fp5.powerOk !== undefined ? fp5.powerOk : true),
        floatingPins: fp5.floatingPins ?? 0,
      };
    },
  },
  'fp-missing-vias': {
    classification: CHECK_CLASSIFICATION.PRACTICE_ONLY,
    prerequisiteLevels: ['fp-5'],
    title: 'Power Grid Crossing Vias',
    description: 'Inspects power mesh layer intersections to confirm that all orthogonal strap-to-ring crossings have via connections.',
    extractData: (player) => {
      const fp5 = getValidMeasurements(player, 'fp-5') || {};
      return {
        missingVias: fp5.missingVias ?? (fp5.powerOk === false ? 4 : 0),
      };
    },
  },

  // ─── Placement (5 checks) ───────────────────────────────────────
  'pl-legality': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['pl-1', 'pl-2', 'pl-5'],
    title: 'Cell Site Legalization & Overlap Resolution',
    description: 'Validates that placed cells snap to standard cell site rows with zero overlapping transistor active areas.',
    extractData: (player) => {
      const pl5 = getValidMeasurements(player, 'pl-5') || {};
      const pl2 = getValidMeasurements(player, 'pl-2') || {};
      return {
        cells: pl5.cells || pl2.cells,
        overlapsResolved: pl5.noOverlaps ?? pl2.overlapsResolved,
      };
    },
  },
  'pl-congestion': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['pl-4'],
    title: 'GCell Routing Demand Congestion',
    description: 'Checks Global Routing Cell demand ratios across your layout to ensure all bins remain below routing capacity.',
    extractData: (player) => {
      const pl4 = getValidMeasurements(player, 'pl-4') || {};
      return {
        hotspotResolved: pl4.hotspotResolved,
        maxCongestion: pl4.maxCongestion,
        peakRatio: pl4.peakRatio ?? pl4.maxCongestion,
      };
    },
  },
  'pl-drc': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['pl-2', 'pl-5'],
    title: 'Cell-to-Cell Spacing & Row Orientation',
    description: 'Validates standard cell row alignment, boundary clearances, and latchup well-tap pitch.',
    extractData: (player) => {
      const pl5 = getValidMeasurements(player, 'pl-5') || {};
      return {
        boundaryClearance: pl5.boundaryClearance,
        nwellAligned: pl5.nwellAligned,
        maxTapPitch: pl5.maxTapPitch ?? pl5.wellTapPitch,
        wellTapPitch: pl5.wellTapPitch ?? pl5.maxTapPitch,
      };
    },
  },
  'pl-connectivity': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['pl-3', 'pl-5'],
    title: 'Placement Net Connectivity',
    description: 'Ensures all logical nets connect driver cell outputs to receiver cell inputs with zero unrouted terminals.',
    extractData: (player) => {
      const pl5 = getValidMeasurements(player, 'pl-5') || {};
      return {
        floatingPins: pl5.floatingPins ?? pl5.unplacedPins ?? 0,
        unplacedPins: pl5.unplacedPins ?? pl5.floatingPins ?? 0,
        unconnectedNets: pl5.unconnectedNets ?? 0,
      };
    },
  },
  'pl-missing-vias': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['pl-5'],
    title: 'Standard Cell Power Rail Tie-Offs & Well-Taps',
    description: 'Verifies that substrate tap cells maintain required latchup spacing (<= 30 µm) and cell power pins connect to rails.',
    extractData: (player) => {
      const pl5 = getValidMeasurements(player, 'pl-5') || {};
      return {
        wellTapPitch: pl5.wellTapPitch ?? pl5.maxTapPitch,
        maxTapPitch: pl5.maxTapPitch ?? pl5.wellTapPitch,
        missingRailVias: pl5.missingRailVias ?? pl5.offRailCells ?? 0,
        offRailCells: pl5.offRailCells ?? pl5.missingRailVias ?? 0,
      };
    },
  },

  // ─── Clock Tree Synthesis (4 checks) ────────────────────────────
  'cts-timing-reports': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['cts-2'],
    title: 'Post-CTS Setup & Hold Timing Closure',
    description: 'Evaluates setup and hold timing slacks with real clock propagation delays and clock skew.',
    extractData: (player) => {
      const cts2 = getValidMeasurements(player, 'cts-2') || {};
      return {
        setupSlack: cts2.setupSlack,
        holdSlack: cts2.holdSlack,
        skewPs: cts2.skewPs,
        tCombNs: cts2.tCombNs,
      };
    },
  },
  'cts-power': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['cts-3', 'cts-5'],
    title: 'Clock Network Dynamic Power Dissipation',
    description: 'Checks clock buffer switching power to confirm total tree power is within budget (<= 5.0 mW).',
    extractData: (player) => {
      const cts5 = getValidMeasurements(player, 'cts-5') || {};
      return {
        powerMw: cts5.powerMw,
        maxPowerAllowed: 5.0,
      };
    },
  },
  'cts-qor': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['cts-4', 'cts-5'],
    title: 'Clock Tree Quality of Results (QoR)',
    description: 'Evaluates max insertion latency (<= 300 ps) and clock slew transition times (<= 80 ps).',
    extractData: (player) => {
      const cts5 = getValidMeasurements(player, 'cts-5') || {};
      return {
        maxLatencyPs: cts5.maxLatencyPs,
        maxTransitionPs: cts5.maxTransitionPs,
        maxSlewPs: cts5.maxSlewPs ?? cts5.maxTransitionPs,
      };
    },
  },
  'cts-clock-tree-report': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['cts-5'],
    title: 'Clock Skew Balance Across Sinks',
    description: 'Measures arrival time variance between launch and capture registers to confirm clock skew <= 30 ps.',
    extractData: (player) => {
      const cts5 = getValidMeasurements(player, 'cts-5') || {};
      return {
        skewPs: cts5.skewPs,
        latencyPs: cts5.latencyPs,
        stages: cts5.stages,
        sinks: cts5.sinks,
      };
    },
  },

  // ─── Routing (5 checks) ─────────────────────────────────────────
  'rt-routes': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['rt-1', 'rt-5'],
    title: 'Detailed Routing Net Completion',
    description: 'Verifies 100% net completion with zero unrouted antenna opens or dangling wire fragments.',
    extractData: (player) => {
      const rt5 = getValidMeasurements(player, 'rt-5') || {};
      return {
        unroutedNets: rt5.unroutedNets,
        openSegments: rt5.openSegments,
      };
    },
  },
  'rt-lvs': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['rt-5'],
    title: 'Layout Versus Schematic (LVS) Netlist Extraction',
    description: 'Extracts physical interconnect polygons and compares against the logical netlist for opens and shorts.',
    extractData: (player) => {
      const rt5 = getValidMeasurements(player, 'rt-5') || {};
      return {
        shorts: rt5.hasShorts ? 1 : (rt5.shorts ?? 0),
        hasShorts: rt5.hasShorts ?? (rt5.shorts ? rt5.shorts > 0 : false),
        opens: rt5.opens ?? 0,
        segments: rt5.segments,
      };
    },
  },
  'rt-timing': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['rt-4', 'rt-5'],
    title: 'Post-Route Parasitic RC Timing Sign-Off',
    description: 'Calculates distributed wire delays using extracted SPEF parasitic resistances and capacitances.',
    extractData: (player) => {
      const rt5 = getValidMeasurements(player, 'rt-5') || {};
      return {
        wnsPs: rt5.wnsPs,
        worstNegativeSlackNs: rt5.timingSlackNs ?? (typeof rt5.wnsPs === 'number' ? rt5.wnsPs / 1000 : undefined),
      };
    },
  },
  'rt-design': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['rt-3', 'rt-5'],
    title: 'Via Enclosure & Metal Spacing DRC',
    description: 'Validates metal wire width, spacing, notch rules, and via layer enclosure margins (>= 0.05 µm).',
    extractData: (player) => {
      const rt3 = getValidMeasurements(player, 'rt-3') || {};
      const rt5 = getValidMeasurements(player, 'rt-5') || {};
      return {
        enclosureUm: rt3.viaEnclosureUm ?? rt3.enclosureUm,
        viaEnclosureUm: rt3.viaEnclosureUm ?? rt3.enclosureUm,
        drcErrors: rt5.drcErrors ?? rt3.drcErrors ?? rt3.drcViolations ?? 0,
        drcViolations: rt3.drcViolations ?? rt5.drcErrors ?? 0,
      };
    },
  },
  'rt-constraints': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['rt-4', 'rt-5'],
    title: 'Signal Integrity & Crosstalk Noise Budget',
    description: 'Evaluates dynamic cross-coupling glitch voltage (<= 50 mV) on sensitive signal nets.',
    extractData: (player) => {
      const rt4 = getValidMeasurements(player, 'rt-4') || {};
      return {
        glitchVoltageMv: rt4.glitchVoltageMv ?? rt4.maxVictimNoiseMv,
        maxVictimNoiseMv: rt4.maxVictimNoiseMv ?? rt4.glitchVoltageMv,
        crosstalkMv: rt4.crosstalkMv ?? rt4.maxVictimNoiseMv ?? rt4.glitchVoltageMv,
        maxAllowedNoiseMv: rt4.maxAllowedNoiseMv || 50,
        unconstrained: rt4.unconstrained ?? 0,
      };
    },
  },

  // ─── Filler Cells (9 checks) ────────────────────────────────────
  'fc-legality': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-1', 'fc-3'],
    title: '100% Standard Cell Row Fill Ratio',
    description: 'Verifies that every empty site in the row is populated with legal discrete filler cells (FILL1 to FILL64).',
    extractData: (player) => {
      const fc5 = getValidMeasurements(player, 'fc-5') || {};
      const fc3 = getValidMeasurements(player, 'fc-3') || {};
      return {
        emptySites: fc5.emptySites ?? fc3.emptySites,
        offSiteCount: fc5.emptySites ?? fc3.emptySites,
        rowFillPercent: fc5.rowFillPercent ?? fc3.rowFillPercent,
      };
    },
  },
  'fc-drc': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-3', 'fc-5'],
    title: 'Base Layer Diffusion & Poly DRC',
    description: 'Checks diffusion notch spacing between active standard cells and adjacent filler cells.',
    extractData: (player) => {
      const fc5 = getValidMeasurements(player, 'fc-5') || {};
      const fc3 = getValidMeasurements(player, 'fc-3') || {};
      return {
        baseDrcViolations: fc5.baseDrcViolations ?? fc3.baseDrcViolations,
      };
    },
  },
  'fc-connectivity': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-3'],
    title: 'Continuous N-Well & Substrate Bias',
    description: 'Checks unbroken N-well diffusion across the entire row to eliminate substrate potential fluctuations.',
    extractData: (player) => {
      const fc3 = getValidMeasurements(player, 'fc-3') || {};
      return {
        wellContinuityMet: fc3.wellContinuityMet,
        chosenFillers: fc3.chosenFillers,
        railGaps: fc3.railGaps ?? (fc3.wellContinuityMet ? 0 : 2),
      };
    },
  },
  'fc-design': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-2', 'fc-5'],
    title: 'Physical-Only Cell Placement Integrity',
    description: 'Confirms that row endcaps terminate boundary rows and tap cells maintain continuous latchup immunity.',
    extractData: (player) => {
      const fc5 = getValidMeasurements(player, 'fc-5') || {};
      return {
        endcapsPresent: fc5.endcapsPresent,
        tapCellsContinuous: fc5.tapCellsContinuous,
        densityPercent: fc5.densityPercent,
      };
    },
  },
  'fc-timing': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-4', 'fc-5'],
    title: 'Filler Parasitic Interconnect Impact',
    description: 'Verifies that added decoupling capacitors do not introduce intolerable capacitive loading on adjacent signal nets.',
    extractData: (player) => {
      const fc5 = getValidMeasurements(player, 'fc-5') || {};
      return {
        timingImpactPs: fc5.timingImpactPs,
        slackDeltaPs: fc5.slackDeltaPs ?? (typeof fc5.timingImpactPs === 'number' ? -fc5.timingImpactPs : undefined),
        maxAllowedImpactPs: 5.0,
      };
    },
  },
  'fc-constraints': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-4'],
    title: 'Dynamic Power Rail Droop Suppression',
    description: 'Calculates dynamic IR droop under simultaneous switching current to ensure supply rail droop <= 40 mV.',
    extractData: (player) => {
      const fc4 = getValidMeasurements(player, 'fc-4') || {};
      return {
        droopMv: fc4.droopMv,
        maxAllowedDroopMv: fc4.maxAllowedDroopMv || 40,
        decapCapFf: fc4.decapCapFf,
        decapCapPf: fc4.decapCapPf,
        drcViolations: fc4.drcViolations ?? 0,
      };
    },
  },
  'fc-power': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-4', 'fc-5'],
    title: 'Decap Gate Oxide Tunneling Leakage',
    description: 'Checks total gate leakage current added by MOS decap cells to confirm standby power remains within budget (<= 20 µA).',
    extractData: (player) => {
      const fc4 = getValidMeasurements(player, 'fc-4') || {};
      return {
        leakageUa: fc4.leakageUa,
        maxAllowedLeakageUa: fc4.maxAllowedLeakageUa || 20.0,
        decapCapPf: fc4.decapCapPf,
        droopMv: fc4.droopMv,
      };
    },
  },
  'fc-qor': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-5'],
    title: 'Filler Cell Quality of Results Scorecard',
    description: 'Comprehensive scorecard checking row fill legality, continuous N-well diffusion, and decap protection.',
    extractData: (player) => {
      const fc5 = getValidMeasurements(player, 'fc-5') || {};
      return {
        qorScore: fc5.qorScore,
        irMarginPercent: fc5.irMarginPercent ?? fc5.qorScore,
        minPassingScore: 90,
      };
    },
  },
  'fc-congestion': {
    classification: CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK,
    prerequisiteLevels: ['fc-5'],
    title: 'Filler Pin Blockage & Routing Track Availability',
    description: 'Ensures physical-only filler cells do not block upper metal routing tracks or obstruct pin access.',
    extractData: (player) => {
      const fc5 = getValidMeasurements(player, 'fc-5') || {};
      return {
        routingBlockages: fc5.routingBlockages,
        pinBlocks: fc5.pinBlocks ?? fc5.routingBlockages ?? 0,
      };
    },
  },
};

/**
 * Check whether a student has completed prerequisite levels to run a sanity check on their design.
 *
 * @param {Object} player - Player state object from PlayerContext
 * @param {string} checkId - Sanity check identifier
 * @returns {{ canCertify: boolean, missingPrerequisites: Array<string>, status: string, reason: string, requirement: Object, designData: Object }}
 */
export function getStudentDesignForSanityCheck(player, checkId) {
  const req = SANITY_CHECK_REQUIREMENTS[checkId];
  if (!req) {
    return {
      canCertify: false,
      missingPrerequisites: [],
      status: ARTIFACT_STATUS.UNSUPPORTED_MODEL,
      reason: `Unknown sanity check identifier: ${checkId}`,
      requirement: null,
      designData: {},
    };
  }

  const levelProgress = player?.levelProgress || {};
  const missingPrerequisites = req.prerequisiteLevels.filter(
    (lvlId) => !levelProgress[lvlId]?.completed
  );

  if (missingPrerequisites.length > 0) {
    return {
      canCertify: false,
      missingPrerequisites,
      status: ARTIFACT_STATUS.MISSING_PREREQUISITE,
      reason: `Prerequisite design missing: Complete ${missingPrerequisites.join(', ')} to generate your layout geometry first.`,
      requirement: req,
      designData: {},
    };
  }

  // Student has completed all prerequisite levels! Extract real design state
  const designData = req.extractData(player);
  return {
    canCertify: true,
    missingPrerequisites: [],
    status: ARTIFACT_STATUS.READY,
    reason: 'Student design parameters verified and ready for sign-off evaluation.',
    requirement: req,
    designData,
  };
}
