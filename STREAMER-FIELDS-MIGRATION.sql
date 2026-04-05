-- BJ / 스트리머 정보 저장용 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.

alter table if exists public.profiles
  add column if not exists is_streamer boolean default false,
  add column if not exists streamer_platform text,
  add column if not exists streamer_url text;

alter table if exists public.applications
  add column if not exists is_streamer boolean default false,
  add column if not exists streamer_platform text,
  add column if not exists streamer_url text;

comment on column public.profiles.is_streamer is 'BJ 또는 스트리머 여부';
comment on column public.profiles.streamer_platform is 'SOOP, YouTube, 치지직 등 방송 플랫폼';
comment on column public.profiles.streamer_url is '방송 채널 URL';
comment on column public.applications.is_streamer is '가입 신청자가 BJ 또는 스트리머인지 여부';
comment on column public.applications.streamer_platform is '가입 신청 시 선택한 방송 플랫폼';
comment on column public.applications.streamer_url is '가입 신청 시 입력한 방송 채널 URL';