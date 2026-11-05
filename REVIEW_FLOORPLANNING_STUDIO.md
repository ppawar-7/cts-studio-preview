# Floorplanning Studio: Independent Acceptance Review

- **Reviewed commit:** `1b46633594331b7b270ab44f78e9a1fccb7d8eec` (`feature/floorplanning-studio-v2`, verified as the remote tip on 2026-11-05)
- **Review branch:** `claude/floorplanning-studio-acceptance-cqvhdp` (the Gemini baseline is left untouched on `feature/floorplanning-studio-v2`)
- **Environment:** Linux container, Node + Vite production build, Chromium driven by Playwright with real mouse, wheel, keyboard and CDP touch input.
- **Not available:** the seven user-supplied defect screenshots were not in the repository or session. Baseline screenshots were captured from the unmodified build instead (`screenshots/review/before_*.png`).

## How to rerun

```bash
npm ci
npm test                                   # Vitest
npm run build
npx vite preview --port 4300 --strictPort &
BASE=http://localhost:4300 npm run test:studio-browser
```

## Results

| Suite | Baseline `1b46633` | After review |
|---|---|---|
| Vitest (whole repo) | 577 / 577 | 648 / 648 |
| `src/tests/review/floorplanEngineReview.test.js` (hand-calculated cases) | 4 / 27 | 27 / 27 |
| `src/tests/review/floorplanCurriculumReview.test.js` | n/a (new) | all pass |
| `tests/review_floorplan_studio_browser.cjs` (real pointer input) | 14 / 36 (crashed after a bad import wiped the design) | 37 / 37 |
| Gemini `test_floorplanning_studio_e2e.cjs` (temporary Linux shim) | n/a | 20 / 20 |
| Gemini `test_explore_mode.cjs`, `test_full_platform_e2e.cjs`, `test_fresh_student_journey.cjs` (Linux shim) | n/a | all pass |

Gemini's studio E2E never drags anything. Its "drag" step types into the X input. It is Windows-only (`cmd /c`, a `C:/Users/...` screenshot path).

## Defects reproduced and fixed

| # | Defect (how reproduced) | Fix |
|---|---|---|
| 1 | Est. IR-Drop showed **"NaN mV"** for every project: project loads have no `currentMa` (browser + unit test) | Stated distributed-load model, per-layer ρ, open straps reported as open |
| 2 | Canvas drag and pan drifted from the cursor: CSS pixels were treated as viewBox units (moved 95.5 px for 100 px at 1440 wide; worse on phones) | Pointer mapping through the SVG screen CTM |
| 3 | A canvas drag could not be undone (Ctrl+Z left x=180) | Drag commits one history snapshot on release |
| 4 | Wheel zoom: passive-listener console error, zoom about the origin, not the cursor | Native non-passive listener, zoom about the cursor |
| 5 | Orientation R0→R90→R270 gave 80×60 (should be 60×80); the page also merged the new orientation before transforming | Swap only across the 0/180 and 90/270 families; transform from the current orientation |
| 6 | VDD/VSS short detection only looked at ring **corners**: a via joining the VDD ring edge to the VSS strap was missed | Full perimeter per layer, plus same-layer VDD/VSS overlap |
| 7 | Missing-via check ignored vertical straps and accepted an M1–M2 via between M4 and M5 | Both strap directions, all same-net rings, layer-correct vias |
| 8 | A floating strap not in the hand-written `loads` list was never reported open | Every strap is a load |
| 9 | Nominal utilization clamped at 100%, which hid the real value; constraint `maxUtilization` ignored | Raw value shown against the project budget; budget enforced in diagnostics |
| 10 | Effective utilization ignored halo keepouts and double-counted overlaps | Exact union area (macro+halo, blockages) clipped to core |
| 11 | Importing `{"hello":"world"}` reported "loaded successfully" and replaced the design with an empty project | Structural validation; import is rejected and the design is kept |
| 12 | Explore Save claimed "saved successfully" but saved nothing; Explore lessons linked to the Normal Game Studio | Explore saves to sessionStorage and says so; Explore-aware links |
| 13 | Die drawn at ~45% of the canvas (40% on phones); fixed 1000×700 viewBox | viewBox fits die plus outward labels; Fit resets the view |
| 14 | Pins drawn on the core edge on top of the VDD ring, 8-unit labels over straps | Pins on the die boundary, labels outward at screen-pixel sizes |
| 15 | Macro names overflowed the macro body | Fit or wrap inside the body |
| 16 | Analysis panel clipped below 900 px (studio was `100vh` under a navbar) | Height measured below the navbar |
| 17 | Inspector tabs rendered as unstyled browser buttons | Tab styles added |
| 18 | Phones: inspector and diagnostics hidden (`display:none`), so pins, orientation and via fixes were impossible; touch drag did nothing | Panels stack under the canvas; touch drag works |
| 19 | Inspector X/Y/coord fired `onChange` and `onInput` (two history entries per keystroke) | Single handler |
| 20 | 13 lessons (FP-9, 10, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23) shared one generic A/B quiz; picking "A" auto-filled the validator. FP-6 had two options, and FP-8, FP-11 and FP-18 offered a single radio option (always correct) | Lesson-specific questions with ≥3 options, shuffled |
| 21 | **FP-24 capstone passed on three self-ticked checkboxes** | Grades the saved Studio project with the shared rule deck (≥4 macros, zero violations) |
| 22 | FP-14 auto-filled pin coordinates (20, 45) for the student | Student enters coordinates; graded with the pin-spacing rule |
| 23 | Expanded lessons showed "Level  of 5" and had no next/previous lesson | "Lesson N of 24 · Module M"; chained navigation |
| 24 | FP-7 stated that a sky130 NAND2 gate equivalent is ~12.5 µm² (the cell is ~3.75 µm²) | Reworded as a planning figure |
| 25 | Kingdom page stats ("NOMINAL XP0 XP") and sanity cards had markup but no CSS | Styles added |

## Independent numerical reference cases (beginner project)

- Core 320×240 = 76 800 µm². Nominal = (28 000 + 2·4 800) / 76 800 = **48.96%**.
- Halo-aware placeable area = 76 800 − 2·(110×90) = 57 000 µm². Effective = 28 000 / 57 000 = **49.12%**.
- HPWL with die-edge pins: clk net 200+90, data-in 100+70, data-out 300+70 = **830 µm** (710 µm with the old core-edge pins).
- VDD strap: 344 µm / 4 µm = 86 sq × 0.08 = 6.88 Ω; 15 mA fed at both ends → I·R/8 = **12.9 mV**. Dual SRAM strap with one via missing: 8.8 Ω → I·R/2 = **66 mV**.
- Small Controller overlap: (90−70)·(70−45) = **500 µm²**.

Deliberately invalid designs used in tests: overlapping macros, 3 µm pin pitch, missing via, wrong-layer via, VDD–VSS bridging via, floating strap, 90.6% utilization, non-floorplan JSON, negative die width.

## Floorplanning lessons, one by one

| Lesson | What the student actually does | Assessment of real action |
|---|---|---|
| FP-1 … FP-5 | Pre-existing core lessons (unchanged) | Core progression verified; not re-audited in depth |
| FP-6 | Computes aspect ratio 0.6; picks the shape that minimises wirelength | Numeric + concept |
| FP-7 | Computes std-cell area and required core area | Numeric |
| FP-8 | Computes row count floor(350/2.72) = 128; explains row flipping | Numeric + concept |
| FP-9 | Hard vs soft blockage | Concept only |
| FP-10 | Picks MY for a right-side macro; why pins face inward | Concept only (no orientation experiment) |
| FP-11 | Computes halo separation 35 µm; channel congestion | Numeric + concept |
| FP-12 | Why fix macros | Concept only |
| FP-13 | Flyline-driven placement | Concept only |
| FP-14 | Enters two pin coordinates checked by the Studio pitch rule | Numeric, graded by engine |
| FP-15 | Pin/SRAM alignment | Concept only |
| FP-16 | Ring layer and width | Concept only |
| FP-17 | Vias and mesh | Concept only |
| FP-18 | Computes V = I·R = 30 mV; remedy | Numeric + concept |
| FP-19 | Congestion remedy | Concept only |
| FP-20 | DRC sign-off requirement | Concept only |
| FP-21 | Utilization target | Concept only |
| FP-22 | Corner vs centre candidates | Concept only (no computed comparison) |
| FP-23 | Sign-off gates | Concept only |
| FP-24 | Repairs a 4-macro benchmark in the Studio, saves, verifies | **Graded on the real design** |

Every lesson in FP-6 to FP-23 still shows the same static `SRAM_CORE` reference picture.

## Remaining approximations and gaps

See `KNOWN_LIMITATIONS.md` §1.6. In short: conservative halo rule, strap-only IR drop, uncalibrated congestion proxy, rows not cut by macros, no strap-to-strap mesh via check. The Studio cannot add or resize macros, straps, blockages or nets, or change the die and core. Expanded lessons are unlocked from the start in the Normal Game (Gemini's design; left as is). The Explore kingdom header still says "5 Available" although 24 lessons exist. Gemini's placement-lesson changes (`PLIntroChallenge`, `PLTimingDrivenChallenge`, `PLGlobalDetailedChallenge`) were not reviewed.

## Readiness verdict

The Studio is now a working, correct educational floorplan editor for **moving, orienting and repairing** the provided designs. Interaction, metrics and diagnostics are verified with real input. It is ready for supervised student use on that scope.

The curriculum is **not** a deep 24-lesson studio course yet. Six lessons involve numeric work, one (FP-24) grades a real design, and twelve are concept checks. Turning FP-9/10/12/13/15/16/17/19–23 into Studio experiments needs authoring work (adding straps, blockages and macros to the Studio and per-lesson starting projects). It should not be marketed as more than that until then.
