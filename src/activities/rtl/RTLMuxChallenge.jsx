/**
 * RTLMuxChallenge.jsx
 * ====================
 * Interactive digital design challenge for Level 1 (rtl-1: "What is RTL?").
 *
 * Teaches:
 * 1. Data steering: How register-transfer paths are conditionally directed.
 * 2. Gate-level equivalent of a 2:1 MUX: Y = (~SEL & A) | (SEL & B).
 * 3. Complete 8-state truth table verification.
 * 4. RTL abstraction vs physical synthesis reality.
 */

import React, { useState } from 'react';
import {
  validateMuxChallenge,
  EXPECTED_MUX_TRUTH_TABLE,
  CORRECT_CONCEPT_ANSWER_ID,
} from './validators/validateMuxChallenge.js';
import './RTLMuxChallenge.css';

export default function RTLMuxChallenge({ onVerify, alreadyCompleted, level }) {
  // Live circuit simulator state
  const [liveSel, setLiveSel] = useState(0);
  const [liveA, setLiveA] = useState(1);
  const [liveB, setLiveB] = useState(0);

  // Student truth table inputs: array of 8 outputs (null initially)
  const [tableOutputs, setTableOutputs] = useState(Array(8).fill(null));

  // Conceptual synthesis question state
  const [conceptAnswer, setConceptAnswer] = useState('');

  // Local verification result state
  const [validationResult, setValidationResult] = useState(null);

  // Calculate live circuit internal states
  const liveNotSel = liveSel === 1 ? 0 : 1;
  const liveAnd1 = liveA === 1 && liveNotSel === 1 ? 1 : 0;
  const liveAnd2 = liveB === 1 && liveSel === 1 ? 1 : 0;
  const liveY = liveAnd1 === 1 || liveAnd2 === 1 ? 1 : 0;

  // Handle individual truth table cell change
  const handleTableCellChange = (idx, value) => {
    const next = [...tableOutputs];
    next[idx] = value === '' ? null : Number(value);
    setTableOutputs(next);
  };

  // Set circuit controls to a specific truth table row for live inspection
  const testTableRowInCircuit = (row) => {
    setLiveSel(row.sel);
    setLiveA(row.a);
    setLiveB(row.b);
  };

  // Run pure deterministic validation
  const handleValidate = () => {
    const result = validateMuxChallenge({ tableOutputs, conceptAnswer });
    setValidationResult(result);
    if (onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="mux-challenge">
      {/* Educational Brief */}
      <div className="mux-challenge__intro">
        <p>
          <strong>What is RTL?</strong> Register Transfer Level (RTL) models a digital circuit as
          data flowing between hardware storage registers through combinational logic networks.
        </p>
        <p>
          The fundamental building block of RTL dataflow steering is the <strong>2:1 Multiplexer (MUX)</strong>.
          Whether in an <code>if-else</code> conditional, an ALU bus selector, or a register clock-enable loop,
          multiplexers steer which signal path advances into destination registers.
        </p>
      </div>

      {/* Interactive Circuit Schematic */}
      <div className="mux-challenge__schematic-card">
        <div className="mux-challenge__schematic-header">
          <div className="mux-challenge__schematic-title">
            <span>⚡ Interactive Gate-Level Schematic</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Y = (~SEL · A) + (SEL · B)</span>
          </div>

          <div className="mux-challenge__controls">
            <div className="mux-challenge__control-group">
              <label>SEL:</label>
              <button
                type="button"
                className={`mux-btn-toggle ${liveSel === 0 ? 'active-0' : 'active-1'}`}
                onClick={() => setLiveSel(liveSel === 0 ? 1 : 0)}
              >
                {liveSel}
              </button>
            </div>
            <div className="mux-challenge__control-group">
              <label>A:</label>
              <button
                type="button"
                className={`mux-btn-toggle ${liveA === 0 ? 'active-0' : 'active-1'}`}
                onClick={() => setLiveA(liveA === 0 ? 1 : 0)}
              >
                {liveA}
              </button>
            </div>
            <div className="mux-challenge__control-group">
              <label>B:</label>
              <button
                type="button"
                className={`mux-btn-toggle ${liveB === 0 ? 'active-0' : 'active-1'}`}
                onClick={() => setLiveB(liveB === 0 ? 1 : 0)}
              >
                {liveB}
              </button>
            </div>
          </div>
        </div>

        {/* SVG Schematic */}
        <svg className="mux-svg-schematic" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
          {/* Wire styles */}
          <defs>
            <linearGradient id="wireHigh" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* Input A Line */}
          <line x1="30" y1="45" x2="210" y2="45" stroke={liveA ? '#10b981' : '#475569'} strokeWidth="3" />
          <text x="15" y="50" fill="#f8fafc" fontSize="13" fontWeight="bold">A ({liveA})</text>

          {/* Input B Line */}
          <line x1="30" y1="155" x2="210" y2="155" stroke={liveB ? '#10b981' : '#475569'} strokeWidth="3" />
          <text x="15" y="160" fill="#f8fafc" fontSize="13" fontWeight="bold">B ({liveB})</text>

          {/* SEL Input Line */}
          <line x1="30" y1="100" x2="90" y2="100" stroke={liveSel ? '#10b981' : '#475569'} strokeWidth="3" />
          <text x="5" y="105" fill="#f8fafc" fontSize="13" fontWeight="bold">SEL ({liveSel})</text>

          {/* Inverter for SEL */}
          <polygon points="90,85 130,100 90,115" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="135" cy="100" r="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          {/* Inverted SEL to AND1 */}
          <line x1="140" y1="100" x2="170" y2="100" stroke={liveNotSel ? '#10b981' : '#475569'} strokeWidth="2" />
          <line x1="170" y1="100" x2="170" y2="65" stroke={liveNotSel ? '#10b981' : '#475569'} strokeWidth="2" />
          <line x1="170" y1="65" x2="210" y2="65" stroke={liveNotSel ? '#10b981' : '#475569'} strokeWidth="2" />

          {/* Non-inverted SEL tap down to AND2 */}
          <circle cx="70" cy="100" r="4" fill={liveSel ? '#10b981' : '#475569'} />
          <line x1="70" y1="100" x2="70" y2="135" stroke={liveSel ? '#10b981' : '#475569'} strokeWidth="2" />
          <line x1="70" y1="135" x2="210" y2="135" stroke={liveSel ? '#10b981' : '#475569'} strokeWidth="2" />

          {/* AND1 Gate (Upper: A & ~SEL) */}
          <path d="M 210,35 L 245,35 A 25,25 0 0,1 245,75 L 210,75 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="220" y="59" fill="#94a3b8" fontSize="11" fontWeight="bold">AND1</text>
          <line x1="270" y1="55" x2="350" y2="55" stroke={liveAnd1 ? '#10b981' : '#475569'} strokeWidth="3" />
          <line x1="350" y1="55" x2="380" y2="85" stroke={liveAnd1 ? '#10b981' : '#475569'} strokeWidth="2" />

          {/* AND2 Gate (Lower: B & SEL) */}
          <path d="M 210,125 L 245,125 A 25,25 0 0,1 245,165 L 210,165 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="220" y="149" fill="#94a3b8" fontSize="11" fontWeight="bold">AND2</text>
          <line x1="270" y1="145" x2="350" y2="145" stroke={liveAnd2 ? '#10b981' : '#475569'} strokeWidth="3" />
          <line x1="350" y1="145" x2="380" y2="115" stroke={liveAnd2 ? '#10b981' : '#475569'} strokeWidth="2" />

          {/* OR Gate (Output) */}
          <path d="M 380,75 Q 405,100 380,125 Q 425,125 450,100 Q 425,75 380,75 Z" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
          <text x="400" y="104" fill="#d8b4fe" fontSize="11" fontWeight="bold">OR</text>

          {/* Output Line Y */}
          <line x1="450" y1="100" x2="520" y2="100" stroke={liveY ? '#10b981' : '#475569'} strokeWidth="4" />
          <circle cx="520" cy="100" r="6" fill={liveY ? '#10b981' : '#475569'} />
          <text x="535" y="105" fill="#f8fafc" fontSize="14" fontWeight="bold">Y = {liveY}</text>
        </svg>

        <div style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
          Active state: When <strong>SEL={liveSel}</strong>, Output <strong>Y={liveY}</strong> (selected Input <strong>{liveSel === 0 ? `A (${liveA})` : `B (${liveB})`}</strong>).
        </div>
      </div>

      {/* Truth Table Verification Section */}
      <div className="mux-challenge__table-section">
        <div className="mux-challenge__section-title">
          📋 1. Exhaustive 8-State Truth Table Verification
        </div>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>
          Evaluate all eight input combinations. You can click <em>"Test in Circuit"</em> to load any state into the interactive schematic above.
        </p>

        <table className="mux-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>SEL</th>
              <th>A</th>
              <th>B</th>
              <th>Expected Steering</th>
              <th>Your Output (Y)</th>
              <th>Simulation Probe</th>
            </tr>
          </thead>
          <tbody>
            {EXPECTED_MUX_TRUTH_TABLE.map((row, idx) => {
              const currentVal = tableOutputs[idx];
              const isChecked = validationResult !== null;
              const isRowCorrect = isChecked && currentVal === row.expectedY;
              const isRowWrong = isChecked && currentVal !== null && currentVal !== row.expectedY;

              return (
                <tr key={idx}>
                  <td style={{ color: '#64748b' }}>#{idx + 1}</td>
                  <td><span className={`mux-val-pill val-${row.sel}`}>{row.sel}</span></td>
                  <td><span className={`mux-val-pill val-${row.a}`}>{row.a}</span></td>
                  <td><span className={`mux-val-pill val-${row.b}`}>{row.b}</span></td>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    {row.sel === 0 ? 'Selects A' : 'Selects B'}
                  </td>
                  <td>
                    <select
                      className={`mux-output-select ${isRowCorrect ? 'correct' : isRowWrong ? 'incorrect' : ''}`}
                      value={currentVal === null ? '' : currentVal}
                      onChange={(e) => handleTableCellChange(idx, e.target.value)}
                    >
                      <option value="">— Select —</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="mux-btn-apply-row"
                      onClick={() => testTableRowInCircuit(row)}
                      title="Load this input state into the schematic above"
                    >
                      Inspect in Circuit ↗
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Conceptual Synthesis Question Section */}
      <div className="mux-challenge__concept-section">
        <div className="mux-challenge__section-title">
          🧠 2. RTL Architecture &amp; Synthesis Concept
        </div>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
          In hardware description languages (Verilog / SystemVerilog), conditional dataflow is expressed concisely:<br />
          <code style={{ color: '#38bdf8', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
            assign Y = SEL ? B : A;
          </code>
          <br /><br />
          How does an ASIC logic synthesis tool treat this conditional expression during physical transformation?
        </p>

        <label className={`mux-quiz-option ${conceptAnswer === CORRECT_CONCEPT_ANSWER_ID ? 'selected' : ''}`}>
          <input
            type="radio"
            name="conceptAnswer"
            value={CORRECT_CONCEPT_ANSWER_ID}
            checked={conceptAnswer === CORRECT_CONCEPT_ANSWER_ID}
            onChange={(e) => setConceptAnswer(e.target.value)}
          />
          <div>
            <strong>Option A:</strong> It describes multiplexing dataflow between register stages. During technology mapping, the synthesis tool may map it to a standard-cell MUX or optimize and minimize it into equivalent gates (AND/OR/AOI) based on timing, area, and power targets.
          </div>
        </label>

        <label className={`mux-quiz-option ${conceptAnswer === 'opt-always-mux' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="conceptAnswer"
            value="opt-always-mux"
            checked={conceptAnswer === 'opt-always-mux'}
            onChange={(e) => setConceptAnswer(e.target.value)}
          />
          <div>
            <strong>Option B:</strong> Every single conditional in HDL code is always mapped to a dedicated discrete physical standard-cell multiplexer without any Boolean minimization or logic sharing.
          </div>
        </label>

        <label className={`mux-quiz-option ${conceptAnswer === 'opt-clock-req' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="conceptAnswer"
            value="opt-clock-req"
            checked={conceptAnswer === 'opt-clock-req'}
            onChange={(e) => setConceptAnswer(e.target.value)}
          />
          <div>
            <strong>Option C:</strong> A conditional assignment requires a clock edge and cannot be implemented using combinational gates.
          </div>
        </label>

        <label className={`mux-quiz-option ${conceptAnswer === 'opt-cpu-code' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="conceptAnswer"
            value="opt-cpu-code"
            checked={conceptAnswer === 'opt-cpu-code'}
            onChange={(e) => setConceptAnswer(e.target.value)}
          />
          <div>
            <strong>Option D:</strong> It compiles into sequential instructions executed line-by-line by an on-chip software interpreter.
          </div>
        </label>
      </div>

      {/* Validation Feedback Display */}
      {validationResult && (
        <div className={`mux-challenge__feedback-panel ${validationResult.passed ? 'success' : 'warning'}`}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
            {validationResult.passed ? '✅ Verification Passed!' : '⚠️ Incomplete / Incorrect Criteria'}
          </div>
          <div>{validationResult.feedback}</div>

          <ul className="mux-breakdown-list">
            {validationResult.breakdown.map((item, i) => (
              <li key={i}>
                <span style={{ color: item.passed ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                  {item.passed ? '✓' : '✗'} {item.label}:
                </span>{' '}
                {item.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verification Submit Action */}
      <div className="mux-challenge__actions">
        <button
          type="button"
          className="btn btn--primary btn--lg w-full"
          onClick={handleValidate}
        >
          🔍 Verify Circuit &amp; Submit Challenge
        </button>
      </div>

      {/* Independent Standalone RTL Playground Suite Link */}
      <div className="mux-external-lab-card">
        <div>
          <h4>🚀 Standalone RTL Playground Suite</h4>
          <p>
            Explore 8-bit ALUs, sequential registers, counters, and Moore/Mealy State Machine studios with Verilog generation in the full standalone laboratory.
          </p>
        </div>
        <a
          href="https://ppawar-7.github.io/rtl-playground/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--secondary btn--sm"
        >
          Open RTL Lab ↗
        </a>
      </div>
    </div>
  );
}
