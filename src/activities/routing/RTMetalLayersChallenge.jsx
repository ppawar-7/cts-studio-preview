/**
 * RTMetalLayersChallenge.jsx
 * ==========================
 * Interactive challenge for Level 2 (rt-2): Metal Layers.
 */

import React, { useState } from 'react';
import {
  validateRTMetalLayers,
  CORRECT_M2_DIR_ID,
  CORRECT_ALTERNATE_ID,
  CORRECT_GLOBAL_LAYER_ID,
} from './validators/validateRTMetalLayers.js';
import { METAL_LAYERS } from '../../engine/routingEngine.js';
import './RTMetalLayersChallenge.css';

export default function RTMetalLayersChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [m2Direction, setM2Direction] = useState('');
  const [alternateConcept, setAlternateConcept] = useState('');
  const [globalLayerChoice, setGlobalLayerChoice] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateRTMetalLayers({
      m2Direction,
      alternateConcept,
      globalLayerChoice,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="rt-layers-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🥞 Metal Layer Stack: Pitch, Direction &amp; Sheet Resistance
        </h3>
        <p className="combseq-desc">
          Modern ASICs employ a vertical hierarchy of metal layers.
          Lower layers (M1, M2) offer narrow pitch for high-density local connections between standard cell pins, but suffer higher resistance.
          Upper layers (M5, M6) feature thick copper cross-sections with ultra-low resistance, ideal for power distribution and clock distribution networks.
        </p>
      </div>

      {/* Layer Stack Table / Diagram */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">6-Metal Layer ASIC Stack Profile</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>M1 &rarr; M6 Vertical Hierarchy</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.values(METAL_LAYERS).map((lyr) => (
            <div key={lyr.name} className="rt-layer-item">
              <span style={{ fontWeight: 800, color: lyr.direction === 'H' ? '#38bdf8' : '#ec4899', width: '60px' }}>
                {lyr.name} ({lyr.direction})
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                Pitch: {lyr.pitchUm} µm
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                R_sheet: {lyr.rSheetOhm} &Omega;/sq
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                {lyr.name === 'M1' || lyr.name === 'M2' ? 'Local standard cell pins' : lyr.name === 'M5' || lyr.name === 'M6' ? 'Global power grid & clock spines' : 'Intermediate routing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: M2 Preferred Direction Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🧭 Step 1: Preferred Routing Direction for Metal 2 (M2)
        </h4>
        <div className="mux-quiz-prompt">
          If Metal 1 (M1) has a horizontal (H) preferred routing direction, what is the preferred routing direction of Metal 2 (M2)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="M2 direction question">
          <label className={`mux-quiz-option ${m2Direction === CORRECT_M2_DIR_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="m2DirQuiz"
              value={CORRECT_M2_DIR_ID}
              checked={m2Direction === CORRECT_M2_DIR_ID}
              onChange={(e) => setM2Direction(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Vertical (V):</strong> Successive metal layers alternate between horizontal and vertical preferred directions.
            </span>
          </label>

          <label className={`mux-quiz-option ${m2Direction === 'opt-m2-horizontal' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="m2DirQuiz"
              value="opt-m2-horizontal"
              checked={m2Direction === 'opt-m2-horizontal'}
              onChange={(e) => setM2Direction(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Horizontal (H):</strong> All metal layers in an ASIC run in the exact same horizontal direction.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: Why Alternate Directions */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🛡️ Step 2: Why Do Successive Layers Alternate Preferred Directions?
        </h4>
        <div className="mux-quiz-prompt">
          Why is it vital that adjacent metal layers run in orthogonal directions (H vs V)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Alternating directions question">
          <label className={`mux-quiz-option ${alternateConcept === CORRECT_ALTERNATE_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="altQuiz"
              value={CORRECT_ALTERNATE_ID}
              checked={alternateConcept === CORRECT_ALTERNATE_ID}
              onChange={(e) => setAlternateConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Prevents huge vertical overlap capacitance and enables 2D Manhattan grid routing:</strong> If M1 and M2 both ran horizontally, parallel wires sitting directly on top of each other would form massive parallel-plate capacitors, causing immense delay and crosstalk. Orthogonal routing ensures wires cross at minimal single points.
            </span>
          </label>

          <label className={`mux-quiz-option ${alternateConcept === 'opt-aesthetic' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="altQuiz"
              value="opt-aesthetic"
              checked={alternateConcept === 'opt-aesthetic'}
              onChange={(e) => setAlternateConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Aesthetic preference:</strong> Routers alternate directions solely to make chip layout diagrams look symmetrical.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Global Layer Selection */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          ⚡ Step 3: Layer Allocation for Power Grids &amp; Long Clock Spines
        </h4>
        <div className="mux-quiz-prompt">
          Which metal layers in the stack should be chosen for long global clock spines and power distribution (VDD/VSS rings)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Global layer question">
          <label className={`mux-quiz-option ${globalLayerChoice === CORRECT_GLOBAL_LAYER_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="globalLyrQuiz"
              value={CORRECT_GLOBAL_LAYER_ID}
              checked={globalLayerChoice === CORRECT_GLOBAL_LAYER_ID}
              onChange={(e) => setGlobalLayerChoice(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Top Thick Metals (M5 / M6):</strong> Thick copper layers provide 10&times; to 20&times; lower sheet resistance (0.01 &Omega;/sq vs 0.18 &Omega;/sq), minimizing power supply IR drop and RC delay on critical clock trunks.
            </span>
          </label>

          <label className={`mux-quiz-option ${globalLayerChoice === 'opt-bottom-m1' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="globalLyrQuiz"
              value="opt-bottom-m1"
              checked={globalLayerChoice === 'opt-bottom-m1'}
              onChange={(e) => setGlobalLayerChoice(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Thin Bottom Metals (M1 / M2):</strong> Power for the whole chip should always route through thin 0.14 µm wires.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Metal Stack Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🥞 Verify Metal Layers
        </button>
      </div>
    </div>
  );
}
