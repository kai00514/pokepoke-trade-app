-- ============================================================================
-- Migration: Create info_pages table (clone of deck_pages-style structure)
-- Purpose: Articles/News content rendered at /info/[id]
-- Notes:
-- - This migration creates its own updated_at trigger and function for safety
--   (does not rely on any existing shared trigger functions).
-- - Fields are chosen to mirror "deck_pages" patterns mentioned in code:
--   publication flags, counts, category/tags, thumbnail/hero, and body variants.
-- ============================================================================

-- 1) Enable required extensions (safe if already enabled)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2) Table: info_pages
create table if not exists public.info_pages (
  id uuid primary key default gen_random_uuid(),

  -- Basic metadata
  title text not null,
  category text,
  tags text[],

  -- Publish/visibility
  is_published boolean not null default true,

  -- Media
  thumbnail_image_url text,
  hero_image_url text,

  -- Body (choose one at usage time)
  body_md text,
  body_rich jsonb,

  -- Metrics
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.info_pages is 'Latest information/articles. Mirrors deck_pages schema patterns.';
comment on column public.info_pages.category is 'Article category (e.g. news, update, rules)';
comment on column public.info_pages.tags is 'Tags for filtering/search (text[])';
comment on column public.info_pages.body_md is 'HTML/Markdown (stored as Markdown or pre-rendered HTML)';
comment on column public.info_pages.body_rich is 'Structured rich text blocks (JSON)';

-- 3) Indexes for common queries
create index if not exists info_pages_is_published_idx on public.info_pages (is_published);
create index if not exists info_pages_updated_at_idx on public.info_pages (updated_at desc);
create index if not exists info_pages_view_count_idx on public.info_pages (view_count desc);
create index if not exists info_pages_category_idx on public.info_pages (category);

-- 4) Trigger function to update updated_at on row changes
create or replace function public.info_pages_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 5) Trigger binding
drop trigger if exists tr_info_pages_set_updated_at on public.info_pages;
create trigger tr_info_pages_set_updated_at
before update on public.info_pages
for each row execute procedure public.info_pages_set_updated_at();

-- 6) Basic Row Level Security (optional; mirror your deck_pages settings)
-- If your project uses RLS, uncomment and align with your existing policies.

-- alter table public.info_pages enable row level security;

-- -- Read-only for published content to anon users:
-- create policy "read published info_pages"
-- on public.info_pages
-- for select
-- using (is_published = true);

-- -- (Author/editor policies can be added similarly to deck_pages.)
