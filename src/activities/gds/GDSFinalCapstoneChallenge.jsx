/**
 * GDSFinalCapstoneChallenge.jsx
 * ==============================
 * Grand Capstone challenge for Level 5 (gds-5): Final ASIC Kingdom Capstone Challenge.
 * Celebrates completion of all 8 Kingdoms and certifies official chip tape-out!
 */

import React, { useState } from 'react';
import {
  validateGDSFinalCapstone,
  CORRECT_FLOW_SUMMARY_ID,
} from './validators/validateGDSFinalCapstone.js';
import './GDSFinalCapstoneChallenge.css';

export default function GDSFinalCapstoneChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [audit, setAudit] = useState({
    drc: false,
    lvs: false,
    sta: false,
    erc: false,
    antenna: false,
    cmp: false,
  });
  const [flowSummaryConcept, setFlowSummaryConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const toggleAudit = (key) => {
    setAudit((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    setAudit({
      drc: true,
      lvs: true,
      sta: true,
      erc: true,
      antenna: true,
      cmp: true,
    });
  };

  const allAudited = audit.drc && audit.lvs && audit.sta && audit.erc && audit.antenna && audit.cmp;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateGDSFinalCapstone({
      signoffAudit: audit,
      flowSummaryConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="gds-capstone-challenge">
      <div className="gds-trophy-banner">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24', margin: 0 }}>
          🏆 The Grand ASIC Tape-Out Signoff
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginTop: '0.5rem', maxWidth: '640px', margin: '0.5rem auto 0 auto' }}>
          You have journeyed across all 8 Physical Design Kingdoms:
          <br />
          <code>RTL &rarr; Synthesis &rarr; Floorplan &rarr; Placement &rarr; CTS &rarr; Routing &rarr; Filler Cells &rarr; GDSII Tape-Out</code>.
          <br />
          Execute the final sign-off audit to release the golden GDSII stream to the semiconductor foundry!
        </p>
      </div>

      {/* Final Signoff Checklist Cards */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">Final Tape-Out Signoff Gate Matrix</span>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
            onClick={handleSelectAll}
          >
            Audit All Signoff Gates
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { key: 'drc',     name: 'DRC Clean', desc: '0 geometric violations across all 45 mask layers' },
            { key: 'lvs',     name: 'LVS Matched', desc: '100% netlist isomorphism; 0 opens, 0 shorts' },
            { key: 'sta',     name: 'STA Timing Closed', desc: 'Setup WNS = +0.020ns, Hold WNS = +0.015ns' },
            { key: 'erc',     name: 'ERC Clean', desc: 'All N-wells and substrates correctly biased' },
            { key: 'antenna', name: 'Antenna Rules Met', desc: 'Plasma diodes inserted on all long traces' },
            { key: 'cmp',     name: 'CMP Density Met', desc: '48% uniform metal/poly density verified' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`syn-opt-card ${audit[item.key] ? 'selected' : ''}`}
              onClick={() => toggleAudit(item.key)}
              style={{
                textAlign: 'left',
                border: audit[item.key] ? '1px solid #10b981' : '1px solid #334155',
                background: audit[item.key] ? '#064e3b33' : '#1e293b',
              }}
            >
              <div style={{ fontWeight: 800, color: audit[item.key] ? '#10b981' : '#f59e0b' }}>
                {audit[item.key] ? '✓ ' + item.name : '○ ' + item.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                {item.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Comprehensive Physical Design Flow Summary */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🎓 Step 1: End-to-End ASIC Physical Design Flow Architecture
        </h4>
        <div className="mux-quiz-prompt">
          Which statement accurately synthesizes the complete physical design flow you have mastered across all 8 kingdoms?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Curriculum summary question">
          <label className={`mux-quiz-option ${flowSummaryConcept === CORRECT_FLOW_SUMMARY_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="summaryQuiz"
              value={CORRECT_FLOW_SUMMARY_ID}
              checked={flowSummaryConcept === CORRECT_FLOW_SUMMARY_ID}
              onChange={(e) => setFlowSummaryConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>The Complete ASIC Physical Implementation Pipeline:</strong> RTL describes behavior; Synthesis maps RTL into standard library gates and optimizes logic; Floorplanning sets die boundaries, core utilization, pin pitches, and macro keepouts; Placement legalizes cells and minimizes HPWL; CTS builds balanced clock trees to control skew and latency; Routing assigns multilayer orthogonal metal tracks and vias while managing crosstalk; Filler Cells bridge gaps for continuous wells and power rails; and GDSII tape-out signoff delivers verified masks to the foundry.
            </span>
          </label>

          <label className={`mux-quiz-option ${flowSummaryConcept === 'opt-random-guess' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="summaryQuiz"
              value="opt-random-guess"
              checked={flowSummaryConcept === 'opt-random-guess'}
              onChange={(e) => setFlowSummaryConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>ASIC chips are carved by hand out of wood:</strong> No computers or EDA tools are involved in semiconductor design.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '🏆 CHIP OFFICIALLY TAPED OUT!' : '⚠️ Sign-off Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn--primary btn--lg"
          style={{
            fontSize: '1.15rem',
            padding: '1rem 2.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
          }}
          onClick={handleSubmit}
        >
          🚀 SHIP GDSII TO FOUNDRY &bull; TAPE-OUT CHIP!
        </button>
      </div>
    </div>
  );
}
