/**
 * CTSTopologiesChallenge.jsx
 * ==========================
 * Interactive challenge for Level 4 (cts-4): Clock Tree Topologies.
 */

import React, { useState } from 'react';
import {
  validateCTSTopologies,
  CORRECT_ASIC_TOPOLOGY_ID,
  CORRECT_MESH_TOPOLOGY_ID,
  CORRECT_MESH_DRAWBACK_ID,
} from './validators/validateCTSTopologies.js';
import { CLOCK_TOPOLOGY_PROFILES } from '../../engine/ctsEngine.js';
import './CTSTopologiesChallenge.css';

export default function CTSTopologiesChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const [selectedTab, setSelectedTab] = useState('balanced-tree');
  const [asicTopology, setAsicTopology] = useState('');
  const [highPerfTopology, setHighPerfTopology] = useState('');
  const [meshDrawback, setMeshDrawback] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const activeProfile = CLOCK_TOPOLOGY_PROFILES[selectedTab];

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateCTSTopologies({
      asicTopology,
      highPerfTopology,
      meshDrawback,
    });
    setValidationResult(result);
    if (result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="cts-topologies-challenge">
      <div className="combseq-concept-box">
        <h3 className="combseq-heading">
          🏛️ Clock Tree Topologies: H-Tree, Balanced Tree, and Mesh
        </h3>
        <p className="combseq-desc">
          Clock distribution architecture governs physical skew limits, dynamic switching power, and routing congestion.
          ASIC designers must select the topology that meets timing signoff without incurring unacceptable dynamic power penalties.
        </p>
      </div>

      {/* Interactive Topology Visualizer */}
      <div className="card combseq-card">
        <div className="cts-topology-tabs">
          <button
            type="button"
            className={`cts-topology-tab ${selectedTab === 'balanced-tree' ? 'active' : ''}`}
            onClick={() => setSelectedTab('balanced-tree')}
          >
            Balanced Binary Tree (ASIC Standard)
          </button>
          <button
            type="button"
            className={`cts-topology-tab ${selectedTab === 'h-tree' ? 'active' : ''}`}
            onClick={() => setSelectedTab('h-tree')}
          >
            Symmetric H-Tree
          </button>
          <button
            type="button"
            className={`cts-topology-tab ${selectedTab === 'clock-mesh' ? 'active' : ''}`}
            onClick={() => setSelectedTab('clock-mesh')}
          >
            Clock Mesh (Grid)
          </button>
        </div>

        <div className="dff-schematic-wrapper">
          <svg viewBox="0 0 600 200" style={{ width: '100%', maxWidth: '600px' }}>
            {selectedTab === 'h-tree' && (
              <g>
                {/* Central H-Tree */}
                <line x1="300" y1="50" x2="300" y2="150" stroke="#38bdf8" strokeWidth="4" />
                <line x1="200" y1="50" x2="400" y2="50" stroke="#38bdf8" strokeWidth="3" />
                <line x1="200" y1="150" x2="400" y2="150" stroke="#38bdf8" strokeWidth="3" />
                {/* 4 sub branches */}
                <line x1="200" y1="30" x2="200" y2="70" stroke="#60a5fa" strokeWidth="2" />
                <line x1="400" y1="30" x2="400" y2="70" stroke="#60a5fa" strokeWidth="2" />
                <line x1="200" y1="130" x2="200" y2="170" stroke="#60a5fa" strokeWidth="2" />
                <line x1="400" y1="130" x2="400" y2="170" stroke="#60a5fa" strokeWidth="2" />
                <circle cx="300" cy="100" r="8" fill="#f59e0b" />
                <text x="300" y="185" fill="#94a3b8" fontSize="10" textAnchor="middle">Symmetric Fractal H-Tree (Equal geometric paths)</text>
              </g>
            )}

            {selectedTab === 'balanced-tree' && (
              <g>
                {/* Root */}
                <circle cx="80" cy="100" r="8" fill="#38bdf8" />
                {/* Level 1 branches */}
                <line x1="88" y1="100" x2="200" y2="60" stroke="#38bdf8" strokeWidth="3" />
                <line x1="88" y1="100" x2="200" y2="140" stroke="#38bdf8" strokeWidth="3" />
                {/* Level 2 buffers */}
                <polygon points="200,50 220,60 200,70" fill="#6366f1" />
                <polygon points="200,130 220,140 200,150" fill="#6366f1" />
                {/* Non-uniform clusters */}
                <line x1="220" y1="60" x2="350" y2="35" stroke="#60a5fa" strokeWidth="2" />
                <line x1="220" y1="60" x2="380" y2="75" stroke="#60a5fa" strokeWidth="2" />
                <line x1="220" y1="140" x2="340" y2="125" stroke="#60a5fa" strokeWidth="2" />
                <line x1="220" y1="140" x2="420" y2="165" stroke="#60a5fa" strokeWidth="2" />
                <text x="300" y="185" fill="#94a3b8" fontSize="10" textAnchor="middle">Geometric Binary Tree (Adapts to irregular standard cell placement)</text>
              </g>
            )}

            {selectedTab === 'clock-mesh' && (
              <g>
                {/* Mesh Grid */}
                <line x1="100" y1="40" x2="500" y2="40" stroke="#10b981" strokeWidth="2" />
                <line x1="100" y1="80" x2="500" y2="80" stroke="#10b981" strokeWidth="2" />
                <line x1="100" y1="120" x2="500" y2="120" stroke="#10b981" strokeWidth="2" />
                <line x1="100" y1="160" x2="500" y2="160" stroke="#10b981" strokeWidth="2" />

                <line x1="150" y1="20" x2="150" y2="180" stroke="#10b981" strokeWidth="2" />
                <line x1="250" y1="20" x2="250" y2="180" stroke="#10b981" strokeWidth="2" />
                <line x1="350" y1="20" x2="350" y2="180" stroke="#10b981" strokeWidth="2" />
                <line x1="450" y1="20" x2="450" y2="180" stroke="#10b981" strokeWidth="2" />
                <text x="300" y="195" fill="#94a3b8" fontSize="10" textAnchor="middle">Clock Mesh Grid (Ultra-low skew &amp; OCV tolerance, high dynamic power)</text>
              </g>
            )}
          </svg>
        </div>

        <div style={{ marginTop: '0.75rem', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          <div style={{ fontWeight: 700, color: '#38bdf8' }}>{activeProfile.name}</div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>
            <strong>Skew Quality:</strong> {activeProfile.skewQuality}<br />
            <strong>Power Consumption:</strong> {activeProfile.powerConsumption}<br />
            <strong>Flexibility:</strong> {activeProfile.flexibility}
          </div>
        </div>
      </div>

      {/* Step 1: ASIC Topology Question */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🏢 Step 1: Default Topology for Standard Cell ASICs
        </h4>
        <div className="mux-quiz-prompt">
          Which clock tree topology is the default standard for general ASIC physical design flows with non-uniform register placement?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="ASIC topology question">
          <label className={`mux-quiz-option ${asicTopology === CORRECT_ASIC_TOPOLOGY_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="asicTopQuiz"
              value={CORRECT_ASIC_TOPOLOGY_ID}
              checked={asicTopology === CORRECT_ASIC_TOPOLOGY_ID}
              onChange={(e) => setAsicTopology(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Geometric Balanced Binary Tree:</strong> Handles non-uniform sink placements flexibly, clusters sinks using CAD algorithms (like Method of Means and Medians), and minimizes dynamic power by inserting clock-gating cells where appropriate.
            </span>
          </label>

          <label className={`mux-quiz-option ${asicTopology === 'opt-h-tree-only' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="asicTopQuiz"
              value="opt-h-tree-only"
              checked={asicTopology === 'opt-h-tree-only'}
              onChange={(e) => setAsicTopology(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Rigid H-Tree:</strong> All flip-flops must be manually placed at exact power-of-two symmetric coordinate locations across the chip die.
            </span>
          </label>
        </div>
      </div>

      {/* Step 2: High Performance Core Topology */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          ⚡ Step 2: High-Performance Multi-GHz Processors
        </h4>
        <div className="mux-quiz-prompt">
          Which clock distribution structure is selected for bleeding-edge microprocessors (&gt;3 GHz) requiring extreme tolerance to On-Chip Variation (OCV)?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="High perf topology question">
          <label className={`mux-quiz-option ${highPerfTopology === CORRECT_MESH_TOPOLOGY_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="highPerfQuiz"
              value={CORRECT_MESH_TOPOLOGY_ID}
              checked={highPerfTopology === CORRECT_MESH_TOPOLOGY_ID}
              onChange={(e) => setHighPerfTopology(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Clock Mesh (Grid):</strong> A dense multi-layer metal mesh driven by massive mesh drivers that shunts local timing variations, providing ultra-low clock skew and high jitter immunity.
            </span>
          </label>

          <label className={`mux-quiz-option ${highPerfTopology === 'opt-serial-chain' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="highPerfQuiz"
              value="opt-serial-chain"
              checked={highPerfTopology === 'opt-serial-chain'}
              onChange={(e) => setHighPerfTopology(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Serial Daisy Chain:</strong> Clock line runs in a single wire sequentially passing from flop 1 to flop 100,000.
            </span>
          </label>
        </div>
      </div>

      {/* Step 3: Drawback of Clock Mesh */}
      <div className="dff-challenge__concept-section">
        <h4 className="dff-challenge__section-title">
          🔋 Step 3: Trade-Off Analysis — Clock Mesh Penalty
        </h4>
        <div className="mux-quiz-prompt">
          What is the primary engineering disadvantage that prevents clock meshes from being used in battery-powered mobile ASICs?
        </div>

        <div className="mux-quiz-options-group" role="radiogroup" aria-label="Mesh drawback question">
          <label className={`mux-quiz-option ${meshDrawback === CORRECT_MESH_DRAWBACK_ID ? 'selected' : ''}`}>
            <input
              type="radio"
              name="meshDrawbackQuiz"
              value={CORRECT_MESH_DRAWBACK_ID}
              checked={meshDrawback === CORRECT_MESH_DRAWBACK_ID}
              onChange={(e) => setMeshDrawback(e.target.value)}
            />
            <span className="mux-quiz-letter">A</span>
            <span className="mux-quiz-text">
              <strong>Extremely high dynamic power (P = C_mesh &middot; V^2 &middot; f) and high metal routing congestion:</strong> The entire dense metal grid switches on every clock edge, consuming massive power that drains batteries and blocks routing tracks.
            </span>
          </label>

          <label className={`mux-quiz-option ${meshDrawback === 'opt-too-cheap' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="meshDrawbackQuiz"
              value="opt-too-cheap"
              checked={meshDrawback === 'opt-too-cheap'}
              onChange={(e) => setMeshDrawback(e.target.value)}
            />
            <span className="mux-quiz-letter">B</span>
            <span className="mux-quiz-text">
              <strong>Clock meshes consume zero power:</strong> Designers avoid them because they are too fast.
            </span>
          </label>
        </div>
      </div>

      {validationResult && (
        <div className={`level-page__feedback ${validationResult.passed ? 'level-page__feedback--success' : 'level-page__feedback--error'}`} style={{ marginTop: '1.25rem' }}>
          <strong>{validationResult.passed ? '✓ Topology Selection Certified!' : '⚠️ Incomplete Submission:'}</strong> {validationResult.feedback}
        </div>
      )}

      <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit}>
          🏛️ Verify Topology Selection
        </button>
      </div>
    </div>
  );
}
