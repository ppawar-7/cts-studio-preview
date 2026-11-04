/**
 * ActivityHost.jsx
 * ================
 * Dynamic host container that mounts the registered interactive learning activity
 * for a level, or gracefully falls back to an informational coming-soon state
 * for unimplemented levels.
 *
 * Prevents unearned XP awards and eliminates fake completion paths.
 */

import React from 'react';
import { getActivity } from '../../activities/activityRegistry.js';
import './ActivityHost.css';

export default function ActivityHost({ level, kingdom, onVerify, alreadyCompleted }) {
  const activityDescriptor = getActivity(level.id);

  // If a registered activity exists (e.g. Level 1 rtl-1)
  if (activityDescriptor && activityDescriptor.component) {
    const ActivityComponent = activityDescriptor.component;
    return (
      <div className="activity-host">
        <ActivityComponent
          level={level}
          kingdom={kingdom}
          onVerify={onVerify}
          alreadyCompleted={alreadyCompleted}
        />
      </div>
    );
  }

  // Fallback for unimplemented levels (Phase 2+): Non-rewarding informational card
  return (
    <div className="activity-host">
      <div className="activity-coming-soon">
        <span className="activity-coming-soon__icon">🚧</span>
        <h3 className="activity-coming-soon__title">
          {level.title} — Laboratory In Development
        </h3>
        <p className="activity-coming-soon__desc">
          The verified engineering challenge for <strong>{level.title}</strong> is currently
          under development for this kingdom's upcoming milestone.
        </p>

        <div className="activity-coming-soon__notice">
          🔒 Mastery validation required: This level will unlock XP and star rewards once its dedicated engineering simulator is published.
        </div>

        <div className="activity-coming-soon__links">
          {kingdom.id === 'rtl-understanding' && (
            <a
              href="https://ppawar-7.github.io/rtl-playground/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary btn--sm"
            >
              Explore Full RTL Playground Lab ↗
            </a>
          )}
          {(kingdom.id === 'cts' || kingdom.id === 'synthesis') && (
            <a
              href="https://ppawar-7.github.io/sta-playground/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary btn--sm"
            >
              Explore Timing in STA Playground ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
