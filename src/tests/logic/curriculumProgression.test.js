import { describe, it, expect } from 'vitest';
import {
  isLevelUnlocked,
  getLevelStatus,
  isKingdomUnlocked,
  isKingdomCompleted,
  getKingdomXP,
  applyLevelCompletion,
  applySanityCheckCompletion,
  computeStars,
} from '../../logic/progressionEngine.js';
import { KINGDOMS } from '../../data/kingdomsData.js';
import { DEFAULT_PLAYER } from '../../data/playerDefaults.js';

describe('Curriculum Progression Mathematics & Unlock Gates', () => {
  const rtlKingdom = KINGDOMS.find((k) => k.id === 'rtl-understanding');
  const synthesisKingdom = KINGDOMS.find((k) => k.id === 'synthesis');

  const rtl1 = rtlKingdom.levels.find((l) => l.id === 'rtl-1');
  const rtl2 = rtlKingdom.levels.find((l) => l.id === 'rtl-2');
  const rtl3 = rtlKingdom.levels.find((l) => l.id === 'rtl-3');
  const rtl4 = rtlKingdom.levels.find((l) => l.id === 'rtl-4');
  const rtl5 = rtlKingdom.levels.find((l) => l.id === 'rtl-5');

  it('preserves canonical IDs, reward caps, and calibrated unlock thresholds', () => {
    expect(rtlKingdom.pointsToUnlockNext).toBe(140);
    expect(rtlKingdom.levels).toHaveLength(5);

    expect(rtl1.pointsRequired).toBe(0);
    expect(rtl1.xpReward).toBe(30);

    expect(rtl2.pointsRequired).toBe(20);
    expect(rtl2.xpReward).toBe(35);

    expect(rtl3.pointsRequired).toBe(44);
    expect(rtl3.xpReward).toBe(40);

    expect(rtl4.pointsRequired).toBe(72);
    expect(rtl4.xpReward).toBe(45);

    expect(rtl5.pointsRequired).toBe(104);
    expect(rtl5.xpReward).toBe(50);
  });

  it('starts with only rtl-1 unlocked and synthesis kingdom locked', () => {
    const player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    expect(isKingdomUnlocked(player, 'rtl-understanding')).toBe(true);
    expect(isKingdomUnlocked(player, 'synthesis')).toBe(false);

    expect(isLevelUnlocked(player, rtlKingdom, rtl1)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl1)).toBe('available');

    expect(isLevelUnlocked(player, rtlKingdom, rtl2)).toBe(false);
    expect(getLevelStatus(player, rtlKingdom, rtl2)).toBe('locked');
  });

  it('allows student with defined minimum passing scores (2 stars: 20, 24, 28, 32, 38) to unlock every subsequent level', () => {
    let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    // Step 1: Pass RTL-1 with 20 XP (2-star threshold: score >= 20)
    expect(computeStars(20, rtl1.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 20);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(20);
    expect(player.totalXP).toBe(20);
    expect(isLevelUnlocked(player, rtlKingdom, rtl2)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl2)).toBe('available');
    expect(isLevelUnlocked(player, rtlKingdom, rtl3)).toBe(false);

    // Step 2: Pass RTL-2 with 24 XP (2-star threshold: score >= 24)
    expect(computeStars(24, rtl2.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl2, 24);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(44); // 20 + 24
    expect(player.totalXP).toBe(44);
    expect(isLevelUnlocked(player, rtlKingdom, rtl3)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl3)).toBe('available');
    expect(isLevelUnlocked(player, rtlKingdom, rtl4)).toBe(false);

    // Step 3: Pass RTL-3 with 28 XP (2-star threshold: score >= 28)
    expect(computeStars(28, rtl3.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl3, 28);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(72); // 44 + 28
    expect(player.totalXP).toBe(72);
    expect(isLevelUnlocked(player, rtlKingdom, rtl4)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl4)).toBe('available');
    expect(isLevelUnlocked(player, rtlKingdom, rtl5)).toBe(false);

    // Step 4: Pass RTL-4 with 32 XP (2-star threshold: score >= 32)
    expect(computeStars(32, rtl4.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl4, 32);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(104); // 72 + 32
    expect(player.totalXP).toBe(104);
    expect(isLevelUnlocked(player, rtlKingdom, rtl5)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl5)).toBe('available');

    // Step 5: Pass RTL-5 with 38 XP (2-star threshold: score >= 38)
    expect(computeStars(38, rtl5.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl5, 38);

    // Cumulative XP = 20 + 24 + 28 + 32 + 38 = 142 XP from levels
    expect(getKingdomXP(player, 'rtl-understanding')).toBe(142);
    expect(player.totalXP).toBe(192); // 142 + 50 bonus for kingdom completion

    // Kingdom completion: 142 >= 140 pointsToUnlockNext, all 5 levels completed
    expect(isKingdomCompleted(player, 'rtl-understanding')).toBe(true);
    expect(isKingdomUnlocked(player, 'synthesis')).toBe(true);
  });

  it('mathematically proves that earning the exact minimum 2-star threshold across ALL 8 kingdoms guarantees complete progression without deadlock', () => {
    let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    // Two-star threshold scores across levels 1 through 5:
    // Level 1: 20 XP (cumulative 20 >= 20 -> unlocks level 2)
    // Level 2: 24 XP (cumulative 44 >= 44 -> unlocks level 3)
    // Level 3: 28 XP (cumulative 72 >= 72 -> unlocks level 4)
    // Level 4: 32 XP (cumulative 104 >= 104 -> unlocks level 5)
    // Level 5: 38 XP (cumulative 142 >= 140 -> unlocks next kingdom)
    const twoStarScores = [20, 24, 28, 32, 38];

    KINGDOMS.forEach((kingdom, kIdx) => {
      // 1. Kingdom must be unlocked
      expect(isKingdomUnlocked(player, kingdom.id)).toBe(true);

      // 2. Play through all 5 levels with the exact minimum 2-star threshold
      kingdom.levels.forEach((level, lIdx) => {
        expect(isLevelUnlocked(player, kingdom, level)).toBe(true);

        const score = twoStarScores[lIdx];
        expect(computeStars(score, level.starThresholds)).toBe(2);

        player = applyLevelCompletion(player, kingdom.id, level, score);
        expect(player.levelProgress[level.id].completed).toBe(true);
        expect(player.levelProgress[level.id].stars).toBe(2);
      });

      // 3. Verify that 142 cumulative level XP satisfies pointsToUnlockNext (140)
      const kingdomXP = getKingdomXP(player, kingdom.id);
      expect(kingdomXP).toBe(142);
      expect(kingdomXP).toBeGreaterThanOrEqual(kingdom.pointsToUnlockNext);

      // 4. Verify next kingdom is unlocked
      const nextK = KINGDOMS[kIdx + 1];
      if (nextK) {
        expect(isKingdomUnlocked(player, nextK.id)).toBe(true);
      }
    });

    // All 40 levels completed with 2 stars!
    const completedCount = Object.values(player.levelProgress).filter((p) => p.completed).length;
    expect(completedCount).toBe(40);
  });

  it('correctly handles replay upgrades by adding only the XP difference', () => {
    let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    // Initially complete RTL-1 with 20 XP
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 20);
    expect(player.totalXP).toBe(20);
    expect(player.levelProgress['rtl-1'].xpEarned).toBe(20);
    expect(player.levelProgress['rtl-1'].stars).toBe(2);

    // Student replays and achieves perfect 30 XP (3 stars)
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 30);
    expect(player.totalXP).toBe(30);
    expect(player.levelProgress['rtl-1'].xpEarned).toBe(30);
    expect(player.levelProgress['rtl-1'].stars).toBe(3);
  });

  it('does not duplicate XP or downgrade score on repeat submissions with lower or equal score', () => {
    let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    // Complete RTL-1 with 30 XP
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 30);
    expect(player.totalXP).toBe(30);

    // Student plays again and gets 25 XP
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 25);
    expect(player.totalXP).toBe(30);
    expect(player.levelProgress['rtl-1'].xpEarned).toBe(30);
    expect(player.levelProgress['rtl-1'].stars).toBe(3);

    // Student plays again and gets 30 XP (exact tie)
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 30);
    expect(player.totalXP).toBe(30);
  });

  it('proves a fresh student playing normally from Kingdom 1 through Kingdom 8 unlocks all 8 kingdoms without progression deadlock', () => {
    let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    KINGDOMS.forEach((kingdom, kIdx) => {
      // 1. Verify this kingdom is unlocked
      expect(isKingdomUnlocked(player, kingdom.id)).toBe(true);

      // 2. Play through all 5 levels in sequence with max score
      kingdom.levels.forEach((level) => {
        expect(isLevelUnlocked(player, kingdom, level)).toBe(true);
        player = applyLevelCompletion(player, kingdom.id, level, level.xpReward);
        expect(player.levelProgress[level.id].completed).toBe(true);
      });

      // 3. Complete all stage sanity checks
      (kingdom.sanityChecks || []).forEach((check) => {
        player = applySanityCheckCompletion(player, kingdom.id, check, check.xpReward);
        expect(player.sanityCheckProgress[check.id].passed).toBe(true);
      });

      // 4. Verify kingdom completion
      expect(isKingdomCompleted(player, kingdom.id)).toBe(true);

      // 5. Verify next kingdom is unlocked (if not last)
      const nextK = KINGDOMS[kIdx + 1];
      if (nextK) {
        expect(isKingdomUnlocked(player, nextK.id)).toBe(true);
      }
    });

    // Grand achievement: All 8 kingdoms completed!
    expect(player.achievements).toContain('grandmaster');
    expect(player.totalXP).toBeGreaterThan(1600);
  });
});
