-- Repair migration for Supabase projects where some tables already existed
-- before the initial schema was applied.
--
-- Run this after `20260504130000_initial_schema.sql` fails because of a
-- missing column such as `profiles.is_online`.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid()
);

alter table public.profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists display_name text not null default '';
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists photos text[] not null default '{}';
alter table public.profiles add column if not exists selfie_url text;
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists intent text;
alter table public.profiles add column if not exists lifestyle text;
alter table public.profiles add column if not exists verification_status text not null default 'pending';
alter table public.profiles add column if not exists photo_confirmed boolean not null default false;
alter table public.profiles add column if not exists identity_consistent boolean not null default false;
alter table public.profiles add column if not exists is_online boolean not null default false;
alter table public.profiles add column if not exists last_online timestamptz;
alter table public.profiles add column if not exists search_radius_km numeric not null default 10;
alter table public.profiles add column if not exists is_visible boolean not null default true;
alter table public.profiles add column if not exists is_invisible boolean not null default false;
alter table public.profiles add column if not exists show_age_range boolean not null default false;
alter table public.profiles add column if not exists preferred_gender text not null default 'everyone';
alter table public.profiles add column if not exists preferred_age_min numeric not null default 18;
alter table public.profiles add column if not exists preferred_age_max numeric not null default 60;
alter table public.profiles add column if not exists approx_latitude numeric;
alter table public.profiles add column if not exists approx_longitude numeric;
alter table public.profiles add column if not exists onboarding_complete boolean not null default false;
alter table public.profiles add column if not exists trust_score numeric not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_user_id_unique_idx on public.profiles (user_id) where user_id is not null;

create table if not exists public.conversation_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users(id) on delete cascade,
  from_display_name text,
  from_photo text,
  to_user_id uuid references auth.users(id) on delete cascade,
  to_display_name text,
  to_photo text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid references auth.users(id) on delete cascade,
  participant_b uuid references auth.users(id) on delete cascade,
  participant_a_name text,
  participant_b_name text,
  participant_a_photo text,
  participant_b_photo text,
  last_message text,
  last_message_at timestamptz,
  status text not null default 'active',
  request_id uuid references public.conversation_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  sender_name text,
  content text not null default '',
  message_type text not null default 'text',
  gift_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users(id) on delete cascade,
  blocked_id uuid references auth.users(id) on delete cascade,
  blocked_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reported_display_name text,
  reason text not null default 'other',
  details text,
  status text not null default 'pending',
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_discovery_idx on public.profiles (is_online, is_visible, created_at desc);
create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists conversation_requests_from_idx on public.conversation_requests (from_user_id, status, created_at desc);
create index if not exists conversation_requests_to_idx on public.conversation_requests (to_user_id, status, created_at desc);
create index if not exists conversations_participant_a_idx on public.conversations (participant_a, status, last_message_at desc);
create index if not exists conversations_participant_b_idx on public.conversations (participant_b, status, last_message_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists blocks_blocker_idx on public.blocks (blocker_id);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = excluded.public;
