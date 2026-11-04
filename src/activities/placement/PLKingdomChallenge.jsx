/**
 * PLKingdomChallenge.jsx
 * =======================
 * Capstone challenge for Level 5 (pl-5): Placement Kingdom Challenge.
 */

import React, { useState } from 'react';
import {
  validatePLKingdom,
  CORRECT_CAPSTONE_PLACER_CONCEPT_ID,
} from './validators/validatePLKingdom.js';
import { computeTotalHPWL } from '../../engine/placementEngine.js';
import './PLKingdomChallenge.css';

const INITIAL_CELLS = [
  { id: 'C1_DFF',  name: 'Launch Flop (C1)', x: 20,  y: 40, width: 30, height: 40 },
  { id: 'C2_NAND', name: 'NAND Gate (C2)',   x: 60,  y: 40, width: 20, height: 40 },
  { id: 'C3_MUX',  name: 'MUX Cell (C3)',    x: 90,  y: 40, width: 30, height: 40 },
  { id: 'C4_DFF',  name: 'Capture Flop (C4)',x: 130, y: 40, width: 30, height: 40 },
];

export default function PLKingdomChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [cells, setCells] = useState(INITIAL_CELLS);
  const [placerConcept, setPlacerConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleCoordChange = (idx, field, val) => {
    const num = parseInt(val, 10) || 0;
    const updated = [...cells];
    updated[idx] = { ...updated[idx], [field]: num };
    setCells(updated);
  };

  const nets = [
    { netId: 'NET_1', pins: [{ x: cells[0].x, y: cells[0].y }, { x: cells[1].x, y: cells[1].y }] },
    { netId: 'NET_2', pins: [{ x: cells[1].x, y: cells[1].y }, { x: cells[2].x, y: cells[2].y }] },
    { netId: 'NET_3', pins: [{ x: cells[2].x, y: cells[2].y }, { x: cells[3].x, y: cells[3].y }] },
  ];
  const liveHPWL = computeTotalHPWL(nets).totalHPWL;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validatePLKingdom({
      cells,
      placerConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="pl-capstone-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          👑 Placement Kingdom Capstone: Standard Cell Layout &amp; HPWL Minimization
        </h3>
        <p className="combseq-desc">
          Place four connected pipeline cells:
          <code>C1 (Launch) → C2 (NAND) → C3 (MUX) → C4 (Capture)</code>.<br />
          Requirements:
          1. <strong>Row Legality:</strong> Align to Row 1 ($Y=40$) or Row 2 ($Y=80$); snap X to 10 µm pitch.
          2. <strong>Zero Overlaps:</strong> No two cells may share site locations.
          3. <strong>HPWL Constraint:</strong> Total Half-Perimeter Wirelength must be <strong>&le; 200 µm</strong> (Live HPWL: <strong>{liveHPWL} µm</strong>).
        </p>
      </div>

      {/* Placement Layout Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Placement Row Canvas</span>
          <span style={{ fontSize: '0.85rem', color: liveHPWL <= 200 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            Total HPWL: {liveHPWL} µm {liveHPWL <= 200 ? '(Meets target)' : '(Exceeds 200 µm limit)'}
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 160" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Row 1 */}
            <rect x="10" y="40" width="580" height="40" fill="#1e293b" stroke="#334155" />
            <text x="20" y="65" fill="#64748b" fontSize="10">Row 1 (y=40)</text>

            {/* Row 2 */}
            <rect x="10" y="80" width="580" height="40" fill="#1e293b" stroke="#334155" />
            <text x="20" y="105" fill="#64748b" fontSize="10">Row 2 (y=80)</text>

            {/* Render 4 cells */}
            {cells.map((c, i) => (
              <g key={c.id}>
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.width}
                  height={c.height}
                  fill="#2563eb"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                />
                <text x={c.x + c.width / 2} y={c.y + 24} fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">
                  {c.id}
                </text>
              </g>
            ))}

            {/* Connecting net flylines */}
            <line x1={cells[0].x + 15} y1={cells[0].y + 20} x2={cells[1].x + 10} y2={cells[1].y + 20} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
            <line x1={cells[1].x + 10} y1={cells[1].y + 20} x2={cells[2].x + 15} y2={cells[2].y + 20} stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" />
            <line x1={cells[2].x + 15} y1={cells[2].y + 20} x2={cells[3].x + 15} y2={cells[3].y + 20} stroke="#34d399" strokeWidth="2" strokeDasharray="3 2" />
          </svg>
        </div>
      </div>

      {/* Coordinates Inputs */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Legalize Cell Locations (Snap to X multiples of 10, Y=40 or Y=80)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {cells.map((c, idx) => (
            <div key={c.id} className="syn-opt-card">
              <span style={{ fontWeight: 800, color: '#0ea5e9' }}>{c.name}</span>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '6px' }}>
                <div>
                  <label className="accum-port-label">X (µm):</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    max={500}
                    className="syn-opt-input"
                    value={c.x}
                    onChange={(e) => handleCoordChange(idx, 'x', e.target.value)}
                  />
                </div>
                <div>
                  <label className="accum-port-label">Y (µm):</label>
                  <input
                    type="number"
                    step="40"
                    min="40"
                    max={80}
                    className="syn-opt-input"
                    value={c.y}
                    onChange={(e) => handleCoordChange(idx, 'y', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Concept Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🧠 Step 2: Placement Flow Hierarchy
        </h4>
        <div className="mux-quiz-prompt">
          What is the correct sequence of operations in a production physical design placement engine?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Placer sequence question">
          <label className={`mux-quiz-option ${placerConcept === CORRECT_CAPSTONE_PLACER_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="placerSeqQuiz"
              value={CORRECT_CAPSTONE_PLACER_CONCEPT_ID}
              checked={placerConcept === CORRECT_CAPSTONE_PLACER_CONCEPT_ID}
              onChange={(e) => setPlacerConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Global Placement → Legalization → Detailed Placement &amp; Timing Optimization:</strong> Global placement approximates continuous wirelength; Legalization removes overlaps and aligns to row sites; Detailed placement performs local cell swapping to further optimize HPWL and timing.
            </span>
          </label>

          <label className={`mux-quiz-option ${placerConcept === 'opt-route-first' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="placerSeqQuiz"
              value="opt-route-first"
              checked={placerConcept === 'opt-route-first'}
              onChange={(e) => setPlacerConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Routing occurs before placement:</strong> Wires are routed across empty silicon before gates are chosen.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Placement Capstone Certified!' : '⚠️ Capstone Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          👑 Certify Placement Kingdom &amp; Unlock Clock Tree Synthesis
        </button>
      </div>
    </div>
  );
}
