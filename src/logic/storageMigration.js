/**
 * storageMigration.js
 * ====================
 * Safe, versioned, idempotent player state migration for PD Playground.
 *
 * Requirements:
 * 1. Preserves player identity (name, avatarEmoji, createdAt).
 * 2. Automatic safety backup of v1 storage to 'pdplayground_player_v1_backup'.
 * 3. Distinguishes verifiable levels (implemented in activityRegistry) from legacy unverified records.
 * 4. Recomputes totalXP consistently to prevent desynchronized inflated totals.
 * 5. Idempotent: repeated migrations produce identical valid states.
 * 6. Handles corrupted or empty storage safely without crashing.
 */

import { DEFAULT_PLAYER } from '../data/playerDefaults.js';
import { hasActivity } from '../activities/activityRegistry.js';

export const CURRENT_SCHEMA_VERSION = 2;
export const STORAGE_KEY_V1 = 'pdplayground_player_v1';
export const STORAGE_KEY_V2 = 'pdplayground_player_v2';
export const STORAGE_BACKUP_KEY = 'pdplayground_player_v1_backup';

/**
 * Migrates a raw or parsed player state object to Schema v2.
 *
 * @param {Object|null} rawPlayer
 * @returns {Object} Migrated Schema v2 player state
 */
export function migratePlayerState(rawPlayer) {
  if (!rawPlayer || typeof rawPlayer !== 'object') {
    return {
      ...DEFAULT_PLAYER,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
    };
  }

  // If already migrated to current schema version, ensure structural integrity and return
  if (rawPlayer.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return ensureIntegrity(rawPlayer);
  }

  // Schema v1 -> Schema v2 migration
  const migrated = {
    ...DEFAULT_PLAYER,
    name: typeof rawPlayer.name === 'string' && rawPlayer.name.trim() ? rawPlayer.name : DEFAULT_PLAYER.name,
    avatarEmoji: typeof rawPlayer.avatarEmoji === 'string' ? rawPlayer.avatarEmoji : DEFAULT_PLAYER.avatarEmoji,
    createdAt: rawPlayer.createdAt || new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    legacyArchive: rawPlayer.legacyArchive || null,
  };

  const incomingLevelProgress = rawPlayer.levelProgress && typeof rawPlayer.levelProgress === 'object'
    ? rawPlayer.levelProgress
    : {};

  const cleanLevelProgress = {};
  const archivedLegacy = {};

  for (const [levelId, progress] of Object.entries(incomingLevelProgress)) {
    if (!progress || typeof progress !== 'object') continue;

    // Check if level has an actual implementation in the activity registry
    if (hasActivity(levelId)) {
      // Preserved level (e.g. rtl-1 verified challenge)
      cleanLevelProgress[levelId] = {
        completed: Boolean(progress.completed),
        stars: Math.max(0, Math.min(3, Number(progress.stars) || 0)),
        xpEarned: Math.max(0, Number(progress.xpEarned) || 0),
        verified: Boolean(progress.verified ?? true), // Existing rtl-1 completions preserved
        migratedAt: new Date().toISOString(),
      };
    } else if (progress.completed) {
      // Unimplemented level previously marked completed via legacy slider
      archivedLegacy[levelId] = {
        ...progress,
        archivedReason: 'Level activity currently under development. Revalidation required upon milestone release.',
      };
    }
  }

  migrated.levelProgress = cleanLevelProgress;

  if (Object.keys(archivedLegacy).length > 0) {
    migrated.legacyArchive = {
      migratedAt: new Date().toISOString(),
      unverifiedLevels: archivedLegacy,
    };
  }

  // Preserve sanityCheckProgress safely
  migrated.sanityCheckProgress = rawPlayer.sanityCheckProgress && typeof rawPlayer.sanityCheckProgress === 'object'
    ? rawPlayer.sanityCheckProgress
    : {};

  return ensureIntegrity(migrated);
}

/**
 * Recomputes derived totalXP and ensures non-corrupt object structure.
 */
function ensureIntegrity(player) {
  const levelXP = Object.values(player.levelProgress || {}).reduce((sum, item) => {
    return sum + (Number(item?.xpEarned) || 0);
  }, 0);

  const sanityXP = Object.values(player.sanityCheckProgress || {}).reduce((sum, item) => {
    return sum + (Number(item?.score) || 0);
  }, 0);

  return {
    ...player,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    totalXP: levelXP + sanityXP,
    levelProgress: player.levelProgress || {},
    sanityCheckProgress: player.sanityCheckProgress || {},
  };
}

/**
 * Helper to safely load and migrate player state from localStorage in the browser.
 */
export function loadAndMigrateStorage() {
  try {
    // 1. Try loading v2
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      return migratePlayerState(parsed);
    }

    // 2. Fall back to v1
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      // Create automatic safety backup if not already present
      if (!localStorage.getItem(STORAGE_BACKUP_KEY)) {
        try {
          localStorage.setItem(STORAGE_BACKUP_KEY, rawV1);
        } catch (e) {
          console.warn('Could not write storage backup:', e);
        }
      }

      const parsedV1 = JSON.parse(rawV1);
      const migrated = migratePlayerState(parsedV1);

      // Save to v2
      try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
      } catch (e) {
        console.warn('Could not save migrated v2 storage:', e);
      }

      return migrated;
    }
  } catch (err) {
    console.error('Failed to load/migrate player storage:', err);
  }

  // Fresh baseline
  return {
    ...DEFAULT_PLAYER,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
  };
}
