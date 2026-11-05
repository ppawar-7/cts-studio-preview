/**
 * AnalysisPanel.jsx
 * =================
 * Bottom analytics panel displaying live engineering calculations:
 * - Geometric Areas (Die, Core, StdCell, Macro, Blockage)
 * - Utilization (Nominal vs Effective Placement)
 * - Interconnect HPWL Wirelength
 * - Power Distribution Integrity (VDD/VSS Open Nets, Missing Vias, Estimated IR-Drop)
 * - Routability & Congestion Hotspots
 */

import React from 'react';

export default function AnalysisPanel({
  utilization,
  hpwl,
  pdnAnalysis,
  congestionMap,
}) {
  const nominal = utilization?.nominalUtilization ?? 0;
  const effective = utilization?.effectiveUtilization ?? 0;
  const isOverutilized = utilization?.overutilized || nominal > 80;

  const totalHPWL = hpwl?.totalHPWL ?? 0;
  const vddOpen = pdnAnalysis?.openNets?.vddOpen;
  const vssOpen = pdnAnalysis?.openNets?.vssOpen;
  const missingVias = pdnAnalysis?.missingVias?.missingViaCount ?? 0;
  const maxIRDrop = pdnAnalysis?.irDrop?.maxDropMv ?? 0;
  const congestionHotspots = congestionMap?.hotspots?.length ?? 0;

  return (
    <footer className="fp-studio__bottom" aria-label="Floorplan Metrics & Live Signoff Analysis" data-testid="analysis-panel">
      <div className="fp-analysis-panel">
        {/* Area Metrics */}
        <div className="fp-metric-group">
          <div className="fp-metric-group__title">Area Geometry</div>
          <div className="fp-metric">
            <span className="fp-metric__label">Core Area:</span>
            <span className="fp-metric__value" data-testid="metric-core-area">{utilization?.coreArea?.toLocaleString() || 0} µm²</span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">Macro Area:</span>
            <span className="fp-metric__value" data-testid="metric-macro-area">{utilization?.macroArea?.toLocaleString() || 0} µm²</span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">StdCell Area:</span>
            <span className="fp-metric__value" data-testid="metric-stdcell-area">{utilization?.stdCellArea?.toLocaleString() || 0} µm²</span>
          </div>
        </div>

        {/* Utilization Metrics */}
        <div className="fp-metric-group">
          <div className="fp-metric-group__title">PPA Utilization</div>
          <div className="fp-metric">
            <span className="fp-metric__label">Nominal:</span>
            <span className={`fp-metric__value ${isOverutilized ? 'fp-metric__value--error' : nominal > 70 ? 'fp-metric__value--warn' : 'fp-metric__value--ok'}`} data-testid="metric-nominal-util">
              {nominal}%
            </span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">Effective:</span>
            <span className={`fp-metric__value ${effective > 85 ? 'fp-metric__value--error' : 'fp-metric__value--ok'}`} data-testid="metric-effective-util">
              {effective}%
            </span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">Routable:</span>
            <span className="fp-metric__value" data-testid="metric-routable-area">{utilization?.routableArea?.toLocaleString() || 0} µm²</span>
          </div>
        </div>

        {/* Wirelength & Congestion */}
        <div className="fp-metric-group">
          <div className="fp-metric-group__title">Interconnect &amp; Routability</div>
          <div className="fp-metric">
            <span className="fp-metric__label">HPWL Wire:</span>
            <span className="fp-metric__value" data-testid="metric-hpwl">{totalHPWL.toLocaleString()} µm</span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">Congestion:</span>
            <span className={`fp-metric__value ${congestionHotspots > 0 ? 'fp-metric__value--warn' : 'fp-metric__value--ok'}`} data-testid="metric-congestion-hotspots">
              {congestionHotspots} hotspots
            </span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">Max Demand:</span>
            <span className="fp-metric__value" data-testid="metric-max-demand">{Math.round((congestionMap?.maxRatio || 0) * 100)}%</span>
          </div>
        </div>

        {/* Power Grid Integrity */}
        <div className="fp-metric-group">
          <div className="fp-metric-group__title">Power Grid (PDN) Integrity</div>
          <div className="fp-metric">
            <span className="fp-metric__label">VDD Net:</span>
            <span className={`fp-metric__value ${vddOpen ? 'fp-metric__value--error' : 'fp-metric__value--ok'}`} data-testid="metric-vdd-net">
              {vddOpen ? '⚠️ Open Net' : '✓ Continuous'}
            </span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">VSS Net:</span>
            <span className={`fp-metric__value ${vssOpen ? 'fp-metric__value--error' : 'fp-metric__value--ok'}`} data-testid="metric-vss-net">
              {vssOpen ? '⚠️ Open Net' : '✓ Continuous'}
            </span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">Missing Vias:</span>
            <span className={`fp-metric__value ${missingVias > 0 ? 'fp-metric__value--error' : 'fp-metric__value--ok'}`} data-testid="metric-missing-vias">
              {missingVias} dropped
            </span>
          </div>
          <div className="fp-metric">
            <span className="fp-metric__label">Est. IR-Drop:</span>
            <span className={`fp-metric__value ${maxIRDrop > 30 ? 'fp-metric__value--warn' : 'fp-metric__value--ok'}`} data-testid="metric-ir-drop">
              {maxIRDrop} mV
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
