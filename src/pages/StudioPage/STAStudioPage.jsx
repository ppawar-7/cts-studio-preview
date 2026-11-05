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
    { id: 'synthesis', label: 'Synthesis (Pre-Layout SDC)', emoji: '⚗️', kingdom: 'synthesis' },
    { id: 'placement', label: 'Placement (Wire Estimates)', emoji: '📍', kingdom: 'placement' },
    { id: 'cts', label: 'Post-CTS (Real Skew & Latency)', emoji: '⏱️', kingdom: 'cts' },
    { id: 'routing', label: 'Post-Route (SPEF Extraction)', emoji: '🛣️', kingdom: 'routing' },
  ];

  const currentStage = stages.find((s) => s.id === stage) || stages[2];

  return (
    <div className={`studio-page ${isFullscreen ? 'studio-page--fullscreen' : ''}`}>
      {/* Top Header & Context Bar */}
      <div className="studio-page__header">
        <div className="container studio-page__header-inner">
          <div className="studio-page__title-area">
            <Link to={`/kingdom/${currentStage.kingdom}`} className="studio-page__back-link">
              ← Return to {stages.find((s) => s.id === stage)?.label.split(' ')[0] || 'CTS'} Kingdom
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
            Timing Sign-Off Stage:
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
