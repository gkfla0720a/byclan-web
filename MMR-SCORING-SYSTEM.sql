-- MMR scoring system for ByClan
-- Rule 1) Each completed set: winner team +10 personal MMR, loser team -10 personal MMR
-- Rule 2) Match decided: winner team +10 team MMR, loser team -10 team MMR
-- Rule 3) Applied immediately after set completion

begin;

-- 1) Profiles: personal/team/total MMR columns
alter table public.profiles
  add column if not exists team_mmr integer not null default 0;

alter table public.profiles
  add column if not exists total_mmr integer;

-- 2) Idempotency flags
alter table public.match_sets
  add column if not exists set_mmr_applied boolean not null default false;

alter table public.ladder_matches
  add column if not exists team_mmr_applied boolean not null default false;

-- 3) Initialize all players to 1500 base MMR as requested
update public.profiles
set ladder_mmr = 1500,
    team_mmr = 0,
    total_mmr = 1500,
    wins = 0,
    losses = 0;

-- 4) Keep total_mmr in sync
create or replace function public.fn_sync_total_mmr()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.total_mmr := coalesce(new.ladder_mmr, 1500) + coalesce(new.team_mmr, 0);
  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_total_mmr on public.profiles;
create trigger trg_profiles_sync_total_mmr
before insert or update of ladder_mmr, team_mmr
on public.profiles
for each row
execute function public.fn_sync_total_mmr();

-- 5) Apply match team MMR when a match is finalized
create or replace function public.fn_apply_match_team_mmr()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  winner_ids uuid[];
  loser_ids uuid[];
begin
  if not (new.status = '완료' and new.winning_team in ('A','B') and coalesce(new.team_mmr_applied, false) = false) then
    return new;
  end if;

  if new.winning_team = 'A' then
    winner_ids := coalesce(new.team_a_ids, '{}'::uuid[]);
    loser_ids := coalesce(new.team_b_ids, '{}'::uuid[]);
  else
    winner_ids := coalesce(new.team_b_ids, '{}'::uuid[]);
    loser_ids := coalesce(new.team_a_ids, '{}'::uuid[]);
  end if;

  -- Team bonus/penalty
  update public.profiles p
  set team_mmr = coalesce(p.team_mmr, 0) + 10
  where p.id = any(winner_ids);

  update public.profiles p
  set team_mmr = coalesce(p.team_mmr, 0) - 10
  where p.id = any(loser_ids);

  -- Win/Loss update
  update public.profiles p
  set wins = coalesce(p.wins, 0) + 1
  where p.id = any(winner_ids);

  update public.profiles p
  set losses = coalesce(p.losses, 0) + 1
  where p.id = any(loser_ids);

  update public.ladder_matches
  set team_mmr_applied = true,
      finalized_at = coalesce(finalized_at, now())
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_ladder_matches_apply_team_mmr on public.ladder_matches;
create trigger trg_ladder_matches_apply_team_mmr
after update of status, winning_team
on public.ladder_matches
for each row
execute function public.fn_apply_match_team_mmr();

-- 6) Apply set personal MMR and auto-finalize match when win condition reached
create or replace function public.fn_apply_set_mmr_and_progress_match()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  m public.ladder_matches%rowtype;
  a_set_wins integer;
  b_set_wins integer;
  need_wins integer;
begin
  if not (new.status = '완료' and new.winner_team in ('A','B') and coalesce(new.set_mmr_applied, false) = false) then
    return new;
  end if;

  select * into m
  from public.ladder_matches
  where id = new.match_id;

  if not found then
    return new;
  end if;

  -- Rule 1: set-based personal MMR
  if new.winner_team = 'A' then
    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) + 10
    where p.id = any(coalesce(m.team_a_ids, '{}'::uuid[]));

    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) - 10
    where p.id = any(coalesce(m.team_b_ids, '{}'::uuid[]));
  else
    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) + 10
    where p.id = any(coalesce(m.team_b_ids, '{}'::uuid[]));

    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) - 10
    where p.id = any(coalesce(m.team_a_ids, '{}'::uuid[]));
  end if;

  -- Mark applied (idempotency)
  update public.match_sets
  set set_mmr_applied = true
  where id = new.id;

  -- Recalculate set score in DB
  select count(*)::int into a_set_wins
  from public.match_sets
  where match_id = new.match_id
    and status = '완료'
    and winner_team = 'A';

  select count(*)::int into b_set_wins
  from public.match_sets
  where match_id = new.match_id
    and status = '완료'
    and winner_team = 'B';

  need_wins := case when m.match_type = '5v5' then 4 else 3 end;

  -- Sync match score always
  update public.ladder_matches
  set score_a = a_set_wins,
      score_b = b_set_wins
  where id = new.match_id;

  -- Auto-finalize match and trigger team bonus
  if a_set_wins >= need_wins or b_set_wins >= need_wins then
    update public.ladder_matches
    set status = '완료',
        winning_team = case when a_set_wins >= need_wins then 'A' else 'B' end,
        finalized_at = now()
    where id = new.match_id
      and status <> '완료';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_match_sets_apply_set_mmr on public.match_sets;
create trigger trg_match_sets_apply_set_mmr
after update of status, winner_team
on public.match_sets
for each row
execute function public.fn_apply_set_mmr_and_progress_match();

-- 7) Rebuild ladders by total_mmr desc
truncate table public.ladders restart identity;

insert into public.ladders (
  rank, user_id, nickname, ladder_mmr, race, win, lose, win_rate, is_test_data, is_test_data_active
)
select
  row_number() over (order by coalesce(p.total_mmr, 1500) desc, p.created_at asc) as rank,
  p.id,
  p.by_id,
  coalesce(p.total_mmr, 1500) as ladder_mmr,
  p.race,
  coalesce(p.wins, 0),
  coalesce(p.losses, 0),
  case
    when coalesce(p.wins,0) + coalesce(p.losses,0) = 0 then '0%'
    else concat(round((coalesce(p.wins,0)::numeric / (coalesce(p.wins,0) + coalesce(p.losses,0))::numeric) * 100), '%')
  end as win_rate,
  coalesce(p.is_test_account, false) as is_test_data,
  coalesce(p.is_test_account_active, true) as is_test_data_active
from public.profiles p
where p.role not in ('visitor', 'applicant', 'expelled');

commit;
