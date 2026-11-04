/**
 * FCDecapStrategyChallenge.jsx
 * ============================
 * Interactive challenge for Level 4 (fc-4): Decap Cell Strategy.
 */

import React, { useState } from 'react';
import {
  validateFCDecapStrategy,
  CORRECT_DECAP_PENALTY_ID,
} from './validators/validateFCDecapStrategy.js';
import { calculateDecapDroop } from '../../engine/fillerCellsEngine.js';
import './FCDecapStrategyChallenge.css';

export default function FCDecapStrategyChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [sliderCapPf, setSliderCapPf] = useState(200);
  const [droop100Ans, setDroop100Ans] = useState('');
  const [droop500Ans, setDroop500Ans] = useState('');
  const [decapPenaltyConcept, setDecapPenaltyConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const liveDroop = calculateDecapDroop(100, 200, sliderCapPf);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateFCDecapStrategy({
      droop100Ans,
      droop500Ans,
      decapPenaltyConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="fc-decap-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🔋 Decoupling Capacitor (DECAP) Cells &amp; Dynamic IR Drop
        </h3>
        <p className="combseq-desc">
          When millions of flip-flops clock simultaneously, sudden transient current surges cause local power supply droop (L &middot; di/dt and R &middot; i).
          If the power rail droops by more than 5% (&gt; 50 mV on a 1.0V supply), logic gates slow down and cause catastrophic setup timing failures.
          <br />
          <strong>Decap Cells</strong> are MOS gate capacitors wired between VDD and VSS that act as on-die energy tanks, instantly supplying charge during clock edges!
        </p>
      </div>

      {/* Interactive Droop Visualizer */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">On-Die Decap Capacitance vs Supply Droop</span>
          <span style={{ fontSize: '0.85rem', color: liveDroop.isAcceptable ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            C_decap: {sliderCapPf} pF &rarr; Droop: {liveDroop.droopMv.toFixed(1)} mV {liveDroop.isAcceptable ? '(SAFE &le; 50 mV)' : '(VIOLATION > 50 mV)'}
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Nominal VDD line (1.00 V) */}
            <line x1="50" y1="50" x2="550" y2="50" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
            <text x="45" y="53" fill="#64748b" fontSize="9" textAnchor="end">1.00 V (Nominal)</text>

            {/* Threshold line (0.95 V -> 50 mV droop limit) */}
            <line x1="50" y1="80" x2="550" y2="80" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
            <text x="45" y="83" fill="#f43f5e" fontSize="9" textAnchor="end">0.95 V (5% limit)</text>

            {/* Dynamic Droop Waveform */}
            {/* Droop depth scales with liveDroop.droopMv */}
            {(() => {
              const droopY = Math.min(180, 50 + (liveDroop.droopMv * 0.6));
              return (
                <path
                  d={`M 80,50 L 220,50 Q 280,${droopY} 340,50 L 520,50`}
                  fill="none"
                  stroke={liveDroop.isAcceptable ? '#10b981' : '#ef4444'}
                  strokeWidth="3"
                />
              );
            })()}

            <text x="280" y="165" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Clock Transition Transient Surge (I = 100 mA, &Delta;t = 200 ps)
            </text>
          </svg>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label className="accum-port-label">On-Die Decap Capacitance: {sliderCapPf} pF</label>
          <input
            type="range"
            min="50"
            max="800"
            step="50"
            value={sliderCapPf}
            onChange={(e) => setSliderCapPf(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Step 1: Droop Calculations */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Compute Power Supply Droop (&Delta;V = I &middot; &Delta;t / C)
        </h4>
        <p className="dff-challenge__subtext">
          Transient Current <code>I = 100 mA</code>, Duration <code>&Delta;t = 200 ps</code>.<br />
          Compute the power supply droop in mV for:
          1. Initial small capacitance: <code>C_decap = 100 pF</code>.<br />
          2. Optimized dense decap placement: <code>C_decap = 500 pF</code>.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Droop at 100 pF (mV):</label>
            <input
              type="number"
              placeholder="e.g. 200"
              className="syn-opt-input"
              value={droop100Ans}
              onChange={(e) => setDroop100Ans(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Droop at 500 pF (mV):</label>
            <input
              type="number"
              placeholder="e.g. 40"
              className="syn-opt-input"
              value={droop500Ans}
              onChange={(e) => setDroop500Ans(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Decap Penalty Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          ⚠️ Step 2: The Trade-Off &amp; Penalty of Decap Cells
        </h4>
        <div className="mux-quiz-prompt">
          If Decap cells suppress dynamic IR drop so effectively, why cannot ASIC engineers fill 100% of empty row space with decaps?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Decap penalty question">
          <label className={`mux-quiz-option ${decapPenaltyConcept === CORRECT_DECAP_PENALTY_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="decapPenQuiz"
              value={CORRECT_DECAP_PENALTY_ID}
              checked={decapPenaltyConcept === CORRECT_DECAP_PENALTY_ID}
              onChange={(e) => setDecapPenaltyConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Substantial Gate Tunneling Leakage Power &amp; Dielectric Reliability (TDDB) Risk:</strong> Decap cells are wide-area MOS gate oxide capacitors. Millions of decaps conduct continuous quantum tunneling leakage current, drastically inflating standby battery drain and increasing susceptibility to oxide breakdown over the chip lifetime.
            </span>
          </label>

          <label className={`mux-quiz-option ${decapPenaltyConcept === 'opt-no-downside' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="decapPenQuiz"
              value="opt-no-downside"
              checked={decapPenaltyConcept === 'opt-no-downside'}
              onChange={(e) => setDecapPenaltyConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Decap cells have zero downside:</strong> They produce free power and should be placed everywhere.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Decap Strategy Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🔋 Verify Decap Strategy
        </button>
      </div>
    </div>
  );
}
