/**
 * CTSPropertiesInspector.jsx
 * ==========================
 * Context-aware Properties Inspector for CTS Studio 1.0.
 * Allows viewing and editing parameters of selected Buffers, Sinks,
 * Branches, Root Pin, or Global Project Constraints.
 */

import React from 'react';
import { CLOCK_BUFFER_LIB } from '../../../engine/ctsEngine.js';

export default function CTSPropertiesInspector({
  project,
  solution,
  selectedEntity,
  onUpdateEntity,
  onDeleteEntity,
  onUpdateConstraints,
}) {
  if (!selectedEntity) {
    return (
      <aside className="cts-panel cts-panel--right" aria-label="Properties Inspector">
        <div className="cts-panel__header">
          <span>Global Settings</span>
        </div>
        <div className="cts-panel__body">
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.8rem' }}>
              Select a clock buffer, sink, branch, or root pin on the canvas to inspect its parameters.
            </div>

            <div className="cts-form-group">
              <label className="cts-form-label">Clock Period (ns)</label>
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="10.0"
                className="cts-form-input"
                value={project.constraints?.periodNs ?? 1.0}
                onChange={(e) => onUpdateConstraints({ periodNs: parseFloat(e.target.value) || 1.0 })}
              />
            </div>

            <div className="cts-form-group">
              <label className="cts-form-label">Target Max Skew Budget (ps)</label>
              <input
                type="number"
                step="5"
                min="5"
                max="500"
                className="cts-form-input"
                value={project.constraints?.maxSkewBudgetPs ?? 50}
                onChange={(e) => onUpdateConstraints({ maxSkewBudgetPs: parseInt(e.target.value, 10) || 50 })}
              />
            </div>

            <div className="cts-form-group">
              <label className="cts-form-label">Max Latency Budget (ps)</label>
              <input
                type="number"
                step="10"
                min="50"
                max="2000"
                className="cts-form-input"
                value={project.constraints?.maxLatencyBudgetPs ?? 400}
                onChange={(e) => onUpdateConstraints({ maxLatencyBudgetPs: parseInt(e.target.value, 10) || 400 })}
              />
            </div>

            <div className="cts-form-group">
              <label className="cts-form-label">Max Transition Slew (ps)</label>
              <input
                type="number"
                step="5"
                min="10"
                max="500"
                className="cts-form-input"
                value={project.constraints?.maxTransitionTimePs ?? 100}
                onChange={(e) => onUpdateConstraints({ maxTransitionTimePs: parseInt(e.target.value, 10) || 100 })}
              />
            </div>

            <div className="cts-form-group">
              <label className="cts-form-label">Supply Voltage Vdd (V)</label>
              <input
                type="number"
                step="0.05"
                min="0.6"
                max="1.8"
                className="cts-form-input"
                value={project.constraints?.supplyVoltageV ?? 1.1}
                onChange={(e) => onUpdateConstraints({ supplyVoltageV: parseFloat(e.target.value) || 1.1 })}
              />
            </div>

            <div className="cts-form-group">
              <label className="cts-form-label">Core Dimensions (µm)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="cts-form-input"
                  value={`W: ${project.core?.width || 500}`}
                  readOnly
                  style={{ background: '#111827', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  className="cts-form-input"
                  value={`H: ${project.core?.height || 500}`}
                  readOnly
                  style={{ background: '#111827', color: '#94a3b8' }}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 1. INSPECT CLOCK BUFFER
  if (selectedEntity.type === 'buffer') {
    const buf = project.buffers.find((b) => b.id === selectedEntity.id);
    if (!buf) return null;

    const cellLib = CLOCK_BUFFER_LIB[buf.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X2;
    const fanoutCount = (project.branches.filter((br) => br.from === buf.id) || []).length;

    return (
      <aside className="cts-panel cts-panel--right" aria-label="Buffer Inspector">
        <div className="cts-panel__header">
          <span>Buffer: {buf.id}</span>
          <button
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => onDeleteEntity({ type: 'buffer', id: buf.id })}
            title="Delete this buffer"
          >
            Delete ✕
          </button>
        </div>
        <div className="cts-panel__body">
          <div className="cts-form-group">
            <label className="cts-form-label">Standard Cell Type (Drive Strength)</label>
            <select
              className="cts-form-select"
              value={buf.cellType || 'CLKBUF_X2'}
              onChange={(e) => onUpdateEntity('buffer', buf.id, { cellType: e.target.value })}
            >
              {Object.keys(CLOCK_BUFFER_LIB).map((cellKey) => (
                <option key={cellKey} value={cellKey}>
                  {cellKey} ({CLOCK_BUFFER_LIB[cellKey].name})
                </option>
              ))}
            </select>
          </div>

          <div className="cts-form-group">
            <label className="cts-form-label">Position Coordinates (µm)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                step="10"
                className="cts-form-input"
                value={buf.x}
                onChange={(e) => onUpdateEntity('buffer', buf.id, { x: parseInt(e.target.value, 10) || 0 })}
                placeholder="X"
              />
              <input
                type="number"
                step="10"
                className="cts-form-input"
                value={buf.y}
                onChange={(e) => onUpdateEntity('buffer', buf.id, { y: parseInt(e.target.value, 10) || 0 })}
                placeholder="Y"
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Electrical Specifications
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.72rem' }}>
              <div style={{ color: '#94a3b8' }}>Intrinsic Delay:</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>{cellLib.intrinsicDelayNs * 1000} ps</div>

              <div style={{ color: '#94a3b8' }}>Output Resistance:</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>{cellLib.outputResistance} Ω</div>

              <div style={{ color: '#94a3b8' }}>Input Capacitance:</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>{(cellLib.inputCap * 1000).toFixed(1)} fF</div>

              <div style={{ color: '#94a3b8' }}>Max Fanout:</div>
              <div style={{ color: fanoutCount > cellLib.maxFanout ? '#f87171' : '#f8fafc', fontWeight: 700 }}>
                {fanoutCount} / {cellLib.maxFanout}
              </div>

              <div style={{ color: '#94a3b8' }}>Cell Area:</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>{cellLib.areaUm2} µm²</div>

              <div style={{ color: '#94a3b8' }}>Leakage:</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>{cellLib.leakageUw} µW</div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 2. INSPECT CLOCK SINK
  if (selectedEntity.type === 'sink') {
    const sink = project.sinks.find((s) => s.id === selectedEntity.id);
    if (!sink) return null;

    const solSink = solution?.sinks?.find((s) => s.id === sink.id);

    return (
      <aside className="cts-panel cts-panel--right" aria-label="Sink Inspector">
        <div className="cts-panel__header">
          <span>Sink: {sink.id}</span>
          <button
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => onDeleteEntity({ type: 'sink', id: sink.id })}
            title="Delete this sink"
          >
            Delete ✕
          </button>
        </div>
        <div className="cts-panel__body">
          <div className="cts-form-group">
            <label className="cts-form-label">Position Coordinates (µm)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                step="10"
                className="cts-form-input"
                value={sink.x}
                onChange={(e) => onUpdateEntity('sink', sink.id, { x: parseInt(e.target.value, 10) || 0 })}
                placeholder="X"
              />
              <input
                type="number"
                step="10"
                className="cts-form-input"
                value={sink.y}
                onChange={(e) => onUpdateEntity('sink', sink.id, { y: parseInt(e.target.value, 10) || 0 })}
                placeholder="Y"
              />
            </div>
          </div>

          <div className="cts-form-group">
            <label className="cts-form-label">Input Capacitance (fF)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="50"
              className="cts-form-input"
              value={((sink.loadCapPf ?? 0.004) * 1000).toFixed(1)}
              onChange={(e) => {
                const valFf = parseFloat(e.target.value) || 4;
                onUpdateEntity('sink', sink.id, { loadCapPf: valFf / 1000 });
              }}
            />
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Timing Status
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.72rem' }}>
              <div style={{ color: '#94a3b8' }}>Arrival Delay:</div>
              <div style={{ color: solSink?.isReached ? '#38bdf8' : '#f87171', fontWeight: 700 }}>
                {solSink?.isReached ? `${solSink.arrivalPs} ps` : 'UNREACHED'}
              </div>

              <div style={{ color: '#94a3b8' }}>Transition Time:</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>
                {solSink?.transitionPs ? `${solSink.transitionPs} ps` : '--'}
              </div>

              <div style={{ color: '#94a3b8' }}>Connected Driver:</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>
                {project.branches.find((b) => b.to === sink.id)?.from || 'None'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 3. INSPECT ROOT PIN
  if (selectedEntity.type === 'root') {
    return (
      <aside className="cts-panel cts-panel--right" aria-label="Root Inspector">
        <div className="cts-panel__header">
          <span>Clock Root: {project.root.id}</span>
        </div>
        <div className="cts-panel__body">
          <div className="cts-form-group">
            <label className="cts-form-label">Position Coordinates (µm)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                step="10"
                className="cts-form-input"
                value={project.root.x}
                onChange={(e) => onUpdateEntity('root', project.root.id, { x: parseInt(e.target.value, 10) || 0 })}
                placeholder="X"
              />
              <input
                type="number"
                step="10"
                className="cts-form-input"
                value={project.root.y}
                onChange={(e) => onUpdateEntity('root', project.root.id, { y: parseInt(e.target.value, 10) || 0 })}
                placeholder="Y"
              />
            </div>
          </div>

          <div className="cts-form-group">
            <label className="cts-form-label">Root Driver Strength</label>
            <select
              className="cts-form-select"
              value={project.root.cellType || 'CLKBUF_X8'}
              onChange={(e) => onUpdateEntity('root', project.root.id, { cellType: e.target.value })}
            >
              {Object.keys(CLOCK_BUFFER_LIB).map((cellKey) => (
                <option key={cellKey} value={cellKey}>{cellKey}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    );
  }

  // 4. INSPECT BRANCH
  if (selectedEntity.type === 'branch') {
    const br = project.branches.find((b) => b.from === selectedEntity.from && b.to === selectedEntity.to);
    if (!br) return null;

    return (
      <aside className="cts-panel cts-panel--right" aria-label="Branch Inspector">
        <div className="cts-panel__header">
          <span>Branch: {br.from} → {br.to}</span>
          <button
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => onDeleteEntity({ type: 'branch', from: br.from, to: br.to })}
            title="Disconnect branch"
          >
            Disconnect ✕
          </button>
        </div>
        <div className="cts-panel__body">
          <div className="cts-form-group">
            <label className="cts-form-label">Source Driver</label>
            <input type="text" className="cts-form-input" value={br.from} readOnly style={{ background: '#111827' }} />
          </div>

          <div className="cts-form-group">
            <label className="cts-form-label">Destination Node</label>
            <input type="text" className="cts-form-input" value={br.to} readOnly style={{ background: '#111827' }} />
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
