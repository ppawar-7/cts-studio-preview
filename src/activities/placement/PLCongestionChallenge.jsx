/**
 * PLCongestionChallenge.jsx
 * =========================
 * Interactive challenge for Level 4 (pl-4): Congestion and Placement.
 */

import React, { useState } from 'react';
import {
  validatePLCongestion,
  CORRECT_CONGESTION_MITIGATION_ID,
} from './validators/validatePLCongestion.js';
import { computeCongestionHeatmap } from '../../engine/placementEngine.js';
import './PLCongestionChallenge.css';

// 3x3 GCell grid setup: Bin R1C2 is congested with 6 demand vs 4 capacity = 1.5 ratio
const INITIAL_BINS = [
  { row: 0, col: 0, demand: 2, capacity: 4 },
  { row: 0, col: 1, demand: 3, capacity: 4 },
  { row: 0, col: 2, demand: 2, capacity: 4 },
  { row: 1, col: 0, demand: 3, capacity: 4 },
  { row: 1, col: 1, demand: 4, capacity: 4 },
  { row: 1, col: 2, demand: 6, capacity: 4 }, // HOTSPOT!
  { row: 2, col: 0, demand: 1, capacity: 4 },
  { row: 2, col: 1, demand: 2, capacity: 4 },
  { row: 2, col: 2, demand: 3, capacity: 4 },
];

export default function PLCongestionChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [congestionRatio, setCongestionRatio] = useState('');
  const [hotspotBin, setHotspotBin] = useState('');
  const [mitigationConcept, setMitigationConcept] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const gcellMatrix = Array.from({ length: 3 }, () => Array(3).fill(0));
  INITIAL_BINS.forEach((b) => {
    gcellMatrix[b.row][b.col] = Number((b.demand / b.capacity).toFixed(2));
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validatePLCongestion({
      congestionRatio: parseFloat(congestionRatio),
      hotspotBin,
      mitigationConcept,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="pl-congest-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🔥 Routing Congestion &amp; Density Heatmaps
        </h3>
        <p className="combseq-desc">
          Even if cell placement has zero physical overlaps, standard cells may be clustered so densely that the available metal routing tracks above them cannot accommodate all connecting nets.
          <br />
          <strong>Congestion Index:</strong> (Routing Demand / Routing Track Capacity). When index &gt; 1.0, severe routing DRC violations occur.
        </p>
      </div>

      {/* Congestion Heatmap Visualizer */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="badge badge--available">3×3 Global Routing Grid (GCells)</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Colors: Green (&le;0.7), Amber (0.8–1.0), Red (&gt;1.0 Hotspot)
          </span>
        </div>

        <div className="pl-heatmap-grid">
          {gcellMatrix.map((row, rIdx) => (
            <div key={rIdx} className="pl-heatmap-row">
              {row.map((val, cIdx) => {
                const isHot = val > 1.0;
                const isWarn = val >= 0.8 && val <= 1.0;
                const isSelected = hotspotBin === `R${rIdx}C${cIdx}`;

                return (
                  <button
                    key={cIdx}
                    type="button"
                    className={`pl-heatmap-cell ${isHot ? 'hot' : isWarn ? 'warn' : 'ok'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setHotspotBin(`R${rIdx}C${cIdx}`)}
                  >
                    <span style={{ fontSize: '0.75rem' }}>R{rIdx}C{cIdx}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{(val * 100).toFixed(0)}%</span>
                    <span style={{ fontSize: '0.7rem' }}>{val > 1.0 ? 'OVERFLOW' : 'OK'}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Congestion Calculation */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          📋 Step 1: Compute GCell Routing Congestion Ratio
        </h4>
        <p className="dff-challenge__subtext">
          In bin <code>R1C2</code>, global routing estimates <strong>6 wire crossings</strong> across a boundary with a maximum track capacity of <strong>4 routing tracks</strong>.
        </p>

        <div style={{ maxWidth: '240px', marginTop: '0.75rem' }}>
          <label className="accum-port-label">Congestion Ratio (Demand / Capacity):</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 1.50"
            className="syn-opt-input"
            value={congestionRatio}
            onChange={(e) => setCongestionRatio(e.target.value)}
          />
        </div>
      </div>

      {/* Step 2: Select Hotspot */}
      <div className="card combseq-card">
        <h4 className="dff-challenge__section-title">
          🎯 Step 2: Identify Critical Hotspot Bin
        </h4>
        <p className="dff-challenge__subtext">
          Selected GCell in Heatmap: <strong>{hotspotBin || 'None selected (click a red bin in the heatmap above)'}</strong>
        </p>
      </div>

      {/* Step 3: Mitigation Concept */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🛠️ Step 3: Congestion Alleviation Technique
        </h4>
        <div className="mux-quiz-prompt">
          How do physical design engineers instruct the placer tool to eliminate severe localized routing congestion hotspots?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Congestion mitigation question">
          <label className={`mux-quiz-option ${mitigationConcept === CORRECT_CONGESTION_MITIGATION_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="congestQuiz"
              value={CORRECT_CONGESTION_MITIGATION_ID}
              checked={mitigationConcept === CORRECT_CONGESTION_MITIGATION_ID}
              onChange={(e) => setMitigationConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Cell Padding &amp; Partial Placement Blockages:</strong> Apply placement padding (inflating virtual cell bounding boxes) or partial density blockages over the hotspot to spread logic cells outward into lower-density neighbors, freeing routing tracks for interconnect wires.
            </span>
          </label>

          <label className={`mux-quiz-option ${mitigationConcept === 'opt-pack-tighter' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="congestQuiz"
              value="opt-pack-tighter"
              checked={mitigationConcept === 'opt-pack-tighter'}
              onChange={(e) => setMitigationConcept(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Pack cells even tighter:</strong> Squeezing more cells into the congested bin automatically eliminates wire congestion.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Congestion Analysis Certified!' : '⚠️ Analysis Incomplete:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🔥 Verify Congestion &amp; Spreading Solutions
        </button>
      </div>
    </div>
  );
}
