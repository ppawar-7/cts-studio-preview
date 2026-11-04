/**
 * SynTechMappingChallenge.jsx
 * ===========================
 * Interactive challenge for Level 3 (syn-3): Technology Mapping.
 */

import React, { useState } from 'react';
import {
  validateSynTechMapping,
  CORRECT_OPTIMAL_CELL_ID,
  CORRECT_LIBERTY_CONCEPT_ID,
} from './validators/validateSynTechMapping.js';
import { EDUCATIONAL_CELL_LIBRARY } from '../../engine/synthesisEngine.js';
import './SynTechMappingChallenge.css';

export default function SynTechMappingChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [calculatedArea, setCalculatedArea] = useState('');
  const [calculatedDelay, setCalculatedDelay] = useState('');
  const [chosenMapping, setChosenMapping] = useState('');
  const [libertyConcept, setLibertyConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateSynTechMapping({
      calculatedArea,
      calculatedDelay,
      chosenMapping,
      libertyConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="syn-tech-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🧩 Standard-Cell Technology Mapping
        </h3>
        <p className="combseq-desc">
          Technology mapping is the NP-complete graph-covering problem where the synthesis compiler replaces generic Boolean nodes with physical standard cells from a foundry timing library (.lib).
        </p>
      </div>

      {/* Standard Cell Library Reference Table */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📚 Educational Standard Cell Library (.lib Subset)
        </h4>
        <div className="table-responsive">
          <table className="dff-truth-table">
            <thead>
              <tr>
                <th>Cell Name</th>
                <th>Logic Function</th>
                <th>Cell Area</th>
                <th>Intrinsic Delay ($t_{pd}$)</th>
                <th>Dynamic Power</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(EDUCATIONAL_CELL_LIBRARY).map((cell) => (
                <tr key={cell.name}>
                  <td style={{ fontWeight: 800, color: '#0ea5e9' }}>{cell.name}</td>
                  <td>{cell.type}</td>
                  <td>{cell.area} GE (Gate Equivalents)</td>
                  <td>{cell.delay} ns</td>
                  <td>{cell.dynamicPower} µW/MHz</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 1: Mapping Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Calculate Area &amp; Delay for All-NAND MUX Implementation
        </h4>
        <p className="dff-challenge__subtext">
          A 2:1 Multiplexer mapped using inverting logic requires: <strong>1× INV_X1</strong> and <strong>3× NAND2_X1</strong>.<br />
          The critical delay path traverses: <code>INV_X1 → NAND2_X1 → NAND2_X1</code>.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <label className="accum-port-label">Total Gate Area (GE):</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 5.5"
              className="syn-opt-input"
              value={calculatedArea}
              onChange={(e) => setCalculatedArea(e.target.value)}
            />
          </div>

          <div>
            <label className="accum-port-label">Critical Path Delay (ns):</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 0.21"
              className="syn-opt-input"
              value={calculatedDelay}
              onChange={(e) => setCalculatedDelay(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Optimal Cell Selection */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          🎯 Step 2: Select Optimal Cell Mapping under Tight Constraints
        </h4>
        <p className="dff-challenge__subtext">
          Design constraints: <strong>Area ≤ 4.0 GE</strong>, <strong>Delay ≤ 0.20 ns</strong>. Which mapping should the tool select?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label className="mux-quiz-option">
            <input
              type="radio"
              name="mappingChoice"
              value="discrete-and-or"
              checked={chosenMapping === 'discrete-and-or'}
              onChange={(e) => setChosenMapping(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              Discrete AND-OR mapping: 1× INV + 2× AND2 + 1× OR2 (Area = 7.0 GE, Delay = 0.30 ns)
            </span>
          </label>

          <label className="mux-quiz-option">
            <input
              type="radio"
              name="mappingChoice"
              value="nand-tree"
              checked={chosenMapping === 'nand-tree'}
              onChange={(e) => setChosenMapping(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              All-NAND tree: 1× INV + 3× NAND2 (Area = 5.5 GE, Delay = 0.21 ns)
            </span>
          </label>

          <label className={`mux-quiz-option ${chosenMapping === CORRECT_OPTIMAL_CELL_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="mappingChoice"
              value={CORRECT_OPTIMAL_CELL_ID}
              checked={chosenMapping === CORRECT_OPTIMAL_CELL_ID}
              onChange={(e) => setChosenMapping(e.target.value)}
            />
            <span className="mux-quiz-letter">C</span>
            <span className="mux-quiz-text">
              <strong>Dedicated Complex Cell (MUX2_X1):</strong> A custom standard cell multiplexer (Area = 3.5 GE, Delay = 0.18 ns) satisfies both area and timing budgets!
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Liberty Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🧠 Step 3: Non-Linear Delay Model (NLDM) in Liberty Libraries
        </h4>
        <div className="mux-quiz-prompt">
          In actual semiconductor foundry <code>.lib</code> files, why is gate delay modeled as a 2D lookup table rather than a fixed constant number?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="NLDM Liberty concept question">
          <label className={`mux-quiz-option ${libertyConcept === CORRECT_LIBERTY_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="libertyQuiz"
              value={CORRECT_LIBERTY_CONCEPT_ID}
              checked={libertyConcept === CORRECT_LIBERTY_CONCEPT_ID}
              onChange={(e) => setLibertyConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Delay depends on Input Transition (Slew) and Output Load Capacitance ($C_{load}$):</strong> Slower input edge rates increase internal switching time, and heavier capacitive wire/fanout loads take longer for transistors to charge and discharge ($t \propto R_{on} \cdot C_{load}$).
            </span>
          </label>

          <label className={`mux-quiz-option ${libertyConcept === 'opt-constant-delay' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="libertyQuiz"
              value="opt-constant-delay"
              checked={libertyConcept === 'opt-constant-delay'}
              onChange={(e) => setLibertyConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Load capacitance has no effect on delay:</strong> Transistors switch at the speed of light regardless of fanout or wire length.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Technology Mapping Certified!' : '⚠️ Mapping Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🧩 Verify Technology Mapping Solution
        </button>
      </div>
    </div>
  );
}
