/**
 * CTSBufferInsertionChallenge.jsx
 * ================================
 * Interactive challenge for Level 3 (cts-3): Buffer Insertion.
 */

import React, { useState } from 'react';
import {
  validateCTSBufferInsertion,
  CORRECT_SLEW_CONCEPT_ID,
} from './validators/validateCTSBufferInsertion.js';
import './CTSBufferInsertionChallenge.css';

export default function CTSBufferInsertionChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [bufferStages, setBufferStages] = useState(0);
  const [chosenBuffer, setChosenBuffer] = useState('CLKBUF_X2');
  const [slewConcept, setSlewConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  // Branch A baseline: 0.100 ns. Branch B: 0.250 ns.
  const delayPerStage = chosenBuffer === 'CLKBUF_X2' ? 0.050 : 0.025;
  const branchADelay = 0.100 + (bufferStages * delayPerStage);
  const branchBDelay = 0.250;
  const currentSkewPs = Math.round(Math.abs(branchBDelay - branchADelay) * 1000);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateCTSBufferInsertion({
      bufferStages,
      chosenBuffer,
      slewConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="cts-buffer-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          ⚡ Buffer Insertion: Equalizing Branch Delay &amp; Transition Slew
        </h3>
        <p className="combseq-desc">
          Clock tree synthesis engines balance asymmetric clock arrival times by inserting delay buffers on earlier paths to match the slowest branch.
          Additionally, repeaters are inserted along long clock routes to regenerate sharp clock transition edges (slew) and avoid capacitive RC degradation.
        </p>
      </div>

      {/* Interactive Branch Balancing Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Asymmetric Clock Tree Balancing Canvas</span>
          <span style={{ fontSize: '0.85rem', color: currentSkewPs <= 30 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            Live Skew: {currentSkewPs} ps {currentSkewPs <= 30 ? '(Balanced &le; 30 ps)' : '(Unbalanced > 30 ps)'}
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Clock Root */}
            <circle cx="50" cy="100" r="14" fill="#38bdf8" />
            <text x="50" y="104" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">CLK</text>

            {/* Branch A (Short branch - needs buffers) */}
            <path d="M 64,100 L 150,50 L 320,50" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <rect x="420" y="30" width="80" height="40" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="460" y="50" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">Sink A (Short)</text>
            <text x="460" y="62" fill="#38bdf8" fontSize="8" textAnchor="middle">t = {branchADelay.toFixed(3)} ns</text>

            {/* Dynamically Rendered Inserted Buffers on Branch A */}
            {Array.from({ length: bufferStages }).map((_, i) => {
              const xPos = 160 + (i * 45);
              return (
                <g key={i}>
                  <polygon
                    points={`${xPos},38 ${xPos + 28},50 ${xPos},62`}
                    fill="#10b981"
                    stroke="#a7f3d0"
                    strokeWidth="1.5"
                  />
                  <text x={xPos + 10} y="53" fill="#ffffff" fontSize="7" fontWeight="700">BUF</text>
                </g>
              );
            })}
            <line x1={160 + (bufferStages * 45)} y1="50" x2="420" y2="50" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Branch B (Long branch - high latency) */}
            <path d="M 64,100 L 150,150 L 420,150" fill="none" stroke="#f472b6" strokeWidth="2.5" />
            <rect x="420" y="130" width="80" height="40" rx="3" fill="#1e293b" stroke="#f472b6" strokeWidth="2" />
            <text x="460" y="150" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">Sink B (Long)</text>
            <text x="460" y="162" fill="#f472b6" fontSize="8" textAnchor="middle">t = {branchBDelay.toFixed(3)} ns</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Buffer Sizing and Stage Selection */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Select Buffer Type &amp; Stages to Insert into Branch A
        </h4>
        <p className="dff-challenge__subtext">
          Branch A baseline arrival = <code>0.100 ns</code>.<br />
          Branch B arrival = <code>0.250 ns</code>.<br />
          Skew delta to compensate = <code>0.150 ns</code> (150 ps).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Buffer Cell Type:</label>
            <select
              className="syn-opt-select"
              value={chosenBuffer}
              onChange={(e) => setChosenBuffer(e.target.value)}
            >
              <option value="CLKBUF_X2">CLKBUF_X2 (+0.050 ns / stage)</option>
              <option value="CLKBUF_X8">CLKBUF_X8 (+0.025 ns / stage)</option>
            </select>
          </div>

          <div>
            <label className="accum-port-label">Buffer Stages on Branch A: {bufferStages}</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={bufferStages <= 0}
                onClick={() => setBufferStages((s) => Math.max(0, s - 1))}
              >
                - Remove Buffer
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={bufferStages >= 5}
                onClick={() => setBufferStages((s) => s + 1)}
              >
                + Add Buffer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Slew Control Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          ⚡ Step 2: Why Sharp Clock Slew Matters
        </h4>
        <div className="mux-quiz-prompt">
          Besides skew balancing, why is maximum transition time (slew) strictly budgeted during Clock Tree Synthesis?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Slew control question">
          <label className={`mux-quiz-option ${slewConcept === CORRECT_SLEW_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="slewQuiz"
              value={CORRECT_SLEW_CONCEPT_ID}
              checked={slewConcept === CORRECT_SLEW_CONCEPT_ID}
              onChange={(e) => setSlewConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Prevent high dynamic short-circuit power, clock jitter, and setup degradation:</strong> Slow, degraded clock transitions cause prolonged crowbar current in CMOS gates, increase susceptibility to noise and cross-talk, and degrade flip-flop setup times.
            </span>
          </label>

          <label className={`mux-quiz-option ${slewConcept === 'opt-slew-unimportant' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="slewQuiz"
              value="opt-slew-unimportant"
              checked={slewConcept === 'opt-slew-unimportant'}
              onChange={(e) => setSlewConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Slew is unimportant:</strong> Clock edges can be as slow as 5 nanoseconds without affecting chip power or functionality.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Buffer Insertion Certified!' : '⚠️ Balancing Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          ⚡ Certify Buffer Insertion
        </button>
      </div>
    </div>
  );
}
