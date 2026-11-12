/**
 * CTSAnalysisPanel.jsx
 * =====================
 * Bottom Analytics and Diagnostics Dock for CTS Studio 1.0.
 * Tabs:
 * 1. 📊 Timing & Skew
 * 2. ⏱️ Setup & Hold Slack
 * 3. ⚡ Power & Area
 * 4. 🛡️ Diagnostics & DRC
 */

import React, { useState } from 'react';

export default function CTSAnalysisPanel({ project, solution }) {
  const [activeTab, setActiveTab] = useState('timing');

  const skewBudget = project.constraints?.maxSkewBudgetPs || 50;
  const latencyBudget = project.constraints?.maxLatencyBudgetPs || 400;

  const isSkewMet = (solution?.skewPs ?? 999) <= skewBudget;
  const isLatencyMet = (solution?.maxArrivalPs ?? 999) <= latencyBudget;
  const violations = solution?.diagnostics?.violations || [];

  return (
    <footer className="cts-dock" role="region" aria-label="CTS Analytics Dock">
      {/* Tab Navigation Headers */}
      <div className="cts-dock__tabs">
        <button
          className={`cts-dock__tab ${activeTab === 'timing' ? 'cts-dock__tab--active' : ''}`}
          onClick={() => setActiveTab('timing')}
        >
          📊 Timing & Skew
        </button>
        <button
          className={`cts-dock__tab ${activeTab === 'setuphold' ? 'cts-dock__tab--active' : ''}`}
          onClick={() => setActiveTab('setuphold')}
        >
          ⏱️ Setup & Hold Slack ({solution?.dataPaths?.length || 0})
        </button>
        <button
          className={`cts-dock__tab ${activeTab === 'power' ? 'cts-dock__tab--active' : ''}`}
          onClick={() => setActiveTab('power')}
        >
          ⚡ Power & Area
        </button>
        <button
          className={`cts-dock__tab ${activeTab === 'drc' ? 'cts-dock__tab--active' : ''}`}
          onClick={() => setActiveTab('drc')}
          style={{ position: 'relative' }}
        >
          🛡️ Diagnostics & DRC
          {violations.length > 0 && (
            <span
              style={{
                marginLeft: '0.4rem',
                background: '#ef4444',
                color: '#fff',
                padding: '0.1rem 0.35rem',
                borderRadius: '8px',
                fontSize: '0.65rem',
                fontWeight: 800,
              }}
            >
              {violations.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="cts-dock__content">
        {/* TAB 1: TIMING & SKEW */}
        {activeTab === 'timing' && (
          <div>
            <div className="cts-kpi-grid">
              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Global Clock Skew</span>
                <span className="cts-kpi-card__value" style={{ color: isSkewMet ? '#34d399' : '#f87171' }}>
                  {solution?.skewPs ?? 0} ps
                </span>
                <span className={`cts-kpi-card__badge ${isSkewMet ? 'cts-badge--pass' : 'cts-badge--fail'}`}>
                  Target: &lt;= {skewBudget} ps [{isSkewMet ? 'PASS' : 'VIOLATION'}]
                </span>
              </div>

              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Min Insertion Delay</span>
                <span className="cts-kpi-card__value">{solution?.minArrivalPs ?? 0} ps</span>
                <span className="cts-kpi-card__badge cts-badge--pass">Early Clock Sink</span>
              </div>

              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Max Insertion Delay</span>
                <span className="cts-kpi-card__value" style={{ color: isLatencyMet ? '#38bdf8' : '#f87171' }}>
                  {solution?.maxArrivalPs ?? 0} ps
                </span>
                <span className={`cts-kpi-card__badge ${isLatencyMet ? 'cts-badge--pass' : 'cts-badge--fail'}`}>
                  Budget: &lt;= {latencyBudget} ps [{isLatencyMet ? 'PASS' : 'VIOLATION'}]
                </span>
              </div>

              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Tree Depth</span>
                <span className="cts-kpi-card__value">{solution?.metrics?.treeDepth ?? 1}</span>
                <span className="cts-kpi-card__badge cts-badge--pass">Repeater Stages</span>
              </div>
            </div>

            {/* Sinks Table */}
            <div style={{ maxHeight: '110px', overflowY: 'auto' }}>
              <table className="cts-table">
                <thead>
                  <tr>
                    <th>Sink Register</th>
                    <th>Location (X, Y)</th>
                    <th>Load Cap</th>
                    <th>Clock Arrival</th>
                    <th>Transition</th>
                    <th>Connection Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(solution?.sinks || []).map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.id}</td>
                      <td>({s.x}, {s.y}) µm</td>
                      <td>{((s.loadCapPf || 0.004) * 1000).toFixed(1)} fF</td>
                      <td style={{ color: s.isReached ? '#38bdf8' : '#f87171', fontWeight: 700 }}>
                        {s.isReached ? `${s.arrivalPs} ps` : 'DISCONNECTED'}
                      </td>
                      <td>{s.isReached ? `${s.transitionPs} ps` : '--'}</td>
                      <td>
                        <span className={`cts-kpi-card__badge ${s.isReached ? 'cts-badge--pass' : 'cts-badge--fail'}`}>
                          {s.isReached ? 'REACHED' : 'UNREACHED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SETUP & HOLD SLACK */}
        {activeTab === 'setuphold' && (
          <div>
            {(!solution?.dataPaths || solution.dataPaths.length === 0) ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                No inter-sink synchronous data paths configured for this clock tree design.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  💡 <strong>Timing Principle:</strong> Clock skew $\Delta t = t_{'{'}capture{'}'} - t_{'{'}launch{'}'}$. Positive skew increases setup slack but tightens hold slack!
                </div>
                <table className="cts-table">
                  <thead>
                    <tr>
                      <th>Data Path</th>
                      <th>Launch ➔ Capture</th>
                      <th>Clock Skew</th>
                      <th>Setup Slack</th>
                      <th>Hold Slack</th>
                      <th>Setup Signoff</th>
                      <th>Hold Signoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solution.dataPaths.map((dp) => (
                      <tr key={dp.id}>
                        <td style={{ fontWeight: 600 }}>{dp.id}</td>
                        <td>{dp.fromSinkId} ➔ {dp.toSinkId}</td>
                        <td style={{ color: dp.skewPs >= 0 ? '#38bdf8' : '#f59e0b', fontWeight: 700 }}>
                          {dp.skewPs >= 0 ? `+${dp.skewPs}` : dp.skewPs} ps
                        </td>
                        <td style={{ color: dp.setupPassed ? '#34d399' : '#f87171', fontWeight: 700 }}>
                          {dp.setupSlackPs} ps
                        </td>
                        <td style={{ color: dp.holdPassed ? '#34d399' : '#f87171', fontWeight: 700 }}>
                          {dp.holdSlackPs} ps
                        </td>
                        <td>
                          <span className={`cts-kpi-card__badge ${dp.setupPassed ? 'cts-badge--pass' : 'cts-badge--fail'}`}>
                            {dp.setupPassed ? 'MET' : 'VIOLATION'}
                          </span>
                        </td>
                        <td>
                          <span className={`cts-kpi-card__badge ${dp.holdPassed ? 'cts-badge--pass' : 'cts-badge--fail'}`}>
                            {dp.holdPassed ? 'MET' : 'VIOLATION'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POWER & AREA */}
        {activeTab === 'power' && (
          <div>
            <div className="cts-kpi-grid">
              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Dynamic Power</span>
                <span className="cts-kpi-card__value" style={{ color: '#38bdf8' }}>
                  {solution?.dynamicPowerMw ?? 0} mW
                </span>
                <span className="cts-kpi-card__badge cts-badge--pass">P = α·C·V²·f</span>
              </div>

              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Static Leakage</span>
                <span className="cts-kpi-card__value">
                  {solution?.leakagePowerMw !== undefined ? (solution.leakagePowerMw * 1000).toFixed(1) : 0} µW
                </span>
                <span className="cts-kpi-card__badge cts-badge--pass">Sub-threshold</span>
              </div>

              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Total Wirelength</span>
                <span className="cts-kpi-card__value">{solution?.wirelengthUm ?? 0} µm</span>
                <span className="cts-kpi-card__badge cts-badge--pass">Clock Routing</span>
              </div>

              <div className="cts-kpi-card">
                <span className="cts-kpi-card__label">Buffer Area</span>
                <span className="cts-kpi-card__value">{solution?.bufferAreaUm2 ?? 0} µm²</span>
                <span className="cts-kpi-card__badge cts-badge--pass">{project.buffers.length} Repeaters</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIAGNOSTICS & DRC */}
        {activeTab === 'drc' && (
          <div>
            {violations.length === 0 ? (
              <div style={{ padding: '1rem', color: '#34d399', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                ✅ DRC Clean: No maximum fanout, transition slew, capacitance, or blockage collisions detected.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {violations.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#1c131d',
                      borderLeft: '4px solid #ef4444',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '0 4px 4px 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="cts-kpi-card__badge cts-badge--fail">{v.type}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fca5a5' }}>{v.message}</span>
                    </div>
                    {v.suggestion && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        💡 <em>Suggestion:</em> {v.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
