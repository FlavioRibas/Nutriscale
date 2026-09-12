# NutriScale development backlog

Sprint 1 goal: reliably capture/review/save a recipe and retrieve/select it for a shopping list without silent data corruption. These are issue-ready specifications, not GitHub issues created by this setup. All items below are TODO. Suggested capacity cut: NS-001 through NS-005; NS-006/007 follow if capacity permits. P0 means data integrity/core correctness; P1 means workflow reliability. Estimates require implementation review.

## NS-001 — P0 — Safe local storage and recovery
Problem: JSON.parse and localStorage writes have no error handling.
Acceptance: malformed JSON and invalid shapes show recovery feedback without blanking the app; preserve recoverable raw data before reset; failed/quota-denied writes do not claim success; existing valid records/categories survive migration and reload.
Verification: malformed JSON, wrong shape, denied write, valid legacy fixture and reload.
Dependencies: none.

## NS-002 — P0 — Reviewed ingredient parser and validation
Problem: fractions, mixed numbers and unitless lines are ambiguous; defaults silently manufacture quantities.
Acceptance: handle 200 g rice, 1/2 cup milk, 1 1/2 cups flour, ½ cup milk and 2 eggs correctly; retain salt to taste as unresolved rather than 1 unit; reject zero denominators and non-finite/negative quantities; preserve original lines and expose warnings for review. Do not treat eggs as a unit or silently normalize mass to volume.
Verification: table-driven parser tests plus form correction/save.
Dependencies: NS-001 for persistence schema changes.

## NS-003 — P1 — Edit saved standardized recipes
Acceptance: open an existing record for editing; correct title/category/base servings/ingredients/instructions/notes; validate required fields and positive servings; save preserves id and updates selected shopping totals; cancel preserves original; source text survives edits; reload retains edits.
Verification: create/edit/cancel/reload and selected-recipe update.
Dependencies: NS-001, NS-002.

## NS-004 — P1 — OCR review and lifecycle
Problem: OCR appends an entire scan into ingredients with no busy control or progress.
Acceptance: show progress/busy state, prevent overlapping requests, handle invalid/oversized files and failures, avoid stale results overwriting later form work, keep pasted-text fallback, require review before save. Document supported language and network assets; use approved fixture images only.
Verification: clear English image, unreadable image, failed worker/download, repeated upload and manual fallback; check the extracted quantities rather than only nonempty text.
Dependencies: NS-002; no hosted provider required.

## NS-005 — P0 — Shopping quantities and package honesty
Problem: exact-unit aggregation and guessed package sizes can mislead.
Acceptance: sum normalized names with compatible units; keep incompatible dimensions separate; retain fractional precision; unknown package size displays no invented pack count; validate positive known package sizes and consistent package units; remove deleted selections; state that base recipes are counted once. Serving scaling remains a separate milestone.
Verification: repeated ingredient across two recipes, g versus kg under an explicit conversion rule, g versus ml kept separate, conflicting package metadata, empty selection and recipe deletion.
Dependencies: NS-002; NS-003 for editable package fields.

## NS-006 — P1 — Catalogue, category and mobile usability
Acceptance: case-insensitive search works across all documented fields; empty search results are clear; trimmed/case-insensitive category duplicates are prevented; custom categories survive reload; selection survives filtering; fields/delete buttons have accessible names; keyboard navigation and narrow screen layout are usable.
Verification: manual desktop/mobile-width and keyboard pass plus focused regressions.
Dependencies: NS-001.

## NS-007 — P1 — Repeatable workflow checks and CI
Acceptance: add a documented test command using meaningful parser/storage/shopping regressions; smoke-test manual create → search → select → totals → reload; configure build/test CI with frozen lockfile and read-only repository permissions, no deployment or secrets; capture Node/package-manager versions.
Verification: clean install, tests and build on the branch; attach results to PR.
Dependencies: tests grow with NS-001 through NS-005; no production approval needed for a build-only workflow.

## Sprint completion
Demonstrate the goal with expected versus actual quantities, list unresolved cases, and update item status with PR/check evidence. Do not mark TODO items complete merely because this planning file exists. Defer cloud accounts, provider credentials, nutrition, serving scaling, payments and mobile implementation to the roadmap.
