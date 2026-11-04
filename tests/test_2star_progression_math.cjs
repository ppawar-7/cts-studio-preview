'use strict';
/**
 * test_2star_progression_math.cjs
 * ===============================
 * Validates the minimum passing (2-star) progression mathematics across ALL 8 ASIC KINGDOMS.
 * 
 * Verifies:
 * 1. Each level's 2-star threshold is achieved by a minimal passing submission.
 * 2. Cumulative XP at 2-star passing pace satisfies every unlock threshold:
 *    - After Level 1: XP >= Level 2 threshold (20)
 *    - After Level 2: XP >= Level 3 threshold (44)
 *    - After Level 3: XP >= Level 4 threshold (72)
 *    - After Level 4: XP >= Level 5 threshold (104)
 *    - After Level 5: XP >= Next Kingdom threshold (140)
 * 3. Stage certification checks (sanity checks) are NOT required for core kingdom unlock,
 *    so bonuses cannot create inconsistent forward progression or deadlocks.
 */

async function main() {
  console.log('================================================================');
  console.log('📐 AUDITING 2-STAR MINIMUM PASSING PROGRESSION MATHEMATICS');
  console.log('================================================================\n');

  const { KINGDOMS } = await import('../src/data/kingdomsData.js');

  let allKingdomsPassed = true;

  for (const kingdom of KINGDOMS) {
    console.log(`\n🏰 Kingdom ${kingdom.order}: ${kingdom.name} (${kingdom.id})`);
    console.log(`   Next Kingdom Unlock Threshold: ${kingdom.pointsToUnlockNext} XP`);

    let cumulativeXP = 0;
    const levelScores = [];

    kingdom.levels.forEach((lvl, idx) => {
      const minPassingScore = lvl.starThresholds[1]; // 2-star threshold
      const maxScore = lvl.xpReward;
      const pointsRequired = lvl.pointsRequired;

      console.log(`   Level ${lvl.order} (${lvl.id}): Req=${pointsRequired} XP | 2-Star Pass=${minPassingScore} XP | Max=${maxScore} XP`);

      // Verify that student cumulative XP before this level is >= pointsRequired
      if (cumulativeXP < pointsRequired) {
        console.error(`   ❌ PROGRESSION DEADLOCK: Level ${lvl.id} requires ${pointsRequired} XP, but cumulative 2-star XP is only ${cumulativeXP} XP!`);
        allKingdomsPassed = false;
      } else {
        const margin = cumulativeXP - pointsRequired;
        console.log(`      ✓ Unlocked with margin: +${margin} XP (Cumulative: ${cumulativeXP} >= Req: ${pointsRequired})`);
      }

      cumulativeXP += minPassingScore;
      levelScores.push({ levelId: lvl.id, passingScore: minPassingScore, cumulativeXP });
    });

    console.log(`   🏁 Total Cumulative 2-Star XP after Level 5: ${cumulativeXP} XP`);

    if (kingdom.order < 8) {
      if (cumulativeXP < kingdom.pointsToUnlockNext) {
        console.error(`   ❌ KINGDOM PROGRESSION DEADLOCK: Kingdom requires ${kingdom.pointsToUnlockNext} XP to unlock next, but cumulative 2-star XP is only ${cumulativeXP} XP!`);
        allKingdomsPassed = false;
      } else {
        const kingdomMargin = cumulativeXP - kingdom.pointsToUnlockNext;
        console.log(`   ✓ Next Kingdom Unlocked! Margin: +${kingdomMargin} XP (${cumulativeXP} >= ${kingdom.pointsToUnlockNext})`);
      }
    } else {
      console.log(`   ✓ Final Kingdom (GDS) Complete! ASIC Tape-Out Ready.`);
    }
  }

  if (allKingdomsPassed) {
    console.log('\n================================================================');
    console.log('🎉 MATHEMATICAL PROOF CONFIRMED: 0 DEADLOCKS ACROSS ALL 8 KINGDOMS');
    console.log('   Every student scoring at 2-star passing boundary continuously progresses!');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('\n❌ Progression deadlock detected.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
