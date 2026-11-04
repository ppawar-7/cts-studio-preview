import { describe, it, expect } from 'vitest';
import { getActivity, hasActivity } from '../../activities/activityRegistry.js';
import { KINGDOMS } from '../../data/kingdomsData.js';

describe('Activity Registry & Unimplemented Level Fallback', () => {
  it('registers rtl-1 with valid component, validator, and metadata', () => {
    expect(hasActivity('rtl-1')).toBe(true);
    const desc = getActivity('rtl-1');
    expect(desc).not.toBeNull();
    expect(desc.levelId).toBe('rtl-1');
    expect(desc.kingdomId).toBe('rtl-understanding');
    expect(desc.maxScore).toBe(30);
    expect(desc.starThresholds).toEqual([10, 20, 30]);
    expect(typeof desc.validator).toBe('function');
    expect(desc.component).toBeDefined();
  });

  it('correctly reports unimplemented status for other levels across kingdoms', () => {
    const unimplementedLevels = ['rtl-2', 'rtl-3', 'syn-1', 'fp-1', 'cts-1', 'gds-5'];
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
