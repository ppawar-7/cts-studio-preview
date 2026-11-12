/**
 * CTSToolbar.jsx
 * ===============
 * Top engineering command toolbar for CTS Studio 1.0.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CTSToolbar({
  project,
  onSelectScenario,
  onNewDesign,
  onSave,
  onAutoBalance,
  onOpenCompare,
  onExportReport,
  onExportJSON,
  onImportJSON,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isExploreMode = false,
}) {
  const navigate = useNavigate();

  return (
    <header className="cts-toolbar" role="toolbar" aria-label="CTS Studio Commands">
      {/* Brand Branding */}
      <div className="cts-toolbar__brand">
        <span>⚡ CTS Studio</span>
        <span className="cts-toolbar__brand-tag">v1.0 CAD</span>
      </div>

      <div className="cts-toolbar__sep" />

      {/* Preset Scenario Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>PRESET:</span>
        <select
          className="cts-toolbar__select"
          value={project.scenarioId || 'custom'}
          onChange={(e) => onSelectScenario(e.target.value)}
          aria-label="Clock Tree Benchmark Preset"
        >
          <option value="custom">-- Custom Design --</option>
          <option value="scenario-balanced-4">Symmetric 4-Sink H-Tree</option>
          <option value="scenario-asymmetric-6">Asymmetric 6-Sink Balancing Lab</option>
          <option value="scenario-blockage-8">Obstruction-Aware (8 Sinks)</option>
          <option value="scenario-flawed-starter">Flawed Starter (Repair Me)</option>
          <option value="scenario-capstone-soc">Advanced SoC Capstone (10 Sinks)</option>
        </select>
      </div>

      <div className="cts-toolbar__sep" />

      {/* Primary Actions */}
      <button
        className="cts-btn cts-btn--primary"
        onClick={onAutoBalance}
        title="Auto-insert delay repeaters and resize buffers to balance clock skew"
      >
        <span>⚡ Auto-Balance Tree</span>
      </button>

      <button
        className="cts-btn"
        onClick={onSave}
        title="Save active design to browser storage"
      >
        <span>💾 Save</span>
      </button>

      <button
        className="cts-btn"
        onClick={onOpenCompare}
        title="Compare current clock tree against candidate snapshots"
      >
        <span>⚖️ Compare Candidates</span>
      </button>

      <button
        className="cts-btn"
        onClick={onExportReport}
        title="Export comprehensive Markdown and ASCII signoff report"
      >
        <span>📄 Signoff Report</span>
      </button>

      <button
        className="cts-btn"
        onClick={onExportJSON}
        title="Export project configuration as JSON"
      >
        <span>⬇️ Export JSON</span>
      </button>

      <label className="cts-btn" style={{ cursor: 'pointer' }} title="Import project from JSON file">
        <span>⬆️ Import JSON</span>
        <input
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={onImportJSON}
        />
      </label>

      <div className="cts-toolbar__sep" />

      {/* Undo / Redo */}
      <button
        className="cts-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last change (Ctrl+Z)"
      >
        <span>↩️</span>
      </button>
      <button
        className="cts-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <span>↪️</span>
      </button>

      <button
        className="cts-btn cts-btn--outline"
        onClick={onNewDesign}
        title="Clear canvas and start a blank clock tree"
      >
        <span>🔄 New / Clear</span>
      </button>

      <div className="cts-toolbar__sep" style={{ marginLeft: 'auto' }} />

      {/* Navigation Return Controls */}
      <button
        className="cts-btn cts-btn--outline"
        onClick={() => navigate(isExploreMode ? '/explore' : '/kingdom/cts')}
        title="Return to Clock Tree Synthesis Kingdom"
      >
        <span>🏰 CTS Kingdom</span>
      </button>

      <button
        className="cts-btn cts-btn--outline"
        onClick={() => navigate('/world-map')}
        title="Return to PD Playground Three-Studio Hub"
      >
        <span>🏠 Home</span>
      </button>
    </header>
  );
}
