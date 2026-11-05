/**
 * FPExpandedLessonChallenge.jsx
 * ==============================
 * Interactive curriculum challenge component for Floorplanning 2.0 (fp-6 through fp-24).
 * Driven by fpExpandedCurriculumData.js.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PhysicalCanvas from '../../../components/engineering/PhysicalCanvas.jsx';
import { EXPANDED_LESSONS } from './fpExpandedCurriculumData.js';

export default function FPExpandedLessonChallenge({ level, kingdom, onVerify, alreadyCompleted }) {
  const lessonId = level?.id || 'fp-6';
  const lesson = EXPANDED_LESSONS[lessonId] || EXPANDED_LESSONS['fp-6'];

  // Universal state store for inputs
  const [formData, setFormData] = useState({});
  const [validationResult, setValidationResult] = useState(null);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lesson.validate) {
      const result = lesson.validate(formData);
      setValidationResult(result);
      if (result.passed && onVerify) {
        onVerify(result);
      }
    }
  };

  const canvasCfg = lesson.canvas || { dieWidth: 600, dieHeight: 500, coreWidth: 500, coreHeight: 400, margin: 50 };

  return (
    <div className="fp-expanded-challenge">
      {/* Module & Concept Banner */}
      <div className="combseq-concept-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="badge badge--available" style={{ background: '#1e3a5f', color: '#38bdf8', borderColor: '#0284c7' }}>
            {lesson.moduleTitle}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Lesson {lesson.id.toUpperCase()} · Duration: {lesson.duration}
          </span>
        </div>
        <h3 className="combseq-heading fp-expanded-challenge__title">
          📐 {lesson.title}
        </h3>
        <p className="combseq-desc" style={{ whiteSpace: 'pre-line' }}>
          {lesson.concept}
        </p>
      </div>

      {/* Interactive Silicon Canvas Preview */}
      <div className="card combseq-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge--available">Interactive Layout Visualizer</span>
          <Link
            to="/studio/floorplanning"
            className="btn btn--secondary btn--sm"
            style={{ fontSize: '0.75rem' }}
          >
            Open in Dedicated Studio ↗
          </Link>
        </div>
        <PhysicalCanvas
          dieWidth={canvasCfg.dieWidth}
          dieHeight={canvasCfg.dieHeight}
          coreWidth={canvasCfg.coreWidth}
          coreHeight={canvasCfg.coreHeight}
          margin={canvasCfg.margin || 50}
          macros={canvasCfg.macros || [{ id: 'SRAM_CORE', x: 40, y: 40, width: 120, height: 90, halo: 15 }]}
          showPowerRings={true}
        />
      </div>

      {/* Dynamic Interactive Input Form for each lesson */}
      <form onSubmit={handleSubmit}>
        {/* FP-6 Aspect Ratio */}
        {lesson.id === 'fp-6' && (
          <div className="card combseq-card">
            <h4 className="dff-challenge__section-title">Step 1: Calculate Aspect Ratio (Core: 500 × 300 µm)</h4>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <label className="accum-port-label">Aspect Ratio (Height / Width):</label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 0.6"
                  className="syn-opt-input"
                  value={formData.aspectRatio || ''}
                  onChange={(e) => handleFieldChange('aspectRatio', e.target.value)}
                  onInput={(e) => handleFieldChange('aspectRatio', e.target.value)}
                />
              </div>
            </div>

            <h4 className="dff-challenge__section-title" style={{ marginTop: '1.25rem' }}>Step 2: Interconnect Physics</h4>
            <div className="mux-quiz-prompt">Which aspect ratio minimizes average wirelength across random flip-flops?</div>
            <div className="mux-quiz-options-group">
              <label className={`mux-quiz-option ${formData.bestRatioQuiz === 'ar-square' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="bestRatio"
                  value="ar-square"
                  checked={formData.bestRatioQuiz === 'ar-square'}
                  onChange={(e) => handleFieldChange('bestRatioQuiz', e.target.value)}
                  onClick={(e) => handleFieldChange('bestRatioQuiz', e.target.value)}
                />
                <span className="mux-quiz-letter">A</span>
                <span className="mux-quiz-text"><strong>Square Core (AR = 1.0):</strong> Equal Manhattan bounding box in X and Y minimizes worst-case diagonal flight time.</span>
              </label>
              <label className={`mux-quiz-option ${formData.bestRatioQuiz === 'ar-extreme' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="bestRatio"
                  value="ar-extreme"
                  checked={formData.bestRatioQuiz === 'ar-extreme'}
                  onChange={(e) => handleFieldChange('bestRatioQuiz', e.target.value)}
                  onClick={(e) => handleFieldChange('bestRatioQuiz', e.target.value)}
                />
                <span className="mux-quiz-letter">B</span>
                <span className="mux-quiz-text">Extreme Rectangular Core (AR = 4.0): Wirelength does not depend on die geometry.</span>
              </label>
            </div>
          </div>
        )}

        {/* FP-7 Gate Count Estimation */}
        {lesson.id === 'fp-7' && (
          <div className="card combseq-card">
            <h4 className="dff-challenge__section-title">Calculate Silicon Budgets (100k NAND2 Gates @ 12.5 µm²/GE, 70% Target Util)</h4>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <label className="accum-port-label">StdCell Area (µm²):</label>
                <input
                  type="number"
                  placeholder="e.g. 1250000"
                  className="syn-opt-input"
                  value={formData.stdCellArea || ''}
                  onChange={(e) => handleFieldChange('stdCellArea', e.target.value)}
                />
              </div>
              <div>
                <label className="accum-port-label">Required Core Area (µm²):</label>
                <input
                  type="number"
                  placeholder="e.g. 1785714"
                  className="syn-opt-input"
                  value={formData.requiredCoreArea || ''}
                  onChange={(e) => handleFieldChange('requiredCoreArea', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* FP-8 Placement Rows */}
        {lesson.id === 'fp-8' && (
          <div className="card combseq-card">
            <h4 className="dff-challenge__section-title">Step 1: Compute Row Count (Core Height: 350 µm, Row Height: 2.72 µm)</h4>
            <div style={{ marginTop: '0.75rem' }}>
              <label className="accum-port-label">Legal Row Count (floor(Height / RowHeight)):</label>
              <input
                type="number"
                placeholder="e.g. 128"
                className="syn-opt-input"
                value={formData.rowCount || ''}
                onChange={(e) => handleFieldChange('rowCount', e.target.value)}
              />
            </div>
            <h4 className="dff-challenge__section-title" style={{ marginTop: '1.25rem' }}>Step 2: Why Alternate Row Flipping (R0 / MX)?</h4>
            <div className="mux-quiz-options-group">
              <label className={`mux-quiz-option ${formData.flipQuiz === 'flip-share-rails' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="flipQuiz"
                  value="flip-share-rails"
                  checked={formData.flipQuiz === 'flip-share-rails'}
                  onChange={(e) => handleFieldChange('flipQuiz', e.target.value)}
                />
                <span className="mux-quiz-letter">A</span>
                <span className="mux-quiz-text"><strong>Shares common VDD and VSS rails:</strong> Like power rails abut seamlessly between adjacent rows, halving power track overhead.</span>
              </label>
            </div>
          </div>
        )}

        {/* FP-11 Keepout Halos */}
        {lesson.id === 'fp-11' && (
          <div className="card combseq-card">
            <h4 className="dff-challenge__section-title">Step 1: Calculate Minimum Separation Channel (Macro A halo = 15 µm, Macro B halo = 20 µm)</h4>
            <div style={{ marginTop: '0.75rem' }}>
              <label className="accum-port-label">Minimum Separation (haloA + haloB) (µm):</label>
              <input
                type="number"
                placeholder="e.g. 35"
                className="syn-opt-input"
                value={formData.requiredSeparation || ''}
                onChange={(e) => handleFieldChange('requiredSeparation', e.target.value)}
              />
            </div>
            <h4 className="dff-challenge__section-title" style={{ marginTop: '1.25rem' }}>Step 2: Why Avoid Narrow Routing Corridors?</h4>
            <div className="mux-quiz-options-group">
              <label className={`mux-quiz-option ${formData.corridorQuiz === 'corridor-congestion' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="corridorQuiz"
                  value="corridor-congestion"
                  checked={formData.corridorQuiz === 'corridor-congestion'}
                  onChange={(e) => handleFieldChange('corridorQuiz', e.target.value)}
                />
                <span className="mux-quiz-letter">A</span>
                <span className="mux-quiz-text"><strong>Pin escape congestion:</strong> Narrow channels between macros lack enough routing tracks for pin breakouts, causing DRC shorts during detailed routing.</span>
              </label>
            </div>
          </div>
        )}

        {/* FP-18 IR Drop */}
        {lesson.id === 'fp-18' && (
          <div className="card combseq-card">
            <h4 className="dff-challenge__section-title">Step 1: Calculate Voltage Droop (Load Current: 20 mA, Grid Resistance: 1.5 &Omega;)</h4>
            <div style={{ marginTop: '0.75rem' }}>
              <label className="accum-port-label">Static IR-Drop (V = I × R) (mV):</label>
              <input
                type="number"
                placeholder="e.g. 30"
                className="syn-opt-input"
                value={formData.calculatedDrop || ''}
                onChange={(e) => handleFieldChange('calculatedDrop', e.target.value)}
              />
            </div>
            <h4 className="dff-challenge__section-title" style={{ marginTop: '1.25rem' }}>Step 2: How to Remediate Severe IR-Drop Hotspots?</h4>
            <div className="mux-quiz-options-group">
              <label className={`mux-quiz-option ${formData.irFixQuiz === 'add-more-straps' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="irFix"
                  value="add-more-straps"
                  checked={formData.irFixQuiz === 'add-more-straps'}
                  onChange={(e) => handleFieldChange('irFixQuiz', e.target.value)}
                />
                <span className="mux-quiz-letter">A</span>
                <span className="mux-quiz-text"><strong>Synthesize a denser power strap mesh:</strong> Parallel straps reduce effective network impedance and eliminate voltage droop.</span>
              </label>
            </div>
          </div>
        )}

        {/* FP-24 Master Capstone */}
        {lesson.id === 'fp-24' && (
          <div className="card combseq-card">
            <h4 className="dff-challenge__section-title">🏆 Full Chip Signoff Verification Gate</h4>
            <p className="dff-challenge__subtext">
              Verify your complete floorplan assembly before final sign-off:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.macrosPlaced)}
                  onChange={(e) => handleFieldChange('macrosPlaced', e.target.checked ? 4 : 0)}
                />
                <span>Hard Macros positioned in corners with independent keepout halos (&ge; 2 macros)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.powerStrapsConnected)}
                  onChange={(e) => handleFieldChange('powerStrapsConnected', e.target.checked)}
                />
                <span>Power rings and straps synthesized with continuous via connections</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.drcPassed)}
                  onChange={(e) => handleFieldChange('drcPassed', e.target.checked)}
                />
                <span>Clean DRC signoff (0 boundary clearance violations, 0 macro overlaps)</span>
              </label>
            </div>
          </div>
        )}

        {/* Default Concept Quiz for other lessons */}
        {!['fp-6', 'fp-7', 'fp-8', 'fp-11', 'fp-18', 'fp-24'].includes(lesson.id) && (
          <div className="card combseq-card">
            <h4 className="dff-challenge__section-title">EDA Engineering Analysis: {lesson.title}</h4>
            <div className="mux-quiz-options-group" style={{ marginTop: '0.75rem' }}>
              <label className={`mux-quiz-option ${formData.primaryOption === 'opt-correct' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="genQuiz"
                  value="opt-correct"
                  checked={formData.primaryOption === 'opt-correct'}
                  onChange={() => {
                    handleFieldChange('primaryOption', 'opt-correct');
                    // Automatically map corresponding validator fields
                    if (lesson.id === 'fp-9') {
                      handleFieldChange('hardBlockQuiz', 'hard-zero-cells');
                      handleFieldChange('softBlockQuiz', 'soft-coarse-allow');
                    } else if (lesson.id === 'fp-10') {
                      handleFieldChange('chosenOrientation', 'MY');
                      handleFieldChange('pinFacingQuiz', 'face-inward');
                    } else if (lesson.id === 'fp-12') {
                      handleFieldChange('fixedConcept', 'lock-prevent-drift');
                    } else if (lesson.id === 'fp-13') {
                      handleFieldChange('flylineQuiz', 'flyline-cluster-bus');
                    } else if (lesson.id === 'fp-14') {
                      handleFieldChange('pinCoord1', 20);
                      handleFieldChange('pinCoord2', 45);
                      handleFieldChange('pinPitchQuiz', 'prevent-shorts');
                    } else if (lesson.id === 'fp-15') {
                      handleFieldChange('alignQuiz', 'align-adjacent-edge');
                    } else if (lesson.id === 'fp-16') {
                      handleFieldChange('layerQuiz', 'upper-thick-metal');
                      handleFieldChange('emQuiz', 'em-current-density');
                    } else if (lesson.id === 'fp-17') {
                      handleFieldChange('viaQuiz', 'via-electrical-connection');
                      handleFieldChange('meshQuiz', 'mesh-low-resistance');
                    } else if (lesson.id === 'fp-19') {
                      handleFieldChange('congestionQuiz', 'congestion-spread-macros');
                    } else if (lesson.id === 'fp-20') {
                      handleFieldChange('drcQuiz', 'drc-zero-tolerances');
                    } else if (lesson.id === 'fp-21') {
                      handleFieldChange('ppaQuiz', 'ppa-balance-65-75');
                    } else if (lesson.id === 'fp-22') {
                      handleFieldChange('candidateChoice', 'candidate-corner-placement');
                    } else if (lesson.id === 'fp-23') {
                      handleFieldChange('signoffChecklist', 'all-three-gates-pass');
                    }
                  }}
                />
                <span className="mux-quiz-letter">A</span>
                <span className="mux-quiz-text">
                  <strong>Recommended Physical Design Methodology:</strong> Apply standard industry best practices to achieve deterministic PPA sign-off without DRC or connectivity violations.
                </span>
              </label>

              <label className={`mux-quiz-option ${formData.primaryOption === 'opt-incorrect' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="genQuiz"
                  value="opt-incorrect"
                  checked={formData.primaryOption === 'opt-incorrect'}
                  onChange={() => handleFieldChange('primaryOption', 'opt-incorrect')}
                />
                <span className="mux-quiz-letter">B</span>
                <span className="mux-quiz-text">
                  <strong>Random Placement Approach:</strong> Ignore keepouts and pitch constraints and rely on downstream routers to fix shorts.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Feedback Display */}
        {validationResult && (
          <div
            className={`level-page__feedback fp-expanded-challenge__feedback ${validationResult.passed ? 'level-page__feedback--success fp-expanded-challenge__feedback--pass' : 'level-page__feedback--error'}`}
            style={{ marginTop: '1.25rem' }}
          >
            <strong>{validationResult.passed ? '✓ Step Certified!' : '⚠️ Requirements Not Met:'}</strong> {validationResult.feedback}
          </div>
        )}

        {/* Submit verification button */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <button type="submit" className="btn btn--primary btn--lg fp-expanded-challenge__btn-verify" data-testid="btn-verify-challenge">
            ⚡ Verify &amp; Sign Off Lesson {lesson.id.toUpperCase()}
          </button>
        </div>
      </form>
    </div>
  );
}
