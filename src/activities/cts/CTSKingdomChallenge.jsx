/**
 * CTSKingdomChallenge.jsx
 * =======================
 * Capstone challenge for Level 5 (cts-5): CTS Kingdom Challenge.
 */

import React, { useState } from 'react';
import {
  validateCTSKingdom,
  CORRECT_ICG_CONCEPT_ID,
} from './validators/validateCTSKingdom.js';
import { computeClockTreeMetrics } from '../../engine/ctsEngine.js';
import './CTSKingdomChallenge.css';

const BASE_DELAYS = [0.120, 0.220, 0.170, 0.270];

export default function CTSKingdomChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [stages, setStages] = useState([0, 0, 0, 0]); // Stages for FF1, FF2, FF3, FF4
  const [icgConcept, setIcgConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleStageChange = (idx, delta) => {
    const updated = [...stages];
    updated[idx] = Math.max(0, Math.min(5, updated[idx] + delta));
    setStages(updated);
  };

  const currentArrivals = BASE_DELAYS.map((b, i) => b + (stages[i] * 0.050));
  const sinks = currentArrivals.map((arr, i) => ({ id: `FF${i + 1}`, arrivalTime: arr }));
  const liveMetrics = computeClockTreeMetrics(sinks, 0.030);
  const liveSkewPs = Math.round(liveMetrics.skew * 1000);
  const liveLatencyPs = Math.round(liveMetrics.latency * 1000);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateCTSKingdom({
      bufferStages: stages,
      icgConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="cts-capstone-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          👑 Clock Tree Synthesis Kingdom Capstone: Multi-Sink Balancing &amp; ICG Signoff
        </h3>
        <p className="combseq-desc">
          Balance the clock distribution network across 4 distributed register sinks:
          <br />
          <code>FF1 (0.120 ns) &bull; FF2 (0.220 ns) &bull; FF3 (0.170 ns) &bull; FF4 (0.270 ns)</code>
          <br />
          Requirements:
          1. <strong>Skew Constraint:</strong> Clock skew must be <strong>&le; 30 ps</strong> (Live: <strong>{liveSkewPs} ps</strong>).
          2. <strong>Insertion Latency:</strong> Max latency must be <strong>&le; 300 ps</strong> (Live: <strong>{liveLatencyPs} ps</strong>).
          3. <strong>ICG Strategy:</strong> Explain how Integrated Clock Gating minimizes dynamic clock tree power.
        </p>
      </div>

      {/* Clock Tree Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">4-Sink Distributed Clock Tree</span>
          <span style={{ fontSize: '0.85rem', color: liveMetrics.isBalanced ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            Skew: {liveSkewPs} ps ({liveSkewPs <= 30 ? 'MET &le; 30ps' : 'VIOLATION > 30ps'}) | Latency: {liveLatencyPs} ps
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 220" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Clock Root */}
            <circle cx="50" cy="110" r="14" fill="#38bdf8" />
            <text x="50" y="114" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">CLK</text>

            {/* Main Tree Trunk */}
            <line x1="64" y1="110" x2="160" y2="110" stroke="#38bdf8" strokeWidth="3" />
            <circle cx="160" cy="110" r="4" fill="#38bdf8" />

            {/* Branch to Top (FF1, FF2) */}
            <line x1="160" y1="110" x2="160" y2="50" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="160" y1="50" x2="280" y2="35" stroke="#38bdf8" strokeWidth="2" />
            <line x1="160" y1="50" x2="280" y2="85" stroke="#38bdf8" strokeWidth="2" />

            {/* Branch to Bottom (FF3, FF4) */}
            <line x1="160" y1="110" x2="160" y2="170" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="160" y1="170" x2="280" y2="145" stroke="#38bdf8" strokeWidth="2" />
            <line x1="160" y1="170" x2="280" y2="195" stroke="#38bdf8" strokeWidth="2" />

            {/* FF1 */}
            <rect x="440" y="20" width="100" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="490" y="38" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">
              FF1: {(currentArrivals[0] * 1000).toFixed(0)} ps ({stages[0]} buf)
            </text>

            {/* FF2 */}
            <rect x="440" y="70" width="100" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="490" y="88" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">
              FF2: {(currentArrivals[1] * 1000).toFixed(0)} ps ({stages[1]} buf)
            </text>

            {/* FF3 */}
            <rect x="440" y="130" width="100" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="490" y="148" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">
              FF3: {(currentArrivals[2] * 1000).toFixed(0)} ps ({stages[2]} buf)
            </text>

            {/* FF4 */}
            <rect x="440" y="180" width="100" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="490" y="198" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">
              FF4: {(currentArrivals[3] * 1000).toFixed(0)} ps ({stages[3]} buf)
            </text>

            {/* Buffer icons along wires */}
            <line x1="280" y1="35" x2="440" y2="35" stroke="#38bdf8" strokeWidth="2" />
            <line x1="280" y1="85" x2="440" y2="85" stroke="#38bdf8" strokeWidth="2" />
            <line x1="280" y1="145" x2="440" y2="145" stroke="#38bdf8" strokeWidth="2" />
            <line x1="280" y1="195" x2="440" y2="195" stroke="#38bdf8" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Step 1: Interactive Buffer Allocation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Insert Balancing Buffers (+50 ps / stage)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {[
            { id: 'FF1', name: 'Launch Flop (FF1)', raw: '120 ps' },
            { id: 'FF2', name: 'NAND Flop (FF2)',   raw: '220 ps' },
            { id: 'FF3', name: 'MUX Flop (FF3)',    raw: '170 ps' },
            { id: 'FF4', name: 'Capture Flop (FF4)',raw: '270 ps' },
          ].map((item, idx) => (
            <div key={item.id} className="syn-opt-card">
              <span style={{ fontWeight: 800, color: '#38bdf8' }}>{item.name}</span>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Base Delay: {item.raw}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontWeight: 700 }}>Stages: {stages[idx]}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ padding: '2px 8px' }}
                    disabled={stages[idx] <= 0}
                    onClick={() => handleStageChange(idx, -1)}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ padding: '2px 8px' }}
                    disabled={stages[idx] >= 5}
                    onClick={() => handleStageChange(idx, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '4px', fontWeight: 600 }}>
                Arrival: {(currentArrivals[idx] * 1000).toFixed(0)} ps
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Integrated Clock Gating (ICG) Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🌱 Step 2: Low-Power Design with Integrated Clock Gating (ICG)
        </h4>
        <div className="mux-quiz-prompt">
          Why do physical design tools insert Integrated Clock Gating (ICG) cells into clock trees rather than simple discrete AND gates?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="ICG question">
          <label className={`mux-quiz-option ${icgConcept === CORRECT_ICG_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="icgQuiz"
              value={CORRECT_ICG_CONCEPT_ID}
              checked={icgConcept === CORRECT_ICG_CONCEPT_ID}
              onChange={(e) => setIcgConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Glitch-free clock disabling to save up to 70% dynamic power:</strong> An ICG incorporates an internal latch that holds the enable signal stable during the clock active phase, preventing spurious clock glitches/runt pulses that occur when using ordinary AND/OR gates.
            </span>
          </label>

          <label className={`mux-quiz-option ${icgConcept === 'opt-icg-useless' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="icgQuiz"
              value="opt-icg-useless"
              checked={icgConcept === 'opt-icg-useless'}
              onChange={(e) => setIcgConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>ICG cells double the clock frequency:</strong> They are used to make clocks toggle twice as fast.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ CTS Kingdom Capstone Certified!' : '⚠️ Capstone Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          👑 Certify CTS Kingdom &amp; Unlock Routing
        </button>
      </div>
    </div>
  );
}
