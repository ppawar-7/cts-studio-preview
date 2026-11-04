/**
 * RTSignalIntegrityChallenge.jsx
 * ==============================
 * Interactive challenge for Level 4 (rt-4): Signal Integrity & Crosstalk.
 */

import React, { useState } from 'react';
import {
  validateRTSignalIntegrity,
  CORRECT_CROSSTALK_MITIGATION_ID,
} from './validators/validateRTSignalIntegrity.js';
import { computeCouplingCapacitance, computeCrosstalkGlitch } from '../../engine/routingEngine.js';
import './RTSignalIntegrityChallenge.css';

export default function RTSignalIntegrityChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [parallelLength, setParallelLength] = useState('100');
  const [wireSpacing, setWireSpacing] = useState('0.20');
  const [couplingCapAns, setCouplingCapAns] = useState('');
  const [glitchVoltageAns, setGlitchVoltageAns] = useState('');
  const [mitigationConcept, setMitigationConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const L = parseFloat(parallelLength) || 100;
  const S = parseFloat(wireSpacing) || 0.20;

  const liveCc = computeCouplingCapacitance(L, S, 0.04);
  const liveGlitch = computeCrosstalkGlitch(liveCc, 60.0, 1.0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateRTSignalIntegrity({
      couplingCapAns,
      glitchVoltageAns,
      mitigationConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="rt-si-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          ⚡ Signal Integrity &amp; Capacitive Crosstalk Noise
        </h3>
        <p className="combseq-desc">
          In nanoscale technologies, tall aspect-ratio metal wires create massive sidewall coupling capacitance (Cc) between adjacent parallel traces.
          When an &ldquo;Aggressor&rdquo; net rapidly switches from 0 to 1, capacitive coupling injects charge into the neighboring &ldquo;Victim&rdquo; wire, producing a voltage glitch:
          <br />
          <strong>Glitch Formula:</strong> &Delta;V = Vdd &times; [Cc / (Cc + Cground)].
          If &Delta;V exceeds noise margins (&gt; 0.25 V), it triggers false logic transitions or corrupts clocked register states!
        </p>
      </div>

      {/* Interactive Crosstalk Visualizer */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">Live Crosstalk &amp; Noise Glitch Monitor</span>
          <span style={{ fontSize: '0.85rem', color: liveGlitch.isGlitchCritical ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
            Cc: {liveCc.toFixed(1)} fF | Noise Glitch: {liveGlitch.noiseGlitchV.toFixed(3)} V {liveGlitch.isGlitchCritical ? '(CRITICAL HAZARD > 0.25V)' : '(SAFE NOISE MARGIN)'}
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Aggressor Wire (Red) */}
            <rect x="80" y="45" width="440" height="15" fill="#ef4444" rx="3" />
            <text x="50" y="56" fill="#ef4444" fontSize="10" fontWeight="700" textAnchor="end">Aggressor</text>
            <path d="M 525,40 L 535,40 L 535,60 L 545,60" fill="none" stroke="#ef4444" strokeWidth="2" />
            <text x="550" y="55" fill="#ef4444" fontSize="8">Switching (0&rarr;1)</text>

            {/* Coupling capacitors between wires */}
            {Array.from({ length: 7 }).map((_, i) => {
              const xPos = 120 + (i * 50);
              return (
                <g key={i}>
                  <line x1={xPos} y1="60" x2={xPos} y2="80" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1={xPos - 6} y1="80" x2={xPos + 6} y2="80" stroke="#f59e0b" strokeWidth="2" />
                  <line x1={xPos - 6} y1="85" x2={xPos + 6} y2="85" stroke="#f59e0b" strokeWidth="2" />
                  <line x1={xPos} y1="85" x2={xPos} y2="105" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                </g>
              );
            })}
            <text x="300" y="98" fill="#f59e0b" fontSize="9" fontWeight="700" textAnchor="middle">
              Coupling Capacitance (Cc = {liveCc.toFixed(1)} fF)
            </text>

            {/* Victim Wire (Cyan) */}
            <rect x="80" y="105" width="440" height="15" fill="#0ea5e9" rx="3" />
            <text x="50" y="116" fill="#0ea5e9" fontSize="10" fontWeight="700" textAnchor="end">Victim</text>

            {/* Induced Glitch Waveform */}
            <path d="M 525,120 L 535,120 Q 540,100 545,120 L 555,120" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            <text x="560" y="115" fill="#f59e0b" fontSize="8" fontWeight="700">Glitch &Delta;V={liveGlitch.noiseGlitchV.toFixed(2)}V</text>
          </svg>
        </div>

        {/* Dynamic Sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Parallel Run Length L (µm):</label>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={parallelLength}
              onChange={(e) => setParallelLength(e.target.value)}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current: {parallelLength} µm</span>
          </div>

          <div>
            <label className="accum-port-label">Wire Spacing S (µm):</label>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={wireSpacing}
              onChange={(e) => setWireSpacing(e.target.value)}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current: {wireSpacing} µm</span>
          </div>
        </div>
      </div>

      {/* Step 1: Coupling Capacitance & Glitch Calculations */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Calculate Coupling Capacitance &amp; Noise Glitch
        </h4>
        <p className="dff-challenge__subtext">
          Given Parameters: Parallel length <code>L = 100 µm</code>, Spacing <code>S = 0.20 µm</code>, Dielectric constant <code>k = 0.04 fF</code>.<br />
          Victim Ground Capacitance <code>Cground = 60.0 fF</code>, Supply Voltage <code>Vdd = 1.0 V</code>.<br />
          Compute the Coupling Capacitance (Cc) and resulting Noise Glitch (&Delta;V).
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Coupling Capacitance Cc (fF):</label>
            <input
              type="number"
              placeholder="e.g. 20.0"
              className="syn-opt-input"
              value={couplingCapAns}
              onChange={(e) => setCouplingCapAns(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Induced Glitch Voltage &Delta;V (V):</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.25"
              className="syn-opt-input"
              value={glitchVoltageAns}
              onChange={(e) => setGlitchVoltageAns(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Mitigation Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🛡️ Step 2: Physical Design Crosstalk Mitigation
        </h4>
        <div className="mux-quiz-prompt">
          How do physical design engineers fix severe crosstalk noise violations on critical nets during routing optimization?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Crosstalk mitigation question">
          <label className={`mux-quiz-option ${mitigationConcept === CORRECT_CROSSTALK_MITIGATION_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="siMitQuiz"
              value={CORRECT_CROSSTALK_MITIGATION_ID}
              checked={mitigationConcept === CORRECT_CROSSTALK_MITIGATION_ID}
              onChange={(e) => setMitigationConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Shielding with VSS Guard Traces &amp; Applying Double Spacing:</strong> Inserting grounded VSS shield wires between the aggressor and victim shunts coupling capacitance to ground, while increasing spacing from 1x to 2x or 3x pitch cuts sidewall capacitance in half.
            </span>
          </label>

          <label className={`mux-quiz-option ${mitigationConcept === 'opt-squeeze-closer' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="siMitQuiz"
              value="opt-squeeze-closer"
              checked={mitigationConcept === 'opt-squeeze-closer'}
              onChange={(e) => setMitigationConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Squeeze wires even closer together:</strong> Reducing spacing down to minimum DRC limits cancels all capacitive crosstalk.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Signal Integrity Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          ⚡ Verify Signal Integrity Solutions
        </button>
      </div>
    </div>
  );
}
