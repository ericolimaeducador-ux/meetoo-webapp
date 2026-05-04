-- Destructive reset for a fresh Supabase project.
-- Use only if there is no production data to preserve.
--
-- Run this first, then run:
-- supabase/migrations/20260504130000_initial_schema.sql

drop policy if exists "profile_photos_public_read" on storage.objects;
drop policy if exists "profile_photos_authenticated_upload" on storage.objects;
drop policy if exists "profile_photos_owner_update" on storage.objects;
drop policy if exists "profile_photos_owner_delete" on storage.objects;

delete from storage.objects where bucket_id = 'profile-photos';
delete from storage.buckets where id = 'profile-photos';

drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.conversation_requests cascade;
drop table if exists public.blocks cascade;
drop table if exists public.reports cascade;
drop table if exists public.profiles cascade;

drop function if exists public.set_updated_at() cascade;
drop function if exists public.is_admin() cascade;
