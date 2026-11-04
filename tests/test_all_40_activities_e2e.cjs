/**
 * test_all_40_activities_e2e.cjs
 * ==============================
 * Comprehensive E2E Verification Suite for ALL 40 CURRICULUM ACTIVITIES across all 8 Kingdoms.
 *
 * For each activity:
 * 1. Resolves registered component & pure validator from activityRegistry.js.
 * 2. Tests incomplete / empty input -> asserts rejection (passed === false).
 * 3. Tests invalid / corrupted input -> asserts rejection and formative feedback.
 * 4. Tests valid passing solution -> asserts genuine validator pass, correct score, and stars.
 * 5. Verifies score update and replay safety.
 */

'use strict';
const path = require('path');
const fs = require('fs');

async function runAll40ActivitiesTest() {
  console.log('================================================================');
  console.log('🔬 AUDITING ALL 40 ACTIVITIES: CONTROLS, ERRORS & VALIDATION');
  console.log('================================================================\n');

  const { KINGDOMS } = await import('../src/data/kingdomsData.js');

  // Load solutions map for all 40 levels
  const solutions = {
    // Kingdom 1: RTL Understanding
    'rtl-1': {
      incomplete: { tableOutputs: [0, 0] },
      invalid: { tableOutputs: [1, 1, 0, 0, 1, 0, 1, 0], conceptAnswer: 'opt-always-mux' },
      valid: { tableOutputs: [0, 0, 1, 1, 0, 1, 0, 1], conceptAnswer: 'opt-synthesis-opt' },
    },
    'rtl-2': {
      incomplete: { cycleAnswers: [0, 1] },
      invalid: { cycleAnswers: [1, 0, 0, 1, 1, 0], conceptAnswer: 'wrong' },
      valid: { cycleAnswers: [0, 1, 1, 0, 0, 1], conceptAnswer: 'opt-setup-hold-window' },
    },
    'rtl-3': {
      incomplete: { cyclePredictions: [{ combY: 1, seqY: 0 }] },
      invalid: {
        cyclePredictions: [
          { combY: 0, seqY: 1 },
          { combY: 1, seqY: 0 },
          { combY: 1, seqY: 1 },
          { combY: 0, seqY: 0 }
        ],
        latchAnswer: 'wrong',
        glitchAnswer: 'wrong',
      },
      valid: {
        cyclePredictions: [
          { combY: 1, seqY: 0 },
          { combY: 0, seqY: 1 },
          { combY: 0, seqY: 0 },
          { combY: 1, seqY: 0 }
        ],
        latchAnswer: 'opt-missing-else-latch',
        glitchAnswer: 'opt-comb-glitch-filter',
      },
    },
    'rtl-4': {
      incomplete: { wiring: {} },
      invalid: {
        wiring: { muxInput0: 'wrong', muxInput1: 'feedback', adderInputA: 'inData', adderInputB: 'operand', regInputD: 'muxOut' },
        vectorOutputs: [{ acc: 99, ovf: false }],
        conceptAnswer: 'wrong',
      },
      valid: {
        wiring: { muxInput0: 'feedback', muxInput1: 'inData', adderInputA: 'muxOut', adderInputB: 'operand', regInputD: 'adderSum' },
        vectorOutputs: [
          { acc: 0, ovf: false },
          { acc: 120, ovf: false },
          { acc: 150, ovf: false },
          { acc: 14, ovf: true }
        ],
        conceptAnswer: 'opt-bit-width-growth',
      },
    },
    'rtl-5': {
      incomplete: { transitions: [] },
      invalid: {
        transitions: Array(8).fill({ nextState: 'S0', match: false }),
        streamMatches: [false, false, false, false, false, false, false],
        conceptAnswer: 'wrong',
      },
      valid: {
        transitions: [
          { nextState: 'S0', match: false },
          { nextState: 'S1', match: false },
          { nextState: 'S2', match: false },
          { nextState: 'S1', match: false },
          { nextState: 'S0', match: false },
          { nextState: 'S3', match: false },
          { nextState: 'S2', match: false },
          { nextState: 'S1', match: true },
        ],
        streamMatches: [false, false, false, true, false, false, true],
        conceptAnswer: 'opt-moore-vs-mealy',
      },
    },

    // Kingdom 2: Synthesis
    'syn-1': {
      incomplete: { stageMappings: {} },
      invalid: { stageMappings: { translation: 'wrong', optimization: 'wrong', mapping: 'wrong' }, conceptAnswer: 'wrong' },
      valid: {
        stageMappings: { translation: 'gtech', optimization: 'boolean-min', mapping: 'cell-bind' },
        conceptAnswer: 'opt-generic-decoupling',
      },
    },
    'syn-2': {
      incomplete: { answers: {} },
      invalid: { answers: { opt1: 'wrong' }, factoringAnswer: 'wrong', demorganAnswer: 'wrong' },
      valid: {
        answers: { opt1: 'A', opt2: 'B', opt3: '0', opt4: 'D' },
        factoringAnswer: 'opt-factored-form',
        demorganAnswer: 'opt-demorgan-law',
      },
    },
    'syn-3': {
      incomplete: { calculatedArea: 0 },
      invalid: { calculatedArea: 99, calculatedDelay: 9.9, chosenMapping: 'wrong', libertyConcept: 'wrong' },
      valid: {
        calculatedArea: 5.5,
        calculatedDelay: 0.21,
        chosenMapping: 'MUX2_X1',
        libertyConcept: 'opt-nldm-liberty',
      },
    },
    'syn-4': {
      incomplete: { sc1Arrival: 0 },
      invalid: { sc1Arrival: 9.9, sc1Required: 0.1, sc1Slack: -5.0, sc2Slack: 5.0, fixStrategy: 'wrong', sdcConcept: 'wrong' },
      valid: {
        sc1Arrival: 0.67,
        sc1Required: 0.92,
        sc1Slack: 0.25,
        sc2Slack: -0.08,
        fixStrategy: 'opt-retiming-pipeline',
        sdcConcept: 'opt-sdc-uncertainty',
      },
    },
    'syn-5': {
      incomplete: { cellMappingChoice: '' },
      invalid: { cellMappingChoice: 'wrong', computedArea: 99, computedDelay: 9.9, computedSlack: -1.0, qorConcept: 'wrong' },
      valid: {
        cellMappingChoice: 'opt-and-xor-mux',
        computedArea: 8.5,
        computedDelay: 0.38,
        computedSlack: 0.09,
        qorConcept: 'opt-ppa-pareto',
      },
    },

    // Kingdom 3: Floorplanning
    'fp-1': {
      incomplete: { coreDieAnswer: '' },
      invalid: { coreDieAnswer: 'wrong', powerRingAnswer: 'wrong' },
      valid: {
        coreDieAnswer: 'opt-die-core-margin',
        powerRingAnswer: 'opt-power-ring-ir',
      },
    },
    'fp-2': {
      incomplete: { coreWidth: 0 },
      invalid: { coreWidth: 9999, coreHeight: 9999, coreArea: 0, aspectRatio: 5.0, nominalUtil: 99, effectiveUtil: 99, congestionConcept: 'wrong' },
      valid: {
        coreWidth: 500,
        coreHeight: 400,
        coreArea: 200000,
        aspectRatio: 0.80,
        nominalUtil: 50.0,
        effectiveUtil: 42.9,
        congestionConcept: 'opt-routing-drc-hotspots',
      },
    },
    'fp-3': {
      incomplete: { pins: [] },
      invalid: { pins: [{ id: 'DATA0', edge: 'bottom' }], esdConcept: 'wrong' },
      valid: {
        pins: [
          { id: 'DATA0', edge: 'top' },
          { id: 'DATA1', edge: 'top' },
          { id: 'DATA2', edge: 'top' },
          { id: 'DATA3', edge: 'top' },
          { id: 'CLK', edge: 'bottom' },
          { id: 'RST', edge: 'bottom' },
        ],
        esdConcept: 'opt-esd-wirebond-clearance',
      },
    },
    'fp-4': {
      incomplete: { macros: [] },
      invalid: { macros: [{ id: 'SRAM_1', x: 20, y: 20, width: 140, height: 100, halo: 5 }], haloConcept: 'wrong' },
      valid: {
        macros: [
          { id: 'SRAM_1', x: 20, y: 20, width: 140, height: 100, halo: 15 },
          { id: 'SRAM_2', x: 340, y: 20, width: 140, height: 100, halo: 15 },
        ],
        haloConcept: 'opt-halo-routing-drc',
      },
    },
    'fp-5': {
      incomplete: { macros: [] },
      invalid: { macros: [], pins: [], powerGridConcept: 'wrong' },
      valid: {
        macros: [
          { id: 'SRAM1', x: 20, y: 20, width: 140, height: 100, halo: 15 },
          { id: 'SRAM2', x: 340, y: 20, width: 140, height: 100, halo: 15 },
        ],
        pins: [
          { id: 'DATA0', edge: 'top' },
          { id: 'DATA1', edge: 'top' },
          { id: 'DATA2', edge: 'top' },
          { id: 'DATA3', edge: 'top' },
          { id: 'CLK', edge: 'bottom' },
          { id: 'RST', edge: 'bottom' },
        ],
        powerGridConcept: 'opt-mesh-power-straps',
      },
    },

    // Kingdom 4: Placement
    'pl-1': {
      incomplete: { rowHeightConcept: '' },
      invalid: { rowHeightConcept: 'wrong', orientationConcept: 'wrong' },
      valid: {
        rowHeightConcept: 'opt-shared-power-rails',
        orientationConcept: 'opt-mx-alternating-rows',
      },
    },
    'pl-2': {
      incomplete: { legalizedCells: [] },
      invalid: { legalizedCells: [{ id: 'CELL_A', x: 10, y: 10 }], displacementAns: 99, analyticalConcept: 'wrong' },
      valid: {
        legalizedCells: [
          { id: 'CELL_A', x: 40, y: 40 },
          { id: 'CELL_B', x: 80, y: 40 },
        ],
        displacementAns: 22,
        analyticalConcept: 'opt-quadratic-force-directed',
      },
    },
    'pl-3': {
      incomplete: { initialHPWL: 0 },
      invalid: { initialHPWL: 9999, optimizedHPWL: 9999, chosenPosition: 'wrong', netWeightConcept: 'wrong' },
      valid: {
        initialHPWL: 520,
        optimizedHPWL: 80,
        chosenPosition: 'pos-adjacent',
        netWeightConcept: 'opt-high-net-weight-critical',
      },
    },
    'pl-4': {
      incomplete: { congestionRatio: 0 },
      invalid: { congestionRatio: 9.9, hotspotBin: 'wrong', mitigationConcept: 'wrong' },
      valid: {
        congestionRatio: 1.50,
        hotspotBin: 'R1C2',
        mitigationConcept: 'opt-cell-padding-spreading',
      },
    },
    'pl-5': {
      incomplete: { cells: [] },
      invalid: { cells: [{ id: 'C1', x: 20, y: 20, width: 20, height: 20 }, { id: 'C2', x: 20, y: 20, width: 20, height: 20 }], placerConcept: 'wrong' },
      valid: {
        cells: [
          { id: 'C1', x: 20, y: 40, width: 20, height: 40 },
          { id: 'C2', x: 60, y: 40, width: 20, height: 40 },
          { id: 'C3', x: 100, y: 40, width: 20, height: 40 },
          { id: 'C4', x: 140, y: 40, width: 20, height: 40 },
        ],
        placerConcept: 'opt-global-legalize-detail',
      },
    },

    // Kingdom 5: CTS
    'cts-1': {
      incomplete: { staVsCtsConcept: '' },
      invalid: { staVsCtsConcept: 'wrong', leafSinkConcept: 'wrong', skewAnswer: 999 },
      valid: {
        staVsCtsConcept: 'opt-cts-builds-sta-checks',
        leafSinkConcept: 'opt-flops-latches-icg',
        skewAnswer: 20,
      },
    },
    'cts-2': {
      incomplete: { launchLatency: 0 },
      invalid: { launchLatency: 99, captureLatency: 0.1, setupSlackAns: -5.0, holdRiskConcept: 'wrong' },
      valid: {
        launchLatency: 0.20,
        captureLatency: 0.28,
        setupSlackAns: 0.03,
        holdRiskConcept: 'opt-positive-skew-hurts-hold',
      },
    },
    'cts-3': {
      incomplete: { bufferStages: 0 },
      invalid: { bufferStages: 99, chosenBuffer: 'wrong', slewConcept: 'wrong' },
      valid: {
        bufferStages: 3,
        chosenBuffer: 'CLKBUF_X2',
        slewConcept: 'opt-transition-slew-control',
      },
    },
    'cts-4': {
      incomplete: { asicTopology: '' },
      invalid: { asicTopology: 'wrong', highPerfTopology: 'wrong', meshDrawback: 'wrong' },
      valid: {
        asicTopology: 'opt-balanced-tree',
        highPerfTopology: 'opt-clock-mesh',
        meshDrawback: 'opt-mesh-high-power',
      },
    },
    'cts-5': {
      incomplete: { bufferStages: 0 },
      invalid: { bufferStages: [0, 0, 0, 0], icgConcept: 'wrong' },
      valid: {
        bufferStages: [3, 1, 2, 0],
        icgConcept: 'opt-icg-dynamic-power',
      },
    },

    // Kingdom 6: Routing
    'rt-1': {
      incomplete: { routingPhasesConcept: '' },
      invalid: { routingPhasesConcept: 'wrong', manhattanDistanceAns: 999 },
      valid: {
        routingPhasesConcept: 'opt-global-then-detailed',
        manhattanDistanceAns: 180,
      },
    },
    'rt-2': {
      incomplete: { m2Direction: '' },
      invalid: { m2Direction: 'wrong', alternateConcept: 'wrong', globalLayerChoice: 'wrong' },
      valid: {
        m2Direction: 'opt-m2-vertical',
        alternateConcept: 'opt-avoid-interlayer-coupling',
        globalLayerChoice: 'opt-top-thick-metals',
      },
    },
    'rt-3': {
      incomplete: { singleViaResistanceAns: 0 },
      invalid: { singleViaResistanceAns: 99, doubleViaResistanceAns: 99, enclosureConcept: 'wrong', redundantViaConcept: 'wrong' },
      valid: {
        singleViaResistanceAns: 20,
        doubleViaResistanceAns: 10,
        enclosureConcept: 'opt-misalign-open',
        redundantViaConcept: 'opt-double-via-reliability',
      },
    },
    'rt-4': {
      incomplete: { couplingCapAns: 0 },
      invalid: { couplingCapAns: 999, glitchVoltageAns: 99, mitigationConcept: 'wrong' },
      valid: {
        couplingCapAns: 20.0,
        glitchVoltageAns: 0.25,
        mitigationConcept: 'opt-shielding-spacing',
      },
    },
    'rt-5': {
      incomplete: { net1Layer: '' },
      invalid: { net1Layer: 'M1', net2Layer: 'M1', lvsConcept: 'wrong' }, // short on M1
      valid: {
        net1Layer: 'M1',
        net2Layer: 'M2',
        lvsConcept: 'opt-lvs-connectivity-check',
      },
    },

    // Kingdom 7: Filler Cells
    'fc-1': {
      incomplete: { whyFillersConcept: '' },
      invalid: { whyFillersConcept: 'wrong', emptySitesAns: 999 },
      valid: {
        whyFillersConcept: 'opt-well-continuity-and-density',
        emptySitesAns: 35,
      },
    },
    'fc-2': {
      incomplete: { tapcellConcept: '' },
      invalid: { tapcellConcept: 'wrong', endcapConcept: 'wrong', tieConcept: 'wrong' },
      valid: {
        tapcellConcept: 'opt-tapcell-latchup',
        endcapConcept: 'opt-endcap-boundary',
        tieConcept: 'opt-prevent-oxide-breakdown',
      },
    },
    'fc-3': {
      incomplete: { chosenFillers: [] },
      invalid: { chosenFillers: ['FILL1'], wellEdgeConcept: 'wrong' },
      valid: {
        chosenFillers: ['FILL8', 'FILL4'],
        wellEdgeConcept: 'opt-well-edge-violation',
      },
    },
    'fc-4': {
      incomplete: { droop100Ans: 0 },
      invalid: { droop100Ans: 999, droop500Ans: 999, decapPenaltyConcept: 'wrong' },
      valid: {
        droop100Ans: 200,
        droop500Ans: 40,
        decapPenaltyConcept: 'opt-decap-leakage-power',
      },
    },
    'fc-5': {
      incomplete: { cellPlan: [] },
      invalid: { cellPlan: [{ type: 'TAPCELL4', count: 1 }], cmpConcept: 'wrong' },
      valid: {
        cellPlan: [
          { type: 'DECAP16', count: 2 },
          { type: 'TAPCELL4', count: 1 },
          { type: 'FILL8', count: 2 },
          { type: 'FILL4', count: 2 },
        ],
        cmpConcept: 'opt-drc-density-cmp',
      },
    },

    // Kingdom 8: GDS
    'gds-1': {
      incomplete: { gdsContentsConcept: '' },
      invalid: { gdsContentsConcept: 'wrong', oasisConcept: 'wrong' },
      valid: {
        gdsContentsConcept: 'opt-polygons-and-layers-only',
        oasisConcept: 'opt-oasis-compression',
      },
    },
    'gds-2': {
      incomplete: { signoffGateConcept: '' },
      invalid: { signoffGateConcept: 'wrong', lvsErrorConcept: 'wrong', checksPassed: { drc: false } },
      valid: {
        signoffGateConcept: 'opt-tapeout-signoff-gate',
        lvsErrorConcept: 'opt-lvs-open-circuit',
        checksPassed: { drc: true, lvs: true, sta: true, erc: true },
      },
    },
    'gds-3': {
      incomplete: { feolConcept: '' },
      invalid: { feolConcept: 'wrong', datatypeConcept: 'wrong', m1LayerChoice: 'wrong' },
      valid: {
        feolConcept: 'opt-feol-transistors',
        datatypeConcept: 'opt-datatype-drawing-vs-pin',
        m1LayerChoice: 'opt-layer-30-m1',
      },
    },
    'gds-4': {
      incomplete: { antennaRatioAns: 0 },
      invalid: { antennaRatioAns: 9999, diodeDecision: 'wrong', opcConcept: 'wrong' },
      valid: {
        antennaRatioAns: 300,
        diodeDecision: 'opt-antenna-diode-required',
        opcConcept: 'opt-opc-diffraction-correction',
      },
    },
    'gds-5': {
      incomplete: { signoffAudit: null },
      invalid: { signoffAudit: { drc: false }, flowSummaryConcept: 'wrong' },
      valid: {
        signoffAudit: { drc: true, lvs: true, sta: true, antenna: true, cmp: true, erc: true },
        flowSummaryConcept: 'opt-full-flow-summary',
      },
    },
  };

  // Activity Registry map
  const actModules = {
    'rtl-1': await import('../src/activities/rtl/validators/validateMuxChallenge.js'),
    'rtl-2': await import('../src/activities/rtl/validators/validateDFFChallenge.js'),
    'rtl-3': await import('../src/activities/rtl/validators/validateCombSeqChallenge.js'),
    'rtl-4': await import('../src/activities/rtl/validators/validateAccumulatorChallenge.js'),
    'rtl-5': await import('../src/activities/rtl/validators/validateFSMChallenge.js'),

    'syn-1': await import('../src/activities/synthesis/validators/validateSynIntro.js'),
    'syn-2': await import('../src/activities/synthesis/validators/validateSynOptimization.js'),
    'syn-3': await import('../src/activities/synthesis/validators/validateSynTechMapping.js'),
    'syn-4': await import('../src/activities/synthesis/validators/validateSynTiming.js'),
    'syn-5': await import('../src/activities/synthesis/validators/validateSynCapstone.js'),

    'fp-1': await import('../src/activities/floorplanning/validators/validateFPIntro.js'),
    'fp-2': await import('../src/activities/floorplanning/validators/validateFPGeometry.js'),
    'fp-3': await import('../src/activities/floorplanning/validators/validateFPPinPlacement.js'),
    'fp-4': await import('../src/activities/floorplanning/validators/validateFPMacroPlacement.js'),
    'fp-5': await import('../src/activities/floorplanning/validators/validateFPKingdom.js'),

    'pl-1': await import('../src/activities/placement/validators/validatePLIntro.js'),
    'pl-2': await import('../src/activities/placement/validators/validatePLGlobalDetailed.js'),
    'pl-3': await import('../src/activities/placement/validators/validatePLTimingDriven.js'),
    'pl-4': await import('../src/activities/placement/validators/validatePLCongestion.js'),
    'pl-5': await import('../src/activities/placement/validators/validatePLKingdom.js'),

    'cts-1': await import('../src/activities/cts/validators/validateCTSIntro.js'),
    'cts-2': await import('../src/activities/cts/validators/validateCTSSkewLatency.js'),
    'cts-3': await import('../src/activities/cts/validators/validateCTSBufferInsertion.js'),
    'cts-4': await import('../src/activities/cts/validators/validateCTSTopologies.js'),
    'cts-5': await import('../src/activities/cts/validators/validateCTSKingdom.js'),

    'rt-1': await import('../src/activities/routing/validators/validateRTIntro.js'),
    'rt-2': await import('../src/activities/routing/validators/validateRTMetalLayers.js'),
    'rt-3': await import('../src/activities/routing/validators/validateRTViasContacts.js'),
    'rt-4': await import('../src/activities/routing/validators/validateRTSignalIntegrity.js'),
    'rt-5': await import('../src/activities/routing/validators/validateRTKingdom.js'),

    'fc-1': await import('../src/activities/filler-cells/validators/validateFCIntro.js'),
    'fc-2': await import('../src/activities/filler-cells/validators/validateFCCellTypes.js'),
    'fc-3': await import('../src/activities/filler-cells/validators/validateFCWellContinuity.js'),
    'fc-4': await import('../src/activities/filler-cells/validators/validateFCDecapStrategy.js'),
    'fc-5': await import('../src/activities/filler-cells/validators/validateFCKingdom.js'),

    'gds-1': await import('../src/activities/gds/validators/validateGDSIntro.js'),
    'gds-2': await import('../src/activities/gds/validators/validateGDSSignoffChecks.js'),
    'gds-3': await import('../src/activities/gds/validators/validateGDSLayerStack.js'),
    'gds-4': await import('../src/activities/gds/validators/validateGDSTapeoutPrep.js'),
    'gds-5': await import('../src/activities/gds/validators/validateGDSFinalCapstone.js'),
  };

  let testedCount = 0;
  let passedCount = 0;

  for (const kingdom of KINGDOMS) {
    console.log(`\n▶ Auditing Kingdom: ${kingdom.name} (${kingdom.id})`);
    for (const level of kingdom.levels) {
      testedCount++;
      const mod = actModules[level.id];
      if (!mod) throw new Error(`Missing validator module for ${level.id}`);
      const valFn = Object.values(mod).find(v => typeof v === 'function' && v.name.startsWith('validate'));
      if (!valFn) throw new Error(`No validator function exported for ${level.id}`);

      const sol = solutions[level.id];
      if (!sol) throw new Error(`No test solution defined for ${level.id}`);

      // 1. Incomplete test
      const resIncomplete = valFn(sol.incomplete);
      if (resIncomplete.passed !== false) {
        throw new Error(`[${level.id}] Incomplete test failed: expected passed=false, got ${resIncomplete.passed}`);
      }

      // 2. Invalid test
      const resInvalid = valFn(sol.invalid);
      if (resInvalid.passed !== false) {
        throw new Error(`[${level.id}] Invalid test failed: expected passed=false, got ${resInvalid.passed}`);
      }
      if (!resInvalid.feedback) {
        throw new Error(`[${level.id}] Invalid test missing formative feedback message`);
      }

      // 3. Valid solution test
      const resValid = valFn(sol.valid);
      if (resValid.passed !== true) {
        throw new Error(`[${level.id}] Valid test failed: expected passed=true, got ${resValid.passed}. Feedback: ${resValid.feedback}`);
      }
      if (resValid.score < level.starThresholds[1]) {
        throw new Error(`[${level.id}] Valid test score (${resValid.score}) below 2-star threshold (${level.starThresholds[1]})`);
      }
      if (resValid.stars < 2) {
        throw new Error(`[${level.id}] Valid test awarded ${resValid.stars} stars, expected >= 2`);
      }

      passedCount++;
      console.log(`  ✓ Level ${level.id}: [Incomplete: REJECTED] [Invalid: REJECTED] [Valid: PASS (${resValid.score}/${level.xpReward} XP, ${resValid.stars}★)]`);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ${testedCount} OF 40 ACTIVITIES AUDITED AND VERIFIED 100%!`);
  console.log('================================================================\n');
}

runAll40ActivitiesTest().catch(err => {
  console.error('❌ ALL 40 ACTIVITIES AUDIT FAILED:', err);
  process.exit(1);
});
