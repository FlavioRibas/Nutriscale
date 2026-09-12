# NutriScale architecture

## Verified current application
Inspection baseline: main commit 2d7188e119833696ba9879b8d2ff73cf57db5e69.
Originally five root files: index.html, main.jsx, styles.css, package.json, README.md. HTML referenced missing /src/main.jsx; the baseline build failed resolving that path.

Setup moves main.jsx and styles.css into src/ without changing their contents. It adds Vite's React plugin configuration, exact dependency versions and a pnpm lockfile. Node 24 is the supported development runtime.

- index.html mounts #root and loads src/main.jsx.
- src/main.jsx contains App, sample data, ingredient parsing, OCR, persistence and shopping aggregation in one module.
- src/styles.css defines a responsive grid with a breakpoint at 850px.
- React state tracks the form, recipes, categories, search, selection and OCR status.
- localStorage keys nutriscale_recipes and nutriscale_categories persist JSON. Selection/form are transient. There is no schema migration or recovery layer.
- Tesseract.recognize(file, 'eng') runs OCR in the browser, appending all extracted text to ingredients. Workers/language assets can require network downloads; this is not a guaranteed offline app.
- Shopping aggregation keys by lowercased ingredient name plus exact unit. No unit conversion or serving multiplication occurs. Package estimates use the first matching item's metadata.
- No backend, authentication, cloud database, nutrition provider, mobile project or deployment pipeline exists.

## Known technical debt
One component mixes UI and domain rules. JSON parsing/storage errors can prevent use. Regex parsing can consume ingredient words as units or misinterpret fractions. New ingredients default package size to the recipe quantity, making buying estimates unreliable. Browser secure-context APIs such as crypto.randomUUID require localhost or HTTPS for reliable use. There are no application tests or CI at baseline.

## Incremental local architecture (proposed)
Extract domain/recipe and domain/shopping as pure functions as their backlog items are implemented; wrap local storage behind a repository interface; place OCR behind a service interface; split form/catalogue/list components only as behavior changes require it. Keep existing storage keys and provide versioned migration plus backup before schema changes. Avoid a big-bang rewrite.

## Cloud stage (proposed; not provisioned)
Web client → Supabase Auth → user-scoped Postgres and private object storage.
Web client → authenticated backend/edge functions → OCR/AI/nutrition providers.

Proposed tables: profiles, recipes, ingredients, meal_categories, recipe_categories if multi-category support is approved, meal_plans and plan_items. Records include owner_id, stable IDs and timestamps. Enforce row-level security and ownership for both tables and storage. Migrate local recipes through explicit import with deduplication, validation, retry and rollback; never erase local records before verified import.

Only intentionally public client configuration may enter a Vite build. Provider secrets and Supabase service-role credentials stay in a server secret store. Backend functions authenticate callers, verify ownership, validate file type/size and payloads, limit request rates/costs, redact logs and set retention/deletion policies. CORS alone is not authorization.

## OCR upgrade path (proposed)
Define extractRecipeText(input) → text, language, confidence/warnings and provider metadata. Keep local Tesseract/manual fallback. Benchmark representative owner-approved fixtures before selecting Google Vision or another service.
A hosted path uses a private upload or bounded request, then an authorized backend provider call. Any structured extraction returns a draft for human review, preserving source text and uncertainty. Add timeouts, cancellation, retries and provider cost limits. Do not send private images externally during local development without approval.

## Nutrition and planning stage (proposed)
Map reviewed ingredients to an attributable/licensed food dataset; retain food IDs, source version, quantity conversions and confidence. Compute recipe/per-serving nutrients from validated quantities and yield. Unknown values remain unknown. Test unit conversions, edible portions and missing matches; never use an LLM's invented macro values as authoritative data. Target servings and meal-plan occurrences feed shopping quantities explicitly.

## Mobile stage (proposed)
After web workflow and authenticated contracts stabilize, evaluate React Native/Expo or another approach. Share domain logic/API contracts where practical; use platform camera, secure session storage and an explicit offline-sync conflict strategy. Native UI, permissions, accessibility, testing, signing and store submissions are separate deliverables requiring release approval.

## Operations and release gates
No service accounts or paid resources are configured by this setup. Future deployment requires approval of the concrete tested artifact, environment, cost, data handling and rollback. Add build/test CI first, then approved staging and production with isolated data/secrets. Public repository visibility does not provide a private app or access control.
