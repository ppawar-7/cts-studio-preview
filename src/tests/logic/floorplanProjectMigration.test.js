/**
 * floorplanProjectMigration.test.js
 * =================================
 * Validates backward compatibility of player state migration and FloorplanProject persistence.
 */

import { describe, it, expect } from 'vitest';
import { migratePlayerState } from '../../logic/storageMigration.js';
import {
  createDefaultProject,
  serializeProject,
  deserializeProject,
  migrateProject,
} from '../../engine/floorplanProjectModel.js';

describe('Floorplanning 2.0 Persistence & Player Migration Compatibility', () => {
  it('preserves existing fp-1 through fp-5 level completion and stars when migrating', () => {
    const legacyPlayer = {
      version: 1,
      totalXP: 145,
      levelProgress: {
        'fp-1': { completed: true, score: 30, stars: 3 },
        'fp-2': { completed: true, score: 35, stars: 3 },
        'fp-3': { completed: true, score: 40, stars: 3 },
        'fp-4': { completed: true, score: 40, stars: 2 },
      },
      sanityCheckProgress: {
        'fp-drc': { passed: true, score: 25 },
      },
    };

    const migrated = migratePlayerState(legacyPlayer);
    expect(migrated.levelProgress['fp-1'].completed).toBe(true);
    expect(migrated.levelProgress['fp-2'].completed).toBe(true);
    expect(migrated.levelProgress['fp-3'].completed).toBe(true);
    expect(migrated.levelProgress['fp-4'].completed).toBe(true);
    expect(migrated.levelProgress['fp-4'].stars).toBe(2);
    expect(migrated.sanityCheckProgress['fp-drc'].passed).toBe(true);
  });

  it('FloorplanProject serializes and deserializes independently without polluting player schema', () => {
    const project = createDefaultProject('Independent Project', 'beginner');
    const json = serializeProject(project);

    // Stored independently
    const loaded = deserializeProject(json);
    expect(loaded.projectId).toBe(project.projectId);
    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.macros.length).toBe(project.macros.length);
  });

  it('migrateProject safely recovers corrupted or missing properties', () => {
    const corrupted = {
      projectId: 'partial_proj',
      macros: [{ id: 'SRAM_1', x: 20, y: 30 }], // Missing dimensions, halo, orientation
    };

    const recovered = migrateProject(corrupted);
    expect(recovered.schemaVersion).toBe(1);
    expect(recovered.die.width).toBeGreaterThan(0);
    expect(recovered.macros[0].width).toBe(60); // Default applied
    expect(recovered.macros[0].orientation).toBe('R0');
    expect(recovered.powerNetwork.rings.length).toBeGreaterThan(0);
  });
});
