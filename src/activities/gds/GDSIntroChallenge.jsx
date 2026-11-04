/**
 * GDSIntroChallenge.jsx
 * =====================
 * Interactive challenge for Level 1 (gds-1): What is GDSII?
 */

import React, { useState } from 'react';
import {
  validateGDSIntro,
  CORRECT_GDS_CONTENTS_ID,
  CORRECT_OASIS_ID,
} from './validators/validateGDSIntro.js';
import './GDSIntroChallenge.css';

export default function GDSIntroChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [gdsContentsConcept, setGdsContentsConcept] = useState('');
  const [oasisConcept, setOasisConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateGDSIntro({
      gdsContentsConcept,
      oasisConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="gds-intro-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          📜 What is GDSII? The Universal Tape-Out Mask Stream Format
        </h3>
        <p className="combseq-desc">
          GDSII (Graphic Data System II) is the industry-standard binary file format used to deliver the final physical IC layout from the chip design house to the semiconductor foundry.
          It represents every physical mask layer—from deep N-wells and polysilicon gates up to top copper interconnects—as hierarchical collections of closed geometric polygons and coordinates.
        </p>
      </div>

      {/* Raw GDS Record Stream Inspector */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">GDSII Binary Record Hierarchy Inspector</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>BGNLIB &rarr; BGNSTR &rarr; BOUNDARY</span>
        </div>

        <div className="gds-stream-box">
          <div><strong style={{ color: '#ec4899' }}>HEADER:</strong> Format Version 600</div>
          <div><strong style={{ color: '#ec4899' }}>BGNLIB:</strong> Library "CHIP_TOP_LIB" (Last Modified 2026-11-04)</div>
          <div style={{ paddingLeft: '1.5rem' }}>
            <strong style={{ color: '#f59e0b' }}>BGNSTR:</strong> Structure "CHIP_CORE"
          </div>
          <div style={{ paddingLeft: '3rem', color: '#a7f3d0' }}>
            BOUNDARY [LAYER 30, DATATYPE 0] (Metal 1)<br />
            XY: (2000, 4000), (8000, 4000), (8000, 4280), (2000, 4280), (2000, 4000)<br />
            ENDEL
          </div>
          <div style={{ paddingLeft: '3rem', color: '#cbd5e1' }}>
            SREF: Instance "U_ALU/DFF_1" at XY: (12000, 40000)<br />
            ENDEL
          </div>
          <div style={{ paddingLeft: '1.5rem' }}>
            <strong style={{ color: '#f59e0b' }}>ENDSTR</strong>
          </div>
          <div><strong style={{ color: '#ec4899' }}>ENDLIB</strong></div>
        </div>
      </div>

      {/* Step 1: GDS Contents Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔬 Step 1: What Exactly is Stored in a GDSII File?
        </h4>
        <div className="mux-quiz-prompt">
          What physical design information does a GDSII file strictly contain?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="GDS contents question">
          <label className={`mux-quiz-option ${gdsContentsConcept === CORRECT_GDS_CONTENTS_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="gdsContentQuiz"
              value={CORRECT_GDS_CONTENTS_ID}
              checked={gdsContentsConcept === CORRECT_GDS_CONTENTS_ID}
              onChange={(e) => setGdsContentsConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Pure geometric mask polygons, layer/datatype numbers, and hierarchical cell instances:</strong> GDSII contains only 2D geometric shapes (polygons, wire paths, text labels, and XY coordinates). It does not contain Verilog logic, timing delays, SDC constraints, or electrical netlist connectivity.
            </span>
          </label>

          <label className={`mux-quiz-option ${gdsContentsConcept === 'opt-contains-c-code' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="gdsContentQuiz"
              value="opt-contains-c-code"
              checked={gdsContentsConcept === 'opt-contains-c-code'}
              onChange={(e) => setGdsContentsConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Software C code and timing constraints:</strong> GDSII stores high-level software algorithms rather than physical coordinates.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: OASIS vs GDSII */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📦 Step 2: Modern Evolution — GDSII vs OASIS
        </h4>
        <div className="mux-quiz-prompt">
          Why has the semiconductor industry largely transitioned to OASIS (Open Artwork System Interchange Standard) for tape-out mask delivery in modern 5nm/3nm nodes?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="OASIS question">
          <label className={`mux-quiz-option ${oasisConcept === CORRECT_OASIS_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="oasisQuiz"
              value={CORRECT_OASIS_ID}
              checked={oasisConcept === CORRECT_OASIS_ID}
              onChange={(e) => setOasisConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Massive File Size Reduction (~10&times; compression) and Variable-Precision Offsets:</strong> Modern chips have tens of billions of polygons, resulting in unwieldy 200+ GB GDSII files. OASIS uses modal variables, relative offsets, and efficient record packing to compress file sizes by up to 90% without loss of precision.
            </span>
          </label>

          <label className={`mux-quiz-option ${oasisConcept === 'opt-oasis-lossy' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="oasisQuiz"
              value="opt-oasis-lossy"
              checked={oasisConcept === 'opt-oasis-lossy'}
              onChange={(e) => setOasisConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>OASIS deletes every second polygon:</strong> It achieves small file sizes by throwing away half the wires on the chip.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ GDSII Foundation Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          📜 Verify GDSII Format
        </button>
      </div>
    </div>
  );
}
