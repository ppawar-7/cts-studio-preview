import { describe, it, expect } from 'vitest';
import { getActivity, hasActivity } from '../../activities/activityRegistry.js';
import { KINGDOMS } from '../../data/kingdomsData.js';

describe('Activity Registry & Unimplemented Level Fallback', () => {
  it('registers all 5 RTL Kingdom levels with valid components and validators', () => {
    const rtlLevels = ['rtl-1', 'rtl-2', 'rtl-3', 'rtl-4', 'rtl-5'];
    for (const lvlId of rtlLevels) {
      expect(hasActivity(lvlId)).toBe(true);
      const desc = getActivity(lvlId);
      expect(desc).not.toBeNull();
      expect(desc.levelId).toBe(lvlId);
      expect(desc.kingdomId).toBe('rtl-understanding');
      expect(desc.maxScore).toBeGreaterThan(0);
      expect(desc.starThresholds).toHaveLength(3);
      expect(typeof desc.validator).toBe('function');
      expect(desc.component).toBeDefined();
    }
  });

  it('correctly reports unimplemented status for levels in upcoming kingdoms', () => {
    const unimplementedLevels = ['syn-1', 'fp-1', 'cts-1', 'gds-5'];
    for (const lvlId of unimplementedLevels) {
      expect(hasActivity(lvlId)).toBe(false);
      expect(getActivity(lvlId)).toBeNull();
    }
  });

  it('preserves all 8 canonical kingdoms and their 5 levels each', () => {
    expect(KINGDOMS).toHaveLength(8);
    const expectedKingdomIds = [
      'rtl-understanding',
      'synthesis',
      'floorplanning',
      'placement',
      'cts',
      'routing',
      'filler-cells',
      'gds',
    ];
    expect(KINGDOMS.map((k) => k.id)).toEqual(expectedKingdomIds);
    for (const k of KINGDOMS) {
      expect(k.levels).toHaveLength(5);
    }
  });
});
