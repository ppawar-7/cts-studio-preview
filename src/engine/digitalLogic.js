/**
 * digitalLogic.js
 * ================
 * Pure deterministic digital logic simulation engine.
 * Powers RTL Kingdom educational activities (RTL-2 through RTL-5).
 *
 * Implements:
 * 1. D Flip-Flop with synchronous reset and clock enable.
 * 2. Cycle-by-cycle clock stepping and waveform history generation.
 * 3. Combinational vs Sequential propagation evaluation.
 * 4. Latch inference hazard checking.
 * 5. Pipelined 8-bit accumulator datapath simulation.
 * 6. Finite State Machine (Sequence Detector 1011) simulation.
 */

/**
 * Simulate a D Flip-Flop on a rising clock edge.
 *
 * Reset Priority: Synchronous active-high reset overrides enable and data input.
 * Enable Behavior: When EN=0, state Q is retained.
 *
 * @param {Object} params
 * @param {number} params.d - Data input (0 or 1)
 * @param {number} params.currentQ - Current registered state (0 or 1)
 * @param {number} params.rst - Synchronous reset (0 or 1)
 * @param {number} params.en - Clock enable (0 or 1)
 * @returns {number} Next Q state (0 or 1)
 */
export function simulateDFF({ d, currentQ, rst, en }) {
  if (rst === 1) {
    return 0;
  }
  if (en === 0) {
    return currentQ;
  }
  return d === 1 ? 1 : 0;
}

/**
 * Simulate a multi-cycle sequence of inputs applied to a D Flip-Flop.
 *
 * @param {Array<{ d: number, rst: number, en: number }>} cycleInputs
 * @param {number} [initialQ=0]
 * @returns {Array<{ cycle: number, clk: number, d: number, rst: number, en: number, q: number }>}
 */
export function simulateDFFSequence(cycleInputs, initialQ = 0) {
  let q = initialQ;
  const history = [];

  cycleInputs.forEach((inp, idx) => {
    const nextQ = simulateDFF({
      d: inp.d,
      currentQ: q,
      rst: inp.rst,
      en: inp.en,
    });
    history.push({
      cycle: idx + 1,
      clk: 1, // sample on rising edge
      d: inp.d,
      rst: inp.rst,
      en: inp.en,
      q: nextQ,
      prevQ: q,
    });
    q = nextQ;
  });

  return history;
}

/**
 * Simulate combinational vs sequential paths for comparison.
 * Combinational: output updates immediately based on current input: Y_comb = A & B.
 * Sequential: output updates only at clock edge into register: Y_seq <= A & B.
 *
 * @param {Array<{ a: number, b: number }>} inputs
 * @param {number} [initialQ=0]
 * @returns {Array<{ cycle: number, a: number, b: number, combY: number, seqY: number }>}
 */
export function simulateCombVsSeq(inputs, initialQ = 0) {
  let regQ = initialQ;
  return inputs.map((inp, idx) => {
    const combY = (inp.a === 1 && inp.b === 1) ? 1 : 0;
    const seqY = regQ; // captured from previous cycle
    regQ = combY; // latch for next cycle
    return {
      cycle: idx + 1,
      a: inp.a,
      b: inp.b,
      combY,
      seqY,
    };
  });
}

/**
 * Check for latch inference hazards in an RTL conditional block.
 * An incomplete conditional without a default/else branch in combinational logic
 * causes the synthesizer to infer an unwanted transparent latch.
 *
 * @param {Object} codeModel
 * @param {boolean} codeModel.hasElse - Whether the conditional has an 'else' branch
 * @param {boolean} codeModel.isClocked - Whether the block is inside an edge-triggered always block
 * @returns {{ hasLatch: boolean, explanation: string }}
 */
export function evaluateLatchInference({ hasElse, isClocked }) {
  if (isClocked) {
    return {
      hasLatch: false,
      explanation: 'Sequential logic (always @(posedge clk)) safely infers D Flip-Flops; missing branches preserve registered state without transparent latches.',
    };
  }
  if (!hasElse) {
    return {
      hasLatch: true,
      explanation: 'Combinational logic (always @* or always_comb) with an incomplete if-branch infers an unwanted transparent latch because the output must hold its prior value when the condition is false.',
    };
  }
  return {
    hasLatch: false,
    explanation: 'Fully specified combinational logic with an else branch safely synthesizes into combinational multiplexers and logic gates without latches.',
  };
}

/**
 * Simulate an 8-bit accumulator datapath with synchronous reset and overflow detection.
 * Datapath: NextAcc = (MuxSel === 1 ? InData : Acc) + Operand;
 * Output: Acc (8-bit clamped: 0-255), Overflow: bool (sum > 255).
 *
 * @param {Object} state
 * @param {number} state.currentAcc - Current accumulator value (0-255)
 * @param {number} state.inData - External 8-bit input data (0-255)
 * @param {number} state.operand - Addend value (0-255)
 * @param {number} state.muxSel - 0: preserve currentAcc as base, 1: load inData as base
 * @param {number} state.rst - Synchronous reset (1 resets Acc to 0)
 * @returns {{ nextAcc: number, overflow: boolean }}
 */
export function simulateAccumulator({ currentAcc, inData, operand, muxSel, rst }) {
  if (rst === 1) {
    return { nextAcc: 0, overflow: false };
  }
  const base = muxSel === 1 ? (inData & 0xff) : (currentAcc & 0xff);
  const sum = base + (operand & 0xff);
  const overflow = sum > 255;
  const nextAcc = sum & 0xff;
  return { nextAcc, overflow };
}

/**
 * Finite State Machine: 1011 Sequence Detector (Overlapping).
 * States:
 *   S0 (IDLE, looking for '1')
 *   S1 (Saw '1', looking for '0')
 *   S2 (Saw '10', looking for '1')
 *   S3 (Saw '101', looking for '1')
 * Output MATCH is asserted when pattern 1011 is completed.
 *
 * @param {string} currentState - 'S0' | 'S1' | 'S2' | 'S3'
 * @param {number} bitIn - Input bit (0 or 1)
 * @returns {{ nextState: string, match: boolean }}
 */
export function stepSequenceDetector1011(currentState, bitIn) {
  const b = bitIn === 1 ? 1 : 0;
  switch (currentState) {
    case 'S0':
      return b === 1 ? { nextState: 'S1', match: false } : { nextState: 'S0', match: false };
    case 'S1':
      return b === 0 ? { nextState: 'S2', match: false } : { nextState: 'S1', match: false };
    case 'S2':
      return b === 1 ? { nextState: 'S3', match: false } : { nextState: 'S0', match: false };
    case 'S3':
      // Saw '101'. If bitIn is 1, we completed '1011'!
      // For overlapping detection, '1011' ends in '1', which can be the start of a new sequence -> nextState is S1.
      return b === 1 ? { nextState: 'S1', match: true } : { nextState: 'S2', match: false };
    default:
      return { nextState: 'S0', match: false };
  }
}

/**
 * Run a multi-bit stream through the 1011 Sequence Detector.
 *
 * @param {Array<number>} bitStream - e.g. [1, 0, 1, 1, 0, 1, 1]
 * @returns {Array<{ cycle: number, bitIn: number, state: string, nextState: string, match: boolean }>}
 */
export function simulateSequenceDetector(bitStream) {
  let state = 'S0';
  return bitStream.map((bitIn, idx) => {
    const { nextState, match } = stepSequenceDetector1011(state, bitIn);
    const step = {
      cycle: idx + 1,
      bitIn,
      state,
      nextState,
      match,
    };
    state = nextState;
    return step;
  });
}
