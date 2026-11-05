/**
 * FloorplanStudioPage.jsx
 * =======================
 * Dedicated, deep interactive engineering studio for Floorplanning Kingdom 2.0.
 * Accessible at `/studio/floorplanning` and `/explore/studio/floorplanning`.
 *
 * Full ASIC CAD environment with:
 * - 4-panel professional layout
 * - Interactive multi-layer canvas (pan, zoom, drag-and-drop, grid snapping)
 * - Complete design hierarchy explorer
 * - Context-aware properties inspector
 * - Live DRC, connectivity, missing-via, and routability analytical engines
 * - Undo/Redo history stack
 * - Export/Import JSON artifacts
 * - Benchmark presets (Small Controller, Dual SRAM, Small SoC)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudioToolbar from './components/StudioToolbar.jsx';
import DesignExplorer from './components/DesignExplorer.jsx';
import StudioCanvas from './components/StudioCanvas.jsx';
import PropertiesInspector from './components/PropertiesInspector.jsx';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import DiagnosticsPanel from './components/DiagnosticsPanel.jsx';

import {
  createDefaultProject,
  serializeProject,
  deserializeProject,
  migrateProject,
  EXAMPLE_SMALL_CONTROLLER,
  EXAMPLE_DUAL_SRAM_CONTROLLER,
  EXAMPLE_SMALL_SOC_SUBSYSTEM,
} from '../../engine/floorplanProjectModel.js';

import {
  computeUtilization,
  checkMacroOverlap,
  checkMacroCoreContainment,
  checkPinSpacing,
  checkPinContainment,
  computeHPWL,
  transformMacroOrientation,
} from '../../engine/floorplanGeometry.js';

import {
  detectOpenConnections,
  detectVDDVSSShort,
  detectMissingVias,
  computeIRDropEstimate,
  addVia,
  removeVia,
} from '../../engine/floorplanPDN.js';

import { computeCongestionMap } from '../../engine/floorplanCongestion.js';

import './FloorplanStudioPage.css';

const STORAGE_KEY = 'pdplayground_floorplan_v1';

export default function FloorplanStudioPage({ isExploreMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isExplore = Boolean(isExploreMode || location.pathname.startsWith('/explore'));

  // Initialize project state from localStorage or default
  const [project, setProject] = useState(() => {
    try {
      if (!isExplore) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return deserializeProject(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved floorplan project, using default:', e);
    }
    return createDefaultProject('My ASIC Floorplan', 'beginner');
  });

  // History stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Selection
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // View & Tool options
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(5);
  const [showPowerNetwork, setShowPowerNetwork] = useState(true);
  const [showCongestion, setShowCongestion] = useState(false);
  const [showBlockages, setShowBlockages] = useState(true);
  const [showDiagnosticsTab, setShowDiagnosticsTab] = useState(false);

  // Update project helper with history recording
  const updateProject = useCallback((updater) => {
    setHistory((h) => [...h.slice(-25), JSON.parse(JSON.stringify(project))]);
    setRedoStack([]);
    setProject(updater);
  }, [project]);

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRedoStack((r) => [...r, JSON.parse(JSON.stringify(project))]);
    setProject(prev);
  }, [history, project]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setHistory((h) => [...h, JSON.parse(JSON.stringify(project))]);
    setProject(next);
  }, [redoStack, project]);

  // Save to persistent storage
  const handleSave = useCallback(() => {
    try {
      if (!isExplore) {
        localStorage.setItem(STORAGE_KEY, serializeProject(project));
      }
      alert('Floorplan project saved successfully!');
    } catch (e) {
      alert('Failed to save project: ' + e.message);
    }
  }, [project, isExplore]);

  // Export JSON file
  const handleExport = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(serializeProject(project));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}_floorplan.json`);
    dlAnchor.click();
  }, [project]);

  // Import JSON string
  const handleImport = useCallback((jsonStr) => {
    try {
      const parsed = deserializeProject(jsonStr);
      updateProject(parsed);
      setSelectedId(null);
      setSelectedType(null);
      alert('Floorplan loaded successfully!');
    } catch (e) {
      alert('Import failed: ' + e.message);
    }
  }, [updateProject]);

  // New Blank Project
  const handleNewProject = useCallback(() => {
    if (window.confirm('Create a new blank floorplan project? Any unsaved edits will be lost.')) {
      updateProject(createDefaultProject('New Design', 'beginner'));
      setSelectedId(null);
      setSelectedType(null);
    }
  }, [updateProject]);

  // Load Preset
  const handleLoadPreset = useCallback((presetKey) => {
    let preset = null;
    if (presetKey === 'small-controller') preset = EXAMPLE_SMALL_CONTROLLER;
    else if (presetKey === 'dual-sram') preset = EXAMPLE_DUAL_SRAM_CONTROLLER;
    else if (presetKey === 'small-soc') preset = EXAMPLE_SMALL_SOC_SUBSYSTEM;

    if (preset) {
      updateProject(migrateProject(preset));
      setSelectedId(null);
      setSelectedType(null);
    }
  }, [updateProject]);

  // Update Macro Position (during drag)
  const handleUpdateMacroPosition = useCallback((macroId, x, y) => {
    setProject((prev) => ({
      ...prev,
      macros: prev.macros.map((m) => (m.id === macroId ? { ...m, x, y } : m)),
    }));
  }, []);

  // Update Macro properties (Inspector)
  const handleUpdateMacro = useCallback((macroId, patch) => {
    updateProject((prev) => ({
      ...prev,
      macros: prev.macros.map((m) => {
        if (m.id !== macroId) return m;
        let updated = { ...m, ...patch };
        if (patch.orientation && patch.orientation !== m.orientation) {
          updated = transformMacroOrientation(updated, patch.orientation);
        }
        return updated;
      }),
    }));
  }, [updateProject]);

  // Update Pin properties
  const handleUpdatePin = useCallback((pinId, patch) => {
    updateProject((prev) => ({
      ...prev,
      pins: prev.pins.map((p) => (p.id === pinId ? { ...p, ...patch } : p)),
    }));
  }, [updateProject]);

  // Delete element
  const handleDeleteSelected = useCallback((type, id) => {
    if (type === 'macro') {
      updateProject((prev) => ({
        ...prev,
        macros: prev.macros.filter((m) => m.id !== id),
      }));
      setSelectedId(null);
      setSelectedType(null);
    } else if (type === 'via') {
      updateProject((prev) => ({
        ...prev,
        powerNetwork: removeVia(prev.powerNetwork, id),
      }));
      setSelectedId(null);
      setSelectedType(null);
    }
  }, [updateProject]);

  // Add Via helper
  const handleAddVia = useCallback((via) => {
    updateProject((prev) => ({
      ...prev,
      powerNetwork: addVia(prev.powerNetwork, via),
    }));
  }, [updateProject]);

  // ─── LIVE EDA ANALYTICAL CALCULATIONS ──────────────────────────────────────
  const utilization = useMemo(() => {
    return computeUtilization(
      project.core.width * project.core.height,
      project.standardCellAreaUm2,
      project.macros,
      project.blockages
    );
  }, [project]);

  const hpwl = useMemo(() => {
    return computeHPWL(project.nets, project.macros, project.pins, project.core);
  }, [project]);

  const pdnAnalysis = useMemo(() => {
    const openNets = detectOpenConnections(project.powerNetwork);
    const shorts = detectVDDVSSShort(project.powerNetwork);
    const missingVias = detectMissingVias(project.powerNetwork);
    const irDrop = computeIRDropEstimate(project.powerNetwork, project.powerNetwork?.loads);
    return { openNets, shorts, missingVias, irDrop };
  }, [project]);

  const congestionMap = useMemo(() => {
    return computeCongestionMap(project, 8, 8);
  }, [project]);

  // ─── COMPILE ACTIVE VIOLATIONS LIST ───────────────────────────────────────
  const violations = useMemo(() => {
    const list = [];
    const macros = project.macros || [];

    // Macro-to-Macro overlaps & keepouts
    for (let i = 0; i < macros.length; i++) {
      for (let j = i + 1; j < macros.length; j++) {
        const m1 = macros[i];
        const m2 = macros[j];
        const overlapResult = checkMacroOverlap(m1, m2);

        if (overlapResult.overlaps) {
          list.push({
            rule: 'Macro Overlap (DRC)',
            severity: 'error',
            targetId: m1.id,
            targetType: 'macro',
            message: `Macro ${m1.name || m1.id} physically overlaps with ${m2.name || m2.id} (Area: ${overlapResult.overlapArea} µm²).`,
            suggestion: 'Move macros apart so they do not intersect.',
          });
        } else if (overlapResult.halosViolated) {
          list.push({
            rule: 'Placement Halo Keepout Violation',
            severity: 'warning',
            targetId: m1.id,
            targetType: 'macro',
            message: `Keepout halos between ${m1.id} and ${m2.id} overlap. Gap is ${Math.max(overlapResult.actualGapX, overlapResult.actualGapY)}µm, required: ${overlapResult.requiredSeparation}µm (haloA=${m1.halo} + haloB=${m2.halo}).`,
            suggestion: `Increase separation to at least ${overlapResult.requiredSeparation}µm for pin routing access.`,
          });
        }
      }

      // Core Containment
      const containment = checkMacroCoreContainment(macros[i], project.core);
      if (!containment.contained) {
        list.push({
          rule: 'Core Boundary DRC',
          severity: 'error',
          targetId: macros[i].id,
          targetType: 'macro',
          message: containment.violations[0] || `Macro ${macros[i].id} exceeds core boundary limits.`,
          suggestion: 'Position macro completely inside the core boundary.',
        });
      }
    }

    // Pin spacing
    ['top', 'bottom', 'left', 'right'].forEach((side) => {
      const pinCheck = checkPinSpacing(project.pins, side, project.constraints?.minPinSpacing || 10, project.core.width, project.core.height);
      if (!pinCheck.valid) {
        pinCheck.violations.forEach((v) => {
          list.push({
            rule: 'I/O Pin Pitch DRC',
            severity: 'error',
            targetId: v.pinA,
            targetType: 'pin',
            message: v.message,
            suggestion: `Increase spacing along the ${side} edge to at least ${v.requiredSpacing}µm.`,
          });
        });
      }
    });

    // PDN Open Nets
    if (pdnAnalysis.openNets.vddOpen) {
      list.push({
        rule: 'VDD Power Continuity',
        severity: 'error',
        targetId: 'ring_vdd',
        targetType: 'ring',
        message: 'VDD mesh has unreachable strap loads (floating power net segments).',
        suggestion: 'Ensure vias connect VDD straps to the VDD power ring.',
      });
    }
    if (pdnAnalysis.openNets.vssOpen) {
      list.push({
        rule: 'VSS Ground Continuity',
        severity: 'error',
        targetId: 'ring_vss',
        targetType: 'ring',
        message: 'VSS mesh has unreachable strap loads (floating ground net segments).',
        suggestion: 'Ensure vias connect VSS straps to the VSS ground ring.',
      });
    }

    // Missing Vias
    if (pdnAnalysis.missingVias.missingViaCount > 0) {
      pdnAnalysis.missingVias.details.forEach((d) => {
        list.push({
          rule: 'Missing Power Grid Via',
          severity: 'warning',
          targetId: d.strapId,
          targetType: 'strap',
          message: d.reason,
          suggestion: `Add an electrical via at intersection ${d.expectedViaLocation} between ${d.layers}.`,
          viaFix: {
            id: `via_${d.net.toLowerCase()}_${d.x}_${d.y}`,
            layer1: d.layer1 || 'M4',
            layer2: d.layer2 || 'M5',
            x: d.x,
            y: d.y,
            net: d.net,
          },
        });
      });
    }

    return list;
  }, [project, pdnAnalysis]);

  // Select Violation handler
  const handleSelectViolation = useCallback((v) => {
    if (v.targetId && v.targetType) {
      setSelectedId(v.targetId);
      setSelectedType(v.targetType);
    }
  }, []);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedType(null);
      } else if (selectedType === 'macro' && selectedId) {
        // Arrow key nudging
        const delta = snapToGrid ? gridSize : 1;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleUpdateMacro(selectedId, { x: (project.macros.find((m) => m.id === selectedId)?.x || 0) - delta });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleUpdateMacro(selectedId, { x: (project.macros.find((m) => m.id === selectedId)?.x || 0) + delta });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleUpdateMacro(selectedId, { y: (project.macros.find((m) => m.id === selectedId)?.y || 0) - delta });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleUpdateMacro(selectedId, { y: (project.macros.find((m) => m.id === selectedId)?.y || 0) + delta });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedType, selectedId, snapToGrid, gridSize, project, handleUndo, handleRedo, handleUpdateMacro]);

  const handleReturnToKingdom = () => {
    navigate(isExplore ? '/explore/kingdom/floorplanning' : '/kingdom/floorplanning');
  };

  return (
    <div className="fp-studio" data-testid="fp-studio">
      {/* 1. TOP TOOLBAR */}
      <StudioToolbar
        project={project}
        onNewProject={handleNewProject}
        onLoadPreset={handleLoadPreset}
        onSaveProject={handleSave}
        onExportJson={handleExport}
        onImportJson={handleImport}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(1))))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
        onFitView={() => setZoom(1)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        gridSize={gridSize}
        onChangeGridSize={setGridSize}
        showCongestion={showCongestion}
        onToggleCongestion={() => setShowCongestion(!showCongestion)}
        showPowerNetwork={showPowerNetwork}
        onTogglePowerNetwork={() => setShowPowerNetwork(!showPowerNetwork)}
        showBlockages={showBlockages}
        onToggleBlockages={() => setShowBlockages(!showBlockages)}
        isExploreMode={isExplore}
        onReturnToKingdom={handleReturnToKingdom}
      />

      {/* 2. BODY (3-COLUMN LAYOUT) */}
      <div className="fp-studio__body">
        {/* Left: Design Explorer & Violations */}
        <DesignExplorer
          project={project}
          selectedId={selectedId}
          selectedType={selectedType}
          onSelect={(type, id) => {
            setSelectedType(type);
            setSelectedId(id);
          }}
          violations={violations}
          onSelectViolation={handleSelectViolation}
          onAddVia={handleAddVia}
        />

        {/* Center: Interactive SVG Canvas */}
        <div className="fp-studio__canvas-area">
          <StudioCanvas
            project={project}
            selectedId={selectedId}
            selectedType={selectedType}
            onSelect={(type, id) => {
              setSelectedType(type);
              setSelectedId(id);
            }}
            onUpdateMacroPosition={handleUpdateMacroPosition}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            showPowerNetwork={showPowerNetwork}
            showCongestion={showCongestion}
            congestionMap={congestionMap}
            showBlockages={showBlockages}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </div>

        {/* Right: Properties Inspector & Diagnostics */}
        <PropertiesInspector
          project={project}
          selectedId={selectedId}
          selectedType={selectedType}
          onUpdateMacro={handleUpdateMacro}
          onUpdatePin={handleUpdatePin}
          onDeleteSelected={handleDeleteSelected}
          violations={violations}
          onSelectViolation={handleSelectViolation}
          onAddVia={handleAddVia}
        />
      </div>

      {/* 3. BOTTOM PANEL: LIVE METRICS & ANALYSIS */}
      <AnalysisPanel
        utilization={utilization}
        hpwl={hpwl}
        pdnAnalysis={pdnAnalysis}
        congestionMap={congestionMap}
      />
    </div>
  );
}
