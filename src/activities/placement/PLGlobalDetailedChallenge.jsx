/**
 * PLGlobalDetailedChallenge.jsx
 * ==============================
 * Interactive challenge for Level 2 (pl-2): Global vs Detailed Placement.
 */

import React, { useState } from 'react';
import {
  validatePLGlobalDetailed,
  LEGALIZATION_CASES,
  CORRECT_ANALYTICAL_ID,
} from './validators/validatePLGlobalDetailed.js';
import './PLGlobalDetailedChallenge.css';

export default function PLGlobalDetailedChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [legalizedCells, setLegalizedCells] = useState([
    { id: 'CELL_A', x: '', y: '' },
    { id: 'CELL_B', x: '', y: '' },
  ]);
  const [displacementAns, setDisplacementAns] = useState('');
  const [analyticalConcept, setAnalyticalConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleCoordChange = (idx, field, val) => {
    const updated = [...legalizedCells];
    updated[idx] = { ...updated[idx], [field]: val };
    setLegalizedCells(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validatePLGlobalDetailed({
      legalizedCells,
      displacementAns,
      analyticalConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="pl-global-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🔄 Global Placement (Analytical) vs Detailed Placement (Legalization)
        </h3>
        <p className="combseq-desc">
          ASIC placement operates in two distinct stages:
          1. <strong>Global Placement:</strong> Relaxes discrete grid rules and treats cells as points connected by springs (quadratic optimization) to approximate optimal wirelength. Cells may overlap and sit off-grid.
          2. <strong>Detailed Placement:</strong> Snaps every cell to the nearest legal site pitch and row boundary, completely eliminating overlaps while minimizing placement displacement ($\Delta x + \Delta y$).
        </p>
      </div>

      {/* Row site grid illustration */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Rough Global Placement vs Legal Row Grid</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Row Height: 40 µm | Site Pitch: 10 µm
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 160" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Grid rows */}
            <rect x="20" y="40" width="560" height="40" fill="#1e293b" stroke="#334155" strokeDasharray="2 2" />
            <text x="30" y="65" fill="#64748b" fontSize="10">Row 1 (y=40)</text>

            <rect x="20" y="80" width="560" height="40" fill="#1e293b" stroke="#334155" strokeDasharray="2 2" />
            <text x="30" y="105" fill="#64748b" fontSize="10">Row 2 (y=80)</text>

            {/* Rough Cell A (Off-grid: x=43, y=55) */}
            <rect x="43" y="55" width="30" height="40" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
            <text x="58" y="78" fill="#f87171" fontSize="10" textAnchor="middle">Cell A (Rough)</text>

            {/* Rough Cell B (Overlapping/Off-pitch: x=78, y=38) */}
            <rect x="78" y="38" width="30" height="40" fill="rgba(245, 158, 11, 0.4)" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
            <text x="93" y="62" fill="#fbbf24" fontSize="10" textAnchor="middle">Cell B (Rough)</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Legalize Cells */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Snap Rough Cells to Legal Row 1 Sites (Y=40, X multiples of 10)
        </h4>
        <p className="dff-challenge__subtext">
          Cell A is 30 µm wide. Place Cell A on Row 1 at the closest site ($x=40$). Place Cell B (30 µm wide) directly adjacent to Cell A with zero overlap.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="syn-opt-card">
            <span style={{ fontWeight: 800, color: '#38bdf8' }}>CELL A (Width: 30 µm)</span>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '8px' }}>
              <div>
                <label className="accum-port-label">Legal X (µm):</label>
                <input
                  type="number"
                  placeholder="e.g. 40"
                  className="syn-opt-input"
                  value={legalizedCells[0].x}
                  onChange={(e) => handleCoordChange(0, 'x', e.target.value)}
                />
              </div>
              <div>
                <label className="accum-port-label">Legal Y (µm):</label>
                <input
                  type="number"
                  placeholder="e.g. 40"
                  className="syn-opt-input"
                  value={legalizedCells[0].y}
                  onChange={(e) => handleCoordChange(0, 'y', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="syn-opt-card">
            <span style={{ fontWeight: 800, color: '#34d399' }}>CELL B (Width: 30 µm, abuts A)</span>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '8px' }}>
              <div>
                <label className="accum-port-label">Legal X (µm):</label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  className="syn-opt-input"
                  value={legalizedCells[1].x}
                  onChange={(e) => handleCoordChange(1, 'x', e.target.value)}
                />
              </div>
              <div>
                <label className="accum-port-label">Legal Y (µm):</label>
                <input
                  type="number"
                  placeholder="e.g. 40"
                  className="syn-opt-input"
                  value={legalizedCells[1].y}
                  onChange={(e) => handleCoordChange(1, 'y', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Displacement Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📏 Step 2: Total Manhattan Legalization Displacement
        </h4>
        <p className="dff-challenge__subtext">
          Compute $\sum (|x_{legal} - x_{rough}| + |y_{legal} - y_{rough}|)$ across both cells.
        </p>

        <div style={{ maxWidth: '240px', marginTop: '0.75rem' }}>
          <label className="accum-port-label">Total Displacement (µm):</label>
          <input
            type="number"
            placeholder="e.g. 22"
            className="syn-opt-input"
            value={displacementAns}
            onChange={(e) => setDisplacementAns(e.target.value)}
          />
        </div>
      </div>

      {/* Step 3: Analytical Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🧠 Step 3: Analytical Force-Directed Optimization
        </h4>
        <div className="mux-quiz-prompt">
          How do modern global placement algorithms (such as ePlace / RePIAce) solve placement for 10 million gates in minutes?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Analytical placement question">
          <label className={`mux-quiz-option ${analyticalConcept === CORRECT_ANALYTICAL_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="analyticalQuiz"
              value={CORRECT_ANALYTICAL_ID}
              checked={analyticalConcept === CORRECT_ANALYTICAL_ID}
              onChange={(e) => setAnalyticalConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Nonlinear electrostatic density analogies:</strong> Net interconnects act as attractive linear springs pulling connected gates together, while cell areas generate repulsive electrostatic charges that push overlapping gates smoothly across the die canvas.
            </span>
          </label>

          <label className={`mux-quiz-option ${analyticalConcept === 'opt-random-trial' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="analyticalQuiz"
              value="opt-random-trial"
              checked={analyticalConcept === 'opt-random-trial'}
              onChange={(e) => setAnalyticalConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Brute-force trial:</strong> The tool tries every permutation of gates one by one sequentially until an answer is found.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Legalization Verified!' : '⚠️ Incomplete Legalization:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🔄 Verify Legalization &amp; Displacement
        </button>
      </div>
    </div>
  );
}
