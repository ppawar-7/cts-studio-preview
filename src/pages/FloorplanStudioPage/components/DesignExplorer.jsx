/**
 * DesignExplorer.jsx
 * ==================
 * Left sidebar tree view of Floorplan design entities:
 * - Boundaries (Die, Core)
 * - Hard Macros (selectable, show halos & orientation)
 * - I/O Pins (grouped by edge)
 * - Power Network (Rings, Straps, Vias)
 * - Blockages
 * - Active Violations
 */

import React, { useState } from 'react';

export default function DesignExplorer({
  project,
  selectedId,
  selectedType,
  onSelect,
  violations = [],
  onSelectViolation,
  onAddVia,
}) {
  const [openSections, setOpenSections] = useState({
    boundaries: true,
    macros: true,
    pins: true,
    power: true,
    blockages: false,
    violations: true,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const macros = project?.macros || [];
  const pins = project?.pins || [];
  const rings = project?.powerNetwork?.rings || [];
  const straps = project?.powerNetwork?.straps || [];
  const vias = project?.powerNetwork?.vias || [];
  const blockages = project?.blockages || [];

  return (
    <aside className="fp-studio__left" aria-label="Design Hierarchy Explorer" data-testid="design-explorer">
      {/* Violations Section (if any) */}
      {violations.length > 0 && (
        <div className="fp-explorer__section" data-testid="explorer-section-violations">
          <div
            className="fp-explorer__section-header"
            onClick={() => toggleSection('violations')}
          >
            <span>⚠️ Violations</span>
            <span className="fp-explorer__badge fp-explorer__badge--error" data-testid="explorer-violations-badge">
              {violations.length}
            </span>
          </div>
          {openSections.violations && (
            <div>
              {violations.map((v, idx) => (
                <div
                  key={`v-${idx}`}
                  className="fp-explorer__item fp-explorer__item--error"
                  onClick={() => onSelectViolation && onSelectViolation(v)}
                  data-testid={`explorer-violation-${idx}`}
                >
                  <span>●</span>
                  <span style={{ fontSize: '0.74rem' }}>{v.rule}</span>
                  {v.viaFix && onAddVia && (
                    <button
                      type="button"
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        background: '#0284c7',
                        border: 'none',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                      data-testid="explorer-add-via-fix"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddVia(v.viaFix);
                      }}
                    >
                      + Via
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Boundaries */}
      <div className="fp-explorer__section">
        <div
          className="fp-explorer__section-header"
          onClick={() => toggleSection('boundaries')}
        >
          <span>📐 Boundaries</span>
          <span style={{ fontSize: '0.7rem' }}>{openSections.boundaries ? '▼' : '▶'}</span>
        </div>
        {openSections.boundaries && (
          <div>
            <div
              className={`fp-explorer__item ${selectedType === 'die' ? 'fp-explorer__item--selected' : ''}`}
              onClick={() => onSelect('die', 'die')}
              data-testid="explorer-die"
            >
              <span>🔳</span>
              <span>Die ({project.die.width}×{project.die.height})</span>
            </div>
            <div
              className={`fp-explorer__item ${selectedType === 'core' ? 'fp-explorer__item--selected' : ''}`}
              onClick={() => onSelect('core', 'core')}
              data-testid="explorer-core"
            >
              <span>⬚</span>
              <span>Core ({project.core.width}×{project.core.height})</span>
            </div>
          </div>
        )}
      </div>

      {/* Hard Macros */}
      <div className="fp-explorer__section">
        <div
          className="fp-explorer__section-header"
          onClick={() => toggleSection('macros')}
        >
          <span>🧱 Macros</span>
          <span className="fp-explorer__badge" data-testid="explorer-badge-macros">{macros.length}</span>
        </div>
        {openSections.macros && (
          <div>
            {macros.map((m) => (
              <div
                key={m.id}
                className={`fp-explorer__item ${selectedId === m.id ? 'fp-explorer__item--selected' : ''}`}
                onClick={() => onSelect('macro', m.id)}
                data-testid={`explorer-item-macro-${m.id}`}
              >
                <span>📦</span>
                <span>{m.name || m.id}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#64748b' }}>
                  {m.orientation || 'R0'}
                </span>
              </div>
            ))}
            {macros.length === 0 && (
              <div style={{ padding: '0.2rem 1.25rem', fontSize: '0.74rem', color: '#475569' }}>
                No macros defined
              </div>
            )}
          </div>
        )}
      </div>

      {/* I/O Pins */}
      <div className="fp-explorer__section">
        <div
          className="fp-explorer__section-header"
          onClick={() => toggleSection('pins')}
        >
          <span>📍 I/O Pins</span>
          <span className="fp-explorer__badge" data-testid="explorer-badge-pins">{pins.length}</span>
        </div>
        {openSections.pins && (
          <div>
            {pins.map((p) => (
              <div
                key={p.id}
                className={`fp-explorer__item ${selectedId === p.id ? 'fp-explorer__item--selected' : ''}`}
                onClick={() => onSelect('pin', p.id)}
                data-testid={`explorer-item-pin-${p.id}`}
              >
                <span>•</span>
                <span>{p.id}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#64748b' }}>
                  {p.edge}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Power Network */}
      <div className="fp-explorer__section">
        <div
          className="fp-explorer__section-header"
          onClick={() => toggleSection('power')}
        >
          <span>⚡ Power Grid (PDN)</span>
          <span className="fp-explorer__badge" data-testid="explorer-badge-power">{rings.length + straps.length + vias.length}</span>
        </div>
        {openSections.power && (
          <div>
            {rings.map((r) => (
              <div
                key={r.id}
                className={`fp-explorer__item ${selectedId === r.id ? 'fp-explorer__item--selected' : ''}`}
                onClick={() => onSelect('ring', r.id)}
                data-testid={`explorer-item-ring-${r.id}`}
              >
                <span>⭕</span>
                <span>{r.net} Ring ({r.layer})</span>
              </div>
            ))}
            {straps.map((s) => (
              <div
                key={s.id}
                className={`fp-explorer__item ${selectedId === s.id ? 'fp-explorer__item--selected' : ''}`}
                onClick={() => onSelect('strap', s.id)}
                data-testid={`explorer-item-strap-${s.id}`}
              >
                <span>═</span>
                <span>{s.net} Strap ({s.layer})</span>
              </div>
            ))}
            {vias.map((v) => (
              <div
                key={v.id}
                className={`fp-explorer__item ${selectedId === v.id ? 'fp-explorer__item--selected' : ''}`}
                onClick={() => onSelect('via', v.id)}
                data-testid={`explorer-item-via-${v.id}`}
              >
                <span>✦</span>
                <span>Via {v.id} ({v.net})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blockages */}
      <div className="fp-explorer__section">
        <div
          className="fp-explorer__section-header"
          onClick={() => toggleSection('blockages')}
        >
          <span>🚫 Blockages</span>
          <span className="fp-explorer__badge" data-testid="explorer-badge-blockages">{blockages.length}</span>
        </div>
        {openSections.blockages && (
          <div>
            {blockages.map((b) => (
              <div
                key={b.id}
                className={`fp-explorer__item ${selectedId === b.id ? 'fp-explorer__item--selected' : ''}`}
                onClick={() => onSelect('blockage', b.id)}
                data-testid={`explorer-item-blockage-${b.id}`}
              >
                <span>▦</span>
                <span>{b.id} ({b.width}×{b.height})</span>
              </div>
            ))}
            {blockages.length === 0 && (
              <div style={{ padding: '0.2rem 1.25rem', fontSize: '0.74rem', color: '#475569' }}>
                No blockages
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
