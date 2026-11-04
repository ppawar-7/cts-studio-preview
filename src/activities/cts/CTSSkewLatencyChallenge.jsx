/**
 * CTSSkewLatencyChallenge.jsx
 * ===========================
 * Interactive challenge for Level 2 (cts-2): Clock Skew and Latency.
 */

import React, { useState } from 'react';
import {
  validateCTSSkewLatency,
  CORRECT_HOLD_HAZARD_ID,
} from './validators/validateCTSSkewLatency.js';
import { calculateSkewImpact } from '../../engine/ctsEngine.js';
import './CTSSkewLatencyChallenge.css';

export default function CTSSkewLatencyChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [launchLatency, setLaunchLatency] = useState('0.20');
  const [captureLatency, setCaptureLatency] = useState('0.28');
  const [setupSlackAns, setSetupSlackAns] = useState('');
  const [holdRiskConcept, setHoldRiskConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const tLaunch = parseFloat(launchLatency) || 0.20;
  const tCapture = parseFloat(captureLatency) || 0.28;

  const liveMetrics = calculateSkewImpact({
    periodNs: 1.00,
    tCqNs: 0.10,
    tCombNs: 0.85,
    tSetupNs: 0.10,
    tHoldNs: 0.05,
    launchArrivalNs: tLaunch,
    captureArrivalNs: tCapture,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateCTSSkewLatency({
      launchLatency,
      captureLatency,
      setupSlackAns,
      holdRiskConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="cts-skew-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          ⏱️ Clock Latency &amp; Skew: Setup vs Hold Trade-Off
        </h3>
        <p className="combseq-desc">
          <strong>Clock Latency (Insertion Delay):</strong> Time from clock source to flop clock pin.
          <br />
          <strong>Clock Skew (&Delta;t):</strong> T_capture - T_launch.
          <br />
          When skew is positive (clock arrives later at capture flop), setup time margin expands because capture happens later. However, hold time margin shrinks because fast data can overtake the previous clock edge!
        </p>
      </div>

      {/* Interactive Timing & Skew Visualizer */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Live Clock Domain Timing Monitor</span>
          <span style={{ fontSize: '0.85rem', color: liveMetrics.setupPassed ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            Skew: {liveMetrics.skew > 0 ? `+${liveMetrics.skew.toFixed(3)}` : liveMetrics.skew.toFixed(3)} ns | Setup Slack: {liveMetrics.setupSlack.toFixed(3)} ns ({liveMetrics.setupPassed ? 'MET' : 'VIOLATED'})
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 210" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Clock Root */}
            <circle cx="50" cy="100" r="14" fill="#38bdf8" />
            <text x="50" y="104" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">CLK</text>

            {/* Launch Path */}
            <path d="M 64,100 L 150,50 L 220,50" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
            <rect x="220" y="30" width="80" height="40" rx="3" fill="#1e293b" stroke="#60a5fa" strokeWidth="2" />
            <text x="260" y="50" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">Launch FF</text>
            <text x="260" y="62" fill="#93c5fd" fontSize="8" textAnchor="middle">t_clk = {tLaunch.toFixed(2)}ns</text>

            {/* Capture Path */}
            <path d="M 64,100 L 150,150 L 440,150" fill="none" stroke="#f472b6" strokeWidth="2.5" />
            <rect x="440" y="130" width="80" height="40" rx="3" fill="#1e293b" stroke="#f472b6" strokeWidth="2" />
            <text x="480" y="150" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">Capture FF</text>
            <text x="480" y="162" fill="#fbcfe8" fontSize="8" textAnchor="middle">t_clk = {tCapture.toFixed(2)}ns</text>

            {/* Data Path */}
            <path d="M 300,50 L 370,50 L 370,140 L 440,140" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2" />
            <text x="375" y="95" fill="#fbbf24" fontSize="9" fontWeight="700">Data (0.85ns)</text>
          </svg>
        </div>

        {/* Sliders for Interactive Discovery */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Launch Clock Latency (ns):</label>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.01"
              value={launchLatency}
              onChange={(e) => setLaunchLatency(e.target.value)}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current: {launchLatency} ns</span>
          </div>

          <div>
            <label className="accum-port-label">Capture Clock Latency (ns):</label>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.01"
              value={captureLatency}
              onChange={(e) => setCaptureLatency(e.target.value)}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current: {captureLatency} ns</span>
          </div>
        </div>
      </div>

      {/* Step 1: Slack Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Calculate Setup Slack with Useful Skew
        </h4>
        <p className="dff-challenge__subtext">
          Target Clock Period: <code>1.00 ns</code> (1 GHz).<br />
          Delays: <code>T_cq = 0.10 ns</code>, <code>T_comb = 0.85 ns</code>, <code>T_setup = 0.10 ns</code>.<br />
          Launch Latency = <code>0.20 ns</code>, Capture Latency = <code>0.28 ns</code> (Skew = <code>+0.08 ns</code>).<br />
          What is the resulting Setup Slack?
        </p>

        <div style={{ maxWidth: '240px', marginTop: '0.75rem' }}>
          <label className="accum-port-label">Setup Slack (ns):</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 0.03"
            className="syn-opt-input"
            value={setupSlackAns}
            onChange={(e) => setSetupSlackAns(e.target.value)}
          />
        </div>
      </div>

      {/* Step 2: Hold Hazard Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          ⚠️ Step 2: The Critical Danger of Positive Skew
        </h4>
        <div className="mux-quiz-prompt">
          While positive clock skew (+0.08 ns) helps fix the setup violation on this slow path, what major hazard does it introduce on short/fast logic paths?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Hold hazard question">
          <label className={`mux-quiz-option ${holdRiskConcept === CORRECT_HOLD_HAZARD_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="holdRiskQuiz"
              value={CORRECT_HOLD_HAZARD_ID}
              checked={holdRiskConcept === CORRECT_HOLD_HAZARD_ID}
              onChange={(e) => setHoldRiskConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Severe Hold Time Violations (Race Conditions):</strong> Because the capture flop receives its clock edge later, fast combinational data from the current cycle can arrive early and overwrite data before the capture flop has safely sampled it. Hold violations cannot be fixed by lowering clock frequency!
            </span>
          </label>

          <label className={`mux-quiz-option ${holdRiskConcept === 'opt-no-hazard' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="holdRiskQuiz"
              value="opt-no-hazard"
              checked={holdRiskConcept === 'opt-no-hazard'}
              onChange={(e) => setHoldRiskConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>No hazard:</strong> Positive skew has no side effects and should always be maximized across the entire chip.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Skew & Latency Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          ⏱️ Verify Skew &amp; Slack Closure
        </button>
      </div>
    </div>
  );
}
