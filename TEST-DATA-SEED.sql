create extension if not exists pgcrypto;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    discord_id,
    by_id,
    role,
    clan_point,
    race,
    intro,
    ladder_mmr,
    is_in_queue,
    vote_to_start,
    wins,
    losses
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'user'),
    'By_' || coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'user'),
    'visitor',
    0,
    '미지정',
    '',
    1000,
    false,
    false,
    0,
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ByClan 테스트 데이터 시드
-- 1) 전체 파일 실행
-- 2) 맨 아래 '점검용 쿼리' 섹션으로 상태 확인
-- 3) 아래 auth bootstrap 블록이 test1~test10용 auth 계정을 먼저 생성합니다.
--    임시 로그인 정보: test1@byclan.local ~ test10@byclan.local / ByClanTest123!

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'test1@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test1","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'test2@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test2","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'test3@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test3","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'test4@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test4","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'test5@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test5","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'test6@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test6","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'test7@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test7","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888888', 'authenticated', 'authenticated', 'test8@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test8","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999999', 'authenticated', 'authenticated', 'test9@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test9","test_account":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'test10@byclan.local', crypt('ByClanTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"test10","test_account":true}', now(), now(), '', '', '', '')
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '{"sub":"11111111-1111-4111-8111-111111111111","email":"test1@byclan.local","email_verified":true}', 'email', 'test1@byclan.local', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '{"sub":"22222222-2222-4222-8222-222222222222","email":"test2@byclan.local","email_verified":true}', 'email', 'test2@byclan.local', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '{"sub":"33333333-3333-4333-8333-333333333333","email":"test3@byclan.local","email_verified":true}', 'email', 'test3@byclan.local', now(), now(), now()),
  ('44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', '{"sub":"44444444-4444-4444-8444-444444444444","email":"test4@byclan.local","email_verified":true}', 'email', 'test4@byclan.local', now(), now(), now()),
  ('55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', '{"sub":"55555555-5555-4555-8555-555555555555","email":"test5@byclan.local","email_verified":true}', 'email', 'test5@byclan.local', now(), now(), now()),
  ('66666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666', '{"sub":"66666666-6666-4666-8666-666666666666","email":"test6@byclan.local","email_verified":true}', 'email', 'test6@byclan.local', now(), now(), now()),
  ('77777777-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', '{"sub":"77777777-7777-4777-8777-777777777777","email":"test7@byclan.local","email_verified":true}', 'email', 'test7@byclan.local', now(), now(), now()),
  ('88888888-8888-4888-8888-888888888888', '88888888-8888-4888-8888-888888888888', '{"sub":"88888888-8888-4888-8888-888888888888","email":"test8@byclan.local","email_verified":true}', 'email', 'test8@byclan.local', now(), now(), now()),
  ('99999999-9999-4999-8999-999999999999', '99999999-9999-4999-8999-999999999999', '{"sub":"99999999-9999-4999-8999-999999999999","email":"test9@byclan.local","email_verified":true}', 'email', 'test9@byclan.local', now(), now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","email":"test10@byclan.local","email_verified":true}', 'email', 'test10@byclan.local', now(), now(), now())
on conflict (provider, provider_id) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

create table if not exists public.system_settings (
  key text primary key,
  value_bool boolean default false,
  description text,
  updated_at timestamptz default now()
);

alter table if exists public.system_settings
  add column if not exists value_bool boolean default false,
  add column if not exists description text,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.profiles
  add column if not exists is_test_account boolean default false,
  add column if not exists is_test_account_active boolean default true;

alter table if exists public.ladders
  add column if not exists is_test_data boolean default false,
  add column if not exists is_test_data_active boolean default true;

alter table if exists public.admin_posts
  add column if not exists is_test_data boolean default false,
  add column if not exists is_test_data_active boolean default true;

alter table if exists public.posts
  add column if not exists is_test_data boolean default false,
  add column if not exists is_test_data_active boolean default true;

alter table if exists public.applications
  add column if not exists is_test_data boolean default false,
  add column if not exists is_test_data_active boolean default true;

alter table if exists public.notifications
  add column if not exists is_test_data boolean default false,
  add column if not exists is_test_data_active boolean default true;

alter table if exists public.ladder_matches
  add column if not exists is_test_data boolean default false,
  add column if not exists is_test_data_active boolean default true;

insert into public.system_settings (key, value_bool, description, updated_at)
values
  ('test_mode_active', false, '개발자 테스트 모드 활성화 여부', now()),
  ('test_accounts_enabled', true, '테스트 계정 및 테스트 데이터 노출 여부', now())
on conflict (key) do update set
  value_bool = excluded.value_bool,
  description = excluded.description,
  updated_at = now();

insert into public.profiles (
  id, discord_id, by_id, role, ladder_mmr, race, intro, clan_point,
  is_in_queue, vote_to_start, is_test_account, is_test_account_active
)
values
  ('11111111-1111-4111-8111-111111111111', 'test1', 'By_test1', 'master', 5400, 'Terran', '클랜 운영과 래더 밸런스를 함께 관리하는 테스트 마스터 계정입니다.', 2240, false, false, true, true),
  ('22222222-2222-4222-8222-222222222222', 'test2', 'By_test2', 'admin', 4900, 'Protoss', '공지와 신청서 심사를 담당하는 테스트 운영진 계정입니다.', 2120, false, false, true, true),
  ('33333333-3333-4333-8333-333333333333', 'test3', 'By_test3', 'elite', 4300, 'Zerg', '상위권 저그 전담 테스트 계정입니다.', 2010, false, false, true, true),
  ('44444444-4444-4444-8444-444444444444', 'test4', 'By_test4', 'elite', 4000, 'Terran', '전방 압박형 운영을 자주 쓰는 테스트 계정입니다.', 1880, false, false, true, true),
  ('55555555-5555-4555-8555-555555555555', 'test5', 'By_test5', 'associate', 3600, 'Protoss', '주말 내전 참여율이 높은 테스트 계정입니다.', 1760, false, false, true, true),
  ('66666666-6666-4666-8666-666666666666', 'test6', 'By_test6', 'associate', 3300, 'Random', '랜덤 종족으로 분위기를 흔드는 테스트 계정입니다.', 1650, false, false, true, true),
  ('77777777-7777-4777-8777-777777777777', 'test7', 'By_test7', 'member', 2800, 'Zerg', '중위권 래더 테스트용 멤버 계정입니다.', 1520, false, false, true, true),
  ('88888888-8888-4888-8888-888888888888', 'test8', 'By_test8', 'member', 2500, 'Terran', '일반 매치와 래더를 번갈아 플레이하는 테스트 계정입니다.', 1430, false, false, true, true),
  ('99999999-9999-4999-8999-999999999999', 'test9', 'By_test9', 'rookie', 1800, 'Protoss', '가입 직후 흐름을 검증하기 위한 테스트 신입 계정입니다.', 1320, false, false, true, true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'test10', 'By_test10', 'developer', 1600, 'Terran', '테스트 모드와 개발자 화면 확인용 계정입니다.', 1260, false, false, true, true)
on conflict (id) do update set
  discord_id = excluded.discord_id,
  by_id = excluded.by_id,
  role = excluded.role,
  clan_point = excluded.clan_point,
  race = excluded.race,
  intro = excluded.intro,
  ladder_mmr = excluded.ladder_mmr,
  is_in_queue = excluded.is_in_queue,
  vote_to_start = excluded.vote_to_start,
  is_test_account = true,
  is_test_account_active = true;

do $$
declare
  has_profiles boolean;
begin
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) into has_profiles;

  if not has_profiles then
    return;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'clan_point') then
    update public.profiles
    set clan_point = coalesce(clan_point, 0)
    where clan_point is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role') then
    update public.profiles
    set role = coalesce(nullif(role, ''), 'member')
    where role is null or role = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'discord_id')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'by_id') then
    update public.profiles
    set by_id = 'By_' || regexp_replace(coalesce(nullif(discord_id, ''), 'guest'), '[^A-Za-z0-9_]', '', 'g')
    where by_id is null or by_id = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'race') then
    update public.profiles
    set race = 'Protoss'
    where race is null or race = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'intro') then
    update public.profiles
    set intro = '안녕하세요.'
    where intro is null or intro = '';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'clan_point') then
    update public.profiles
    set clan_point = 1000
    where clan_point is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_in_queue') then
    update public.profiles
    set is_in_queue = false
    where is_in_queue is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'vote_to_start') then
    update public.profiles
    set vote_to_start = false
    where vote_to_start is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_test_account') then
    update public.profiles
    set is_test_account = false
    where is_test_account is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_test_account_active') then
    update public.profiles
    set is_test_account_active = true
    where is_test_account_active is null;
  end if;
end
$$;

do $$
declare
  ladder_columns text[];
  insert_columns text;
  select_columns text;
  update_columns text;
  conflict_action text;
  overriding_clause text := '';
begin
  select array_agg(column_name order by ordinal_position)
    into ladder_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'ladders'
    and column_name = any (array[
      'id', 'user_id', 'nickname', 'name', 'by_id', 'discord_id', 'race', 'rank',
      'ladder_mmr', 'win', 'lose', 'is_test_data', 'is_test_data_active'
    ]);

  if ladder_columns is null or not ('id' = any(ladder_columns)) then
    raise notice 'public.ladders 시드를 건너뜁니다. id 컬럼이 없거나 테이블 구조가 예상과 다릅니다.';
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ladders'
      and column_name = 'id'
      and is_identity = 'YES'
      and identity_generation = 'ALWAYS'
  ) then
    overriding_clause := 'overriding system value';
  end if;

  select string_agg(format('%I', column_name), ', ')
    into insert_columns
  from unnest(ladder_columns) as column_name;

  select string_agg(
    case
      when meta.column_name = 'id' and meta.data_type in ('bigint', 'integer', 'smallint') then 'seed.numeric_id'
      when meta.column_name = 'id' then 'seed.uuid_id'
      when meta.column_name = 'user_id' and meta.data_type in ('bigint', 'integer', 'smallint') then 'seed.numeric_user_id'
      when meta.column_name = 'user_id' then 'seed.uuid_user_id'
      else format('seed.%I', meta.column_name)
    end,
    ', '
    order by meta.ordinal_position
  ) into select_columns
  from information_schema.columns as meta
  where meta.table_schema = 'public'
    and meta.table_name = 'ladders'
    and meta.column_name = any(ladder_columns);

  select string_agg(format('%1$I = excluded.%1$I', column_name), ', ')
    into update_columns
  from unnest(ladder_columns) as column_name
  where column_name <> 'id';

  if update_columns is null then
    conflict_action := 'do nothing';
  else
    conflict_action := 'do update set ' || update_columns;
  end if;

  execute format(
    $sql$
      insert into public.ladders (%s) %s
      select %s
      from jsonb_to_recordset(%L::jsonb) as seed(
        uuid_id uuid,
        numeric_id bigint,
        uuid_user_id uuid,
        numeric_user_id bigint,
        nickname text,
        name text,
        by_id text,
        discord_id text,
        race text,
        rank integer,
        ladder_mmr integer,
        win integer,
        lose integer,
        is_test_data boolean,
        is_test_data_active boolean
      )
      on conflict (id) %s
    $sql$,
    insert_columns,
    overriding_clause,
    select_columns,
    '[
      {"uuid_id":"21111111-1111-4111-8111-111111111111","numeric_id":900001,"uuid_user_id":"11111111-1111-4111-8111-111111111111","numeric_user_id":1001,"nickname":"By_test1","name":"By_test1","by_id":"By_test1","discord_id":"test1","race":"Terran","rank":1,"ladder_mmr":2240,"win":42,"lose":12,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"32222222-2222-4222-8222-222222222222","numeric_id":900002,"uuid_user_id":"22222222-2222-4222-8222-222222222222","numeric_user_id":1002,"nickname":"By_test2","name":"By_test2","by_id":"By_test2","discord_id":"test2","race":"Protoss","rank":2,"ladder_mmr":2120,"win":38,"lose":16,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"43333333-3333-4333-8333-333333333333","numeric_id":900003,"uuid_user_id":"33333333-3333-4333-8333-333333333333","numeric_user_id":1003,"nickname":"By_test3","name":"By_test3","by_id":"By_test3","discord_id":"test3","race":"Zerg","rank":3,"ladder_mmr":2010,"win":34,"lose":17,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"54444444-4444-4444-8444-444444444444","numeric_id":900004,"uuid_user_id":"44444444-4444-4444-8444-444444444444","numeric_user_id":1004,"nickname":"By_test4","name":"By_test4","by_id":"By_test4","discord_id":"test4","race":"Terran","rank":4,"ladder_mmr":1880,"win":31,"lose":18,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"65555555-5555-4555-8555-555555555555","numeric_id":900005,"uuid_user_id":"55555555-5555-4555-8555-555555555555","numeric_user_id":1005,"nickname":"By_test5","name":"By_test5","by_id":"By_test5","discord_id":"test5","race":"Protoss","rank":5,"ladder_mmr":1760,"win":28,"lose":21,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"76666666-6666-4666-8666-666666666666","numeric_id":900006,"uuid_user_id":"66666666-6666-4666-8666-666666666666","numeric_user_id":1006,"nickname":"By_test6","name":"By_test6","by_id":"By_test6","discord_id":"test6","race":"Random","rank":6,"ladder_mmr":1650,"win":25,"lose":22,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"87777777-7777-4777-8777-777777777777","numeric_id":900007,"uuid_user_id":"77777777-7777-4777-8777-777777777777","numeric_user_id":1007,"nickname":"By_test7","name":"By_test7","by_id":"By_test7","discord_id":"test7","race":"Zerg","rank":7,"ladder_mmr":1520,"win":20,"lose":19,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"98888888-8888-4888-8888-888888888888","numeric_id":900008,"uuid_user_id":"88888888-8888-4888-8888-888888888888","numeric_user_id":1008,"nickname":"By_test8","name":"By_test8","by_id":"By_test8","discord_id":"test8","race":"Terran","rank":8,"ladder_mmr":1430,"win":18,"lose":20,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"a9999999-9999-4999-8999-999999999999","numeric_id":900009,"uuid_user_id":"99999999-9999-4999-8999-999999999999","numeric_user_id":1009,"nickname":"By_test9","name":"By_test9","by_id":"By_test9","discord_id":"test9","race":"Protoss","rank":9,"ladder_mmr":1320,"win":14,"lose":21,"is_test_data":true,"is_test_data_active":true},
      {"uuid_id":"baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","numeric_id":900010,"uuid_user_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","numeric_user_id":1010,"nickname":"By_test10","name":"By_test10","by_id":"By_test10","discord_id":"test10","race":"Terran","rank":10,"ladder_mmr":1260,"win":12,"lose":23,"is_test_data":true,"is_test_data_active":true}
    ]',
    conflict_action
  );
end
$$;

do $$
declare
  has_table boolean;
  columns_sql text := '';
  row1_sql text := '';
  row2_sql text := '';
  row3_sql text := '';
  insert_sql text;
begin
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'admin_posts'
  ) into has_table;

  if not has_table then
    raise notice 'public.admin_posts 테이블이 없어 시드를 건너뜁니다.';
    return;
  end if;

  delete from public.admin_posts where is_test_data = true;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_posts' and column_name = 'author_id') then
    columns_sql := columns_sql || ', author_id';
    row1_sql := row1_sql || ', ' || quote_literal('11111111-1111-4111-8111-111111111111');
    row2_sql := row2_sql || ', ' || quote_literal('22222222-2222-4222-8222-222222222222');
    row3_sql := row3_sql || ', ' || quote_literal('11111111-1111-4111-8111-111111111111');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_posts' and column_name = 'title') then
    columns_sql := columns_sql || ', title';
    row1_sql := row1_sql || ', ' || quote_literal('테스트 시즌 오픈 안내');
    row2_sql := row2_sql || ', ' || quote_literal('랭킹 보드 검증용 포인트 반영');
    row3_sql := row3_sql || ', ' || quote_literal('주말 내전 예고');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_posts' and column_name = 'content') then
    columns_sql := columns_sql || ', content';
    row1_sql := row1_sql || ', ' || quote_literal('홈 화면과 공지 보드가 비어 보이지 않도록 테스트 시즌 공지를 등록했습니다.');
    row2_sql := row2_sql || ', ' || quote_literal('test1~test10 계정의 래더 포인트와 전적이 함께 반영됩니다.');
    row3_sql := row3_sql || ', ' || quote_literal('3v3, 4v4, 5v5 화면 확인이 가능하도록 더미 매치 데이터도 함께 들어갑니다.');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_posts' and column_name = 'created_at') then
    columns_sql := columns_sql || ', created_at';
    row1_sql := row1_sql || ', now() - interval ''1 day''';
    row2_sql := row2_sql || ', now() - interval ''2 day''';
    row3_sql := row3_sql || ', now() - interval ''4 day''';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_posts' and column_name = 'is_test_data') then
    columns_sql := columns_sql || ', is_test_data';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_posts' and column_name = 'is_test_data_active') then
    columns_sql := columns_sql || ', is_test_data_active';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  columns_sql := ltrim(columns_sql, ', ');
  row1_sql := ltrim(row1_sql, ', ');
  row2_sql := ltrim(row2_sql, ', ');
  row3_sql := ltrim(row3_sql, ', ');

  insert_sql := format(
    'insert into public.admin_posts (%s) values (%s), (%s), (%s)',
    columns_sql,
    row1_sql,
    row2_sql,
    row3_sql
  );

  execute insert_sql;
end
$$;

do $$
declare
  has_table boolean;
  columns_sql text := '';
  row1_sql text := '';
  row2_sql text := '';
  row3_sql text := '';
  insert_sql text;
begin
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'posts'
  ) into has_table;

  if not has_table then
    raise notice 'public.posts 테이블이 없어 시드를 건너뜁니다.';
    return;
  end if;

  delete from public.posts where is_test_data = true;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'user_id') then
    columns_sql := columns_sql || ', user_id';
    row1_sql := row1_sql || ', ' || quote_literal('33333333-3333-4333-8333-333333333333');
    row2_sql := row2_sql || ', ' || quote_literal('44444444-4444-4444-8444-444444444444');
    row3_sql := row3_sql || ', ' || quote_literal('77777777-7777-4777-8777-777777777777');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'author_name') then
    columns_sql := columns_sql || ', author_name';
    row1_sql := row1_sql || ', ' || quote_literal('test3');
    row2_sql := row2_sql || ', ' || quote_literal('test4');
    row3_sql := row3_sql || ', ' || quote_literal('test7');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'title') then
    columns_sql := columns_sql || ', title';
    row1_sql := row1_sql || ', ' || quote_literal('저그 운영 빌드 공유');
    row2_sql := row2_sql || ', ' || quote_literal('오늘 저녁 4v4 모집');
    row3_sql := row3_sql || ', ' || quote_literal('가입 후 적응 팁 정리');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'content') then
    columns_sql := columns_sql || ', content';
    row1_sql := row1_sql || ', ' || quote_literal('커뮤니티 보드 노출용 테스트 글입니다. 중반 운영 전환 타이밍을 정리했습니다.');
    row2_sql := row2_sql || ', ' || quote_literal('래더 대시보드와 자유게시판을 함께 확인할 수 있도록 작성한 모집 글입니다.');
    row3_sql := row3_sql || ', ' || quote_literal('신입 계정 관점에서 필요한 안내 글을 가정한 테스트 게시물입니다.');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'views') then
    columns_sql := columns_sql || ', views';
    row1_sql := row1_sql || ', 27';
    row2_sql := row2_sql || ', 14';
    row3_sql := row3_sql || ', 9';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'created_at') then
    columns_sql := columns_sql || ', created_at';
    row1_sql := row1_sql || ', now() - interval ''1 day''';
    row2_sql := row2_sql || ', now() - interval ''2 day''';
    row3_sql := row3_sql || ', now() - interval ''3 day''';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'is_test_data') then
    columns_sql := columns_sql || ', is_test_data';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'is_test_data_active') then
    columns_sql := columns_sql || ', is_test_data_active';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  columns_sql := ltrim(columns_sql, ', ');
  row1_sql := ltrim(row1_sql, ', ');
  row2_sql := ltrim(row2_sql, ', ');
  row3_sql := ltrim(row3_sql, ', ');

  insert_sql := format(
    'insert into public.posts (%s) values (%s), (%s), (%s)',
    columns_sql,
    row1_sql,
    row2_sql,
    row3_sql
  );

  execute insert_sql;
end
$$;

do $$
declare
  has_table boolean;
  columns_sql text := '';
  row1_sql text := '';
  row2_sql text := '';
  row3_sql text := '';
  insert_sql text;
begin
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'applications'
  ) into has_table;

  if not has_table then
    raise notice 'public.applications 테이블이 없어 시드를 건너뜁니다.';
    return;
  end if;

  delete from public.applications where is_test_data = true;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'user_id') then
    columns_sql := columns_sql || ', user_id';
    row1_sql := row1_sql || ', ' || quote_literal('99999999-9999-4999-8999-999999999999');
    row2_sql := row2_sql || ', ' || quote_literal('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    row3_sql := row3_sql || ', ' || quote_literal('88888888-8888-4888-8888-888888888888');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'tester_id') then
    columns_sql := columns_sql || ', tester_id';
    row1_sql := row1_sql || ', ' || quote_literal('22222222-2222-4222-8222-222222222222');
    row2_sql := row2_sql || ', ' || quote_literal('22222222-2222-4222-8222-222222222222');
    row3_sql := row3_sql || ', ' || quote_literal('22222222-2222-4222-8222-222222222222');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'discord_id') then
    columns_sql := columns_sql || ', discord_id';
    row1_sql := row1_sql || ', ' || quote_literal('test9');
    row2_sql := row2_sql || ', ' || quote_literal('test10');
    row3_sql := row3_sql || ', ' || quote_literal('test8');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'btag') then
    columns_sql := columns_sql || ', btag';
    row1_sql := row1_sql || ', ' || quote_literal('test9#9009');
    row2_sql := row2_sql || ', ' || quote_literal('test10#9010');
    row3_sql := row3_sql || ', ' || quote_literal('test8#9008');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'race') then
    columns_sql := columns_sql || ', race';
    row1_sql := row1_sql || ', ' || quote_literal('Protoss');
    row2_sql := row2_sql || ', ' || quote_literal('Terran');
    row3_sql := row3_sql || ', ' || quote_literal('Terran');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'tier') then
    columns_sql := columns_sql || ', tier';
    row1_sql := row1_sql || ', ' || quote_literal('Gold');
    row2_sql := row2_sql || ', ' || quote_literal('Silver');
    row3_sql := row3_sql || ', ' || quote_literal('Silver');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'intro') then
    columns_sql := columns_sql || ', intro';
    row1_sql := row1_sql || ', ' || quote_literal('안정적인 운영형 플레이를 선호합니다.');
    row2_sql := row2_sql || ', ' || quote_literal('내전 위주로 활동하고 싶습니다.');
    row3_sql := row3_sql || ', ' || quote_literal('커뮤니티 활동 위주로 먼저 적응하고 싶습니다.');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'motivation') then
    columns_sql := columns_sql || ', motivation';
    row1_sql := row1_sql || ', ' || quote_literal('클랜전과 래더를 꾸준히 참여하고 싶습니다.');
    row2_sql := row2_sql || ', ' || quote_literal('가입 절차와 알림함 동선을 점검하기 위한 테스트 신청서입니다.');
    row3_sql := row3_sql || ', ' || quote_literal('심사 기록실 화면 확인용 테스트 데이터입니다.');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'playtime') then
    columns_sql := columns_sql || ', playtime';
    row1_sql := row1_sql || ', ' || quote_literal('평일 20:00~24:00');
    row2_sql := row2_sql || ', ' || quote_literal('주말 오후');
    row3_sql := row3_sql || ', ' || quote_literal('평일 저녁');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'phone') then
    columns_sql := columns_sql || ', phone';
    row1_sql := row1_sql || ', ' || quote_literal('010-9000-9009');
    row2_sql := row2_sql || ', ' || quote_literal('010-9010-9010');
    row3_sql := row3_sql || ', ' || quote_literal('010-9008-9008');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'status') then
    columns_sql := columns_sql || ', status';
    row1_sql := row1_sql || ', ' || quote_literal('대기중');
    row2_sql := row2_sql || ', ' || quote_literal('합격');
    row3_sql := row3_sql || ', ' || quote_literal('불합격');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'test_result') then
    columns_sql := columns_sql || ', test_result';
    row1_sql := row1_sql || ', null';
    row2_sql := row2_sql || ', ' || quote_literal('[합격] 담당: By_test2 | 코멘트: 기본 매너와 운영 이해도가 좋아 바로 활동 가능합니다.');
    row3_sql := row3_sql || ', ' || quote_literal('[불합격] 담당: By_test2 | 코멘트: 기본기는 있으나 클랜 활동 시간대가 아직 맞지 않았습니다.');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'created_at') then
    columns_sql := columns_sql || ', created_at';
    row1_sql := row1_sql || ', now() - interval ''1 day''';
    row2_sql := row2_sql || ', now() - interval ''5 day''';
    row3_sql := row3_sql || ', now() - interval ''8 day''';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'is_test_data') then
    columns_sql := columns_sql || ', is_test_data';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'is_test_data_active') then
    columns_sql := columns_sql || ', is_test_data_active';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  columns_sql := ltrim(columns_sql, ', ');
  row1_sql := ltrim(row1_sql, ', ');
  row2_sql := ltrim(row2_sql, ', ');
  row3_sql := ltrim(row3_sql, ', ');

  insert_sql := format(
    'insert into public.applications (%s) values (%s), (%s), (%s)',
    columns_sql,
    row1_sql,
    row2_sql,
    row3_sql
  );

  execute insert_sql;
end
$$;

do $$
declare
  has_table boolean;
  columns_sql text := '';
  row1_sql text := '';
  row2_sql text := '';
  row3_sql text := '';
  insert_sql text;
begin
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'notifications'
  ) into has_table;

  if not has_table then
    raise notice 'public.notifications 테이블이 없어 시드를 건너뜁니다.';
    return;
  end if;

  delete from public.notifications where is_test_data = true;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'user_id') then
    columns_sql := columns_sql || ', user_id';
    row1_sql := row1_sql || ', ' || quote_literal('99999999-9999-4999-8999-999999999999');
    row2_sql := row2_sql || ', ' || quote_literal('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    row3_sql := row3_sql || ', ' || quote_literal('22222222-2222-4222-8222-222222222222');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'title') then
    columns_sql := columns_sql || ', title';
    row1_sql := row1_sql || ', ' || quote_literal('📌 테스트 심사 대기 안내');
    row2_sql := row2_sql || ', ' || quote_literal('🎉 가입 합격 알림');
    row3_sql := row3_sql || ', ' || quote_literal('🛠️ 테스트 데이터 준비 완료');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'message') then
    columns_sql := columns_sql || ', message';
    row1_sql := row1_sql || ', ' || quote_literal('현재 신청서가 접수되었고 운영진 확인을 기다리는 상태입니다.');
    row2_sql := row2_sql || ', ' || quote_literal('테스트 계정 기준으로 합격 알림 화면을 확인할 수 있도록 등록한 더미 알림입니다.');
    row3_sql := row3_sql || ', ' || quote_literal('랭킹, 신청서, 게시글, 매치 데이터가 모두 시드되었습니다.');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'is_read') then
    columns_sql := columns_sql || ', is_read';
    row1_sql := row1_sql || ', false';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', false';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'created_at') then
    columns_sql := columns_sql || ', created_at';
    row1_sql := row1_sql || ', now() - interval ''1 day''';
    row2_sql := row2_sql || ', now() - interval ''4 day''';
    row3_sql := row3_sql || ', now()';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'is_test_data') then
    columns_sql := columns_sql || ', is_test_data';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'is_test_data_active') then
    columns_sql := columns_sql || ', is_test_data_active';
    row1_sql := row1_sql || ', true';
    row2_sql := row2_sql || ', true';
    row3_sql := row3_sql || ', true';
  end if;

  columns_sql := ltrim(columns_sql, ', ');
  row1_sql := ltrim(row1_sql, ', ');
  row2_sql := ltrim(row2_sql, ', ');
  row3_sql := ltrim(row3_sql, ', ');

  insert_sql := format(
    'insert into public.notifications (%s) values (%s), (%s), (%s)',
    columns_sql,
    row1_sql,
    row2_sql,
    row3_sql
  );

  execute insert_sql;
end
$$;

do $$
declare
  has_ladder boolean;
  has_sets   boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ladder_matches'
  ) into has_ladder;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'match_sets'
  ) into has_sets;

  if not has_ladder then
    raise notice 'public.ladder_matches 테이블이 없어 시드를 건너뜁니다.';
    return;
  end if;

  -- 기존 테스트 데이터 삭제 (자식 테이블 먼저)
  if has_sets then
    delete from public.match_sets
    where match_id in (select id from public.ladder_matches where is_test_data = true);
  end if;
  delete from public.ladder_matches where is_test_data = true;

  -- ============================================================
  -- 8개 현실 래더 경기 삽입
  -- BO5 (3선승): 3v3, 4v4 | BO7 (4선승): 5v5
  --
  -- 플레이어 UUID 참조:
  --   test1  = 11111111-1111-4111-8111-111111111111 (Terran)
  --   test2  = 22222222-2222-4222-8222-222222222222 (Protoss)
  --   test3  = 33333333-3333-4333-8333-333333333333 (Zerg)
  --   test4  = 44444444-4444-4444-8444-444444444444 (Terran)
  --   test5  = 55555555-5555-4555-8555-555555555555 (Protoss)
  --   test6  = 66666666-6666-4666-8666-666666666666 (Random)
  --   test7  = 77777777-7777-4777-8777-777777777777 (Zerg)
  --   test8  = 88888888-8888-4888-8888-888888888888 (Terran)
  --   test9  = 99999999-9999-4999-8999-999999999999 (Protoss)
  --   test10 = aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa (Terran)
  -- ============================================================
  insert into public.ladder_matches (
    id, host_id, status, match_type,
    team_a_ids, team_b_ids,
    team_a_races, team_b_races,
    score_a, score_b, winning_team,
    created_at, is_test_data, is_test_data_active
  ) values
  -- 경기1: 3v3 완료 — A 3:1 승 (4세트) | test1·3·5 vs test2·4·6
  ('c1111111-1111-4111-8111-111111111111'::uuid, '11111111-1111-4111-8111-111111111111'::uuid,
   '완료', '3v3',
   array['11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','55555555-5555-4555-8555-555555555555']::uuid[],
   array['22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666']::uuid[],
   array['Terran','Zerg','Protoss']::text[], array['Protoss','Terran','Random']::text[],
   3, 1, 'A', now() - interval '7 days', true, true),
  -- 경기2: 3v3 완료 — B 2:3 승 (5세트) | test4·6·8 vs test1·3·7
  ('c2222222-2222-4222-8222-222222222222'::uuid, '44444444-4444-4444-8444-444444444444'::uuid,
   '완료', '3v3',
   array['44444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666','88888888-8888-4888-8888-888888888888']::uuid[],
   array['11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','77777777-7777-4777-8777-777777777777']::uuid[],
   array['Terran','Random','Terran']::text[], array['Terran','Zerg','Zerg']::text[],
   2, 3, 'B', now() - interval '6 days', true, true),
  -- 경기3: 4v4 완료 — A 3:0 승 (3세트) | test1·2·3·4 vs test5·6·7·8
  ('c3333333-3333-4333-8333-333333333333'::uuid, '11111111-1111-4111-8111-111111111111'::uuid,
   '완료', '4v4',
   array['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444']::uuid[],
   array['55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666','77777777-7777-4777-8777-777777777777','88888888-8888-4888-8888-888888888888']::uuid[],
   array['Terran','Protoss','Zerg','Terran']::text[], array['Protoss','Random','Zerg','Terran']::text[],
   3, 0, 'A', now() - interval '5 days', true, true),
  -- 경기4: 3v3 완료 — A 3:2 승 (5세트) | test2·5·9 vs test4·7·10
  ('c4444444-4444-4444-8444-444444444444'::uuid, '22222222-2222-4222-8222-222222222222'::uuid,
   '완료', '3v3',
   array['22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555','99999999-9999-4999-8999-999999999999']::uuid[],
   array['44444444-4444-4444-8444-444444444444','77777777-7777-4777-8777-777777777777','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']::uuid[],
   array['Protoss','Protoss','Protoss']::text[], array['Terran','Zerg','Terran']::text[],
   3, 2, 'A', now() - interval '4 days', true, true),
  -- 경기5: 5v5 완료 — A 4:2 승 (6세트, BO7 4선승) | test1~5 vs test6~10
  ('c5555555-5555-4555-8555-555555555555'::uuid, '11111111-1111-4111-8111-111111111111'::uuid,
   '완료', '5v5',
   array['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555']::uuid[],
   array['66666666-6666-4666-8666-666666666666','77777777-7777-4777-8777-777777777777','88888888-8888-4888-8888-888888888888','99999999-9999-4999-8999-999999999999','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']::uuid[],
   array['Terran','Protoss','Zerg','Terran','Protoss']::text[], array['Random','Zerg','Terran','Protoss','Terran']::text[],
   4, 2, 'A', now() - interval '3 days', true, true),
  -- 경기6: 3v3 완료 — B 0:3 승 (3세트) | test8·9·10 vs test2·5·6
  ('c6666666-6666-4666-8666-666666666666'::uuid, '88888888-8888-4888-8888-888888888888'::uuid,
   '완료', '3v3',
   array['88888888-8888-4888-8888-888888888888','99999999-9999-4999-8999-999999999999','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']::uuid[],
   array['22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666']::uuid[],
   array['Terran','Protoss','Terran']::text[], array['Protoss','Protoss','Random']::text[],
   0, 3, 'B', now() - interval '2 days', true, true),
  -- 경기7: 4v4 완료 — B 1:3 승 (4세트) | test3·6·8·9 vs test1·4·7·10
  ('c7777777-7777-4777-8777-777777777777'::uuid, '33333333-3333-4333-8333-333333333333'::uuid,
   '완료', '4v4',
   array['33333333-3333-4333-8333-333333333333','66666666-6666-4666-8666-666666666666','88888888-8888-4888-8888-888888888888','99999999-9999-4999-8999-999999999999']::uuid[],
   array['11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','77777777-7777-4777-8777-777777777777','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']::uuid[],
   array['Zerg','Random','Terran','Protoss']::text[], array['Terran','Terran','Zerg','Terran']::text[],
   1, 3, 'B', now() - interval '1 day', true, true),
  -- 경기8: 3v3 진행중 — A:1 B:2 | test1·5·7 vs test3·4·8
  ('c8888888-8888-4888-8888-888888888888'::uuid, '11111111-1111-4111-8111-111111111111'::uuid,
   '진행중', '3v3',
   array['11111111-1111-4111-8111-111111111111','55555555-5555-4555-8555-555555555555','77777777-7777-4777-8777-777777777777']::uuid[],
   array['33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','88888888-8888-4888-8888-888888888888']::uuid[],
   array['Terran','Protoss','Zerg']::text[], array['Zerg','Terran','Terran']::text[],
   1, 2, null, now() - interval '30 minutes', true, true);

  -- ============================================================
  -- match_sets: 경기별 세트 결과 (BO5/BO7 세부 기록)
  -- race_cards 조합: PPP=프프프, PPT=프프테, PPZ=프프저, PZT=프저테
  -- ============================================================
  if not has_sets then
    raise notice 'public.match_sets 테이블이 없어 세트 데이터를 건너뜁니다.';
    return;
  end if;

  insert into public.match_sets (
    id, match_id, set_number, race_cards,
    team_a_entry, team_b_entry,
    winner_team, status, team_a_ready, team_b_ready,
    created_at
  ) values

  -- ── 경기1 (3v3, A 3:1, 4세트) ── test1·3·5 vs test2·4·6 ──
  ('e1110001-1111-4111-8111-111111111111'::uuid, 'c1111111-1111-4111-8111-111111111111'::uuid,
   1, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Terran"}]'::jsonb,
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '7 days'),
  ('e1110002-1111-4111-8111-111111111111'::uuid, 'c1111111-1111-4111-8111-111111111111'::uuid,
   2, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Zerg"}]'::jsonb,
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Zerg"}]'::jsonb,
   'B', '완료', true, true, now() - interval '7 days' + interval '30 minutes'),
  ('e1110003-1111-4111-8111-111111111111'::uuid, 'c1111111-1111-4111-8111-111111111111'::uuid,
   3, array['Protoss','Zerg','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Zerg"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Terran"}]'::jsonb,
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Zerg"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '7 days' + interval '60 minutes'),
  ('e1110004-1111-4111-8111-111111111111'::uuid, 'c1111111-1111-4111-8111-111111111111'::uuid,
   4, array['Protoss','Protoss','Protoss']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"}]'::jsonb,
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"}]'::jsonb,
   'A', '완료', true, true, now() - interval '7 days' + interval '90 minutes'),

  -- ── 경기2 (3v3, B 2:3, 5세트) ── test4·6·8 vs test1·3·7 ──
  ('e2220001-2222-4222-8222-222222222222'::uuid, 'c2222222-2222-4222-8222-222222222222'::uuid,
   1, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Zerg"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Zerg"}]'::jsonb,
   'A', '완료', true, true, now() - interval '6 days'),
  ('e2220002-2222-4222-8222-222222222222'::uuid, 'c2222222-2222-4222-8222-222222222222'::uuid,
   2, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Terran"}]'::jsonb,
   'B', '완료', true, true, now() - interval '6 days' + interval '30 minutes'),
  ('e2220003-2222-4222-8222-222222222222'::uuid, 'c2222222-2222-4222-8222-222222222222'::uuid,
   3, array['Protoss','Zerg','Terran']::text[],
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Zerg"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Zerg"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Terran"}]'::jsonb,
   'B', '완료', true, true, now() - interval '6 days' + interval '60 minutes'),
  ('e2220004-2222-4222-8222-222222222222'::uuid, 'c2222222-2222-4222-8222-222222222222'::uuid,
   4, array['Protoss','Protoss','Protoss']::text[],
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Protoss"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"}]'::jsonb,
   'A', '완료', true, true, now() - interval '6 days' + interval '90 minutes'),
  ('e2220005-2222-4222-8222-222222222222'::uuid, 'c2222222-2222-4222-8222-222222222222'::uuid,
   5, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Zerg"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Zerg"}]'::jsonb,
   'B', '완료', true, true, now() - interval '6 days' + interval '120 minutes'),

  -- ── 경기3 (4v4, A 3:0, 3세트) ── test1·2·3·4 vs test5·6·7·8 ──
  -- 4v4: 세트당 3명 출전 (1명 휴식), 로테이션 적용
  ('e3330001-3333-4333-8333-333333333333'::uuid, 'c3333333-3333-4333-8333-333333333333'::uuid,
   1, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Terran"}]'::jsonb,
   '[{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '5 days'),
  ('e3330002-3333-4333-8333-333333333333'::uuid, 'c3333333-3333-4333-8333-333333333333'::uuid,
   2, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Zerg"}]'::jsonb,
   '[{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Zerg"}]'::jsonb,
   'A', '완료', true, true, now() - interval '5 days' + interval '30 minutes'),
  ('e3330003-3333-4333-8333-333333333333'::uuid, 'c3333333-3333-4333-8333-333333333333'::uuid,
   3, array['Protoss','Zerg','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Zerg"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Terran"}]'::jsonb,
   '[{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Zerg"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '5 days' + interval '60 minutes'),

  -- ── 경기4 (3v3, A 3:2, 5세트) ── test2·5·9 vs test4·7·10 ──
  ('e4440001-4444-4444-8444-444444444444'::uuid, 'c4444444-4444-4444-8444-444444444444'::uuid,
   1, array['Protoss','Protoss','Protoss']::text[],
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Protoss"}]'::jsonb,
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Protoss"}]'::jsonb,
   'B', '완료', true, true, now() - interval '4 days'),
  ('e4440002-4444-4444-8444-444444444444'::uuid, 'c4444444-4444-4444-8444-444444444444'::uuid,
   2, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Terran"}]'::jsonb,
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '4 days' + interval '30 minutes'),
  ('e4440003-4444-4444-8444-444444444444'::uuid, 'c4444444-4444-4444-8444-444444444444'::uuid,
   3, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Zerg"}]'::jsonb,
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Zerg"}]'::jsonb,
   'A', '완료', true, true, now() - interval '4 days' + interval '60 minutes'),
  ('e4440004-4444-4444-8444-444444444444'::uuid, 'c4444444-4444-4444-8444-444444444444'::uuid,
   4, array['Protoss','Zerg','Terran']::text[],
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Zerg"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Terran"}]'::jsonb,
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Zerg"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Terran"}]'::jsonb,
   'B', '완료', true, true, now() - interval '4 days' + interval '90 minutes'),
  ('e4440005-4444-4444-8444-444444444444'::uuid, 'c4444444-4444-4444-8444-444444444444'::uuid,
   5, array['Protoss','Protoss','Protoss']::text[],
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Protoss"}]'::jsonb,
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Protoss"}]'::jsonb,
   'A', '완료', true, true, now() - interval '4 days' + interval '120 minutes'),

  -- ── 경기5 (5v5, A 4:2, 6세트 BO7) ── test1~5 vs test6~10 ──
  -- 5v5: 세트당 3명 출전 (2명 휴식), 로테이션 적용
  ('e5550001-5555-4555-8555-555555555555'::uuid, 'c5555555-5555-4555-8555-555555555555'::uuid,
   1, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Terran"}]'::jsonb,
   '[{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '3 days'),
  ('e5550002-5555-4555-8555-555555555555'::uuid, 'c5555555-5555-4555-8555-555555555555'::uuid,
   2, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Zerg"}]'::jsonb,
   '[{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Zerg"}]'::jsonb,
   'B', '완료', true, true, now() - interval '3 days' + interval '30 minutes'),
  ('e5550003-5555-4555-8555-555555555555'::uuid, 'c5555555-5555-4555-8555-555555555555'::uuid,
   3, array['Protoss','Zerg','Terran']::text[],
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Zerg"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Terran"}]'::jsonb,
   '[{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Zerg"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '3 days' + interval '60 minutes'),
  ('e5550004-5555-4555-8555-555555555555'::uuid, 'c5555555-5555-4555-8555-555555555555'::uuid,
   4, array['Protoss','Protoss','Protoss']::text[],
   '[{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"}]'::jsonb,
   '[{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"}]'::jsonb,
   'A', '완료', true, true, now() - interval '3 days' + interval '90 minutes'),
  ('e5550005-5555-4555-8555-555555555555'::uuid, 'c5555555-5555-4555-8555-555555555555'::uuid,
   5, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Zerg"}]'::jsonb,
   '[{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Zerg"}]'::jsonb,
   'B', '완료', true, true, now() - interval '3 days' + interval '120 minutes'),
  ('e5550006-5555-4555-8555-555555555555'::uuid, 'c5555555-5555-4555-8555-555555555555'::uuid,
   6, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Terran"}]'::jsonb,
   '[{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '3 days' + interval '150 minutes'),

  -- ── 경기6 (3v3, B 0:3, 3세트) ── test8·9·10 vs test2·5·6 ──
  ('e6660001-6666-4666-8666-666666666666'::uuid, 'c6666666-6666-4666-8666-666666666666'::uuid,
   1, array['Protoss','Protoss','Protoss']::text[],
   '[{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Protoss"}]'::jsonb,
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"}]'::jsonb,
   'B', '완료', true, true, now() - interval '2 days'),
  ('e6660002-6666-4666-8666-666666666666'::uuid, 'c6666666-6666-4666-8666-666666666666'::uuid,
   2, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Terran"}]'::jsonb,
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Terran"}]'::jsonb,
   'B', '완료', true, true, now() - interval '2 days' + interval '30 minutes'),
  ('e6660003-6666-4666-8666-666666666666'::uuid, 'c6666666-6666-4666-8666-666666666666'::uuid,
   3, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Zerg"}]'::jsonb,
   '[{"id":"22222222-2222-4222-8222-222222222222","by_id":"By_test2","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Zerg"}]'::jsonb,
   'B', '완료', true, true, now() - interval '2 days' + interval '60 minutes'),

  -- ── 경기7 (4v4, B 1:3, 4세트) ── test3·6·8·9 vs test1·4·7·10 ──
  ('e7770001-7777-4777-8777-777777777777'::uuid, 'c7777777-7777-4777-8777-777777777777'::uuid,
   1, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '1 day'),
  ('e7770002-7777-4777-8777-777777777777'::uuid, 'c7777777-7777-4777-8777-777777777777'::uuid,
   2, array['Protoss','Zerg','Terran']::text[],
   '[{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Zerg"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Terran"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Zerg"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Terran"}]'::jsonb,
   'B', '완료', true, true, now() - interval '1 day' + interval '30 minutes'),
  ('e7770003-7777-4777-8777-777777777777'::uuid, 'c7777777-7777-4777-8777-777777777777'::uuid,
   3, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Zerg"}]'::jsonb,
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Zerg"}]'::jsonb,
   'B', '완료', true, true, now() - interval '1 day' + interval '60 minutes'),
  ('e7770004-7777-4777-8777-777777777777'::uuid, 'c7777777-7777-4777-8777-777777777777'::uuid,
   4, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"66666666-6666-4666-8666-666666666666","by_id":"By_test6","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Protoss"},{"id":"99999999-9999-4999-8999-999999999999","by_id":"By_test9","race":"Terran"}]'::jsonb,
   '[{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Protoss"},{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","by_id":"By_test10","race":"Terran"}]'::jsonb,
   'B', '완료', true, true, now() - interval '1 day' + interval '90 minutes'),

  -- ── 경기8 (3v3, 진행중 A:1 B:2) ── test1·5·7 vs test3·4·8 ──
  -- 완료된 세트 3개 + 현재 진행 중인 세트 1개
  ('e8880001-8888-4888-8888-888888888888'::uuid, 'c8888888-8888-4888-8888-888888888888'::uuid,
   1, array['Protoss','Protoss','Zerg']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Zerg"}]'::jsonb,
   '[{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Zerg"}]'::jsonb,
   'B', '완료', true, true, now() - interval '30 minutes'),
  ('e8880002-8888-4888-8888-888888888888'::uuid, 'c8888888-8888-4888-8888-888888888888'::uuid,
   2, array['Protoss','Protoss','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Protoss"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Terran"}]'::jsonb,
   '[{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Protoss"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   'A', '완료', true, true, now() - interval '20 minutes'),
  ('e8880003-8888-4888-8888-888888888888'::uuid, 'c8888888-8888-4888-8888-888888888888'::uuid,
   3, array['Protoss','Zerg','Terran']::text[],
   '[{"id":"11111111-1111-4111-8111-111111111111","by_id":"By_test1","race":"Protoss"},{"id":"55555555-5555-4555-8555-555555555555","by_id":"By_test5","race":"Zerg"},{"id":"77777777-7777-4777-8777-777777777777","by_id":"By_test7","race":"Terran"}]'::jsonb,
   '[{"id":"33333333-3333-4333-8333-333333333333","by_id":"By_test3","race":"Protoss"},{"id":"44444444-4444-4444-8444-444444444444","by_id":"By_test4","race":"Zerg"},{"id":"88888888-8888-4888-8888-888888888888","by_id":"By_test8","race":"Terran"}]'::jsonb,
   'B', '완료', true, true, now() - interval '10 minutes'),
  ('e8880004-8888-4888-8888-888888888888'::uuid, 'c8888888-8888-4888-8888-888888888888'::uuid,
   4, array['Protoss','Protoss','Protoss']::text[],
   '[]'::jsonb, '[]'::jsonb,
   null, '엔트리제출중', false, false, now() - interval '3 minutes');

end
$$;

-- ========================================
-- 점검용 쿼리
-- ========================================

-- 1. 시스템 설정 확인
select
  key,
  value_bool,
  description,
  updated_at
from public.system_settings
where key in ('test_mode_active', 'test_accounts_enabled')
order by key;

-- 1-1. auth 테스트 계정 생성 여부 확인
select
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data
from auth.users
where email like 'test%@byclan.local'
order by email;

-- 2. 테스트 프로필 생성 여부 확인
select
  p.id,
  p.discord_id,
  p.by_id,
  p.role,
  to_jsonb(p)->>'discord_id' as discord_id,
  p.is_test_account,
  p.is_test_account_active,
  p.clan_point
from public.profiles p
where is_test_account = true
  order by p.discord_id;

-- 3. 래더 랭킹 반영 여부 확인
select
  nullif(to_jsonb(l)->>'rank', '')::integer as rank,
  coalesce(to_jsonb(l)->>'nickname', to_jsonb(l)->>'name', to_jsonb(l)->>'by_id') as nickname,
  to_jsonb(l)->>'discord_id' as discord_id,
  nullif(to_jsonb(l)->>'ladder_mmr', '')::integer as "ladder_mmr",
  nullif(to_jsonb(l)->>'win', '')::integer as win,
  nullif(to_jsonb(l)->>'lose', '')::integer as lose,
  l.is_test_data,
  l.is_test_data_active
from public.ladders l
where is_test_data = true
order by rank asc nulls last, ladder_mmr desc;

-- 4. 게시글/신청서/알림/매치 집계 확인
select 'admin_posts' as table_name, count(*) as seeded_count from public.admin_posts where is_test_data = true
union all
select 'posts' as table_name, count(*) as seeded_count from public.posts where is_test_data = true
union all
select 'applications' as table_name, count(*) as seeded_count from public.applications where is_test_data = true
union all
select 'notifications' as table_name, count(*) as seeded_count from public.notifications where is_test_data = true
union all
select 'ladder_matches' as table_name, count(*) as seeded_count from public.ladder_matches where is_test_data = true;

-- 5. 테스트 계정별 래더 진입 준비 상태 확인
select
  p.discord_id,
  p.by_id,
  p.role,
  to_jsonb(p)->>'discord_id' as discord_id,
  p.is_test_account_active,
  s.value_bool as test_accounts_enabled,
  case
    when s.value_bool = true and p.is_test_account = true then 'discord_bypass_allowed'
    when to_jsonb(p)->>'discord_id' is not null then 'discord_linked'
    else 'discord_required'
  end as ladder_discord_gate
from public.profiles p
left join public.system_settings s
  on s.key = 'test_accounts_enabled'
where p.is_test_account = true
order by p.discord_id;

-- 6. 필요 시 전체 테스트 계정 숨김
-- update public.system_settings
-- set value_bool = false, updated_at = now()
-- where key = 'test_accounts_enabled';
--
-- update public.profiles
-- set is_test_account_active = false
-- where is_test_account = true;
--
-- update public.ladders
-- set is_test_data_active = false
-- where is_test_data = true;
--
-- update public.admin_posts
-- set is_test_data_active = false
-- where is_test_data = true;
--
-- update public.posts
-- set is_test_data_active = false
-- where is_test_data = true;
--
-- update public.applications
-- set is_test_data_active = false
-- where is_test_data = true;
--
-- update public.notifications
-- set is_test_data_active = false
-- where is_test_data = true;
--
-- update public.ladder_matches
-- set is_test_data_active = false
-- where is_test_data = true;

-- 7. 필요 시 다시 전체 테스트 계정 표시
-- update public.system_settings
-- set value_bool = true, updated_at = now()
-- where key = 'test_accounts_enabled';
--
-- update public.profiles
-- set is_test_account_active = true
-- where is_test_account = true;
--
-- update public.ladders
-- set is_test_data_active = true
-- where is_test_data = true;
--
-- update public.admin_posts
-- set is_test_data_active = true
-- where is_test_data = true;
--
-- update public.posts
-- set is_test_data_active = true
-- where is_test_data = true;
--
-- update public.applications
-- set is_test_data_active = true
-- where is_test_data = true;
--
-- update public.notifications
-- set is_test_data_active = true
-- where is_test_data = true;
--
-- update public.ladder_matches
-- set is_test_data_active = true
-- where is_test_data = true;
