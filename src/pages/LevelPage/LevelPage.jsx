/**
 * LevelPage.jsx
 * ==============
 * Reusable level learning template.
 * Streamlined single-view structure with registered activity hosting.
 *
 * Data-driven: reads kingdom + level from URL params and kingdomsData.js.
 * Level activities are loaded dynamically via ActivityHost and validated
 * deterministically before declaring completion.
 */

import React, { useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext.jsx';
import {
  getLevelStatus,
  isLevelUnlocked,
  computeStars,
} from '../../logic/progressionEngine.js';
import { KINGDOMS } from '../../data/kingdomsData.js';
import ActivityHost from '../../components/ActivityHost/ActivityHost.jsx';
import { hasActivity } from '../../activities/activityRegistry.js';
import './LevelPage.css';

// ─── Stars display ────────────────────────────────────────────────────────────
function StarDisplay({ stars }) {
  return (
    <div className="level-page__complete-stars">
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ opacity: i <= stars ? 1 : 0.25 }}>⭐</span>
      ))}
    </div>
  );
}

export default function LevelPage() {
  const { kingdomId, levelId } = useParams();
  const { player, completeLevel } = usePlayer();
  const navigate = useNavigate();

  // Find kingdom and level
  const kingdom = KINGDOMS.find((k) => k.id === kingdomId);
  const level = kingdom?.levels.find((l) => l.id === levelId);

  // States
  const [showHint, setShowHint] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [showStudioModal, setShowStudioModal] = useState(false);

  if (!kingdom || !level) return <Navigate to="/world-map" replace />;

  const isUnlocked = isLevelUnlocked(player, kingdom, level);
  const isCompleted = player.levelProgress?.[level.id]?.completed ?? false;
  const currentLevelXP = player.levelProgress?.[level.id]?.xpEarned ?? 0;
  const currentLevelStars = player.levelProgress?.[level.id]?.stars ?? 0;

  // Enforce access control
  if (!isUnlocked) {
    return (
      <div className="level-page">
        <div className="container" style={{ paddingTop: '4rem' }}>
          <div className="level-page__locked-banner">
            <span style={{ fontSize: '3rem' }}>🔒</span>
            <h2>Level Locked</h2>
            <p>
              Complete the previous level in <strong>{kingdom.name}</strong> to unlock this challenge.
            </p>
            <Link to={`/kingdom/${kingdom.id}`} className="btn btn--primary">
              Return to {kingdom.name}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const alreadyCompleted = isCompleted;

  // Called when student passes an activity via ActivityHost
  const handleActivityVerify = (result) => {
    if (!result || !result.passed) {
      return;
    }

    const verifiedScore = Math.min(result.score, level.xpReward);
    completeLevel(kingdom.id, level, verifiedScore, result.artifacts || result.designData || result.metrics || result);
    setCompletionData({
      score: verifiedScore,
      stars: result.stars,
      xpEarned: verifiedScore,
      feedback: result.feedback,
    });
  };

  // Find next level & next kingdom for navigation
  const nextLevel = kingdom.levels.find((l) => l.order === level.order + 1);
  const nextKingdom = KINGDOMS.find((k) => k.order === kingdom.order + 1);

  // Show full completion overlay when completed
  if (completionData) {
    return (
      <div className="level-page">
        <div className="container" style={{ paddingTop: '4rem' }}>
          <div className="level-page__complete-banner">
            <span className="level-page__complete-emoji">🎉</span>
            <h2 className="level-page__complete-title">Level Complete!</h2>
            <p className="level-page__complete-xp">
              +{completionData.xpEarned} XP Verified &amp; Earned
            </p>
            <StarDisplay stars={completionData.stars} />

            <p style={{ color: 'var(--color-text-muted)', maxWidth: 500, margin: '1rem auto' }}>
              {completionData.feedback}
            </p>

            <div className="level-page__complete-buttons">
              {nextLevel && (
                hasActivity(nextLevel.id) ? (
                  <>
                    <Link
                      to={`/kingdom/${kingdom.id}/level/${nextLevel.id}`}
                      className="btn btn--primary btn--lg"
                      onClick={() => setCompletionData(null)}
                    >
                      ▶ Next Level: {nextLevel.title}
                    </Link>
                    <Link to={`/kingdom/${kingdom.id}`} className="btn btn--ghost">
                      ← Back to {kingdom.name}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/kingdom/${kingdom.id}`}
                      className="btn btn--primary btn--lg"
                    >
                      🏰 Return to {kingdom.name}
                    </Link>
                    <Link
                      to={`/kingdom/${kingdom.id}/level/${nextLevel.id}`}
                      className="btn btn--secondary btn--lg"
                      onClick={() => setCompletionData(null)}
                    >
                      Preview Level {nextLevel.order} (Coming Soon) ›
                    </Link>
                  </>
                )
              )}
              {!nextLevel && nextKingdom && (
                <>
                  <Link
                    to={`/kingdom/${nextKingdom.id}`}
                    className="btn btn--secondary btn--lg"
                    onClick={() => setCompletionData(null)}
                  >
                    👑 Next Kingdom: {nextKingdom.name} →
                  </Link>
                  <Link to={`/kingdom/${kingdom.id}`} className="btn btn--primary btn--lg">
                    🏰 Return to {kingdom.name}
                  </Link>
                </>
              )}
              {!nextLevel && !nextKingdom && (
                <Link to="/world-map" className="btn btn--primary btn--lg">
                  🏆 View World Map Completion
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="level-page"
      style={{
        '--kingdom-gradient': kingdom.gradient,
        '--kingdom-color': kingdom.borderColor,
      }}
    >
      {/* Top Banner / Breadcrumb */}
      <div className="level-page__header">
        <div className="container level-page__header-inner">
          <Link to={`/kingdom/${kingdom.id}`} className="level-page__back">
            ← Back to {kingdom.name}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Level badge */}
            <div className="level-page__badge">
              <span style={{ fontSize: '1.25rem' }}>{kingdom.emoji}</span>
              <span>Level {level.order} of {kingdom.levels.length}</span>
            </div>

            {/* Stars if completed */}
            {alreadyCompleted && (
              <div className="level-page__stars">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`star ${i <= currentLevelStars ? 'star--filled' : ''}`}
                    style={{ fontSize: '1.5rem' }}
                  >★</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {alreadyCompleted && (
          <div className="level-page__feedback level-page__feedback--info" style={{ marginBottom: '1.5rem' }}>
            ✅ You have certified completion on this level ({currentLevelXP} XP, {currentLevelStars} Stars)! You can practice again to improve your score.
          </div>
        )}

        {/* Level Overview & Concept */}
        <div className="card level-page__concept-card">
          <div className="level-page__concept-header">
            <div>
              <span className="badge badge--available" style={{ marginBottom: '0.5rem' }}>
                {kingdom.name} · Level {level.order}
              </span>
              <h2 style={{ fontSize: '1.3rem', margin: '0.25rem 0' }}>{level.title}</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                {level.description}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Challenge & Learning Activity Area */}
        <div className="card level-page__activity-card">
          <div className="level-page__activity-header">
            <span className="level-page__activity-badge">⚔️ Verified Engineering Challenge</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Demonstrate mastery to earn up to <strong>{level.xpReward} XP</strong>
            </span>
          </div>

          <ActivityHost
            level={level}
            kingdom={kingdom}
            onVerify={handleActivityVerify}
            alreadyCompleted={alreadyCompleted}
          />
        </div>

        {/* Quick Assistance / Hint */}
        <div className="level-page__hint-box">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? '🙈 Hide Hint' : '💡 Need a Hint?'}
          </button>

          {showHint && (
            <div className="card level-page__hint-content">
              <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#b45309' }}>
                💡 Key Hint for {level.title}:
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Analyze the engineering specifications carefully. Verify all required parameters, pin assignments, or logic states before submitting to achieve full 3-star certification!
              </p>
            </div>
          )}
        </div>

        {/* Standalone Lab Studio Bridge */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
              {kingdom.id === 'rtl-understanding' && (
                <>
                  <strong style={{ color: '#f1f5f9' }}>⚡ RTL Studio Companion:</strong> Open-ended circuit simulator with live waveforms and Verilog generation.
                </>
              )}
              {(kingdom.id === 'synthesis' || kingdom.id === 'placement' || kingdom.id === 'cts' || kingdom.id === 'routing') && (
                <>
                  <strong style={{ color: '#f1f5f9' }}>⏱️ STA Studio Companion:</strong> Multi-corner timing graph analyzer with setup/hold slack path tracing.
                </>
              )}
              {(kingdom.id === 'floorplanning' || kingdom.id === 'filler-cells' || kingdom.id === 'gds') && (
                <>
                  <strong style={{ color: '#f1f5f9' }}>🛡️ Physical Design Sign-Off:</strong> Complete this level to generate verified layout parameters for stage sanity checks!
                </>
              )}
            </div>

            {(kingdom.id === 'rtl-understanding' || kingdom.id === 'synthesis' || kingdom.id === 'placement' || kingdom.id === 'cts' || kingdom.id === 'routing') && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setShowStudioModal(true)}
                >
                  ⚡ Open Studio Companion
                </button>
                <Link
                  to={kingdom.id === 'rtl-understanding' ? '/studio/rtl' : `/studio/sta?stage=${kingdom.id}`}
                  className="btn btn--ghost btn--sm"
                >
                  🖥️ Full Studio
                </Link>
                <a
                  href={kingdom.id === 'rtl-understanding' ? 'https://ppawar-7.github.io/rtl-playground/' : 'https://ppawar-7.github.io/sta-playground/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--ghost btn--sm"
                  style={{ color: '#38bdf8' }}
                >
                  External ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Studio Companion Modal */}
      {showStudioModal && (
        <div className="sanity-modal-overlay" onClick={() => setShowStudioModal(false)}>
          <div className="sanity-modal" style={{ maxWidth: '1100px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="sanity-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.6rem' }}>{kingdom.id === 'rtl-understanding' ? '⚡' : '⏱️'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                    {kingdom.id === 'rtl-understanding' ? 'RTL Playground Studio Companion' : 'STA Timing Studio Companion'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {kingdom.name} · Level {level.order}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="sanity-modal__close"
                onClick={() => setShowStudioModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="sanity-modal__body" style={{ padding: 0 }}>
              <iframe
                src={kingdom.id === 'rtl-understanding' ? '/studios/rtl/index.html' : '/studios/sta/index.html'}
                title="Studio Companion"
                style={{ width: '100%', height: '650px', border: 'none', display: 'block', background: '#050811' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
