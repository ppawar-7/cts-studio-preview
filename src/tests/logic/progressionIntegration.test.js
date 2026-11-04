import { describe, it, expect } from 'vitest';
import {
  isLevelUnlocked,
  isLevelCompleted,
  getLevelStatus,
  applyLevelCompletion,
} from '../../logic/progressionEngine.js';
import { KINGDOMS } from '../../data/kingdomsData.js';
import { DEFAULT_PLAYER } from '../../data/playerDefaults.js';
import { validateMuxChallenge } from '../../activities/rtl/validators/validateMuxChallenge.js';

describe('Progression Engine Integration with Validated RTL Level 1', () => {
  const kingdom = KINGDOMS.find((k) => k.id === 'rtl-understanding');
  const level1 = kingdom.levels.find((l) => l.id === 'rtl-1');
  const level2 = kingdom.levels.find((l) => l.id === 'rtl-2');

  const perfectOutputs = [0, 0, 1, 1, 0, 1, 0, 1];

  it('initially has rtl-1 unlocked and rtl-2 locked (pointsRequired=20)', () => {
    const player = { ...DEFAULT_PLAYER };
    expect(isLevelUnlocked(player, kingdom, level1)).toBe(true);
    expect(isLevelCompleted(player, 'rtl-1')).toBe(false);
    expect(getLevelStatus(player, kingdom, level1)).toBe('available');

    // rtl-2 requires 20 XP
    expect(level2.pointsRequired).toBe(20);
    expect(isLevelUnlocked(player, kingdom, level2)).toBe(false);
    expect(getLevelStatus(player, kingdom, level2)).toBe('locked');
  });

  it('does NOT complete level or award XP when mastery gate fails', () => {
    let player = { ...DEFAULT_PLAYER };
    const failedResult = validateMuxChallenge({ tableOutputs: [0, 0, 0] }); // incomplete

    expect(failedResult.passed).toBe(false);
    expect(failedResult.score).toBe(0);

    // If UI tried to submit a failed result, it must not update progress
    if (failedResult.passed) {
      player = applyLevelCompletion(player, kingdom.id, level1, failedResult.score);
    }

    expect(isLevelCompleted(player, 'rtl-1')).toBe(false);
    expect(isLevelUnlocked(player, kingdom, level2)).toBe(false);
    expect(getLevelStatus(player, kingdom, level2)).toBe('locked');
  });

  it('completes rtl-1 and unlocks rtl-2 when 25 XP is earned (8/8 truth table passed)', () => {
    let player = { ...DEFAULT_PLAYER };
    const passResult = validateMuxChallenge({
      tableOutputs: perfectOutputs,
      conceptAnswer: 'wrong-concept', // concept incorrect, but truth table 8/8 passed
    });

    expect(passResult.passed).toBe(true);
    expect(passResult.score).toBe(25);
    expect(passResult.stars).toBe(2);

    player = applyLevelCompletion(player, kingdom.id, level1, passResult.score);

    expect(isLevelCompleted(player, 'rtl-1')).toBe(true);
    expect(player.totalXP).toBe(25);
    expect(player.levelProgress['rtl-1'].xpEarned).toBe(25);
    expect(player.levelProgress['rtl-1'].stars).toBe(2);

    // rtl-2 requires 20 XP, player has 25 -> UNLOCKED!
    expect(isLevelUnlocked(player, kingdom, level2)).toBe(true);
    expect(getLevelStatus(player, kingdom, level2)).toBe('available');
  });

  it('allows score improvement (25 XP -> 30 XP, 2 Stars -> 3 Stars) with correct xpDelta', () => {
    let player = { ...DEFAULT_PLAYER };

    // Initial 2-star completion
    player = applyLevelCompletion(player, kingdom.id, level1, 25);
    expect(player.totalXP).toBe(25);

    // Replay with full 3-star mastery
    const fullResult = validateMuxChallenge({
      tableOutputs: perfectOutputs,
      conceptAnswer: 'opt-synthesis-opt',
    });
    expect(fullResult.score).toBe(30);
    expect(fullResult.stars).toBe(3);

    player = applyLevelCompletion(player, kingdom.id, level1, fullResult.score);

    expect(player.totalXP).toBe(30); // xpDelta = 30 - 25 = +5 XP
    expect(player.levelProgress['rtl-1'].xpEarned).toBe(30);
    expect(player.levelProgress['rtl-1'].stars).toBe(3);
  });

  it('prevents duplicate XP farming on identical or lower repeat submissions', () => {
    let player = { ...DEFAULT_PLAYER };

    // Achieve 30 XP
    player = applyLevelCompletion(player, kingdom.id, level1, 30);
    expect(player.totalXP).toBe(30);

    // Replay with 25 XP
    player = applyLevelCompletion(player, kingdom.id, level1, 25);
    expect(player.totalXP).toBe(30); // NO downgrade, NO duplicate
    expect(player.levelProgress['rtl-1'].xpEarned).toBe(30);
    expect(player.levelProgress['rtl-1'].stars).toBe(3);
  });
});
