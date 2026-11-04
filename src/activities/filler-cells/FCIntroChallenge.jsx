/**
 * FCIntroChallenge.jsx
 * ====================
 * Interactive challenge for Level 1 (fc-1): Why Filler Cells?
 */

import React, { useState } from 'react';
import {
  validateFCIntro,
  CORRECT_WHY_FILLERS_ID,
} from './validators/validateFCIntro.js';
import './FCIntroChallenge.css';

export default function FCIntroChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [whyFillersConcept, setWhyFillersConcept] = useState('');
  const [emptySitesAns, setEmptySitesAns] = useState('');
  const [showFillers, setShowFillers] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateFCIntro({
      whyFillersConcept,
      emptySitesAns,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="fc-intro-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🧱 Why Do ASICs Need Physical Filler Cells?
        </h3>
        <p className="combseq-desc">
          After detailed placement, standard cell rows contain empty voids between logic gates.
          Silicon manufacturing forbids leaving bare silicon gaps in active areas!
          <br />
          Filler cells are non-logical physical cells that populate these voids to guarantee continuous N-well implants, seamlessly abut VDD/VSS power rails, and satisfy foundry Chemical Mechanical Polishing (CMP) density rules.
        </p>
      </div>

      {/* Row With Gaps vs Filled Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">Standard Cell Row: Active Logic vs Empty Gaps</span>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
            onClick={() => setShowFillers(!showFillers)}
          >
            {showFillers ? 'Hide Filler Cells (Show Gaps)' : 'Insert Filler Cells (Fill Gaps)'}
          </button>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 180" style={{ width: '100%', maxWidth: '600px' }}>
            {/* VDD Power Rail */}
            <rect x="20" y="20" width="560" height="12" fill="#ef4444" />
            <text x="25" y="30" fill="#ffffff" fontSize="8" fontWeight="700">VDD (Power Rail)</text>

            {/* Row Active Area */}
            <rect x="20" y="32" width="560" height="116" fill="#0f172a" stroke="#334155" />

            {/* Cell 1: Logic Inverter (Sites 0 to 20 -> x: 20 to 132) */}
            <rect x="20" y="32" width="112" height="116" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="76" y="80" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">NAND2 Gate</text>
            <text x="76" y="98" fill="#93c5fd" fontSize="8" textAnchor="middle">(20 sites)</text>

            {/* Gap 1 (Sites 20 to 35 -> width 15 sites, x: 132 to 216) */}
            {showFillers ? (
              <g>
                <rect x="132" y="32" width="84" height="116" fill="#10b981" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
                <text x="174" y="90" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">FILL15</text>
              </g>
            ) : (
              <g>
                <rect x="132" y="32" width="84" height="116" fill="#334155" opacity="0.4" stroke="#f59e0b" strokeDasharray="3 3" />
                <text x="174" y="90" fill="#f59e0b" fontSize="8" fontWeight="700" textAnchor="middle">GAP (15 sites)</text>
              </g>
            )}

            {/* Cell 2: D-Flop (Sites 35 to 80 -> width 45 sites, x: 216 to 468) */}
            <rect x="216" y="32" width="252" height="116" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="342" y="80" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">DFFQ Flip-Flop</text>
            <text x="342" y="98" fill="#93c5fd" fontSize="8" textAnchor="middle">(45 sites)</text>

            {/* Gap 2 (Sites 80 to 100 -> width 20 sites, x: 468 to 580) */}
            {showFillers ? (
              <g>
                <rect x="468" y="32" width="112" height="116" fill="#10b981" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
                <text x="524" y="90" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">FILL20</text>
              </g>
            ) : (
              <g>
                <rect x="468" y="32" width="112" height="116" fill="#334155" opacity="0.4" stroke="#f59e0b" strokeDasharray="3 3" />
                <text x="524" y="90" fill="#f59e0b" fontSize="8" fontWeight="700" textAnchor="middle">GAP (20 sites)</text>
              </g>
            )}

            {/* VSS Power Rail */}
            <rect x="20" y="148" width="560" height="12" fill="#3b82f6" />
            <text x="25" y="158" fill="#ffffff" fontSize="8" fontWeight="700">VSS (Ground Rail)</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Why Fillers Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔬 Step 1: Why are Filler Cells Mandatory?
        </h4>
        <div className="mux-quiz-prompt">
          What is the primary physical and foundry reason why empty spaces in standard cell rows must be populated with physical filler cells?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Why fillers question">
          <label className={`mux-quiz-option ${whyFillersConcept === CORRECT_WHY_FILLERS_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="whyFillersQuiz"
              value={CORRECT_WHY_FILLERS_ID}
              checked={whyFillersConcept === CORRECT_WHY_FILLERS_ID}
              onChange={(e) => setWhyFillersConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Maintain Continuous N-Well Implants, Power Rails &amp; Satisfy CMP Density:</strong> Leaving empty gaps breaks the continuous N-well layer (causing DRC well-edge spacing violations), disconnects the VDD/VSS standard-cell power rails, and violates foundry metal/oxide planarity density rules during Chemical Mechanical Polishing.
            </span>
          </label>

          <label className={`mux-quiz-option ${whyFillersConcept === 'opt-add-logic' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="whyFillersQuiz"
              value="opt-add-logic"
              checked={whyFillersConcept === 'opt-add-logic'}
              onChange={(e) => setWhyFillersConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Add extra logic functions:</strong> Filler cells contain processors and memory to help the chip compute faster.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: Empty Sites Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 2: Calculate Total Empty Sites to Fill
        </h4>
        <p className="dff-challenge__subtext">
          In the diagram above, the standard cell row has a total capacity of <strong>100 placement sites</strong>.<br />
          Logic gates occupy: <code>NAND2 (20 sites)</code> + <code>DFFQ (45 sites)</code> = <strong>65 logic sites</strong>.<br />
          How many empty placement sites must be filled with physical-only cells to achieve 100% row continuity?
        </p>

        <div style={{ maxWidth: '240px', marginTop: '0.75rem' }}>
          <label className="accum-port-label">Empty Sites to Fill:</label>
          <input
            type="number"
            placeholder="e.g. 35"
            className="syn-opt-input"
            value={emptySitesAns}
            onChange={(e) => setEmptySitesAns(e.target.value)}
          />
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Filler Cell Foundation Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🧱 Verify Filler Principles
        </button>
      </div>
    </div>
  );
}
