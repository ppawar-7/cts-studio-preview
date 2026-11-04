/**
 * RTViasContactsChallenge.jsx
 * ===========================
 * Interactive challenge for Level 3 (rt-3): Vias and Contacts.
 */

import React, { useState } from 'react';
import {
  validateRTViasContacts,
  CORRECT_VIA_ENCLOSURE_ID,
  CORRECT_REDUNDANT_VIA_ID,
} from './validators/validateRTViasContacts.js';
import './RTViasContactsChallenge.css';

export default function RTViasContactsChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [singleViaResistanceAns, setSingleViaResistanceAns] = useState('');
  const [doubleViaResistanceAns, setDoubleViaResistanceAns] = useState('');
  const [enclosureConcept, setEnclosureConcept] = useState('');
  const [redundantViaConcept, setRedundantViaConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateRTViasContacts({
      singleViaResistanceAns,
      doubleViaResistanceAns,
      enclosureConcept,
      redundantViaConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="rt-vias-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🕳️ Vias &amp; Contacts: Inter-Layer Transitions &amp; Parasitic Resistance
        </h3>
        <p className="combseq-desc">
          When a wire changes routing direction between horizontal and vertical layers, it must pass through a vertical metal cylinder called a <strong>Via</strong>.
          <br />
          While copper wires have negligible resistance, microscopic vias introduce significant parasitic resistance (3&ndash;5 &Omega; per via cut).
          In timing-critical and power routing, physical design tools insert <strong>redundant (double) vias</strong> to halve resistance and prevent yield-killing open circuits.
        </p>
      </div>

      {/* Via Cross-Section Diagram */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Via Architecture &amp; DRC Enclosure Cross-Section</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Metal 1 &rarr; Via 1 &rarr; Metal 2</span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Metal 2 (Upper metal) */}
            <rect x="150" y="30" width="300" height="30" fill="#ec4899" rx="2" />
            <text x="300" y="50" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">Metal 2 (Vertical Wire)</text>

            {/* Via Cuts (Double Via pair) */}
            <rect x="250" y="60" width="30" height="40" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
            <text x="265" y="85" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle">VIA</text>

            <rect x="320" y="60" width="30" height="40" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
            <text x="335" y="85" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle">VIA</text>

            {/* Metal 1 (Lower metal) */}
            <rect x="180" y="100" width="240" height="30" fill="#38bdf8" rx="2" />
            <text x="300" y="120" fill="#0f172a" fontSize="10" fontWeight="700" textAnchor="middle">Metal 1 (Horizontal Wire)</text>

            {/* Enclosure annotations */}
            <line x1="250" y1="20" x2="180" y2="20" stroke="#a855f7" strokeWidth="1.5" />
            <text x="215" y="15" fill="#a855f7" fontSize="8" fontWeight="700" textAnchor="middle">DRC Enclosure</text>

            <text x="300" y="170" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Double Via cut reduces equivalent resistance from 5 &Omega; down to 2.5 &Omega;
            </text>
          </svg>
        </div>
      </div>

      {/* Step 1: Resistance Calculations */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Calculate Via Chain Parasitic Resistance
        </h4>
        <p className="dff-challenge__subtext">
          A critical interconnect path traverses <strong>4 single Via1 layer transitions</strong> in series.
          Each single via cut has a parasitic resistance of <strong>5 &Omega;</strong>.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Total Resistance with 4 Single Vias (&Omega;):</label>
            <input
              type="number"
              placeholder="e.g. 20"
              className="syn-opt-input"
              value={singleViaResistanceAns}
              onChange={(e) => setSingleViaResistanceAns(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Total Resistance with 4 Double Vias (&Omega;):</label>
            <input
              type="number"
              placeholder="e.g. 10"
              className="syn-opt-input"
              value={doubleViaResistanceAns}
              onChange={(e) => setDoubleViaResistanceAns(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Step 2: DRC Via Enclosure */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📐 Step 2: DRC Via Enclosure Rules
        </h4>
        <div className="mux-quiz-prompt">
          Why do foundry design rules mandate that metal wires must strictly extend beyond the via boundary by a minimum enclosure margin?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Via enclosure question">
          <label className={`mux-quiz-option ${enclosureConcept === CORRECT_VIA_ENCLOSURE_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="encQuiz"
              value={CORRECT_VIA_ENCLOSURE_ID}
              checked={enclosureConcept === CORRECT_VIA_ENCLOSURE_ID}
              onChange={(e) => setEnclosureConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Prevent open-circuit failures due to photolithographic mask misalignment:</strong> Small alignment variations between lithography exposures can shift the via cut relative to the metal wire. Adequate enclosure ensures the via remains fully covered by metal, preventing open circuits and high-resistance voids.
            </span>
          </label>

          <label className={`mux-quiz-option ${enclosureConcept === 'opt-enc-irrelevant' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="encQuiz"
              value="opt-enc-irrelevant"
              checked={enclosureConcept === 'opt-enc-irrelevant'}
              onChange={(e) => setEnclosureConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Enclosure has no purpose:</strong> Vias do not need to touch the metal wire above them to conduct electricity.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Redundant Vias */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🛡️ Step 3: Redundant (Multi-Cut) Via Insertion
        </h4>
        <div className="mux-quiz-prompt">
          Why do physical design signoff flows run automated redundant via insertion scripts after detailed routing?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Redundant via question">
          <label className={`mux-quiz-option ${redundantViaConcept === CORRECT_REDUNDANT_VIA_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="redViaQuiz"
              value={CORRECT_REDUNDANT_VIA_ID}
              checked={redundantViaConcept === CORRECT_REDUNDANT_VIA_ID}
              onChange={(e) => setRedundantViaConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Dramatically improves silicon manufacturing yield &amp; reduces electromigration:</strong> Single vias are the leading cause of random particle defect opens. A parallel secondary via ensures electrical connectivity even if one via fails, while cutting current density in half.
            </span>
          </label>

          <label className={`mux-quiz-option ${redundantViaConcept === 'opt-make-slower' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="redViaQuiz"
              value="opt-make-slower"
              checked={redundantViaConcept === 'opt-make-slower'}
              onChange={(e) => setRedundantViaConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>To intentionally slow down the chip:</strong> Adding extra vias slows signals down to prevent them from arriving too fast.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Vias &amp; Contacts Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🕳️ Verify Vias &amp; Enclosures
        </button>
      </div>
    </div>
  );
}
