/**
 * PLTimingDrivenChallenge.jsx
 * ============================
 * Interactive challenge for Level 3 (pl-3): Timing-Driven Placement.
 */

import React, { useState } from 'react';
import {
  validatePLTimingDriven,
  CORRECT_NET_WEIGHT_ID,
} from './validators/validatePLTimingDriven.js';
import './PLTimingDrivenChallenge.css';

export default function PLTimingDrivenChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [initialHPWL, setInitialHPWL] = useState('');
  const [optimizedHPWL, setOptimizedHPWL] = useState('');
  const [chosenPosition, setChosenPosition] = useState('');
  const [netWeightConcept, setNetWeightConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validatePLTimingDriven({
      initialHPWL,
      optimizedHPWL,
      chosenPosition,
      netWeightConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="pl-timing-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          ⏱️ Timing-Driven Placement &amp; Wirelength (HPWL)
        </h3>
        <p className="combseq-desc">
          Interconnect RC parasitics dominate delay in deep submicron ASICs. Placing critical-path registers far apart introduces long RC wires, causing severe setup violations.
          <br />
          <strong>Half-Perimeter Wirelength (HPWL):</strong> HPWL = (Xmax - Xmin) + (Ymax - Ymin).
        </p>
      </div>

      {/* Critical Path Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Critical Path Wirelength Visualizer</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Flop A at (20, 40) → Critical Net → Flop B
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 220" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Core Box */}
            <rect x="20" y="20" width="560" height="180" fill="#1e293b" stroke="#334155" />

            {/* Flop A */}
            <rect x="40" y="40" width="40" height="40" fill="#2563eb" stroke="#60a5fa" strokeWidth="2" />
            <text x="60" y="65" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">Flop A</text>
            <text x="60" y="95" fill="#94a3b8" fontSize="9" textAnchor="middle">(20, 40)</text>

            {/* Unoptimized Flop B at (340, 160) [offset: x=360, y=140] */}
            <rect x="360" y="140" width="40" height="40" fill="#ef4444" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />
            <text x="380" y="165" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">Flop B (Bad)</text>
            <text x="380" y="195" fill="#f87171" fontSize="9" textAnchor="middle">(340, 240)</text>

            {/* Long wire */}
            <line x1="80" y1="60" x2="360" y2="160" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />

            {/* Optimized Flop B at (120, 40) [offset: x=140, y=40] */}
            <rect x="140" y="40" width="40" height="40" fill="#16a34a" stroke="#4ade80" strokeWidth="2" />
            <text x="160" y="65" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">Flop B (Opt)</text>
            <text x="160" y="95" fill="#4ade80" fontSize="9" textAnchor="middle">(100, 40)</text>

            {/* Short wire */}
            <line x1="80" y1="60" x2="140" y2="60" stroke="#4ade80" strokeWidth="3" />
          </svg>
        </div>
      </div>

      {/* Step 1: HPWL Calculations */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Calculate Half-Perimeter Wirelength (HPWL)
        </h4>
        <p className="dff-challenge__subtext">
          Formula: HPWL = (Xmax - Xmin) + (Ymax - Ymin).
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Initial Bad HPWL ((20, 40) to (340, 240)) (µm):</label>
            <input
              type="number"
              placeholder="e.g. 520"
              className="syn-opt-input"
              value={initialHPWL}
              onChange={(e) => setInitialHPWL(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Optimized Clustered HPWL ((20, 40) to (100, 40)) (µm):</label>
            <input
              type="number"
              placeholder="e.g. 80"
              className="syn-opt-input"
              value={optimizedHPWL}
              onChange={(e) => setOptimizedHPWL(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Placement choice */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          🎯 Step 2: Select Optimal Target Position for Flop B
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
          <label className={`mux-quiz-option ${chosenPosition === 'pos-adjacent' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="posChoice"
              value="pos-adjacent"
              checked={chosenPosition === 'pos-adjacent'}
              onChange={(e) => setChosenPosition(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Adjacent Placement on Row 1 (100, 40):</strong> HPWL = 80 µm. Reduces wirelength by 84%, minimizing RC interconnect delay and closing setup timing.
            </span>
          </label>

          <label className="mux-quiz-option">
            <input
              type="radio"
              name="posChoice"
              value="pos-far-corner"
              checked={chosenPosition === 'pos-far-corner'}
              onChange={(e) => setChosenPosition(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              Far corner placement (340, 240): HPWL = 520 µm. Causes severe timing violations.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Net Weighting Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🧠 Step 3: How Placers Enforce Timing Priorities (Net Weighting)
        </h4>
        <div className="mux-quiz-prompt">
          How do industrial placement engines (e.g. Cadence Innovus, Synopsys ICC2, OpenROAD) prioritize critical paths during global placement optimization?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Net weighting question">
          <label className={`mux-quiz-option ${netWeightConcept === CORRECT_NET_WEIGHT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="netWeightQuiz"
              value={CORRECT_NET_WEIGHT_ID}
              checked={netWeightConcept === CORRECT_NET_WEIGHT_ID}
              onChange={(e) => setNetWeightConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Assigning higher weights (Wnet &gt;&gt; 1) to negative-slack nets in the objective cost function:</strong> The analytical solver minimizes the weighted wirelength sum. Heavily weighted timing-critical nets act as strong springs, pulling connected cells close together even at the expense of stretching non-critical nets.
            </span>
          </label>

          <label className={`mux-quiz-option ${netWeightConcept === 'opt-equal-weight' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="netWeightQuiz"
              value="opt-equal-weight"
              checked={netWeightConcept === 'opt-equal-weight'}
              onChange={(e) => setNetWeightConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>All nets are weighted identically:</strong> Placer tools never inspect timing slacks during placement.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Timing-Driven Placement Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          ⏱️ Verify Timing-Driven Placement
        </button>
      </div>
    </div>
  );
}
