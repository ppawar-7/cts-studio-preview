/**
 * GDSTapeoutPrepChallenge.jsx
 * ============================
 * Interactive challenge for Level 4 (gds-4): Tape-Out Preparation.
 */

import React, { useState } from 'react';
import {
  validateGDSTapeoutPrep,
  CORRECT_ANTENNA_DIODE_ID,
  CORRECT_OPC_ID,
} from './validators/validateGDSTapeoutPrep.js';
import './GDSTapeoutPrepChallenge.css';

export default function GDSTapeoutPrepChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [antennaRatioAns, setAntennaRatioAns] = useState('');
  const [diodeDecision, setDiodeDecision] = useState('');
  const [opcConcept, setOpcConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateGDSTapeoutPrep({
      antennaRatioAns,
      diodeDecision,
      opcConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="gds-prep-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          📡 Antenna Rules, Diode Protection &amp; Optical Proximity Correction (OPC)
        </h3>
        <p className="combseq-desc">
          During plasma etching of metal layers in the fab, ions deposit charge onto long metal traces.
          If a long wire is connected to a small transistor gate, the accumulated electrostatic voltage arcs through the thin dielectric oxide, permanently destroying the transistor!
          <br />
          Foundries enforce <strong>Antenna DRC Rules</strong> (Antenna Ratio = Metal Area / Gate Area). When limits are exceeded, designers must insert reverse-biased <strong>Antenna Diodes</strong> to bleed charges into the silicon substrate.
        </p>
      </div>

      {/* Antenna Diagram Canvas */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">Plasma Etching Charge Collection &amp; Diode Bleeding</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Metal Area: 60 µm² | Gate Area: 0.20 µm²</span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Plasma Ion Shower */}
            <g opacity="0.6">
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={i} x1={100 + i * 50} y1="15" x2={100 + i * 50} y2="40" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
              ))}
              <text x="300" y="20" fill="#f43f5e" fontSize="9" fontWeight="700" textAnchor="middle">
                Reactive Ion Plasma Etch (Charge +++ Collection)
              </text>
            </g>

            {/* Long Metal Trace acting as Antenna */}
            <rect x="80" y="45" width="400" height="20" fill="#ec4899" rx="2" />
            <text x="280" y="59" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle">
              Long Metal 3 Trace (Area = 60 µm²)
            </text>

            {/* Via down to Gate */}
            <rect x="440" y="65" width="20" height="25" fill="#f59e0b" />
            <text x="470" y="80" fill="#f59e0b" fontSize="8">Via</text>

            {/* MOS Gate Oxide */}
            <rect x="420" y="90" width="60" height="15" fill="#38bdf8" />
            <text x="450" y="102" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle">Gate (0.20 µm²)</text>

            {/* Gate Oxide Dielectric Layer */}
            <rect x="420" y="105" width="60" height="6" fill="#fbbf24" />
            <text x="490" y="111" fill="#fbbf24" fontSize="7">1.2nm SiO2 Oxide</text>

            {/* Substrate */}
            <rect x="50" y="111" width="500" height="60" fill="#1e293b" stroke="#334155" />
            <text x="200" y="145" fill="#64748b" fontSize="9">P-Substrate (Grounded VSS)</text>

            {/* Protective Antenna Diode (Right side) */}
            <polygon points="360,115 380,135 340,135" fill="#10b981" />
            <line x1="340" y1="115" x2="380" y2="115" stroke="#10b981" strokeWidth="2" />
            <line x1="360" y1="65" x2="360" y2="115" stroke="#10b981" strokeWidth="2" />
            <line x1="360" y1="135" x2="360" y2="155" stroke="#10b981" strokeWidth="2" />
            <text x="360" y="170" fill="#10b981" fontSize="9" fontWeight="700" textAnchor="middle">
              Antenna Diode (Bleeds charge to substrate)
            </text>
          </svg>
        </div>
      </div>

      {/* Step 1: Antenna Ratio Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Compute Antenna Ratio &amp; Mitigation Decision
        </h4>
        <p className="dff-challenge__subtext">
          A metal interconnect has an exposed surface area of <strong>60 µm²</strong> attached to a fragile MOS gate with an area of <strong>0.20 µm²</strong>.<br />
          Foundry Antenna DRC Rule: Maximum Allowed Antenna Ratio = <strong>200</strong>.<br />
          Compute the Antenna Ratio and determine if an antenna diode must be inserted.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Antenna Ratio (Metal Area / Gate Area):</label>
            <input
              type="number"
              placeholder="e.g. 300"
              className="syn-opt-input"
              value={antennaRatioAns}
              onChange={(e) => setAntennaRatioAns(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label className="accum-port-label">Diode Insertion Decision:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label className={`mux-quiz-option ${diodeDecision === CORRECT_ANTENNA_DIODE_ID ? 'selected' : ''}`}>
              <input
                type="radio"
                name="diodeDecQuiz"
                value={CORRECT_ANTENNA_DIODE_ID}
                checked={diodeDecision === CORRECT_ANTENNA_DIODE_ID}
                onChange={(e) => setDiodeDecision(e.target.value)}
              />
              <span className="mux-quiz-letter">A</span>
              <span className="mux-quiz-text">
                <strong>YES, insert an antenna diode:</strong> Calculated ratio (300) exceeds maximum limit (200). A reverse-biased diode must be inserted at the gate input pin to bleed plasma charges during metal fabrication.
              </span>
            </label>

            <label className={`mux-quiz-option ${diodeDecision === 'opt-no-diode-needed' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="diodeDecQuiz"
                value="opt-no-diode-needed"
                checked={diodeDecision === 'opt-no-diode-needed'}
                onChange={(e) => setDiodeDecision(e.target.value)}
              />
              <span className="mux-quiz-letter">B</span>
              <span className="mux-quiz-text">
                NO, do nothing: Ratio is safe and requires no protection.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Step 2: Optical Proximity Correction */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔬 Step 2: Optical Proximity Correction (OPC)
        </h4>
        <div className="mux-quiz-prompt">
          What is the purpose of Optical Proximity Correction (OPC) performed during Mask Data Preparation before glass reticle manufacturing?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="OPC question">
          <label className={`mux-quiz-option ${opcConcept === CORRECT_OPC_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="opcQuiz"
              value={CORRECT_OPC_ID}
              checked={opcConcept === CORRECT_OPC_ID}
              onChange={(e) => setOpcConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Pre-distorts mask polygons with serifs and assist features to counteract optical diffraction:</strong> Because light wavelength (193nm DUV) is much larger than nanometer transistor features, diffraction rounds square corners and shrinks narrow lines. OPC modifies the photomask shapes so the diffracted image printed on silicon matches the desired rectangular layout.
            </span>
          </label>

          <label className={`mux-quiz-option ${opcConcept === 'opt-opc-zoom' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="opcQuiz"
              value="opt-opc-zoom"
              checked={opcConcept === 'opt-opc-zoom'}
              onChange={(e) => setOpcConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Digital zoom feature:</strong> OPC is an image zoom filter used by human operators.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Tape-Out Prep Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          📡 Verify Tape-Out Preparation
        </button>
      </div>
    </div>
  );
}
