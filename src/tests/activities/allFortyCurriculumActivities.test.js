/**
 * allFortyCurriculumActivities.test.js
 * ====================================
 * Vitest automated test asserting mastery gates, rejection of invalid/incomplete
 * submissions, and passing verification for all 40 curriculum activities across 8 kingdoms.
 */

import { describe, it, expect } from 'vitest';
import { KINGDOMS } from '../../data/kingdomsData.js';

// Import all 40 validator modules
import * as rtl1 from '../../activities/rtl/validators/validateMuxChallenge.js';
import * as rtl2 from '../../activities/rtl/validators/validateDFFChallenge.js';
import * as rtl3 from '../../activities/rtl/validators/validateCombSeqChallenge.js';
import * as rtl4 from '../../activities/rtl/validators/validateAccumulatorChallenge.js';
import * as rtl5 from '../../activities/rtl/validators/validateFSMChallenge.js';

import * as syn1 from '../../activities/synthesis/validators/validateSynIntro.js';
import * as syn2 from '../../activities/synthesis/validators/validateSynOptimization.js';
import * as syn3 from '../../activities/synthesis/validators/validateSynTechMapping.js';
import * as syn4 from '../../activities/synthesis/validators/validateSynTiming.js';
import * as syn5 from '../../activities/synthesis/validators/validateSynCapstone.js';

import * as fp1 from '../../activities/floorplanning/validators/validateFPIntro.js';
import * as fp2 from '../../activities/floorplanning/validators/validateFPGeometry.js';
import * as fp3 from '../../activities/floorplanning/validators/validateFPPinPlacement.js';
import * as fp4 from '../../activities/floorplanning/validators/validateFPMacroPlacement.js';
import * as fp5 from '../../activities/floorplanning/validators/validateFPKingdom.js';

import * as pl1 from '../../activities/placement/validators/validatePLIntro.js';
import * as pl2 from '../../activities/placement/validators/validatePLGlobalDetailed.js';
import * as pl3 from '../../activities/placement/validators/validatePLTimingDriven.js';
import * as pl4 from '../../activities/placement/validators/validatePLCongestion.js';
import * as pl5 from '../../activities/placement/validators/validatePLKingdom.js';

import * as cts1 from '../../activities/cts/validators/validateCTSIntro.js';
import * as cts2 from '../../activities/cts/validators/validateCTSSkewLatency.js';
import * as cts3 from '../../activities/cts/validators/validateCTSBufferInsertion.js';
import * as cts4 from '../../activities/cts/validators/validateCTSTopologies.js';
import * as cts5 from '../../activities/cts/validators/validateCTSKingdom.js';

import * as rt1 from '../../activities/routing/validators/validateRTIntro.js';
import * as rt2 from '../../activities/routing/validators/validateRTMetalLayers.js';
import * as rt3 from '../../activities/routing/validators/validateRTViasContacts.js';
import * as rt4 from '../../activities/routing/validators/validateRTSignalIntegrity.js';
import * as rt5 from '../../activities/routing/validators/validateRTKingdom.js';

import * as fc1 from '../../activities/filler-cells/validators/validateFCIntro.js';
import * as fc2 from '../../activities/filler-cells/validators/validateFCCellTypes.js';
import * as fc3 from '../../activities/filler-cells/validators/validateFCWellContinuity.js';
import * as fc4 from '../../activities/filler-cells/validators/validateFCDecapStrategy.js';
import * as fc5 from '../../activities/filler-cells/validators/validateFCKingdom.js';

import * as gds1 from '../../activities/gds/validators/validateGDSIntro.js';
import * as gds2 from '../../activities/gds/validators/validateGDSSignoffChecks.js';
import * as gds3 from '../../activities/gds/validators/validateGDSLayerStack.js';
import * as gds4 from '../../activities/gds/validators/validateGDSTapeoutPrep.js';
import * as gds5 from '../../activities/gds/validators/validateGDSFinalCapstone.js';

const actModules = {
  'rtl-1': rtl1, 'rtl-2': rtl2, 'rtl-3': rtl3, 'rtl-4': rtl4, 'rtl-5': rtl5,
  'syn-1': syn1, 'syn-2': syn2, 'syn-3': syn3, 'syn-4': syn4, 'syn-5': syn5,
  'fp-1': fp1, 'fp-2': fp2, 'fp-3': fp3, 'fp-4': fp4, 'fp-5': fp5,
  'pl-1': pl1, 'pl-2': pl2, 'pl-3': pl3, 'pl-4': pl4, 'pl-5': pl5,
  'cts-1': cts1, 'cts-2': cts2, 'cts-3': cts3, 'cts-4': cts4, 'cts-5': cts5,
  'rt-1': rt1, 'rt-2': rt2, 'rt-3': rt3, 'rt-4': rt4, 'rt-5': rt5,
  'fc-1': fc1, 'fc-2': fc2, 'fc-3': fc3, 'fc-4': fc4, 'fc-5': fc5,
  'gds-1': gds1, 'gds-2': gds2, 'gds-3': gds3, 'gds-4': gds4, 'gds-5': gds5,
};

const solutions = {
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
    invalid: { cyclePredictions: [{ combY: 0, seqY: 1 }, { combY: 1, seqY: 0 }, { combY: 1, seqY: 1 }, { combY: 0, seqY: 0 }], latchAnswer: 'wrong', glitchAnswer: 'wrong' },
    valid: { cyclePredictions: [{ combY: 1, seqY: 0 }, { combY: 0, seqY: 1 }, { combY: 0, seqY: 0 }, { combY: 1, seqY: 0 }], latchAnswer: 'opt-missing-else-latch', glitchAnswer: 'opt-comb-glitch-filter' },
  },
  'rtl-4': {
    incomplete: { wiring: {} },
    invalid: { wiring: { muxInput0: 'wrong', muxInput1: 'feedback', adderInputA: 'inData', adderInputB: 'operand', regInputD: 'muxOut' }, vectorOutputs: [{ acc: 99, ovf: false }], conceptAnswer: 'wrong' },
    valid: { wiring: { muxInput0: 'feedback', muxInput1: 'inData', adderInputA: 'muxOut', adderInputB: 'operand', regInputD: 'adderSum' }, vectorOutputs: [{ acc: 0, ovf: false }, { acc: 120, ovf: false }, { acc: 150, ovf: false }, { acc: 14, ovf: true }], conceptAnswer: 'opt-bit-width-growth' },
  },
  'rtl-5': {
    incomplete: { transitions: [] },
    invalid: { transitions: Array(8).fill({ nextState: 'S0', match: false }), streamMatches: [false, false, false, false, false, false, false], conceptAnswer: 'wrong' },
    valid: { transitions: [{ nextState: 'S0', match: false }, { nextState: 'S1', match: false }, { nextState: 'S2', match: false }, { nextState: 'S1', match: false }, { nextState: 'S0', match: false }, { nextState: 'S3', match: false }, { nextState: 'S2', match: false }, { nextState: 'S1', match: true }], streamMatches: [false, false, false, true, false, false, true], conceptAnswer: 'opt-moore-vs-mealy' },
  },
  'syn-1': {
    incomplete: { stageMappings: {} },
    invalid: { stageMappings: { translation: 'wrong', optimization: 'wrong', mapping: 'wrong' }, conceptAnswer: 'wrong' },
    valid: { stageMappings: { translation: 'gtech', optimization: 'boolean-min', mapping: 'cell-bind' }, conceptAnswer: 'opt-generic-decoupling' },
  },
  'syn-2': {
    incomplete: { answers: {} },
    invalid: { answers: { opt1: 'wrong' }, factoringAnswer: 'wrong', demorganAnswer: 'wrong' },
    valid: { answers: { opt1: 'A', opt2: 'B', opt3: '0', opt4: 'D' }, factoringAnswer: 'opt-factored-form', demorganAnswer: 'opt-demorgan-law' },
  },
  'syn-3': {
    incomplete: { calculatedArea: 0 },
    invalid: { calculatedArea: 99, calculatedDelay: 9.9, chosenMapping: 'wrong', libertyConcept: 'wrong' },
    valid: { calculatedArea: 5.5, calculatedDelay: 0.21, chosenMapping: 'MUX2_X1', libertyConcept: 'opt-nldm-liberty' },
  },
  'syn-4': {
    incomplete: { sc1Arrival: 0 },
    invalid: { sc1Arrival: 9.9, sc1Required: 0.1, sc1Slack: -5.0, sc2Slack: 5.0, fixStrategy: 'wrong', sdcConcept: 'wrong' },
    valid: { sc1Arrival: 0.67, sc1Required: 0.92, sc1Slack: 0.25, sc2Slack: -0.08, fixStrategy: 'opt-retiming-pipeline', sdcConcept: 'opt-sdc-uncertainty' },
  },
  'syn-5': {
    incomplete: { cellMappingChoice: '' },
    invalid: { cellMappingChoice: 'wrong', computedArea: 99, computedDelay: 9.9, computedSlack: -1.0, qorConcept: 'wrong' },
    valid: { cellMappingChoice: 'opt-and-xor-mux', computedArea: 8.5, computedDelay: 0.38, computedSlack: 0.09, qorConcept: 'opt-ppa-pareto' },
  },
  'fp-1': {
    incomplete: { coreDieAnswer: '' },
    invalid: { coreDieAnswer: 'wrong', powerRingAnswer: 'wrong' },
    valid: { coreDieAnswer: 'opt-die-core-margin', powerRingAnswer: 'opt-power-ring-ir' },
  },
  'fp-2': {
    incomplete: { coreWidth: 0 },
    invalid: { coreWidth: 9999, coreHeight: 9999, coreArea: 0, aspectRatio: 5.0, nominalUtil: 99, effectiveUtil: 99, congestionConcept: 'wrong' },
    valid: { coreWidth: 500, coreHeight: 400, coreArea: 200000, aspectRatio: 0.80, nominalUtil: 50.0, effectiveUtil: 42.9, congestionConcept: 'opt-routing-drc-hotspots' },
  },
  'fp-3': {
    incomplete: { pins: [] },
    invalid: { pins: [{ id: 'DATA0', edge: 'bottom' }], esdConcept: 'wrong' },
    valid: { pins: [{ id: 'DATA0', edge: 'top' }, { id: 'DATA1', edge: 'top' }, { id: 'DATA2', edge: 'top' }, { id: 'DATA3', edge: 'top' }, { id: 'CLK', edge: 'bottom' }, { id: 'RST', edge: 'bottom' }], esdConcept: 'opt-esd-wirebond-clearance' },
  },
  'fp-4': {
    incomplete: { macros: [] },
    invalid: { macros: [{ id: 'SRAM_1', x: 20, y: 20, width: 140, height: 100, halo: 5 }], haloConcept: 'wrong' },
    valid: { macros: [{ id: 'SRAM_1', x: 20, y: 20, width: 140, height: 100, halo: 15 }, { id: 'SRAM_2', x: 340, y: 20, width: 140, height: 100, halo: 15 }], haloConcept: 'opt-halo-routing-drc' },
  },
  'fp-5': {
    incomplete: { macros: [] },
    invalid: { macros: [], pins: [], powerGridConcept: 'wrong' },
    valid: { macros: [{ id: 'SRAM1', x: 20, y: 20, width: 140, height: 100, halo: 15 }, { id: 'SRAM2', x: 340, y: 20, width: 140, height: 100, halo: 15 }], pins: [{ id: 'DATA0', edge: 'top' }, { id: 'DATA1', edge: 'top' }, { id: 'DATA2', edge: 'top' }, { id: 'DATA3', edge: 'top' }, { id: 'CLK', edge: 'bottom' }, { id: 'RST', edge: 'bottom' }], powerGridConcept: 'opt-mesh-power-straps' },
  },
  'pl-1': {
    incomplete: { rowHeightConcept: '' },
    invalid: { rowHeightConcept: 'wrong', orientationConcept: 'wrong' },
    valid: { rowHeightConcept: 'opt-shared-power-rails', orientationConcept: 'opt-mx-alternating-rows' },
  },
  'pl-2': {
    incomplete: { legalizedCells: [] },
    invalid: { legalizedCells: [{ id: 'CELL_A', x: 10, y: 10 }], displacementAns: 99, analyticalConcept: 'wrong' },
    valid: { legalizedCells: [{ id: 'CELL_A', x: 40, y: 40 }, { id: 'CELL_B', x: 80, y: 40 }], displacementAns: 22, analyticalConcept: 'opt-quadratic-force-directed' },
  },
  'pl-3': {
    incomplete: { initialHPWL: 0 },
    invalid: { initialHPWL: 9999, optimizedHPWL: 9999, chosenPosition: 'wrong', netWeightConcept: 'wrong' },
    valid: { initialHPWL: 520, optimizedHPWL: 80, chosenPosition: 'pos-adjacent', netWeightConcept: 'opt-high-net-weight-critical' },
  },
  'pl-4': {
    incomplete: { congestionRatio: 0 },
    invalid: { congestionRatio: 9.9, hotspotBin: 'wrong', mitigationConcept: 'wrong' },
    valid: { congestionRatio: 1.50, hotspotBin: 'R1C2', mitigationConcept: 'opt-cell-padding-spreading' },
  },
  'pl-5': {
    incomplete: { cells: [] },
    invalid: { cells: [{ id: 'C1', x: 20, y: 20, width: 20, height: 20 }, { id: 'C2', x: 20, y: 20, width: 20, height: 20 }], placerConcept: 'wrong' },
    valid: { cells: [{ id: 'C1', x: 20, y: 40, width: 20, height: 40 }, { id: 'C2', x: 60, y: 40, width: 20, height: 40 }, { id: 'C3', x: 100, y: 40, width: 20, height: 40 }, { id: 'C4', x: 140, y: 40, width: 20, height: 40 }], placerConcept: 'opt-global-legalize-detail' },
  },
  'cts-1': {
    incomplete: { staVsCtsConcept: '' },
    invalid: { staVsCtsConcept: 'wrong', leafSinkConcept: 'wrong', skewAnswer: 999 },
    valid: { staVsCtsConcept: 'opt-cts-builds-sta-checks', leafSinkConcept: 'opt-flops-latches-icg', skewAnswer: 20 },
  },
  'cts-2': {
    incomplete: { launchLatency: 0 },
    invalid: { launchLatency: 99, captureLatency: 0.1, setupSlackAns: -5.0, holdRiskConcept: 'wrong' },
    valid: { launchLatency: 0.20, captureLatency: 0.28, setupSlackAns: 0.03, holdRiskConcept: 'opt-positive-skew-hurts-hold' },
  },
  'cts-3': {
    incomplete: { bufferStages: 0 },
    invalid: { bufferStages: 99, chosenBuffer: 'wrong', slewConcept: 'wrong' },
    valid: { bufferStages: 3, chosenBuffer: 'CLKBUF_X2', slewConcept: 'opt-transition-slew-control' },
  },
  'cts-4': {
    incomplete: { asicTopology: '' },
    invalid: { asicTopology: 'wrong', highPerfTopology: 'wrong', meshDrawback: 'wrong' },
    valid: { asicTopology: 'opt-balanced-tree', highPerfTopology: 'opt-clock-mesh', meshDrawback: 'opt-mesh-high-power' },
  },
  'cts-5': {
    incomplete: { bufferStages: 0 },
    invalid: { bufferStages: [0, 0, 0, 0], icgConcept: 'wrong' },
    valid: { bufferStages: [3, 1, 2, 0], icgConcept: 'opt-icg-dynamic-power' },
  },
  'rt-1': {
    incomplete: { routingPhasesConcept: '' },
    invalid: { routingPhasesConcept: 'wrong', manhattanDistanceAns: 999 },
    valid: { routingPhasesConcept: 'opt-global-then-detailed', manhattanDistanceAns: 180 },
  },
  'rt-2': {
    incomplete: { m2Direction: '' },
    invalid: { m2Direction: 'wrong', alternateConcept: 'wrong', globalLayerChoice: 'wrong' },
    valid: { m2Direction: 'opt-m2-vertical', alternateConcept: 'opt-avoid-interlayer-coupling', globalLayerChoice: 'opt-top-thick-metals' },
  },
  'rt-3': {
    incomplete: { singleViaResistanceAns: 0 },
    invalid: { singleViaResistanceAns: 99, doubleViaResistanceAns: 99, enclosureConcept: 'wrong', redundantViaConcept: 'wrong' },
    valid: { singleViaResistanceAns: 20, doubleViaResistanceAns: 10, enclosureConcept: 'opt-misalign-open', redundantViaConcept: 'opt-double-via-reliability' },
  },
  'rt-4': {
    incomplete: { couplingCapAns: 0 },
    invalid: { couplingCapAns: 999, glitchVoltageAns: 99, mitigationConcept: 'wrong' },
    valid: { couplingCapAns: 20.0, glitchVoltageAns: 0.25, mitigationConcept: 'opt-shielding-spacing' },
  },
  'rt-5': {
    incomplete: { net1Layer: '' },
    invalid: { net1Layer: 'M1', net2Layer: 'M1', lvsConcept: 'wrong' },
    valid: { net1Layer: 'M1', net2Layer: 'M2', lvsConcept: 'opt-lvs-connectivity-check' },
  },
  'fc-1': {
    incomplete: { whyFillersConcept: '' },
    invalid: { whyFillersConcept: 'wrong', emptySitesAns: 999 },
    valid: { whyFillersConcept: 'opt-well-continuity-and-density', emptySitesAns: 35 },
  },
  'fc-2': {
    incomplete: { tapcellConcept: '' },
    invalid: { tapcellConcept: 'wrong', endcapConcept: 'wrong', tieConcept: 'wrong' },
    valid: { tapcellConcept: 'opt-tapcell-latchup', endcapConcept: 'opt-endcap-boundary', tieConcept: 'opt-prevent-oxide-breakdown' },
  },
  'fc-3': {
    incomplete: { chosenFillers: [] },
    invalid: { chosenFillers: ['FILL1'], wellEdgeConcept: 'wrong' },
    valid: { chosenFillers: ['FILL8', 'FILL4'], wellEdgeConcept: 'opt-well-edge-violation' },
  },
  'fc-4': {
    incomplete: { droop100Ans: 0 },
    invalid: { droop100Ans: 999, droop500Ans: 999, decapPenaltyConcept: 'wrong' },
    valid: { droop100Ans: 200, droop500Ans: 40, decapPenaltyConcept: 'opt-decap-leakage-power' },
  },
  'fc-5': {
    incomplete: { cellPlan: [] },
    invalid: { cellPlan: [{ type: 'TAPCELL4', count: 1 }], cmpConcept: 'wrong' },
    valid: { cellPlan: [{ type: 'DECAP16', count: 2 }, { type: 'TAPCELL4', count: 1 }, { type: 'FILL8', count: 2 }, { type: 'FILL4', count: 2 }], cmpConcept: 'opt-drc-density-cmp' },
  },
  'gds-1': {
    incomplete: { gdsContentsConcept: '' },
    invalid: { gdsContentsConcept: 'wrong', oasisConcept: 'wrong' },
    valid: { gdsContentsConcept: 'opt-polygons-and-layers-only', oasisConcept: 'opt-oasis-compression' },
  },
  'gds-2': {
    incomplete: { signoffGateConcept: '' },
    invalid: { signoffGateConcept: 'wrong', lvsErrorConcept: 'wrong', checksPassed: { drc: false } },
    valid: { signoffGateConcept: 'opt-tapeout-signoff-gate', lvsErrorConcept: 'opt-lvs-open-circuit', checksPassed: { drc: true, lvs: true, sta: true, erc: true } },
  },
  'gds-3': {
    incomplete: { feolConcept: '' },
    invalid: { feolConcept: 'wrong', datatypeConcept: 'wrong', m1LayerChoice: 'wrong' },
    valid: { feolConcept: 'opt-feol-transistors', datatypeConcept: 'opt-datatype-drawing-vs-pin', m1LayerChoice: 'opt-layer-30-m1' },
  },
  'gds-4': {
    incomplete: { antennaRatioAns: 0 },
    invalid: { antennaRatioAns: 9999, diodeDecision: 'wrong', opcConcept: 'wrong' },
    valid: { antennaRatioAns: 300, diodeDecision: 'opt-antenna-diode-required', opcConcept: 'opt-opc-diffraction-correction' },
  },
  'gds-5': {
    incomplete: { signoffAudit: null },
    invalid: { signoffAudit: { drc: false }, flowSummaryConcept: 'wrong' },
    valid: { signoffAudit: { drc: true, lvs: true, sta: true, antenna: true, cmp: true, erc: true }, flowSummaryConcept: 'opt-full-flow-summary' },
  },
};

describe('Comprehensive All 40 Curriculum Activities Suite', () => {
  for (const kingdom of KINGDOMS) {
    describe(`Kingdom: ${kingdom.name} (${kingdom.id})`, () => {
      for (const level of kingdom.levels) {
        describe(`Level: ${level.id} (${level.title})`, () => {
          const mod = actModules[level.id];
          const valFn = Object.values(mod).find(
            (v) => typeof v === 'function' && v.name.startsWith('validate')
          );
          const sol = solutions[level.id];

          it('should reject incomplete submissions without awarding credit', () => {
            const res = valFn(sol.incomplete);
            expect(res.passed).toBe(false);
          });

          it('should reject invalid solutions and emit informative feedback', () => {
            const res = valFn(sol.invalid);
            expect(res.passed).toBe(false);
            expect(res.feedback).toBeTruthy();
          });

          it('should verify passing solution meeting 2-star progression threshold', () => {
            const res = valFn(sol.valid);
            expect(res.passed).toBe(true);
            expect(res.score).toBeGreaterThanOrEqual(level.starThresholds[1]);
            expect(res.stars).toBeGreaterThanOrEqual(2);
            expect(res.score).toBeLessThanOrEqual(level.xpReward);
          });
        });
      }
    });
  }
});
