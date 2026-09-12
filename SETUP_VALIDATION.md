# Setup validation

## Inspected baseline
FlavioRibas/Nutriscale, main commit 2d7188e119833696ba9879b8d2ff73cf57db5e69.
Five tracked root files; no src directory, ignore file, lockfile, tests, CI or backend.
Baseline build failed because index.html could not resolve /src/main.jsx.

## Changes
Moved main.jsx and styles.css into src with contents preserved. Added React/Vite configuration, pinned resolved dependencies, Node 24 and pnpm 11.19.0, a lockfile and install-script policy. Default servers bind to loopback.
Added the requested development documents, corrected README and secret/local-data ignore rules. No credentials or deployment added.

## Validation
- Node 24.19.0 and pnpm 11.19.0 used.
- Baseline build: failed on missing entry, confirming the structural defect.
- pnpm install --frozen-lockfile: passed.
- pnpm run build: passed; Vite 8.3.0 transformed 1885 modules and generated HTML/CSS/JS.
- pnpm run dev: started; HTTP 200 for / and /src/main.jsx.
- Default config bundling encountered Windows spawn restrictions; the committed scripts use the native config loader and build successfully.
- Browser smoke attempt: Edge launch blocked by environment spawn EPERM. Browser interactions, responsive rendering and OCR accuracy are not claimed verified.
- Git recognized both source moves as 100% unchanged; staged diff whitespace checks passed.
- Ignore checks passed for environment files, dependencies, build output, service-account JSON and private-data uploads. A targeted credential-pattern scan found no matches in the tracked setup files; this is not an exhaustive historical secret audit.

## GitHub delivery
The initial integration returned HTTP 403 for writes. After the owner reconnected GitHub, creation of the setup/ai-managed-development branch succeeded. This setup is prepared for review on that branch; production deployment and merge are separate approval steps.

## Remaining problems
Fragile fraction/unitless ingredient parsing; unknown quantities default to 1; no saved-recipe editing or serving scaling; unguarded localStorage parse/write; no unit normalization; unreliable package defaults; English-only OCR with no progress/concurrency control; no tests/CI/auth/cloud backup/nutrition engine.
Repository visibility is public, unlike earlier private-prototype planning; changes require the owner's decision.

A passing build proves compilation and serving, not feature correctness. Complete browser/OCR acceptance checks on an unrestricted workstation before relying on the prototype. Sprint 1 addresses the functional gaps.
