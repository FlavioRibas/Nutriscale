# NutriScale roadmap

Milestones are ordered by dependencies, not promised dates. Backlog items describe the first sprint.

| Phase | Milestone and deliverables | Exit gate |
| --- | --- | --- |
| 0 — Foundation | Preserve app, fix entry structure, lock dependencies, document architecture/operating rules and backlog | Reproducible install/build; actual limitations recorded; reviewable setup PR |
| 1A — Capture and standardize | Reliable parsing, validation, editable reviewed recipes, source preservation and safe persistence | Manual/image capture → reviewed saved recipe → reload passes fixtures; OCR failures have fallback |
| 1B — Catalogue to shopping | Search/categories/selection regression checks; compatible-unit totals; honest package metadata | Several selected recipes yield expected totals without false unit merges or invented pack counts |
| 2 — Cloud and private beta | Approved Supabase auth/database/storage, backend API boundary, local import, backups and OCR provider evaluation | Ownership tests deny cross-user access; import/restore and OCR benchmarks pass; owner approves private beta deployment |
| 3 — Planning and nutrition | Explicit serving scaling, dated meal plans, food matching and attributable nutrient calculation | Quantities reconcile across recipes/plans/shopping; missing nutrition data is visible; reference calculations pass |
| 4 — Mobile | Select framework; camera, sessions and sync; iOS/Android test builds | Device/accessibility/offline tests pass; owner approves signing and store submissions |
| 5 — Product expansion | Validate AI guidance/videos, community and subscription experiments | User evidence, moderation/privacy approach, budget and release approval for each experiment |

Phase 1 is local personal testing. Cloud provisioning, production deployment, credentials and paid providers are not authorized by this roadmap.
The first sprint targets Phase 1A with a small end-to-end shopping regression baseline; finish reliability before adding cloud services. Reassess scope with the owner after the sprint demo. Do not carry historical business projections into engineering commitments.
