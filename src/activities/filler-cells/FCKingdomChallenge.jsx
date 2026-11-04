/**
 * FCKingdomChallenge.jsx
 * ======================
 * Capstone challenge for Level 5 (fc-5): Filler Cells Kingdom Challenge.
 */

import React, { useState } from 'react';
import {
  validateFCKingdom,
  CORRECT_CMP_DENSITY_ID,
} from './validators/validateFCKingdom.js';
import './FCKingdomChallenge.css';

const CELL_DEFS = [
  { type: 'DECAP16', name: 'DECAP16 (16 sites)', size: 16, category: 'Decap' },
  { type: 'DECAP8',  name: 'DECAP8 (8 sites)',   size: 8,  category: 'Decap' },
  { type: 'TAPCELL4',name: 'TAPCELL4 (4 sites)', size: 4,  category: 'Tap' },
  { type: 'FILL8',   name: 'FILL8 (8 sites)',    size: 8,  category: 'Filler' },
  { type: 'FILL4',   name: 'FILL4 (4 sites)',    size: 4,  category: 'Filler' },
  { type: 'FILL2',   name: 'FILL2 (2 sites)',    size: 2,  category: 'Filler' },
];

export default function FCKingdomChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  // Counts for each cell type
  const [counts, setCounts] = useState({
    DECAP16: 2, // 32
    DECAP8: 1,  // 8
    TAPCELL4: 2,// 8
    FILL8: 1,   // 8
    FILL4: 1,   // 4
    FILL2: 0,   // 0 -> Total = 32+8+8+8+4 = 60 sites!
  });
  const [cmpConcept, setCmpConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleCountChange = (type, delta) => {
    setCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + delta),
    }));
  };

  const totalFilled = CELL_DEFS.reduce((sum, def) => sum + (def.size * (counts[def.type] || 0)), 0);
  const remainingGap = Math.max(0, 60 - totalFilled);
  const isTargetMet = totalFilled === 60;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cellPlan = Object.entries(counts).map(([type, count]) => ({ type, count }));
    const result = validateFCKingdom({
      cellPlan,
      cmpConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="fc-capstone-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          👑 Filler Cells Kingdom Capstone: Multi-Void Physical Row Filling &amp; Signoff
        </h3>
        <p className="combseq-desc">
          Populate three empty voids totaling <strong>60 placement sites</strong> across the standard cell row:
          <br />
          <code>Void 1 (10 sites) + Void 2 (20 sites) + Void 3 (30 sites) = 60 sites</code>
          <br />
          Requirements:
          1. <strong>100% Continuity:</strong> Bridge exactly <strong>60 sites</strong> with zero remaining gap (Live: <strong>{totalFilled}/60</strong>).
          2. <strong>Balanced Mix:</strong> Include at least one <strong>DECAP</strong> (dynamic IR drop) and at least one <strong>TAPCELL</strong> (latch-up prevention).
          3. <strong>CMP Density:</strong> Explain how dummy metal/poly fill prevents Chemical Mechanical Polishing erosion.
        </p>
      </div>

      {/* Row Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">100-Site Standard Cell Row Continuity Canvas</span>
          <span style={{ fontSize: '0.85rem', color: isTargetMet ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            Filled: {totalFilled}/60 sites {isTargetMet ? '(100% CONTINUOUS ABUTMENT)' : `(${remainingGap} sites remaining)`}
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 180" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Top VDD Rail */}
            <rect x="20" y="20" width="560" height="10" fill="#ef4444" />
            <text x="25" y="28" fill="#ffffff" fontSize="8" fontWeight="700">VDD Rail</text>

            {/* Row Active Area (Background) */}
            <rect x="20" y="30" width="560" height="120" fill="#0f172a" stroke="#334155" />

            {/* Logic Cell 1 (x: 20 to 100 -> 15 sites) */}
            <rect x="20" y="30" width="84" height="120" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="62" y="85" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">Gate 1</text>
            <text x="62" y="100" fill="#93c5fd" fontSize="8" textAnchor="middle">(15 sites)</text>

            {/* Void 1 (10 sites -> 56px) */}
            <rect x="104" y="30" width="56" height="120" fill={isTargetMet ? '#10b981' : '#334155'} opacity={isTargetMet ? 0.7 : 0.3} stroke="#f59e0b" strokeDasharray="2 2" />
            <text x="132" y="90" fill="#ffffff" fontSize="8" fontWeight="700" textAnchor="middle">Void 1 (10)</text>

            {/* Logic Cell 2 (x: 160 to 244 -> 15 sites) */}
            <rect x="160" y="30" width="84" height="120" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="202" y="85" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">Gate 2</text>
            <text x="202" y="100" fill="#93c5fd" fontSize="8" textAnchor="middle">(15 sites)</text>

            {/* Void 2 (20 sites -> 112px) */}
            <rect x="244" y="30" width="112" height="120" fill={isTargetMet ? '#10b981' : '#334155'} opacity={isTargetMet ? 0.7 : 0.3} stroke="#f59e0b" strokeDasharray="2 2" />
            <text x="300" y="90" fill="#ffffff" fontSize="8" fontWeight="700" textAnchor="middle">Void 2 (20)</text>

            {/* Logic Cell 3 (x: 356 to 412 -> 10 sites) */}
            <rect x="356" y="30" width="56" height="120" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="384" y="85" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">Gate 3</text>
            <text x="384" y="100" fill="#93c5fd" fontSize="8" textAnchor="middle">(10 sites)</text>

            {/* Void 3 (30 sites -> 168px) */}
            <rect x="412" y="30" width="168" height="120" fill={isTargetMet ? '#10b981' : '#334155'} opacity={isTargetMet ? 0.7 : 0.3} stroke="#f59e0b" strokeDasharray="2 2" />
            <text x="496" y="90" fill="#ffffff" fontSize="8" fontWeight="700" textAnchor="middle">Void 3 (30)</text>

            {/* Bottom VSS Rail */}
            <rect x="20" y="150" width="560" height="10" fill="#3b82f6" />
            <text x="25" y="158" fill="#ffffff" fontSize="8" fontWeight="700">VSS Ground Rail</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Cell Allocation Controls */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Allocate Physical Cell Mix (Target: 60 Sites Total)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {CELL_DEFS.map((def) => (
            <div key={def.type} className="syn-opt-card">
              <span style={{ fontWeight: 800, color: def.category === 'Decap' ? '#10b981' : def.category === 'Tap' ? '#f59e0b' : '#38bdf8' }}>
                {def.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontWeight: 700 }}>Qty: {counts[def.type] || 0}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ padding: '2px 8px' }}
                    disabled={(counts[def.type] || 0) <= 0}
                    onClick={() => handleCountChange(def.type, -1)}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ padding: '2px 8px' }}
                    disabled={totalFilled + def.size > 60}
                    onClick={() => handleCountChange(def.type, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                Subtotal: {def.size * (counts[def.type] || 0)} sites
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: CMP Density Signoff Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📐 Step 2: Chemical Mechanical Polishing (CMP) &amp; Dummy Metal Fill
        </h4>
        <div className="mux-quiz-prompt">
          Why do foundry signoff checklists strictly mandate automated dummy metal fill and density checks before tape-out?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="CMP question">
          <label className={`mux-quiz-option ${cmpConcept === CORRECT_CMP_DENSITY_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="cmpQuiz"
              value={CORRECT_CMP_DENSITY_ID}
              checked={cmpConcept === CORRECT_CMP_DENSITY_ID}
              onChange={(e) => setCmpConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Ensure uniform planar polishing during CMP to prevent dishing &amp; dielectric erosion:</strong> Non-uniform feature density causes mechanical polishing pads to over-polish low-density regions (dishing of metal wires and dielectric erosion), causing severe thickness variations that alter wire resistance and destroy manufacturing yield.
            </span>
          </label>

          <label className={`mux-quiz-option ${cmpConcept === 'opt-make-heavier' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="cmpQuiz"
              value="opt-make-heavier"
              checked={cmpConcept === 'opt-make-heavier'}
              onChange={(e) => setCmpConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>To make the silicon wafer heavier:</strong> Extra metal is added purely so the silicon chips do not blow away in the wind.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Filler Cells Capstone Certified!' : '⚠️ Capstone Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          👑 Certify Filler Cells Kingdom &amp; Advance to GDSII &amp; Tape-Out
        </button>
      </div>
    </div>
  );
}
