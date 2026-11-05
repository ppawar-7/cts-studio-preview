import { describe, it, expect } from 'vitest';
import {
  applyLevelCompletion,
  applySanityCheckCompletion,
  isSanityCheckPassed,
  getSanityCheckStatus,
  areAllKingdomSanityChecksPassed,
} from '../../logic/progressionEngine.js';
import { KINGDOMS } from '../../data/kingdomsData.js';
import { createDesignArtifact, ARTIFACT_KINDS } from '../../logic/designArtifactContracts.js';

describe('Stale Certification Reevaluation & XP Integrity (Section 8.A)', () => {
  it('marks certification stale when student resubmits structurally valid geometry that fails physical threshold (fp-drc)', () => {
    const fpKingdom = KINGDOMS.find((k) => k.id === 'floorplanning');
    expect(fpKingdom).toBeDefined();

    let player = {
      totalXP: 200,
      levelProgress: {
        'fp-1': { completed: true, xpEarned: 20, stars: 3 },
        'fp-2': { completed: true, xpEarned: 24, stars: 3 },
        'fp-3': { completed: true, xpEarned: 28, stars: 3 },
        'fp-4': {
          completed: true,
          xpEarned: 32,
          stars: 3,
          artifacts: createDesignArtifact({
            kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
            sourceLevelId: 'fp-4',
            measurements: { margin: 25.0, halo: 20.0 },
          }),
        },
      },
      sanityCheckProgress: {},
      kingdomProgress: {
        floorplanning: { completed: false, totalXP: 104 },
      },
    };

    // 1. Complete fp-5 with valid passing geometry (margin >= 20.0, halo >= 15.0)
    const fp5Level = fpKingdom.levels.find((l) => l.id === 'fp-5');
    const validFp5Artifact = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      measurements: {
        margin: 25.0,
        halo: 20.0,
        ringContinuous: true,
        missingVias: 0,
        floatingPins: 0,
      },
    });

    player = applyLevelCompletion(player, 'floorplanning', fp5Level, 40, validFp5Artifact);
    expect(player.levelProgress['fp-5'].completed).toBe(true);

    // 2. Certify fp-drc
    const fpDrcCheck = fpKingdom.sanityChecks.find((c) => c.id === 'fp-drc');
    expect(fpDrcCheck).toBeDefined();

    const xpBeforeCert = player.totalXP;
    player = applySanityCheckCompletion(player, 'floorplanning', fpDrcCheck, 25);

    expect(player.sanityCheckProgress['fp-drc'].certified).toBe(true);
    expect(player.sanityCheckProgress['fp-drc'].stale).toBe(false);
    expect(isSanityCheckPassed(player, 'fp-drc')).toBe(true);
    expect(getSanityCheckStatus(player, 'floorplanning', fpDrcCheck)).toBe('certified');
    expect(player.totalXP).toBe(xpBeforeCert + 25 + 50); // check XP + kingdom completion bonus
    expect(player.kingdomProgress.floorplanning.completed).toBe(true);
    expect(player.kingdomProgress.floorplanning.bonusAwarded).toBe(true);

    const xpAfterFirstCert = player.totalXP;

    // 3. Student replays fp-5 and submits structurally valid artifact, but with failing physical margin (12.0 µm < 20.0 µm)
    const failingFp5Artifact = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      measurements: {
        margin: 12.0, // FAILS physical DRC rule (minimum 20.0 µm required)
        halo: 20.0,
        ringContinuous: true,
        missingVias: 0,
        floatingPins: 0,
      },
    });

    player = applyLevelCompletion(player, 'floorplanning', fp5Level, 40, failingFp5Artifact);

    // 4. Verification: fp-drc MUST now be marked stale and NOT certified!
    expect(player.sanityCheckProgress['fp-drc'].certified).toBe(false);
    expect(player.sanityCheckProgress['fp-drc'].stale).toBe(true);
    expect(player.sanityCheckProgress['fp-drc'].staleReason).toMatch(/margin|VIOLATION/i);
    expect(isSanityCheckPassed(player, 'fp-drc')).toBe(false);
    expect(getSanityCheckStatus(player, 'floorplanning', fpDrcCheck)).toBe('stale');

    // Kingdom completion should accurately reflect invalid certifications
    expect(areAllKingdomSanityChecksPassed(player, 'floorplanning')).toBe(false);
    expect(player.kingdomProgress.floorplanning.completed).toBe(false);

    // Historically earned XP must be preserved (not deducted)
    expect(player.totalXP).toBe(xpAfterFirstCert);

    // 5. Submitting identical failing artifact again leaves stale state unchanged
    player = applyLevelCompletion(player, 'floorplanning', fp5Level, 40, failingFp5Artifact);
    expect(player.sanityCheckProgress['fp-drc'].stale).toBe(true);

    // 6. Student fixes the design: replays fp-5 with valid margins (26.0 µm)
    const fixedFp5Artifact = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      measurements: {
        margin: 26.0,
        halo: 20.0,
        ringContinuous: true,
        missingVias: 0,
        floatingPins: 0,
      },
    });

    player = applyLevelCompletion(player, 'floorplanning', fp5Level, 40, fixedFp5Artifact);

    // 7. Student runs verification terminal to re-certify fp-drc
    player = applySanityCheckCompletion(player, 'floorplanning', fpDrcCheck, 25);

    expect(player.sanityCheckProgress['fp-drc'].certified).toBe(true);
    expect(player.sanityCheckProgress['fp-drc'].stale).toBe(false);
    expect(isSanityCheckPassed(player, 'fp-drc')).toBe(true);
    expect(getSanityCheckStatus(player, 'floorplanning', fpDrcCheck)).toBe('certified');
    expect(player.kingdomProgress.floorplanning.completed).toBe(true);

    // XP INTEGRITY: Duplicate 25 XP and duplicate 50 XP kingdom bonus must NOT be awarded!
    expect(player.totalXP).toBe(xpAfterFirstCert);
  });

  it('marks routing certification stale when via enclosure rule is breached on replay (rt-design)', () => {
    const rtKingdom = KINGDOMS.find((k) => k.id === 'routing');
    const rt3Level = rtKingdom.levels.find((l) => l.id === 'rt-3');
    const rtDesignCheck = rtKingdom.sanityChecks.find((c) => c.id === 'rt-design');

    let player = {
      totalXP: 500,
      levelProgress: {
        'rt-1': { completed: true, xpEarned: 20, stars: 3 },
        'rt-2': { completed: true, xpEarned: 24, stars: 3 },
        'rt-3': {
          completed: true,
          xpEarned: 28,
          stars: 3,
          artifacts: createDesignArtifact({
            kind: ARTIFACT_KINDS.ROUTING_INTERCONNECT,
            sourceLevelId: 'rt-3',
            measurements: { viaEnclosureUm: 0.025, drcErrors: 0 },
          }),
        },
        'rt-4': { completed: true, xpEarned: 32, stars: 3 },
        'rt-5': { completed: true, xpEarned: 36, stars: 3 },
      },
      sanityCheckProgress: {
        'rt-design': { certified: true, stale: false, score: 25 },
      },
      kingdomProgress: {
        routing: { completed: false, totalXP: 140 },
      },
    };

    expect(isSanityCheckPassed(player, 'rt-design')).toBe(true);

    // Replay rt-3 with violating via enclosure (0.005 µm < 0.010 µm required)
    const badViaArtifact = createDesignArtifact({
      kind: ARTIFACT_KINDS.ROUTING_INTERCONNECT,
      sourceLevelId: 'rt-3',
      measurements: { viaEnclosureUm: 0.005, drcErrors: 0 },
    });

    player = applyLevelCompletion(player, 'routing', rt3Level, 28, badViaArtifact);

    expect(player.sanityCheckProgress['rt-design'].certified).toBe(false);
    expect(player.sanityCheckProgress['rt-design'].stale).toBe(true);
    expect(player.sanityCheckProgress['rt-design'].staleReason).toMatch(/via|enclosure|VIOLATION/i);
    expect(isSanityCheckPassed(player, 'rt-design')).toBe(false);
  });
});
