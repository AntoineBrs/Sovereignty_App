-- ============================================================================
-- Sovereignty Explorer — Supabase migration (schema + open RLS only)
-- Run this once in the Supabase SQL Editor (paste all, click Run).
-- ----------------------------------------------------------------------------
-- This script creates STRUCTURE ONLY (tables, indexes, RLS policies, touch
-- triggers). It intentionally contains NO business data: table/policy
-- creation requires SQL Editor privileges, but every company, product and
-- weight profile is entered through the app itself (Supplier space / My
-- priorities), going through the same Supabase REST calls a real user
-- triggers — nothing here is hardcoded demo data.
-- Safe to re-run: `create table if not exists` and `drop policy/trigger if
-- exists` make it idempotent without touching any data you've already added.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Schema
-- ----------------------------------------------------------------------------
create table if not exists public.companies (
  id             text primary key,
  name           text not null,
  initials       text,
  color          text default '#004494',
  country        text,
  country_code   text,
  hq             text,
  sector         text,
  structural_answers  smallint[] not null default '{}',
  structural_comment  text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  company_id  text not null references public.companies(id) on delete cascade,
  name        text not null,
  type        text not null,           -- Hosting | Cloud | SaaS | Software | Agency | Service
  answers     smallint[] not null default '{}',
  comment     text,
  position    smallint default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists products_company_id_idx on public.products(company_id);

-- Single shared weighting profile (POC: one global set of priorities).
create table if not exists public.weight_profiles (
  id          smallint primary key default 1,
  weights     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Row Level Security — OPEN policies (POC only, no authentication)
-- The anon key is public; open policies let anyone read/write. Acceptable for
-- a demo. Tighten these before any production use.
-- ----------------------------------------------------------------------------
alter table public.companies       enable row level security;
alter table public.products        enable row level security;
alter table public.weight_profiles enable row level security;

drop policy if exists "public_all_companies"  on public.companies;
drop policy if exists "public_all_products"   on public.products;
drop policy if exists "public_all_weights"    on public.weight_profiles;

create policy "public_all_companies" on public.companies
  for all to anon, authenticated using (true) with check (true);
create policy "public_all_products" on public.products
  for all to anon, authenticated using (true) with check (true);
create policy "public_all_weights" on public.weight_profiles
  for all to anon, authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- No data seed here on purpose. `weight_profiles` row (id = 1) is created
-- automatically by the app's first `upsert` (see js/db.js saveWeights), and
-- companies/products are created via the Supplier space UI.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Optional: keep updated_at fresh on writes
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists companies_touch on public.companies;
create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists weights_touch on public.weight_profiles;
create trigger weights_touch before update on public.weight_profiles
  for each row execute function public.touch_updated_at();
