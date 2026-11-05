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

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
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

import { transformMacroOrientation } from '../../engine/floorplanGeometry.js';
import { addVia, removeVia } from '../../engine/floorplanPDN.js';
import { evaluateFloorplanSignoff } from '../../engine/floorplanSignoff.js';

import './FloorplanStudioPage.css';

export const STORAGE_KEY = 'pdplayground_floorplan_v1';
// Explore mode keeps its own, session-scoped copy so practice never touches the Normal Game project.
export const EXPLORE_STORAGE_KEY = 'pdplayground_floorplan_explore_v1';

function readStoredProject(isExplore) {
  try {
    const saved = isExplore
      ? window.sessionStorage.getItem(EXPLORE_STORAGE_KEY)
      : window.localStorage.getItem(STORAGE_KEY);
    return saved ? deserializeProject(saved) : null;
  } catch (e) {
    console.warn('Failed to load saved floorplan project, using default:', e);
    return null;
  }
}

export default function FloorplanStudioPage({ isExploreMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isExplore = Boolean(isExploreMode || location.pathname.startsWith('/explore'));

  // Initialize project state from localStorage or default
  const [project, setProject] = useState(() => readStoredProject(isExplore) || createDefaultProject('My ASIC Floorplan', 'beginner'));

  const projectRef = useRef(project);
  projectRef.current = project;

  // Size the studio to the space below the app navbar so the analysis panel is never clipped.
  const studioRef = useRef(null);
  useLayoutEffect(() => {
    const fit = () => {
      const el = studioRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      el.style.setProperty('--fp-studio-top', `${Math.max(0, Math.round(top))}px`);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // History stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Selection
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // View & Tool options
  const [zoom, setZoom] = useState(1);
  const [fitToken, setFitToken] = useState(0);
  const requestFit = useCallback(() => {
    setZoom(1);
    setFitToken((t) => t + 1);
  }, []);
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

  // Save: Normal Game → localStorage; Explore → this browser session only.
  const handleSave = useCallback(() => {
    try {
      if (isExplore) {
        window.sessionStorage.setItem(EXPLORE_STORAGE_KEY, serializeProject(project));
        alert('Saved to this Explore session only. Your Normal Game floorplan is unchanged.');
      } else {
        window.localStorage.setItem(STORAGE_KEY, serializeProject(project));
        alert('Floorplan project saved.');
      }
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
      requestFit();
      alert('Floorplan loaded successfully!');
    } catch (e) {
      alert('Import failed: ' + e.message);
    }
  }, [updateProject, requestFit]);

  // New Blank Project
  const handleNewProject = useCallback(() => {
    if (window.confirm('Create a new blank floorplan project? Any unsaved edits will be lost.')) {
      updateProject(createDefaultProject('New Design', 'beginner'));
      setSelectedId(null);
      setSelectedType(null);
      requestFit();
    }
  }, [updateProject, requestFit]);

  // Load Preset
  const handleLoadPreset = useCallback((presetKey) => {
    let preset = null;
    if (presetKey === 'small-controller') preset = EXAMPLE_SMALL_CONTROLLER;
    else if (presetKey === 'dual-sram') preset = EXAMPLE_DUAL_SRAM_CONTROLLER;
    else if (presetKey === 'small-soc') preset = EXAMPLE_SMALL_SOC_SUBSYSTEM;

    if (preset) {
      updateProject(migrateProject(JSON.parse(JSON.stringify(preset))));
      setSelectedId(null);
      setSelectedType(null);
      requestFit();
    }
  }, [updateProject, requestFit]);

  // Update Macro Position (during drag)
  const handleUpdateMacroPosition = useCallback((macroId, x, y) => {
    setProject((prev) => ({
      ...prev,
      macros: prev.macros.map((m) => (m.id === macroId ? { ...m, x, y } : m)),
    }));
  }, []);

  // Commit a finished canvas drag as ONE undo step (snapshot = project before the drag).
  const handleCommitMacroDrag = useCallback((macroId, from) => {
    const current = projectRef.current;
    const before = {
      ...current,
      macros: current.macros.map((m) => (m.id === macroId ? { ...m, x: from.x, y: from.y } : m)),
    };
    setHistory((h) => [...h.slice(-25), JSON.parse(JSON.stringify(before))]);
    setRedoStack([]);
  }, []);

  // Update Macro properties (Inspector)
  const handleUpdateMacro = useCallback((macroId, patch) => {
    updateProject((prev) => ({
      ...prev,
      macros: prev.macros.map((m) => {
        if (m.id !== macroId) return m;
        // Transform from the macro's CURRENT orientation, then apply the remaining fields.
        const base = patch.orientation && patch.orientation !== (m.orientation || 'R0')
          ? transformMacroOrientation(m, patch.orientation)
          : m;
        const { orientation, ...rest } = patch;
        return { ...base, ...rest, orientation: orientation || base.orientation };
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

  // ─── LIVE EDA ANALYSIS (single shared rule deck, also used by FP-24) ─────
  const signoff = useMemo(() => evaluateFloorplanSignoff(project), [project]);
  const utilization = signoff.analysis.utilization;
  const hpwl = signoff.analysis.hpwl;
  const pdnAnalysis = signoff.analysis.pdn;
  const congestionMap = signoff.analysis.congestion;
  const violations = signoff.violations;

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
    <div className="fp-studio" data-testid="fp-studio" ref={studioRef}>
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
        onZoomIn={() => setZoom((z) => Math.min(6, Number((z * 1.2).toFixed(3))))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, Number((z / 1.2).toFixed(3))))}
        onFitView={requestFit}
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
            onCommitMacroDrag={handleCommitMacroDrag}
            fitToken={fitToken}
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
        maxUtilization={project.constraints?.maxUtilization}
        hpwl={hpwl}
        pdnAnalysis={pdnAnalysis}
        congestionMap={congestionMap}
      />
    </div>
  );
}
