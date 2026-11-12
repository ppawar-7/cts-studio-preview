/**
 * CTSExplorer.jsx
 * ================
 * Design Hierarchy Explorer for CTS Studio 1.0.
 * Displays Tree Root, Buffers, Sinks, Branches, Blockages, and Data Paths.
 */

import React, { useState } from 'react';

export default function CTSExplorer({
  project,
  selectedEntity,
  onSelectEntity,
  onAddBuffer,
  onAddSink,
  onAddBranch,
  onDeleteEntity,
}) {
  const [addingBranch, setAddingBranch] = useState(false);
  const [branchFrom, setBranchFrom] = useState('');
  const [branchTo, setBranchTo] = useState('');

  const handleCreateBranch = (e) => {
    e.preventDefault();
    if (!branchFrom || !branchTo) return;
    if (branchFrom === branchTo) {
      alert('Cannot create branch from a node to itself.');
      return;
    }
    onAddBranch(branchFrom, branchTo);
    setBranchFrom('');
    setBranchTo('');
    setAddingBranch(false);
  };

  const allPossibleDrivers = [
    project.root,
    ...project.buffers,
  ];

  const allPossibleReceivers = [
    ...project.buffers,
    ...project.sinks,
  ];

  return (
    <aside className="cts-panel cts-panel--left" aria-label="CTS Design Hierarchy">
      <div className="cts-panel__header">
        <span>Hierarchy Explorer</span>
      </div>

      <div className="cts-panel__body">
        {/* 1. CLOCK ROOT */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
            Clock Entry Pin
          </div>
          <div
            className={`cts-tree-item ${selectedEntity?.type === 'root' ? 'cts-tree-item--selected' : ''}`}
            onClick={() => onSelectEntity({ type: 'root', id: project.root.id })}
          >
            <span>📍 {project.root.id} ({project.root.cellType || 'CLKBUF_X8'})</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({project.root.x}, {project.root.y})</span>
          </div>
        </div>

        {/* 2. CLOCK BUFFERS / REPEATERS */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>
              Repeaters / Buffers ({project.buffers.length})
            </span>
            <button
              className="cts-btn"
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
              onClick={onAddBuffer}
              title="Add a new clock buffer to the canvas"
            >
              + Buffer
            </button>
          </div>
          {project.buffers.length === 0 ? (
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', padding: '0.2rem 0.5rem' }}>
              No buffers inserted (Direct driving)
            </div>
          ) : (
            project.buffers.map((buf) => (
              <div
                key={buf.id}
                className={`cts-tree-item ${selectedEntity?.type === 'buffer' && selectedEntity.id === buf.id ? 'cts-tree-item--selected' : ''}`}
                onClick={() => onSelectEntity({ type: 'buffer', id: buf.id })}
              >
                <span>🔺 {buf.id} <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>({buf.cellType || 'CLKBUF_X2'})</span></span>
                <button
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntity({ type: 'buffer', id: buf.id });
                  }}
                  title="Delete buffer"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* 3. CLOCK SINKS / REGISTERS */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
              Clock Sinks ({project.sinks.length})
            </span>
            <button
              className="cts-btn"
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
              onClick={onAddSink}
              title="Add a new clock sink register"
            >
              + Sink
            </button>
          </div>
          {project.sinks.map((s) => (
            <div
              key={s.id}
              className={`cts-tree-item ${selectedEntity?.type === 'sink' && selectedEntity.id === s.id ? 'cts-tree-item--selected' : ''}`}
              onClick={() => onSelectEntity({ type: 'sink', id: s.id })}
            >
              <span>⏹️ {s.id}</span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                {s.loadCapPf ? `${(s.loadCapPf * 1000).toFixed(0)}fF` : '4fF'}
              </span>
            </div>
          ))}
        </div>

        {/* 4. TREE BRANCHES */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
              Branches ({project.branches.length})
            </span>
            <button
              className="cts-btn"
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
              onClick={() => setAddingBranch(!addingBranch)}
              title="Connect a branch"
            >
              {addingBranch ? 'Cancel' : '+ Connect'}
            </button>
          </div>

          {addingBranch && (
            <form onSubmit={handleCreateBranch} style={{ background: '#162033', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>From (Driver):</span>
                <select
                  className="cts-form-select"
                  value={branchFrom}
                  onChange={(e) => setBranchFrom(e.target.value)}
                  required
                >
                  <option value="">Select source...</option>
                  {allPossibleDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.id}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>To (Receiver):</span>
                <select
                  className="cts-form-select"
                  value={branchTo}
                  onChange={(e) => setBranchTo(e.target.value)}
                  required
                >
                  <option value="">Select target...</option>
                  {allPossibleReceivers.map((r) => (
                    <option key={r.id} value={r.id}>{r.id}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="cts-btn cts-btn--primary" style={{ width: '100%', padding: '0.25rem' }}>
                Create Branch
              </button>
            </form>
          )}

          {project.branches.map((br, idx) => (
            <div
              key={br.id || `${br.from}-${br.to}-${idx}`}
              className={`cts-tree-item ${selectedEntity?.type === 'branch' && selectedEntity.from === br.from && selectedEntity.to === br.to ? 'cts-tree-item--selected' : ''}`}
              onClick={() => onSelectEntity({ type: 'branch', from: br.from, to: br.to, id: br.id })}
            >
              <span style={{ fontSize: '0.72rem' }}>↳ {br.from} → {br.to}</span>
              <button
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEntity({ type: 'branch', from: br.from, to: br.to });
                }}
                title="Disconnect branch"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 5. BLOCKAGES & DATA PATHS */}
        {project.blockages && project.blockages.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
              Macro Obstructions ({project.blockages.length})
            </div>
            {project.blockages.map((blk) => (
              <div
                key={blk.id}
                className="cts-tree-item"
                style={{ cursor: 'default' }}
              >
                <span>🚫 {blk.label || blk.id}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{blk.width}×{blk.height}µm</span>
              </div>
            ))}
          </div>
        )}

        {project.dataPaths && project.dataPaths.length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
              Data Paths ({project.dataPaths.length})
            </div>
            {project.dataPaths.map((dp) => (
              <div
                key={dp.id}
                className="cts-tree-item"
                style={{ cursor: 'default' }}
              >
                <span>⏱️ {dp.fromSinkId} ➔ {dp.toSinkId}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
