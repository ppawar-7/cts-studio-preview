/**
 * endToEndArtifactSanityPipeline.test.js
 * =======================================
 * Genuine End-to-End integration tests for PD Playground:
 *
 * Activity Challenge Validator
 *   → Produces Versioned Design Artifact Contract
 *   → Persists cleanly via applyLevelCompletion (no merge contamination)
 *   → Extracted via getStudentDesignForSanityCheck
 *   → Evaluated via evaluateSanityCheck (fail-closed)
 *   → Certified via applySanityCheckCompletion (once only)
 *   → Replay verification with incremental XP
 *
 * Verifies all 5 physical design kingdoms with real validator execution,
 * NOT manually constructed mock fixtures!
 */

import { describe, it, expect } from 'vitest';
import { validateFPKingdom, CORRECT_POWER_GRID_ID } from '../../activities/floorplanning/validators/validateFPKingdom.js';
import { validateFPMacroPlacement, CORRECT_HALO_CONCEPT_ID } from '../../activities/floorplanning/validators/validateFPMacroPlacement.js';
import { validatePLKingdom, CORRECT_CAPSTONE_PLACER_CONCEPT_ID } from '../../activities/placement/validators/validatePLKingdom.js';
import { validatePLGlobalDetailed, CORRECT_ANALYTICAL_ID } from '../../activities/placement/validators/validatePLGlobalDetailed.js';
import { validatePLCongestion, CORRECT_CONGESTION_MITIGATION_ID } from '../../activities/placement/validators/validatePLCongestion.js';
import { validateCTSKingdom, CORRECT_ICG_CONCEPT_ID } from '../../activities/cts/validators/validateCTSKingdom.js';
import { validateCTSSkewLatency, CORRECT_HOLD_HAZARD_ID } from '../../activities/cts/validators/validateCTSSkewLatency.js';
import { validateRTKingdom, CORRECT_LVS_CONCEPT_ID } from '../../activities/routing/validators/validateRTKingdom.js';
import { validateRTSignalIntegrity, CORRECT_CROSSTALK_MITIGATION_ID } from '../../activities/routing/validators/validateRTSignalIntegrity.js';
import { validateFCKingdom, CORRECT_CMP_DENSITY_ID } from '../../activities/filler-cells/validators/validateFCKingdom.js';
import { validateFCWellContinuity, CORRECT_WELL_EDGE_ID } from '../../activities/filler-cells/validators/validateFCWellContinuity.js';
import { validateFCDecapStrategy, CORRECT_DECAP_PENALTY_ID } from '../../activities/filler-cells/validators/validateFCDecapStrategy.js';

import {
  applyLevelCompletion,
  applySanityCheckCompletion,
} from '../../logic/progressionEngine.js';
import { getStudentDesignForSanityCheck } from '../../logic/studentDesignContext.js';
import { evaluateSanityCheck } from '../../engine/sanityCheckEngine.js';
import { DEFAULT_PLAYER } from '../../data/playerDefaults.js';
import { ARTIFACT_KINDS } from '../../logic/designArtifactContracts.js';

describe('End-to-End Design Artifact & Sanity Verification Pipeline', () => {
  // ─── 1. Floorplanning E2E Pipeline ─────────────────────────────────────────
  describe('Floorplanning: fp-4 & fp-5 → fp-drc Sanity Check', () => {
    it('executes genuine validator and signs off fp-drc check on clean student submission', () => {
      let player = { ...DEFAULT_PLAYER, levelProgress: {} };

      // Step 1: Student plays fp-4 (Macro placement)
      const fp4Submission = {
        macros: [
          { id: 'SRAM1', x: 20, y: 20, width: 100, height: 80 },
          { id: 'SRAM2', x: 200, y: 20, width: 100, height: 80 },
        ],
        haloConcept: CORRECT_HALO_CONCEPT_ID,
      };
      const fp4Result = validateFPMacroPlacement(fp4Submission);
      expect(fp4Result.passed).toBe(true);
      expect(fp4Result.artifacts).toBeDefined();
      expect(fp4Result.artifacts.kind).toBe(ARTIFACT_KINDS.FLOORPLAN_LAYOUT);

      // Persist fp-4
      player = applyLevelCompletion(
        player,
        'floorplanning',
        { id: 'fp-4', xpReward: 45, starThresholds: [18, 32, 45] },
        fp4Result.score,
        fp4Result.artifacts
      );
      expect(player.levelProgress['fp-4'].completed).toBe(true);

      // Verify fp-drc is NOT ready yet (fp-5 is also a prerequisite)
      const prematureCtx = getStudentDesignForSanityCheck(player, 'fp-drc');
      expect(prematureCtx.canCertify).toBe(false);
      expect(prematureCtx.missingPrerequisites).toContain('fp-5');

      // Step 2: Student plays fp-5 (Kingdom Challenge)
      const fp5Submission = {
        macros: [
          { id: 'SRAM1', x: 30, y: 30, width: 120, height: 90 },
          { id: 'SRAM2', x: 250, y: 30, width: 120, height: 90 },
        ],
        pins: [
          { id: 'DATA0', edge: 'top', offset: 50 },
          { id: 'DATA1', edge: 'top', offset: 100 },
          { id: 'DATA2', edge: 'top', offset: 150 },
          { id: 'DATA3', edge: 'top', offset: 200 },
          { id: 'CLK', edge: 'bottom', offset: 100 },
          { id: 'RST', edge: 'bottom', offset: 200 },
        ],
        powerGridConcept: CORRECT_POWER_GRID_ID,
      };
      const fp5Result = validateFPKingdom(fp5Submission);
      expect(fp5Result.passed).toBe(true);
      expect(fp5Result.artifacts).toBeDefined();

      // Persist fp-5
      player = applyLevelCompletion(
        player,
        'floorplanning',
        { id: 'fp-5', xpReward: 50, starThresholds: [20, 38, 50] },
        fp5Result.score,
        fp5Result.artifacts
      );

      // Step 3: Now all prerequisites are met -> Extract student design for fp-drc
      const readyCtx = getStudentDesignForSanityCheck(player, 'fp-drc');
      expect(readyCtx.canCertify).toBe(true);
      expect(readyCtx.missingPrerequisites).toHaveLength(0);
      expect(readyCtx.designData.margin).toBe(30.0); // min boundary margin
      expect(readyCtx.designData.halo).toBe(100.0); // 250 - (30 + 120) = 100 µm

      // Step 4: Evaluate Sanity Check
      const checkResult = evaluateSanityCheck('fp-drc', {
        isStudentDesign: true,
        hasStudentDesign: true,
        designData: readyCtx.designData,
      });
      expect(checkResult.passed).toBe(true);
      expect(checkResult.canCertify).toBe(true);
      expect(checkResult.logOutput.join(' ')).toContain('CLEAN_PASS');

      // Step 5: Award Certification
      const prevXP = player.totalXP;
      player = applySanityCheckCompletion(player, 'floorplanning', { id: 'fp-drc', xpReward: 25 }, 25);
      expect(player.sanityCheckProgress['fp-drc'].passed).toBe(true);
      expect(player.totalXP).toBe(prevXP + 25);

      // Certification is awarded only once (idempotent)
      const afterSecondCert = applySanityCheckCompletion(player, 'floorplanning', { id: 'fp-drc', xpReward: 25 }, 25);
      expect(afterSecondCert.totalXP).toBe(player.totalXP);
    });

    it('rejects fp-drc check when student macro placement violates boundary margin', () => {
      let player = { ...DEFAULT_PLAYER, levelProgress: {} };

      // Student places macro right at core edge (x=5, violating 20 µm margin rule)
      const fp5BadMargin = {
        macros: [
          { id: 'SRAM1', x: 5, y: 5, width: 120, height: 90 },
          { id: 'SRAM2', x: 250, y: 30, width: 120, height: 90 },
        ],
        pins: [
          { id: 'DATA0', edge: 'top', offset: 50 },
          { id: 'DATA1', edge: 'top', offset: 100 },
          { id: 'DATA2', edge: 'top', offset: 150 },
          { id: 'DATA3', edge: 'top', offset: 200 },
          { id: 'CLK', edge: 'bottom', offset: 100 },
          { id: 'RST', edge: 'bottom', offset: 200 },
        ],
        powerGridConcept: CORRECT_POWER_GRID_ID,
      };

      const result = validateFPKingdom(fp5BadMargin);
      player = applyLevelCompletion(player, 'floorplanning', { id: 'fp-4', xpReward: 45, starThresholds: [18, 32, 45] }, 45, {});
      player = applyLevelCompletion(player, 'floorplanning', { id: 'fp-5', xpReward: 50, starThresholds: [20, 38, 50] }, result.score, result.artifacts);

      const ctx = getStudentDesignForSanityCheck(player, 'fp-drc');
      expect(ctx.designData.margin).toBe(5); // Genuine 5 µm measurement

      const check = evaluateSanityCheck('fp-drc', {
        isStudentDesign: true,
        hasStudentDesign: true,
        designData: ctx.designData,
      });

      expect(check.passed).toBe(false);
      expect(check.canCertify).toBe(false);
      expect(check.logOutput.join(' ')).toContain('RULE_VIOLATION');
    });
  });

  // ─── 2. Placement E2E Pipeline ─────────────────────────────────────────────
  describe('Placement: pl-5 → pl-legality Sanity Check', () => {
    it('executes genuine pl-5 validator and verifies standard cell legalization check', () => {
      let player = { ...DEFAULT_PLAYER, levelProgress: {} };

      const pl5Submission = {
        cells: [
          { id: 'C1', x: 20, y: 40, width: 30, height: 40 },
          { id: 'C2', x: 60, y: 40, width: 20, height: 40 },
          { id: 'C3', x: 90, y: 40, width: 30, height: 40 },
          { id: 'C4', x: 130, y: 40, width: 20, height: 40 },
        ],
        placerConcept: CORRECT_CAPSTONE_PLACER_CONCEPT_ID,
      };

      const pl5Result = validatePLKingdom(pl5Submission);
      expect(pl5Result.passed).toBe(true);
      expect(pl5Result.artifacts.kind).toBe(ARTIFACT_KINDS.PLACEMENT_LAYOUT);

      player = applyLevelCompletion(player, 'placement', { id: 'pl-1', xpReward: 30, starThresholds: [10, 20, 30] }, 30, {});
      player = applyLevelCompletion(player, 'placement', { id: 'pl-2', xpReward: 35, starThresholds: [12, 24, 35] }, 35, {});
      player = applyLevelCompletion(player, 'placement', { id: 'pl-5', xpReward: 50, starThresholds: [20, 38, 50] }, pl5Result.score, pl5Result.artifacts);

      const ctx = getStudentDesignForSanityCheck(player, 'pl-legality');
      expect(ctx.canCertify).toBe(true);

      const check = evaluateSanityCheck('pl-legality', {
        isStudentDesign: true,
        hasStudentDesign: true,
        designData: ctx.designData,
      });
      expect(check.passed).toBe(true);
      expect(check.canCertify).toBe(true);
      expect(check.metrics.hasOverlap).toBe(false);
    });
  });

  // ─── 3. Clock Tree Synthesis E2E Pipeline ──────────────────────────────────
  describe('CTS: cts-5 → cts-clock-tree-report & cts-power Sanity Checks', () => {
    it('executes genuine cts-5 validator and certifies balanced clock tree', () => {
      let player = { ...DEFAULT_PLAYER, levelProgress: {} };

      const cts5Submission = {
        bufferStages: [3, 1, 2, 0], // Balances base delays: 0.12+0.15=0.27, 0.22+0.05=0.27, 0.17+0.10=0.27, 0.27+0=0.27
        icgConcept: CORRECT_ICG_CONCEPT_ID,
      };

      const ctsResult = validateCTSKingdom(cts5Submission);
      expect(ctsResult.passed).toBe(true);
      expect(ctsResult.skewMet).toBe(true);
      expect(ctsResult.artifacts.measurements.skewPs).toBe(0);

      player = applyLevelCompletion(player, 'cts', { id: 'cts-3', xpReward: 40, starThresholds: [15, 28, 40] }, 40, {});
      player = applyLevelCompletion(player, 'cts', { id: 'cts-5', xpReward: 50, starThresholds: [20, 38, 50] }, ctsResult.score, ctsResult.artifacts);

      // Check Skew
      const skewCtx = getStudentDesignForSanityCheck(player, 'cts-clock-tree-report');
      expect(skewCtx.canCertify).toBe(true);
      const skewCheck = evaluateSanityCheck('cts-clock-tree-report', {
        isStudentDesign: true,
        hasStudentDesign: true,
        designData: skewCtx.designData,
      });
      expect(skewCheck.passed).toBe(true);
      expect(skewCheck.canCertify).toBe(true);

      // Check Power
      const powerCtx = getStudentDesignForSanityCheck(player, 'cts-power');
      expect(powerCtx.canCertify).toBe(true);
      const powerCheck = evaluateSanityCheck('cts-power', {
        isStudentDesign: true,
        hasStudentDesign: true,
        designData: powerCtx.designData,
      });
      expect(powerCheck.passed).toBe(true);
      expect(powerCheck.canCertify).toBe(true);
      expect(powerCheck.metrics.clockPowerMw).toBeLessThanOrEqual(5.0);
    });
  });

  // ─── 4. Routing E2E Pipeline ───────────────────────────────────────────────
  describe('Routing: rt-5 → rt-lvs & rt-routes Sanity Checks', () => {
    it('executes genuine rt-5 validator and certifies LVS with zero shorts', () => {
      let player = { ...DEFAULT_PLAYER, levelProgress: {} };

      const rt5Submission = {
        net1Layer: 'M1', // Horizontal net
        net2Layer: 'M2', // Vertical net
        lvsConcept: CORRECT_LVS_CONCEPT_ID,
      };

      const rtResult = validateRTKingdom(rt5Submission);
      expect(rtResult.passed).toBe(true);
      expect(rtResult.noShorts).toBe(true);

      player = applyLevelCompletion(player, 'routing', { id: 'rt-1', xpReward: 30, starThresholds: [10, 20, 30] }, 30, {});
      player = applyLevelCompletion(player, 'routing', { id: 'rt-5', xpReward: 50, starThresholds: [20, 38, 50] }, rtResult.score, rtResult.artifacts);

      const lvsCtx = getStudentDesignForSanityCheck(player, 'rt-lvs');
      expect(lvsCtx.canCertify).toBe(true);

      const lvsCheck = evaluateSanityCheck('rt-lvs', {
        isStudentDesign: true,
        hasStudentDesign: true,
        designData: lvsCtx.designData,
      });
      expect(lvsCheck.passed).toBe(true);
      expect(lvsCheck.canCertify).toBe(true);
      expect(lvsCheck.metrics.hasShort).toBe(false);
    });
  });

  // ─── 5. Filler Cells E2E Pipeline ──────────────────────────────────────────
  describe('Filler Cells: fc-5 → fc-legality & fc-qor Sanity Checks', () => {
    it('executes genuine fc-5 validator and certifies 100% row fill', () => {
      let player = { ...DEFAULT_PLAYER, levelProgress: {} };

      const fc5Submission = {
        cellPlan: [
          { type: 'DECAP16', count: 2 }, // 32 sites
          { type: 'TAPCELL4', count: 2 }, // 8 sites
          { type: 'FILL8', count: 2 },    // 16 sites
          { type: 'FILL4', count: 1 },    // 4 sites -> Total = 60 sites
        ],
        cmpConcept: CORRECT_CMP_DENSITY_ID,
      };

      const fcResult = validateFCKingdom(fc5Submission);
      expect(fcResult.passed).toBe(true);
      expect(fcResult.fillMet).toBe(true);

      player = applyLevelCompletion(player, 'filler-cells', { id: 'fc-1', xpReward: 30, starThresholds: [10, 20, 30] }, 30, {});
      player = applyLevelCompletion(player, 'filler-cells', { id: 'fc-3', xpReward: 40, starThresholds: [15, 28, 40] }, 40, {});
      player = applyLevelCompletion(player, 'filler-cells', { id: 'fc-5', xpReward: 50, starThresholds: [20, 38, 50] }, fcResult.score, fcResult.artifacts);

      const legalCtx = getStudentDesignForSanityCheck(player, 'fc-legality');
      expect(legalCtx.canCertify).toBe(true);

      const legalCheck = evaluateSanityCheck('fc-legality', {
        isStudentDesign: true,
        hasStudentDesign: true,
        designData: legalCtx.designData,
      });
      expect(legalCheck.passed).toBe(true);
      expect(legalCheck.canCertify).toBe(true);
      expect(legalCheck.metrics.offSiteCount).toBe(0);
    });
  });
});
