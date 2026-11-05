/**
 * StudioCanvas.jsx
 * ================
 * Interactive SVG canvas for Floorplan Studio.
 *
 * Coordinate model
 * ----------------
 * - World units are micrometres (µm), y grows downward (screen convention).
 * - The SVG viewBox always matches the container's pixel aspect ratio and is
 *   centred on the die, sized so the die plus its outward pin labels fit
 *   ("fit view"). `ppu` = screen pixels per µm at zoom 1.
 * - Zoom/pan are applied with a <g transform="translate(pan) scale(zoom)">.
 * - All pointer → world conversions use the inner group's screen CTM, so drag,
 *   pan and wheel-zoom stay 1:1 with the cursor at any window size, zoom or
 *   letterbox (the previous implementation mixed CSS pixels with viewBox units).
 *
 * Interaction
 * -----------
 * - Pointer events (mouse, pen, touch) with pointer capture.
 * - Drag a macro: live position updates, one undo step committed on release.
 * - Drag empty space / die / core: pan. A press without movement selects.
 * - Wheel: zoom about the cursor (native non-passive listener).
 * - Labels are sized in screen pixels (converted to world units) so they stay
 *   readable for any die size and never depend on a hard-coded 1000×700 viewBox.
 */

import React, { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { snapToGrid } from '../../../engine/floorplanGeometry.js';
import { getCongestionColor } from '../../../engine/floorplanCongestion.js';

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 6;
const PIN_FONT_PX = 11;
const PIN_MARK_LONG_PX = 12;
const PIN_MARK_SHORT_PX = 7;
const MACRO_FONT_PX = 12;
const MACRO_MIN_FONT_PX = 9;
const CHAR_W = 0.6; // average glyph advance as a fraction of font size
const DRAG_THRESHOLD_PX = 3;

// Notch corner per orientation (marks the macro's pin-1 / origin corner).
const NOTCH_CORNER = {
  R0: 'tl', MY: 'tr', MX: 'bl', R180: 'br', R90: 'bl', R270: 'tr', MXR90: 'tl', MYR90: 'br',
};

function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.width - r.width) < 0.5 && Math.abs(s.height - r.height) < 0.5 ? s : { width: r.width, height: r.height }));
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Split a label into ≤3 lines that fit `maxChars` per line where possible. */
function wrapLabel(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  if (lines.length <= 3) return lines;
  return [...lines.slice(0, 2), lines.slice(2).join(' ')];
}

export default function StudioCanvas({
  project,
  selectedId,
  selectedType,
  onSelect,
  onUpdateMacroPosition,
  onCommitMacroDrag,
  snapToGrid: enableSnap = true,
  gridSize = 5,
  showPowerNetwork = true,
  showCongestion = false,
  congestionMap = null,
  showBlockages = true,
  zoom = 1,
  onZoomChange,
  fitToken = 0,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const groupRef = useRef(null);
  const size = useElementSize(containerRef);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const gesture = useRef(null);
  const wheelZoomRef = useRef(null); // zoom value set by the wheel handler (pan already adjusted)
  const prevZoomRef = useRef(zoom);

  const die = project?.die || { x: 0, y: 0, width: 500, height: 400 };
  const dieX = Number(die.x) || 0;
  const dieY = Number(die.y) || 0;
  const core = project?.core || { x: 40, y: 40, width: 420, height: 320 };
  const macros = project?.macros || [];
  const pins = project?.pins || [];
  const power = project?.powerNetwork || { rings: [], straps: [], vias: [] };
  const rings = power.rings || [];
  const straps = power.straps || [];
  const vias = power.vias || [];
  const blockages = project?.blockages || [];
  const rows = project?.placementRows || [];

  const canvasW = Math.max(1, size.width);
  const canvasH = Math.max(1, size.height);
  // Phones get slightly smaller (still ≥10 px) pin labels so the die keeps more of the width.
  const pinFontPx = canvasW < 520 ? 10 : PIN_FONT_PX;

  // ── Fit: solve for px-per-µm so die + outward pin labels fill the canvas ──
  const view = useMemo(() => {
    const labelPx = (edges) => {
      const ps = pins.filter((p) => edges.includes(p.edge));
      if (ps.length === 0) return 16;
      const maxChars = Math.max(...ps.map((p) => String(p.id).length));
      return maxChars * CHAR_W * pinFontPx + PIN_MARK_LONG_PX / 2 + 10;
    };
    const lx = labelPx(['left', 'right']);
    const ly = labelPx(['top', 'bottom']);
    let ppu = Math.min(canvasW / die.width, canvasH / die.height);
    for (let i = 0; i < 6; i++) {
      const mx = lx / ppu;
      const my = ly / ppu;
      ppu = Math.min(canvasW / (die.width + 2 * mx), canvasH / (die.height + 2 * my));
    }
    ppu = Math.max(ppu, 0.05);
    const vbW = canvasW / ppu;
    const vbH = canvasH / ppu;
    return {
      ppu,
      vbX: dieX + die.width / 2 - vbW / 2,
      vbY: dieY + die.height / 2 - vbH / 2,
      vbW,
      vbH,
    };
  }, [canvasW, canvasH, die.width, die.height, dieX, dieY, pins, pinFontPx]);

  // Pixel → world size helpers (labels scale with zoom like the geometry does)
  const px = useCallback((n) => n / view.ppu, [view.ppu]);

  // Toolbar zoom (+/−) keeps the viewport centre fixed. Wheel zoom handles its own pan.
  useEffect(() => {
    const prev = prevZoomRef.current;
    prevZoomRef.current = zoom;
    if (wheelZoomRef.current === zoom) { wheelZoomRef.current = null; return; }
    if (prev === zoom) return;
    const cx = view.vbX + view.vbW / 2;
    const cy = view.vbY + view.vbH / 2;
    setPan((p) => ({
      x: cx - ((cx - p.x) / prev) * zoom,
      y: cy - ((cy - p.y) / prev) * zoom,
    }));
  }, [zoom, view.vbX, view.vbY, view.vbW, view.vbH]);

  // Fit view: reset pan whenever the parent asks (Fit button / project change).
  // Declared after the zoom effect so its reset wins when both fire together.
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [fitToken]);

  /** Client (CSS px) → world µm, through the live transform of the zoom/pan group. */
  const clientToWorld = useCallback((clientX, clientY) => {
    const g = groupRef.current;
    const svg = svgRef.current;
    if (!g || !svg || !g.getScreenCTM) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const w = pt.matrixTransform(g.getScreenCTM().inverse());
    return { x: w.x, y: w.y };
  }, []);

  /** Client (CSS px) → SVG user units (before zoom/pan). */
  const clientToUser = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg || !svg.getScreenCTM) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const u = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: u.x, y: u.y };
  }, []);

  // ── Wheel zoom about the cursor (non-passive so preventDefault works) ────
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const z = zoomRef.current;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((z * factor).toFixed(4))));
      if (nz === z) return;
      const u = clientToUser(e.clientX, e.clientY);
      const p = panRef.current;
      const wx = (u.x - p.x) / z;
      const wy = (u.y - p.y) / z;
      const np = { x: u.x - nz * wx, y: u.y - nz * wy };
      panRef.current = np;
      zoomRef.current = nz;
      wheelZoomRef.current = nz;
      setPan(np);
      if (onZoomChange) onZoomChange(nz);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clientToUser, onZoomChange]);

  // ── Pointer gestures ─────────────────────────────────────────────────────
  const selectionFromTarget = (target) => {
    let el = target;
    while (el && el !== svgRef.current) {
      if (el.dataset && el.dataset.selType) return { type: el.dataset.selType, id: el.dataset.selId };
      el = el.parentNode;
    }
    return { type: null, id: null };
  };

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const macroEl = e.target.closest ? e.target.closest('[data-macro-id]') : null;
    const svg = svgRef.current;
    if (svg && svg.setPointerCapture) {
      try { svg.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (macroEl) {
      const macro = macros.find((m) => m.id === macroEl.dataset.macroId);
      if (!macro) return;
      onSelect('macro', macro.id);
      const w = clientToWorld(e.clientX, e.clientY);
      gesture.current = {
        kind: 'drag',
        pointerId: e.pointerId,
        macroId: macro.id,
        offset: { x: w.x - macro.x, y: w.y - macro.y },
        from: { x: macro.x, y: macro.y },
        last: { x: macro.x, y: macro.y },
        startClient: { x: e.clientX, y: e.clientY },
        moved: false,
        fixed: Boolean(macro.fixed),
      };
      e.preventDefault();
      return;
    }
    const u = clientToUser(e.clientX, e.clientY);
    gesture.current = {
      kind: 'pan',
      pointerId: e.pointerId,
      startUser: u,
      startPan: { ...pan },
      startClient: { x: e.clientX, y: e.clientY },
      moved: false,
      selection: selectionFromTarget(e.target),
    };
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - g.startClient.x, e.clientY - g.startClient.y);
    if (!g.moved && dist < DRAG_THRESHOLD_PX) return;
    g.moved = true;

    if (g.kind === 'drag') {
      if (g.fixed) return;
      const w = clientToWorld(e.clientX, e.clientY);
      let nx = w.x - g.offset.x;
      let ny = w.y - g.offset.y;
      if (enableSnap) {
        nx = snapToGrid(nx, gridSize);
        ny = snapToGrid(ny, gridSize);
      } else {
        nx = Number(nx.toFixed(2));
        ny = Number(ny.toFixed(2));
      }
      if (nx !== g.last.x || ny !== g.last.y) {
        g.last = { x: nx, y: ny };
        if (onUpdateMacroPosition) onUpdateMacroPosition(g.macroId, nx, ny);
      }
    } else if (g.kind === 'pan') {
      if (!isPanning) setIsPanning(true);
      const u = clientToUser(e.clientX, e.clientY);
      setPan({ x: g.startPan.x + (u.x - g.startUser.x), y: g.startPan.y + (u.y - g.startUser.y) });
    }
  };

  const endGesture = (e) => {
    const g = gesture.current;
    if (!g || (e && g.pointerId !== e.pointerId)) return;
    gesture.current = null;
    setIsPanning(false);
    if (g.kind === 'drag') {
      if (g.moved && (g.last.x !== g.from.x || g.last.y !== g.from.y) && onCommitMacroDrag) {
        onCommitMacroDrag(g.macroId, g.from);
      }
    } else if (g.kind === 'pan' && !g.moved && e && e.type === 'pointerup') {
      onSelect(g.selection.type, g.selection.id);
    }
  };

  // ── Rendering helpers ────────────────────────────────────────────────────
  const pinFont = px(pinFontPx);
  const markLong = px(PIN_MARK_LONG_PX);
  const markShort = px(PIN_MARK_SHORT_PX);
  const dieRight = dieX + die.width;
  const dieBottom = dieY + die.height;

  const sel = (type, id) => ({ 'data-sel-type': type, 'data-sel-id': id });

  return (
    <div className="fp-studio-canvas-wrap">
      <div
        ref={containerRef}
        className={`fp-studio-canvas ${isPanning ? 'fp-studio-canvas--panning' : ''}`}
        data-testid="fp-canvas"
        role="region"
        aria-label="Floorplan Layout Interactive Canvas"
      >
        <svg
          ref={svgRef}
          className="fp-studio-canvas__svg"
          width={canvasW}
          height={canvasH}
          viewBox={`${view.vbX} ${view.vbY} ${view.vbW} ${view.vbH}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onLostPointerCapture={endGesture}
        >
          <rect
            className="canvas-background"
            x={view.vbX}
            y={view.vbY}
            width={view.vbW}
            height={view.vbH}
            fill="#060c1a"
          />
          <g ref={groupRef} transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Die Boundary */}
            <rect
              data-testid="die-boundary"
              x={dieX}
              y={dieY}
              width={die.width}
              height={die.height}
              fill="#0b1329"
              stroke={selectedType === 'die' ? '#38bdf8' : '#334155'}
              strokeWidth={selectedType === 'die' ? 3 : 2}
              vectorEffect="non-scaling-stroke"
              rx={4}
              {...sel('die', 'die')}
            />

            {/* Core Boundary */}
            <rect
              data-testid="core-boundary"
              x={core.x}
              y={core.y}
              width={core.width}
              height={core.height}
              fill="#0f172a"
              stroke={selectedType === 'core' ? '#38bdf8' : '#0284c7'}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="5 3"
              {...sel('core', 'core')}
            />

            {/* Placement rows (every row line; pointer-transparent) */}
            <g className="placement-rows-group" opacity={0.12} pointerEvents="none">
              {rows.map((r, i) => {
                const rh = Number(r.rowHeight) || 2.72;
                const count = Math.floor((Number(r.height) || 0) / rh);
                // draw at most one line per 3 px so dense rows stay a texture, not noise
                const step = Math.max(1, Math.ceil(px(3) / rh));
                const lines = [];
                for (let k = 0; k <= count; k += step) {
                  const y = r.y + k * rh;
                  lines.push(<line key={`row-${i}-${k}`} x1={r.x} y1={y} x2={r.x + r.width} y2={y} stroke="#64748b" strokeWidth={1} vectorEffect="non-scaling-stroke" />);
                }
                return <g key={`rows-${i}`}>{lines}</g>;
              })}
            </g>

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
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>{`Bin r${bin.row} c${bin.col}: demand/capacity = ${bin.ratio}`}</title>
                  </rect>
                ))}
              </g>
            )}

            {/* Blockages */}
            {showBlockages && blockages.map((b) => {
              const isSel = selectedId === b.id;
              const fs = Math.min(px(10), b.height * 0.4);
              return (
                <g key={b.id} {...sel('blockage', b.id)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.width}
                    height={b.height}
                    fill="rgba(100, 116, 139, 0.25)"
                    stroke={isSel ? '#f43f5e' : '#64748b'}
                    strokeWidth={isSel ? 2 : 1.5}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="4 2"
                  />
                  <text x={b.x + b.width / 2} y={b.y + b.height / 2} dominantBaseline="middle" fill="#94a3b8" fontSize={fs} textAnchor="middle" pointerEvents="none">
                    {b.id} (BLK)
                  </text>
                </g>
              );
            })}

            {/* Power Distribution Network (PDN) */}
            {showPowerNetwork && (
              <g className="power-network-group">
                {rings.map((ring) => {
                  const isVDD = ring.net === 'VDD';
                  const isSel = selectedId === ring.id;
                  return (
                    <rect
                      key={ring.id}
                      x={ring.x}
                      y={ring.y}
                      width={ring.width}
                      height={ring.height}
                      fill="none"
                      stroke={isVDD ? '#ef4444' : '#3b82f6'}
                      strokeWidth={(ring.lineWidth || 6) + (isSel ? 2 : 0)}
                      strokeOpacity={0.85}
                      style={{ cursor: 'pointer' }}
                      {...sel('ring', ring.id)}
                    >
                      <title>{`${ring.id} — ${ring.net} ring on ${ring.layer}, ${ring.lineWidth || 6} µm wide`}</title>
                    </rect>
                  );
                })}
                {straps.map((strap) => {
                  const isVDD = strap.net === 'VDD';
                  const isSel = selectedId === strap.id;
                  return (
                    <line
                      key={strap.id}
                      x1={strap.x1}
                      y1={strap.y1}
                      x2={strap.x2}
                      y2={strap.y2}
                      stroke={isVDD ? '#f87171' : '#60a5fa'}
                      strokeWidth={(strap.width || 4) + (isSel ? 2 : 0)}
                      strokeOpacity={0.8}
                      style={{ cursor: 'pointer' }}
                      {...sel('strap', strap.id)}
                    >
                      <title>{`${strap.id} — ${strap.net} strap on ${strap.layer}, ${strap.width || 4} µm wide`}</title>
                    </line>
                  );
                })}
                {vias.map((via) => {
                  const isSel = selectedId === via.id;
                  return (
                    <circle
                      key={via.id}
                      data-testid={`via-${via.id}`}
                      cx={via.x}
                      cy={via.y}
                      r={px(isSel ? 6 : 4.5)}
                      fill={via.net === 'VDD' ? '#fca5a5' : '#93c5fd'}
                      stroke="#ffffff"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      style={{ cursor: 'pointer' }}
                      {...sel('via', via.id)}
                    >
                      <title>{`${via.id} — ${via.net} via ${via.layer1}↔${via.layer2} at (${via.x}, ${via.y})`}</title>
                    </circle>
                  );
                })}
              </g>
            )}

            {/* Hard Macros */}
            {macros.map((m) => {
              const isSelected = selectedId === m.id;
              const halo = m.halo || 0;
              const name = m.name || m.id;
              const orient = m.orientation || 'R0';
              const pad = Math.min(m.width, m.height) * 0.06;
              const usableW = m.width - 2 * pad;
              // Single-line fit first, then wrap to up to three lines.
              let fontW = Math.min(px(MACRO_FONT_PX), usableW / (name.length * CHAR_W));
              let lines = [name];
              if (fontW < px(MACRO_MIN_FONT_PX)) {
                fontW = px(MACRO_MIN_FONT_PX);
                lines = wrapLabel(name, Math.max(1, Math.floor(usableW / (fontW * CHAR_W))));
                const widest = Math.max(...lines.map((l) => l.length));
                fontW = Math.min(px(MACRO_FONT_PX), Math.max(px(6), usableW / (widest * CHAR_W)));
              }
              const coordText = `(${Math.round(m.x)}, ${Math.round(m.y)}) ${orient}`;
              const coordFont = Math.min(px(10), usableW / (coordText.length * CHAR_W));
              const lineH = fontW * 1.15;
              const blockH = lines.length * lineH + (coordFont >= px(8) ? coordFont * 1.3 : 0);
              const showCoords = coordFont >= px(8) && blockH <= m.height - 2 * pad;
              const firstY = m.y + m.height / 2 - (showCoords ? blockH : lines.length * lineH) / 2 + fontW * 0.85;
              const notch = Math.min(px(9), Math.min(m.width, m.height) * 0.25);
              const corner = NOTCH_CORNER[orient] || 'tl';
              const nx = corner.includes('r') ? m.x + m.width - pad : m.x + pad;
              const ny = corner.includes('b') ? m.y + m.height - pad : m.y + pad;
              const sx = corner.includes('r') ? -1 : 1;
              const sy = corner.includes('b') ? -1 : 1;
              return (
                <g
                  key={m.id}
                  className="macro-node"
                  data-testid={`macro-${m.id}`}
                  data-macro-id={m.id}
                  style={{ cursor: m.fixed ? 'not-allowed' : 'move' }}
                >
                  <title>{`${name} (${m.x}, ${m.y}) [${m.width}×${m.height}] ${orient}, halo ${halo} µm${m.fixed ? ', fixed' : ''}`}</title>
                  {halo > 0 && (
                    <rect
                      x={m.x - halo}
                      y={m.y - halo}
                      width={m.width + 2 * halo}
                      height={m.height + 2 * halo}
                      fill="rgba(245, 158, 11, 0.12)"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                      strokeDasharray="4 3"
                      pointerEvents="none"
                    />
                  )}
                  <rect
                    data-role="macro-body"
                    x={m.x}
                    y={m.y}
                    width={m.width}
                    height={m.height}
                    fill={isSelected ? '#1d4ed8' : '#1e3a5f'}
                    stroke={isSelected ? '#38bdf8' : '#2563eb'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    vectorEffect="non-scaling-stroke"
                    rx={Math.min(3, m.width / 10)}
                  />
                  <polygon
                    points={`${nx},${ny} ${nx + sx * notch},${ny} ${nx},${ny + sy * notch}`}
                    fill="#38bdf8"
                    opacity={0.75}
                    pointerEvents="none"
                  />
                  <text fill="#ffffff" fontSize={fontW} fontWeight="700" textAnchor="middle" pointerEvents="none">
                    {lines.map((l, i) => (
                      <tspan key={i} x={m.x + m.width / 2} y={firstY + i * lineH}>{l}</tspan>
                    ))}
                  </text>
                  {showCoords && (
                    <text
                      x={m.x + m.width / 2}
                      y={firstY + (lines.length - 1) * lineH + coordFont * 1.45}
                      fill="#93c5fd"
                      fontSize={coordFont}
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {coordText}
                    </text>
                  )}
                </g>
              );
            })}

            {/* I/O Pins: markers straddle the die boundary, labels point outward */}
            {pins.map((p) => {
              const coord = typeof p.coord === 'number' ? p.coord : 0;
              const isSel = selectedId === p.id;
              const vertical = p.edge === 'left' || p.edge === 'right';
              const mw = vertical ? markLong : markShort;
              const mh = vertical ? markShort : markLong;
              let cx;
              let cy;
              if (p.edge === 'bottom') { cx = core.x + coord; cy = dieBottom; }
              else if (p.edge === 'left') { cx = dieX; cy = core.y + coord; }
              else if (p.edge === 'right') { cx = dieRight; cy = core.y + coord; }
              else { cx = core.x + coord; cy = dieY; }
              const gap = px(4);
              let label;
              if (p.edge === 'top') {
                label = { x: cx, y: cy - mh / 2 - gap, anchor: 'start', rotate: -90 };
              } else if (p.edge === 'bottom') {
                label = { x: cx, y: cy + mh / 2 + gap, anchor: 'end', rotate: -90 };
              } else if (p.edge === 'left') {
                label = { x: cx - mw / 2 - gap, y: cy, anchor: 'end', rotate: 0 };
              } else {
                label = { x: cx + mw / 2 + gap, y: cy, anchor: 'start', rotate: 0 };
              }
              return (
                <g key={p.id} className="pin-node" data-testid={`pin-${p.id}`} {...sel('pin', p.id)} style={{ cursor: 'pointer' }}>
                  <title>{`${p.id} — ${p.edge} edge, coord ${coord} µm, ${p.layer || 'M3'}`}</title>
                  <rect
                    x={cx - mw / 2}
                    y={cy - mh / 2}
                    width={mw}
                    height={mh}
                    fill={isSel ? '#f43f5e' : '#a855f7'}
                    stroke={isSel ? '#ffffff' : '#d8b4fe'}
                    strokeWidth={isSel ? 2 : 1}
                    vectorEffect="non-scaling-stroke"
                    rx={px(1)}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    transform={label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined}
                    fill={isSel ? '#ffffff' : '#e9d5ff'}
                    fontSize={pinFont}
                    fontWeight="600"
                    textAnchor={label.anchor}
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {p.id}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Status + legend live below the canvas so they never cover the design */}
      <div className="fp-canvas-footer">
        <div className="fp-canvas-status">
          Zoom: {Math.round(zoom * 100)}% | Die: {die.width}×{die.height}µm | Core: {core.width}×{core.height}µm
        </div>
        <div className="fp-canvas-legend">
          {[
            ['Die Boundary', { background: '#0b1329', border: '1px solid #334155' }],
            ['Core Area', { background: '#0f172a', border: '1px dashed #0284c7' }],
            ['Hard Macro', { background: '#1e3a5f', border: '1px solid #2563eb' }],
            ['Keepout Halo', { background: 'rgba(245, 158, 11, 0.25)', border: '1px dashed #f59e0b' }],
            ['VDD Ring/Strap', { background: '#ef4444' }],
            ['VSS Ring/Strap', { background: '#3b82f6' }],
            ['I/O Pin', { background: '#a855f7' }],
          ].map(([label, style]) => (
            <div className="fp-legend-item" key={label}>
              <div className="fp-legend-swatch" style={style} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
