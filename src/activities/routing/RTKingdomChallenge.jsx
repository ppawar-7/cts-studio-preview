/**
 * RTKingdomChallenge.jsx
 * ======================
 * Capstone challenge for Level 5 (rt-5): Routing Kingdom Challenge.
 */

import React, { useState } from 'react';
import {
  validateRTKingdom,
  CORRECT_LVS_CONCEPT_ID,
} from './validators/validateRTKingdom.js';
import { checkRoutingShorts } from '../../engine/routingEngine.js';
import './RTKingdomChallenge.css';

export default function RTKingdomChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [net1Layer, setNet1Layer] = useState('M1');
  const [net2Layer, setNet2Layer] = useState('M1'); // Starts with intentional short!
  const [lvsConcept, setLvsConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const segments = [
    { netId: 'NET_1', layer: net1Layer, x1: 20, y1: 60, x2: 160, y2: 60 },
    { netId: 'NET_2', layer: net2Layer, x1: 90, y1: 20, x2: 90, y2: 140 },
  ];
  const shortCheck = checkRoutingShorts(segments);
  const hasShort = shortCheck.hasShort;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateRTKingdom({
      net1Layer,
      net2Layer,
      lvsConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="rt-capstone-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          👑 Routing Kingdom Capstone: Multilayer Interconnect &amp; DRC / LVS Signoff
        </h3>
        <p className="combseq-desc">
          Route two intersecting signal nets without creating electrical short circuits:
          <br />
          <code>Net 1: Pin A1 (20, 60) &rarr; Pin B1 (160, 60) [Horizontal]</code><br />
          <code>Net 2: Pin A2 (90, 20) &rarr; Pin B2 (90, 140) [Vertical]</code><br />
          Assign metal layers respecting preferred routing directions to eliminate DRC shorts, and verify connectivity with Layout Versus Schematic (LVS).
        </p>
      </div>

      {/* Multilayer Routing Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">Multilayer Routing Grid Canvas</span>
          <span style={{ fontSize: '0.85rem', color: hasShort ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
            {hasShort ? '⚠️ DRC SHORT CIRCUIT: Crossing collision on ' + net1Layer : '✓ ZERO SHORTS: Clean orthogonal layer separation'}
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 220" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Grid background */}
            <defs>
              <pattern id="rtGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="none" stroke="#334155" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect x="20" y="20" width="560" height="180" fill="#0f172a" stroke="#1e293b" />
            <rect x="20" y="20" width="560" height="180" fill="url(#rtGrid)" />

            {/* Net 1 (Horizontal) */}
            <line
              x1="80"
              y1="110"
              x2="500"
              y2="110"
              stroke={net1Layer === 'M1' ? '#38bdf8' : '#fbbf24'}
              strokeWidth="6"
            />
            {/* Pin A1 & Pin B1 */}
            <circle cx="80" cy="110" r="8" fill="#38bdf8" />
            <text x="80" y="95" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle">Pin A1</text>
            <circle cx="500" cy="110" r="8" fill="#38bdf8" />
            <text x="500" y="95" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle">Pin B1</text>
            <text x="180" y="103" fill="#38bdf8" fontSize="9" fontWeight="700">Net 1 [{net1Layer}]</text>

            {/* Net 2 (Vertical) */}
            <line
              x1="290"
              y1="35"
              x2="290"
              y2="185"
              stroke={net2Layer === 'M1' ? '#38bdf8' : '#ec4899'}
              strokeWidth="6"
            />
            {/* Pin A2 & Pin B2 */}
            <circle cx="290" cy="35" r="8" fill="#ec4899" />
            <text x="320" y="40" fill="#ec4899" fontSize="9" fontWeight="700">Pin A2</text>
            <circle cx="290" cy="185" r="8" fill="#ec4899" />
            <text x="320" y="190" fill="#ec4899" fontSize="9" fontWeight="700">Pin B2</text>
            <text x="300" y="150" fill="#ec4899" fontSize="9" fontWeight="700">Net 2 [{net2Layer}]</text>

            {/* Intersection Highlight */}
            {hasShort ? (
              <g>
                <circle cx="290" cy="110" r="14" fill="none" stroke="#ef4444" strokeWidth="3" />
                <text x="290" y="114" fill="#ef4444" fontSize="12" fontWeight="900" textAnchor="middle">&times;</text>
                <text x="290" y="138" fill="#ef4444" fontSize="9" fontWeight="800" textAnchor="middle">SHORT COLLISION!</text>
              </g>
            ) : (
              <g>
                {/* Clean Layer Separation with Via */}
                <rect x="284" y="104" width="12" height="12" fill="#10b981" rx="2" />
                <text x="340" y="114" fill="#10b981" fontSize="9" fontWeight="700">Insulated Overpass</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Step 1: Assign Metal Layers */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Select Metal Layers for Crossing Wires
        </h4>
        <p className="dff-challenge__subtext">
          Remember preferred directions: <code>M1 (Horizontal)</code>, <code>M2 (Vertical)</code>, <code>M3 (Horizontal)</code>, <code>M4 (Vertical)</code>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Net 1 Metal Layer (Horizontal Wire):</label>
            <select
              className="syn-opt-select"
              value={net1Layer}
              onChange={(e) => setNet1Layer(e.target.value)}
            >
              <option value="M1">Metal 1 (Horizontal - Local)</option>
              <option value="M2">Metal 2 (Vertical)</option>
              <option value="M3">Metal 3 (Horizontal - Intermediate)</option>
            </select>
          </div>

          <div>
            <label className="accum-port-label">Net 2 Metal Layer (Vertical Wire):</label>
            <select
              className="syn-opt-select"
              value={net2Layer}
              onChange={(e) => setNet2Layer(e.target.value)}
            >
              <option value="M1">Metal 1 (Horizontal)</option>
              <option value="M2">Metal 2 (Vertical - Preferred)</option>
              <option value="M4">Metal 4 (Vertical - Intermediate)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: LVS Verification Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔍 Step 2: Layout Versus Schematic (LVS) Signoff
        </h4>
        <div className="mux-quiz-prompt">
          Which EDA physical verification check extracts electrical devices and connectivity from routed layout polygons to prove zero opens and zero shorts?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="LVS question">
          <label className={`mux-quiz-option ${lvsConcept === CORRECT_LVS_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="lvsQuiz"
              value={CORRECT_LVS_CONCEPT_ID}
              checked={lvsConcept === CORRECT_LVS_CONCEPT_ID}
              onChange={(e) => setLvsConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Layout Versus Schematic (LVS):</strong> Extracts the transistor-level SPICE netlist from the physical masks and runs graph isomorphism comparison against the golden schematic netlist to certify 100% connectivity equivalence, flagging all unrouted opens or unintended shorts.
            </span>
          </label>

          <label className={`mux-quiz-option ${lvsConcept === 'opt-drc-only' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="lvsQuiz"
              value="opt-drc-only"
              checked={lvsConcept === 'opt-drc-only'}
              onChange={(e) => setLvsConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Visual inspection by eye:</strong> An engineer zooms in on the chip layout and visually looks for broken wires on the screen.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Routing Kingdom Capstone Certified!' : '⚠️ Capstone Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          👑 Certify Routing Kingdom &amp; Advance to Filler Cells
        </button>
      </div>
    </div>
  );
}
