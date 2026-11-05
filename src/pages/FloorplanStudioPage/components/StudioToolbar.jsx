/**
 * StudioToolbar.jsx
 * =================
 * Top action toolbar for Floorplan Studio.
 * Handles Project operations (New, Open Preset, Save, Export),
 * History (Undo, Redo), View controls (Zoom, Pan, Fit, Snap),
 * Layer toggles, and Navigation back to Kingdom.
 */

import React from 'react';

export default function StudioToolbar({
  project,
  onNewProject,
  onLoadPreset,
  onSaveProject,
  onExportJson,
  onImportJson,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  snapToGrid,
  onToggleSnap,
  gridSize,
  onChangeGridSize,
  showCongestion,
  onToggleCongestion,
  showPowerNetwork,
  onTogglePowerNetwork,
  showBlockages,
  onToggleBlockages,
  isExploreMode = false,
  onReturnToKingdom,
}) {
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result;
        if (json && onImportJson) {
          onImportJson(json);
        }
      } catch (err) {
        alert('Failed to parse floorplan JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="fp-studio__toolbar" role="toolbar" aria-label="Floorplanning Studio Actions" data-testid="fp-toolbar">
      <div className="fp-studio__toolbar-brand">
        📐 Floorplan Studio 2.0
      </div>

      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onReturnToKingdom}
        title="Return to Kingdom view"
        data-testid="btn-return-kingdom"
      >
        ← Kingdom
      </button>

      <div className="fp-studio__toolbar-sep" />

      {/* Project Operations */}
      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onNewProject}
        title="Create blank project"
        data-testid="btn-new"
      >
        📄 New
      </button>

      <select
        className="fp-toolbar-btn"
        onChange={(e) => {
          if (e.target.value) {
            onLoadPreset(e.target.value);
            e.target.value = '';
          }
        }}
        defaultValue=""
        title="Load Example Benchmark"
        data-testid="preset-select"
      >
        <option value="" disabled>Load Example...</option>
        <option value="small-controller">Small Controller (Defect: Overlap)</option>
        <option value="dual-sram">Dual SRAM Controller (Defect: Missing Via)</option>
        <option value="small-soc">Small SoC Subsystem (Defect: Pin Spacing)</option>
      </select>

      <button
        type="button"
        className="fp-toolbar-btn fp-toolbar-btn--primary"
        onClick={onSaveProject}
        title="Save project to persistent storage"
        data-testid="btn-save"
      >
        💾 Save
      </button>

      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onExportJson}
        title="Export design as JSON artifact"
        data-testid="btn-export"
      >
        ⤓ Export
      </button>

      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={() => fileInputRef.current?.click()}
        title="Import design JSON"
        data-testid="btn-import"
      >
        ⤒ Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="fp-studio__toolbar-sep" />

      {/* Undo / Redo */}
      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        data-testid="btn-undo"
      >
        ↶ Undo
      </button>
      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        data-testid="btn-redo"
      >
        ↷ Redo
      </button>

      <div className="fp-studio__toolbar-sep" />

      {/* Zoom / View controls */}
      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onZoomOut}
        title="Zoom Out"
        data-testid="btn-zoom-out"
      >
        −
      </button>
      <span className="fp-toolbar-zoom" data-testid="zoom-level">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onZoomIn}
        title="Zoom In"
        data-testid="btn-zoom-in"
      >
        +
      </button>
      <button
        type="button"
        className="fp-toolbar-btn"
        onClick={onFitView}
        title="Fit Design to View"
        data-testid="btn-fit-view"
      >
        ⛶ Fit
      </button>

      <div className="fp-studio__toolbar-sep" />

      {/* Grid & Snapping */}
      <button
        type="button"
        className={`fp-toolbar-btn ${snapToGrid ? 'fp-toolbar-btn--active' : ''}`}
        onClick={onToggleSnap}
        title="Toggle Grid Snapping"
        data-testid="btn-toggle-snap"
      >
        🧲 Snap: {snapToGrid ? `${gridSize}µm` : 'Off'}
      </button>

      <div className="fp-studio__toolbar-sep" />

      {/* Layer Toggles */}
      <button
        type="button"
        className={`fp-toolbar-btn ${showPowerNetwork ? 'fp-toolbar-btn--active' : ''}`}
        onClick={onTogglePowerNetwork}
        title="Toggle Power Distribution Network (Rings & Straps)"
        data-testid="btn-toggle-pdn"
      >
        ⚡ PDN
      </button>

      <button
        type="button"
        className={`fp-toolbar-btn ${showCongestion ? 'fp-toolbar-btn--active' : ''}`}
        onClick={onToggleCongestion}
        title="Toggle Routability / Congestion Heatmap Overlay"
        data-testid="btn-toggle-congestion"
      >
        🔥 Congestion
      </button>

      <button
        type="button"
        className={`fp-toolbar-btn ${showBlockages ? 'fp-toolbar-btn--active' : ''}`}
        onClick={onToggleBlockages}
        title="Toggle Placement Blockages"
        data-testid="btn-toggle-blockages"
      >
        🚫 Blockages
      </button>

      {isExploreMode && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.74rem',
            background: '#1e3a5f',
            color: '#38bdf8',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #0284c7',
            fontWeight: 700,
          }}
          data-testid="explore-sandbox-badge"
        >
          🧭 Explore Sandbox
        </span>
      )}
    </header>
  );
}
