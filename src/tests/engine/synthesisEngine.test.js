import { describe, it, expect } from 'vitest';
import {
  EDUCATIONAL_CELL_LIBRARY,
  evaluateMappedNetwork,
  computeSetupSlack,
  verifyBooleanEquivalence3,
} from '../../engine/synthesisEngine.js';

describe('Synthesis Engine', () => {
  it('calculates total area and delay for standard-cell networks', () => {
    const cells = ['NAND2_X1', 'INV_X1'];
    const metrics = evaluateMappedNetwork(cells, [[0, 1]]);
    expect(metrics.totalArea).toBe(2.5); // 1.5 + 1.0
    expect(metrics.maxDelay).toBe(0.13); // 0.08 + 0.05
    expect(metrics.cellCount).toBe(2);
  });

  it('computes setup slack and flags positive vs negative slack', () => {
    // 1.0 ns period, 0.5 ns comb delay -> arrival = 0.15 + 0.5 = 0.65; required = 1.0 - 0.08 = 0.92; slack = +0.27
    const met = computeSetupSlack({ clockPeriod: 1.0, combDelay: 0.5 });
    expect(met.arrival).toBe(0.65);
    expect(met.required).toBe(0.92);
    expect(met.slack).toBe(0.27);
    expect(met.isMet).toBe(true);

    // 1.0 ns period, 0.9 ns comb delay -> arrival = 1.05; required = 0.92; slack = -0.13
    const violated = computeSetupSlack({ clockPeriod: 1.0, combDelay: 0.9 });
    expect(violated.slack).toBe(-0.13);
    expect(violated.isMet).toBe(false);
  });

  it('verifies Boolean equivalence across exhaustive 3-input space', () => {
    // Original: (A & B) | (A & C)
    const orig = (a, b, c) => (a && b) || (a && c) ? 1 : 0;
    // Factored: A & (B | C)
    const factored = (a, b, c) => a && (b || c) ? 1 : 0;
    // Erroneous: A & B & C
    const erroneous = (a, b, c) => a && b && c ? 1 : 0;

    expect(verifyBooleanEquivalence3(orig, factored).isEquivalent).toBe(true);
    const checkBad = verifyBooleanEquivalence3(orig, erroneous);
    expect(checkBad.isEquivalent).toBe(false);
    expect(checkBad.mismatchRow).not.toBeNull();
  });
});
