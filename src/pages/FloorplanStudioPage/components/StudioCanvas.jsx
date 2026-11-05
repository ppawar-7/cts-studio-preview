/**
 * StudioCanvas.jsx
 * ================
 * Interactive high-resolution SVG canvas for Floorplan Studio.
 * Supports:
 * - Viewport zoom & pan (wheel, mouse drag)
 * - Macro drag-and-drop with world-coordinate conversion & grid snapping
 * - Entity selection (die, core, macros, pins, straps, vias, blockages)
 * - Keepout halo rendering (haloA + haloB separation visualization)
 * - Power Distribution Network (VDD/VSS rings, straps, vias)
 * - Placement rows preview
 * - Optional Congestion Heatmap overlay
 * - Non-overlapping engineering annotations and clean color legend
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  worldToViewport,
  viewportToWorld,
  snapToGrid,
} from '../../../engine/floorplanGeometry.js';
import { getCongestionColor } from '../../../engine/floorplanCongestion.js';

export default function StudioCanvas({
  project,
  selectedId,
  selectedType,
  onSelect,
  onUpdateMacroPosition,
  snapToGrid: enableSnap = true,
  gridSize = 5,
  showPowerNetwork = true,
  showCongestion = false,
  congestionMap = null,
  showBlockages = true,
  zoom = 1,
  onZoomChange,
}) {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Macro dragging state
  const [draggingMacroId, setDraggingMacroId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const die = project?.die || { width: 500, height: 400 };
  const core = project?.core || { x: 40, y: 40, width: 420, height: 320 };
  const macros = project?.macros || [];
  const pins = project?.pins || [];
  const power = project?.powerNetwork || { rings: [], straps: [], vias: [] };
  const blockages = project?.blockages || [];
  const rows = project?.placementRows || [];

  // Viewport setup
  const viewport = { offsetX: pan.x, offsetY: pan.y, zoom };

  // Handle Pan start
  const handleMouseDown = (e) => {
    // Only pan if clicking on canvas background (not on a macro/pin/button)
    if (e.target.tagName === 'svg' || e.target.classList.contains('canvas-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingMacroId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mousePx = e.clientX - rect.left;
      const mousePy = e.clientY - rect.top;

      const worldPos = viewportToWorld(mousePx, mousePy, viewport);
      let newX = worldPos.x - dragOffset.x;
      let newY = worldPos.y - dragOffset.y;

      if (enableSnap) {
        newX = snapToGrid(newX, gridSize);
        newY = snapToGrid(newY, gridSize);
      }

      onUpdateMacroPosition && onUpdateMacroPosition(draggingMacroId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingMacroId(null);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(3.0, Math.max(0.4, zoom * factor));
    if (onZoomChange) onZoomChange(newZoom);
  };

  // Macro Drag Start
  const handleMacroMouseDown = (e, macro) => {
    e.stopPropagation();
    onSelect('macro', macro.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mousePx = e.clientX - rect.left;
    const mousePy = e.clientY - rect.top;
    const worldPos = viewportToWorld(mousePx, mousePy, viewport);

    setDraggingMacroId(macro.id);
    setDragOffset({
      x: worldPos.x - macro.x,
      y: worldPos.y - macro.y,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`fp-studio-canvas ${isPanning ? 'fp-studio-canvas--panning' : ''}`}
      data-testid="fp-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      role="region"
      aria-label="Floorplan Layout Interactive Canvas"
    >
      <svg
        className="fp-studio-canvas__svg"
        viewBox={`0 0 1000 700`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Canvas Background / Grid */}
          <rect
            className="canvas-background"
            x={-200}
            y={-200}
            width={die.width + 400}
            height={die.height + 400}
            fill="#060c1a"
            onClick={() => onSelect(null, null)}
          />

          {/* Die Boundary */}
          <rect
            x={0}
            y={0}
            width={die.width}
            height={die.height}
            fill="#0b1329"
            stroke={selectedType === 'die' ? '#38bdf8' : '#334155'}
            strokeWidth={selectedType === 'die' ? 3 : 2}
            rx={4}
            onClick={(e) => { e.stopPropagation(); onSelect('die', 'die'); }}
            style={{ cursor: 'pointer' }}
          />

          {/* Placement Rows (if available) */}
          <g className="placement-rows-group" opacity={0.12}>
            {rows.slice(0, 30).map((r, i) => (
              <line
                key={`row-${i}`}
                x1={r.x}
                y1={r.y}
                x2={r.x + r.width}
                y2={r.y}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            ))}
          </g>

          {/* Core Boundary */}
          <rect
            x={core.x}
            y={core.y}
            width={core.width}
            height={core.height}
            fill="#0f172a"
            stroke={selectedType === 'core' ? '#38bdf8' : '#0284c7'}
            strokeWidth={2}
            strokeDasharray="5 3"
            onClick={(e) => { e.stopPropagation(); onSelect('core', 'core'); }}
            style={{ cursor: 'pointer' }}
          />

          {/* Optional Congestion Heatmap */}
          {showCongestion && congestionMap?.bins && (
            <g className="congestion-overlay" data-testid="congestion-overlay" pointerEvents="none">
              {congestionMap.bins.flat().map((bin, idx) => (
                <rect
                  key={`cong-${idx}`}
                  className="congestion-cell"
                  data-testid="congestion-cell"
                  x={bin.x}
                  y={bin.y}
                  width={bin.width}
                  height={bin.height}
                  fill={getCongestionColor(bin.ratio)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={0.5}
                />
              ))}
            </g>
          )}

          {/* Blockages */}
          {showBlockages && blockages.map((b) => {
            const isSel = selectedId === b.id;
            return (
              <g
                key={b.id}
                onClick={(e) => { e.stopPropagation(); onSelect('blockage', b.id); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill="rgba(100, 116, 139, 0.25)"
                  stroke={isSel ? '#f43f5e' : '#64748b'}
                  strokeWidth={isSel ? 2 : 1.5}
                  strokeDasharray="4 2"
                />
                <text
                  x={b.x + b.width / 2}
                  y={b.y + b.height / 2 + 3}
                  fill="#94a3b8"
                  fontSize="9"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {b.id} (BLK)
                </text>
              </g>
            );
          })}

          {/* Power Distribution Network (PDN) */}
          {showPowerNetwork && (
            <g className="power-network-group">
              {/* Rings */}
              {power.rings.map((ring) => {
                const isVDD = ring.net === 'VDD';
                const strokeColor = isVDD ? '#ef4444' : '#3b82f6';
                const isSel = selectedId === ring.id;
                return (
                  <rect
                    key={ring.id}
                    x={ring.x}
                    y={ring.y}
                    width={ring.width}
                    height={ring.height}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSel ? (ring.lineWidth || 6) + 2 : (ring.lineWidth || 6)}
                    strokeOpacity={0.85}
                    onClick={(e) => { e.stopPropagation(); onSelect('ring', ring.id); }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}

              {/* Straps */}
              {power.straps.map((strap) => {
                const isVDD = strap.net === 'VDD';
                const strokeColor = isVDD ? '#f87171' : '#60a5fa';
                const isSel = selectedId === strap.id;
                return (
                  <line
                    key={strap.id}
                    x1={strap.x1}
                    y1={strap.y1}
                    x2={strap.x2}
                    y2={strap.y2}
                    stroke={strokeColor}
                    strokeWidth={isSel ? (strap.width || 4) + 2 : (strap.width || 4)}
                    strokeOpacity={0.8}
                    onClick={(e) => { e.stopPropagation(); onSelect('strap', strap.id); }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}

              {/* Vias */}
              {power.vias.map((via) => {
                const isVDD = via.net === 'VDD';
                const fill = isVDD ? '#fca5a5' : '#93c5fd';
                const isSel = selectedId === via.id;
                return (
                  <circle
                    key={via.id}
                    data-testid={`via-${via.id}`}
                    cx={via.x}
                    cy={via.y}
                    r={isSel ? 5 : 3.5}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={1}
                    onClick={(e) => { e.stopPropagation(); onSelect('via', via.id); }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </g>
          )}

          {/* Hard Macros */}
          {macros.map((m) => {
            const isSelected = selectedId === m.id;
            const halo = m.halo || 0;
            return (
              <g
                key={m.id}
                className="macro-node"
                data-testid={`macro-${m.id}`}
                onMouseDown={(e) => handleMacroMouseDown(e, m)}
                style={{ cursor: 'move' }}
              >
                {/* Keepout Halo Shading */}
                {halo > 0 && (
                  <rect
                    x={m.x - halo}
                    y={m.y - halo}
                    width={m.width + 2 * halo}
                    height={m.height + 2 * halo}
                    fill="rgba(245, 158, 11, 0.12)"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    pointerEvents="none"
                  />
                )}

                {/* Macro Body */}
                <rect
                  x={m.x}
                  y={m.y}
                  width={m.width}
                  height={m.height}
                  fill={isSelected ? '#1d4ed8' : '#1e3a5f'}
                  stroke={isSelected ? '#38bdf8' : '#2563eb'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  rx={3}
                />

                {/* Orientation Notch Indicator */}
                <polygon
                  points={`${m.x + 4},${m.y + 4} ${m.x + 12},${m.y + 4} ${m.x + 4},${m.y + 12}`}
                  fill="#38bdf8"
                  opacity={0.7}
                />

                {/* Macro Title */}
                <text
                  x={m.x + m.width / 2}
                  y={m.y + m.height / 2 - 4}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {m.name || m.id}
                </text>

                {/* Coordinates & Size */}
                <text
                  x={m.x + m.width / 2}
                  y={m.y + m.height / 2 + 10}
                  fill="#93c5fd"
                  fontSize="9"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  ({Math.round(m.x)}, {Math.round(m.y)}) [{m.width}×{m.height}]
                </text>
              </g>
            );
          })}

          {/* I/O Pins */}
          {pins.map((p) => {
            let px = core.x, py = core.y;
            const coord = typeof p.coord === 'number' ? p.coord : 0;
            if (p.edge === 'top') {
              px += coord;
              py -= 8;
            } else if (p.edge === 'bottom') {
              px += coord;
              py += core.height + 2;
            } else if (p.edge === 'left') {
              px -= 8;
              py += coord;
            } else if (p.edge === 'right') {
              px += core.width + 2;
              py += coord;
            }

            const isSel = selectedId === p.id;

            return (
              <g
                key={p.id}
                className="pin-node"
                data-testid={`pin-${p.id}`}
                onClick={(e) => { e.stopPropagation(); onSelect('pin', p.id); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={px}
                  y={py}
                  width={p.edge === 'left' || p.edge === 'right' ? 8 : 12}
                  height={p.edge === 'left' || p.edge === 'right' ? 12 : 8}
                  fill={isSel ? '#f43f5e' : '#a855f7'}
                  stroke={isSel ? '#ffffff' : '#d8b4fe'}
                  strokeWidth={isSel ? 2 : 1}
                  rx={1}
                />
                <text
                  x={px + 4}
                  y={p.edge === 'top' ? py - 4 : py + 18}
                  fill="#e9d5ff"
                  fontSize="8"
                  fontWeight="600"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {p.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Status & Coordinate Info */}
      <div className="fp-canvas-status">
        Zoom: {Math.round(zoom * 100)}% | Die: {die.width}×{die.height}µm | Core: {core.width}×{core.height}µm
      </div>

      {/* Non-overlapping Clean Layer Legend (outside SVG layout to prevent text collisions) */}
      <div className="fp-canvas-legend">
        <div className="fp-legend-item">
          <div className="fp-legend-swatch" style={{ background: '#0b1329', border: '1px solid #334155' }} />
          <span>Die Boundary</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-swatch" style={{ background: '#0f172a', border: '1px dashed #0284c7' }} />
          <span>Core Area</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-swatch" style={{ background: '#1e3a5f', border: '1px solid #2563eb' }} />
          <span>Hard Macro</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-swatch" style={{ background: 'rgba(245, 158, 11, 0.25)', border: '1px dashed #f59e0b' }} />
          <span>Keepout Halo</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-swatch" style={{ background: '#ef4444' }} />
          <span>VDD Ring/Strap</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-swatch" style={{ background: '#3b82f6' }} />
          <span>VSS Ring/Strap</span>
        </div>
        <div className="fp-legend-item">
          <div className="fp-legend-swatch" style={{ background: '#a855f7' }} />
          <span>I/O Pin</span>
        </div>
      </div>
    </div>
  );
}
