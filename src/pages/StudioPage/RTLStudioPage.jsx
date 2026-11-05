/**
 * RTLStudioPage.jsx
 * ==================
 * Full-scale native embedded view of the standalone RTL Playground.
 * Integrates the complete 24-lesson digital logic simulator, waveform generator,
 * ALU/datapath designer, and FSM studio directly within the Game-Site interface.
 */

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './StudioPage.css';

export default function RTLStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'fundamentals';
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derive iframe URL based on active studio tab
  const getIframeSrc = () => {
    switch (currentTab) {
      case 'datapath':
        return '/studios/rtl/advanced-lab/index.html?tab=datapath';
      case 'sequential':
        return '/studios/rtl/advanced-lab/index.html?tab=sequential';
      case 'fsm':
        return '/studios/rtl/advanced-lab/index.html?tab=fsm';
      case 'lessons':
        return '/studios/rtl/advanced-lab/index.html?tab=lessons';
      case 'fundamentals':
      default:
        return '/studios/rtl/index.html';
    }
  };

  const tabs = [
    { id: 'fundamentals', label: 'Logic Fundamentals', emoji: '🔌' },
    { id: 'datapath', label: 'Datapaths & 8-Bit ALU', emoji: '🧮' },
    { id: 'sequential', label: 'Registers & Counters', emoji: '⏱️' },
    { id: 'fsm', label: 'FSM Studio', emoji: '🔄' },
    { id: 'lessons', label: '24-Lesson Curriculum', emoji: '📚' },
  ];

  return (
    <div className={`studio-page ${isFullscreen ? 'studio-page--fullscreen' : ''}`}>
      {/* Top Breadcrumb & Control Bar */}
      <div className="studio-page__header">
        <div className="container studio-page__header-inner">
          <div className="studio-page__title-area">
            <Link to="/kingdom/rtl-understanding" className="studio-page__back-link">
              ← Return to RTL Kingdom
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <h1 className="studio-page__title">⚡ RTL Playground Studio (Integrated)</h1>
              <span className="badge badge--available">Full Standalone Suite</span>
            </div>
            <p className="studio-page__subtitle">
              Native embedded environment running the complete 24-lesson simulator, waveform viewer, and Verilog generation engine locally with zero cloud dependencies.
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
              href="https://ppawar-7.github.io/rtl-playground/"
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

      {/* Tab Navigation Toolbar */}
      <div className="studio-page__tabs-bar">
        <div className="container studio-page__tabs-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`studio-tab-btn ${currentTab === tab.id ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: tab.id })}
            >
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Studio Iframe Container */}
      <div className="studio-page__canvas-container">
        <iframe
          src={getIframeSrc()}
          title="RTL Playground Embedded Studio"
          className="studio-page__iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
        />
      </div>

      {/* Architectural Integration Footnote */}
      {!isFullscreen && (
        <div className="container studio-page__footer-note">
          <div className="studio-disclosure-box">
            <strong>Architecture Note:</strong> Game-Site's 5 core RTL levels serve as introductory guided assessments with deterministic scoring. This integrated studio hosts the full open-ended reference suite (schematic capture, live waveforms, and multi-bit vectors) served locally from <code>/studios/rtl/</code>.
          </div>
        </div>
      )}
    </div>
  );
}
