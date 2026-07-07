-- ============================================================================
-- Sovereignty Explorer — Supabase migration (schema + open RLS + seed data)
-- Run this once in the Supabase SQL Editor (paste all, click Run).
-- Safe to re-run: it drops and recreates the demo objects.
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
-- Seed: default weighting profile (empty = every weight defaults to 1)
-- ----------------------------------------------------------------------------
insert into public.weight_profiles (id, weights)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Seed: demo companies + products (idempotent)
-- ----------------------------------------------------------------------------
delete from public.products;
delete from public.companies;

insert into public.companies (id, name, initials, color, country, country_code, hq, sector, structural_answers, structural_comment) values
('aws','Amazon Web Services','AWS','#232F3E','United States','US','Seattle, WA','Cloud infrastructure & hyperscaler','{0,0,0,0,1,0,1}',
  $$US-incorporated hyperscaler with global governance anchored outside the EU. Directly subject to the Cloud Act and FISA. A European Sovereign Cloud initiative is announced but not yet independently qualified. Strong operational security, weak structural sovereignty.$$),
('microsoft','Microsoft','MS','#5B5B5B','United States','US','Redmond, WA','Cloud & enterprise software','{0,0,0,1,1,0,1}',
  $$US-headquartered vendor exposed to extraterritorial law. The EU Data Boundary and contractual commitments to challenge government requests improve the posture, but ownership, governance and IP remain outside the EU.$$),
('scaleway','Scaleway','SW','#521E8A','France','FR','Paris','European cloud provider','{2,2,2,2,1,1,2}',
  $$French provider (Iliad group), fully EU-owned and governed, with no exposure to extraterritorial law. R&D in France and strong open-source posture. Independent sovereignty qualification still in progress.$$),
('ovhcloud','OVHcloud','OVH','#123F6D','France','FR','Roubaix','European cloud provider','{2,1,2,2,2,2,2}',
  $$French-controlled provider that designs and manufactures its own servers. SecNumCloud-qualified offerings and R&D in the EU. Publicly listed, with a minority of non-French institutional shareholders.$$),
('databricks','Databricks','DB','#C0392B','United States','US','San Francisco, CA','Data & AI platform','{0,0,0,0,1,1,1}',
  $$US venture-backed data and AI platform. Origins in the open-source Apache Spark project give some technological openness, but ownership, governance and jurisdiction are firmly non-EU.$$),
('sap','SAP','SAP','#1874B4','Germany','DE','Walldorf','Enterprise software','{2,1,2,1,2,2,1}',
  $$European software champion headquartered in Germany, with EU governance and substantial EU R&D. Global footprint and reliance on US hyperscalers for some cloud delivery create partial extraterritorial exposure.$$),
('capgemini','Capgemini','CAP','#0070AD','France','FR','Paris','IT services & consulting','{1,2,2,1,1,1,1}',
  $$French-owned and Paris-headquartered consultancy with EU governance. A large global delivery network (including significant offshore capacity) and widespread use of US tooling temper the sovereignty posture.$$),
('accenture','Accenture','ACN','#6A1B9A','Ireland','IE','Dublin','IT services & consulting','{1,0,1,0,1,0,1}',
  $$Incorporated in Ireland but effectively US-managed and NYSE-listed, with a very large non-EU delivery workforce. Registered EU office does not offset non-EU control and extraterritorial exposure.$$),
('eviden','Eviden — Bull Sequana AI','EVI','#2D2A6E','France','FR','Les Clayes-sous-Bois','Sovereign HPC, AI & digital security','{2,2,2,2,2,2,1}',
  $$French national champion in high-performance computing and digital security. EU ownership and governance, ANSSI-recognised sovereignty credentials, and in-house design of sovereign supercomputers. A benchmark for structural sovereignty.$$);

insert into public.products (company_id, name, type, answers, comment, position) values
('aws','Amazon EC2 & S3','Cloud','{0,0,1,1,0,1,1,1,0,1,0,1,1,1,1,1}',
  $$EU regions available, but the parent company's exposure to extraterritorial law remains the dominant risk. Follow-the-sun support and non-EU key management limit data control. Mature security and reversibility tooling.$$,0),
('microsoft','Microsoft Azure','Cloud','{0,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1}',
  $$EU Data Boundary constrains data location, but metadata flows and non-EU key custody persist. Cloud Act exposure via the US parent is the primary structural weakness.$$,0),
('microsoft','Microsoft 365','SaaS','{0,1,1,0,1,1,1,0,1,1,1,1,1,1}',
  $$Productivity suite with EU hosting options and strong compliance certifications, but telemetry, sub-processors and IP ownership keep the offering under US jurisdiction.$$,1),
('scaleway','Scaleway Elements','Cloud','{2,2,2,1,2,2,1,2,2,2,1,1,2,2,2,2}',
  $$EU-law contract, data hosted exclusively in France, client-controlled keys and open export formats. Residual dependency on non-EU silicon; documentation of the software supply chain still maturing.$$,0),
('ovhcloud','OVHcloud Public Cloud','Cloud','{2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1}',
  $$EU-law contract, sovereign key management and audited European supply chain. Full data control with open reversibility; permanent-deletion attestation still being formalised for some services.$$,0),
('databricks','Databricks Data Intelligence Platform','SaaS','{0,0,1,0,1,1,1,1,1,1,1,1,1,1}',
  $$Runs on top of US hyperscalers, inheriting their extraterritorial exposure. EU deployment regions and an open-source lineage help, but sub-processors and support access remain outside the EU.$$,0),
('sap','SAP S/4HANA Cloud','SaaS','{2,1,1,1,2,1,2,2,1,2,2,1,1,1}',
  $$EU-anchored ERP with strong European IP, but part of the cloud delivery relies on non-EU hyperscalers, introducing residual jurisdictional and sub-processor exposure.$$,0),
('capgemini','Digital Transformation Services','Agency','{2,1,1,1,1,1,1,1,1,2,2,1}',
  $$EU-law engagements with clear IP transfer to the client. Offshore delivery and a partly non-EU tooling stack mean some engagement data can be accessed from outside the EU.$$,0),
('accenture','Technology Consulting','Agency','{1,1,0,1,1,1,1,1,1,1,1,1}',
  $$Standard EU contracting is available, but global delivery, US-headquartered management and a predominantly non-EU tooling stack keep engagement data within reach of foreign jurisdictions.$$,0),
('eviden','BullSequana XH3000','Hosting','{2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2}',
  $$Sovereign supercomputer designed and manufactured in France, with EU-owned IP, sovereign key management and an audited European supply chain. SBOM discipline still being extended across all sub-components.$$,0),
('eviden','Trusted AI Platform','SaaS','{2,2,2,2,2,1,2,2,2,2,1,2,2,1}',
  $$EU-hosted AI platform with European IP and strong data-control guarantees. Independent component-level audit and long-term reversibility attestation are the main areas still being reinforced.$$,1);

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
