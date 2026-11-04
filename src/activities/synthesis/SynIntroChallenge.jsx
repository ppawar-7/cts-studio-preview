/**
 * SynIntroChallenge.jsx
 * =====================
 * Interactive challenge for Level 1 (syn-1): What is Synthesis?
 */

import React, { useState } from 'react';
import {
  validateSynIntro,
  SYNTHESIS_STAGES,
  CORRECT_SYN_INTRO_CONCEPT_ID,
} from './validators/validateSynIntro.js';
import './SynIntroChallenge.css';

export default function SynIntroChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [stageMappings, setStageMappings] = useState({
    translation: '',
    optimization: '',
    mapping: '',
  });
  const [conceptAnswer, setConceptAnswer] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const handleSelect = (stageId, val) => {
    setStageMappings((prev) => ({ ...prev, [stageId]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateSynIntro({
      stageMappings,
      conceptAnswer,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="syn-intro-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          ⚗️ From RTL to Gate-Level Netlist
        </h3>
        <p className="combseq-desc">
          Logic synthesis transforms human-readable Hardware Description Language (Verilog/VHDL) into an optimized network of standard cells from a specific semiconductor manufacturing library (.lib).
        </p>
        <div className="dff-challenge__callout" style={{ background: '#e0f2fe', borderColor: '#0ea5e9', color: '#0369a1' }}>
          <strong>Synthesis Flow:</strong> 1. RTL Parsing &amp; Elaboration → 2. Technology-Independent Boolean Optimization → 3. Technology Mapping to Foundry Standard Cells.
        </div>
      </div>

      {/* Synthesis Pipeline Visualizer */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">ASIC Synthesis Transformation Flow</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            RTL HDL → GTECH → Optimized Boolean → Gate Netlist
          </span>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 640 140" style={{ width: '100%', maxWidth: '640px' }}>
            {/* Box 1: RTL */}
            <rect x="20" y="35" width="110" height="70" rx="6" fill="#1e293b" stroke="#7c3aed" strokeWidth="2" />
            <text x="75" y="65" fill="#a78bfa" fontSize="12" fontWeight="800" textAnchor="middle">Verilog RTL</text>
            <text x="75" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle">assign Y = A &amp; B;</text>

            <line x1="130" y1="70" x2="180" y2="70" stroke="#0ea5e9" strokeWidth="2.5" />

            {/* Box 2: Generic GTECH */}
            <rect x="180" y="35" width="120" height="70" rx="6" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
            <text x="240" y="65" fill="#38bdf8" fontSize="12" fontWeight="800" textAnchor="middle">Elaboration</text>
            <text x="240" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle">Generic GTECH</text>

            <line x1="300" y1="70" x2="350" y2="70" stroke="#0ea5e9" strokeWidth="2.5" />

            {/* Box 3: Boolean Opt */}
            <rect x="350" y="35" width="120" height="70" rx="6" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
            <text x="410" y="65" fill="#fbbf24" fontSize="12" fontWeight="800" textAnchor="middle">Optimization</text>
            <text x="410" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle">Minimized Logic</text>

            <line x1="470" y1="70" x2="520" y2="70" stroke="#0ea5e9" strokeWidth="2.5" />

            {/* Box 4: Standard Cells */}
            <rect x="520" y="35" width="100" height="70" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="2" />
            <text x="570" y="65" fill="#34d399" fontSize="12" fontWeight="800" textAnchor="middle">Target Gates</text>
            <text x="570" y="85" fill="#94a3b8" fontSize="10" textAnchor="middle">NAND2 / DFF</text>
          </svg>
        </div>
      </div>

      {/* Step 1: Matching synthesis phases */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Match Each Synthesis Phase to its Execution Engine
        </h4>
        <p className="dff-challenge__subtext">
          Select the correct primary task performed during each stage of the synthesis compiler.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {SYNTHESIS_STAGES.map((stg) => {
            const res = validationResult?.stageResults?.find((r) => r.stageId === stg.id);
            return (
              <div key={stg.id} className="syn-stage-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{stg.name}</div>
                  <div style={{ fontSize: '0.88rem', color: '#64748b' }}>{stg.desc}</div>
                </div>
                <div style={{ minWidth: '220px' }}>
                  <select
                    className={`mux-output-select ${res ? (res.isCorrect ? 'correct' : 'incorrect') : ''}`}
                    value={stageMappings[stg.id]}
                    onChange={(e) => handleSelect(stg.id, e.target.value)}
                  >
                    <option value="">— Select Target Action —</option>
                    <option value="gtech">Translates RTL to Generic GTECH Network</option>
                    <option value="boolean-min">Minimizes Boolean equations (literal count)</option>
                    <option value="cell-bind">Maps to Foundry Physical Cells (.lib)</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Concept question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🧠 Step 2: Technology Decoupling Concept
        </h4>
        <div className="mux-quiz-prompt">
          Why do modern synthesis tools (e.g. Yosys, Design Compiler) first translate RTL into a generic technology-independent representation (GTECH) instead of directly generating foundry gates?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Synthesis technology decoupling question">
          <label className={`mux-quiz-option ${conceptAnswer === CORRECT_SYN_INTRO_CONCEPT_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="synConcept"
              value={CORRECT_SYN_INTRO_CONCEPT_ID}
              checked={conceptAnswer === CORRECT_SYN_INTRO_CONCEPT_ID}
              onChange={(e) => setConceptAnswer(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Decouples design intent from foundry cell physics:</strong> Mathematical Boolean optimization algorithms (constant folding, factoring, state minimization) can run universally on generic graphs before the tool solves the constrained technology mapping problem against a specific foundry cell library.
            </span>
          </label>

          <label className={`mux-quiz-option ${conceptAnswer === 'opt-direct-faster' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="synConcept"
              value="opt-direct-faster"
              checked={conceptAnswer === 'opt-direct-faster'}
              onChange={(e) => setConceptAnswer(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>To avoid standard cell libraries:</strong> Modern ASICs do not use standard cells and fabricate raw transistors directly from GTECH equations.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Synthesis Fundamentals Verified!' : '⚠️ Verification Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          ⚗️ Verify Synthesis Architecture Answers
        </button>
      </div>
    </div>
  );
}
