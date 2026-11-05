/**
 * floorplanCurriculumReview.test.js
 * =================================
 * Acceptance-review checks for the expanded Floorplanning lessons (fp-6 … fp-36).
 * Guards against the original defects:
 *   - 14 lessons shared one generic two-option quiz whose "correct" option auto-filled the validator
 *   - FP-24 and FP-36 passed on self-attested checkboxes instead of authentic EDA project evaluation
 */

import { describe, it, expect } from 'vitest';
import { EXPANDED_LESSONS } from '../../activities/floorplanning/expanded/fpExpandedCurriculumData.js';
import {
  createDefaultProject,
  EXAMPLE_DUAL_SRAM_CONTROLLER,
  EXAMPLE_SMALL_SOC_SUBSYSTEM,
  SCENARIO_SMALL_SOC,
} from '../../engine/floorplanProjectModel.js';

const clone = (o) => JSON.parse(JSON.stringify(o));

// Numeric answers computed by hand from each lesson's stated parameters.
const NUMERIC = {
  'fp-6': { aspectRatio: 0.6 },                        // 300 / 500
  'fp-7': { stdCellArea: 1250000, requiredCoreArea: 1785714 }, // 100k × 12.5 ; / 0.70
  'fp-8': { rowCount: 128 },                           // floor(350 / 2.72) = 128
  'fp-11': { requiredSeparation: 35 },                 // 15 + 20
  'fp-14': { pinCoord1: 100, pinCoord2: 130 },         // 30 µm ≥ 10 µm pitch
  'fp-18': { calculatedDrop: 30 },                     // 20 mA × 1.5 Ω
};

function product(lists) {
  return lists.reduce((acc, list) => acc.flatMap((a) => list.map((b) => [...a, b])), [[]]);
}

describe('Expanded lessons use lesson-specific questions', () => {
  const quizLessons = Object.values(EXPANDED_LESSONS).filter((l) => l.id !== 'fp-7' && l.id !== 'fp-24' && l.id !== 'fp-36');

  it('every lesson except numeric fp-7 and capstones fp-24/fp-36 has its own questions', () => {
    quizLessons.forEach((l) => expect(Array.isArray(l.questions) && l.questions.length > 0, l.id).toBe(true));
  });

  it('no two lessons share the same question prompt', () => {
    const prompts = quizLessons.flatMap((l) => l.questions.map((q) => q.prompt));
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  quizLessons.forEach((lesson) => {
    it(`${lesson.id}: each question has ≥3 distinct options and exactly one passing answer set`, () => {
      lesson.questions.forEach((q) => {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(q.options.map((o) => o.value)).size).toBe(q.options.length);
      });
      const combos = product(lesson.questions.map((q) => q.options.map((o) => [q.field, o.value])));
      const passing = combos.filter((combo) => {
        const inputs = { ...(NUMERIC[lesson.id] || {}), ...Object.fromEntries(combo) };
        return lesson.validate(inputs).passed;
      });
      expect(passing.length).toBe(1);
    });

    it(`${lesson.id}: correct concept answers alone do not pass when numeric work is required`, () => {
      if (!NUMERIC[lesson.id]) return;
      const combos = product(lesson.questions.map((q) => q.options.map((o) => [q.field, o.value])));
      expect(combos.some((c) => lesson.validate(Object.fromEntries(c)).passed)).toBe(false);
    });
  });
});

describe('FP-14 grades the pin coordinates with the pin-spacing rule', () => {
  const v = EXPANDED_LESSONS['fp-14'].validate;
  it('rejects a 4 µm pitch and out-of-edge coordinates', () => {
    expect(v({ pinCoord1: 100, pinCoord2: 104, pinPitchQuiz: 'prevent-shorts' }).passed).toBe(false);
    expect(v({ pinCoord1: 100, pinCoord2: 520, pinPitchQuiz: 'prevent-shorts' }).passed).toBe(false);
  });
  it('accepts exactly the 10 µm minimum', () => {
    expect(v({ pinCoord1: 100, pinCoord2: 110, pinPitchQuiz: 'prevent-shorts' }).passed).toBe(true);
  });
});

describe('FP-24 grades the real Studio project', () => {
  const v = EXPANDED_LESSONS['fp-24'].validate;
  it('fails without a project, even with every legacy checkbox ticked', () => {
    expect(v({ macrosPlaced: 4, powerStrapsConnected: true, drcPassed: true }).passed).toBe(false);
  });
  it('fails the untouched default 2-macro project', () => {
    expect(v({ project: createDefaultProject('x', 'beginner') }).passed).toBe(false);
  });
  it('fails the unrepaired benchmarks', () => {
    expect(v({ project: clone(EXAMPLE_DUAL_SRAM_CONTROLLER) }).passed).toBe(false);
    expect(v({ project: clone(EXAMPLE_SMALL_SOC_SUBSYSTEM) }).passed).toBe(false);
  });
  it('passes the Dual SRAM benchmark after its missing via is added', () => {
    const p = clone(EXAMPLE_DUAL_SRAM_CONTROLLER);
    p.powerNetwork.vias.push({ id: 'v2', layer1: 'M4', layer2: 'M5', x: 460, y: 180, net: 'VDD' });
    const r = v({ project: p });
    expect(r.passed).toBe(true);
    expect(r.stars).toBe(3);
  });
  it('passes the Small SoC benchmark after the 3 µm pin pitch is repaired', () => {
    const p = clone(EXAMPLE_SMALL_SOC_SUBSYSTEM);
    p.pins.find((x) => x.id === 'pin_irq1').coord = 140;
    expect(v({ project: p }).passed).toBe(true);
  });
  it('fails again if the student then drags a macro into another', () => {
    const p = clone(EXAMPLE_DUAL_SRAM_CONTROLLER);
    p.powerNetwork.vias.push({ id: 'v2', layer1: 'M4', layer2: 'M5', x: 460, y: 180, net: 'VDD' });
    p.macros[1].y = 80; // SRAM_B onto SRAM_A
    expect(v({ project: p }).passed).toBe(false);
  });
});

describe('FP-36 grades the real Studio project for the 6+ macro Expert SoC', () => {
  const v = EXPANDED_LESSONS['fp-36'].validate;

  it('fails without a project', () => {
    expect(v({ socSignoffQuiz: 'all-signoff-gates' }).passed).toBe(false);
  });

  it('fails a 4-macro project because FP-36 requires at least 6 macros', () => {
    const p = clone(EXAMPLE_DUAL_SRAM_CONTROLLER);
    p.powerNetwork.vias.push({ id: 'v2', layer1: 'M4', layer2: 'M5', x: 460, y: 180, net: 'VDD' });
    expect(v({ project: p, socSignoffQuiz: 'all-signoff-gates' }).passed).toBe(false);
  });

  it('passes a legal 6-macro SoC with continuous PDN and IR drop <= 30 mV', () => {
    const p = clone(SCENARIO_SMALL_SOC);
    // SCENARIO_SMALL_SOC already has 5 legal macros. Add a 6th non-overlapping macro.
    p.macros.push({
      id: 'ROM_BOOT',
      masterId: 'ROM_16KB',
      name: 'Boot ROM',
      x: 300,
      y: 320,
      width: 100,
      height: 80,
      orientation: 'R0',
      halo: 15,
      fixed: false,
    });
    // Widen power straps to meet <= 30 mV static IR drop budget
    p.powerNetwork.straps.forEach((s) => {
      s.width = 10;
    });

    const res = v({ project: p, socSignoffQuiz: 'all-signoff-gates' });
    expect(res.passed).toBe(true);
    expect(res.score).toBe(100);
    expect(res.stars).toBe(3);
  });
});
