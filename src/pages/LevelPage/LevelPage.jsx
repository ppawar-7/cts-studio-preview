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

  if (!kingdom || !level) return <Navigate to="/world-map" replace />;

  const levelStatus = getLevelStatus(player, kingdom, level);
  const alreadyCompleted = player.levelProgress[level.id]?.completed ?? false;
  const currentLevelStars = player.levelProgress[level.id]?.stars ?? 0;
  const currentLevelXP = player.levelProgress[level.id]?.xpEarned ?? 0;

  // Block access to locked levels
  if (levelStatus === 'locked') {
    return (
      <div className="level-page">
        <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
          <span style={{ fontSize: '4rem' }}>🔒</span>
          <h2 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Level Locked</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {level.pointsRequired > 0
              ? `This level requires ${level.pointsRequired} XP in the ${kingdom.name} kingdom.`
              : 'Complete the previous level first to unlock this one.'}
          </p>
          <Link to={`/kingdom/${kingdom.id}`} className="btn btn--primary">
            ← Back to {kingdom.name}
          </Link>
        </div>
      </div>
    );
  }

  // Handle verified activity completion (strictly deterministic)
  const handleActivityVerify = (result) => {
    if (!result || !result.passed) {
      return;
    }

    const verifiedScore = Math.min(result.score, level.xpReward);
    completeLevel(kingdom.id, level, verifiedScore);
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
                <Link
                  to={`/kingdom/${kingdom.id}/level/${nextLevel.id}`}
                  className="btn btn--primary btn--lg"
                  onClick={() => setCompletionData(null)}
                >
                  ▶ Next Level: {nextLevel.title}
                </Link>
              )}
              {!nextLevel && nextKingdom && (
                <Link
                  to={`/kingdom/${nextKingdom.id}`}
                  className="btn btn--secondary btn--lg"
                >
                  🏰 Next Kingdom: {nextKingdom.name}
                </Link>
              )}
              <Link to={`/kingdom/${kingdom.id}`} className="btn btn--ghost">
                ← Back to {kingdom.name}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="level-page">
      {/* Header */}
      <div className="level-page__header">
        <div className="container">
          {/* Breadcrumb */}
          <div className="level-page__breadcrumb">
            <Link to="/world-map">🗺️ World Map</Link>
            <span className="level-page__breadcrumb-sep">›</span>
            <Link to={`/kingdom/${kingdom.id}`}>{kingdom.emoji} {kingdom.name}</Link>
            <span className="level-page__breadcrumb-sep">›</span>
            <span>Level {level.order}</span>
          </div>

          <div className="level-page__title-row">
            <div>
              <h1 className="level-page__level-title">
                Level {level.order} — {level.title}
              </h1>
              <div className="level-page__meta">
                <span>🏰 {kingdom.name}</span>
                <span>⏱ {level.duration}</span>
                <span>⭐ Up to {level.xpReward} XP</span>
                {alreadyCompleted && (
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                    ✓ Completed ({currentLevelXP} XP)
                  </span>
                )}
              </div>
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
                Remember that when <strong>SEL = 0</strong>, the multiplexer transmits input <strong>A</strong>. When <strong>SEL = 1</strong>, it transmits input <strong>B</strong>. You must test every state in the circuit to understand how logic signals steer data between register stages!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
