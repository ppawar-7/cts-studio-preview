/**
 * CTSCandidateCompareModal.jsx
 * =============================
 * Side-by-side candidate comparison and trade-off explorer for CTS Studio 1.0.
 */

import React, { useState } from 'react';
import { solveClockTreeElmore } from '../../../engine/ctsEngine.js';
import { saveCTSProjectToStorage, loadCTSProjectFromStorage } from '../../../engine/ctsProjectModel.js';

export default function CTSCandidateCompareModal({
  currentProject,
  currentSolution,
  onClose,
  onApplyCandidate,
}) {
  const [candidate1, setCandidate1] = useState(() => loadCTSProjectFromStorage('1'));
  const [candidate2, setCandidate2] = useState(() => loadCTSProjectFromStorage('2'));

  const sol1 = candidate1 ? solveClockTreeElmore(candidate1) : null;
  const sol2 = candidate2 ? solveClockTreeElmore(candidate2) : null;

  const handleSaveAsCandidate = (slot) => {
    saveCTSProjectToStorage(currentProject, String(slot));
    if (slot === 1) setCandidate1(JSON.parse(JSON.stringify(currentProject)));
    if (slot === 2) setCandidate2(JSON.parse(JSON.stringify(currentProject)));
  };

  return (
    <div className="cts-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="compare-title">
      <div className="cts-modal" style={{ maxWidth: '850px' }}>
        <div className="cts-modal__header">
          <span id="compare-title">⚖️ Clock Tree Candidate Trade-Off Comparison</span>
          <button
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="cts-modal__body">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className="cts-btn" onClick={() => handleSaveAsCandidate(1)}>
              📌 Snapshot to Candidate 1
            </button>
            <button className="cts-btn" onClick={() => handleSaveAsCandidate(2)}>
              📌 Snapshot to Candidate 2
            </button>
          </div>

          <table className="cts-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Design Metric</th>
                <th style={{ width: '25%', background: '#172554', color: '#60a5fa' }}>Current Workspace</th>
                <th style={{ width: '25%' }}>Candidate 1</th>
                <th style={{ width: '25%' }}>Candidate 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Global Skew (Target &lt;= 50ps)</td>
                <td style={{ fontWeight: 700, color: (currentSolution?.skewPs ?? 0) <= 50 ? '#34d399' : '#f87171' }}>
                  {currentSolution?.skewPs ?? 0} ps
                </td>
                <td>{sol1 ? `${sol1.skewPs} ps` : '--'}</td>
                <td>{sol2 ? `${sol2.skewPs} ps` : '--'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Max Latency (Budget &lt;= 400ps)</td>
                <td>{currentSolution?.maxArrivalPs ?? 0} ps</td>
                <td>{sol1 ? `${sol1.maxArrivalPs} ps` : '--'}</td>
                <td>{sol2 ? `${sol2.maxArrivalPs} ps` : '--'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Min Insertion Delay</td>
                <td>{currentSolution?.minArrivalPs ?? 0} ps</td>
                <td>{sol1 ? `${sol1.minArrivalPs} ps` : '--'}</td>
                <td>{sol2 ? `${sol2.minArrivalPs} ps` : '--'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Buffer / Repeater Count</td>
                <td>{currentProject.buffers.length}</td>
                <td>{candidate1 ? candidate1.buffers.length : '--'}</td>
                <td>{candidate2 ? candidate2.buffers.length : '--'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Total Wirelength</td>
                <td>{currentSolution?.wirelengthUm ?? 0} µm</td>
                <td>{sol1 ? `${sol1.wirelengthUm} µm` : '--'}</td>
                <td>{sol2 ? `${sol2.wirelengthUm} µm` : '--'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Dynamic Power (P_dyn)</td>
                <td>{currentSolution?.dynamicPowerMw ?? 0} mW</td>
                <td>{sol1 ? `${sol1.dynamicPowerMw} mW` : '--'}</td>
                <td>{sol2 ? `${sol2.dynamicPowerMw} mW` : '--'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>DRC Violations</td>
                <td style={{ fontWeight: 700, color: (currentSolution?.diagnostics?.violations?.length || 0) === 0 ? '#34d399' : '#f87171' }}>
                  {currentSolution?.diagnostics?.violations?.length || 0}
                </td>
                <td>{sol1 ? sol1.diagnostics?.violations?.length || 0 : '--'}</td>
                <td>{sol2 ? sol2.diagnostics?.violations?.length || 0 : '--'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Action</td>
                <td><em>(Active)</em></td>
                <td>
                  {candidate1 && (
                    <button
                      className="cts-btn cts-btn--primary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => {
                        onApplyCandidate(candidate1);
                        onClose();
                      }}
                    >
                      Load Candidate 1
                    </button>
                  )}
                </td>
                <td>
                  {candidate2 && (
                    <button
                      className="cts-btn cts-btn--primary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => {
                        onApplyCandidate(candidate2);
                        onClose();
                      }}
                    >
                      Load Candidate 2
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="cts-modal__footer">
          <button className="cts-btn cts-btn--outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
