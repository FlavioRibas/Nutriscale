-- NutriScale V1 database schema
-- Prepared for Supabase/Postgres. No production credentials are included.

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
do $$ begin
  create type public.recipe_visibility as enum ('shared','private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attribution_mode as enum ('anonymous','named');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shopping_source_type as enum ('meal_plan','recipe');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  preferred_language text not null default 'en' check (preferred_language in ('en','pt-BR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- TAGS ----------
-- Tags are deliberately many-to-many. A recipe can be Breakfast + Smoothie + Pre-Workout, etc.
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_en text not null,
  label_pt_br text,
  tag_group text not null default 'meal',
  is_system boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- RECIPE FAMILIES / VARIANTS ----------
create table if not exists public.recipe_families (
  id uuid primary key default gen_random_uuid(),
  canonical_title text,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid references public.recipe_families(id) on delete set null,
  similar_to_recipe_id uuid references public.recipes(id) on delete set null,
  title text not null,
  servings numeric(8,2) not null default 1 check (servings > 0),
  instructions text,
  visibility public.recipe_visibility not null default 'shared',
  attribution public.attribution_mode not null default 'anonymous',
  attribution_name text,
  difference_summary text,
  similarity_score numeric(5,4),
  source_type text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((attribution = 'named' and nullif(trim(attribution_name),'') is not null) or attribution = 'anonymous')
);

-- Personal notes are separated from the shared recipe record.
create table if not exists public.recipe_private_notes (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  updated_at timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

create table if not exists public.recipe_tags (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- ---------- INGREDIENTS ----------
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  normalized_name text not null unique,
  purchase_mode text not null default 'packaged' check (purchase_mode in ('packaged','variable_weight','unit','exact')),
  default_unit text,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  display_name text not null,
  quantity numeric(12,4),
  unit text,
  preparation text,
  sort_order integer not null default 0
);

-- Commercial package options are data-driven rather than hard-coded in UI logic.
create table if not exists public.ingredient_package_options (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity numeric(12,4) not null check (quantity > 0),
  unit text not null,
  market text not null default 'CA-ON',
  brand text,
  is_common boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- MEAL PLANS ----------
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  plan_type text not null default 'Everyday',
  start_date date not null,
  end_date date not null,
  recurring_weekly boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  planned_date date not null,
  meal_slot text,
  servings numeric(8,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_plan_entries_plan_date on public.meal_plan_entries(meal_plan_id, planned_date);

-- ---------- SHOPPING LISTS ----------
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Shopping List',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A list may combine multiple meal plans and individually selected recipes.
create table if not exists public.shopping_list_sources (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  source_type public.shopping_source_type not null,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  start_date date,
  end_date date,
  selected_dates date[],
  created_at timestamptz not null default now(),
  check (
    (source_type='meal_plan' and meal_plan_id is not null and recipe_id is null)
    or
    (source_type='recipe' and recipe_id is not null and meal_plan_id is null)
  )
);

create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  display_name text not null,
  required_quantity numeric(12,4),
  required_unit text,
  recommended_purchase_quantity numeric(12,4),
  recommended_purchase_unit text,
  recommended_package_count integer,
  recommendation_text text,
  is_checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- UPDATED_AT TRIGGER ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at before update on public.recipes for each row execute function public.set_updated_at();
drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at before update on public.meal_plans for each row execute function public.set_updated_at();
drop trigger if exists shopping_lists_set_updated_at on public.shopping_lists;
create trigger shopping_lists_set_updated_at before update on public.shopping_lists for each row execute function public.set_updated_at();

-- ---------- NEW USER PROFILE TRIGGER ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, preferred_language)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    coalesce(nullif(new.raw_user_meta_data->>'preferred_language',''),'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.tags enable row level security;
alter table public.recipe_families enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_private_notes enable row level security;
alter table public.recipe_tags enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.ingredient_package_options enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_entries enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_sources enable row level security;
alter table public.shopping_list_items enable row level security;

-- profiles
create policy "profiles_read_self" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- shared/system reference data
create policy "tags_read_authenticated" on public.tags for select to authenticated using (true);
create policy "tags_insert_own" on public.tags for insert to authenticated with check (created_by = auth.uid());
create policy "ingredients_read_authenticated" on public.ingredients for select to authenticated using (true);
create policy "package_options_read_authenticated" on public.ingredient_package_options for select to authenticated using (true);
create policy "recipe_families_read_authenticated" on public.recipe_families for select to authenticated using (true);

-- recipes: owner always sees own; shared recipes visible to authenticated users
create policy "recipes_read_owned_or_shared" on public.recipes for select to authenticated using (owner_id = auth.uid() or visibility = 'shared');
create policy "recipes_insert_own" on public.recipes for insert to authenticated with check (owner_id = auth.uid());
create policy "recipes_update_own" on public.recipes for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "recipes_delete_own" on public.recipes for delete to authenticated using (owner_id = auth.uid());

create policy "recipe_tags_read_visible_recipe" on public.recipe_tags for select to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and (r.owner_id = auth.uid() or r.visibility='shared'))
);
create policy "recipe_tags_write_owner" on public.recipe_tags for all to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.owner_id = auth.uid())
);

create policy "recipe_ingredients_read_visible_recipe" on public.recipe_ingredients for select to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and (r.owner_id = auth.uid() or r.visibility='shared'))
);
create policy "recipe_ingredients_write_owner" on public.recipe_ingredients for all to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.owner_id = auth.uid())
);

create policy "private_notes_own" on public.recipe_private_notes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- meal plans
create policy "meal_plans_own" on public.meal_plans for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "meal_plan_entries_own_plan" on public.meal_plan_entries for all to authenticated using (
  exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.owner_id = auth.uid())
);

-- shopping
create policy "shopping_lists_own" on public.shopping_lists for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "shopping_sources_own_list" on public.shopping_list_sources for all to authenticated using (
  exists (select 1 from public.shopping_lists s where s.id = shopping_list_id and s.owner_id = auth.uid())
) with check (
  exists (select 1 from public.shopping_lists s where s.id = shopping_list_id and s.owner_id = auth.uid())
);
create policy "shopping_items_own_list" on public.shopping_list_items for all to authenticated using (
  exists (select 1 from public.shopping_lists s where s.id = shopping_list_id and s.owner_id = auth.uid())
) with check (
  exists (select 1 from public.shopping_lists s where s.id = shopping_list_id and s.owner_id = auth.uid())
);

-- ---------- SYSTEM TAG SEED ----------
insert into public.tags(slug,label_en,label_pt_br,tag_group,is_system)
values
 ('breakfast','Breakfast','Café da manhã','meal_time',true),
 ('lunch','Lunch','Almoço','meal_time',true),
 ('dinner','Dinner','Jantar','meal_time',true),
 ('snacks','Snacks','Lanches','meal_time',true),
 ('desserts','Desserts','Sobremesas','food_type',true),
 ('pre-workout','Pre-Workout','Pré-treino','purpose',true),
 ('pre-game','Pre-Game','Pré-jogo','purpose',true),
 ('late-snack','Late Snack','Lanche noturno','meal_time',true),
 ('smoothies','Smoothies','Smoothies','food_type',true),
 ('juices','Juices','Sucos','food_type',true),
 ('drinks-non-alcoholic','Drinks – Non-Alcoholic','Bebidas – Sem álcool','food_type',true),
 ('drinks-alcoholic','Drinks – Alcoholic','Bebidas – Alcoólicas','food_type',true)
on conflict (slug) do update set
 label_en=excluded.label_en,
 label_pt_br=excluded.label_pt_br,
 tag_group=excluded.tag_group,
 is_system=excluded.is_system;
