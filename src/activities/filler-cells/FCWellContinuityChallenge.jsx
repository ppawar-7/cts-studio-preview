/**
 * FCWellContinuityChallenge.jsx
 * =============================
 * Interactive challenge for Level 3 (fc-3): N-Well Continuity.
 */

import React, { useState } from 'react';
import {
  validateFCWellContinuity,
  CORRECT_WELL_EDGE_ID,
} from './validators/validateFCWellContinuity.js';
import './FCWellContinuityChallenge.css';

export default function FCWellContinuityChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [chosenFillers, setChosenFillers] = useState([]);
  const [wellEdgeConcept, setWellEdgeConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const SIZES = { FILL8: 8, FILL4: 4, FILL2: 2, FILL1: 1 };
  const totalFilled = chosenFillers.reduce((sum, f) => sum + (SIZES[f] || 0), 0);
  const remainingSites = Math.max(0, 12 - totalFilled);
  const isContinuous = totalFilled === 12;

  const handleAddFiller = (type) => {
    const size = SIZES[type];
    if (totalFilled + size <= 12) {
      setChosenFillers([...chosenFillers, type]);
    }
  };

  const handleClear = () => {
    setChosenFillers([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateFCWellContinuity({
      chosenFillers,
      wellEdgeConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="fc-well-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🕳️ N-Well Continuity &amp; DRC Well-Edge Spacing Rules
        </h3>
        <p className="combseq-desc">
          CMOS standard cells feature an upper N-well layer enclosing PMOS pull-up transistors.
          If two cells are separated by an empty gap, the N-well abruptly terminates, creating a narrow gap that violates the foundry minimum well-to-well spacing rule (&lt; 0.50 µm).
          <br />
          Bridge the 12-site gap with dummy filler cells to merge the N-well into a single continuous implant!
        </p>
      </div>

      {/* Row N-Well Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">N-Well Layer (Upper Half) &amp; P-Substrate (Lower Half)</span>
          <span style={{ fontSize: '0.85rem', color: isContinuous ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            {isContinuous ? '✓ N-WELL CONTINUOUS: DRC Spacing Rules Met' : `⚠️ DRC VIOLATION: Broken N-Well (${remainingSites} sites gap)`}
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Top VDD Rail */}
            <rect x="20" y="20" width="560" height="10" fill="#ef4444" />
            <text x="30" y="28" fill="#ffffff" fontSize="8" fontWeight="700">VDD Rail</text>

            {/* Upper Half: N-Well Zone (Amber / Yellow) */}
            {/* Left Cell N-Well */}
            <rect x="20" y="30" width="180" height="70" fill="#f59e0b" opacity="0.6" stroke="#d97706" />
            <text x="110" y="70" fill="#0f172a" fontSize="10" fontWeight="800" textAnchor="middle">N-Well (Cell A)</text>

            {/* Gap Area: Filler Insertion Zone */}
            {isContinuous ? (
              <rect x="200" y="30" width="180" height="70" fill="#10b981" opacity="0.7" stroke="#059669" strokeDasharray="3 2" />
            ) : (
              <g>
                <rect x="200" y="30" width="180" height="70" fill="#334155" opacity="0.3" stroke="#ef4444" strokeDasharray="4 2" />
                <line x1="200" y1="65" x2="380" y2="65" stroke="#ef4444" strokeWidth="2" />
                <text x="290" y="60" fill="#ef4444" fontSize="9" fontWeight="800" textAnchor="middle">
                  BROKEN N-WELL GAP (DRC ERROR)
                </text>
              </g>
            )}

            {/* Right Cell N-Well */}
            <rect x="380" y="30" width="200" height="70" fill="#f59e0b" opacity="0.6" stroke="#d97706" />
            <text x="480" y="70" fill="#0f172a" fontSize="10" fontWeight="800" textAnchor="middle">N-Well (Cell B)</text>

            {/* Lower Half: P-Substrate Zone */}
            <rect x="20" y="100" width="560" height="70" fill="#1e293b" stroke="#334155" />
            <text x="300" y="140" fill="#64748b" fontSize="10" fontWeight="700" textAnchor="middle">
              P-Substrate Region (NMOS Transistors)
            </text>

            {/* Bottom VSS Rail */}
            <rect x="20" y="170" width="560" height="10" fill="#3b82f6" />
            <text x="30" y="178" fill="#ffffff" fontSize="8" fontWeight="700">VSS Ground Rail</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Bridge the 12-Site Gap */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Select Filler Cells to Bridge the 12-Site Void
        </h4>
        <p className="dff-challenge__subtext">
          Current Fill: <strong>{totalFilled} / 12 sites</strong>.
          Active Fillers: <code>{chosenFillers.length > 0 ? chosenFillers.join(' + ') : 'None'}</code>
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={totalFilled + 8 > 12}
            onClick={() => handleAddFiller('FILL8')}
          >
            + FILL8 (8 sites)
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={totalFilled + 4 > 12}
            onClick={() => handleAddFiller('FILL4')}
          >
            + FILL4 (4 sites)
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={totalFilled + 2 > 12}
            onClick={() => handleAddFiller('FILL2')}
          >
            + FILL2 (2 sites)
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={totalFilled + 1 > 12}
            onClick={() => handleAddFiller('FILL1')}
          >
            + FILL1 (1 site)
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ color: '#ef4444' }}
            disabled={chosenFillers.length === 0}
            onClick={handleClear}
          >
            Reset Fillers
          </button>
        </div>
      </div>

      {/* Step 2: Well Edge Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📐 Step 2: DRC Well-Edge Spacing Violations
        </h4>
        <div className="mux-quiz-prompt">
          What physical fabrication defect happens if an N-well ends abruptly inside a row without meeting foundry minimum well-to-well spacing rules?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Well edge question">
          <label className={`mux-quiz-option ${wellEdgeConcept === CORRECT_WELL_EDGE_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="wellEdgeQuiz"
              value={CORRECT_WELL_EDGE_ID}
              checked={wellEdgeConcept === CORRECT_WELL_EDGE_ID}
              onChange={(e) => setWellEdgeConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>DRC Well Spacing Violation &amp; High Susceptibility to Substrate Leakage:</strong> Lithographic optical diffraction causes adjacent closely-spaced N-well edges to merge unpredictably or form notched re-entrant geometries, leading to punchthrough breakdown and leakage between independent transistor bodies.
            </span>
          </label>

          <label className={`mux-quiz-option ${wellEdgeConcept === 'opt-no-consequence' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="wellEdgeQuiz"
              value="opt-no-consequence"
              checked={wellEdgeConcept === 'opt-no-consequence'}
              onChange={(e) => setWellEdgeConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>No consequence:</strong> Wells do not need to follow any DRC spacing rules in modern foundries.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ N-Well Continuity Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🕳️ Verify N-Well Continuity
        </button>
      </div>
    </div>
  );
}
