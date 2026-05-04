-- Initial Supabase schema for Meetoo Webapp.
-- Run this file in the Supabase SQL editor or with `supabase db push`.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  birth_date date,
  gender text check (gender in ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  city text,
  bio text,
  photos text[] not null default '{}',
  selfie_url text,
  interests text[] not null default '{}',
  intent text check (intent in ('friendship', 'meet_people', 'serious_relationship', 'casual_dates')),
  lifestyle text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'verified_plus', 'rejected', 'under_review')),
  photo_confirmed boolean not null default false,
  identity_consistent boolean not null default false,
  is_online boolean not null default false,
  last_online timestamptz,
  search_radius_km numeric not null default 10,
  is_visible boolean not null default true,
  is_invisible boolean not null default false,
  show_age_range boolean not null default false,
  preferred_gender text not null default 'everyone' check (preferred_gender in ('male', 'female', 'non_binary', 'everyone')),
  preferred_age_min numeric not null default 18,
  preferred_age_max numeric not null default 60,
  approx_latitude numeric,
  approx_longitude numeric,
  onboarding_complete boolean not null default false,
  trust_score numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  from_display_name text,
  from_photo text,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  to_display_name text,
  to_photo text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_requests_not_self check (from_user_id <> to_user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references auth.users(id) on delete cascade,
  participant_b uuid not null references auth.users(id) on delete cascade,
  participant_a_name text,
  participant_b_name text,
  participant_a_photo text,
  participant_b_photo text,
  last_message text,
  last_message_at timestamptz,
  status text not null default 'active' check (status in ('active', 'paused', 'blocked')),
  request_id uuid references public.conversation_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_not_self check (participant_a <> participant_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text,
  content text not null,
  message_type text not null default 'text' check (message_type in ('text', 'emoji', 'gift', 'system')),
  gift_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  blocked_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocks_not_self check (blocker_id <> blocked_id),
  constraint blocks_unique_pair unique (blocker_id, blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reported_display_name text,
  reason text not null check (reason in ('fake_profile', 'inappropriate_photo', 'harassment', 'spam', 'underage', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_not_self check (reporter_id <> reported_user_id)
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

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_conversation_requests_updated_at on public.conversation_requests;
create trigger set_conversation_requests_updated_at before update on public.conversation_requests for each row execute function public.set_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();

drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at before update on public.messages for each row execute function public.set_updated_at();

drop trigger if exists set_blocks_updated_at on public.blocks;
create trigger set_blocks_updated_at before update on public.blocks for each row execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at before update on public.reports for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.conversation_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles_select_visible_own_admin" on public.profiles;
create policy "profiles_select_visible_own_admin"
on public.profiles for select
to authenticated
using (is_visible or user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "profiles_update_own_admin" on public.profiles;
create policy "profiles_update_own_admin"
on public.profiles for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_own_admin" on public.profiles;
create policy "profiles_delete_own_admin"
on public.profiles for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "conversation_requests_select_participants_admin" on public.conversation_requests;
create policy "conversation_requests_select_participants_admin"
on public.conversation_requests for select
to authenticated
using (from_user_id = auth.uid() or to_user_id = auth.uid() or public.is_admin());

drop policy if exists "conversation_requests_insert_sender" on public.conversation_requests;
create policy "conversation_requests_insert_sender"
on public.conversation_requests for insert
to authenticated
with check (from_user_id = auth.uid());

drop policy if exists "conversation_requests_update_participants_admin" on public.conversation_requests;
create policy "conversation_requests_update_participants_admin"
on public.conversation_requests for update
to authenticated
using (from_user_id = auth.uid() or to_user_id = auth.uid() or public.is_admin())
with check (from_user_id = auth.uid() or to_user_id = auth.uid() or public.is_admin());

drop policy if exists "conversations_select_participants_admin" on public.conversations;
create policy "conversations_select_participants_admin"
on public.conversations for select
to authenticated
using (participant_a = auth.uid() or participant_b = auth.uid() or public.is_admin());

drop policy if exists "conversations_insert_participants_admin" on public.conversations;
create policy "conversations_insert_participants_admin"
on public.conversations for insert
to authenticated
with check (participant_a = auth.uid() or participant_b = auth.uid() or public.is_admin());

drop policy if exists "conversations_update_participants_admin" on public.conversations;
create policy "conversations_update_participants_admin"
on public.conversations for update
to authenticated
using (participant_a = auth.uid() or participant_b = auth.uid() or public.is_admin())
with check (participant_a = auth.uid() or participant_b = auth.uid() or public.is_admin());

drop policy if exists "messages_select_conversation_participants_admin" on public.messages;
create policy "messages_select_conversation_participants_admin"
on public.messages for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
  )
);

drop policy if exists "messages_insert_conversation_participants" on public.messages;
create policy "messages_insert_conversation_participants"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and c.status = 'active'
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
  )
);

drop policy if exists "messages_update_sender_admin" on public.messages;
create policy "messages_update_sender_admin"
on public.messages for update
to authenticated
using (sender_id = auth.uid() or public.is_admin())
with check (sender_id = auth.uid() or public.is_admin());

drop policy if exists "blocks_select_blocker_admin" on public.blocks;
create policy "blocks_select_blocker_admin"
on public.blocks for select
to authenticated
using (blocker_id = auth.uid() or public.is_admin());

drop policy if exists "blocks_insert_blocker" on public.blocks;
create policy "blocks_insert_blocker"
on public.blocks for insert
to authenticated
with check (blocker_id = auth.uid());

drop policy if exists "blocks_delete_blocker_admin" on public.blocks;
create policy "blocks_delete_blocker_admin"
on public.blocks for delete
to authenticated
using (blocker_id = auth.uid() or public.is_admin());

drop policy if exists "reports_select_reporter_admin" on public.reports;
create policy "reports_select_reporter_admin"
on public.reports for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports_insert_reporter" on public.reports;
create policy "reports_insert_reporter"
on public.reports for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
on public.reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
on storage.objects for select
to public
using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_authenticated_upload" on storage.objects;
create policy "profile_photos_authenticated_upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_owner_update" on storage.objects;
create policy "profile_photos_owner_update"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-photos' and (owner = auth.uid() or public.is_admin()))
with check (bucket_id = 'profile-photos' and (owner = auth.uid() or public.is_admin()));

drop policy if exists "profile_photos_owner_delete" on storage.objects;
create policy "profile_photos_owner_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-photos' and (owner = auth.uid() or public.is_admin()));
