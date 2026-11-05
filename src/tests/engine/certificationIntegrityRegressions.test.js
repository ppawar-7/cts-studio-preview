/**
 * certificationIntegrityRegressions.test.js
 * =========================================
 * Regression tests demonstrating certification integrity vulnerabilities:
 * 1. Player with completed levels but missing artifacts must NOT certify fp-drc.
 * 2. evaluateSanityCheck with empty designData must NOT pass with clean geometry fallbacks.
 * 3. PRACTICE_ONLY checks (fp-connectivity, fp-missing-vias) must NEVER award certification XP.
 * 4. Unknown check IDs, malformed data, invalid schemas, missing fields must all be rejected.
 * 5. Sanity checks must evaluate actual modeled physical measurements, not pure conceptual answers.
 */

import { describe, it, expect } from 'vitest';
import { getStudentDesignForSanityCheck, SANITY_CHECK_REQUIREMENTS } from '../../logic/studentDesignContext.js';
import { evaluateSanityCheck } from '../../engine/sanityCheckEngine.js';
import { applySanityCheckCompletion, isKingdomCompleted } from '../../logic/progressionEngine.js';
import { CHECK_CLASSIFICATION } from '../../logic/designArtifactContracts.js';

describe('P0 Regression Tests — Certification Integrity & Fail-Closed Safeguards', () => {
  it('1. A player whose fp-4 and fp-5 levels are marked completed, but whose artifacts are missing, must NOT certify fp-drc', () => {
    const playerWithMissingArtifacts = {
      levelProgress: {
        'fp-4': { completed: true, score: 50, stars: 3 }, // NO artifacts!
        'fp-5': { completed: true, score: 50, stars: 3 }, // NO artifacts!
      },
      sanityCheckProgress: {},
    };

    const auditInfo = getStudentDesignForSanityCheck(playerWithMissingArtifacts, 'fp-drc');
    // Must NOT say canCertify: true when artifacts are missing
    expect(auditInfo.canCertify).toBe(false);
    expect(auditInfo.status).not.toBe('READY');

    // And evaluation must reject and NOT certify
    const result = evaluateSanityCheck('fp-drc', {
      isStudentDesign: true,
      hasStudentDesign: auditInfo.canCertify,
      designData: auditInfo.designData,
    });
    expect(result.passed).toBe(false);
    expect(result.canCertify).toBe(false);
  });

  it('2. An evaluation with isStudentDesign: true, hasStudentDesign: true, and empty designData must NOT pass through default clean geometry values', () => {
    // If an attacker or bug sends empty designData with isStudentDesign: true
    const result = evaluateSanityCheck('fp-drc', {
      isStudentDesign: true,
      hasStudentDesign: true,
      designData: {}, // Empty! Missing margin and halo!
    });

    // Currently this PASSES because sanityCheckEngine falls back to margin=20, halo=15!
    // It MUST fail closed:
    expect(result.passed).toBe(false);
    expect(result.canCertify).toBe(false);
    expect(result.logOutput.some((l) => l.includes('INSUFFICIENT') || l.includes('REJECTED') || l.includes('INVALID') || l.includes('NO STUDENT DESIGN FOUND'))).toBe(true);
  });

  it('3. fp-connectivity and fp-missing-vias are classified PRACTICE_ONLY; they must NEVER award certification XP', () => {
    const player = {
      totalXP: 500,
      levelProgress: {
        'fp-5': {
          completed: true,
          score: 50,
          stars: 3,
          artifacts: { measurements: { ringContinuous: true, missingVias: 0 } },
        },
      },
      sanityCheckProgress: {},
    };

    const connAudit = getStudentDesignForSanityCheck(player, 'fp-connectivity');
    expect(connAudit.canCertify).toBe(false);
    expect(SANITY_CHECK_REQUIREMENTS['fp-connectivity'].classification).toBe(CHECK_CLASSIFICATION.PRACTICE_ONLY);

    const viasAudit = getStudentDesignForSanityCheck(player, 'fp-missing-vias');
    expect(viasAudit.canCertify).toBe(false);
    expect(SANITY_CHECK_REQUIREMENTS['fp-missing-vias'].classification).toBe(CHECK_CLASSIFICATION.PRACTICE_ONLY);

    // Progression engine must refuse to award certification XP for PRACTICE_ONLY checks
    const updated = applySanityCheckCompletion(player, 'fp-connectivity', 25);
    expect(updated.totalXP).toBe(500); // 0 XP awarded!
    expect(updated.sanityCheckProgress['fp-connectivity']?.certified).not.toBe(true);
  });

  it('4. Unknown sanity check IDs, malformed artifact data, invalid schemas and missing required measurements must all be rejected', () => {
    // Unknown check
    const unknownAudit = getStudentDesignForSanityCheck({}, 'non-existent-check-999');
    expect(unknownAudit.canCertify).toBe(false);

    const unknownEval = evaluateSanityCheck('non-existent-check-999', {
      isStudentDesign: true,
      designData: { some: 'data' },
    });
    expect(unknownEval.passed).toBe(false);
    expect(unknownEval.canCertify).toBe(false);

    // Malformed artifact data (NaN or negative dimensions)
    const malformedEval = evaluateSanityCheck('fp-drc', {
      isStudentDesign: true,
      hasStudentDesign: true,
      designData: { margin: NaN, halo: -10 },
    });
    expect(malformedEval.passed).toBe(false);
    expect(malformedEval.canCertify).toBe(false);

    // Partial/missing required measurement
    const partialEval = evaluateSanityCheck('fp-drc', {
      isStudentDesign: true,
      hasStudentDesign: true,
      designData: { margin: 25.0 }, // Missing halo!
    });
    expect(partialEval.passed).toBe(false);
    expect(partialEval.canCertify).toBe(false);
  });

  it('5. Practice-only checks must not block kingdom completion if all levels and certifiable checks are satisfied', () => {
    const playerWithAllCertifiableDone = {
      levelProgress: {
        'fp-1': { completed: true },
        'fp-2': { completed: true },
        'fp-3': { completed: true },
        'fp-4': { completed: true },
        'fp-5': { completed: true },
      },
      sanityCheckProgress: {
        'fp-drc': { passed: true, certified: true },
        // fp-connectivity and fp-missing-vias are PRACTICE_ONLY and cannot be certified!
      },
    };

    // Kingdom completion should be achievable once core levels and CERTIFIABLE checks are done
    const fpCompleted = isKingdomCompleted(playerWithAllCertifiableDone, 'floorplanning');
    expect(fpCompleted).toBe(true);
  });
});
