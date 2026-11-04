/**
 * SynCapstoneChallenge.jsx
 * =========================
 * Capstone challenge for Level 5 (syn-5): Synthesis Kingdom Challenge.
 */

import React, { useState } from 'react';
import {
  validateSynCapstone,
  CORRECT_CAPSTONE_CELLS_ID,
  CORRECT_QOR_CONCEPT_ID,
} from './validators/validateSynCapstone.js';
import './SynCapstoneChallenge.css';

export default function SynCapstoneChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [cellMappingChoice, setCellMappingChoice] = useState('');
  const [computedArea, setComputedArea] = useState('');
  const [computedDelay, setComputedDelay] = useState('');
  const [computedSlack, setComputedSlack] = useState('');
  const [qorConcept, setQorConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateSynCapstone({
      cellMappingChoice,
      computedArea,
      computedDelay,
      computedSlack,
      qorConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="syn-capstone-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          👑 Synthesis Kingdom Capstone: ALU Slice Synthesis &amp; Timing Closure
        </h3>
        <p className="combseq-desc">
          Design problem: Synthesize a 1-bit dual-operation ALU slice computing:
          <code>assign Y = OP ? (A ^ B) : (A &amp; B);</code>
          Target constraints: <strong>Combinational Delay T_comb &le; 0.40 ns</strong>, <strong>Total Area &le; 10.0 GE</strong>, Clock Period T_clk = 0.70 ns (T_cq = 0.15 ns, T_setup = 0.08 ns).
        </p>
      </div>

      {/* Step 1: Cell Mapping */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          🧩 Step 1: Select Technology Mapping
        </h4>
        <p className="dff-challenge__subtext">
          Choose the mapping configuration that achieves minimum area while satisfying T_comb &le; 0.40 ns:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label className={`mux-quiz-option ${cellMappingChoice === CORRECT_CAPSTONE_CELLS_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="capstoneMapping"
              value={CORRECT_CAPSTONE_CELLS_ID}
              checked={cellMappingChoice === CORRECT_CAPSTONE_CELLS_ID}
              onChange={(e) => setCellMappingChoice(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>AND2_X1 + XOR2_X1 + MUX2_X1:</strong> Parallel AND (0.12 ns) and XOR (0.20 ns) feeding dedicated multiplexer (0.18 ns). Area = 2.0 + 3.0 + 3.5 = 8.5 GE. Critical delay = max(0.12, 0.20) + 0.18 = 0.38 ns (Meets T_comb &le; 0.40 ns).
            </span>
          </label>

          <label className="mux-quiz-option">
            <input
              type="radio"
              name="capstoneMapping"
              value="opt-discrete-slow"
              checked={cellMappingChoice === 'opt-discrete-slow'}
              onChange={(e) => setCellMappingChoice(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              AND2_X1 + XOR2_X1 + Discrete AND-OR-INV Mux: Area = 12.0 GE, Delay = 0.50 ns (Violates delay constraint 0.50 &gt; 0.40 ns).
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: Quality of Results Metrics */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📊 Step 2: Compute QoR Metrics for Chosen Design
        </h4>
        <p className="dff-challenge__subtext">
          Enter the calculated metrics for your selected mapping:
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Total Cell Area (GE):</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 8.5"
              className="syn-opt-input"
              value={computedArea}
              onChange={(e) => setComputedArea(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Critical Path Delay (ns):</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.38"
              className="syn-opt-input"
              value={computedDelay}
              onChange={(e) => setComputedDelay(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Setup Slack (ns) @ T_clk=0.70ns:</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. +0.09"
              className="syn-opt-input"
              value={computedSlack}
              onChange={(e) => setComputedSlack(e.target.value)}
            />
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
          💡 Slack formula: T_required (0.70 - 0.08 = 0.62) - T_arrival (0.15 + 0.38 = 0.53) = +0.09 ns.
        </p>
      </div>

      {/* Step 3: QoR PPA Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🧠 Step 3: PPA Trade-offs in Synthesis
        </h4>
        <div className="mux-quiz-prompt">
          In ASIC physical design, what does the term <strong>PPA Pareto Frontier</strong> represent during logic synthesis?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="PPA Pareto Frontier question">
          <label className={`mux-quiz-option ${qorConcept === CORRECT_QOR_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="qorQuiz"
              value={CORRECT_QOR_CONCEPT_ID}
              checked={qorConcept === CORRECT_QOR_CONCEPT_ID}
              onChange={(e) => setQorConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>The multi-objective trade-off boundary between Power, Performance (Timing), and Area:</strong> You cannot improve one metric without trading off another (e.g. higher-drive cells reduce delay but increase silicon area and leakage power; lower-threshold transistors switch faster but leak more current).
            </span>
          </label>

          <label className={`mux-quiz-option ${qorConcept === 'opt-ppa-free' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="qorQuiz"
              value="opt-ppa-free"
              checked={qorConcept === 'opt-ppa-free'}
              onChange={(e) => setQorConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Zero-cost scaling:</strong> Synthesis tools can achieve infinite clock frequency with zero area and zero power simultaneously.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Synthesis Capstone Certified!' : '⚠️ Capstone Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          👑 Certify Synthesis Kingdom &amp; Unlock Floorplanning
        </button>
      </div>
    </div>
  );
}
