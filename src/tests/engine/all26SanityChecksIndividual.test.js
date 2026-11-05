import { describe, it, expect } from 'vitest';
import {
  SANITY_CHECK_REQUIREMENTS,
  getStudentDesignForSanityCheck,
} from '../../logic/studentDesignContext';
import { evaluateSanityCheck } from '../../engine/sanityCheckEngine';

describe('Sanity Checks — Comprehensive 26-Check Individual Verification Matrix', () => {
  const ALL_26_SANITY_CHECKS = Object.keys(SANITY_CHECK_REQUIREMENTS);

  // Fully completed mock player state with clean student design artifacts across all levels
  const mockMasterPlayer = {
    levelProgress: {
      // Floorplanning
      'fp-1': { completed: true },
      'fp-2': { completed: true },
      'fp-3': { completed: true },
      'fp-4': { completed: true, artifacts: { margin: 25.0, halo: 18.0 } },
      'fp-5': {
        completed: true,
        artifacts: {
          margin: 24.0,
          halo: 16.0,
          ringContinuous: true,
          missingVias: 0,
          floatingPins: 0,
        },
      },
      // Placement
      'pl-1': { completed: true },
      'pl-2': {
        completed: true,
        artifacts: {
          cells: [
            { id: 'C1', x: 0, y: 0, width: 20, height: 20 },
            { id: 'C2', x: 25, y: 0, width: 20, height: 20 },
          ],
          overlapsResolved: true,
        },
      },
      'pl-3': { completed: true },
      'pl-4': { completed: true, artifacts: { hotspotResolved: true, maxCongestion: 0.65 } },
      'pl-5': {
        completed: true,
        artifacts: {
          boundaryClearance: 6.0,
          nwellAligned: true,
          floatingPins: 0,
          unconnectedNets: 0,
          wellTapPitch: 25.0,
          missingRailVias: 0,
        },
      },
      // CTS
      'cts-1': { completed: true },
      'cts-2': { completed: true, artifacts: { setupSlack: 0.040, holdSlack: 0.035, skewPs: 20 } },
      'cts-3': { completed: true },
      'cts-4': { completed: true },
      'cts-5': {
        completed: true,
        artifacts: {
          powerMw: 2.8,
          maxLatencyPs: 195,
          maxTransitionPs: 50,
          skewPs: 18,
          stages: [3, 3, 3, 3],
        },
      },
      // Routing
      'rt-1': { completed: true },
      'rt-2': { completed: true },
      'rt-3': { completed: true, artifacts: { viaEnclosureUm: 0.08, drcViolations: 0 } },
      'rt-4': { completed: true, artifacts: { maxVictimNoiseMv: 30 } },
      'rt-5': {
        completed: true,
        artifacts: {
          unroutedNets: 0,
          openSegments: 0,
          hasShorts: false,
          opens: 0,
          timingSlackNs: 0.035,
        },
      },
      // Filler Cells
      'fc-1': { completed: true },
      'fc-2': { completed: true },
      'fc-3': {
        completed: true,
        artifacts: {
          emptySites: 0,
          rowFillPercent: 100,
          wellContinuityMet: true,
          chosenFillers: ['FILL8', 'FILL4', 'FILL2', 'FILL1'],
        },
      },
      'fc-4': {
        completed: true,
        artifacts: {
          droopMv: 28,
          leakageUa: 12.0,
          decapCapFf: 350,
        },
      },
      'fc-5': {
        completed: true,
        artifacts: {
          baseDrcViolations: 0,
          endcapsPresent: true,
          tapCellsContinuous: true,
          timingImpactPs: 2.0,
          qorScore: 98,
          routingBlockages: 0,
        },
      },
    },
  };

  it('verifies that exactly 26 checks are evaluated individually', () => {
    expect(ALL_26_SANITY_CHECKS).toHaveLength(26);
  });

  // ─── PART A: Missing Prerequisites Rejection across all 26 checks ─────
  describe('Prerequisite Enforcement & Rejection (All 26 Checks)', () => {
    const emptyPlayer = { levelProgress: {} };

    ALL_26_SANITY_CHECKS.forEach((checkId) => {
      it(`[${checkId}] correctly rejects student signoff when prerequisites are incomplete`, () => {
        const studentCtx = getStudentDesignForSanityCheck(emptyPlayer, checkId);
        expect(studentCtx.canCertify).toBe(false);
        expect(studentCtx.missingPrerequisites.length).toBeGreaterThan(0);

        // Sanity check execution must abort and refuse certification
        const result = evaluateSanityCheck(checkId, {
          isStudentDesign: true,
          hasStudentDesign: false,
          reason: studentCtx.reason,
        });

        expect(result.passed).toBe(false);
        expect(result.canCertify).toBe(false);
        expect(result.isDemonstration).toBe(false);
        expect(result.logOutput.join(' ')).toContain('NO STUDENT DESIGN FOUND');
      });
    });
  });

  // ─── PART B: Demonstration Mode Isolation across all 26 checks ─────────
  describe('Demonstration & Fault Drill Isolation (All 26 Checks)', () => {
    ALL_26_SANITY_CHECKS.forEach((checkId) => {
      it(`[${checkId}] demo mode never grants certification XP (canCertify = false)`, () => {
        const result = evaluateSanityCheck(checkId, {
          isStudentDesign: false,
          injectDefect: false,
        });

        expect(result.isDemonstration).toBe(true);
        expect(result.canCertify).toBe(false); // CANNOT grant certification
        expect(result.logOutput.join(' ')).toContain('Stage Certification XP Disabled');
      });

      it(`[${checkId}] demo mode defect injection catches simulated faults`, () => {
        const result = evaluateSanityCheck(checkId, {
          isStudentDesign: false,
          injectDefect: true,
        });

        expect(result.isDemonstration).toBe(true);
        expect(result.canCertify).toBe(false);
        expect(result.passed).toBe(false); // Injected defect triggers violation
        expect(result.logOutput.join(' ')).toContain('RULE_VIOLATION');
      });
    });
  });

  // ─── PART C: Student Design Sign-Off Validation across all 26 checks ───
  describe('Valid Student Design Sign-Off Certification (All 26 Checks)', () => {
    ALL_26_SANITY_CHECKS.forEach((checkId) => {
      it(`[${checkId}] successfully signs off valid student design with certification rights`, () => {
        const studentCtx = getStudentDesignForSanityCheck(mockMasterPlayer, checkId);
        expect(studentCtx.canCertify).toBe(true);
        expect(studentCtx.missingPrerequisites).toHaveLength(0);

        const result = evaluateSanityCheck(checkId, {
          isStudentDesign: true,
          hasStudentDesign: true,
          designData: studentCtx.designData,
        });

        expect(result.passed).toBe(true);
        expect(result.canCertify).toBe(true); // Genuine sign-off earned
        expect(result.isDemonstration).toBe(false);
        expect(result.logOutput.join(' ')).toContain('CLEAN_PASS');
      });
    });
  });
});
