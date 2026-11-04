/**
 * GDSSignoffChecksChallenge.jsx
 * ==============================
 * Interactive challenge for Level 2 (gds-2): Final Sign-Off Checks.
 */

import React, { useState } from 'react';
import {
  validateGDSSignoffChecks,
  CORRECT_SIGNOFF_GATE_ID,
  CORRECT_LVS_ERROR_ID,
} from './validators/validateGDSSignoffChecks.js';
import './GDSSignoffChecksChallenge.css';

export default function GDSSignoffChecksChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [checks, setChecks] = useState({
    drc: false,
    lvs: false,
    sta: false,
    erc: false,
  });
  const [signoffGateConcept, setSignoffGateConcept] = useState('');
  const [lvsErrorConcept, setLvsErrorConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const toggleCheck = (key) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allPassed = checks.drc && checks.lvs && checks.sta && checks.erc;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateGDSSignoffChecks({
      signoffGateConcept,
      lvsErrorConcept,
      checksPassed: checks,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="gds-signoff-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🛡️ Final Sign-Off Checks: DRC, LVS, STA &amp; ERC
        </h3>
        <p className="combseq-desc">
          Tape-out is an irreversible event. Fabricating a modern EUV photolithography mask set costs between \$2M and \$10M.
          A single open wire or DRC notch defect will render every chip on every silicon wafer completely dead.
          <br />
          Before generating mask data, CAD flows execute exhaustive sign-off verification with zero error tolerance.
        </p>
      </div>

      {/* Interactive Verification Audit Cards */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">Sign-Off Verification Dashboard (Click to Audit)</span>
          <span style={{ fontSize: '0.85rem', color: allPassed ? '#16a34a' : '#f59e0b', fontWeight: 700 }}>
            Status: {allPassed ? '✓ 4/4 CHECKS CERTIFIED CLEAN' : '⚠️ AUDIT IN PROGRESS (Click cards below)'}
          </span>
        </div>

        <div className="gds-audit-grid">
          <button
            type="button"
            className={`gds-audit-card ${checks.drc ? 'clean' : ''}`}
            onClick={() => toggleCheck('drc')}
            style={{ textAlign: 'left' }}
          >
            <div style={{ fontWeight: 800, color: checks.drc ? '#10b981' : '#f59e0b' }}>
              {checks.drc ? '✓ DRC (Passed - 0 Errors)' : '○ DRC (Click to Verify)'}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
              Geometric width, spacing, enclosure, and notch checks across 45 mask layers.
            </p>
          </button>

          <button
            type="button"
            className={`gds-audit-card ${checks.lvs ? 'clean' : ''}`}
            onClick={() => toggleCheck('lvs')}
            style={{ textAlign: 'left' }}
          >
            <div style={{ fontWeight: 800, color: checks.lvs ? '#10b981' : '#f59e0b' }}>
              {checks.lvs ? '✓ LVS (Passed - 100% Match)' : '○ LVS (Click to Verify)'}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
              Polygon netlist extraction compared against golden gate schematic. Zero opens/shorts.
            </p>
          </button>

          <button
            type="button"
            className={`gds-audit-card ${checks.sta ? 'clean' : ''}`}
            onClick={() => toggleCheck('sta')}
            style={{ textAlign: 'left' }}
          >
            <div style={{ fontWeight: 800, color: checks.sta ? '#10b981' : '#f59e0b' }}>
              {checks.sta ? '✓ STA Signoff (Closed)' : '○ STA Signoff (Click to Verify)'}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
              Setup WNS &ge; 0 and Hold WNS &ge; 0 across SS/TT/FF PVT extreme operating corners.
            </p>
          </button>

          <button
            type="button"
            className={`gds-audit-card ${checks.erc ? 'clean' : ''}`}
            onClick={() => toggleCheck('erc')}
            style={{ textAlign: 'left' }}
          >
            <div style={{ fontWeight: 800, color: checks.erc ? '#10b981' : '#f59e0b' }}>
              {checks.erc ? '✓ ERC (Passed - Clean Bias)' : '○ ERC (Click to Verify)'}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
              Substrate taps, well bias rules, floating gates, and ESD diode protection verified.
            </p>
          </button>
        </div>
      </div>

      {/* Step 1: Signoff Gate Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: The Strictness of Tape-Out Signoff
        </h4>
        <div className="mux-quiz-prompt">
          Why are physical sign-off checks treated as non-negotiable gates that forbid tape-out even if only a single DRC error exists?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Signoff gate question">
          <label className={`mux-quiz-option ${signoffGateConcept === CORRECT_SIGNOFF_GATE_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="gateQuiz"
              value={CORRECT_SIGNOFF_GATE_ID}
              checked={signoffGateConcept === CORRECT_SIGNOFF_GATE_ID}
              onChange={(e) => setSignoffGateConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Massive Cost and Multi-Month Delay of Mask Respins:</strong> Manufacturing silicon masks is irreversible; a single fatal short or open circuit in the layout renders every fabricated die on the wafer non-functional. Respinning masks costs millions of dollars and causes months of commercial delay.
            </span>
          </label>

          <label className={`mux-quiz-option ${signoffGateConcept === 'opt-foundry-fixes-it' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="gateQuiz"
              value="opt-foundry-fixes-it"
              checked={signoffGateConcept === 'opt-foundry-fixes-it'}
              onChange={(e) => setSignoffGateConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Foundries fix errors automatically:</strong> Foundries rewrite your layout to fix all bugs before manufacturing.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: LVS Error Debugging */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔍 Step 2: Debugging Layout Versus Schematic (LVS) Errors
        </h4>
        <div className="mux-quiz-prompt">
          In an LVS report, what does an error flagged as an "unconnected pin" or "net open" mean?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="LVS error question">
          <label className={`mux-quiz-option ${lvsErrorConcept === CORRECT_LVS_ERROR_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="lvsErrQuiz"
              value={CORRECT_LVS_ERROR_ID}
              checked={lvsErrorConcept === CORRECT_LVS_ERROR_ID}
              onChange={(e) => setLvsErrorConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>An electrical open circuit:</strong> A logical net required by the schematic netlist was not physically connected to the destination cell pin during detailed routing, leaving an open floating terminal.
            </span>
          </label>

          <label className={`mux-quiz-option ${lvsErrorConcept === 'opt-overclock' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="lvsErrQuiz"
              value="opt-overclock"
              checked={lvsErrorConcept === 'opt-overclock'}
              onChange={(e) => setLvsErrorConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>The clock is too fast:</strong> Unconnected pins indicate that the clock frequency should be increased.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Sign-Off Audit Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🛡️ Certify Final Sign-Off Checks
        </button>
      </div>
    </div>
  );
}
