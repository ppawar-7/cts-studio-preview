/**
 * CTSStudioPage.jsx
 * ==================
 * Dedicated Interactive Engineering CAD Studio for Clock Tree Synthesis (CTS 1.0).
 * Accessible at `/studio/cts`, `/cts-studio`, `/kingdom/cts/studio`, and `/explore/studio/cts`.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import CTSToolbar from './components/CTSToolbar.jsx';
import CTSExplorer from './components/CTSExplorer.jsx';
import CTSCanvas from './components/CTSCanvas.jsx';
import CTSPropertiesInspector from './components/CTSPropertiesInspector.jsx';
import CTSAnalysisPanel from './components/CTSAnalysisPanel.jsx';
import CTSCandidateCompareModal from './components/CTSCandidateCompareModal.jsx';

import {
  solveClockTreeElmore,
  autoBalanceClockTree,
} from '../../engine/ctsEngine.js';

import {
  createCTSProject,
  saveCTSProjectToStorage,
  loadCTSProjectFromStorage,
  exportCTSProjectToJSON,
  importCTSProjectFromJSON,
  exportCTSReport,
  initHistoryState,
  pushHistorySnapshot,
  undoProject,
  redoProject,
} from '../../engine/ctsProjectModel.js';

import { CTS_SCENARIOS } from '../../engine/ctsScenarios.js';

import './CTSStudioPage.css';

export default function CTSStudioPage({ isExploreMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const assignmentParam = queryParams.get('assignment');
  const isExplore = Boolean(isExploreMode || location.pathname.startsWith('/explore'));

  // Initialize project from storage, URL scenario, or default balanced 4-sink H-tree
  const [project, setProject] = useState(() => {
    if (assignmentParam && CTS_SCENARIOS[assignmentParam]) {
      return createCTSProject({ scenarioId: assignmentParam });
    }
    const saved = loadCTSProjectFromStorage('active', isExplore);
    if (saved) return saved;
    return createCTSProject({ scenarioId: 'scenario-balanced-4' });
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState(() => initHistoryState(project));

  // Selection & UI modals
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-solve clock tree with Elmore model on every project change
  const solution = useMemo(() => {
    return solveClockTreeElmore(project);
  }, [project]);

  // Toast notification helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Update project state with history tracking
  const updateProjectWithHistory = useCallback((newProject) => {
    setProject(newProject);
    setHistory((prev) => pushHistorySnapshot(prev, newProject));
  }, []);

  // Preset switching
  const handleSelectScenario = (scenarioKey) => {
    if (scenarioKey === 'custom') {
      const fresh = createCTSProject({
        name: 'Custom Clock Tree Design',
        sinks: [
          { id: 'SINK_1', x: 120, y: 150, loadCapPf: 0.005 },
          { id: 'SINK_2', x: 380, y: 150, loadCapPf: 0.005 },
          { id: 'SINK_3', x: 120, y: 380, loadCapPf: 0.005 },
          { id: 'SINK_4', x: 380, y: 380, loadCapPf: 0.005 },
        ],
        branches: [
          { from: 'CLK_ROOT', to: 'SINK_1' },
          { from: 'CLK_ROOT', to: 'SINK_2' },
          { from: 'CLK_ROOT', to: 'SINK_3' },
          { from: 'CLK_ROOT', to: 'SINK_4' },
        ],
      });
      updateProjectWithHistory(fresh);
      showToast('Initialized new custom clock design.');
      return;
    }

    if (CTS_SCENARIOS[scenarioKey]) {
      const loaded = createCTSProject({ scenarioId: scenarioKey });
      updateProjectWithHistory(loaded);
      showToast(`Loaded benchmark preset: ${loaded.name}`);
    }
  };

  // Blank canvas
  const handleNewDesign = () => {
    if (window.confirm('Clear canvas and create a new clock tree?')) {
      handleSelectScenario('custom');
    }
  };

  // Save project
  const handleSave = () => {
    saveCTSProjectToStorage(project, 'active', isExplore);
    showToast('Saved clock tree project to browser storage.');
  };

  // Node Drag End (records undoable snapshot after drag finishes)
  const handleNodeDragEnd = useCallback(() => {
    setHistory((prev) => pushHistorySnapshot(prev, project));
  }, [project]);

  // Auto-Balance clock tree
  const handleAutoBalance = () => {
    const res = autoBalanceClockTree(project);
    const balanced = res?.updatedProject || res;
    if (!balanced) {
      showToast('Auto-balancing could not resolve graph. Check for cycles or disconnected sinks.');
      return;
    }
    updateProjectWithHistory(balanced);
    showToast('Applied automatic delay balancing and repeater resizing!');
  };

  // Undo / Redo
  const handleUndo = () => {
    if (history.past.length === 0) return;
    const newHistory = undoProject(history);
    setHistory(newHistory);
    setProject(newHistory.present);
    showToast('Undo performed.');
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    const newHistory = redoProject(history);
    setHistory(newHistory);
    setProject(newHistory.present);
    showToast('Redo performed.');
  };

  // Export signoff report
  const handleExportReport = () => {
    const text = exportCTSReport(project, solution);
    setReportText(text);
    setShowReportModal(true);
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = exportCTSProjectToJSON(project);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.id || 'cts_project'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported project JSON.');
  };

  // Import JSON
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = importCTSProjectFromJSON(evt.target.result);
      if (res.success) {
        updateProjectWithHistory(res.project);
        showToast('Successfully imported CTS project!');
      } else {
        alert(`Failed to import JSON: ${res.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // Move node (Drag on canvas)
  const handleMoveNode = (type, id, newX, newY) => {
    let updated;
    if (type === 'root') {
      updated = { ...project, root: { ...project.root, x: newX, y: newY } };
    } else if (type === 'buffer') {
      updated = {
        ...project,
        buffers: project.buffers.map((b) => (b.id === id ? { ...b, x: newX, y: newY } : b)),
      };
    } else if (type === 'sink') {
      updated = {
        ...project,
        sinks: project.sinks.map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s)),
      };
    }
    if (updated) {
      setProject(updated);
    }
  };

  // Add Buffer
  const handleAddBuffer = () => {
    const newId = `BUF_${project.buffers.length + 1}`;
    const newBuf = {
      id: newId,
      x: Math.round((project.core?.width || 500) / 2),
      y: Math.round((project.core?.height || 500) / 2),
      cellType: 'CLKBUF_X2',
    };
    const updated = {
      ...project,
      buffers: [...project.buffers, newBuf],
    };
    updateProjectWithHistory(updated);
    setSelectedEntity({ type: 'buffer', id: newId });
    showToast(`Added buffer ${newId}`);
  };

  // Add Sink
  const handleAddSink = () => {
    const newId = `SINK_${project.sinks.length + 1}`;
    const newSink = {
      id: newId,
      x: Math.round((project.core?.width || 500) / 2) + 40,
      y: Math.round((project.core?.height || 500) / 2) + 40,
      loadCapPf: 0.005,
    };
    const updated = {
      ...project,
      sinks: [...project.sinks, newSink],
    };
    updateProjectWithHistory(updated);
    setSelectedEntity({ type: 'sink', id: newId });
    showToast(`Added sink ${newId}`);
  };

  // Add Branch
  const handleAddBranch = (from, to) => {
    const exists = project.branches.some((b) => b.from === from && b.to === to);
    if (exists) {
      showToast('Branch already exists between these nodes.');
      return;
    }
    const updated = {
      ...project,
      branches: [...project.branches, { from, to }],
    };
    updateProjectWithHistory(updated);
    showToast(`Connected branch ${from} ➔ ${to}`);
  };

  // Delete entity (Buffer, Sink, Branch)
  const handleDeleteEntity = (entity) => {
    let updated;
    if (entity.type === 'buffer') {
      updated = {
        ...project,
        buffers: project.buffers.filter((b) => b.id !== entity.id),
        branches: project.branches.filter((br) => br.from !== entity.id && br.to !== entity.id),
      };
    } else if (entity.type === 'sink') {
      updated = {
        ...project,
        sinks: project.sinks.filter((s) => s.id !== entity.id),
        branches: project.branches.filter((br) => br.to !== entity.id),
      };
    } else if (entity.type === 'branch') {
      updated = {
        ...project,
        branches: project.branches.filter((br) => !(br.from === entity.from && br.to === entity.to)),
      };
    }

    if (updated) {
      updateProjectWithHistory(updated);
      setSelectedEntity(null);
      showToast('Deleted entity.');
    }
  };

  // Update entity properties
  const handleUpdateEntity = (type, id, updates) => {
    let updated;
    if (type === 'buffer') {
      updated = {
        ...project,
        buffers: project.buffers.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      };
    } else if (type === 'sink') {
      updated = {
        ...project,
        sinks: project.sinks.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      };
    } else if (type === 'root') {
      updated = {
        ...project,
        root: { ...project.root, ...updates },
      };
    }
    if (updated) {
      updateProjectWithHistory(updated);
    }
  };

  // Update constraints
  const handleUpdateConstraints = (newConstraints) => {
    const updated = {
      ...project,
      constraints: {
        ...project.constraints,
        ...newConstraints,
      },
    };
    updateProjectWithHistory(updated);
  };

  return (
    <div className="cts-studio">
      {/* Top Engineering Toolbar */}
      <CTSToolbar
        project={project}
        onSelectScenario={handleSelectScenario}
        onNewDesign={handleNewDesign}
        onSave={handleSave}
        onAutoBalance={handleAutoBalance}
        onOpenCompare={() => setShowCompareModal(true)}
        onExportReport={handleExportReport}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isExploreMode={isExploreMode}
      />

      {/* Main CAD Center Workspace */}
      <div className="cts-workspace">
        {/* Left Hierarchy Explorer */}
        <CTSExplorer
          project={project}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
          onAddBuffer={handleAddBuffer}
          onAddSink={handleAddSink}
          onAddBranch={handleAddBranch}
          onDeleteEntity={handleDeleteEntity}
        />

        {/* Center Multi-Layer SVG Canvas */}
        <CTSCanvas
          project={project}
          solution={solution}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
          onMoveNode={handleMoveNode}
          onNodeDragEnd={handleNodeDragEnd}
        />

        {/* Right Properties Inspector */}
        <CTSPropertiesInspector
          project={project}
          solution={solution}
          selectedEntity={selectedEntity}
          onUpdateEntity={handleUpdateEntity}
          onDeleteEntity={handleDeleteEntity}
          onUpdateConstraints={handleUpdateConstraints}
        />
      </div>

      {/* Bottom Analytics Dock */}
      <CTSAnalysisPanel project={project} solution={solution} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '245px',
            right: '20px',
            background: '#0284c7',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            fontSize: '0.8rem',
            fontWeight: 600,
            zIndex: 1000,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Candidate Compare Modal */}
      {showCompareModal && (
        <CTSCandidateCompareModal
          currentProject={project}
          currentSolution={solution}
          onClose={() => setShowCompareModal(false)}
          onApplyCandidate={(cand) => updateProjectWithHistory(cand)}
        />
      )}

      {/* Export Signoff Report Modal */}
      {showReportModal && (
        <div className="cts-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
          <div className="cts-modal" style={{ maxWidth: '800px', height: '80vh' }}>
            <div className="cts-modal__header">
              <span id="report-modal-title">📄 Clock Tree Synthesis Signoff Report</span>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="cts-modal__body" style={{ flex: 1 }}>
              <pre
                style={{
                  background: '#090d16',
                  color: '#93c5fd',
                  padding: '1rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontFamily: 'Consolas, monospace',
                  overflowY: 'auto',
                  height: '100%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {reportText}
              </pre>
            </div>
            <div className="cts-modal__footer">
              <button
                className="cts-btn cts-btn--primary"
                onClick={() => {
                  navigator.clipboard?.writeText(reportText);
                  showToast('Report copied to clipboard!');
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button className="cts-btn cts-btn--outline" onClick={() => setShowReportModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
