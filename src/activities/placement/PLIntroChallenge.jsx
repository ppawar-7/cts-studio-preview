/**
 * PLIntroChallenge.jsx
 * ====================
 * Interactive challenge for Level 1 (pl-1): What is Placement?
 */

import React, { useState } from 'react';
import {
  validatePLIntro,
  CORRECT_ROW_ABUT_ID,
  CORRECT_ORIENTATION_ID,
} from './validators/validatePLIntro.js';
import './PLIntroChallenge.css';

export default function PLIntroChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [rowHeightConcept, setRowHeightConcept] = useState('');
  const [orientationConcept, setOrientationConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validatePLIntro({
      rowHeightConcept,
      orientationConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="pl-intro-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          📍 Standard Cell Placement: Legal Rows &amp; Power Rails
        </h3>
        <p className="combseq-desc">
          After floorplanning, <strong>placement</strong> maps every synthesized standard cell into discrete standard cell rows. Every cell has variable width (measured in site pitches) but <em>strictly identical uniform height</em>.
        </p>
      </div>

      {/* Row Abutment Visualizer */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Standard Cell Row Abutment &amp; Flipping</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Row 0 (R0: VDD Top / VSS Bottom) abuts Row 1 (MX: VSS Top / VDD Bottom)
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 620 190" style={{ width: '100%', maxWidth: '620px', display: 'block' }}>
            {/* VDD Rail Top */}
            <line x1="20" y1="20" x2="600" y2="20" stroke="#ef4444" strokeWidth="4" />
            <rect x="25" y="8" width="125" height="16" rx="2" fill="#1e293b" stroke="#ef4444" strokeWidth="0.8" />
            <text x="87" y="19" fill="#ef4444" fontSize="8.5" fontWeight="700" textAnchor="middle">VDD RAIL (Metal 1)</text>

            {/* Row 0 Cells (R0) */}
            <g className="cell-node">
              <rect x="50" y="22" width="120" height="60" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" rx="3" />
              <text x="110" y="52" fill="#38bdf8" fontSize="10.5" fontWeight="700" textAnchor="middle">NAND2_X1</text>
              <text x="110" y="66" fill="#94a3b8" fontSize="8" textAnchor="middle">Height: 1.4µm (R0)</text>
            </g>

            <g className="cell-node">
              <rect x="180" y="22" width="150" height="60" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" rx="3" />
              <text x="255" y="52" fill="#34d399" fontSize="10.5" fontWeight="700" textAnchor="middle">DFF_X1 (R0)</text>
              <text x="255" y="66" fill="#94a3b8" fontSize="8" textAnchor="middle">Flip-Flop Cell</text>
            </g>

            <g className="cell-node">
              <rect x="340" y="22" width="100" height="60" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" rx="3" />
              <text x="390" y="52" fill="#a78bfa" fontSize="10.5" fontWeight="700" textAnchor="middle">INV_X1</text>
              <text x="390" y="66" fill="#94a3b8" fontSize="8" textAnchor="middle">Inverter</text>
            </g>

            <g className="cell-node">
              <rect x="450" y="22" width="130" height="60" fill="#1e293b" stroke="#f472b6" strokeWidth="1.5" rx="3" />
              <text x="515" y="52" fill="#f472b6" fontSize="10.5" fontWeight="700" textAnchor="middle">BUF_X2 (R0)</text>
              <text x="515" y="66" fill="#94a3b8" fontSize="8" textAnchor="middle">Clock Buffer</text>
            </g>

            {/* Shared VSS Rail Middle */}
            <line x1="20" y1="84" x2="600" y2="84" stroke="#3b82f6" strokeWidth="4" />
            <rect x="25" y="76" width="160" height="16" rx="2" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
            <text x="105" y="87" fill="#60a5fa" fontSize="8.5" fontWeight="700" textAnchor="middle">SHARED VSS RAIL (Metal 1)</text>

            {/* Row 1 Cells (Mirrored / MX) */}
            <g className="cell-node">
              <rect x="60" y="86" width="130" height="60" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" rx="3" />
              <text x="125" y="116" fill="#fbbf24" fontSize="10.5" fontWeight="700" textAnchor="middle">OR2_X1 (MX)</text>
              <text x="125" y="130" fill="#94a3b8" fontSize="8" textAnchor="middle">Mirrored (MX)</text>
            </g>

            <g className="cell-node">
              <rect x="200" y="86" width="160" height="60" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" rx="3" />
              <text x="280" y="116" fill="#34d399" fontSize="10.5" fontWeight="700" textAnchor="middle">DFF_X1 (MX)</text>
              <text x="280" y="130" fill="#94a3b8" fontSize="8" textAnchor="middle">Mirrored VDD/VSS</text>
            </g>

            <g className="cell-node">
              <rect x="370" y="86" width="140" height="60" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" rx="3" />
              <text x="440" y="116" fill="#38bdf8" fontSize="10.5" fontWeight="700" textAnchor="middle">AND2_X1 (MX)</text>
              <text x="440" y="130" fill="#94a3b8" fontSize="8" textAnchor="middle">Shared VSS Boundary</text>
            </g>

            {/* VDD Rail Bottom */}
            <line x1="20" y1="148" x2="600" y2="148" stroke="#ef4444" strokeWidth="4" />
            <rect x="25" y="152" width="125" height="16" rx="2" fill="#1e293b" stroke="#ef4444" strokeWidth="0.8" />
            <text x="87" y="163" fill="#ef4444" fontSize="8.5" fontWeight="700" textAnchor="middle">VDD RAIL (Metal 1)</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Uniform Height */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📏 Step 1: Why Uniform Standard Cell Row Height?
        </h4>
        <div className="mux-quiz-prompt">
          Why must every standard cell in an ASIC foundry library share the exact same row height?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Row height question">
          <label className={`mux-quiz-option ${rowHeightConcept === CORRECT_ROW_ABUT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="rowHeightQuiz"
              value={CORRECT_ROW_ABUT_ID}
              checked={rowHeightConcept === CORRECT_ROW_ABUT_ID}
              onChange={(e) => setRowHeightConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Continuous power rail abutment and N-well alignment:</strong> Cells packed horizontally share seamless VDD and VSS Metal 1 power rails along the top and bottom borders without requiring individual power routing to every single transistor.
            </span>
          </label>

          <label className={`mux-quiz-option ${rowHeightConcept === 'opt-random-height' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="rowHeightQuiz"
              value="opt-random-height"
              checked={rowHeightConcept === 'opt-random-height'}
              onChange={(e) => setRowHeightConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Random height is allowed:</strong> Modern chips do not use rows and scatter cells at random angles across silicon.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: Row Orientation Flipping */}
      <div className="dff-challenge__concept-section" style={{ marginTop: '1.5rem' }}>
        <h4 className="dff-challenge__section-title">
          🔄 Step 2: Row Orientation Flipping (R0 vs MX)
        </h4>
        <div className="mux-quiz-prompt">
          Why do physical design tools mirror alternating standard cell rows along the X-axis (orientation MX / flipped)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Row flipping question">
          <label className={`mux-quiz-option ${orientationConcept === CORRECT_ORIENTATION_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="orientQuiz"
              value={CORRECT_ORIENTATION_ID}
              checked={orientationConcept === CORRECT_ORIENTATION_ID}
              onChange={(e) => setOrientationConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Shares common VDD and VSS rails between adjacent rows:</strong> Flipping alternate rows brings like power rails together (VSS abuts VSS; VDD abuts VDD), cutting power rail routing area in half and doubling placement density!
            </span>
          </label>

          <label className={`mux-quiz-option ${orientationConcept === 'opt-orient-visual' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="orientQuiz"
              value="opt-orient-visual"
              checked={orientationConcept === 'opt-orient-visual'}
              onChange={(e) => setOrientationConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Visual symmetry only:</strong> Flipping cells has zero physical or electrical benefit and is done purely for aesthetic patterns.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Placement Architecture Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          📍 Verify Standard Cell Placement Fundamentals
        </button>
      </div>
    </div>
  );
}
