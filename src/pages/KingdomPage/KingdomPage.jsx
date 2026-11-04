/**
 * KingdomPage.jsx
 * ================
 * Reusable kingdom page template — driven entirely by kingdomsData.js.
 * Renders any kingdom based on the :kingdomId URL parameter.
 * Features:
 * - Kingdom Hero & Stats
 * - Standalone Studio Lab Integration Link
 * - Main Concept Levels
 * - Stage Sanity Check Side Quests (Certified via real ruledeck evaluation)
 * - Interactive Sanity Check Verification Terminal Modal
 */

import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext.jsx';
import LevelCard from '../../components/LevelCard/LevelCard.jsx';
import {
  getKingdomStatus,
  getKingdomXP,
  isKingdomUnlocked,
  getKingdomSanityChecks,
  countPassedKingdomSanityChecks,
  areAllKingdomLevelsCompleted,
  areAllKingdomSanityChecksPassed,
  getSanityCheckStatus,
  isSanityCheckUnlocked,
  isSanityCheckPassed,
} from '../../logic/progressionEngine.js';
import { KINGDOMS } from '../../data/kingdomsData.js';
import { evaluateSanityCheck } from '../../engine/sanityCheckEngine.js';
import './KingdomPage.css';

export default function KingdomPage() {
  const { kingdomId } = useParams();
  const { player, passSanityCheck } = usePlayer();
  const [activeCheck, setActiveCheck] = useState(null);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simulationDone, setSimulationDone] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [simulationPassed, setSimulationPassed] = useState(true);
  const [isDefectMode, setIsDefectMode] = useState(false);

  // Find kingdom by ID from central data
  const kingdom = KINGDOMS.find((k) => k.id === kingdomId);

  // 404 → redirect to world map
  if (!kingdom) return <Navigate to="/world-map" replace />;

  const status = getKingdomStatus(player, kingdomId);
  const unlocked = isKingdomUnlocked(player, kingdomId);
  const kingdomXP = getKingdomXP(player, kingdomId);

  // Levels info
  const completedLevels = kingdom.levels.filter(
    (l) => player.levelProgress?.[l.id]?.completed
  ).length;
  const levelsDone = areAllKingdomLevelsCompleted(player, kingdomId);

  // Sanity checks info
  const sanityChecks = getKingdomSanityChecks(kingdomId);
  const totalSanity = sanityChecks.length;
  const passedSanity = countPassedKingdomSanityChecks(player, kingdomId);
  const allSanityPassed = areAllKingdomSanityChecksPassed(player, kingdomId);

  // Total weighted progress
  const totalItems = kingdom.levels.length + totalSanity;
  const completedItems = completedLevels + passedSanity;
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  // Next kingdom info
  const nextKingdom = KINGDOMS.find((k) => k.order === kingdom.order + 1);
  const prevKingdom = KINGDOMS.find((k) => k.order === kingdom.order - 1);
  const prevKingdomXP = prevKingdom ? getKingdomXP(player, prevKingdom.id) : 0;
  const xpNeeded = prevKingdom
    ? Math.max(0, prevKingdom.pointsToUnlockNext - prevKingdomXP)
    : 0;

  // Open interactive verification modal
  const handleOpenCheck = (check) => {
    setIsDefectMode(false);
    setActiveCheck(check);
    setRunningSimulation(false);
    const passed = isSanityCheckPassed(player, check.id);
    setSimulationDone(passed);
    setSimulationPassed(true);
    setSimulationLogs([]);
  };

  // Run EDA verification simulation
  const handleRunSimulation = () => {
    setRunningSimulation(true);
    setTimeout(() => {
      const result = evaluateSanityCheck(activeCheck.id, { injectDefect: isDefectMode });
      setSimulationLogs(result.logOutput || []);
      setSimulationPassed(result.passed);
      setRunningSimulation(false);
      setSimulationDone(true);
    }, 600);
  };

  // Sign off and certify check
  const handleCertifyCheck = () => {
    if (activeCheck && simulationPassed) {
      passSanityCheck(kingdom.id, activeCheck, activeCheck.xpReward);
      setActiveCheck(null);
    }
  };

  return (
    <div
      className="kingdom-page"
      style={{
        '--kingdom-gradient': kingdom.gradient,
        '--kingdom-color': kingdom.borderColor,
      }}
    >
      {/* Hero banner */}
      <div className="kingdom-page__hero">
        <div className="container kingdom-page__hero-inner">
          {/* Back button */}
          <Link to="/world-map" className="kingdom-page__back">
            ← Back to World Map
          </Link>

          <div className="kingdom-page__header">
            {/* Kingdom emoji */}
            <div className="kingdom-page__emoji-box">{kingdom.emoji}</div>

            <div style={{ flex: 1 }}>
              {/* Status badge */}
              <div style={{ marginBottom: '0.4rem' }}>
                {status === 'locked' && <span className="badge badge--locked">🔒 Locked</span>}
                {status === 'available' && <span className="badge badge--available">▶ In Progress</span>}
                {status === 'completed' && <span className="badge badge--completed">✓ Stage Certified</span>}
              </div>

              <h1 className="kingdom-page__title">{kingdom.name}</h1>
              <p className="kingdom-page__subtitle">{kingdom.subtitle}</p>
              <p className="kingdom-page__description">{kingdom.description}</p>

              {/* Subconcept chip */}
              <div className="kingdom-page__subconcept">
                🎯 Focus: {kingdom.subconcept}
              </div>
            </div>

            {/* Quick stats widget */}
            <div className="kingdom-page__stats-card">
              <div className="kingdom-page__stat-item">
                <span className="kingdom-page__stat-label">Kingdom XP</span>
                <span className="kingdom-page__stat-value">{kingdomXP} XP</span>
              </div>
              <div className="kingdom-page__stat-item">
                <span className="kingdom-page__stat-label">Levels</span>
                <span className="kingdom-page__stat-value">
                  {completedLevels}/{kingdom.levels.length}
                </span>
              </div>
              {totalSanity > 0 && (
                <div className="kingdom-page__stat-item">
                  <span className="kingdom-page__stat-label">Sanity Checks</span>
                  <span className="kingdom-page__stat-value">
                    {passedSanity}/{totalSanity}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Unlock warning if locked */}
        {!unlocked && (
          <div className="kingdom-page__lock-banner">
            <span style={{ fontSize: '2rem' }}>🔒</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>This Kingdom is Locked</h3>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Earn {xpNeeded} more XP in {prevKingdom?.name} and complete core lessons to unlock {kingdom.name}.
              </p>
            </div>
            <Link to={`/kingdom/${prevKingdom?.id}`} className="btn btn--primary">
              Go to {prevKingdom?.name}
            </Link>
          </div>
        )}

        {unlocked && (
          <>
            {/* Standalone Lab Cross-Link Card */}
            {kingdom.id === 'rtl-understanding' && (
              <div className="kingdom-external-lab-card">
                <div className="kingdom-external-lab-info">
                  <h3>🚀 Full Standalone RTL Playground Suite</h3>
                  <p>
                    Explore 8-bit ALUs, sequential registers, counters, and Moore/Mealy State Machines with Verilog generation in the full standalone laboratory.
                  </p>
                </div>
                <a
                  href="https://ppawar-7.github.io/rtl-playground/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  Open RTL Studio Lab ↗
                </a>
              </div>
            )}

            {(kingdom.id === 'cts' || kingdom.id === 'synthesis') && (
              <div className="kingdom-external-lab-card">
                <div className="kingdom-external-lab-info">
                  <h3>⏱ Static Timing Analysis (STA) Playground</h3>
                  <p>
                    Analyze setup and hold slacks, investigate physical clock skew, and experiment with PVT deratings in the standalone timing engine.
                  </p>
                </div>
                <a
                  href="https://ppawar-7.github.io/sta-playground/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  Open STA Timing Lab ↗
                </a>
              </div>
            )}

            {/* Progress bar */}
            <div className="kingdom-page__progress-section">
              <div className="kingdom-page__progress-header">
                <h2 style={{ fontSize: '1.1rem' }}>Stage Progress</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {progressPercent}% complete ({completedItems}/{totalItems} tasks)
                </span>
              </div>
              <div className="progress-bar" style={{ height: '12px' }}>
                <div
                  className={`progress-bar__fill ${status === 'completed' ? 'progress-bar__fill--green' : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Stage sign-off gatekeeper info */}
              {totalSanity > 0 && (
                <div className="kingdom-page__gatekeeper-note">
                  <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                  <div>
                    <strong>Stage Sign-Off:</strong> Complete all core levels above, then verify all {totalSanity} Sanity Checks
                    to earn full {kingdom.name} stage certification and unlock the completion bonus!
                  </div>
                </div>
              )}
            </div>

            {/* ─── MAIN LEVELS SECTION ──────────────────────── */}
            <div className="kingdom-page__section-wrapper">
              <div className="kingdom-page__section-title-row">
                <h2 className="kingdom-page__levels-title">
                  📚 Part 1: Core Concept Levels
                </h2>
                <span className="badge badge--available">
                  {completedLevels}/{kingdom.levels.length} Complete
                </span>
              </div>

              <div className="kingdom-page__levels-list">
                {kingdom.levels.map((level) => (
                  <LevelCard key={level.id} kingdom={kingdom} level={level} />
                ))}
              </div>
            </div>

            {/* ─── SANITY CHECK SIDE QUESTS SECTION ─────────── */}
            {totalSanity > 0 && (
              <div className="kingdom-page__sanity-section">
                <div className="kingdom-page__section-title-row">
                  <div>
                    <h2 className="kingdom-page__sanity-title">
                      🛡️ Part 2: Stage Sanity Checks (Side Quests)
                    </h2>
                    <p className="kingdom-page__sanity-subtitle">
                      Complete each verification audit in order to certify stage sign-off and earn bonus XP.
                    </p>
                  </div>
                  <span className={`badge ${allSanityPassed ? 'badge--completed' : 'badge--available'}`}>
                    {allSanityPassed ? '✓ All Passed' : `${passedSanity}/${totalSanity} Passed`}
                  </span>
                </div>

                {!levelsDone && (
                  <div className="kingdom-page__sanity-locked-alert">
                    <span>🔒</span>
                    <div>
                      <strong>Sanity Checks on standby:</strong> Finish all {kingdom.levels.length} core levels
                      above to generate the design database and activate these sign-off audits!
                    </div>
                  </div>
                )}

                <div className="kingdom-page__sanity-grid">
                  {sanityChecks.map((check) => {
                    const checkStatus = getSanityCheckStatus(player, kingdom.id, check);
                    const isPassed = checkStatus === 'passed';
                    const isUnlocked = checkStatus === 'available';

                    return (
                      <div
                        key={check.id}
                        className={`sanity-card ${isPassed ? 'sanity-card--passed' : ''} ${!isUnlocked && !isPassed ? 'sanity-card--locked' : ''}`}
                      >
                        <div className="sanity-card__header">
                          <span className="sanity-card__icon">{check.icon}</span>
                          <span className="sanity-card__category">{check.category}</span>
                          {isPassed && <span className="sanity-card__badge-pass">✓ CERTIFIED</span>}
                          {!isUnlocked && !isPassed && <span className="sanity-card__badge-lock">🔒 LOCKED</span>}
                        </div>

                        <h3 className="sanity-card__title">{check.name}</h3>
                        <p className="sanity-card__full-name">{check.fullName}</p>
                        <p className="sanity-card__description">{check.description}</p>

                        <div className="sanity-card__command">
                          <code>$ {check.command}</code>
                        </div>

                        <div className="sanity-card__footer">
                          <span className="sanity-card__reward">⭐ +{check.xpReward} XP</span>
                          {isUnlocked && (
                            <button
                              className="btn btn--secondary btn--sm"
                              onClick={() => handleOpenCheck(check)}
                            >
                              ▶ Inspect Audit
                            </button>
                          )}
                          {isPassed && (
                            <button
                              className="btn btn--secondary btn--sm"
                              onClick={() => handleOpenCheck(check)}
                            >
                              ✓ View Sign-Off
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── SANITY CHECK VERIFICATION TERMINAL MODAL ─── */}
      {activeCheck && (
        <div className="sanity-modal-overlay" onClick={() => setActiveCheck(null)}>
          <div className="sanity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sanity-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>{activeCheck.icon}</span>
                <div>
                  <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
                    Sanity Check: {activeCheck.name}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {kingdom.name} · Step #{activeCheck.order} · {activeCheck.category}
                  </span>
                </div>
              </div>
              <button
                className="sanity-modal__close"
                onClick={() => setActiveCheck(null)}
              >
                ✕
              </button>
            </div>

            <div className="sanity-modal__body">
              <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                {activeCheck.description}
              </p>

              {/* Educational Disclosure */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <span>
                  <strong>Educational Rule Check:</strong> Evaluates closed-form physical equations and boundary rules for educational pedagogy. Not a commercial foundry sign-off tool.
                </span>
              </div>

              {/* Defect Injection Audit Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '8px 14px',
                background: isDefectMode ? '#fef2f2' : '#f1f5f9',
                border: isDefectMode ? '1px solid #fecaca' : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.86rem',
                transition: 'all 0.2s ease',
              }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Audit Input Mode:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: !isDefectMode ? 600 : 400, color: !isDefectMode ? '#1e293b' : '#64748b' }}>
                  <input
                    type="radio"
                    name="sanity-defect-toggle"
                    checked={!isDefectMode}
                    onChange={() => { setIsDefectMode(false); setSimulationDone(false); }}
                  />
                  <span>✓ Nominal Clean Design</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: isDefectMode ? 600 : 400, color: isDefectMode ? '#b91c1c' : '#64748b' }}>
                  <input
                    type="radio"
                    name="sanity-defect-toggle"
                    checked={isDefectMode}
                    onChange={() => { setIsDefectMode(true); setSimulationDone(false); }}
                  />
                  <span>⚠️ Inject Physical Defect (DRC Audit Drill)</span>
                </label>
              </div>

              {/* EDA Verification Terminal */}
              <div className="sanity-terminal">
                <div className="sanity-terminal__titlebar">
                  <span className="sanity-terminal__dot sanity-terminal__dot--red" />
                  <span className="sanity-terminal__dot sanity-terminal__dot--yellow" />
                  <span className="sanity-terminal__dot sanity-terminal__dot--green" />
                  <span className="sanity-terminal__title">Educational Rule Check Terminal — {activeCheck.fullName}</span>
                </div>
                <div className="sanity-terminal__content">
                  <div className="sanity-terminal__line">
                    <span className="sanity-terminal__prompt">$</span> {activeCheck.command}
                  </div>

                  {runningSimulation && (
                    <div className="sanity-terminal__line sanity-terminal__line--amber">
                      [EXEC] Simulating EDA command evaluation... please wait...
                    </div>
                  )}

                  {simulationDone && (
                    <>
                      <div className="sanity-terminal__line sanity-terminal__line--dim">
                        [INIT] Command: {activeCheck.command}
                      </div>
                      <div className="sanity-terminal__line sanity-terminal__line--dim">
                        [SCOPE] Evaluating physical design ruledeck criteria: {activeCheck.criteria}
                      </div>
                      {simulationLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`sanity-terminal__line ${
                            log.includes('PASSED') || log.includes('Clean') || log.includes('MET')
                              ? 'sanity-terminal__line--green'
                              : log.includes('VIOLATION') || log.includes('OVERFLOW') || log.includes('FAIL')
                              ? 'sanity-terminal__line--red'
                              : 'sanity-terminal__line--cyan'
                          }`}
                        >
                          {log}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons with strict engineering validation */}
              <div className="sanity-modal__actions">
                {!simulationDone ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--lg w-full"
                    onClick={handleRunSimulation}
                    disabled={runningSimulation}
                  >
                    {runningSimulation ? '⏳ Running Ruledeck Verification...' : '⚡ Run Verification Audit'}
                  </button>
                ) : isSanityCheckPassed(player, activeCheck.id) ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div className="sanity-modal__passed-notice" style={{ marginBottom: '0.75rem' }}>
                      ✓ <strong>Stage Check Certified:</strong> +{activeCheck.xpReward} XP earned for this verification.
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary btn--lg w-full"
                      onClick={() => setActiveCheck(null)}
                    >
                      Close Audit Window
                    </button>
                  </div>
                ) : simulationPassed ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div className="sanity-modal__passed-notice" style={{ marginBottom: '0.75rem' }}>
                      ✓ <strong>Ruledeck Passed:</strong> Physical design criteria verified with zero violations.
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary btn--lg w-full"
                      onClick={handleCertifyCheck}
                    >
                      🛡️ Sign-Off & Certify Stage Check (+{activeCheck.xpReward} XP)
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#b91c1c',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      marginBottom: '0.75rem',
                      lineHeight: 1.4,
                    }}>
                      ⚠️ <strong>Ruledeck Violation:</strong> Design failed physical verification criteria. Check diagnostics above.
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary btn--lg w-full"
                      onClick={() => setActiveCheck(null)}
                    >
                      Close & Revise Design
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
