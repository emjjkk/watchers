-- Run this in the Supabase SQL Editor after the base schema.
-- It is safe to run repeatedly. It does not delete existing user data.

begin;

create extension if not exists "uuid-ossp";

-- Columns added after the original tables may have been created.
alter table public.profiles add column if not exists banner_image text;

alter table public.watched add column if not exists username text;
alter table public.watched add column if not exists poster_path text;
alter table public.watched add column if not exists backdrop_path text;
alter table public.watched add column if not exists review text;
alter table public.watched add column if not exists watched_date date default current_date;

alter table public.watchlist add column if not exists release_date text;
alter table public.watchlist add column if not exists vote_average numeric(3, 1);

alter table public.favorites add column if not exists release_date text;
alter table public.favorites add column if not exists vote_average numeric(3, 1);

alter table public.reviews add column if not exists display_name text;
alter table public.reviews add column if not exists user_avatar text;
alter table public.reviews add column if not exists media_poster text;
alter table public.reviews add column if not exists watched_date date default current_date;
alter table public.reviews add column if not exists upvotes integer default 0;
alter table public.reviews add column if not exists downvotes integer default 0;

-- The app uses these conflict targets for upserts.
-- If duplicates exist, resolve them before creating the unique indexes.
do $$
begin
  if exists (
    select 1
    from public.watched
    group by user_id, media_id, media_type
    having count(*) > 1
  ) then
    raise exception 'Duplicate watched rows exist for (user_id, media_id, media_type). Run the diagnostic query before retrying.';
  end if;

  if not exists (
    select 1
    from pg_class index_object
    join pg_namespace index_schema on index_schema.oid = index_object.relnamespace
    where index_schema.nspname = 'public'
      and index_object.relname = 'unique_user_watched_media_idx'
  ) then
    create unique index unique_user_watched_media_idx
      on public.watched(user_id, media_id, media_type);
  end if;
end $$;

create unique index if not exists unique_user_watchlist_media_idx
  on public.watchlist(user_id, media_id, media_type);

create unique index if not exists unique_user_favorites_media_idx
  on public.favorites(user_id, media_id, media_type);

create unique index if not exists unique_user_follow_idx
  on public.follows(follower_id, following_id);

create unique index if not exists unique_review_user_vote_idx
  on public.review_votes(review_id, user_id);

-- Keep the public-read / owner-write model used by the application.
alter table public.profiles enable row level security;
alter table public.watched enable row level security;
alter table public.watchlist enable row level security;
alter table public.favorites enable row level security;
alter table public.follows enable row level security;
alter table public.reviews enable row level security;
alter table public.review_votes enable row level security;

commit;

-- Diagnostic query for the only data condition that blocks the watched index:
-- select user_id, media_id, media_type, count(*)
-- from public.watched
-- group by user_id, media_id, media_type
-- having count(*) > 1;
