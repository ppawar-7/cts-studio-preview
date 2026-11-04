/**
 * GDSLayerStackChallenge.jsx
 * ==========================
 * Interactive challenge for Level 3 (gds-3): Layer Stack in GDS.
 */

import React, { useState } from 'react';
import {
  validateGDSLayerStack,
  CORRECT_FEOL_ID,
  CORRECT_DATATYPE_ID,
  CORRECT_M1_LAYER_ID,
} from './validators/validateGDSLayerStack.js';
import { GDS_LAYER_MAP } from '../../engine/gdsEngine.js';
import './GDSLayerStackChallenge.css';

export default function GDSLayerStackChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [feolConcept, setFeolConcept] = useState('');
  const [datatypeConcept, setDatatypeConcept] = useState('');
  const [m1LayerChoice, setM1LayerChoice] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateGDSLayerStack({
      feolConcept,
      datatypeConcept,
      m1LayerChoice,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="gds-layers-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          📚 Layer Stack in GDS: FEOL vs BEOL &amp; Datatypes
        </h3>
        <p className="combseq-desc">
          A physical IC mask set separates manufacturing into two foundational phases:
          <br />
          <strong>Front-End of Line (FEOL):</strong> Formation of active semiconductor devices (wells, diffusions, and polysilicon gates) inside the silicon crystal substrate.
          <br />
          <strong>Back-End of Line (BEOL):</strong> Deposition of metallization layers (M1&ndash;M6) and dielectric vias connecting transistors into functional logic circuits.
        </p>
      </div>

      {/* Layer Table */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">GDSII Layer &amp; Datatype Mapping Table</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Foundry GDS Map Profile</span>
        </div>

        <table className="gds-layer-table">
          <thead>
            <tr>
              <th>Layer Name</th>
              <th>GDS Layer</th>
              <th>Datatype</th>
              <th>Process Phase</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(GDS_LAYER_MAP).map(([key, info]) => (
              <tr key={key}>
                <td style={{ fontWeight: 700, color: info.category === 'FEOL' ? '#f59e0b' : '#38bdf8' }}>
                  {info.name}
                </td>
                <td style={{ fontFamily: 'monospace' }}>{info.gdsLayer}</td>
                <td style={{ fontFamily: 'monospace' }}>{info.datatype}</td>
                <td>
                  <span className={`badge ${info.category === 'FEOL' ? 'badge--unlocked' : 'badge--available'}`}>
                    {info.category}
                  </span>
                </td>
                <td style={{ color: '#94a3b8' }}>
                  {info.category === 'FEOL' ? 'Substrate / transistor active area' : 'Interconnect metallization'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Step 1: FEOL Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔬 Step 1: The Role of Front-End of Line (FEOL)
        </h4>
        <div className="mux-quiz-prompt">
          Which fundamental semiconductor structures are manufactured during the FEOL process phase?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="FEOL question">
          <label className={`mux-quiz-option ${feolConcept === CORRECT_FEOL_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="feolQuiz"
              value={CORRECT_FEOL_ID}
              checked={feolConcept === CORRECT_FEOL_ID}
              onChange={(e) => setFeolConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Active MOS Transistors (N-Wells, Diffusions, Poly Gates):</strong> FEOL fabricates the actual switching transistors in the crystalline silicon substrate prior to metal interconnect deposition.
            </span>
          </label>

          <label className={`mux-quiz-option ${feolConcept === 'opt-feol-packaging' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="feolQuiz"
              value="opt-feol-packaging"
              checked={feolConcept === 'opt-feol-packaging'}
              onChange={(e) => setFeolConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Plastic Chip Packaging:</strong> FEOL glues the finished chip onto a printed circuit board.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: Datatype Purpose */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🏷️ Step 2: Why Does GDSII Use Datatypes on the Same Layer?
        </h4>
        <div className="mux-quiz-prompt">
          Why does a GDSII layer (e.g. Layer 30 for Metal 1) have multiple datatypes, such as Datatype 0 and Datatype 20?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Datatype question">
          <label className={`mux-quiz-option ${datatypeConcept === CORRECT_DATATYPE_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="dtQuiz"
              value={CORRECT_DATATYPE_ID}
              checked={datatypeConcept === CORRECT_DATATYPE_ID}
              onChange={(e) => setDatatypeConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Separates physical mask geometries from logical pin labels:</strong> Datatype 0 represents physical copper wires etched onto the silicon wafer; Datatype 20 contains text strings and pin terminals used by CAD LVS tools to identify electrical nets (not etched into copper).
            </span>
          </label>

          <label className={`mux-quiz-option ${datatypeConcept === 'opt-random-numbers' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="dtQuiz"
              value="opt-random-numbers"
              checked={datatypeConcept === 'opt-random-numbers'}
              onChange={(e) => setDatatypeConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Random numbers with no meaning:</strong> Datatype numbers are purely decorative.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Layer Selection */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📐 Step 3: Identify Metal 1 GDS Layer Number
        </h4>
        <div className="mux-quiz-prompt">
          According to the standard foundry layer mapping table above, which GDS Layer number corresponds to Metal 1 (M1)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="M1 layer question">
          <label className={`mux-quiz-option ${m1LayerChoice === CORRECT_M1_LAYER_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="m1LyrQuiz"
              value={CORRECT_M1_LAYER_ID}
              checked={m1LayerChoice === CORRECT_M1_LAYER_ID}
              onChange={(e) => setM1LayerChoice(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Layer 30 (Metal 1):</strong> First back-end metallization layer connecting cell pins.
            </span>
          </label>

          <label className={`mux-quiz-option ${m1LayerChoice === 'opt-layer-1-nwell' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="m1LyrQuiz"
              value="opt-layer-1-nwell"
              checked={m1LayerChoice === 'opt-layer-1-nwell'}
              onChange={(e) => setM1LayerChoice(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Layer 1:</strong> Metal 1 is placed on Layer 1 with the N-wells.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Layer Stack Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          📚 Verify GDS Layer Stack
        </button>
      </div>
    </div>
  );
}
