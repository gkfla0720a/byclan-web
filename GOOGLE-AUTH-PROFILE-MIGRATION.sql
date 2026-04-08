-- Google OAuth profile fields migration
-- Run once in Supabase SQL editor before relying on Google metadata persistence.

alter table if exists public.profiles
  add column if not exists google_sub text,
  add column if not exists google_email text,
  add column if not exists google_name text,
  add column if not exists google_avatar_url text,
  add column if not exists auth_provider text default 'email';

create index if not exists idx_profiles_google_sub on public.profiles (google_sub);
create index if not exists idx_profiles_google_email on public.profiles (google_email);

-- Backfill provider/email/name from auth.users metadata where possible.
update public.profiles p
set
  auth_provider = coalesce(
    nullif(p.auth_provider, ''),
    u.raw_app_meta_data ->> 'provider',
    u.raw_user_meta_data ->> 'provider',
    'email'
  ),
  google_email = coalesce(
    nullif(p.google_email, ''),
    case
      when coalesce(u.raw_app_meta_data ->> 'provider', u.raw_user_meta_data ->> 'provider', '') = 'google'
      then coalesce(u.raw_user_meta_data ->> 'email', u.email)
      else p.google_email
    end
  ),
  google_name = coalesce(
    nullif(p.google_name, ''),
    case
      when coalesce(u.raw_app_meta_data ->> 'provider', u.raw_user_meta_data ->> 'provider', '') = 'google'
      then coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
      else p.google_name
    end
  ),
  google_sub = coalesce(
    nullif(p.google_sub, ''),
    case
      when coalesce(u.raw_app_meta_data ->> 'provider', u.raw_user_meta_data ->> 'provider', '') = 'google'
      then coalesce(u.raw_user_meta_data ->> 'sub', u.raw_user_meta_data ->> 'provider_id')
      else p.google_sub
    end
  ),
  google_avatar_url = coalesce(
    nullif(p.google_avatar_url, ''),
    case
      when coalesce(u.raw_app_meta_data ->> 'provider', u.raw_user_meta_data ->> 'provider', '') = 'google'
      then coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
      else p.google_avatar_url
    end
  )
from auth.users u
where p.id = u.id;
