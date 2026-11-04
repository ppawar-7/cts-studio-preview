import { describe, it, expect } from 'vitest';
import {
  migratePlayerState,
  CURRENT_SCHEMA_VERSION,
} from '../../logic/storageMigration.js';

describe('Player Storage Migration (v1 -> v2)', () => {
  it('creates clean baseline state when given null or empty object', () => {
    const res = migratePlayerState(null);
    expect(res.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(res.name).toBe('Student Explorer');
    expect(res.totalXP).toBe(0);
    expect(res.levelProgress).toEqual({});
  });

  it('preserves user identity and verified rtl-1 completion', () => {
    const v1State = {
      name: 'Elena',
      avatarEmoji: '🔬',
      createdAt: '2026-10-20T12:00:00.000Z',
      levelProgress: {
        'rtl-1': { completed: true, stars: 3, xpEarned: 30 },
      },
    };

    const res = migratePlayerState(v1State);
    expect(res.schemaVersion).toBe(2);
    expect(res.name).toBe('Elena');
    expect(res.avatarEmoji).toBe('🔬');
    expect(res.createdAt).toBe('2026-10-20T12:00:00.000Z');
    expect(res.levelProgress['rtl-1'].completed).toBe(true);
    expect(res.levelProgress['rtl-1'].xpEarned).toBe(30);
    expect(res.levelProgress['rtl-1'].stars).toBe(3);
    expect(res.totalXP).toBe(30);
    expect(res.legacyArchive).toBeNull();
  });

  it('isolates unverified unimplemented levels into legacyArchive while keeping player identity', () => {
    const legacyStateWithSliderCheats = {
      name: 'Dave',
      avatarEmoji: '🚀',
      totalXP: 100, // inflated total
      levelProgress: {
        'rtl-1': { completed: true, stars: 3, xpEarned: 30 },
        'rtl-2': { completed: true, stars: 3, xpEarned: 35 }, // unimplemented level
        'syn-1': { completed: true, stars: 3, xpEarned: 35 }, // unimplemented level
      },
    };

    const res = migratePlayerState(legacyStateWithSliderCheats);
    expect(res.name).toBe('Dave');
    // rtl-1 verified is kept
    expect(res.levelProgress['rtl-1']).toBeDefined();
    expect(res.levelProgress['rtl-1'].completed).toBe(true);
    // rtl-2 and syn-1 are not in active levelProgress because no validator exists
    expect(res.levelProgress['rtl-2']).toBeUndefined();
    expect(res.levelProgress['syn-1']).toBeUndefined();
    // They are safely stored in legacyArchive
    expect(res.legacyArchive).not.toBeNull();
    expect(res.legacyArchive.unverifiedLevels['rtl-2'].xpEarned).toBe(35);
    expect(res.legacyArchive.unverifiedLevels['syn-1'].xpEarned).toBe(35);
    // Derived totalXP is corrected to verified only (30 XP)
    expect(res.totalXP).toBe(30);
  });

  it('is completely idempotent (repeated migration produces identical state)', () => {
    const initial = {
      name: 'Bob',
      levelProgress: {
        'rtl-1': { completed: true, stars: 2, xpEarned: 25 },
      },
    };

    const pass1 = migratePlayerState(initial);
    const pass2 = migratePlayerState(pass1);

    expect(pass2.schemaVersion).toBe(pass1.schemaVersion);
    expect(pass2.name).toBe(pass1.name);
    expect(pass2.totalXP).toBe(pass1.totalXP);
    expect(pass2.levelProgress).toEqual(pass1.levelProgress);
  });
});
