# ASIC Physical Design Playground — System Architecture & Component Design

This document details the software architecture, state lifecycle, component hierarchy, validation pipeline, and engine subsystem boundaries of PD Playground (`Game-Site`).

---

## 1. High-Level Architecture Overview

The PD Playground application is a single-page React application built with Vite that executes 100% locally in the student's browser with zero backend or external network dependencies.

```mermaid
flowchart TD
    User["Student / User"] --> ReactUI["React UI Layer (Vite + React Router)"]
    
    subgraph UI_Components ["UI Components & Pages"]
        WorldMap["WorldMapPage (8 Kingdoms)"]
        KingdomView["KingdomPage (Part 1 Levels + Part 2 Sanity Checks)"]
        LevelView["LevelPage (Activity Host & Stage Chrome)"]
        Dashboard["DashboardPage (Stats & Progress Matrix)"]
    end
    
    subgraph Context_Layer ["Context & Progression Engine"]
        PC["PlayerContext (React Context)"]
        PE["progressionEngine.js (Pure Functional Game Logic)"]
        LS[("Browser localStorage (Schema v2)")]
    end
    
    subgraph Activity_Subsystem ["Activity & Validation Subsystem"]
        Host["ActivityHost (Dynamically Mounts Level Component)"]
        Registry["Activity Registry (40 Level Definitions)"]
        Val["Pure Functional Validators (Strict Evaluation)"]
    end
    
    subgraph Domain_Engines ["Physical Design & EDA Numerical Engines"]
        GE["geometryEngine.js"]
        DL["digitalLogic.js"]
        SE["synthesisEngine.js"]
        PEng["placementEngine.js"]
        CTS["ctsEngine.js"]
        RE["routingEngine.js"]
        FC["fillerCellsEngine.js"]
        GDS["gdsEngine.js"]
        SCE["sanityCheckEngine.js (26 Stage Ruledecks)"]
    end
    
    subgraph External_Labs ["Standalone Reference Laboratories"]
        RTL_Lab["RTL Playground (Verilog/FSM/ALU)"]
        STA_Lab["STA Playground (Timing Closure/PVT)"]
    end

    ReactUI --> UI_Components
    UI_Components --> Context_Layer
    LevelView --> Activity_Subsystem
    Activity_Subsystem --> Domain_Engines
    KingdomView --> SCE
    KingdomView -.-> External_Labs
    PC <--> LS
    PC --> PE
```

---

## 2. Component Hierarchy & Page Structure

```
App.jsx (HashRouter / BrowserRouter)
│
├── Navbar.jsx (Global Branding, Avatar, Total XP Badge, Reset Option)
│
├── Routes:
│   ├── / -> LandingPage.jsx (Flow overview & quick resume)
│   │
│   ├── /world-map -> WorldMapPage.jsx
│   │   └── KingdomCard.jsx (x8 kingdoms: locked, available, completed)
│   │
│   ├── /kingdom/:kingdomId -> KingdomPage.jsx
│   │   ├── KingdomExternalLabCard (RTL Studio / STA Lab deep-links)
│   │   ├── Part 1: Core Concept Levels
│   │   │   └── LevelCard.jsx (x5 levels per kingdom: locked/available/done, star badges)
│   │   ├── Part 2: Stage Sanity Checks (Side Quests)
│   │   │   └── SanityCard.jsx (x3 to x9 audits: locked/available/certified)
│   │   └── SanityModal (Interactive EDA Sign-Off Terminal & Ruledeck Execution)
│   │
│   ├── /kingdom/:kingdomId/level/:levelId -> LevelPage.jsx
│   │   ├── ActivityHost.jsx (Dynamic level resolution via registry)
│   │   │   └── [Active Level Component, e.g. RTLMuxChallenge, FloorplanDieSetup, ...]
│   │   └── LevelCompletionModal (Star rating, XP award, return / next-level routing)
│   │
│   └── /dashboard -> DashboardPage.jsx
│       ├── StatCards (XP, Player Level, Kingdoms Unlocked, Levels Done, Sanity Checks)
│       ├── Overall Completion Progress Bar (Levels + Sanity Checks combined)
│       └── Per-Kingdom Progress Grid & Achievements Showcase
```

---

## 3. Pure Validation Pipeline & Reward Integrity

A core architectural principle of PD Playground is **complete decoupling of client UI from reward authorization**.

Students **cannot** receive XP or stars by manipulating UI sliders, passing client-side score payloads, or faking simulation timers.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Activity as Activity Component (UI)
    participant Host as ActivityHost.jsx
    participant Validator as Pure Validator (validateLevel.js)
    participant LevelPage as LevelPage.jsx
    participant Context as PlayerContext.jsx
    participant Engine as progressionEngine.js
    participant Storage as localStorage

    Student->>Activity: Interacts with circuit / canvas / form
    Student->>Activity: Clicks "Verify Circuit & Submit Challenge"
    Activity->>Host: emit onComplete(studentAnswersObject)
    Note over Host: Raw answers object passed<br/>No score or passed flag trusted!
    Host->>Validator: validator(studentAnswersObject)
    Validator->>Validator: Evaluates truth tables / geometry / timing rules
    Validator-->>Host: { passed: boolean, score: number, stars: number, feedback: string[] }
    
    alt Validation Failed
        Host-->>Activity: Formative feedback, highlight violating rows/nodes
        Activity-->>Student: Display specific engineering diagnostic
    else Validation Succeeded
        Host->>LevelPage: onLevelVerified({ score, stars, passed: true })
        LevelPage->>Context: completeLevel(kingdomId, level, score)
        Context->>Engine: applyLevelCompletion(player, kingdomId, level, score)
        Note over Engine: Computes XP delta (max - previous),<br/>Checks kingdom completion,<br/>Awards bonus XP if applicable,<br/>Evaluates achievement conditions
        Engine-->>Context: updatedPlayerState
        Context->>Storage: setItem('pdplayground_player_v2', JSON.stringify(updatedPlayerState))
        Context-->>LevelPage: State updated
        LevelPage-->>Student: Display Victory Modal (+XP, 1-3 Stars, Next Level CTA)
    end
```

---

## 4. Sanity Check Sign-Off Architecture

Sanity checks are organized into stage-specific audits that verify the physical integrity of the database created by completing the core levels.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Page as KingdomPage.jsx
    participant Modal as SanityModal (Terminal)
    participant Engine as sanityCheckEngine.js
    participant Domain as Specific Domain Engine
    participant Context as PlayerContext.jsx
    participant Storage as localStorage

    Student->>Page: Clicks "▶ Inspect Audit" on an unlocked Sanity Check
    Page->>Modal: Opens terminal dialog with check metadata
    Student->>Modal: Clicks "⚡ Run Verification Audit"
    Modal->>Engine: evaluateSanityCheck(checkId, designContext)
    Engine->>Domain: Invokes geometry/placement/CTS/routing/filler checks
    Domain-->>Engine: Raw physical metrics (overlaps, skew, droop, density)
    Engine-->>Modal: { passed: boolean, logs: string[], metrics: object }
    Modal-->>Student: Streams line-by-line EDA ruledeck logs
    
    alt Violations Found (passed === false)
        Modal-->>Student: Highlights violations in red, disables certification
    else Clean Pass (passed === true)
        Modal-->>Student: Shows "🛡️ Sign-Off & Certify Stage Check (+XP)" button
        Student->>Modal: Clicks Sign-Off & Certify
        Modal->>Context: passSanityCheck(kingdomId, check, check.xpReward)
        Context->>Context: Records { passed: true, score, completedAt }
        Context->>Storage: Persists updated player state
        Modal-->>Page: Closes modal and updates badge to "✓ CERTIFIED"
    end
```

---

## 5. Domain Engine Interfaces

The platform includes 9 domain engines organized as pure, stateless ES modules:

| Engine File | Primary Purpose | Key Exported Functions |
| :--- | :--- | :--- |
| `src/engine/geometryEngine.js` | Die/core calculations, aspect ratio, macro halos, rectangle overlap | `calculateDieAndCore`, `checkMacroHaloDRC`, `doBoxesOverlap`, `checkPinInCore` |
| `src/engine/digitalLogic.js` | Truth tables, 8-bit ripple adder/accumulator, signed overflow, FSM simulation | `simulateMux21`, `evaluateMuxTruthTable`, `simulate8BitAdder`, `simulateFSM` |
| `src/engine/synthesisEngine.js` | GTECH mapping, gate delay, boolean equivalence, power estimation | `mapLogicToStandardCells`, `estimateCombinationalDelay`, `verifyBooleanEquivalenceN`, `calculatePowerEstimate` |
| `src/engine/placementEngine.js` | Site snapping, weighted HPWL, GCell congestion heatmap, tap cell pitch | `snapToSiteGrid`, `computeWeightedHPWL`, `checkSiteAlignment`, `computeCongestionHeatmap`, `checkWellTapPitch` |
| `src/engine/ctsEngine.js` | Clock skew, setup/hold slack, clock buffer insertion, topology profiles | `calculateClockSkew`, `calculateSetupSlack`, `calculateHoldSlack`, `CLOCK_TOPOLOGY_PROFILES`, `balanceTwoSinks` |
| `src/engine/routingEngine.js` | Manhattan routing, sheet resistance, Elmore delay, DRC clearance | `computeManhattanDistance`, `computeWireResistance`, `computeElmoreDelay`, `checkRoutingShorts` |
| `src/engine/fillerCellsEngine.js` | Filler legalizer, row continuity, decap droop suppression, leakage penalty | `legalizeFillers`, `checkRowContinuity`, `calculateDecapDroop`, `PHYSICAL_ONLY_CELLS` |
| `src/engine/gdsEngine.js` | GDSII layer map, antenna ratio rule, CMP layer density, signoff checklist | `getStandardLayerMap`, `calculateAntennaRatio`, `checkCMPDensity`, `SIGNOFF_RULE_CHECKS` |
| `src/engine/sanityCheckEngine.js` | Evaluates all 26 stage sanity check ruledecks across the ASIC flow | `evaluateSanityCheck` |

---

## 6. Persistence Schema & Migration Architecture

### Schema Version 2 Structure
Stored under localStorage key `'pdplayground_player_v2'`:

```json
{
  "name": "ASIC Explorer",
  "avatarEmoji": "⚡",
  "totalXP": 320,
  "schemaVersion": 2,
  "levelProgress": {
    "rtl-1": {
      "completed": true,
      "xpEarned": 30,
      "stars": 3,
      "verified": true,
      "completedAt": "2026-11-04T18:22:00.000Z"
    }
  },
  "sanityCheckProgress": {
    "pl-legality": {
      "passed": true,
      "score": 20,
      "completedAt": "2026-11-04T18:22:15.000Z"
    }
  },
  "kingdomProgress": {
    "rtl-understanding": {
      "completed": true,
      "totalXP": 200
    }
  },
  "achievements": ["first-level", "truth-table-master", "rtl-master"],
  "lastPlayedAt": "2026-11-04T18:22:15.000Z"
}
```

### Automatic Migration
The storage loader (`src/context/PlayerContext.jsx` and `src/logic/storageMigration.js`) automatically inspects legacy `pdplayground_player_v1` data:
1. Detects schema version (missing or `schemaVersion < 2`).
2. Migrates level progress records, preserving stars and scores.
3. Initializes empty `sanityCheckProgress` map.
4. Recomputes total XP and unlocked kingdoms.
5. Saves the upgraded state to `pdplayground_player_v2`.
