/**
 * CTSIntroChallenge.jsx
 * =====================
 * Interactive challenge for Level 1 (cts-1): What is CTS?
 * Teaches clock distribution networks, ideal vs propagated clocks, and
 * explicitly clarifies: STA is NOT CTS!
 */

import React, { useState } from 'react';
import {
  validateCTSIntro,
  CORRECT_STA_VS_CTS_ID,
  CORRECT_LEAF_SINK_ID,
} from './validators/validateCTSIntro.js';
import './CTSIntroChallenge.css';

export default function CTSIntroChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [staVsCtsConcept, setStaVsCtsConcept] = useState('');
  const [leafSinkConcept, setLeafSinkConcept] = useState('');
  const [skewAnswer, setSkewAnswer] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateCTSIntro({
      staVsCtsConcept,
      leafSinkConcept,
      skewAnswer,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="cts-intro-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🌲 Introduction to Clock Tree Synthesis (CTS)
        </h3>
        <p className="combseq-desc">
          Prior to CTS, physical design tools assume an <strong>ideal clock</strong> (instantaneous delivery to all flip-flops with 0 ps skew).
          CTS physically synthesizes the clock buffer tree from the clock source/pad out to every sequential sink pin across the chip.
          <br />
          <strong>Crucial Distinction:</strong> STA (Static Timing Analysis) checks and verifies timing constraints. CTS actually builds the physical clock routing and buffer tree!
        </p>
      </div>

      {/* Clock Tree Diagram Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Clock Tree Architecture: Root &rarr; Branch Buffers &rarr; Leaf Sinks</span>
          <span className="cts-metric-badge">Sink Arrival Delays: FF1=0.18ns, FF2=0.25ns, FF3=0.21ns</span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Clock Root */}
            <circle cx="50" cy="100" r="16" fill="#38bdf8" />
            <text x="50" y="104" fill="#0f172a" fontSize="10" fontWeight="800" textAnchor="middle">CLK</text>
            <text x="50" y="135" fill="#94a3b8" fontSize="9" textAnchor="middle">Clock Root</text>

            {/* Trunk wire */}
            <line x1="66" y1="100" x2="160" y2="100" stroke="#38bdf8" strokeWidth="3" />

            {/* Level 1 Buffer */}
            <polygon points="160,85 195,100 160,115" fill="#6366f1" stroke="#a5b4fc" strokeWidth="1.5" />
            <text x="172" y="103" fill="#ffffff" fontSize="8" fontWeight="700" textAnchor="middle">BUF1</text>

            {/* Branch wires */}
            <line x1="195" y1="100" x2="280" y2="50" stroke="#38bdf8" strokeWidth="2" />
            <line x1="195" y1="100" x2="280" y2="150" stroke="#38bdf8" strokeWidth="2" />

            {/* Level 2 Buffers */}
            <polygon points="280,38 315,50 280,62" fill="#6366f1" stroke="#a5b4fc" strokeWidth="1.5" />
            <polygon points="280,138 315,150 280,162" fill="#6366f1" stroke="#a5b4fc" strokeWidth="1.5" />

            {/* Distribution to Leaf Flops */}
            <line x1="315" y1="50" x2="420" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="315" y1="50" x2="420" y2="85" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="315" y1="150" x2="420" y2="155" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Flops */}
            <rect x="420" y="20" width="60" height="35" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="450" y="42" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">FF1 (0.18ns)</text>

            <rect x="420" y="70" width="60" height="35" rx="3" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="450" y="92" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">FF2 (0.25ns)</text>

            <rect x="420" y="140" width="60" height="35" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="450" y="162" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">FF3 (0.21ns)</text>

            {/* Skew annotation */}
            <path d="M 500,37 L 520,37 L 520,87 L 500,87" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="530" y="65" fill="#f59e0b" fontSize="9" fontWeight="700">Skew &Delta;t</text>
          </svg>
        </div>
      </div>

      {/* Step 1: STA vs CTS Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔬 Step 1: Engineering Distinction — STA vs CTS
        </h4>
        <div className="mux-quiz-prompt">
          What is the exact engineering relationship between Static Timing Analysis (STA) and Clock Tree Synthesis (CTS)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="STA vs CTS question">
          <label className={`mux-quiz-option ${staVsCtsConcept === CORRECT_STA_VS_CTS_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="staVsCtsQuiz"
              value={CORRECT_STA_VS_CTS_ID}
              checked={staVsCtsConcept === CORRECT_STA_VS_CTS_ID}
              onChange={(e) => setStaVsCtsConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>CTS constructs the physical network; STA analyzes and checks timing slacks:</strong> CTS synthesizes clock buffers, balances branch latencies, and routes clock traces. STA reads netlist delays and parasitics to verify setup, hold, and slew constraints. CTS builds; STA evaluates.
            </span>
          </label>

          <label className={`mux-quiz-option ${staVsCtsConcept === 'opt-same-thing' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="staVsCtsQuiz"
              value="opt-same-thing"
              checked={staVsCtsConcept === 'opt-same-thing'}
              onChange={(e) => setStaVsCtsConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>STA and CTS are identical tools:</strong> Static Timing Analysis physically places clock buffers, while CTS just displays timing reports.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: What are Leaf Sinks? */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🎯 Step 2: Clock Leaf Sinks
        </h4>
        <div className="mux-quiz-prompt">
          Which physical design cell pins represent the termination endpoints (leaf sinks) where a clock tree must balance?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Leaf sink question">
          <label className={`mux-quiz-option ${leafSinkConcept === CORRECT_LEAF_SINK_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="leafQuiz"
              value={CORRECT_LEAF_SINK_ID}
              checked={leafSinkConcept === CORRECT_LEAF_SINK_ID}
              onChange={(e) => setLeafSinkConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Clock input pins of Flip-Flops, Latches, SRAM macro clock pins, and Integrated Clock Gating (ICG) cells:</strong> All sequential cells that capture or launch synchronous data.
            </span>
          </label>

          <label className={`mux-quiz-option ${leafSinkConcept === 'opt-all-inputs' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="leafQuiz"
              value="opt-all-inputs"
              checked={leafSinkConcept === 'opt-all-inputs'}
              onChange={(e) => setLeafSinkConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>All inputs of combinational NAND, NOR, and inverter gates:</strong> Clock branches connect to every input of every logic gate on the chip.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Skew Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 3: Calculate Clock Skew
        </h4>
        <p className="dff-challenge__subtext">
          In the diagram above, the clock arrival times are: <code>FF1 = 0.18 ns</code>, <code>FF2 = 0.25 ns</code>, and <code>FF3 = 0.21 ns</code>.
          Calculate the maximum clock skew across this clock domain.
        </p>

        <div style={{ maxWidth: '240px', marginTop: '0.75rem' }}>
          <label className="accum-port-label">Clock Skew (Max Arrival - Min Arrival) (ns or ps):</label>
          <input
            type="number"
            step="0.001"
            placeholder="e.g. 0.07 or 70"
            className="syn-opt-input"
            value={skewAnswer}
            onChange={(e) => setSkewAnswer(e.target.value)}
          />
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ CTS Foundation Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🌲 Verify CTS Principles
        </button>
      </div>
    </div>
  );
}
