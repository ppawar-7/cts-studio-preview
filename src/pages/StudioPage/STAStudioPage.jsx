/**
 * STAStudioPage.jsx
 * ==================
 * Full-scale native embedded view of the standalone Static Timing Analysis (STA) Playground.
 * Integrates the graph-based timing path tracer, setup/hold slack histograms,
 * and PVT operating corner analyzer directly within Game-Site.
 */

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './StudioPage.css';

export default function STAStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stage = searchParams.get('stage') || 'cts';
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stages = [
    {
      id: 'synthesis',
      label: 'Synthesis (Pre-Layout SDC)',
      emoji: '⚗️',
      kingdom: 'synthesis',
      focusTitle: 'Pre-Layout Timing Constraints (SDC)',
      focusDesc: 'During Synthesis, STA estimates gate delays from standard-cell Liberty (.lib) lookup tables using wire-load models (WLM). The primary goal is achieving zero setup slack (WNS >= 0) at target clock frequency before physical cell locations exist.',
      metricTarget: 'Target Setup Slack: >= 0.00 ns (Zero WNS violation)',
    },
    {
      id: 'placement',
      label: 'Placement (Wire Estimates)',
      emoji: '📍',
      kingdom: 'placement',
      focusTitle: 'Placement Timing & Wire Delay Estimates',
      focusDesc: 'After standard cells are snapped to row sites, STA replaces statistical wire-load models with Steiner tree / Manhattan wirelength estimations (FLUTE). Placement optimizers perform timing-driven cell clustering and critical path buffering.',
      metricTarget: 'Target Wirelength HPWL: Minimize critical net resistance/capacitance',
    },
    {
      id: 'cts',
      label: 'Post-CTS (Real Skew & Latency)',
      emoji: '⏱️',
      kingdom: 'cts',
      focusTitle: 'Post-CTS Propagated Clock Timing Sign-Off',
      focusDesc: 'Once the clock tree is built, ideal clock networks are replaced with propagated clocks. STA calculates actual insertion delay, launch/capture clock skew, and validates both Setup and Hold timing across all process corners.',
      metricTarget: 'Target Clock Skew: <= 30 ps | Target Insertion Delay: <= 300 ps',
    },
    {
      id: 'routing',
      label: 'Post-Route (SPEF Extraction)',
      emoji: '🛣️',
      kingdom: 'routing',
      focusTitle: 'Post-Route Parasitic SPEF Sign-Off',
      focusDesc: 'With detailed routing wires and vias materialized, parasitics are extracted into standard SPEF files. STA computes distributed RC Elmore delays and verifies signal integrity crosstalk glitch noise on victim nets.',
      metricTarget: 'Target Sign-off WNS: >= 0 ps | Victim Noise Glitch: <= 50 mV',
    },
  ];

  const currentStage = stages.find((s) => s.id === stage) || stages[2];

  return (
    <div className={`studio-page ${isFullscreen ? 'studio-page--fullscreen' : ''}`}>
      {/* Top Header & Context Bar */}
      <div className="studio-page__header">
        <div className="container studio-page__header-inner">
          <div className="studio-page__title-area">
            <Link to={`/kingdom/${currentStage.kingdom}`} className="studio-page__back-link">
              ← Return to {currentStage.label.split(' ')[0]} Kingdom
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <h1 className="studio-page__title">⏱️ Static Timing Analysis (STA) Studio (Integrated)</h1>
              <span className="badge badge--available">Full Standalone Suite</span>
            </div>
            <p className="studio-page__subtitle">
              Native embedded environment running the complete multi-corner timing graph analyzer, setup/hold slack calculator, and PVT derating engine locally with zero cloud dependencies.
            </p>
          </div>

          <div className="studio-page__actions">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? '↙️ Collapse' : '⛶ Fullscreen'}
            </button>
            <a
              href="https://ppawar-7.github.io/sta-playground/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--sm"
              title="Open standalone deployment in a new browser tab"
            >
              External Tab ↗
            </a>
          </div>
        </div>
      </div>

      {/* Stage Context Bar */}
      <div className="studio-page__tabs-bar">
        <div className="container studio-page__tabs-inner">
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            Educational Timing Context:
          </span>
          {stages.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`studio-tab-btn ${stage === s.id ? 'active' : ''}`}
              onClick={() => setSearchParams({ stage: s.id })}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage-Specific Educational Context Guide Banner */}
      {!isFullscreen && (
        <div className="container" style={{ paddingTop: '0.75rem', paddingBottom: '0.5rem' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid #1e293b',
            borderLeft: '4px solid #38bdf8',
            borderRadius: '6px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>
                {currentStage.emoji} Stage Sign-off Focus: {currentStage.focusTitle}
              </strong>
              <span className="badge badge--available" style={{ fontSize: '0.75rem' }}>
                {currentStage.metricTarget}
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
              {currentStage.focusDesc}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              ℹ️ Note: The embedded laboratory below is the comprehensive multi-corner STA simulator. Use the graph controls to inspect timing paths and examine PVT derating margins.
            </span>
          </div>
        </div>
      )}

      {/* Embedded Studio Iframe Container */}
      <div className="studio-page__canvas-container">
        <iframe
          src="/studios/sta/index.html"
          title="STA Playground Embedded Studio"
          className="studio-page__iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
        />
      </div>

      {/* Disambiguation & Architecture Footnote */}
      {!isFullscreen && (
        <div className="container studio-page__footer-note">
          <div className="studio-disclosure-box">
            <strong>Important ASIC Engineering Distinction:</strong>
            <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem' }}>
              <li>
                <strong>Clock Tree Synthesis (CTS)</strong> builds the physical clock distribution network (buffer insertion, clock mesh, and H-Tree balancing).
              </li>
              <li>
                <strong>Static Timing Analysis (STA)</strong> checks setup and hold constraints across extreme PVT corners. STA verifies timing; it does not construct clock trees.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
