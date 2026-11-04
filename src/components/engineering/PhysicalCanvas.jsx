/**
 * PhysicalCanvas.jsx
 * ==================
 * Interactive physical layout canvas using responsive SVG.
 * Supports:
 * - Die and Core boundaries
 * - I/O Pin markers along boundaries
 * - Draggable/positionable hard macros with keepout halos
 * - Standard cell rows
 * - Grid snapping and coordinate inspection
 */

import React from 'react';
import './PhysicalCanvas.css';

export default function PhysicalCanvas({
  dieWidth = 600,
  dieHeight = 500,
  coreWidth = 500,
  coreHeight = 400,
  margin = 50,
  macros = [],
  pins = [],
  onMacroMove,
  selectedMacroId,
  onSelectMacro,
  showPowerRings = true,
}) {
  const scale = 0.8;
  const viewBoxW = dieWidth + 80;
  const viewBoxH = dieHeight + 80;
  const offsetX = 40;
  const offsetY = 40;

  return (
    <div className="physical-canvas">
      <svg
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
        className="physical-svg"
        style={{ width: '100%', maxWidth: '700px', height: 'auto' }}
      >
        {/* Die Boundary */}
        <rect
          x={offsetX}
          y={offsetY}
          width={dieWidth}
          height={dieHeight}
          fill="#0f172a"
          stroke="#475569"
          strokeWidth="3"
          rx="4"
        />
        <text x={offsetX + 10} y={offsetY + 20} fill="#94a3b8" fontSize="11" fontWeight="700">
          DIE BOUNDARY ({dieWidth} × {dieHeight} µm)
        </text>

        {/* Core Boundary */}
        <rect
          x={offsetX + margin}
          y={offsetY + margin}
          width={coreWidth}
          height={coreHeight}
          fill="#1e293b"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <text x={offsetX + margin + 8} y={offsetY + margin + 18} fill="#38bdf8" fontSize="11" fontWeight="700">
          CORE AREA ({coreWidth} × {coreHeight} µm)
        </text>

        {/* Optional Power Rings (VDD in red, VSS in blue) */}
        {showPowerRings && (
          <g className="power-rings">
            {/* VDD Ring */}
            <rect
              x={offsetX + margin - 12}
              y={offsetY + margin - 12}
              width={coreWidth + 24}
              height={coreHeight + 24}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              opacity="0.85"
            />
            {/* VSS Ring */}
            <rect
              x={offsetX + margin - 22}
              y={offsetY + margin - 22}
              width={coreWidth + 44}
              height={coreHeight + 44}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              opacity="0.85"
            />
            <text x={offsetX + margin} y={offsetY + margin - 28} fill="#ef4444" fontSize="9" fontWeight="700">
              VDD / VSS Power Rings
            </text>
          </g>
        )}

        {/* Macros */}
        {macros.map((m) => {
          const absX = offsetX + margin + m.x;
          const absY = offsetY + margin + m.y;
          const isSelected = selectedMacroId === m.id;
          const halo = m.halo || 0;

          return (
            <g
              key={m.id}
              className="canvas-macro-group"
              onClick={() => onSelectMacro && onSelectMacro(m.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Keepout Halo */}
              {halo > 0 && (
                <rect
                  x={absX - halo}
                  y={absY - halo}
                  width={m.width + 2 * halo}
                  height={m.height + 2 * halo}
                  fill="rgba(245, 158, 11, 0.12)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Macro Body */}
              <rect
                x={absX}
                y={absY}
                width={m.width}
                height={m.height}
                fill={isSelected ? '#3b82f6' : '#2563eb'}
                stroke={isSelected ? '#93c5fd' : '#1d4ed8'}
                strokeWidth={isSelected ? '2.5' : '1.5'}
                rx="4"
              />
              <text
                x={absX + m.width / 2}
                y={absY + m.height / 2 - 4}
                fill="#ffffff"
                fontSize="11"
                fontWeight="800"
                textAnchor="middle"
              >
                {m.name || m.id}
              </text>
              <text
                x={absX + m.width / 2}
                y={absY + m.height / 2 + 12}
                fill="#bfdbfe"
                fontSize="9"
                textAnchor="middle"
              >
                ({m.x}, {m.y})
              </text>
            </g>
          );
        })}

        {/* I/O Pins */}
        {pins.map((p) => {
          let pinX = offsetX + margin;
          let pinY = offsetY + margin;

          if (p.edge === 'top') {
            pinX += p.coord;
            pinY -= 8;
          } else if (p.edge === 'bottom') {
            pinX += p.coord;
            pinY += coreHeight + 2;
          } else if (p.edge === 'left') {
            pinX -= 8;
            pinY += p.coord;
          } else if (p.edge === 'right') {
            pinX += coreWidth + 2;
            pinY += p.coord;
          }

          return (
            <g key={p.id} className="canvas-pin">
              <rect
                x={pinX}
                y={pinY}
                width={p.edge === 'left' || p.edge === 'right' ? 8 : 12}
                height={p.edge === 'left' || p.edge === 'right' ? 12 : 8}
                fill="#a855f7"
                stroke="#d8b4fe"
                strokeWidth="1"
              />
              <text
                x={pinX + 4}
                y={p.edge === 'top' ? pinY - 4 : pinY + 18}
                fill="#c084fc"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                {p.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
