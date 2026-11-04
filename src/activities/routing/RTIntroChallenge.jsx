/**
 * RTIntroChallenge.jsx
 * ====================
 * Interactive challenge for Level 1 (rt-1): Introduction to Routing.
 */

import React, { useState } from 'react';
import {
  validateRTIntro,
  CORRECT_ROUTING_PHASES_ID,
} from './validators/validateRTIntro.js';
import './RTIntroChallenge.css';

export default function RTIntroChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [routingPhasesConcept, setRoutingPhasesConcept] = useState('');
  const [manhattanDistanceAns, setManhattanDistanceAns] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateRTIntro({
      routingPhasesConcept,
      manhattanDistanceAns,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="rt-intro-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🛣️ Introduction to Physical Routing
        </h3>
        <p className="combseq-desc">
          Routing is the final physical synthesis step connecting standard cells, macros, and I/O pads with physical metal wires.
          Modern chips contain billions of connections across 6 to 15 metal layers.
          <br />
          Because wires cannot run diagonally on silicon, all router algorithms operate along orthogonal grid tracks (Manhattan geometry).
        </p>
      </div>

      {/* Global vs Detailed Routing Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Orthogonal Interconnect &amp; GCell Guides</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Pin A: (20, 30) &rarr; Pin B: (140, 90)
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Global Routing GCell Tile Grid */}
            <defs>
              <pattern id="gcellGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <rect width="60" height="60" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
              </pattern>
            </defs>
            <rect x="20" y="20" width="560" height="160" fill="url(#gcellGrid)" />

            {/* Pin A */}
            <circle cx="80" cy="50" r="8" fill="#38bdf8" />
            <text x="80" y="40" fill="#38bdf8" fontSize="10" fontWeight="700" textAnchor="middle">Pin A (20, 30)</text>

            {/* Pin B */}
            <circle cx="440" cy="150" r="8" fill="#f43f5e" />
            <text x="440" y="175" fill="#f43f5e" fontSize="10" fontWeight="700" textAnchor="middle">Pin B (140, 90)</text>

            {/* Global Route Guide (Yellow dashed corridor) */}
            <path d="M 80,50 L 440,50 L 440,150" fill="none" stroke="#f59e0b" strokeWidth="10" opacity="0.25" />

            {/* Detailed Routed Metal Wires */}
            {/* M1 Horizontal (cyan) */}
            <line x1="80" y1="50" x2="440" y2="50" stroke="#0ea5e9" strokeWidth="3" />
            <text x="260" y="44" fill="#0ea5e9" fontSize="9" fontWeight="700">M1 Horizontal Segment (&Delta;X = 120 µm)</text>

            {/* Via at transition */}
            <rect x="436" y="46" width="8" height="8" fill="#ffffff" stroke="#0f172a" />

            {/* M2 Vertical (magenta) */}
            <line x1="440" y1="50" x2="440" y2="150" stroke="#d946ef" strokeWidth="3" />
            <text x="450" y="105" fill="#d946ef" fontSize="9" fontWeight="700">M2 Vertical (&Delta;Y = 60 µm)</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Routing Hierarchy Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔬 Step 1: Global Routing vs Detailed Routing
        </h4>
        <div className="mux-quiz-prompt">
          Why do modern EDA routing engines break interconnect construction into two separate phases: Global Routing and Detailed Routing?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Routing phases question">
          <label className={`mux-quiz-option ${routingPhasesConcept === CORRECT_ROUTING_PHASES_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="rtPhaseQuiz"
              value={CORRECT_ROUTING_PHASES_ID}
              checked={routingPhasesConcept === CORRECT_ROUTING_PHASES_ID}
              onChange={(e) => setRoutingPhasesConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Divide-and-Conquer Complexity:</strong> Global routing plans coarse corridor routes through coarse tiles (GCells) to balance congestion across the die without placing individual tracks. Detailed routing then operates inside each tile to assign exact metal tracks, vias, and satisfy all foundry DRC rules.
            </span>
          </label>

          <label className={`mux-quiz-option ${routingPhasesConcept === 'opt-single-phase' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="rtPhaseQuiz"
              value="opt-single-phase"
              checked={routingPhasesConcept === 'opt-single-phase'}
              onChange={(e) => setRoutingPhasesConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Single-phase routing is always used:</strong> Routers draw all billions of wires on the chip in a single instant with zero planning.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: Manhattan Distance Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 2: Calculate Manhattan Wirelength
        </h4>
        <p className="dff-challenge__subtext">
          Pin A is at <code>(X=20 µm, Y=30 µm)</code>.<br />
          Pin B is at <code>(X=140 µm, Y=90 µm)</code>.<br />
          Because wires cannot route diagonally across chip silicon, compute the minimum Manhattan distance:
          <code>L = |X2 - X1| + |Y2 - Y1|</code>.
        </p>

        <div style={{ maxWidth: '240px', marginTop: '0.75rem' }}>
          <label className="accum-port-label">Manhattan Wirelength (µm):</label>
          <input
            type="number"
            placeholder="e.g. 180"
            className="syn-opt-input"
            value={manhattanDistanceAns}
            onChange={(e) => setManhattanDistanceAns(e.target.value)}
          />
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Routing Foundation Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🛣️ Verify Routing Principles
        </button>
      </div>
    </div>
  );
}
