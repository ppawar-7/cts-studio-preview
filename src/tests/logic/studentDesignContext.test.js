import { describe, it, expect } from 'vitest';
import {
  SANITY_CHECK_REQUIREMENTS,
  getStudentDesignForSanityCheck,
  CHECK_CLASSIFICATION,
} from '../../logic/studentDesignContext';

describe('studentDesignContext — 26 Sanity Check Requirements & Student Artifact Extraction', () => {
  const ALL_26_CHECKS = [
    // Floorplanning (3)
    'fp-drc',
    'fp-connectivity',
    'fp-missing-vias',
    // Placement (5)
    'pl-legality',
    'pl-congestion',
    'pl-drc',
    'pl-connectivity',
    'pl-missing-vias',
    // CTS (4)
    'cts-timing-reports',
    'cts-power',
    'cts-qor',
    'cts-clock-tree-report',
    // Routing (5)
    'rt-routes',
    'rt-lvs',
    'rt-timing',
    'rt-design',
    'rt-constraints',
    // Filler Cells (9)
    'fc-legality',
    'fc-drc',
    'fc-connectivity',
    'fc-design',
    'fc-timing',
    'fc-constraints',
    'fc-power',
    'fc-qor',
    'fc-congestion',
  ];

  it('defines requirements for exactly all 26 physical design sanity checks', () => {
    expect(Object.keys(SANITY_CHECK_REQUIREMENTS)).toHaveLength(26);
    ALL_26_CHECKS.forEach((checkId) => {
      expect(SANITY_CHECK_REQUIREMENTS[checkId]).toBeDefined();
      expect(SANITY_CHECK_REQUIREMENTS[checkId].prerequisiteLevels.length).toBeGreaterThan(0);
      expect(typeof SANITY_CHECK_REQUIREMENTS[checkId].extractData).toBe('function');
    });
  });

  it('classifies checks strictly into 15 certifiable and 11 practice-only', () => {
    const certifiable = ALL_26_CHECKS.filter(
      (id) => SANITY_CHECK_REQUIREMENTS[id].classification === CHECK_CLASSIFICATION.CERTIFIABLE_EDUCATIONAL_CHECK
    );
    const practice = ALL_26_CHECKS.filter(
      (id) => SANITY_CHECK_REQUIREMENTS[id].classification === CHECK_CLASSIFICATION.PRACTICE_ONLY
    );

    expect(certifiable).toHaveLength(15);
    expect(practice).toHaveLength(11);
  });

  it('rejects unknown sanity check IDs with clean feedback', () => {
    const res = getStudentDesignForSanityCheck({}, 'unknown-check');
    expect(res.canCertify).toBe(false);
    expect(res.missingPrerequisites).toHaveLength(0);
    expect(res.reason).toMatch(/Unknown sanity check identifier/);
  });

  it('rejects student evaluation when prerequisite levels are incomplete', () => {
    const emptyPlayer = { levelProgress: {} };
    ALL_26_CHECKS.forEach((checkId) => {
      const res = getStudentDesignForSanityCheck(emptyPlayer, checkId);
      expect(res.canCertify).toBe(false);
      expect(res.missingPrerequisites.length).toBeGreaterThan(0);
      expect(res.reason).toMatch(/Prerequisite design missing/);
    });
  });

  it('partially completed prerequisites still reject certification until all are met', () => {
    // fp-drc requires both fp-4 and fp-5
    const partialPlayer = {
      levelProgress: {
        'fp-4': { completed: true, artifacts: { margin: 25.0 } },
      },
    };
    const res = getStudentDesignForSanityCheck(partialPlayer, 'fp-drc');
    expect(res.canCertify).toBe(false);
    expect(res.missingPrerequisites).toEqual(['fp-5']);
    expect(res.reason).toContain('fp-5');
  });

  it('allows student evaluation and extracts design artifacts when prerequisites are complete', () => {
    const fullyCompletedPlayer = {
      levelProgress: {
        'fp-4': { completed: true, artifacts: { margin: 22.0, halo: 18.0 } },
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
      },
    };

    const resFpDrc = getStudentDesignForSanityCheck(fullyCompletedPlayer, 'fp-drc');
    expect(resFpDrc.canCertify).toBe(true);
    expect(resFpDrc.missingPrerequisites).toHaveLength(0);
    expect(resFpDrc.designData.margin).toBe(24.0);
    expect(resFpDrc.designData.halo).toBe(16.0);

    const resFpConn = getStudentDesignForSanityCheck(fullyCompletedPlayer, 'fp-connectivity');
    expect(resFpConn.canCertify).toBe(false);
    expect(resFpConn.isPracticeOnly).toBe(true);

    const resFpVias = getStudentDesignForSanityCheck(fullyCompletedPlayer, 'fp-missing-vias');
    expect(resFpVias.canCertify).toBe(false);
    expect(resFpVias.isPracticeOnly).toBe(true);
  });

  it('extracts custom student placement and CTS metrics accurately', () => {
    const student = {
      levelProgress: {
        'cts-2': { completed: true, artifacts: { setupSlack: 0.045, holdSlack: 0.050, skewPs: 25 } },
        'cts-3': { completed: true, artifacts: { gatingEfficiencyPercent: 85 } },
        'cts-4': { completed: true },
        'cts-5': {
          completed: true,
          artifacts: {
            powerMw: 3.2,
            latencyPs: 190,
            maxLatencyPs: 190,
            maxTransitionPs: 55,
            skewPs: 22,
          },
        },
      },
    };

    const resTiming = getStudentDesignForSanityCheck(student, 'cts-timing-reports');
    expect(resTiming.canCertify).toBe(true);
    expect(resTiming.designData.setupSlack).toBe(0.045);

    const resPower = getStudentDesignForSanityCheck(student, 'cts-power');
    expect(resPower.canCertify).toBe(true);
    expect(resPower.designData.powerMw).toBe(3.2);

    const resQor = getStudentDesignForSanityCheck(student, 'cts-qor');
    expect(resQor.canCertify).toBe(false);
    expect(resQor.isPracticeOnly).toBe(true);

    const resReport = getStudentDesignForSanityCheck(student, 'cts-clock-tree-report');
    expect(resReport.canCertify).toBe(true);
    expect(resReport.designData.skewPs).toBe(22);
  });
});
