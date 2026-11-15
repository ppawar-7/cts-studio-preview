/**
 * CTSExpandedLessonChallenge.jsx
 * ================================
 * Interactive Hands-On Curriculum Activity Component for CTS Expanded Lessons
 * (cts-6 through cts-12).
 *
 * Integrates:
 * - In-depth CAD theoretical concepts and KaTeX formulas.
 * - Deep link into CTS Studio 1.0 with assignment preset.
 * - Live inspection of student's active saved clock tree design.
 * - Conceptual comprehension questions.
 * - Fail-closed multi-gate verification and design artifact generation.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CTS_EXPANDED_CURRICULUM } from './ctsCurriculumData.js';
import { loadCTSProjectFromStorage } from '../../../engine/ctsProjectModel.js';
import { solveClockTreeElmore } from '../../../engine/ctsEngine.js';
import { validateCTSExpandedLesson } from '../validators/validateCTSExpandedLesson.js';

export default function CTSExpandedLessonChallenge({
  level,
  kingdom,
  onVerify,
  alreadyCompleted,
}) {
  const lessonId = level?.id || 'cts-6';
  const lesson = CTS_EXPANDED_CURRICULUM[lessonId] || CTS_EXPANDED_CURRICULUM['cts-6'];
  const location = useLocation();
  const isExplore = Boolean(location.pathname.startsWith('/explore'));

  const studioUrl = `${isExplore ? '/explore/studio/cts' : '/studio/cts'}?assignment=${lesson.assignment.scenarioId}`;

  // Read student's active project from browser storage (strictly isolated per mode)
  const [storedProject, setStoredProject] = useState(() => loadCTSProjectFromStorage('active', isExplore));

  // Re-read storage on window focus or mount
  useEffect(() => {
    const handleFocus = () => {
      setStoredProject(loadCTSProjectFromStorage('active', isExplore));
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isExplore]);

  // Compute live solution on the student's project
  const solution = useMemo(() => {
    if (!storedProject) return null;
    return solveClockTreeElmore(storedProject);
  }, [storedProject]);

  // Selected answer state
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const freshProject = loadCTSProjectFromStorage('active', isExplore) || storedProject;
    const submission = {
      lessonId,
      answer: selectedAnswer,
      project: freshProject,
      isExplore,
    };

    const result = validateCTSExpandedLesson(submission);
    setFeedback(result);

    if (result && result.passed && onVerify) {
      onVerify(result);
    }
  };

  return (
    <div className="activity-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Lesson Header */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span
            style={{
              background: '#0284c7',
              color: '#fff',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
            }}
          >
            {lesson.id.toUpperCase()}
          </span>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#f8fafc', fontWeight: 800 }}>
            {lesson.title}
          </h2>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>
            +{lesson.xpReward} XP
          </span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{lesson.subtitle}</div>
      </div>

      {/* Theory & Foundation */}
      <section style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', color: '#38bdf8', fontSize: '1rem', fontWeight: 700 }}>
          📖 Engineering Foundation & Theory
        </h3>
        <div
          style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#cbd5e1' }}
          dangerouslySetInnerHTML={{
            __html: lesson.theory
              .replace(/\n\n/g, '<br/><br/>')
              .replace(/### (.*?)\n/g, '<h4 style="color:#93c5fd;margin:1rem 0 0.5rem 0;">$1</h4>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/`(.*?)`/g, '<code style="background:#162033;padding:0.1rem 0.3rem;border-radius:3px;color:#fca5a5;">$1</code>'),
          }}
        />
      </section>

      {/* Hands-On Studio Assignment Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(15, 23, 42, 0.95))',
          border: '2px solid #0284c7',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.05rem', fontWeight: 800 }}>
              🛠️ {lesson.assignment.title}
            </h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#e2e8f0' }}>
              {lesson.assignment.instructions}
            </p>
          </div>
          <Link
            to={studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
            style={{
              padding: '0.5rem 1rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            ⚡ Open in CTS Studio 1.0 ↗
          </Link>
        </div>

        {/* Target Criteria Checklist */}
        <div style={{ background: '#090e1a', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Target Acceptance Criteria:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
            {lesson.assignment.targetCriteria.map((crit, idx) => (
              <li key={idx} style={{ marginBottom: '0.2rem' }}>{crit}</li>
            ))}
          </ul>
        </div>

        {/* Live Status of Saved Project */}
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
          <div>
            <span>Active Saved Project: </span>
            <strong style={{ color: storedProject ? '#38bdf8' : '#f87171' }}>
              {storedProject ? (storedProject.name || storedProject.id) : 'No design saved yet in Studio'}
            </strong>
          </div>
          {solution && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span>Skew: <strong style={{ color: solution.skewPs <= 50 ? '#34d399' : '#f87171' }}>{solution.skewPs} ps</strong></span>
              <span>Max Latency: <strong style={{ color: '#38bdf8' }}>{solution.maxArrivalPs} ps</strong></span>
              <span>Violations: <strong style={{ color: solution.diagnostics?.violations?.length === 0 ? '#34d399' : '#f87171' }}>{solution.diagnostics?.violations?.length || 0}</strong></span>
            </div>
          )}
        </div>
      </section>

      {/* Conceptual Question & Verification Form */}
      <form onSubmit={handleSubmit} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
          ❓ Engineering Verification Question
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.5' }}>
          {lesson.question.prompt}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {lesson.question.options.map((opt, i) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: selectedAnswer === opt.value ? '1px solid #0284c7' : '1px solid #1e293b',
                background: selectedAnswer === opt.value ? '#1e3a5f' : '#131c31',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="radio"
                name={`question-${lesson.id}`}
                value={opt.value}
                checked={selectedAnswer === opt.value}
                onChange={() => setSelectedAnswer(opt.value)}
                style={{ marginTop: '0.2rem' }}
              />
              <span style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>
                <strong>{String.fromCharCode(65 + i)}.</strong> {opt.label}
              </span>
            </label>
          ))}
        </div>

        {/* Verification Result Feedback */}
        {feedback && (
          <div
            style={{
              padding: '0.8rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              background: feedback.passed ? 'rgba(6, 95, 70, 0.25)' : 'rgba(153, 27, 27, 0.25)',
              border: feedback.passed ? '1px solid #059669' : '1px solid #dc2626',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: feedback.passed ? '#34d399' : '#f87171', marginBottom: '0.25rem' }}>
              {feedback.passed ? `🎉 Passed! (+${feedback.score} XP, ${feedback.stars} Stars)` : '❌ Verification Failed'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.5' }}>
              {feedback.feedback}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Requires both CAD criteria satisfaction and correct engineering concept understanding.
          </span>
          <button
            type="submit"
            className="btn btn--primary"
            style={{ padding: '0.5rem 1.25rem', fontWeight: 800, fontSize: '0.85rem' }}
          >
            Verify & Sign Off →
          </button>
        </div>
      </form>
    </div>
  );
}
