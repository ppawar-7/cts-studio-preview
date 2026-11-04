import { describe, it, expect } from 'vitest';
import {
  isLevelUnlocked,
  getLevelStatus,
  isKingdomUnlocked,
  isKingdomCompleted,
  getKingdomXP,
  applyLevelCompletion,
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

  it('preserves canonical IDs, reward caps, and unlock thresholds', () => {
    expect(rtlKingdom.pointsToUnlockNext).toBe(150);
    expect(rtlKingdom.levels).toHaveLength(5);

    expect(rtl1.pointsRequired).toBe(0);
    expect(rtl1.xpReward).toBe(30);

    expect(rtl2.pointsRequired).toBe(25);
    expect(rtl2.xpReward).toBe(35);

    expect(rtl3.pointsRequired).toBe(55);
    expect(rtl3.xpReward).toBe(40);

    expect(rtl4.pointsRequired).toBe(90);
    expect(rtl4.xpReward).toBe(45);

    expect(rtl5.pointsRequired).toBe(130);
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

  it('allows student with defined minimum passing scores (2 stars) to unlock every subsequent level', () => {
    let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    // Step 1: Pass RTL-1 with 25 XP (Truth table complete, concept question skipped or missed)
    // 25 XP achieves 2 stars (starThresholds: [10, 20, 30])
    expect(computeStars(25, rtl1.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 25);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(25);
    expect(player.totalXP).toBe(25);
    expect(isLevelUnlocked(player, rtlKingdom, rtl2)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl2)).toBe('available');
    expect(isLevelUnlocked(player, rtlKingdom, rtl3)).toBe(false);

    // Step 2: Pass RTL-2 with 30 XP (out of 35 max, earning 2 stars since 30 >= 24)
    expect(computeStars(30, rtl2.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl2, 30);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(55);
    expect(player.totalXP).toBe(55);
    expect(isLevelUnlocked(player, rtlKingdom, rtl3)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl3)).toBe('available');
    expect(isLevelUnlocked(player, rtlKingdom, rtl4)).toBe(false);

    // Step 3: Pass RTL-3 with 35 XP (out of 40 max, earning 2 stars since 35 >= 28)
    expect(computeStars(35, rtl3.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl3, 35);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(90);
    expect(player.totalXP).toBe(90);
    expect(isLevelUnlocked(player, rtlKingdom, rtl4)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl4)).toBe('available');
    expect(isLevelUnlocked(player, rtlKingdom, rtl5)).toBe(false);

    // Step 4: Pass RTL-4 with 40 XP (out of 45 max, earning 2 stars since 40 >= 32)
    expect(computeStars(40, rtl4.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl4, 40);

    expect(getKingdomXP(player, 'rtl-understanding')).toBe(130);
    expect(player.totalXP).toBe(130);
    expect(isLevelUnlocked(player, rtlKingdom, rtl5)).toBe(true);
    expect(getLevelStatus(player, rtlKingdom, rtl5)).toBe('available');

    // Step 5: Pass RTL-5 with 40 XP (out of 50 max, earning 2 stars since 40 >= 38)
    expect(computeStars(40, rtl5.starThresholds)).toBe(2);
    player = applyLevelCompletion(player, 'rtl-understanding', rtl5, 40);

    // Cumulative XP = 25 + 30 + 35 + 40 + 40 = 170 XP from levels
    expect(getKingdomXP(player, 'rtl-understanding')).toBe(170);
    // Upon completing all 5 levels and sanity checks, engine awards 50 bonus XP: 170 + 50 = 220
    expect(player.totalXP).toBe(220);

    // Kingdom completion: 170 >= 150 pointsToUnlockNext, all 5 levels completed
    expect(isKingdomCompleted(player, 'rtl-understanding')).toBe(true);
    expect(isKingdomUnlocked(player, 'synthesis')).toBe(true);
  });

  it('correctly handles replay upgrades by adding only the XP difference', () => {
    let player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));

    // Initially complete RTL-1 with 25 XP
    player = applyLevelCompletion(player, 'rtl-understanding', rtl1, 25);
    expect(player.totalXP).toBe(25);
    expect(player.levelProgress['rtl-1'].xpEarned).toBe(25);
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
});
