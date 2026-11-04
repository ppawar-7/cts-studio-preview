/**
 * FCCellTypesChallenge.jsx
 * ========================
 * Interactive challenge for Level 2 (fc-2): Types of Physical-Only Cells.
 */

import React, { useState } from 'react';
import {
  validateFCCellTypes,
  CORRECT_TAPCELL_ID,
  CORRECT_ENDCAP_ID,
  CORRECT_TIE_ID,
} from './validators/validateFCCellTypes.js';
import './FCCellTypesChallenge.css';

export default function FCCellTypesChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [tapcellConcept, setTapcellConcept] = useState('');
  const [endcapConcept, setEndcapConcept] = useState('');
  const [tieConcept, setTieConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateFCCellTypes({
      tapcellConcept,
      endcapConcept,
      tieConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="fc-types-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🔬 Taxonomy of Physical-Only Cells: Tap, Endcap, Decap &amp; Tie Cells
        </h3>
        <p className="combseq-desc">
          Not all cells in an ASIC netlist compute Boolean logic!
          Physical-only cells contain zero logic gates but are vital for silicon reliability, latch-up prevention, power rail integrity, and gate oxide protection.
        </p>
      </div>

      {/* Visual Cell Taxonomy Cards */}
      <div className="fc-type-grid">
        <div className="fc-type-card">
          <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '1rem' }}>TAPCELL (Well Tap)</div>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '6px' }}>
            Biases N-well to VDD and substrate to VSS. Eliminates parasitic PNPN thyristor triggering (CMOS Latch-Up). Maximum spacing rule: &le; 30 µm.
          </p>
        </div>

        <div className="fc-type-card">
          <div style={{ fontWeight: 800, color: '#ec4899', fontSize: '1rem' }}>ENDCAP (Boundary)</div>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '6px' }}>
            Placed at row boundaries and macro corners. Terminates active diffusions and prevents damage during Chemical Mechanical Polishing (CMP).
          </p>
        </div>

        <div className="fc-type-card">
          <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1rem' }}>TIEHI / TIELO (Tie Cells)</div>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '6px' }}>
            Supplies constant 1 or 0 logic levels to unused inputs without connecting gate oxides directly to VDD/VSS rails, avoiding ESD rupture.
          </p>
        </div>

        <div className="fc-type-card">
          <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>DECAP (Decoupling)</div>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '6px' }}>
            On-die MOS capacitors wired between VDD and VSS to supply transient surge currents and suppress high-frequency dynamic IR drop.
          </p>
        </div>
      </div>

      {/* Step 1: Latch-Up Prevention */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🛡️ Step 1: CMOS Latch-Up Prevention
        </h4>
        <div className="mux-quiz-prompt">
          Which physical-only cell must be placed regularly across standard cell rows (typically every 30 µm) to prevent catastrophic CMOS latch-up?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Tapcell question">
          <label className={`mux-quiz-option ${tapcellConcept === CORRECT_TAPCELL_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="tapQuiz"
              value={CORRECT_TAPCELL_ID}
              checked={tapcellConcept === CORRECT_TAPCELL_ID}
              onChange={(e) => setTapcellConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Well Tap Cells (TAPCELL):</strong> Biases the N-well to VDD and P-substrate to VSS with low-resistance ohmic contacts, keeping parasitic BJT base-emitter voltages below 0.7V and preventing destructive PNPN SCR latch-up fires.
            </span>
          </label>

          <label className={`mux-quiz-option ${tapcellConcept === 'opt-random-inverter' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="tapQuiz"
              value="opt-random-inverter"
              checked={tapcellConcept === 'opt-random-inverter'}
              onChange={(e) => setTapcellConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Standard Inverters:</strong> Ordinary logic gates prevent latch-up automatically.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: Endcap Cell Placement */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📐 Step 2: Placement of Endcap Cells
        </h4>
        <div className="mux-quiz-prompt">
          Where in the physical floorplan are Endcap cells (ENDCAP) strictly placed?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Endcap question">
          <label className={`mux-quiz-option ${endcapConcept === CORRECT_ENDCAP_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="endcapQuiz"
              value={CORRECT_ENDCAP_ID}
              checked={endcapConcept === CORRECT_ENDCAP_ID}
              onChange={(e) => setEndcapConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>At the outer row boundary edges and macro borders:</strong> Endcaps cap the ends of standard cell rows to properly isolate wells and protect fragile gate oxide from chemical erosion at transition edges.
            </span>
          </label>

          <label className={`mux-quiz-option ${endcapConcept === 'opt-center-only' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="endcapQuiz"
              value="opt-center-only"
              checked={endcapConcept === 'opt-center-only'}
              onChange={(e) => setEndcapConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Only in the center of the chip:</strong> Endcaps must never touch the edges of standard cell rows.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Tie Cells */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          ⚡ Step 3: Why Tie Cells Instead of Direct Rail Connections?
        </h4>
        <div className="mux-quiz-prompt">
          Why do physical design rules strictly forbid tying unused gate inputs directly to VDD or VSS metal wires, requiring TIEHI / TIELO cells instead?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Tie cell question">
          <label className={`mux-quiz-option ${tieConcept === CORRECT_TIE_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="tieQuiz"
              value={CORRECT_TIE_ID}
              checked={tieConcept === CORRECT_TIE_ID}
              onChange={(e) => setTieConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Protects fragile thin gate oxide from voltage spikes and ESD breakdown:</strong> Direct rail connections expose the gate dielectric directly to power supply transients and electrostatic charge accumulation during manufacturing, which ruptures the gate oxide and creates fatal chip shorts.
            </span>
          </label>

          <label className={`mux-quiz-option ${tieConcept === 'opt-save-wires' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="tieQuiz"
              value="opt-save-wires"
              checked={tieConcept === 'opt-save-wires'}
              onChange={(e) => setTieConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>To save routing wires:</strong> Tie cells are used purely because wires are too expensive.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Physical-Only Cells Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🔬 Verify Physical-Only Taxonomy
        </button>
      </div>
    </div>
  );
}
