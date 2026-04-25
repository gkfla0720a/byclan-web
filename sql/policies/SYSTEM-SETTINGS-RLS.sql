-- public.developer_settings RLS 활성화 + 운영진/개발자 전용 정책
-- 목적: public 스키마 노출 테이블의 무분별한 접근 차단
-- 현재 코드 기준 사용처: DevConsole + 매치 실시간 관리모드 토글
-- 실행 위치: Supabase SQL Editor

-- 1) RLS 활성화
alter table if exists public.developer_settings enable row level security;

-- 2) 정책 생성 (idempotent)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'developer_settings'
  ) then
    -- SELECT: management 역할(admin/master/developer)만 허용
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'developer_settings'
        and policyname = 'Management can read system settings'
    ) then
      create policy "Management can read system settings"
        on public.developer_settings
        for select
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        );
    end if;

    -- INSERT: management 역할(admin/master/developer)만 허용
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'developer_settings'
        and policyname = 'Management can insert system settings'
    ) then
      create policy "Management can insert system settings"
        on public.developer_settings
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        );
    end if;

    -- UPDATE: management 역할(admin/master/developer)만 허용
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'developer_settings'
        and policyname = 'Management can update system settings'
    ) then
      create policy "Management can update system settings"
        on public.developer_settings
        for update
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        )
        with check (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'master', 'developer')
          )
        );
    end if;
  end if;
end
$$;

-- 3) 명시적 GRANT 하드닝
revoke all on table public.developer_settings from anon;
revoke all on table public.developer_settings from authenticated;
grant select, insert, update on table public.developer_settings to authenticated;

-- 4) 점검 쿼리
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename='developer_settings';
-- select policyname, permissive, cmd, roles, qual, with_check from pg_policies where schemaname='public' and tablename='developer_settings';
