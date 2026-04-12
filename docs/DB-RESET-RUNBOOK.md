# DB Reset Runbook

서비스 이전 단계에서 DB를 초기화하고 표준 상태로 재세팅하는 실행 가이드입니다.

## A. 권장 실행 순서

1. 연결/성능/컬럼 강화: `DB-LINKAGE-HARDENING-PROPOSAL.sql`
1. 상태값 표준화: `DB-STATUS-STANDARDIZATION.sql`
1. 필요 시 전체 데이터 초기화: `DB-RESET-AND-BASELINE.sql`

## B. 공격적 초기화 시나리오

아래 상황이면 리셋을 권장합니다.

- 테스트 데이터가 너무 섞여 품질 판단이 어려운 경우
- 상태값이 여러 체계로 혼재되어 운영 코드와 충돌하는 경우
- 프론트/관리자 신규 구현을 깨끗한 기준 데이터로 시작하려는 경우

초기화 후 최소 복구 항목

- 운영 설정: `system_settings` 기본 키 4개
- 관리자 계정: 로그인 후 `profiles` 재생성 또는 시드 스크립트 별도 적용

## C. 실행 전/후 점검 SQL

실행 전

```sql
select table_name, table_rows
from (
  select 'profiles' as table_name, count(*)::bigint as table_rows from public.profiles
  union all select 'applications', count(*)::bigint from public.applications
  union all select 'ladder_matches', count(*)::bigint from public.ladder_matches
  union all select 'match_sets', count(*)::bigint from public.match_sets
  union all select 'match_bets', count(*)::bigint from public.match_bets
) t
order by table_name;
```

실행 후

```sql
select * from public.v_integrity_gaps;
```

```sql
select coalesce(status, '<NULL>') as status, count(*)
from public.ladder_matches
group by 1
order by 2 desc;
```

```sql
select coalesce(status, '<NULL>') as status, count(*)
from public.match_sets
group by 1
order by 2 desc;
```

## D. 주의사항

- `DB-RESET-AND-BASELINE.sql`은 public 업무 데이터 삭제 작업입니다.
- auth 계정까지 삭제하려면 리셋 스크립트 하단의 옵션 블록을 별도로 실행해야 합니다.
- 운영 반영 시에는 반드시 Supabase SQL editor에서 트랜잭션 단위로 실행하고 결과를 확인하세요.
