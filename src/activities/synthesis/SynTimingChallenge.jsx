/**
 * SynTimingChallenge.jsx
 * =======================
 * Interactive challenge for Level 4 (syn-4): Timing Constraints.
 */

import React, { useState } from 'react';
import {
  validateSynTiming,
  CORRECT_TIMING_FIX_ID,
  CORRECT_SDC_CONCEPT_ID,
} from './validators/validateSynTiming.js';
import './SynTimingChallenge.css';

export default function SynTimingChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [sc1Arrival, setSc1Arrival] = useState('');
  const [sc1Required, setSc1Required] = useState('');
  const [sc1Slack, setSc1Slack] = useState('');
  const [sc2Slack, setSc2Slack] = useState('');
  const [fixStrategy, setFixStrategy] = useState('');
  const [sdcConcept, setSdcConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateSynTiming({
      sc1Arrival,
      sc1Required,
      sc1Slack,
      sc2Slack,
      fixStrategy,
      sdcConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="syn-timing-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          ⏱️ Synopsys Design Constraints (SDC) &amp; Setup Timing
        </h3>
        <p className="combseq-desc">
          Logic synthesis cannot optimize blindly; it requires precise timing budgets defined in an <strong>SDC file</strong>. The primary constraint is the target clock period: <code>create_clock -period 1.0 -name clk [get_ports clk]</code> (1.0 ns = 1 GHz).
        </p>
        <div className="dff-challenge__callout" style={{ background: '#e0f2fe', borderColor: '#0ea5e9', color: '#0369a1' }}>
          <strong>Setup Slack Equation:</strong><br />
          T_arrival = T_cq + T_comb<br />
          T_required = T_period - T_setup + T_skew<br />
          Slack = T_required - T_arrival (Must be &ge; 0 for timing closure).
        </div>
      </div>

      {/* Timing Path Diagram */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Register-to-Register Timing Path</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Launch Flop → Combinational Logic Cloud → Capture Flop
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 660 160" style={{ width: '100%', maxWidth: '660px' }}>
            {/* Launch Flop */}
            <rect x="50" y="30" width="90" height="100" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="95" y="60" fill="#38bdf8" fontSize="12" fontWeight="800" textAnchor="middle">LAUNCH</text>
            <text x="95" y="80" fill="#94a3b8" fontSize="10" textAnchor="middle">DFF_X1</text>
            <text x="95" y="105" fill="#f87171" fontSize="10" textAnchor="middle">T_cq = 0.15 ns</text>

            {/* Comb Cloud */}
            <path d="M 200 40 Q 280 20 360 40 Q 420 80 360 120 Q 280 140 200 120 Q 150 80 200 40 Z" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
            <text x="280" y="75" fill="#fbbf24" fontSize="13" fontWeight="800" textAnchor="middle">Combinational Logic</text>
            <text x="280" y="95" fill="#cbd5e1" fontSize="11" textAnchor="middle">Gates &amp; Interconnect (T_comb)</text>

            {/* Capture Flop */}
            <rect x="470" y="30" width="90" height="100" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="2" />
            <text x="515" y="60" fill="#34d399" fontSize="12" fontWeight="800" textAnchor="middle">CAPTURE</text>
            <text x="515" y="80" fill="#94a3b8" fontSize="10" textAnchor="middle">DFF_X1</text>
            <text x="515" y="105" fill="#fbbf24" fontSize="10" textAnchor="middle">T_setup = 0.08 ns</text>

            {/* Connecting wires */}
            <line x1="140" y1="80" x2="180" y2="80" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="380" y1="80" x2="470" y2="80" stroke="#fbbf24" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      {/* Scenario 1: Met Timing */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📊 Scenario 1: Calculate Slack for Normal Path
        </h4>
        <p className="dff-challenge__subtext">
          Parameters: T_period = 1.00 ns, T_cq = 0.15 ns, T_setup = 0.08 ns, T_skew = 0.00 ns, T_comb = 0.52 ns.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Data Arrival Time (ns):</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.67"
              className="syn-opt-input"
              value={sc1Arrival}
              onChange={(e) => setSc1Arrival(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Data Required Time (ns):</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.92"
              className="syn-opt-input"
              value={sc1Required}
              onChange={(e) => setSc1Required(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Setup Slack (ns):</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.25"
              className="syn-opt-input"
              value={sc1Slack}
              onChange={(e) => setSc1Slack(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Scenario 2: Violated Timing */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          ⚠️ Scenario 2: Deep Combinational Path Violation
        </h4>
        <p className="dff-challenge__subtext">
          A deeply cascaded combinational path has T_comb = 0.85 ns under the same 1.00 ns clock (T_cq = 0.15 ns, T_setup = 0.08 ns).
        </p>

        <div style={{ maxWidth: '240px', marginTop: '0.75rem' }}>
          <label className="accum-port-label">Calculated Setup Slack (ns):</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. -0.08"
            className="syn-opt-input"
            value={sc2Slack}
            onChange={(e) => setSc2Slack(e.target.value)}
          />
        </div>
      </div>

      {/* Remediation strategy */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🛠️ Step 3: Synthesis Remediation for Negative Slack
        </h4>
        <div className="mux-quiz-prompt">
          When the synthesis compiler encounters a negative setup slack of -0.08 ns, which architectural technique is used to close timing without sacrificing frequency?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Timing remediation question">
          <label className={`mux-quiz-option ${fixStrategy === CORRECT_TIMING_FIX_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="timingFix"
              value={CORRECT_TIMING_FIX_ID}
              checked={fixStrategy === CORRECT_TIMING_FIX_ID}
              onChange={(e) => setFixStrategy(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Pipelining and Register Retiming:</strong> Insert an intermediate register stage to split the 0.85 ns combinational cloud into two balanced 0.42 ns stages, or use high-drive cell sizing to increase drive strength (R_on reduction).
            </span>
          </label>

          <label className={`mux-quiz-option ${fixStrategy === 'opt-slow-clock' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="timingFix"
              value="opt-slow-clock"
              checked={fixStrategy === 'opt-slow-clock'}
              onChange={(e) => setFixStrategy(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Slow down the chip:</strong> Always decrease the target system clock frequency in the product specification instead of modifying logic.
            </span>
          </label>
        </div>
      </div>

      {/* SDC Uncertainty Concept */}
      <div className="dff-challenge__concept-section" style={{ marginTop: '1.5rem' }}>
        <h4 className="dff-challenge__section-title">
          🛡️ Step 4: SDC Clock Uncertainty &amp; Jitter Margin
        </h4>
        <div className="mux-quiz-prompt">
          Why do physical design engineers specify <code>set_clock_uncertainty 0.05 [get_clocks clk]</code> in SDC files?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Clock uncertainty question">
          <label className={`mux-quiz-option ${sdcConcept === CORRECT_SDC_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="sdcQuiz"
              value={CORRECT_SDC_CONCEPT_ID}
              checked={sdcConcept === CORRECT_SDC_CONCEPT_ID}
              onChange={(e) => setSdcConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Accounts for PLL jitter, power-supply noise, and clock skew margin:</strong> Real silicon clock edges fluctuate over time; uncertainty acts as an intentional safety guardband subtracted from the required time during pre-CTS synthesis.
            </span>
          </label>

          <label className={`mux-quiz-option ${sdcConcept === 'opt-uncertainty-ignore' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="sdcQuiz"
              value="opt-uncertainty-ignore"
              checked={sdcConcept === 'opt-uncertainty-ignore'}
              onChange={(e) => setSdcConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Uncertainty is only a comment:</strong> The synthesis tool ignores this constraint during timing calculations.
            </span>
          </label>
        </div>
      </div>

      {/* External STA link */}
      <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>Explore Deep Timing in STA Playground</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Analyze timing graphs, PVT deratings, and arrival slack in the standalone laboratory.</div>
        </div>
        <a href="https://ppawar-7.github.io/sta-playground/" target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
          Open STA Playground ↗
        </a>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Timing Analysis Verified!' : '⚠️ Timing Analysis Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          ⏱️ Verify Timing Constraints &amp; Slack Calculations
        </button>
      </div>
    </div>
  );
}
