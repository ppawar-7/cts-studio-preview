/**
 * validateCTSExpandedLesson.js
 * ==============================
 * Pure deterministic validators for CTS Expanded Curriculum (cts-6 through cts-12).
 * Supports both standalone submission checks and comprehensive 12-gate CTS Capstone.
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

  const { lessonId, answer, project, solution } = submission;
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

  // Solve the student's project if not pre-solved
  const sol = solution || (project ? solveClockTreeElmore(project) : null);

  // 2. Specific Level Gate Checks
  switch (lessonId) {
    case 'cts-6': {
      // Wire RC Delay & Repeater Slicing
      const maxSlew = sol?.violations?.find((v) => v.type === 'MAX_TRANSITION');
      if (sol && maxSlew) {
        return {
          passed: false,
          score: 20,
          stars: 1,
          feedback: `Concept correct, but your saved design still has transition slew violations (${maxSlew.message}). Insert repeaters along long lines!`,
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
      const hasFanoutViolation = sol?.violations?.some((v) => v.type === 'MAX_FANOUT');
      const hasCapViolation = sol?.violations?.some((v) => v.type === 'MAX_CAPACITANCE');
      if (sol && (hasFanoutViolation || hasCapViolation)) {
        return {
          passed: false,
          score: 22,
          stars: 1,
          feedback: 'Concept correct, but your design still contains fanout or capacitance violations. Upsize buffers or split branch loads!',
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
      if (sol && sol.skewPs > 45) {
        return {
          passed: false,
          score: 25,
          stars: 1,
          feedback: `Concept correct, but clock skew (${sol.skewPs} ps) exceeds cluster budget (<= 45 ps). Place buffers near cluster centroids!`,
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
      const hasBlockageViolation = sol?.violations?.some((v) => v.type === 'BLOCKAGE_COLLISION');
      if (sol && hasBlockageViolation) {
        return {
          passed: false,
          score: 28,
          stars: 1,
          feedback: 'Concept correct, but buffers overlap with macro keepout zones! Move buffers into legal placement corridors.',
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
      if (sol && sol.dynamicPowerMw > 3.0) {
        return {
          passed: false,
          score: 30,
          stars: 1,
          feedback: `Concept correct, but clock dynamic power (${sol.dynamicPowerMw} mW) exceeds allocated power budget (<= 3.0 mW). Trim wirelength or resize repeaters!`,
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
      const hasSetupViolation = sol?.violations?.some((v) => v.type === 'SETUP_TIMING_VIOLATION');
      const hasHoldViolation = sol?.violations?.some((v) => v.type === 'HOLD_TIMING_VIOLATION');
      if (sol && (hasSetupViolation || hasHoldViolation)) {
        return {
          passed: false,
          score: 32,
          stars: 1,
          feedback: 'Concept correct, but your active clock tree exhibits setup or hold timing violations. Ensure positive skew does not cause hold race conditions!',
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
      if (!project || !sol) {
        return {
          passed: false,
          score: 0,
          stars: 0,
          feedback: 'CTS Capstone requires a complete, saved clock tree design from CTS Studio 1.0.',
        };
      }

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

      // Gate 4: Blockage overlap
      if (sol.violations?.some((v) => v.type === 'BLOCKAGE_COLLISION')) {
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
          feedback: 'Gate 7 Failed: Clock edge transition time exceeds 100 ps limit.',
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
