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
          <svg viewBox="0 0 620 180" style={{ width: '100%', maxWidth: '620px' }}>
            {/* VDD Rail Top */}
            <line x1="20" y1="20" x2="600" y2="20" stroke="#ef4444" strokeWidth="4" />
            <text x="30" y="15" fill="#ef4444" fontSize="10" fontWeight="700">VDD RAIL (Metal 1)</text>

            {/* Row 0 Cells */}
            <rect x="60" y="22" width="80" height="60" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="100" y="55" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">NAND2_X1</text>

            <rect x="140" y="22" width="120" height="60" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
            <text x="200" y="55" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">DFF_X1 (R0)</text>

            <rect x="260" y="22" width="60" height="60" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="290" y="55" fill="#a78bfa" fontSize="11" fontWeight="700" textAnchor="middle">INV_X1</text>

            {/* Shared VSS Rail Middle */}
            <line x1="20" y1="84" x2="600" y2="84" stroke="#3b82f6" strokeWidth="4" />
            <text x="30" y="96" fill="#3b82f6" fontSize="10" fontWeight="700">SHARED VSS RAIL (Metal 1)</text>

            {/* Row 1 Cells (Mirrored / MX) */}
            <rect x="80" y="86" width="100" height="60" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="130" y="120" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">OR2_X1 (MX)</text>

            <rect x="180" y="86" width="140" height="60" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
            <text x="250" y="120" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">DFF_X1 (MX)</text>

            {/* VDD Rail Bottom */}
            <line x1="20" y1="148" x2="600" y2="148" stroke="#ef4444" strokeWidth="4" />
            <text x="30" y="162" fill="#ef4444" fontSize="10" fontWeight="700">VDD RAIL (Metal 1)</text>
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
