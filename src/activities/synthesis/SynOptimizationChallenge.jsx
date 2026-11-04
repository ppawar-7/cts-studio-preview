/**
 * SynOptimizationChallenge.jsx
 * =============================
 * Interactive challenge for Level 2 (syn-2): Logic Optimization.
 */

import React, { useState } from 'react';
import {
  validateSynOptimization,
  OPTIMIZATION_EXERCISES,
  CORRECT_FACTORING_ID,
  CORRECT_DEMORGAN_ID,
} from './validators/validateSynOptimization.js';
import './SynOptimizationChallenge.css';

export default function SynOptimizationChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [answers, setAnswers] = useState({
    opt1: '',
    opt2: '',
    opt3: '',
    opt4: '',
  });
  const [factoringAnswer, setFactoringAnswer] = useState('');
  const [demorganAnswer, setDemorganAnswer] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleInputChange = (id, val) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateSynOptimization({
      answers,
      factoringAnswer,
      demorganAnswer,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="syn-opt-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          ✂️ Boolean Logic Minimization &amp; Constant Folding
        </h3>
        <p className="combseq-desc">
          Before binding to standard cells, the synthesis compiler runs multi-level logic optimization algorithms to remove redundant logic gates, propagate constant ties (VDD/VSS), and factor common terms.
        </p>
      </div>

      {/* Step 1: Algebraic Simplification */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Simplify Redundant Expressions
        </h4>
        <p className="dff-challenge__subtext">
          Simplify each expression to its minimal form (e.g. <code>A</code>, <code>B</code>, <code>C</code>, <code>D</code>, <code>0</code>, or <code>1</code>).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {OPTIMIZATION_EXERCISES.map((ex) => {
            const res = validationResult?.exerciseResults?.find((r) => r.id === ex.id);
            return (
              <div key={ex.id} className="syn-opt-card">
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Expression:</div>
                <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 800, color: '#0ea5e9', margin: '4px 0' }}>
                  {ex.expr}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Minimal form"
                    className={`syn-opt-input ${res ? (res.isCorrect ? 'correct' : 'incorrect') : ''}`}
                    value={answers[ex.id]}
                    onChange={(e) => handleInputChange(ex.id, e.target.value)}
                  />
                </div>
                {res && (
                  <div style={{ fontSize: '0.78rem', marginTop: '6px', color: res.isCorrect ? '#16a34a' : '#dc2626' }}>
                    {res.isCorrect ? '✓ Correct!' : `Expected: ${ex.expected} (${ex.reason})`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Boolean Factoring */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          📐 Step 2: Common Subexpression Elimination (Factoring)
        </h4>
        <div className="mux-quiz-prompt">
          Given the raw sum-of-products expression: <code>F = (A &amp; B) | (A &amp; C)</code>.<br />
          How does the synthesis tool factor this equation to reduce gate area?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Factoring question">
          <label className={`mux-quiz-option ${factoringAnswer === CORRECT_FACTORING_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="factoringQuiz"
              value={CORRECT_FACTORING_ID}
              checked={factoringAnswer === CORRECT_FACTORING_ID}
              onChange={(e) => setFactoringAnswer(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong><code>F = A &amp; (B | C)</code>:</strong> Distributive factoring reduces literal count from 4 literals (2 AND gates + 1 OR gate) down to 3 literals (1 OR gate + 1 AND gate), saving silicon area and dynamic power.
            </span>
          </label>

          <label className={`mux-quiz-option ${factoringAnswer === 'opt-factored-bad' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="factoringQuiz"
              value="opt-factored-bad"
              checked={factoringAnswer === 'opt-factored-bad'}
              onChange={(e) => setFactoringAnswer(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong><code>F = (A | B) &amp; (A | C)</code>:</strong> This expands literal count without saving any standard cells.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: De Morgan */}
      <div className="dff-challenge__concept-section" style={{ marginTop: '1.5rem' }}>
        <h4 className="dff-challenge__section-title">
          ⚡ Step 3: De Morgan Transformation &amp; Inverting Logic
        </h4>
        <div className="mux-quiz-prompt">
          In CMOS transistor physics, why do synthesis tools prefer inverting gates (NAND, NOR) over non-inverting gates (AND, OR)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="De Morgan CMOS question">
          <label className={`mux-quiz-option ${demorganAnswer === CORRECT_DEMORGAN_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="demorganQuiz"
              value={CORRECT_DEMORGAN_ID}
              checked={demorganAnswer === CORRECT_DEMORGAN_ID}
              onChange={(e) => setDemorganAnswer(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>CMOS natural inversion:</strong> A single CMOS stage inherently inverts (pull-up PMOS vs pull-down NMOS). A physical NAND2 requires only 4 transistors and has a single stage of delay, whereas an AND2 requires 6 transistors (NAND2 followed by an internal inverter), adding both area and propagation delay!
            </span>
          </label>

          <label className={`mux-quiz-option ${demorganAnswer === 'opt-and-faster' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="demorganQuiz"
              value="opt-and-faster"
              checked={demorganAnswer === 'opt-and-faster'}
              onChange={(e) => setDemorganAnswer(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Non-inverting gates are faster:</strong> AND gates have fewer transistors and lower capacitance than NAND gates in silicon.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Optimization Validated!' : '⚠️ Incomplete Optimization:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          ✂️ Verify Logic Minimization Solution
        </button>
      </div>
    </div>
  );
}
