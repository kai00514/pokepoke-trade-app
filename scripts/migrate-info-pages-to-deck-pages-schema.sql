-- ============================================================================
-- Migration: Recreate public.info_pages with the exact same schema as deck_pages
-- WARNING: This will DROP TABLE public.info_pages and all its data.
--          Make a backup if you need to preserve existing records.
-- ============================================================================

-- 0) Required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1) Drop existing info_pages to avoid schema conflicts (DATA LOSS)
drop table if exists public.info_pages cascade;

-- 2) Ensure the common updated_at trigger function exists
--    deck_pages uses update_updated_at_column(), so we reuse it here.
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

-- 3) Recreate info_pages mirroring deck_pages schema exactly
create table public.info_pages (
  id uuid not null default gen_random_uuid (),
  title text not null,
  last_updated timestamp with time zone null default now(),
  comment_count integer null default 0,
  thumbnail_image_url text null,
  thumbnail_alt text null,
  deck_badge text null,

  section1_title text not null,
  deck_name text not null,
  energy_type text not null,
  energy_image_url text null,
  deck_cards jsonb null default '[]'::jsonb,
  deck_description text null,

  evaluation_title text not null,
  tier_rank text not null,
  tier_name text not null,
  tier_descriptions text[] null default '{}'::text[],

  stat_accessibility integer null,
  stat_speed integer null,
  stat_power integer null,
  stat_durability integer null,
  stat_stability integer null,

  section2_title text not null,
  strengths_weaknesses_list text[] null default '{}'::text[],
  strengths_weaknesses_details jsonb null default '[]'::jsonb,

  section3_title text not null,
  how_to_play_list text[] null default '{}'::text[],
  how_to_play_steps jsonb null default '[]'::jsonb,

  is_published boolean null default false,
  view_count integer null default 0,
  like_count integer null default 0,

  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),

  category public.deck_category null default 'featured'::deck_category,
  favorite_count integer not null default 0,
  eval_value numeric(3, 2) null default 0.00,
  eval_count integer null default 0,

  constraint info_pages_pkey primary key (id),

  constraint info_pages_stat_accessibility_check check (
    (stat_accessibility >= 1) and (stat_accessibility <= 5)
  ),
  constraint info_pages_stat_durability_check check (
    (stat_durability >= 1) and (stat_durability <= 5)
  ),
  constraint info_pages_stat_power_check check (
    (stat_power >= 1) and (stat_power <= 5)
  ),
  constraint info_pages_stat_speed_check check (
    (stat_speed >= 1) and (stat_speed <= 5)
  ),
  constraint info_pages_stat_stability_check check (
    (stat_stability >= 1) and (stat_stability <= 5)
  )
) TABLESPACE pg_default;

-- 4) Indexes (mirroring deck_pages)
create index if not exists idx_info_pages_published
  on public.info_pages using btree (is_published, created_at desc) TABLESPACE pg_default;

create index if not exists idx_info_pages_view_count
  on public.info_pages using btree (view_count desc) TABLESPACE pg_default;

create index if not exists idx_info_pages_title
  on public.info_pages using gin (to_tsvector('simple'::regconfig, title)) TABLESPACE pg_default;

create index if not exists idx_info_pages_deck_cards
  on public.info_pages using gin (deck_cards) TABLESPACE pg_default;

create index if not exists idx_info_pages_strengths_weaknesses
  on public.info_pages using gin (strengths_weaknesses_details) TABLESPACE pg_default;

create index if not exists idx_info_pages_how_to_play
  on public.info_pages using gin (how_to_play_steps) TABLESPACE pg_default;

create index if not exists idx_info_pages_category
  on public.info_pages using btree (category) TABLESPACE pg_default;

-- 5) updated_at trigger (same behavior as deck_pages)
drop trigger if exists update_info_pages_updated_at on public.info_pages;
create trigger update_info_pages_updated_at
before update on public.info_pages
for each row
execute function public.update_updated_at_column();
