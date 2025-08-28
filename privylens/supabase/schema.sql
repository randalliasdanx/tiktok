-- Supabase schema for PrivyLens

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind = 'image'),
  asset_url text not null,
  width int,
  height int,
  created_at timestamptz not null default now()
);

create table if not exists public.redaction_logs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('text','image')),
  pii_types text[] not null default '{}',
  bbox_count int default 0,
  local_hash text,
  asset_url text,
  created_at timestamptz not null default now()
);

-- Note: Do not upload originals by default. Only redacted derivatives go to storage.

