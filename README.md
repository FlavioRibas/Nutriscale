# NutriScale MVP

Personal recipe capture, catalogue/search, meal categories, selection and shopping-list prototype using React/Vite, browser localStorage and English Tesseract OCR. No account or API key is required.

## Setup and run
Install Node.js 24.x (includes npm), then:

```sh
npm install --global pnpm@11.19.0
git clone https://github.com/FlavioRibas/Nutriscale.git
cd Nutriscale
pnpm install --frozen-lockfile
pnpm dev
```

While the setup pull request is unmerged, run `git switch setup/ai-managed-development` after cloning and before installing. After merge, the default branch includes this setup.
Open the URL printed by Vite, normally http://127.0.0.1:5173. Do not open index.html directly.

```sh
pnpm build
pnpm preview
```

Build output is dist/. Preview normally uses http://127.0.0.1:4173. Both servers bind to loopback. Neither deploys anything. Saved browser data belongs to its origin/port, so dev and preview use different storage.
Scripts use Vite's native config loader on Node 24 to avoid config-bundler process restrictions found during validation.
Use pnpm-lock.yaml as the single lockfile; do not mix package managers. Tesseract's optional funding-message postinstall is disabled in pnpm-workspace.yaml; browser OCR does not require it.

## Files
- src/main.jsx — preserved React UI, OCR, storage and shopping logic.
- src/styles.css — preserved responsive styles.
- index.html and vite.config.js — entry point and React configuration.
- package.json, pnpm-lock.yaml, pnpm-workspace.yaml, .nvmrc — reproducible development setup.
- AGENTS.md — AI developer workflow and approval boundaries.
- PRODUCT_SPEC.md — vision and Phase 1 acceptance.
- ARCHITECTURE.md — actual MVP and proposed future services.
- ROADMAP.md — milestones and exit gates.
- DEVELOPMENT_BACKLOG.md — prioritized first-sprint issue specifications.
- SETUP_VALIDATION.md — inspection, checks and limitations.

## Try the app
Add a title, category, base servings, ingredient lines such as `200 g rice`, and instructions. Optionally upload a clear English recipe image and correct the extracted text before saving. Search, select recipes and inspect the shopping list. Reload on the same origin to verify persistence.
OCR may download worker/language assets. It appends a whole scan into ingredients rather than extracting a complete recipe.
No saved-recipe editor or serving scaling exists yet. Shopping sums matching name/unit pairs at base yield. Package estimates can be inaccurate. Clearing browser data removes recipes; there is no cloud backup.

## Development
Read AGENTS.md; select a backlog item; work on a branch; validate affected behavior and run `pnpm build`; prepare a reviewed PR. No test/lint command exists yet; NS-007 introduces tests and build-only CI.

## Security and release
No environment variables are needed. Never commit keys or private uploads. .gitignore excludes environment files, credentials, local data and generated output, but tracked files still require review. Future server secrets must never enter VITE_* client variables.
The repository was public at inspection; visibility is unchanged. Production credentials, deployment, paid providers and visibility changes require owner approval. No hosting or background AI agent is configured.
