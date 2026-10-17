-- Run once in Supabase SQL Editor or with Supabase CLI.
create extension if not exists pgcrypto;
create table public.profiles (user_id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
create table public.coaching_goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null check(length(title) between 3 and 160), description text, status text not null default 'active' check(status in ('active','completed','paused')), created_at timestamptz not null default now());
create table public.coaching_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null, created_at timestamptz not null default now());
create table public.chat_messages (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, session_id uuid not null references public.coaching_sessions(id) on delete cascade, role text not null check(role in ('user','assistant')), content text not null, created_at timestamptz not null default now());
create table public.action_items (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, session_id uuid references public.coaching_sessions(id) on delete set null, goal_id uuid references public.coaching_goals(id) on delete set null, title text not null check(length(title) between 3 and 160), description text, duration_minutes int check(duration_minutes between 1 and 480), status text not null default 'pending' check(status in ('pending','completed','skipped')), completed_at timestamptz, created_at timestamptz not null default now());
create table public.diary_entries (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, action_id uuid references public.action_items(id) on delete set null, kind text not null check(kind in ('reflection','mood','nutrition','alcohol','focus','action_review')), note text not null check(length(note) between 1 and 2500), mood int check(mood between 1 and 5), created_at timestamptz not null default now());
create index chat_messages_by_session on public.chat_messages(user_id,session_id,created_at);
create index actions_by_user on public.action_items(user_id,created_at desc);
create index diary_by_user on public.diary_entries(user_id,created_at desc);
create index sessions_by_user on public.coaching_sessions(user_id,created_at desc);
-- Per-user RLS; these are sensitive records.
alter table public.profiles enable row level security;
alter table public.coaching_goals enable row level security;
alter table public.coaching_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.action_items enable row level security;
alter table public.diary_entries enable row level security;
create policy "own profiles" on public.profiles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own goals" on public.coaching_goals for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own sessions" on public.coaching_sessions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own messages" on public.chat_messages for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and exists(select 1 from public.coaching_sessions s where s.id=session_id and s.user_id=(select auth.uid())));
create policy "own actions" on public.action_items for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and (session_id is null or exists(select 1 from public.coaching_sessions s where s.id=session_id and s.user_id=(select auth.uid()))) and (goal_id is null or exists(select 1 from public.coaching_goals g where g.id=goal_id and g.user_id=(select auth.uid()))));
create policy "own diary" on public.diary_entries for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and (action_id is null or exists(select 1 from public.action_items a where a.id=action_id and a.user_id=(select auth.uid()))));
