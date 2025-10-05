-- Create catalog (cut model & hair style) tables and storage buckets

-- Cut models table
create table if not exists public.catalog_cut_models (
  id uuid primary key default gen_random_uuid(),
  gender text not null check (gender in ('female', 'male')),
  age_range text not null check (age_range in ('kids', 'teen', '20s', '30s', '40s', '50s', '60s')),
  face_type text check (face_type in ('oval', 'round', 'square', 'long', 'heart', 'inverted_triangle', 'base')),
  skin_tone text,
  expression text,
  hair_profile jsonb not null default '{}'::jsonb,
  image_url text not null,
  storage_path text not null,
  thumbnail_url text,
  seed text,
  generation_params jsonb not null default '{}'::jsonb,
  generation_prompt text,
  synthid_metadata jsonb,
  is_favorite boolean not null default false,
  tags text[] not null default '{}'::text[],
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists catalog_cut_models_creator_idx on public.catalog_cut_models (created_by);
create index if not exists catalog_cut_models_gender_age_idx on public.catalog_cut_models (gender, age_range);
create index if not exists catalog_cut_models_favorite_idx on public.catalog_cut_models (created_by, is_favorite);

-- Hair styles table
create table if not exists public.catalog_hair_styles (
  id uuid primary key default gen_random_uuid(),
  cut_model_id uuid references public.catalog_cut_models(id) on delete set null,
  reference_image_url text,
  parameters jsonb not null,
  image_url text not null,
  storage_path text not null,
  thumbnail_url text,
  generation_params jsonb,
  generation_prompt text,
  synthid_metadata jsonb,
  status text not null default 'draft' check (status in ('draft', 'reviewing', 'approved', 'archived')),
  is_favorite boolean not null default false,
  tags text[] not null default '{}'::text[],
  title text,
  description text,
  approved_at timestamptz,
  generation_job_id uuid,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists catalog_hair_styles_creator_idx on public.catalog_hair_styles (created_by);
create index if not exists catalog_hair_styles_model_idx on public.catalog_hair_styles (cut_model_id);
create index if not exists catalog_hair_styles_status_idx on public.catalog_hair_styles (status);
create index if not exists catalog_hair_styles_favorite_idx on public.catalog_hair_styles (created_by, is_favorite);

-- Enable RLS
alter table public.catalog_cut_models enable row level security;
alter table public.catalog_hair_styles enable row level security;

-- Policies for cut models
drop policy if exists "Cut models select" on public.catalog_cut_models;
create policy "Cut models select" on public.catalog_cut_models
  for select using (created_by = auth.uid());

drop policy if exists "Cut models insert" on public.catalog_cut_models;
create policy "Cut models insert" on public.catalog_cut_models
  for insert with check (created_by = auth.uid());

drop policy if exists "Cut models update" on public.catalog_cut_models;
create policy "Cut models update" on public.catalog_cut_models
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "Cut models delete" on public.catalog_cut_models;
create policy "Cut models delete" on public.catalog_cut_models
  for delete using (created_by = auth.uid());

-- Policies for hair styles
drop policy if exists "Hair styles select" on public.catalog_hair_styles;
create policy "Hair styles select" on public.catalog_hair_styles
  for select using (created_by = auth.uid());

drop policy if exists "Hair styles insert" on public.catalog_hair_styles;
create policy "Hair styles insert" on public.catalog_hair_styles
  for insert with check (created_by = auth.uid());

drop policy if exists "Hair styles update" on public.catalog_hair_styles;
create policy "Hair styles update" on public.catalog_hair_styles
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "Hair styles delete" on public.catalog_hair_styles;
create policy "Hair styles delete" on public.catalog_hair_styles
  for delete using (created_by = auth.uid());

-- Storage buckets for catalog assets
insert into storage.buckets (id, name, public)
values ('catalog-models', 'catalog-models', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('catalog-styles', 'catalog-styles', true)
on conflict (id) do nothing;

-- Storage policies for catalog-models
drop policy if exists "Catalog models read" on storage.objects;
create policy "Catalog models read" on storage.objects
  for select using (
    bucket_id = 'catalog-models' and auth.role() = 'authenticated'
  );

drop policy if exists "Catalog models upload" on storage.objects;
create policy "Catalog models upload" on storage.objects
  for insert with check (
    bucket_id = 'catalog-models' and auth.role() = 'authenticated'
  );

drop policy if exists "Catalog models update" on storage.objects;
create policy "Catalog models update" on storage.objects
  for update using (
    bucket_id = 'catalog-models' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'catalog-models' and auth.role() = 'authenticated'
  );

drop policy if exists "Catalog models delete" on storage.objects;
create policy "Catalog models delete" on storage.objects
  for delete using (
    bucket_id = 'catalog-models' and auth.role() = 'authenticated'
  );

-- Storage policies for catalog-styles
drop policy if exists "Catalog styles read" on storage.objects;
create policy "Catalog styles read" on storage.objects
  for select using (
    bucket_id = 'catalog-styles' and auth.role() = 'authenticated'
  );

drop policy if exists "Catalog styles upload" on storage.objects;
create policy "Catalog styles upload" on storage.objects
  for insert with check (
    bucket_id = 'catalog-styles' and auth.role() = 'authenticated'
  );

drop policy if exists "Catalog styles update" on storage.objects;
create policy "Catalog styles update" on storage.objects
  for update using (
    bucket_id = 'catalog-styles' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'catalog-styles' and auth.role() = 'authenticated'
  );

drop policy if exists "Catalog styles delete" on storage.objects;
create policy "Catalog styles delete" on storage.objects
  for delete using (
    bucket_id = 'catalog-styles' and auth.role() = 'authenticated'
  );

-- Function to automatically update updated_at timestamp
create or replace function update_catalog_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_catalog_cut_models_updated_at
  before update on public.catalog_cut_models
  for each row
  execute function update_catalog_updated_at();

create trigger update_catalog_hair_styles_updated_at
  before update on public.catalog_hair_styles
  for each row
  execute function update_catalog_updated_at();

