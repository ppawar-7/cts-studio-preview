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
    }
  });

  it('registers all 5 Synthesis Kingdom levels with valid components and validators', () => {
    const synLevels = ['syn-1', 'syn-2', 'syn-3', 'syn-4', 'syn-5'];
    for (const lvlId of synLevels) {
      expect(hasActivity(lvlId)).toBe(true);
      const desc = getActivity(lvlId);
      expect(desc).not.toBeNull();
      expect(desc.levelId).toBe(lvlId);
      expect(desc.kingdomId).toBe('synthesis');
    }
  });

  it('registers all 5 Floorplanning Kingdom levels with valid components and validators', () => {
    const fpLevels = ['fp-1', 'fp-2', 'fp-3', 'fp-4', 'fp-5'];
    for (const lvlId of fpLevels) {
      expect(hasActivity(lvlId)).toBe(true);
      const desc = getActivity(lvlId);
      expect(desc).not.toBeNull();
      expect(desc.levelId).toBe(lvlId);
      expect(desc.kingdomId).toBe('floorplanning');
    }
  });

  it('registers all 5 Placement Kingdom levels with valid components and validators', () => {
    const plLevels = ['pl-1', 'pl-2', 'pl-3', 'pl-4', 'pl-5'];
    for (const lvlId of plLevels) {
      expect(hasActivity(lvlId)).toBe(true);
      const desc = getActivity(lvlId);
      expect(desc).not.toBeNull();
      expect(desc.levelId).toBe(lvlId);
      expect(desc.kingdomId).toBe('placement');
    }
  });

  it('registers all 5 CTS Kingdom levels with valid components and validators', () => {
    const ctsLevels = ['cts-1', 'cts-2', 'cts-3', 'cts-4', 'cts-5'];
    for (const lvlId of ctsLevels) {
      expect(hasActivity(lvlId)).toBe(true);
      const desc = getActivity(lvlId);
      expect(desc).not.toBeNull();
      expect(desc.levelId).toBe(lvlId);
      expect(desc.kingdomId).toBe('cts');
    }
  });

  it('registers all 5 Routing Kingdom levels with valid components and validators', () => {
    const rtLevels = ['rt-1', 'rt-2', 'rt-3', 'rt-4', 'rt-5'];
    for (const lvlId of rtLevels) {
      expect(hasActivity(lvlId)).toBe(true);
      const desc = getActivity(lvlId);
      expect(desc).not.toBeNull();
      expect(desc.levelId).toBe(lvlId);
      expect(desc.kingdomId).toBe('routing');
    }
  });

  it('correctly reports unimplemented status for levels in upcoming kingdoms', () => {
    const unimplementedLevels = ['fc-1', 'gds-5'];
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
      expect(k.levels).toBeDefined();
      expect(k.levels.length).toBe(5);
    }
  });
});
