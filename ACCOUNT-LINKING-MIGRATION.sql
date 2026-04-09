-- Account Linking Migration
-- Run once in the Supabase SQL editor before using the social account linking feature.
--
-- Adds discord_id to profiles for conflict detection when linking Discord accounts.
-- google_sub and google_* fields are already added by GOOGLE-AUTH-PROFILE-MIGRATION.sql.

alter table if exists public.profiles
  add column if not exists discord_id text;

-- Unique partial index: prevents two profiles from holding the same Discord ID,
-- while allowing NULL (unlinked) for many rows.
create unique index if not exists idx_profiles_discord_id
  on public.profiles (discord_id)
  where discord_id is not null;

-- Backfill discord_id from auth.users identity data where the user's primary
-- provider is discord and discord_name is already set.
update public.profiles p
set discord_id = coalesce(
  (
    select elem ->> 'identity_id'
    from auth.users u,
         jsonb_array_elements(u.identities) as elem
    where u.id = p.id
      and elem ->> 'provider' = 'discord'
    limit 1
  ),
  null
)
where discord_id is null
  and discord_name is not null;
