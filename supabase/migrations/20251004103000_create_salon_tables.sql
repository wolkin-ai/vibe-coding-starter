-- Create salon management tables and storage buckets

-- Projects
create table if not exists public.salon_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  salon_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists salon_projects_owner_idx on public.salon_projects (owner_id);

-- Assets
create table if not exists public.salon_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.salon_projects(id) on delete cascade,
  original_url text not null,
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'ready_for_generation')),
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  uploaded_at timestamptz not null default timezone('utc', now()),
  description text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists salon_assets_project_idx on public.salon_assets (project_id);
create index if not exists salon_assets_uploaded_idx on public.salon_assets (uploaded_by);

-- Generation jobs
create table if not exists public.salon_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.salon_assets(id) on delete cascade,
  project_id uuid not null references public.salon_projects(id) on delete cascade,
  parameters jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  variation_count integer not null default 0,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  response_id text
);

create index if not exists salon_gen_jobs_asset_idx on public.salon_generation_jobs (asset_id);
create index if not exists salon_gen_jobs_project_idx on public.salon_generation_jobs (project_id);
create index if not exists salon_gen_jobs_creator_idx on public.salon_generation_jobs (created_by);

-- Generated variations
create table if not exists public.salon_variations (
  id uuid primary key default gen_random_uuid(),
  generation_job_id uuid not null references public.salon_generation_jobs(id) on delete cascade,
  variation_rank integer not null,
  image_url text not null,
  storage_path text not null,
  status text not null default 'draft' check (status in ('draft', 'reviewing', 'approved', 'rejected')),
  safety_flags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.salon_variations
  add constraint salon_variations_unique_rank unique (generation_job_id, variation_rank);

create index if not exists salon_variations_job_idx on public.salon_variations (generation_job_id);
create index if not exists salon_variations_status_idx on public.salon_variations (status);

-- Reviews for generated variations
create table if not exists public.salon_reviews (
  id uuid primary key default gen_random_uuid(),
  variation_id uuid not null references public.salon_variations(id) on delete cascade,
  reviewed_by uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('approved', 'rejected')),
  comment text,
  reviewed_at timestamptz not null default timezone('utc', now())
);

create index if not exists salon_reviews_variation_idx on public.salon_reviews (variation_id);
create index if not exists salon_reviews_reviewer_idx on public.salon_reviews (reviewed_by);

-- Enable RLS
alter table public.salon_projects enable row level security;
alter table public.salon_assets enable row level security;
alter table public.salon_generation_jobs enable row level security;
alter table public.salon_variations enable row level security;
alter table public.salon_reviews enable row level security;

-- Policies for projects
drop policy if exists "Projects select" on public.salon_projects;
create policy "Projects select" on public.salon_projects
  for select using (owner_id = auth.uid());

drop policy if exists "Projects insert" on public.salon_projects;
create policy "Projects insert" on public.salon_projects
  for insert with check (owner_id = auth.uid());

drop policy if exists "Projects update" on public.salon_projects;
create policy "Projects update" on public.salon_projects
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Projects delete" on public.salon_projects;
create policy "Projects delete" on public.salon_projects
  for delete using (owner_id = auth.uid());

-- Policies for assets
drop policy if exists "Assets select" on public.salon_assets;
create policy "Assets select" on public.salon_assets
  for select using (
    exists (
      select 1
      from public.salon_projects p
      where p.id = salon_assets.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Assets insert" on public.salon_assets;
create policy "Assets insert" on public.salon_assets
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_assets.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Assets update" on public.salon_assets;
create policy "Assets update" on public.salon_assets
  for update using (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_assets.project_id
        and p.owner_id = auth.uid()
    )
  ) with check (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_assets.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Assets delete" on public.salon_assets;
create policy "Assets delete" on public.salon_assets
  for delete using (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_assets.project_id
        and p.owner_id = auth.uid()
    )
  );

-- Policies for generation jobs
drop policy if exists "Generation jobs select" on public.salon_generation_jobs;
create policy "Generation jobs select" on public.salon_generation_jobs
  for select using (
    exists (
      select 1
      from public.salon_projects p
      where p.id = salon_generation_jobs.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Generation jobs insert" on public.salon_generation_jobs;
create policy "Generation jobs insert" on public.salon_generation_jobs
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_generation_jobs.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Generation jobs update" on public.salon_generation_jobs;
create policy "Generation jobs update" on public.salon_generation_jobs
  for update using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_generation_jobs.project_id
        and p.owner_id = auth.uid()
    )
  ) with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_generation_jobs.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Generation jobs delete" on public.salon_generation_jobs;
create policy "Generation jobs delete" on public.salon_generation_jobs
  for delete using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.salon_projects p
      where p.id = salon_generation_jobs.project_id
        and p.owner_id = auth.uid()
    )
  );

-- Policies for variations
drop policy if exists "Variations select" on public.salon_variations;
create policy "Variations select" on public.salon_variations
  for select using (
    exists (
      select 1
      from public.salon_generation_jobs g
      join public.salon_projects p on p.id = g.project_id
      where g.id = salon_variations.generation_job_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Variations insert" on public.salon_variations;
create policy "Variations insert" on public.salon_variations
  for insert with check (
    exists (
      select 1
      from public.salon_generation_jobs g
      join public.salon_projects p on p.id = g.project_id
      where g.id = salon_variations.generation_job_id
        and g.created_by = auth.uid()
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Variations update" on public.salon_variations;
create policy "Variations update" on public.salon_variations
  for update using (
    exists (
      select 1
      from public.salon_generation_jobs g
      join public.salon_projects p on p.id = g.project_id
      where g.id = salon_variations.generation_job_id
        and g.created_by = auth.uid()
        and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.salon_generation_jobs g
      join public.salon_projects p on p.id = g.project_id
      where g.id = salon_variations.generation_job_id
        and g.created_by = auth.uid()
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Variations delete" on public.salon_variations;
create policy "Variations delete" on public.salon_variations
  for delete using (
    exists (
      select 1
      from public.salon_generation_jobs g
      join public.salon_projects p on p.id = g.project_id
      where g.id = salon_variations.generation_job_id
        and g.created_by = auth.uid()
        and p.owner_id = auth.uid()
    )
  );

-- Policies for reviews
drop policy if exists "Reviews select" on public.salon_reviews;
create policy "Reviews select" on public.salon_reviews
  for select using (
    exists (
      select 1
      from public.salon_variations v
      join public.salon_generation_jobs g on g.id = v.generation_job_id
      join public.salon_projects p on p.id = g.project_id
      where v.id = salon_reviews.variation_id
        and p.owner_id = auth.uid()
    )
    or reviewed_by = auth.uid()
  );

drop policy if exists "Reviews insert" on public.salon_reviews;
create policy "Reviews insert" on public.salon_reviews
  for insert with check (
    reviewed_by = auth.uid()
    and exists (
      select 1
      from public.salon_variations v
      join public.salon_generation_jobs g on g.id = v.generation_job_id
      join public.salon_projects p on p.id = g.project_id
      where v.id = salon_reviews.variation_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Reviews update" on public.salon_reviews;
create policy "Reviews update" on public.salon_reviews
  for update using (reviewed_by = auth.uid())
  with check (reviewed_by = auth.uid());

drop policy if exists "Reviews delete" on public.salon_reviews;
create policy "Reviews delete" on public.salon_reviews
  for delete using (reviewed_by = auth.uid());

-- Storage buckets for salon workflows
insert into storage.buckets (id, name, public)
values ('salon-assets', 'salon-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('salon-variations', 'salon-variations', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Salon assets read" on storage.objects;
create policy "Salon assets read" on storage.objects
  for select using (
    bucket_id = 'salon-assets' and auth.role() = 'authenticated'
  );

drop policy if exists "Salon assets upload" on storage.objects;
create policy "Salon assets upload" on storage.objects
  for insert with check (
    bucket_id = 'salon-assets' and auth.role() = 'authenticated'
  );

drop policy if exists "Salon assets update" on storage.objects;
create policy "Salon assets update" on storage.objects
  for update using (
    bucket_id = 'salon-assets' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'salon-assets' and auth.role() = 'authenticated'
  );

drop policy if exists "Salon assets delete" on storage.objects;
create policy "Salon assets delete" on storage.objects
  for delete using (
    bucket_id = 'salon-assets' and auth.role() = 'authenticated'
  );

drop policy if exists "Salon variations read" on storage.objects;
create policy "Salon variations read" on storage.objects
  for select using (
    bucket_id = 'salon-variations' and auth.role() = 'authenticated'
  );

drop policy if exists "Salon variations upload" on storage.objects;
create policy "Salon variations upload" on storage.objects
  for insert with check (
    bucket_id = 'salon-variations' and auth.role() = 'authenticated'
  );

drop policy if exists "Salon variations update" on storage.objects;
create policy "Salon variations update" on storage.objects
  for update using (
    bucket_id = 'salon-variations' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'salon-variations' and auth.role() = 'authenticated'
  );

drop policy if exists "Salon variations delete" on storage.objects;
create policy "Salon variations delete" on storage.objects
  for delete using (
    bucket_id = 'salon-variations' and auth.role() = 'authenticated'
  );
