import { describe, it, expect } from 'vitest';
import {
  migratePlayerState,
  STORAGE_KEY_V2,
} from '../../logic/storageMigration.js';
import {
  applyLevelCompletion,
  applySanityCheckCompletion,
  isSanityCheckPassed,
} from '../../logic/progressionEngine.js';
import { KINGDOMS } from '../../data/kingdomsData.js';
import { createDesignArtifact, ARTIFACT_KINDS } from '../../logic/designArtifactContracts.js';

describe('Kingdom Bonus XP Persistence & Reload Accounting (Issue #1)', () => {
  it('preserves +50 XP kingdom completion bonus across reload and migration', () => {
    // 1. Setup a player who completed RTL Kingdom (all 5 levels)
    const rtlKingdom = KINGDOMS.find((k) => k.id === 'rtl-understanding');
    let player = {
      name: 'Test Student',
      schemaVersion: 2,
      totalXP: 0,
      levelProgress: {},
      sanityCheckProgress: {},
      kingdomProgress: {},
    };

    // Complete all 5 levels of RTL
    for (const lvl of rtlKingdom.levels) {
      player = applyLevelCompletion(player, 'rtl-understanding', lvl, lvl.xpReward, {});
    }

    // 200 XP from levels + 50 XP from kingdom completion = 250 XP
    expect(player.totalXP).toBe(250);
    expect(player.kingdomProgress['rtl-understanding'].completed).toBe(true);
    expect(player.kingdomProgress['rtl-understanding'].bonusAwarded).toBe(true);

    // 2. Simulate page reload / storage migration
    const reloaded = migratePlayerState(player);

    // CRITICAL INVARIANT: The +50 XP kingdom bonus MUST survive page reload!
    expect(reloaded.totalXP).toBe(250);
    expect(reloaded.kingdomProgress['rtl-understanding'].completed).toBe(true);
    expect(reloaded.kingdomProgress['rtl-understanding'].bonusAwarded).toBe(true);
  });

  it('preserves bonus across stale certification revision, reload, and recertification', () => {
    const fpKingdom = KINGDOMS.find((k) => k.id === 'floorplanning');
    const fp5Level = fpKingdom.levels.find((l) => l.id === 'fp-5');
    const fpDrcCheck = fpKingdom.sanityChecks.find((c) => c.id === 'fp-drc');

    let player = {
      name: 'FP Master',
      schemaVersion: 2,
      totalXP: 104, // 20 + 24 + 28 + 32 = 104 XP from fp-1..fp-4
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

    // 1. Complete fp-5 with valid geometry
    const validFp5 = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      measurements: { margin: 25.0, halo: 20.0, ringContinuous: true, missingVias: 0, floatingPins: 0 },
    });
    player = applyLevelCompletion(player, 'floorplanning', fp5Level, 40, validFp5);

    // 2. Certify fp-drc -> awards 25 XP + 50 XP kingdom bonus
    player = applySanityCheckCompletion(player, 'floorplanning', fpDrcCheck, 25);

    // Total XP = 104 + 40 + 25 + 50 = 219 XP
    expect(player.totalXP).toBe(219);
    expect(player.kingdomProgress.floorplanning.completed).toBe(true);
    expect(player.kingdomProgress.floorplanning.bonusAwarded).toBe(true);

    // 3. Reload after completion
    let reloaded = migratePlayerState(player);
    expect(reloaded.totalXP).toBe(219);

    // 4. Student replays fp-5 with failing margin (12.0 µm < 20.0 µm)
    const badFp5 = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      measurements: { margin: 12.0, halo: 20.0, ringContinuous: true, missingVias: 0, floatingPins: 0 },
    });
    player = applyLevelCompletion(player, 'floorplanning', fp5Level, 40, badFp5);

    expect(player.sanityCheckProgress['fp-drc'].certified).toBe(false);
    expect(player.sanityCheckProgress['fp-drc'].stale).toBe(true);
    expect(player.kingdomProgress.floorplanning.completed).toBe(false);
    expect(player.kingdomProgress.floorplanning.bonusAwarded).toBe(true);
    expect(player.totalXP).toBe(219); // Historical XP preserved

    // 5. Reload during stale state: bonus remains intact and check remains stale!
    reloaded = migratePlayerState(player);
    expect(reloaded.totalXP).toBe(219);
    expect(reloaded.kingdomProgress.floorplanning.completed).toBe(false);
    expect(reloaded.kingdomProgress.floorplanning.bonusAwarded).toBe(true);

    // 6. Student fixes fp-5 and recertifies
    const fixedFp5 = createDesignArtifact({
      kind: ARTIFACT_KINDS.FLOORPLAN_LAYOUT,
      sourceLevelId: 'fp-5',
      measurements: { margin: 26.0, halo: 20.0, ringContinuous: true, missingVias: 0, floatingPins: 0 },
    });
    player = applyLevelCompletion(player, 'floorplanning', fp5Level, 40, fixedFp5);
    player = applySanityCheckCompletion(player, 'floorplanning', fpDrcCheck, 25);

    // ANTI-DUPLICATION: Total XP must remain 219 (no duplicate +25 or +50 XP)!
    expect(player.totalXP).toBe(219);
    expect(player.kingdomProgress.floorplanning.completed).toBe(true);

    // Reload again
    reloaded = migratePlayerState(player);
    expect(reloaded.totalXP).toBe(219);
  });

  it('rejects arbitrary inflated totalXP but correctly reconstructs legitimate kingdom bonuses', () => {
    const corruptState = {
      name: 'Cheater',
      totalXP: 99999, // Fake total XP
      levelProgress: {
        'rtl-1': { completed: true, xpEarned: 30, stars: 3 },
      },
      sanityCheckProgress: {},
      kingdomProgress: {},
    };

    const clean = migratePlayerState(corruptState);
    // Only 1 level completed (30 XP), no kingdom completed (0 bonus) -> 30 XP
    expect(clean.totalXP).toBe(30);
  });
});
