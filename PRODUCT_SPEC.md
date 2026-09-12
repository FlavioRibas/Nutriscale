# NutriScale product specification

## Vision
Help people turn recipes into an organized, reusable collection, choose what to cook, and produce a practical shopping list. Over time, connect meal planning, portion scaling, nutrition/macros and cooking guidance in web and mobile apps.

This specification consolidates the Product Owner's current request and prior NutriScale planning. The immediate audience is the owner testing a personal prototype. Later private beta and public subscription/community ideas are future hypotheses, not commitments or validated market projections.

## Phase 1: reliable personal recipe workflow
Photo/image or pasted text → OCR where needed → review and standardize → save → catalogue/search → select recipes → shopping list.

| Capability | Phase 1 acceptance |
| --- | --- |
| Scan/OCR | Accept recipe images; show progress and actionable failure states; keep manual entry available. Extracted text remains editable and is never saved automatically. |
| Standardization | Review title, category, base servings, ingredients (quantity/unit/name), instructions and notes. Preserve source text, flag ambiguity, and support correcting saved recipes. |
| Catalogue | Save, view, edit and deliberately delete recipes; preserve records across reloads and surface storage failures. |
| Search | Case-insensitive matching across title, ingredient, meal category and instructions, with an understandable empty result. |
| Meal categories | Keep the six defaults and allow useful custom categories without blank or duplicate entries. |
| Recipe selection | Select several recipes and clear selection; deleting a selected recipe removes it from the list. |
| Shopping list | Sum matching ingredients in compatible units; keep incompatible units separate; show needed quantities and transparent package estimates only when package sizes are known. |

Defaults: Breakfast, Mid-Morning Snack, Lunch, Afternoon Snack, Dinner, Before-Bed Snack.

## Data requirements
Current recipe: id, title, category, servings, ingredients[], instructions, notes.
Current ingredient: name, quantity, unit, packageSize, packageUnit.
Proposed additions: schemaVersion, sourceText/source metadata, timestamps, parse warnings and reviewed status. Do not invent values for unknown fields. Migrate existing local data safely before introducing these additions.

Base servings describe the whole saved recipe. Phase 1 selection currently uses each recipe once at its base yield. Target-serving scaling is a follow-on milestone and must be explicit when introduced.
Package sizes are shopping metadata, not a substitute for recipe quantities; unknown size means no reliable package-count estimate.

## Current implementation versus target
The MVP offers English Tesseract OCR into the ingredient text box, manual recipe creation, sample recipes, custom categories, search, selection and a simple shopping list. It stores recipes/categories in localStorage.
It does not parse an entire scan into title and instructions, edit saved recipes, safely recover malformed storage, scale servings, normalize units or verify package sizes. The existing parser can misread fractions and unitless ingredients. These are gaps, not completed standardization.

## Phase 1 completion gate
Demonstrate a recipe image through review/save/search/selection/shopping, plus manual fallback. Verify persistence after reload, parsing ambiguity, mixed units, duplicate ingredients, failed OCR and storage errors. Preserve existing records. Use a repeatable small fixture set and record expected results.

## Later scope
- Cloud accounts/sync, private storage and backup using Supabase/backend services.
- Higher-quality OCR via a secure provider adapter and reviewed structured extraction.
- Portion scaling, meal planning and an attributable nutrition engine.
- iOS/Android apps sharing domain rules and backend contracts.
- Possible AI meal suggestions/videos, community sharing/reviews and subscriptions after validation.

No nutrition claims, barcode module, payment system, public catalogue or app-store release belongs in the first sprint. Provider, hosting, budget, nutrition-data licensing, mobile framework and release decisions remain for later approval.
