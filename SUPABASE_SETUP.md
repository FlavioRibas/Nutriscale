# NutriScale Supabase V1 Setup

This branch prepares the database architecture for the first multi-user NutriScale test without connecting production credentials yet.

## Architectural decisions preserved

1. **Recipes have many tags, not one rigid category.** A recipe can be Breakfast + Smoothie + Pre-Workout at the same time. `tags` and `recipe_tags` implement this as a many-to-many relationship.
2. **Shared Recipes and My Recipes use the same recipe record.** Ownership stays attached to the user; visibility controls whether other authenticated testers can see it.
3. **Recipe attribution is anonymous by default and per recipe.** `attribution` is either `anonymous` or `named`; the user can opt in to a displayed name.
4. **Private notes are stored separately.** `recipe_private_notes` prevents personal notes from being exposed with a shared recipe.
5. **Similar recipes are preserved as variants.** `recipe_families`, `similar_to_recipe_id`, `similarity_score`, and `difference_summary` support the >90% similarity workflow without deleting legitimate variants.
6. **Meal plans are date-based, not limited to Monday–Sunday.** Each plan has start/end dates and individual `meal_plan_entries` by date. This supports vacations and recurring weekly plans.
7. **Shopping lists may combine multiple meal plans and individual recipes.** `shopping_list_sources` records exactly what was included.
8. **Commercial purchase sizes are data, not UI assumptions.** `ingredient_package_options` stores actual package sizes by ingredient and market. Variable-weight foods such as chicken or fish use `purchase_mode='variable_weight'`.

## V1 tables

- `profiles`
- `tags`
- `recipe_families`
- `recipes`
- `recipe_private_notes`
- `recipe_tags`
- `ingredients`
- `recipe_ingredients`
- `ingredient_package_options`
- `meal_plans`
- `meal_plan_entries`
- `shopping_lists`
- `shopping_list_sources`
- `shopping_list_items`

## Authentication plan

For the first tester group, use Supabase Auth with **email magic link / email OTP**. The registration experience only needs:

- Name
- Email
- Preferred language

No password is required for V1 testing. The Auth user ID becomes the primary key of `profiles`.

Recommended rollout:

1. Create a Supabase project in a non-production/test environment.
2. Run `supabase/migrations/20260912_001_initial_schema.sql`.
3. Configure Site URL and redirect URLs for the GitHub Pages preview.
4. Add only the public Supabase URL and anon key to the frontend environment.
5. Never expose the Supabase service-role key in the browser.
6. Add the Supabase JS client.
7. Implement auth and profile creation.
8. Migrate recipes/tags first.
9. Migrate meal plans/calendar entries next.
10. Migrate shopping lists last.
11. Test with 5–10 invited users before expanding toward 50.

## Data migration from the prototype

The current prototype uses localStorage. The migration should be explicit and one-time per tester:

- `nutriscale_recipes` → `recipes`, `recipe_tags`, `recipe_ingredients`
- recipe notes → `recipe_private_notes`
- `nutriscale_plans` → `meal_plans`, `meal_plan_entries`
- current shopping selections remain local until the shopping-list tables are connected

Do not automatically upload local data without the signed-in user confirming the migration.

## Row Level Security

The initial migration enables RLS. The intended rules are:

- A user can read/update their own profile.
- Authenticated users can read shared recipes.
- Only the owner can modify/delete a recipe.
- Private notes are visible only to the user who owns the note.
- Meal plans and shopping lists are private to their owner.
- Tags, ingredients and package-size reference data are readable by authenticated users.

Before a public launch, RLS policies should receive a dedicated security review and automated policy tests.

## Not included yet

This preparation intentionally does **not** add:

- production credentials
- payments/subscriptions
- public social profiles
- nutrition provider integration
- barcode integration
- AI parsing APIs
- image/video generation services
- production deployment

Those remain later phases after the core multi-user workflow is validated.
