-- ==========================================
-- COMPLETE DATABASE SETUP FOR ANIMOOD
-- Paste the entire contents of this file into the Supabase SQL Editor and run it.
-- ==========================================

-- ==========================================
-- 1. TABLE SCHEMAS
-- ==========================================

-- base table: anime_cache
create table if not exists public.anime_cache (
    mal_id bigint primary key,
    title text not null,
    title_english text,
    synopsis text,
    image_url text,
    type text,
    episodes integer,
    score numeric,
    popularity integer,
    members integer,
    year integer,
    season text,
    genres jsonb default '[]'::jsonb,
    themes jsonb default '[]'::jsonb,
    demographics jsonb default '[]'::jsonb,
    studios jsonb default '[]'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index if not exists anime_cache_title_idx on public.anime_cache using btree (title);
create index if not exists anime_cache_score_idx on public.anime_cache using btree (score);
create index if not exists anime_cache_popularity_idx on public.anime_cache using btree (popularity);

-- base table: profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null,
  avatar_url text,
  favorite_animes jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- base table: anime_ratings
create table if not exists public.anime_ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id integer not null,
  rating integer not null check (rating >= 1 and rating <= 10),
  review_text text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_id, anime_id)
);

create index if not exists idx_anime_ratings_anime_id on public.anime_ratings(anime_id);
create index if not exists idx_anime_ratings_user_id on public.anime_ratings(user_id);

-- base table: episode_ratings
create table if not exists public.episode_ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id integer not null,
  episode_id integer not null,
  episode_number integer,
  rating integer not null check (rating >= 1 and rating <= 10),
  review_text text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_id, anime_id, episode_id)
);

create index if not exists idx_episode_ratings_anime_id on public.episode_ratings(anime_id);
create index if not exists idx_episode_ratings_user_id on public.episode_ratings(user_id);
create index if not exists idx_episode_ratings_episode_id on public.episode_ratings(episode_id);

-- base table: user_anime_interactions
create table if not exists public.user_anime_interactions (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    mal_id bigint not null references public.anime_cache(mal_id) on delete cascade,
    rating integer check (rating between 1 and 10),
    liked boolean,
    disliked boolean,
    is_favorite boolean not null default false,
    watch_status text check (
        watch_status in ('planned', 'watching', 'completed', 'dropped', 'paused')
    ),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (user_id, mal_id)
);

create index if not exists user_anime_interactions_user_id_idx on public.user_anime_interactions (user_id);
create index if not exists user_anime_interactions_mal_id_idx on public.user_anime_interactions (mal_id);

-- base table: user_genre_preferences
create table if not exists public.user_genre_preferences (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    genre_name text not null,
    preference_type text not null check (preference_type in ('like', 'dislike')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (user_id, genre_name)
);

create index if not exists user_genre_preferences_user_id_idx on public.user_genre_preferences (user_id);

-- base table: user_onboarding_responses
create table if not exists public.user_onboarding_responses (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    mal_id bigint not null references public.anime_cache(mal_id) on delete cascade,
    response text not null check (response in ('like', 'unsure', 'dislike')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (user_id, mal_id)
);

create index if not exists user_onboarding_responses_user_id_idx on public.user_onboarding_responses (user_id);

-- base table: watchlists
create table if not exists public.watchlists (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id integer not null,
  title text,
  image_url text,
  status text not null default 'planned' check (status in ('planned', 'watching', 'completed', 'dropped', 'paused')),
  created_at timestamp with time zone not null default now(),
  unique (user_id, anime_id)
);

-- base table: discussion_posts
create table if not exists public.discussion_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id integer, -- null for global discussions
  title text not null,
  body text not null,
  created_at timestamp with time zone not null default now()
);

-- base table: discussion_replies
create table if not exists public.discussion_replies (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.discussion_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone not null default now()
);


-- ==========================================
-- 2. FUNCTIONS & TRIGGERS
-- ==========================================

-- trigger function: set updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- trigger function: auto-create profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, favorite_animes)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'User_' || substr(new.id::text, 1, 8)),
    null,
    '[]'::jsonb
  );
  return new;
end;
$$;

-- RPC function: delete my account
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Triggers for updated_at
drop trigger if exists set_updated_at_anime_cache on public.anime_cache;
create trigger set_updated_at_anime_cache before update on public.anime_cache for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_anime_ratings_updated_at on public.anime_ratings;
create trigger set_anime_ratings_updated_at before update on public.anime_ratings for each row execute function public.set_updated_at();

drop trigger if exists set_episode_ratings_updated_at on public.episode_ratings;
create trigger set_episode_ratings_updated_at before update on public.episode_ratings for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_user_anime_interactions on public.user_anime_interactions;
create trigger set_updated_at_user_anime_interactions before update on public.user_anime_interactions for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_user_genre_preferences on public.user_genre_preferences;
create trigger set_updated_at_user_genre_preferences before update on public.user_genre_preferences for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_user_onboarding_responses on public.user_onboarding_responses;
create trigger set_updated_at_user_onboarding_responses before update on public.user_onboarding_responses for each row execute function public.set_updated_at();

-- Trigger for profile sync on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();


-- ==========================================
-- 3. ROW-LEVEL SECURITY & POLICIES
-- ==========================================

-- Enable RLS
alter table public.anime_cache enable row level security;
alter table public.profiles enable row level security;
alter table public.anime_ratings enable row level security;
alter table public.episode_ratings enable row level security;
alter table public.user_anime_interactions enable row level security;
alter table public.user_genre_preferences enable row level security;
alter table public.user_onboarding_responses enable row level security;
alter table public.watchlists enable row level security;
alter table public.discussion_posts enable row level security;
alter table public.discussion_replies enable row level security;

-- Policies: anime_cache
drop policy if exists "anime cache readable by everyone" on public.anime_cache;
create policy "anime cache readable by everyone" on public.anime_cache for select to authenticated, anon using (true);

drop policy if exists "anime cache insert authenticated" on public.anime_cache;
create policy "anime cache insert authenticated" on public.anime_cache for insert to authenticated with check (true);

drop policy if exists "anime cache update authenticated" on public.anime_cache;
create policy "anime cache update authenticated" on public.anime_cache for update to authenticated using (true) with check (true);

-- Policies: profiles
drop policy if exists "Allow public read access to profiles" on public.profiles;
create policy "Allow public read access to profiles" on public.profiles for select to authenticated, anon using (true);

drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Policies: anime_ratings
drop policy if exists "Authenticated users can view anime ratings" on public.anime_ratings;
create policy "Authenticated users can view anime ratings" on public.anime_ratings for select to authenticated using (true);

drop policy if exists "Users can insert their own anime ratings" on public.anime_ratings;
create policy "Users can insert their own anime ratings" on public.anime_ratings for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own anime ratings" on public.anime_ratings;
create policy "Users can update their own anime ratings" on public.anime_ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own anime ratings" on public.anime_ratings;
create policy "Users can delete their own anime ratings" on public.anime_ratings for delete to authenticated using (auth.uid() = user_id);

-- Policies: episode_ratings
drop policy if exists "Authenticated users can view episode ratings" on public.episode_ratings;
create policy "Authenticated users can view episode ratings" on public.episode_ratings for select to authenticated using (true);

drop policy if exists "Users can insert their own episode ratings" on public.episode_ratings;
create policy "Users can insert their own episode ratings" on public.episode_ratings for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own episode ratings" on public.episode_ratings;
create policy "Users can update their own episode ratings" on public.episode_ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own episode ratings" on public.episode_ratings;
create policy "Users can delete their own episode ratings" on public.episode_ratings for delete to authenticated using (auth.uid() = user_id);

-- Policies: user_anime_interactions
drop policy if exists "users can read own anime interactions" on public.user_anime_interactions;
create policy "users can read own anime interactions" on public.user_anime_interactions for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users can insert own anime interactions" on public.user_anime_interactions;
create policy "users can insert own anime interactions" on public.user_anime_interactions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users can update own anime interactions" on public.user_anime_interactions;
create policy "users can update own anime interactions" on public.user_anime_interactions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can delete own anime interactions" on public.user_anime_interactions;
create policy "users can delete own anime interactions" on public.user_anime_interactions for delete to authenticated using (auth.uid() = user_id);

-- Policies: user_genre_preferences
drop policy if exists "users can read own genre preferences" on public.user_genre_preferences;
create policy "users can read own genre preferences" on public.user_genre_preferences for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users can insert own genre preferences" on public.user_genre_preferences;
create policy "users can insert own genre preferences" on public.user_genre_preferences for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users can update own genre preferences" on public.user_genre_preferences;
create policy "users can update own genre preferences" on public.user_genre_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can delete own genre preferences" on public.user_genre_preferences;
create policy "users can delete own genre preferences" on public.user_genre_preferences for delete to authenticated using (auth.uid() = user_id);

-- Policies: user_onboarding_responses
drop policy if exists "users can read own onboarding responses" on public.user_onboarding_responses;
create policy "users can read own onboarding responses" on public.user_onboarding_responses for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users can insert own onboarding responses" on public.user_onboarding_responses;
create policy "users can insert own onboarding responses" on public.user_onboarding_responses for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users can update own onboarding responses" on public.user_onboarding_responses;
create policy "users can update own onboarding responses" on public.user_onboarding_responses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can delete own onboarding responses" on public.user_onboarding_responses;
create policy "users can delete own onboarding responses" on public.user_onboarding_responses for delete to authenticated using (auth.uid() = user_id);

-- Policies: watchlists
drop policy if exists "Users can view their own watchlist" on public.watchlists;
create policy "Users can view their own watchlist" on public.watchlists for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert their own watchlist items" on public.watchlists;
create policy "Users can insert their own watchlist items" on public.watchlists for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own watchlist items" on public.watchlists;
create policy "Users can update their own watchlist items" on public.watchlists for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own watchlist items" on public.watchlists;
create policy "Users can delete their own watchlist items" on public.watchlists for delete to authenticated using (auth.uid() = user_id);

-- Policies: discussion_posts
drop policy if exists "Anyone can view discussion posts" on public.discussion_posts;
create policy "Anyone can view discussion posts" on public.discussion_posts for select to authenticated, anon using (true);

drop policy if exists "Authenticated users can create discussion posts" on public.discussion_posts;
create policy "Authenticated users can create discussion posts" on public.discussion_posts for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own discussion posts" on public.discussion_posts;
create policy "Users can update their own discussion posts" on public.discussion_posts for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete their own discussion posts" on public.discussion_posts;
create policy "Users can delete their own discussion posts" on public.discussion_posts for delete to authenticated using (auth.uid() = user_id);

-- Policies: discussion_replies
drop policy if exists "Anyone can view discussion replies" on public.discussion_replies;
create policy "Anyone can view discussion replies" on public.discussion_replies for select to authenticated, anon using (true);

drop policy if exists "Authenticated users can create discussion replies" on public.discussion_replies;
create policy "Authenticated users can create discussion replies" on public.discussion_replies for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own discussion replies" on public.discussion_replies;
create policy "Users can update their own discussion replies" on public.discussion_replies for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete their own discussion replies" on public.discussion_replies;
create policy "Users can delete their own discussion replies" on public.discussion_replies for delete to authenticated using (auth.uid() = user_id);
