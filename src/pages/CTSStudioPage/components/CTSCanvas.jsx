/**
 * CTSCanvas.jsx
 * ==============
 * Interactive EDA Multi-layer Clock Canvas for CTS Studio 1.0.
 * Features:
 * - Zoom & Pan navigation
 * - Core boundaries and macro obstructions
 * - Manhattan branch routing with length indicators
 * - Interactive node dragging (root, buffers, sinks) with 10µm grid snap
 * - Real-time arrival latency badges with skew coloring
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CLOCK_BUFFER_LIB } from '../../../engine/ctsEngine.js';

export default function CTSCanvas({
  project,
  solution,
  selectedEntity,
  onSelectEntity,
  onMoveNode,
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Dragging state for nodes
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const coreWidth = project.core?.width || 500;
  const coreHeight = project.core?.height || 500;

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.25, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.4));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 40, y: 30 });
  };
  const handleFitScreen = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 80) / coreWidth;
    const scaleY = (clientHeight - 80) / coreHeight;
    const fitScale = Math.min(scaleX, scaleY, 1.5);
    setZoom(fitScale);
    setPan({
      x: (clientWidth - coreWidth * fitScale) / 2,
      y: (clientHeight - coreHeight * fitScale) / 2,
    });
  };

  // Pan interaction
  const handleMouseDown = (e) => {
    if (e.target.closest('.cts-node') || e.target.closest('.cts-canvas-controls') || e.target.closest('.cts-canvas-legend')) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    if (draggingNode) {
      const rect = containerRef.current.getBoundingClientRect();
      let rawX = (e.clientX - rect.left - pan.x) / zoom;
      let rawY = (e.clientY - rect.top - pan.y) / zoom;

      if (snapToGrid) {
        rawX = Math.round(rawX / 10) * 10;
        rawY = Math.round(rawY / 10) * 10;
      }

      // Constrain within core
      const clampedX = Math.max(0, Math.min(coreWidth, rawX));
      const clampedY = Math.max(0, Math.min(coreHeight, rawY));

      onMoveNode(draggingNode.type, draggingNode.id, clampedX, clampedY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e, type, id, currentX, currentY) => {
    e.stopPropagation();
    onSelectEntity({ type, id });
    setDraggingNode({ type, id });
  };

  // Quick lookup maps
  const nodePositionMap = new Map();
  nodePositionMap.set(project.root.id, { x: project.root.x, y: project.root.y, type: 'root' });
  project.buffers.forEach((b) => nodePositionMap.set(b.id, { x: b.x, y: b.y, type: 'buffer' }));
  project.sinks.forEach((s) => nodePositionMap.set(s.id, { x: s.x, y: s.y, type: 'sink' }));

  const sinkSolutionMap = new Map();
  if (solution?.sinks) {
    solution.sinks.forEach((s) => sinkSolutionMap.set(s.id, s));
  }

  // Determine badge colors based on arrival times
  const minArr = solution?.minArrivalPs ?? 0;
  const maxArr = solution?.maxArrivalPs ?? 0;
  const skew = solution?.skewPs ?? 0;
  const skewTarget = project.constraints?.maxSkewBudgetPs || 50;

  return (
    <div
      className="cts-canvas-area"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        setZoom((z) => Math.min(Math.max(z * delta, 0.3), 4.0));
      }}
    >
      {/* SVG Canvas Viewport */}
      <svg
        className="cts-canvas-viewport"
        width="100%"
        height="100%"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="cts-grid-50" width={50 * zoom} height={50 * zoom} patternUnits="userSpaceOnUse">
            <path d={`M ${50 * zoom} 0 L 0 0 0 ${50 * zoom}`} fill="none" stroke="#162033" strokeWidth="1" />
          </pattern>
          {/* Diagonal Hatch for Macro Blockages */}
          <pattern id="blockage-hatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#ef4444" strokeWidth="2.5" opacity="0.3" />
          </pattern>
          {/* Arrow marker for branches */}
          <marker
            id="branch-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" opacity="0.8" />
          </marker>
        </defs>

        {/* Pan and Zoom Layer */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background Grid inside Core */}
          <rect
            x={0}
            y={0}
            width={coreWidth}
            height={coreHeight}
            fill="#090e1c"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Grid lines */}
          <rect
            x={0}
            y={0}
            width={coreWidth}
            height={coreHeight}
            fill="url(#cts-grid-50)"
          />

          {/* Macro Blockages */}
          {(project.blockages || []).map((blk) => (
            <g key={blk.id}>
              <rect
                x={blk.x}
                y={blk.y}
                width={blk.width}
                height={blk.height}
                fill="url(#blockage-hatch)"
                stroke="#dc2626"
                strokeWidth="1.5"
                rx="4"
              />
              <rect
                x={blk.x}
                y={blk.y}
                width={blk.width}
                height={blk.height}
                fill="rgba(239, 68, 68, 0.05)"
              />
              <text
                x={blk.x + blk.width / 2}
                y={blk.y + blk.height / 2}
                fill="#fca5a5"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                pointerEvents="none"
              >
                {blk.label || blk.id}
              </text>
            </g>
          ))}

          {/* Tree Branches (Manhattan Routed) */}
          {project.branches.map((br, idx) => {
            const p1 = nodePositionMap.get(br.from);
            const p2 = nodePositionMap.get(br.to);
            if (!p1 || !p2) return null;

            const isSelected = selectedEntity?.type === 'branch' && selectedEntity.from === br.from && selectedEntity.to === br.to;
            // Manhattan path: Horizontal then Vertical
            const midX = p2.x;
            const midY = p1.y;
            const pathD = `M ${p1.x} ${p1.y} L ${midX} ${midY} L ${p2.x} ${p2.y}`;

            return (
              <g
                key={br.id || `${br.from}_${br.to}_${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity({ type: 'branch', from: br.from, to: br.to, id: br.id });
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Wider invisible stroke for easy clicking */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="12"
                />
                {/* Visible branch wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#f43f5e' : '#38bdf8'}
                  strokeWidth={isSelected ? '3.5' : '2'}
                  strokeOpacity="0.85"
                  markerEnd="url(#branch-arrow)"
                />
              </g>
            );
          })}

          {/* Sinks (Registers / Flip-Flops) */}
          {project.sinks.map((s) => {
            const isSelected = selectedEntity?.type === 'sink' && selectedEntity.id === s.id;
            const solSink = sinkSolutionMap.get(s.id);
            const arrivalPs = solSink?.arrivalPs ?? null;
            const isReached = solSink?.isReached ?? false;

            // Determine badge color
            let badgeBg = '#334155';
            let badgeFg = '#94a3b8';
            if (isReached && arrivalPs !== null) {
              const diffFromMin = arrivalPs - minArr;
              if (diffFromMin <= skewTarget) {
                badgeBg = '#065f46';
                badgeFg = '#6ee7b7';
              } else {
                badgeBg = '#991b1b';
                badgeFg = '#fca5a5';
              }
            }

            return (
              <g
                key={s.id}
                className="cts-node"
                transform={`translate(${s.x}, ${s.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, 'sink', s.id, s.x, s.y)}
                style={{ cursor: 'move' }}
              >
                {/* Selection halo */}
                {isSelected && (
                  <rect
                    x="-14"
                    y="-14"
                    width="28"
                    height="28"
                    rx="5"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}
                {/* Sink Body (Register Cell) */}
                <rect
                  x="-9"
                  y="-9"
                  width="18"
                  height="18"
                  rx="3"
                  fill="#064e3b"
                  stroke="#10b981"
                  strokeWidth="1.8"
                />
                {/* Clock triangle input inside flip-flop */}
                <path
                  d="M -4 -8 L -1 -3 L 2 -8"
                  fill="none"
                  stroke="#6ee7b7"
                  strokeWidth="1.2"
                />

                {/* Sink ID Label */}
                <text
                  x="0"
                  y="-12"
                  fill="#e2e8f0"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {s.id}
                </text>

                {/* Arrival Latency Badge */}
                <g transform="translate(0, 16)">
                  <rect
                    x="-20"
                    y="-6"
                    width="40"
                    height="12"
                    rx="3"
                    fill={badgeBg}
                  />
                  <text
                    x="0"
                    y="3"
                    fill={badgeFg}
                    fontSize="8"
                    fontWeight="700"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {isReached && arrivalPs !== null ? `${arrivalPs}ps` : 'OFFLINE'}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Buffers / Repeaters */}
          {project.buffers.map((buf) => {
            const isSelected = selectedEntity?.type === 'buffer' && selectedEntity.id === buf.id;
            const lib = CLOCK_BUFFER_LIB[buf.cellType] || CLOCK_BUFFER_LIB.CLKBUF_X2;

            // Color coding based on drive strength
            let bufFill = '#3b82f6';
            if (buf.cellType === 'CLKBUF_X1') bufFill = '#64748b';
            if (buf.cellType === 'CLKBUF_X2') bufFill = '#0284c7';
            if (buf.cellType === 'CLKBUF_X4') bufFill = '#7c3aed';
            if (buf.cellType === 'CLKBUF_X8') bufFill = '#ec4899';

            return (
              <g
                key={buf.id}
                className="cts-node"
                transform={`translate(${buf.x}, ${buf.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, 'buffer', buf.id, buf.x, buf.y)}
                style={{ cursor: 'move' }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}
                {/* Triangular buffer symbol */}
                <path
                  d="M -10 -9 L 10 0 L -10 9 Z"
                  fill={bufFill}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                {/* Buffer ID Label */}
                <text
                  x="0"
                  y="-12"
                  fill="#c4b5fd"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {buf.id}
                </text>
                <text
                  x="0"
                  y="18"
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontWeight="600"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {buf.cellType || 'X2'}
                </text>
              </g>
            );
          })}

          {/* Clock Root Pin */}
          <g
            className="cts-node"
            transform={`translate(${project.root.x}, ${project.root.y})`}
            onMouseDown={(e) => handleNodeMouseDown(e, 'root', project.root.id, project.root.x, project.root.y)}
            style={{ cursor: 'move' }}
          >
            {/* Halo */}
            <circle
              cx="0"
              cy="0"
              r="14"
              fill="rgba(251, 191, 36, 0.2)"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            {/* Golden Diamond Core */}
            <polygon
              points="0,-8 8,0 0,8 -8,0"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-12"
              fill="#fbbf24"
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
              pointerEvents="none"
            >
              {project.root.id}
            </text>
          </g>
        </g>
      </svg>

      {/* Canvas Viewport Controls Overlay */}
      <div className="cts-canvas-controls">
        <button className="cts-btn" style={{ padding: '0.25rem 0.5rem' }} onClick={handleZoomIn} title="Zoom In (+)">
          +
        </button>
        <button className="cts-btn" style={{ padding: '0.25rem 0.5rem' }} onClick={handleZoomOut} title="Zoom Out (-)">
          -
        </button>
        <button className="cts-btn" style={{ padding: '0.25rem 0.5rem' }} onClick={handleFitScreen} title="Fit Entire Core">
          Fit
        </button>
        <button className="cts-btn" style={{ padding: '0.25rem 0.5rem' }} onClick={handleResetZoom} title="Reset Scale (1:1)">
          1:1
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#cbd5e1', cursor: 'pointer', marginLeft: '0.3rem' }}>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
          />
          Snap 10µm
        </label>
      </div>

      {/* Canvas Legend Overlay */}
      <div className="cts-canvas-legend">
        <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Legend</div>
        <div className="cts-legend-item">
          <div className="cts-legend-dot" style={{ background: '#f59e0b' }} />
          <span>Clock Root Pin</span>
        </div>
        <div className="cts-legend-item">
          <div className="cts-legend-dot" style={{ background: '#7c3aed' }} />
          <span>Buffer Cell (CLKBUF_X*)</span>
        </div>
        <div className="cts-legend-item">
          <div className="cts-legend-dot" style={{ background: '#10b981' }} />
          <span>Clock Sink (Register)</span>
        </div>
        <div className="cts-legend-item">
          <div className="cts-legend-dot" style={{ background: '#dc2626' }} />
          <span>Macro Blockage Keepout</span>
        </div>
        <div className="cts-legend-item">
          <div className="cts-legend-dot" style={{ background: '#38bdf8' }} />
          <span>Clock Distribution Wire</span>
        </div>
      </div>
    </div>
  );
}
