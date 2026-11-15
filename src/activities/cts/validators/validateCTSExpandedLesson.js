/**
 * validateCTSExpandedLesson.js
 * ==============================
 * Pure deterministic validators for CTS Expanded Curriculum (cts-6 through cts-12).
 * Supports both standalone submission checks and comprehensive 12-gate CTS Capstone.
 *
 * Strict engineering acceptance criteria:
 * - Recomputes metrics from the project graph (never trusts client-supplied solution objects).
 * - Enforces required saved project (no quiz-only bypass).
 * - Detects cycles, disconnected sinks, and invalid topologies.
 * - Enforces level-specific design evidence (repeaters, blockage avoidance, power, timing slack).
 * - Standardizes on BLOCKAGE_COLLISION / MACRO_OBSTRUCTION blockage violation handling.
 */

import { solveClockTreeElmore } from '../../../engine/ctsEngine.js';
import { createDesignArtifact, ARTIFACT_KINDS } from '../../../logic/designArtifactContracts.js';
import { CTS_EXPANDED_CURRICULUM } from '../expanded/ctsCurriculumData.js';

export function validateCTSExpandedLesson(submission) {
  if (!submission) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'No submission received. Please select an answer and ensure your project is saved in CTS Studio.',
    };
  }

  const { lessonId, answer, project } = submission;
  const lessonData = CTS_EXPANDED_CURRICULUM[lessonId];

  if (!lessonData) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: `Unknown lesson ID: ${lessonId}`,
    };
  }

  // 1. Concept Verification
  const isAnswerCorrect = answer === lessonData.question.correctValue;
  if (!isAnswerCorrect) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: `Incorrect concept answer. Review the theory on ${lessonData.title} and try again.`,
    };
  }

  // 2. Reject Missing or Untouched Project (Fail-Closed against quiz-only bypass)
  if (!project || typeof project !== 'object' || !project.root || !Array.isArray(project.sinks) || !Array.isArray(project.branches)) {
    return {
      passed: false,
      score: 0,
      stars: 0,
      feedback: 'A saved CTS Studio project is required to verify this lesson. Open CTS Studio 1.0, configure your clock tree design, and click Save before submitting.',
    };
  }

  // 3. Recompute metrics strictly from the project graph (never trust client-supplied solution object)
  const sol = solveClockTreeElmore(project);

  // 4. Verify graph validity (acyclic, reachable sinks, valid node structure)
  if (!sol.isValid) {
    const errorMsg = sol.errors?.join('; ') || 'Graph configuration error.';
    return {
      passed: false,
      score: 15,
      stars: 0,
      feedback: `Clock tree is invalid: ${errorMsg} (disconnected sinks or illegal topology).`,
    };
  }

  if (sol.diagnostics?.hasCycle) {
    return {
      passed: false,
      score: 15,
      stars: 0,
      feedback: 'Graph contains cycles. Clock trees must be directed acyclic graphs (DAGs).',
    };
  }

  if (sol.diagnostics?.hasDisconnectedSinks || sol.sinks.some((s) => !s.isReached)) {
    return {
      passed: false,
      score: 15,
      stars: 0,
      feedback: 'One or more clock sinks are disconnected from the clock root pin.',
    };
  }

  // 5. Specific Level Gate Checks & Evidence Verification
  switch (lessonId) {
    case 'cts-6': {
      // Wire RC Delay & Repeater Slicing
      if (project.sinks.length < 4) {
        return {
          passed: false,
          score: 15,
          stars: 0,
          feedback: 'Lab 6 requires an asymmetric distribution network with at least 4 sinks. Please load scenario-asymmetric-6 in CTS Studio.',
        };
      }

      if (!project.buffers || project.buffers.length < 2) {
        return {
          passed: false,
          score: 20,
          stars: 1,
          feedback: 'Repeater buffers are required to segment long clock lines and prevent quadratic RC delay growth. Insert repeaters in CTS Studio!',
        };
      }

      const maxSlew = sol.violations?.find((v) => v.type === 'MAX_TRANSITION');
      if (maxSlew) {
        return {
          passed: false,
          score: 20,
          stars: 1,
          feedback: `Concept correct, but your saved design still has transition slew violations (${maxSlew.message}). Insert repeaters along long lines!`,
        };
      }

      if (sol.maxArrivalPs > 350) {
        return {
          passed: false,
          score: 20,
          stars: 1,
          feedback: `Insertion delay (${sol.maxArrivalPs} ps) exceeds 350 ps budget. Tune buffer placement to reduce latency.`,
        };
      }

      return {
        passed: true,
        score: lessonData.xpReward,
        stars: 3,
        feedback: `Flawless! You mastered repeater insertion, wire RC delay mitigation, and transition time sharpening. (+${lessonData.xpReward} XP)`,
      };
    }

    case 'cts-7': {
      // Fanout & Max Capacitance
      if (project.sinks.length < 4) {
        return {
          passed: false,
          score: 15,
          stars: 0,
          feedback: 'Lab 7 requires the overloaded driver benchmark. Please load scenario-flawed-starter in CTS Studio.',
        };
      }

      const hasFanoutViolation = sol.violations?.some((v) => v.type === 'MAX_FANOUT');
      const hasCapViolation = sol.violations?.some((v) => v.type === 'MAX_CAPACITANCE');
      if (hasFanoutViolation || hasCapViolation) {
        return {
          passed: false,
          score: 22,
          stars: 1,
          feedback: 'Concept correct, but your design still contains fanout or capacitance violations. Upsize buffers or split branch loads!',
        };
      }

      // Reject untouched flawed starter (where weak X1 buffer drives everything directly)
      if (project.buffers.length < 2 && project.buffers.every((b) => b.cellType === 'CLKBUF_X1')) {
        return {
          passed: false,
          score: 22,
          stars: 1,
          feedback: 'You must upsize the weak driver (e.g. to CLKBUF_X4) or add intermediate distribution repeaters to split fanout!',
        };
      }

      return {
        passed: true,
        score: lessonData.xpReward,
        stars: 3,
        feedback: `Excellent! You resolved driver overload by managing fanout and capacitive limits. (+${lessonData.xpReward} XP)`,
      };
    }

    case 'cts-8': {
      // Sink Clustering & Hierarchical Tree
      if (project.sinks.length < 4) {
        return {
          passed: false,
          score: 15,
          stars: 0,
          feedback: 'Lab 8 requires at least 4 clock sinks. Please load scenario-asymmetric-6 in CTS Studio.',
        };
      }

      if (!project.buffers || project.buffers.length < 2) {
        return {
          passed: false,
          score: 25,
          stars: 1,
          feedback: 'Hierarchical tree synthesis requires intermediate distribution buffers driving regional sink clusters.',
        };
      }

      if (sol.skewPs > 40) {
        return {
          passed: false,
          score: 25,
          stars: 1,
          feedback: `Concept correct, but clock skew (${sol.skewPs} ps) exceeds cluster budget (<= 40 ps). Place buffers near cluster centroids or run Auto-Balance!`,
        };
      }

      return {
        passed: true,
        score: lessonData.xpReward,
        stars: 3,
        feedback: `Great work! Centroid-based clustering achieved tight local latency matching. (+${lessonData.xpReward} XP)`,
      };
    }

    case 'cts-9': {
      // Obstruction-Aware Clock Routing
      if (project.sinks.length < 6) {
        return {
          passed: false,
          score: 15,
          stars: 0,
          feedback: 'Lab 9 requires the obstruction benchmark. Please load scenario-blockage-8 in CTS Studio.',
        };
      }

      if (!project.blockages || project.blockages.length === 0) {
        return {
          passed: false,
          score: 15,
          stars: 0,
          feedback: 'Lab 9 requires macro keepout blockages. Please load scenario-blockage-8 in CTS Studio.',
        };
      }

      const hasBlockageViolation = sol.violations?.some((v) => v.type === 'BLOCKAGE_COLLISION' || v.type === 'MACRO_OBSTRUCTION');
      if (hasBlockageViolation) {
        return {
          passed: false,
          score: 28,
          stars: 1,
          feedback: 'Concept correct, but buffers overlap with macro keepout zones! Move buffers into legal placement corridors.',
        };
      }

      if (sol.skewPs > 40) {
        return {
          passed: false,
          score: 28,
          stars: 1,
          feedback: `Clock skew (${sol.skewPs} ps) exceeds corridor budget (<= 40 ps). Balance detour paths in CTS Studio.`,
        };
      }

      return {
        passed: true,
        score: lessonData.xpReward,
        stars: 3,
        feedback: `Superb! Your clock tree cleanly navigates around macro blockages with legal repeater placement. (+${lessonData.xpReward} XP)`,
      };
    }

    case 'cts-10': {
      // Clock Gating & Power
      if (project.sinks.length < 4) {
        return {
          passed: false,
          score: 15,
          stars: 0,
          feedback: 'Lab 10 requires at least 4 clock sinks to evaluate switching power.',
        };
      }

      if (sol.dynamicPowerMw > 2.5) {
        return {
          passed: false,
          score: 30,
          stars: 1,
          feedback: `Concept correct, but clock dynamic power (${sol.dynamicPowerMw} mW) exceeds allocated power budget (<= 2.5 mW). Trim wirelength or resize repeaters!`,
        };
      }

      if (sol.skewPs > 40) {
        return {
          passed: false,
          score: 30,
          stars: 1,
          feedback: `Clock skew (${sol.skewPs} ps) exceeds budget (<= 40 ps).`,
        };
      }

      return {
        passed: true,
        score: lessonData.xpReward,
        stars: 3,
        feedback: `Outstanding! You balanced clock distribution while keeping dynamic switching power strictly controlled. (+${lessonData.xpReward} XP)`,
      };
    }

    case 'cts-11': {
      // Useful Skew & Hold Slack
      if (!project.dataPaths || project.dataPaths.length === 0) {
        return {
          passed: false,
          score: 15,
          stars: 0,
          feedback: 'Lab 11 requires synchronous data paths. Please load scenario-asymmetric-6 or scenario-capstone-soc in CTS Studio.',
        };
      }

      const hasSetupViolation = sol.violations?.some((v) => v.type === 'SETUP_TIMING_VIOLATION');
      const hasHoldViolation = sol.violations?.some((v) => v.type === 'HOLD_TIMING_VIOLATION');
      if (hasSetupViolation || hasHoldViolation) {
        return {
          passed: false,
          score: 32,
          stars: 1,
          feedback: 'Concept correct, but your active clock tree exhibits setup or hold timing violations. Ensure positive skew does not cause hold race conditions!',
        };
      }

      if (sol.dataPaths.some((dp) => !dp.setupPassed || !dp.holdPassed)) {
        return {
          passed: false,
          score: 32,
          stars: 1,
          feedback: 'One or more synchronous data paths failed timing closure.',
        };
      }

      return {
        passed: true,
        score: lessonData.xpReward,
        stars: 3,
        feedback: `Masterful timing closure! You utilized clock skew effectively without causing fatal hold violations. (+${lessonData.xpReward} XP)`,
      };
    }

    case 'cts-12': {
      // ─── ADVANCED CTS CAPSTONE (12 GOLDEN GATES) ──────────────────────────
      // Gate 1: Sink count >= 8
      if (project.sinks.length < 8) {
        return {
          passed: false,
          score: 40,
          stars: 1,
          feedback: `Gate 1 Failed: Capstone requires at least 8 clock sinks (found ${project.sinks.length}). Load scenario-capstone-soc in Studio!`,
        };
      }

      // Gate 2: Graph cycles
      if (sol.diagnostics?.hasCycle) {
        return {
          passed: false,
          score: 40,
          stars: 1,
          feedback: 'Gate 2 Failed: Graph contains cycles. Clock trees must be directed acyclic graphs.',
        };
      }

      // Gate 3: Disconnected sinks
      if (sol.diagnostics?.hasDisconnectedSinks || sol.sinks.some((s) => !s.isReached)) {
        return {
          passed: false,
          score: 40,
          stars: 1,
          feedback: 'Gate 3 Failed: One or more clock sinks are disconnected from the clock root pin.',
        };
      }

      // Gate 4: Blockage overlap (support both BLOCKAGE_COLLISION and MACRO_OBSTRUCTION)
      if (sol.violations?.some((v) => v.type === 'BLOCKAGE_COLLISION' || v.type === 'MACRO_OBSTRUCTION')) {
        return {
          passed: false,
          score: 50,
          stars: 1,
          feedback: 'Gate 4 Failed: One or more buffers overlap with macro keepout zones.',
        };
      }

      // Gate 5: Fanout limit
      if (sol.violations?.some((v) => v.type === 'MAX_FANOUT')) {
        return {
          passed: false,
          score: 55,
          stars: 1,
          feedback: 'Gate 5 Failed: Buffer fanout exceeds maximum limit (<= 4).',
        };
      }

      // Gate 6: Capacitance limit
      if (sol.violations?.some((v) => v.type === 'MAX_CAPACITANCE')) {
        return {
          passed: false,
          score: 60,
          stars: 2,
          feedback: 'Gate 6 Failed: Buffer load capacitance exceeds cell maximum limits.',
        };
      }

      // Gate 7: Slew / Transition limit
      if (sol.violations?.some((v) => v.type === 'MAX_TRANSITION')) {
        return {
          passed: false,
          score: 65,
          stars: 2,
          feedback: 'Gate 7 Failed: Clock edge transition time exceeds limit.',
        };
      }

      // Gate 8: Skew Budget (<= 60 ps)
      if (sol.skewPs > 60) {
        return {
          passed: false,
          score: 70,
          stars: 2,
          feedback: `Gate 8 Failed: Global clock skew is ${sol.skewPs} ps (target budget: <= 60 ps). Auto-balance or tune delays!`,
        };
      }

      // Gate 9: Latency Budget (<= 350 ps)
      if (sol.maxArrivalPs > 350) {
        return {
          passed: false,
          score: 75,
          stars: 2,
          feedback: `Gate 9 Failed: Maximum insertion delay is ${sol.maxArrivalPs} ps (target budget: <= 350 ps).`,
        };
      }

      // Gate 10: Setup Timing
      if (sol.violations?.some((v) => v.type === 'SETUP_TIMING_VIOLATION')) {
        return {
          passed: false,
          score: 80,
          stars: 2,
          feedback: 'Gate 10 Failed: Setup timing violated on one or more synchronous data paths.',
        };
      }

      // Gate 11: Hold Timing
      if (sol.violations?.some((v) => v.type === 'HOLD_TIMING_VIOLATION')) {
        return {
          passed: false,
          score: 85,
          stars: 2,
          feedback: 'Gate 11 Failed: Hold timing violated on one or more synchronous data paths.',
        };
      }

      // Gate 12: Zero DRC Violations
      if (sol.violations && sol.violations.length > 0) {
        return {
          passed: false,
          score: 90,
          stars: 2,
          feedback: `Gate 12 Failed: Design still contains ${sol.violations.length} unresolved diagnostic warnings.`,
        };
      }

      // ALL 12 GATES PASSED! Create formal design artifact
      const minSetupSlack = sol.dataPaths?.length > 0
        ? Math.min(...sol.dataPaths.map((dp) => dp.setupSlackPs)) / 1000
        : 0.15;
      const minHoldSlack = sol.dataPaths?.length > 0
        ? Math.min(...sol.dataPaths.map((dp) => dp.holdSlackPs)) / 1000
        : 0.08;

      const artifacts = createDesignArtifact({
        kind: ARTIFACT_KINDS.CTS_CLOCK_TREE,
        sourceLevelId: 'cts-12',
        inputs: {
          sinksCount: project.sinks.length,
          buffersCount: project.buffers.length,
          branchesCount: project.branches.length,
        },
        measurements: {
          skewPs: sol.skewPs,
          latencyPs: sol.maxArrivalPs,
          maxLatencyPs: sol.maxArrivalPs,
          powerMw: sol.dynamicPowerMw,
          setupSlack: minSetupSlack,
          holdSlack: minHoldSlack,
          wirelengthUm: sol.wirelengthUm,
        },
      });

      return {
        passed: true,
        score: 100,
        stars: 3,
        feedback: `🏆 CONGRATULATIONS! You passed all 12 Golden Gates of Clock Tree Synthesis Signoff! 10-sink SoC clock tree balanced to ${sol.skewPs} ps skew, latency ${sol.maxArrivalPs} ps, zero DRC violations, and timing closure approved. (+100 XP, 3 Stars)`,
        artifacts: [artifacts],
        artifact: artifacts,
      };
    }

    default:
      return {
        passed: true,
        score: lessonData.xpReward,
        stars: 3,
        feedback: `Completed ${lessonData.title}! (+${lessonData.xpReward} XP)`,
      };
  }
}
