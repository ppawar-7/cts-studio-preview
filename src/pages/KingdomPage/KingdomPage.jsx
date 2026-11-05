/**
 * KingdomPage.jsx
 * ================
 * Reusable kingdom page template — driven entirely by kingdomsData.js.
 * Renders any kingdom based on the :kingdomId URL parameter.
 * Features:
 * - Kingdom Hero & Stats
 * - Native Integrated Studio Lab Workspace (Inline & Dedicated Routes)
 * - Main Concept Levels
 * - Stage Sanity Check Side Quests (Validating Real Student Designs)
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
import { getStudentDesignForSanityCheck } from '../../logic/studentDesignContext.js';
import './KingdomPage.css';

export default function KingdomPage() {
  const { kingdomId } = useParams();
  const { player, passSanityCheck } = usePlayer();
  const [activeCheck, setActiveCheck] = useState(null);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simulationDone, setSimulationDone] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [simulationPassed, setSimulationPassed] = useState(true);
  const [simulationCanCertify, setSimulationCanCertify] = useState(false);
  
  // Sanity check audit modes: 'student' (genuine design) vs 'demo' (preset drill)
  const [auditMode, setAuditMode] = useState('student');
  const [demoDefect, setDemoDefect] = useState(false);
  const [studentAuditInfo, setStudentAuditInfo] = useState(null);

  // In-page embedded studio workspace toggle
  const [showInlineStudio, setShowInlineStudio] = useState(false);

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
    const auditInfo = getStudentDesignForSanityCheck(player, check.id);
    setStudentAuditInfo(auditInfo);
    setAuditMode(auditInfo?.isPracticeOnly ? 'demo' : 'student');
    setDemoDefect(false);
    setActiveCheck(check);
    setRunningSimulation(false);

    const alreadyPassed = isSanityCheckPassed(player, check.id);
    setSimulationDone(alreadyPassed);
    setSimulationPassed(true);
    setSimulationCanCertify(alreadyPassed && !auditInfo?.isPracticeOnly);
    setSimulationLogs([]);
  };

  // Run EDA verification simulation
  const handleRunSimulation = () => {
    setRunningSimulation(true);
    setTimeout(() => {
      let result;
      if (auditMode === 'student') {
        result = evaluateSanityCheck(activeCheck.id, {
          isStudentDesign: true,
          hasStudentDesign: Boolean(studentAuditInfo?.canCertify && !studentAuditInfo?.isPracticeOnly),
          reason: studentAuditInfo?.reason,
          designData: studentAuditInfo?.designData || {},
        });
      } else {
        result = evaluateSanityCheck(activeCheck.id, {
          isStudentDesign: false,
          injectDefect: demoDefect,
        });
      }

      setSimulationLogs(result.logOutput || []);
      setSimulationPassed(result.passed);
      setSimulationCanCertify(result.canCertify);
      setRunningSimulation(false);
      setSimulationDone(true);
    }, 500);
  };

  // Sign off and certify check
  const handleCertifyCheck = () => {
    if (activeCheck && simulationPassed && simulationCanCertify) {
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

        {/* Unlocked content */}
        {unlocked && (
          <>
            {/* Integrated Studio Laboratory Workspace Card */}
            {kingdom.id === 'rtl-understanding' && (
              <div className="kingdom-external-lab-card">
                <div className="kingdom-external-lab-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3>⚡ RTL Playground Studio (Integrated Suite)</h3>
                    <span className="badge badge--available">Native Embedding</span>
                  </div>
                  <p>
                    Open-ended circuit creation, waveform viewer, 8-bit ALU/datapath designer, and Moore/Mealy FSM studio across 24 lessons.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setShowInlineStudio(!showInlineStudio)}
                  >
                    {showInlineStudio ? '▲ Collapse In-Page Studio' : '⚡ Open In-Page Studio'}
                  </button>
                  <Link to="/studio/rtl" className="btn btn--secondary">
                    🖥️ Dedicated Studio Page
                  </Link>
                  <a
                    href="https://ppawar-7.github.io/rtl-playground/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost"
                  >
                    External Tab ↗
                  </a>
                </div>

                {/* Collapsible Inline Studio Iframe */}
                {showInlineStudio && (
                  <div style={{ width: '100%', marginTop: '1.25rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                    <iframe
                      src="/studios/rtl/index.html"
                      title="RTL Playground In-Page Studio"
                      style={{ width: '100%', height: '700px', border: 'none', display: 'block', background: '#050811' }}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                    />
                  </div>
                )}
              </div>
            )}

            {(kingdom.id === 'synthesis' || kingdom.id === 'placement' || kingdom.id === 'cts' || kingdom.id === 'routing') && (
              <div className="kingdom-external-lab-card">
                <div className="kingdom-external-lab-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3>⏱️ Static Timing Analysis (STA) Studio (Integrated Suite)</h3>
                    <span className="badge badge--available">Native Embedding</span>
                  </div>
                  <p>
                    {kingdom.id === 'synthesis' && 'Pre-layout STA: Analyze setup/hold slack against SDC clock definitions and standard-cell delays.'}
                    {kingdom.id === 'placement' && 'Placement STA: Evaluate estimated wire delays and setup margins following cell legalization.'}
                    {kingdom.id === 'cts' && 'Post-CTS STA: Observe how real clock skew and insertion latency impact timing slack. (Note: CTS builds the physical clock tree; STA verifies timing).'}
                    {kingdom.id === 'routing' && 'Post-route sign-off STA: Analyze extracted parasitic RC net delays and crosstalk derating.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setShowInlineStudio(!showInlineStudio)}
                  >
                    {showInlineStudio ? '▲ Collapse In-Page Studio' : '⚡ Open In-Page Studio'}
                  </button>
                  <Link to={`/studio/sta?stage=${kingdom.id}`} className="btn btn--secondary">
                    🖥️ Dedicated Studio Page
                  </Link>
                  <a
                    href="https://ppawar-7.github.io/sta-playground/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost"
                  >
                    External Tab ↗
                  </a>
                </div>

                {/* Collapsible Inline Studio Iframe */}
                {showInlineStudio && (
                  <div style={{ width: '100%', marginTop: '1.25rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                    <iframe
                      src="/studios/sta/index.html"
                      title="STA Playground In-Page Studio"
                      style={{ width: '100%', height: '700px', border: 'none', display: 'block', background: '#050811' }}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                    />
                  </div>
                )}
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
                    to validate your actual design and earn the stage certification bonus!
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
                      Validates your actual layout geometry and design constraints against authentic EDA ruledecks.
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
                        onClick={() => handleOpenCheck(check)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="sanity-card__header">
                          <span className="sanity-card__icon">{check.icon}</span>
                          <span className="sanity-card__category">{check.category}</span>
                          {isPassed && <span className="sanity-card__badge-pass">✓ CERTIFIED</span>}
                          {!isUnlocked && !isPassed && <span className="sanity-card__badge-lock">🔒 PRACTICE ONLY</span>}
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
                              onClick={(e) => { e.stopPropagation(); handleOpenCheck(check); }}
                            >
                              ▶ Inspect Audit
                            </button>
                          )}
                          {isPassed && (
                            <button
                              className="btn btn--secondary btn--sm"
                              onClick={(e) => { e.stopPropagation(); handleOpenCheck(check); }}
                            >
                              ✓ View Sign-Off
                            </button>
                          )}
                          {!isUnlocked && !isPassed && (
                            <button
                              className="btn btn--secondary btn--sm"
                              onClick={(e) => { e.stopPropagation(); handleOpenCheck(check); }}
                            >
                              🔬 Practice Drill
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

              {/* Mode Selection Tabs: Student Design vs Demonstration */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.5rem',
              }}>
                <button
                  type="button"
                  style={{
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: auditMode === 'student' ? '#0284c7' : '#cbd5e1',
                    background: auditMode === 'student' ? '#0284c7' : '#f8fafc',
                    color: auditMode === 'student' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setAuditMode('student');
                    setSimulationDone(false);
                    setSimulationLogs([]);
                  }}
                >
                  🎓 Student Design Verification (Sign-Off)
                </button>

                <button
                  type="button"
                  style={{
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: auditMode === 'demo' ? '#7c3aed' : '#cbd5e1',
                    background: auditMode === 'demo' ? '#7c3aed' : '#f8fafc',
                    color: auditMode === 'demo' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setAuditMode('demo');
                    setSimulationDone(false);
                    setSimulationLogs([]);
                  }}
                >
                  🔬 Demonstration &amp; Fault Drill (Practice Only)
                </button>
              </div>

              {/* Status Context Banner */}
              {auditMode === 'student' ? (
                <div style={{
                  background: studentAuditInfo?.canCertify ? '#f0fdf4' : (studentAuditInfo?.isPracticeOnly ? '#f5f3ff' : '#fffbeb'),
                  border: `1px solid ${studentAuditInfo?.canCertify ? '#bbf7d0' : (studentAuditInfo?.isPracticeOnly ? '#ddd6fe' : '#fef3c7')}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: studentAuditInfo?.canCertify ? '#166534' : (studentAuditInfo?.isPracticeOnly ? '#5b21b6' : '#92400e'),
                }}>
                  {studentAuditInfo?.isPracticeOnly ? (
                    <div>
                      <strong>🔬 Educational Drill:</strong> {studentAuditInfo?.reason}
                    </div>
                  ) : studentAuditInfo?.canCertify ? (
                    <div>
                      <strong>✓ Verified Student Design Ready:</strong> This check evaluates your layout parameters generated from <strong>{studentAuditInfo.requirement?.prerequisiteLevels.join(', ')}</strong>. Passing this audit certifies your design and awards +{activeCheck.xpReward} XP.
                    </div>
                  ) : (
                    <div>
                      <strong>⚠️ Prerequisite Design Required:</strong> {studentAuditInfo?.reason || 'Complete prerequisite levels first.'} Stage certification cannot be awarded until you complete the prerequisite level(s).
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: '#5b21b6',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>
                      <strong>ℹ️ Demonstration Mode:</strong> Inspecting preset reference designs. Stage certification XP cannot be earned in this mode.
                    </span>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                        <input
                          type="radio"
                          name="sanity-demo-defect"
                          checked={!demoDefect}
                          onChange={() => { setDemoDefect(false); setSimulationDone(false); }}
                        />
                        <span>Nominal Clean</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.82rem', color: '#b91c1c' }}>
                        <input
                          type="radio"
                          name="sanity-demo-defect"
                          checked={demoDefect}
                          onChange={() => { setDemoDefect(true); setSimulationDone(false); }}
                        />
                        <span>Inject Fault</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

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
                      {simulationLogs.map((log, index) => {
                        let lineClass = '';
                        if (log.includes('PASSED') || log.includes('CLEAN_PASS') || log.includes('100%')) {
                          lineClass = 'sanity-terminal__line--green';
                        } else if (log.includes('VIOLATION') || log.includes('FAIL') || log.includes('OVER_BUDGET') || log.includes('OVERFLOW')) {
                          lineClass = 'sanity-terminal__line--red';
                        } else if (log.includes('⚠️') || log.includes('Warning') || log.includes('DEMONSTRATION')) {
                          lineClass = 'sanity-terminal__line--amber';
                        } else if (log.includes('ℹ️') || log.includes('[RULE-ENGINE]')) {
                          lineClass = 'sanity-terminal__line--dim';
                        }

                        return (
                          <div key={index} className={`sanity-terminal__line ${lineClass}`}>
                            {log}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sanity-modal__footer sanity-modal__actions" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                {!simulationDone ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--lg w-full"
                    onClick={handleRunSimulation}
                    disabled={runningSimulation}
                  >
                    {runningSimulation ? '⏳ Evaluating Ruledeck...' : `▶ Run EDA Verification: ${activeCheck.name}`}
                  </button>
                ) : isSanityCheckPassed(player, activeCheck.id) ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div className="sanity-modal__passed-notice" style={{ marginBottom: '0.75rem' }}>
                      ✓ <strong>Stage Check Previously Certified:</strong> This rule check is permanently certified.
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary btn--lg w-full"
                      onClick={() => setActiveCheck(null)}
                    >
                      Close Audit Window
                    </button>
                  </div>
                ) : simulationPassed && simulationCanCertify ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div className="sanity-modal__passed-notice" style={{ marginBottom: '0.75rem' }}>
                      ✓ <strong>Student Design Certified:</strong> Your design layout satisfies all physical ruledeck criteria.
                    </div>
                    <button
                      type="button"
                      className="btn btn--primary btn--lg w-full"
                      onClick={handleCertifyCheck}
                    >
                      🛡️ Sign-Off &amp; Certify Stage Check (+{activeCheck.xpReward} XP)
                    </button>
                  </div>
                ) : simulationPassed && !simulationCanCertify ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{
                      background: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      color: '#5b21b6',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      marginBottom: '0.75rem',
                    }}>
                      ℹ️ <strong>Demonstration Passed:</strong> Reference drill verified clean. Switch to "Student Design Verification" to certify your design for XP.
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary btn--lg w-full"
                      onClick={() => setActiveCheck(null)}
                    >
                      ✓ Practice Drill Complete (Close)
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
                      Close &amp; Revise Design
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
