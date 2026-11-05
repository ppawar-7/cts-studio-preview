import { describe, it, expect } from 'vitest';
import { evaluateSanityCheck } from '../../engine/sanityCheckEngine.js';

describe('Sanity Check Engine — Comprehensive 26-Check Verification Suite', () => {
  // ─── 1. Floorplanning Sanity Checks (3) ─────────────────────────
  describe('Floorplanning Sanity Checks', () => {
    it('fp-drc: passes when margin >= 20 and halo >= 15', () => {
      const res = evaluateSanityCheck('fp-drc', { margin: 25.0, halo: 18.0 });
      expect(res.passed).toBe(true);
      expect(res.metrics.margin).toBe(25.0);
      expect(res.metrics.halo).toBe(18.0);
      expect(res.logOutput.some((l) => l.includes('CLEAN_PASS'))).toBe(true);
    });

    it('fp-drc (negative test): fails when margin < 20.0 µm or halo < 15.0 µm', () => {
      const resMarginFail = evaluateSanityCheck('fp-drc', { margin: 12.0, halo: 18.0 });
      expect(resMarginFail.passed).toBe(false);
      expect(resMarginFail.logOutput.some((l) => l.includes('VIOLATION (< 20.0 µm)'))).toBe(true);

      const resHaloFail = evaluateSanityCheck('fp-drc', { margin: 25.0, halo: 8.0 });
      expect(resHaloFail.passed).toBe(false);
      expect(resHaloFail.logOutput.some((l) => l.includes('VIOLATION (< 15.0 µm)'))).toBe(true);
    });

    it('fp-connectivity: verifies continuous power rings and zero floating pins', () => {
      const resPass = evaluateSanityCheck('fp-connectivity', { floatingPins: 0, ringContinuous: true });
      expect(resPass.passed).toBe(true);

      const resFailPin = evaluateSanityCheck('fp-connectivity', { floatingPins: 3 });
      expect(resFailPin.passed).toBe(false);

      const resFailRing = evaluateSanityCheck('fp-connectivity', { ringContinuous: false });
      expect(resFailRing.passed).toBe(false);
    });

    it('fp-missing-vias: checks power mesh via cuts', () => {
      const resPass = evaluateSanityCheck('fp-missing-vias', { missingVias: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fp-missing-vias', { missingVias: 4 });
      expect(resFail.passed).toBe(false);
      expect(resFail.metrics.missingVias).toBe(4);
    });
  });

  // ─── 2. Placement Sanity Checks (5) ─────────────────────────────
  describe('Placement Sanity Checks', () => {
    it('pl-legality: passes for non-overlapping cells, fails on overlap', () => {
      const resPass = evaluateSanityCheck('pl-legality', {
        cells: [
          { id: 'C1', x: 0, y: 0, width: 20, height: 40 },
          { id: 'C2', x: 30, y: 0, width: 20, height: 40 },
        ],
      });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('pl-legality', {
        cells: [
          { id: 'C1', x: 0, y: 0, width: 30, height: 40 },
          { id: 'C2', x: 10, y: 0, width: 30, height: 40 }, // Overlaps C1 on X (0-30 vs 10-40)
        ],
      });
      expect(resFail.passed).toBe(false);
      expect(resFail.metrics.hasOverlap).toBe(true);
    });

    it('pl-congestion: passes when peak GCell congestion <= 1.0, fails on overflow', () => {
      const resPass = evaluateSanityCheck('pl-congestion', { peakRatio: 0.82 });
      expect(resPass.passed).toBe(true);
      expect(resPass.metrics.peakCongestionRatio).toBe(0.82);

      const resOverflow = evaluateSanityCheck('pl-congestion', { peakRatio: 1.15 });
      expect(resOverflow.passed).toBe(false);
      expect(resOverflow.logOutput.some((l) => l.includes('OVERFLOW'))).toBe(true);
    });

    it('pl-drc: verifies well-tap spacing (pitch <= 30 µm)', () => {
      const resPass = evaluateSanityCheck('pl-drc', { maxTapPitch: 25.0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('pl-drc', { maxTapPitch: 38.0 });
      expect(resFail.passed).toBe(false);
      expect(resFail.logOutput.some((l) => l.includes('VIOLATION'))).toBe(true);
    });

    it('pl-connectivity: checks signal net pin connections', () => {
      const resPass = evaluateSanityCheck('pl-connectivity', { unplacedPins: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('pl-connectivity', { unplacedPins: 2 });
      expect(resFail.passed).toBe(false);
    });

    it('pl-missing-vias: checks cell power pin rail abutment', () => {
      const resPass = evaluateSanityCheck('pl-missing-vias', { offRailCells: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('pl-missing-vias', { offRailCells: 1 });
      expect(resFail.passed).toBe(false);
    });
  });

  // ─── 3. Clock Tree Synthesis Sanity Checks (4) ───────────────────
  describe('Clock Tree Synthesis Sanity Checks', () => {
    it('cts-clock-tree-report: evaluates sink arrival latency and skew target', () => {
      const resPass = evaluateSanityCheck('cts-clock-tree-report', {
        sinks: [
          { id: 'FF1', arrivalTime: 0.220 },
          { id: 'FF2', arrivalTime: 0.235 }, // 15 ps skew <= 30 ps target
        ],
      });
      expect(resPass.passed).toBe(true);
      expect(resPass.metrics.skewPs).toBe(15);

      const resFailSkew = evaluateSanityCheck('cts-clock-tree-report', {
        sinks: [
          { id: 'FF1', arrivalTime: 0.180 },
          { id: 'FF2', arrivalTime: 0.240 }, // 60 ps skew > 30 ps target
        ],
      });
      expect(resFailSkew.passed).toBe(false);
      expect(resFailSkew.metrics.skewPs).toBe(60);
    });

    it('cts-timing-reports: verifies setup and hold margins with skew', () => {
      const resPass = evaluateSanityCheck('cts-timing-reports', { tCombNs: 0.50, captureArrivalNs: 0.21 });
      expect(resPass.passed).toBe(true);
      expect(resPass.metrics.setupSlackPs).toBeGreaterThan(0);
      expect(resPass.metrics.holdSlackPs).toBeGreaterThan(0);

      // Severe combinational delay causing setup failure
      const resFailSetup = evaluateSanityCheck('cts-timing-reports', { tCombNs: 0.95 });
      expect(resFailSetup.passed).toBe(false);
    });

    it('cts-power: checks clock buffer power budget', () => {
      const resPass = evaluateSanityCheck('cts-power', { powerMw: 2.5 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('cts-power', { powerMw: 6.8 });
      expect(resFail.passed).toBe(false);
    });

    it('cts-qor: verifies maximum clock slew <= 80 ps', () => {
      const resPass = evaluateSanityCheck('cts-qor', { maxSlewPs: 45 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('cts-qor', { maxSlewPs: 95 });
      expect(resFail.passed).toBe(false);
    });
  });

  // ─── 4. Routing Sanity Checks (5) ───────────────────────────────
  describe('Routing Sanity Checks', () => {
    it('rt-routes: checks unrouted nets (opens)', () => {
      const resPass = evaluateSanityCheck('rt-routes', { unroutedNets: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('rt-routes', { unroutedNets: 2 });
      expect(resFail.passed).toBe(false);
    });

    it('rt-lvs: verifies zero electrical shorts on metal layers', () => {
      // Orthogonal crossing on DIFFERENT layers -> NO short
      const resPass = evaluateSanityCheck('rt-lvs', {
        segments: [
          { netId: 'NET_1', layer: 'M1', x1: 20, y1: 60, x2: 160, y2: 60 },
          { netId: 'NET_2', layer: 'M2', x1: 90, y1: 20, x2: 90, y2: 140 },
        ],
      });
      expect(resPass.passed).toBe(true);

      // Colliding segments on the SAME metal layer -> SHORT
      const resFail = evaluateSanityCheck('rt-lvs', {
        segments: [
          { netId: 'NET_1', layer: 'M1', x1: 20, y1: 60, x2: 160, y2: 60 },
          { netId: 'NET_2', layer: 'M1', x1: 90, y1: 20, x2: 90, y2: 140 },
        ],
      });
      expect(resFail.passed).toBe(false);
      expect(resFail.metrics.hasShort).toBe(true);
    });

    it('rt-timing: verifies post-route setup WNS >= 0', () => {
      const resPass = evaluateSanityCheck('rt-timing', { wnsPs: 12 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('rt-timing', { wnsPs: -25 });
      expect(resFail.passed).toBe(false);
    });

    it('rt-design: checks preferred directions and min pitch DRC', () => {
      const resPass = evaluateSanityCheck('rt-design', { drcErrors: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('rt-design', { drcErrors: 5 });
      expect(resFail.passed).toBe(false);
    });

    it('rt-constraints: checks unconstrained paths and SDC syntax', () => {
      const resPass = evaluateSanityCheck('rt-constraints', { unconstrained: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('rt-constraints', { unconstrained: 3 });
      expect(resFail.passed).toBe(false);
    });
  });

  // ─── 5. Filler Cells Sanity Checks (9) ──────────────────────────
  describe('Filler Cells Sanity Checks', () => {
    it('fc-legality: verifies site alignment and off-grid fillers', () => {
      const resPass = evaluateSanityCheck('fc-legality', { offSiteCount: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fc-legality', { offSiteCount: 2 });
      expect(resFail.passed).toBe(false);
    });

    it('fc-drc: verifies continuous N-well and 100% row void coverage', () => {
      const resPass = evaluateSanityCheck('fc-drc', {
        cells: [{ widthSites: 100, startSite: 0 }],
      });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fc-drc', {
        cells: [{ widthSites: 60, startSite: 0 }], // 40 sites void remaining
      });
      expect(resFail.passed).toBe(false);
      expect(resFail.metrics.gapRemaining).toBe(40);
    });

    it('fc-connectivity: verifies VDD/VSS power rail abutment', () => {
      const resPass = evaluateSanityCheck('fc-connectivity', { railGaps: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fc-connectivity', { railGaps: 1 });
      expect(resFail.passed).toBe(false);
    });

    it('fc-design: verifies CMP layer density within 35%-75% window', () => {
      const resPass = evaluateSanityCheck('fc-design', { densityPercent: 52.0 });
      expect(resPass.passed).toBe(true);

      const resLow = evaluateSanityCheck('fc-design', { densityPercent: 28.0 });
      expect(resLow.passed).toBe(false);

      const resHigh = evaluateSanityCheck('fc-design', { densityPercent: 82.0 });
      expect(resHigh.passed).toBe(false);
    });

    it('fc-timing: verifies post-filler timing preservation', () => {
      const resPass = evaluateSanityCheck('fc-timing', { slackDeltaPs: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fc-timing', { slackDeltaPs: -15 });
      expect(resFail.passed).toBe(false);
    });

    it('fc-constraints: checks max transition and max capacitance limits', () => {
      const resPass = evaluateSanityCheck('fc-constraints', { drcViolations: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fc-constraints', { drcViolations: 3 });
      expect(resFail.passed).toBe(false);
    });

    it('fc-power: evaluates decap dynamic droop suppression vs leakage', () => {
      const resPass = evaluateSanityCheck('fc-power', { decapCapPf: 500 });
      expect(resPass.passed).toBe(true);
      expect(resPass.metrics.droopMv).toBeLessThanOrEqual(50.0);

      const resFail = evaluateSanityCheck('fc-power', { decapCapPf: 10 }); // Droop = 100*200/10 = 2000 mV > 50 mV
      expect(resFail.passed).toBe(false);
      expect(resFail.metrics.droopMv).toBeGreaterThan(50.0);
    });

    it('fc-qor: verifies IR drop supply margin >= 95.0% of VDD', () => {
      const resPass = evaluateSanityCheck('fc-qor', { irMarginPercent: 97.0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fc-qor', { irMarginPercent: 91.0 });
      expect(resFail.passed).toBe(false);
    });

    it('fc-congestion: verifies pin accessibility and routing availability', () => {
      const resPass = evaluateSanityCheck('fc-congestion', { pinBlocks: 0 });
      expect(resPass.passed).toBe(true);

      const resFail = evaluateSanityCheck('fc-congestion', { pinBlocks: 4 });
      expect(resFail.passed).toBe(false);
    });
  });

  // ─── 6. Student Design Verification vs Demonstration Drills ─────────
  describe('Student Design Verification vs Demonstration Drills', () => {
    it('rejects certification when student design is missing prerequisite layout', () => {
      const res = evaluateSanityCheck('fp-drc', {}, {
        isStudentDesign: true,
        hasStudentDesign: false,
        studentDesignReason: 'Prerequisite design missing: Complete fp-4, fp-5 first.',
      });

      expect(res.passed).toBe(false);
      expect(res.canCertify).toBe(false);
      expect(res.isDemonstration).toBe(false);
      expect(res.logOutput.join(' ')).toContain('NO STUDENT DESIGN FOUND');
    });

    it('approves certification when student design satisfies design rules', () => {
      const res = evaluateSanityCheck('fp-drc', { margin: 25.0, halo: 18.0 }, {
        isStudentDesign: true,
        hasStudentDesign: true,
      });

      expect(res.passed).toBe(true);
      expect(res.canCertify).toBe(true);
      expect(res.isDemonstration).toBe(false);
      expect(res.logOutput.join(' ')).toContain('CLEAN_PASS');
      expect(res.logOutput.join(' ')).toContain('Educational EDA Check');
    });

    it('rejects certification if student design violates design rules', () => {
      const res = evaluateSanityCheck('fp-drc', { margin: 12.0, halo: 8.0 }, {
        isStudentDesign: true,
        hasStudentDesign: true,
      });

      expect(res.passed).toBe(false);
      expect(res.canCertify).toBe(false);
      expect(res.isDemonstration).toBe(false);
      expect(res.logOutput.join(' ')).toContain('VIOLATION');
    });

    it('demonstration mode executes without certification rights (canCertify = false)', () => {
      const res = evaluateSanityCheck('fp-drc', { margin: 25.0, halo: 18.0 }, {
        isStudentDesign: false,
      });

      expect(res.passed).toBe(true);
      expect(res.canCertify).toBe(false); // Practice drill cannot award certification XP
      expect(res.isDemonstration).toBe(true);
      expect(res.logOutput.join(' ')).toContain('DEMONSTRATION DRILL');
    });

    it('all evaluations include educational scope disclosures (not foundry-qualified)', () => {
      const res = evaluateSanityCheck('rt-lvs', { shorts: 0 });
      const logsCombined = res.logOutput.join(' ');
      expect(logsCombined).toContain('Educational EDA Check');
      expect(logsCombined).toContain('Not foundry-qualified signoff');
    });
  });
});
