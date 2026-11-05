# ASIC Physical Design Playground — Progression Rules & Game Mathematics

This document specifies the exact progression mathematics, unlock prerequisites, scoring rubrics, star thresholds, and achievement conditions across all 8 ASIC Kingdoms.

---

## 1. Kingdom Progression & Unlock Mechanics

The platform consists of 8 sequential ASIC kingdoms representing the complete RTL-to-GDSII flow:

1. **RTL Understanding** (`rtl-understanding`)
2. **Logic Synthesis** (`synthesis`)
3. **Floorplanning** (`floorplanning`)
4. **Placement** (`placement`)
5. **Clock Tree Synthesis** (`cts`)
6. **Global & Detailed Routing** (`routing`)
7. **Filler Cells & Physical Verification** (`filler-cells`)
8. **GDSII & Tape-Out** (`gds`)

### 1.1 Unlocking Kingdom 1
- **Always Unlocked**: `rtl-understanding` is available to all students immediately upon initial launch.

### 1.2 Unlocking Subsequent Kingdoms ($N > 1$)
Kingdom $N$ unlocks if and only if **both** of the following requirements are satisfied in Kingdom $N - 1$:
1. **Core Level Completion**: All 5 core concept levels in Kingdom $N - 1$ must be completed (`completed === true`).
2. **Kingdom XP Threshold**: Total XP earned in Kingdom $N - 1$ must meet or exceed `pointsToUnlockNext`.

```mermaid
flowchart TD
    Start["Start Kingdom N-1"] --> L1["Complete Level 1"]
    L1 --> L2["Complete Level 2"]
    L2 --> L3["Complete Level 3"]
    L3 --> L4["Complete Level 4"]
    L4 --> L5["Complete Level 5"]
    L5 --> CheckGate{"Are All 5 Levels Done<br/>AND Kingdom XP >= pointsToUnlockNext?"}
    CheckGate -- Yes --> UnlockK["🔓 Kingdom N Unlocked!"]
    CheckGate -- No --> Review["Replay levels for higher score"]
    UnlockK --> Sanity["Optional: Complete Stage Sanity Checks (Side Quests)"]
    Sanity --> Certify["🛡️ Earn Full Stage Certification Badge & 50 XP Bonus"]
```

> [!NOTE]
> **Decoupled Stage Certification**: Sanity check side quests are **not** hard blockers for unlocking Kingdom $N$. This eliminates progression deadlocks while providing rich side quests for motivated students to earn the "Stage Certified" gold badge and a +50 XP completion bonus.

---

## 2. Kingdom XP Thresholds & Reward Matrix

| Order | Kingdom ID | Name | Core Levels | `pointsToUnlockNext` | Max Level XP | Sanity Checks | Sanity XP | Kingdom Bonus | Max Total Kingdom XP |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `rtl-understanding` | RTL Understanding | 5 | 140 | 200 | 0 | 0 | +50 | 250 |
| 2 | `synthesis` | Logic Synthesis | 5 | 140 | 200 | 0 | 0 | +50 | 250 |
| 3 | `floorplanning` | Floorplanning | 5 | 140 | 200 | 3 | 60 | +50 | 310 |
| 4 | `placement` | Placement | 5 | 140 | 200 | 5 | 100 | +50 | 350 |
| 5 | `cts` | Clock Tree Synthesis | 5 | 140 | 200 | 4 | 80 | +50 | 330 |
| 6 | `routing` | Routing | 5 | 140 | 200 | 5 | 100 | +50 | 350 |
| 7 | `filler-cells` | Filler Cells | 5 | 140 | 200 | 9 | 180 | +50 | 430 |
| 8 | `gds` | GDSII & Tape-Out | 5 | 0 | 200 | 0 | 0 | +50 | 250 |
| **Total** | — | **All 8 Kingdoms** | **40** | — | **1600** | **26** | **520** | **+400** | **2520 XP** |

---

## 3. Level-by-Level Unlock Gates & Star Mathematics

Each kingdom contains exactly 5 core concept levels.

### 3.1 Unlocking Level $M$ within Kingdom $K$
- **Level 1** ($M = 1$): Unlocked immediately when Kingdom $K$ is unlocked. Requires $0\ \text{XP}$.
- **Subsequent Levels** ($M \in \{2, 3, 4, 5\}$): Unlocked when:
  1. Level $M - 1$ is completed (`player.levelProgress[prevLevelId].completed === true`).
  2. Total XP earned within Kingdom $K$ meets or exceeds Level $M$'s `pointsRequired`.

### 3.2 Calibrated Level Reward Structure & 2-Star Progression Proof

The curriculum uses calibrated score gates to ensure mathematical progression continuity: **any student who earns the lowest acceptable passing score (2 stars) is mathematically guaranteed to unlock the next level and next kingdom without deadlocks or manual replay grinding**.

| Level | Role / Concept Focus | `pointsRequired` | Max `xpReward` | 1-Star Threshold | 2-Star Threshold | 3-Star Threshold | Cumulative 2-Star XP | Next Gate Requirement |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Level 1** | Conceptual Foundation & Core Primitive | 0 XP | 30 XP | 10 XP | **20 XP** | 30 XP | 20 XP | 20 XP (Level 2 Unlocks) |
| **Level 2** | Architecture, Formats, & Syntax | 20 XP | 35 XP | 12 XP | **24 XP** | 35 XP | 44 XP | 44 XP (Level 3 Unlocks) |
| **Level 3** | Quantitative Analysis & Trade-Offs | 44 XP | 40 XP | 15 XP | **28 XP** | 40 XP | 72 XP | 72 XP (Level 4 Unlocks) |
| **Level 4** | Advanced Algorithms & DRC Rules | 72 XP | 45 XP | 18 XP | **32 XP** | 45 XP | 104 XP | 104 XP (Level 5 Unlocks) |
| **Level 5** | Capstone Design & Sign-Off Integration | 104 XP | 50 XP | 20 XP | **38 XP** | 50 XP | 142 XP | 140 XP (Kingdom N+1 Unlocks) |

**Mathematical Proof of Progression Continuity:**
1. Completing Level 1 at 2 stars awards $20\ \text{XP} \ge 20\ \text{XP}$ (`pointsRequired` for Level 2). Level 2 unlocks.
2. Completing Level 2 at 2 stars awards $+24\ \text{XP}$, bringing Kingdom XP to $44\ \text{XP} \ge 44\ \text{XP}$ (`pointsRequired` for Level 3). Level 3 unlocks.
3. Completing Level 3 at 2 stars awards $+28\ \text{XP}$, bringing Kingdom XP to $72\ \text{XP} \ge 72\ \text{XP}$ (`pointsRequired` for Level 4). Level 4 unlocks.
4. Completing Level 4 at 2 stars awards $+32\ \text{XP}$, bringing Kingdom XP to $104\ \text{XP} \ge 104\ \text{XP}$ (`pointsRequired` for Level 5). Level 5 unlocks.
5. Completing Level 5 at 2 stars awards $+38\ \text{XP}$, bringing Kingdom XP to $142\ \text{XP} \ge 140\ \text{XP}$ (`pointsToUnlockNext`). The next kingdom unlocks immediately.
6. A student earning maximum mastery (3 stars) accumulates $30 + 35 + 40 + 45 + 50 = 200\ \text{XP}$, exceeding the kingdom unlock threshold by $60\ \text{XP}$. No deadlock is possible under any passing path.

### 3.3 Star Computation Function
```javascript
export function computeStars(score, thresholds) {
  if (score >= thresholds[2]) return 3; // 100% mastery
  if (score >= thresholds[1]) return 2; // Passing standard (>= ~80%)
  if (score >= thresholds[0]) return 1; // Basic completion (>= 50%)
  return 0;                             // Unacceptable / non-passing
}
```

### 3.4 Replay & Score Upgrade Invariant
When a student replays an already completed level:
- New score is evaluated by the pure validator.
- If $\text{New Score} > \text{Previous Best Score}$:
  $$\Delta \text{XP} = \text{New Score} - \text{Previous Best Score}$$
  $$\text{Player Total XP} \leftarrow \text{Player Total XP} + \Delta \text{XP}$$
  $$\text{Level Stars} \leftarrow \max(\text{New Stars}, \text{Previous Stars})$$
- If $\text{New Score} \le \text{Previous Best Score}$, player total XP and stars are **strictly preserved** without downgrade or duplicate reward.

---

## 4. Sanity Check Sign-Off Audits (Side Quests)

Sanity checks are stage-specific verification audits.

### 4.1 Activation Prerequisite
Sanity checks for Kingdom $K$ become active (`status === 'available'`) only when **all 5 core levels** of Kingdom $K$ have been completed. This ensures the physical design database exists before running verification ruledecks.

### 4.2 Sequential Chaining
- Sanity Check #1 in a kingdom is available immediately after core levels are done.
- Sanity Check $\#i$ ($i > 1$) unlocks when Sanity Check $\#(i-1)$ has passed.

### 4.3 Certification & Bonus XP
When a student runs a sanity check:
- The domain engine executes the corresponding ruledeck.
- If physical design criteria are satisfied (e.g. 0 overlaps, $\text{droop} \le 50\ \text{mV}$, $\text{skew} \le 80\ \text{ps}$), the student can click **🛡️ Sign-Off & Certify Stage Check**.
- Awards check `xpReward` (typically $20\ \text{XP}$).
- When **all** sanity checks in the kingdom are certified, the player earns an additional **+50 XP Stage Certification Bonus** and a permanent gold badge on the world map.

---

## 5. Player Ranks & Achievement Triggers

### 5.1 Player Levels (Title Progression)
| Player Level | Title | Required Total XP |
| :---: | :--- | :---: |
| 1 | Circuit Novice | 0 XP |
| 2 | Gate Guardian | 50 XP |
| 3 | RTL Rider | 150 XP |
| 4 | Synthesis Sage | 300 XP |
| 5 | Floor Architect | 500 XP |
| 6 | Placement Pro | 750 XP |
| 7 | Clock Keeper | 1050 XP |
| 8 | Route Master | 1400 XP |
| 9 | Filler Wizard | 1800 XP |
| 10 | Tape-Out Legend | 2250 XP |
| 11 | ASIC Grandmaster | 2800 XP |

### 5.2 Achievements

| Achievement ID | Name | Description | Trigger Condition |
| :--- | :--- | :--- | :--- |
| `first-level` | First Silicon Step | Complete your very first level | $\ge 1$ level completed |
| `truth-table-master` | Truth Table Master | Master all 8 rows of the 2:1 MUX | `rtl-1` completed with 3 stars |
| `rtl-master` | RTL Grand Architect | Complete all levels of RTL Kingdom | All 5 RTL levels completed |
| `syn-master` | Logic Synthesis Master | Complete all levels of Synthesis Kingdom | All 5 Synthesis levels completed |
| `fp-master` | Floorplan Architect | Complete all levels of Floorplanning | All 5 Floorplanning levels completed |
| `pl-master` | Legal Placement Pro | Complete all levels of Placement | All 5 Placement levels completed |
| `cts-master` | Clock Tree Virtuoso | Complete all levels of CTS | All 5 CTS levels completed |
| `rt-master` | Route Mastermind | Complete all levels of Routing | All 5 Routing levels completed |
| `fc-master` | Physical Integrity Guardian | Complete all levels of Filler Cells | All 5 Filler Cells levels completed |
| `gds-master` | Tape-Out Champion | Complete all levels of GDSII Kingdom | All 5 GDS levels completed |
| `grandmaster` | ASIC Grandmaster | Complete all 8 kingdoms across the flow | All 8 kingdoms completed |


---

## 7. Replay Delta Scoring Formula & Certification Idempotence

When a student replays an activity to achieve a higher score or refine their design geometry:
$$\Delta \text{XP} = \max(0, \text{NewScore} - \text{PreviouslyRecordedXP})$$

- Total player XP increases only by $\Delta \text{XP}$, preventing artificial XP grinding while fully rewarding genuine engineering optimization.
- The corresponding `studentDesignArtifacts` record is replaced with the newly validated layout artifact.
- Certified stage sanity checks award $25\text{ XP}$ upon initial certification. Subsequent runs of certified checks confirm compliance without awarding duplicate XP.
