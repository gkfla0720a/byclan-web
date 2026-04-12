-- Ranking stats tracking for ladder board
-- Adds future-facing ranking fields and keeps them consistent with ladder match results.

begin;

alter table public.profiles
  add column if not exists recent_total_delta integer;

alter table public.profiles
  add column if not exists race_combo_stats jsonb;

alter table public.match_sets
  add column if not exists combo_code text;

create or replace function public.fn_empty_race_combo_stats()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'PPP', jsonb_build_object('wins', 0, 'losses', 0),
    'PPT', jsonb_build_object('wins', 0, 'losses', 0),
    'PPZ', jsonb_build_object('wins', 0, 'losses', 0),
    'PZT', jsonb_build_object('wins', 0, 'losses', 0),
    'OTHER', jsonb_build_object('wins', 0, 'losses', 0)
  );
$$;

create or replace function public.fn_get_race_combo_code(p_races text[])
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  normalized text[];
begin
  if p_races is null or array_length(p_races, 1) <> 3 then
    return 'OTHER';
  end if;

  select array_agg(lower(trim(r)) order by lower(trim(r)))
  into normalized
  from unnest(p_races) as r;

  if normalized = array['protoss', 'protoss', 'protoss'] then
    return 'PPP';
  elsif normalized = array['protoss', 'protoss', 'terran'] then
    return 'PPT';
  elsif normalized = array['protoss', 'protoss', 'zerg'] then
    return 'PPZ';
  elsif normalized = array['protoss', 'terran', 'zerg'] then
    return 'PZT';
  end if;

  return 'OTHER';
end;
$$;

create or replace function public.fn_increment_combo_stat(p_stats jsonb, p_combo text, p_key text)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  combo_key text := case when upper(coalesce(p_combo, '')) in ('PPP', 'PPT', 'PPZ', 'PZT', 'OTHER') then upper(p_combo) else 'OTHER' end;
  result_key text := case when lower(coalesce(p_key, '')) = 'wins' then 'wins' else 'losses' end;
  next_value integer;
  base_stats jsonb := coalesce(p_stats, public.fn_empty_race_combo_stats());
begin
  next_value := coalesce((base_stats -> combo_key ->> result_key)::integer, 0) + 1;
  return jsonb_set(base_stats, array[combo_key, result_key], to_jsonb(next_value), true);
end;
$$;

create or replace function public.fn_entry_player_ids(p_entry jsonb)
returns uuid[]
language plpgsql
immutable
set search_path = public
as $$
declare
  entry_type text := jsonb_typeof(p_entry);
begin
  if p_entry is null or entry_type is null then
    return '{}'::uuid[];
  end if;

  if entry_type = 'array' then
    return coalesce(
      (
        select array_agg(coalesce(nullif(elem ->> 'id', ''), nullif(elem ->> 'user_id', ''))::uuid)
        from jsonb_array_elements(p_entry) as elem
        where coalesce(nullif(elem ->> 'id', ''), nullif(elem ->> 'user_id', '')) is not null
      ),
      '{}'::uuid[]
    );
  end if;

  if entry_type = 'object' and coalesce(nullif(p_entry ->> 'id', ''), nullif(p_entry ->> 'user_id', '')) is not null then
    return array[coalesce(nullif(p_entry ->> 'id', ''), nullif(p_entry ->> 'user_id', ''))::uuid];
  end if;

  return '{}'::uuid[];
end;
$$;

create or replace function public.fn_sync_match_set_combo_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.combo_code := public.fn_get_race_combo_code(new.race_cards);
  return new;
end;
$$;

drop trigger if exists trg_match_sets_sync_combo_code on public.match_sets;
create trigger trg_match_sets_sync_combo_code
before insert or update of race_cards
on public.match_sets
for each row
execute function public.fn_sync_match_set_combo_code();

create or replace function public.fn_apply_match_team_mmr()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  winner_ids uuid[];
  loser_ids uuid[];
  a_set_wins integer := coalesce(new.score_a, 0);
  b_set_wins integer := coalesce(new.score_b, 0);
  winner_delta integer;
  loser_delta integer;
begin
  if not (new.status = '완료' and new.winning_team in ('A', 'B') and coalesce(new.team_mmr_applied, false) = false) then
    return new;
  end if;

  if new.winning_team = 'A' then
    winner_ids := coalesce(new.team_a_ids, '{}'::uuid[]);
    loser_ids := coalesce(new.team_b_ids, '{}'::uuid[]);
    winner_delta := ((a_set_wins - b_set_wins) * 10) + 10;
  else
    winner_ids := coalesce(new.team_b_ids, '{}'::uuid[]);
    loser_ids := coalesce(new.team_a_ids, '{}'::uuid[]);
    winner_delta := ((b_set_wins - a_set_wins) * 10) + 10;
  end if;
  loser_delta := winner_delta * -1;

  update public.profiles p
  set team_mmr = coalesce(p.team_mmr, 0) + 10,
      recent_total_delta = winner_delta
  where p.id = any(winner_ids);

  update public.profiles p
  set team_mmr = coalesce(p.team_mmr, 0) - 10,
      recent_total_delta = loser_delta
  where p.id = any(loser_ids);

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
  combo_key text;
  winner_entry_ids uuid[];
  loser_entry_ids uuid[];
  match_type_players integer;
begin
  if not (new.status = '완료' and new.winner_team in ('A', 'B') and coalesce(new.set_mmr_applied, false) = false) then
    return new;
  end if;

  select * into m
  from public.ladder_matches
  where id = new.match_id;

  if not found then
    return new;
  end if;

  combo_key := coalesce(new.combo_code, public.fn_get_race_combo_code(new.race_cards));

  if new.winner_team = 'A' then
    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) + 10
    where p.id = any(coalesce(m.team_a_ids, '{}'::uuid[]));

    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) - 10
    where p.id = any(coalesce(m.team_b_ids, '{}'::uuid[]));

    winner_entry_ids := public.fn_entry_player_ids(new.team_a_entry);
    loser_entry_ids := public.fn_entry_player_ids(new.team_b_entry);
  else
    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) + 10
    where p.id = any(coalesce(m.team_b_ids, '{}'::uuid[]));

    update public.profiles p
    set ladder_mmr = coalesce(p.ladder_mmr, 1500) - 10
    where p.id = any(coalesce(m.team_a_ids, '{}'::uuid[]));

    winner_entry_ids := public.fn_entry_player_ids(new.team_b_entry);
    loser_entry_ids := public.fn_entry_player_ids(new.team_a_entry);
  end if;

  update public.profiles p
  set race_combo_stats = public.fn_increment_combo_stat(p.race_combo_stats, combo_key, 'wins')
  where p.id = any(coalesce(winner_entry_ids, '{}'::uuid[]));

  update public.profiles p
  set race_combo_stats = public.fn_increment_combo_stat(p.race_combo_stats, combo_key, 'losses')
  where p.id = any(coalesce(loser_entry_ids, '{}'::uuid[]));

  update public.match_sets
  set set_mmr_applied = true,
      combo_code = combo_key
  where id = new.id;

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

  match_type_players := coalesce(nullif(regexp_replace(coalesce(m.match_type, '0'), '[^0-9]', '', 'g'), ''), '0')::integer;
  need_wins := case when match_type_players >= 5 then 4 else 3 end;

  update public.ladder_matches
  set score_a = a_set_wins,
      score_b = b_set_wins
  where id = new.match_id;

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

update public.match_sets
set combo_code = public.fn_get_race_combo_code(race_cards)
where combo_code is distinct from public.fn_get_race_combo_code(race_cards);

update public.profiles
set race_combo_stats = null,
    recent_total_delta = null;

with combo_results as (
  select player_id, combo_code, sum(win_count)::integer as wins, sum(loss_count)::integer as losses
  from (
    select unnest(public.fn_entry_player_ids(ms.team_a_entry)) as player_id,
           coalesce(ms.combo_code, public.fn_get_race_combo_code(ms.race_cards)) as combo_code,
           case when ms.winner_team = 'A' then 1 else 0 end as win_count,
           case when ms.winner_team = 'B' then 1 else 0 end as loss_count
    from public.match_sets ms
    where ms.status = '완료'
      and ms.winner_team in ('A', 'B')

    union all

    select unnest(public.fn_entry_player_ids(ms.team_b_entry)) as player_id,
           coalesce(ms.combo_code, public.fn_get_race_combo_code(ms.race_cards)) as combo_code,
           case when ms.winner_team = 'B' then 1 else 0 end as win_count,
           case when ms.winner_team = 'A' then 1 else 0 end as loss_count
    from public.match_sets ms
    where ms.status = '완료'
      and ms.winner_team in ('A', 'B')
  ) x
  group by player_id, combo_code
), combo_json as (
  select player_id,
         public.fn_empty_race_combo_stats()
         || jsonb_object_agg(combo_code, jsonb_build_object('wins', wins, 'losses', losses)) as stats
  from combo_results
  group by player_id
)
update public.profiles p
set race_combo_stats = cj.stats
from combo_json cj
where p.id = cj.player_id;

with latest_match_delta as (
  select player_id, delta
  from (
    select player_id,
           delta,
           row_number() over (partition by player_id order by finalized_at desc nulls last, created_at desc nulls last, match_id desc) as rn
    from (
      select lm.id as match_id,
             lm.finalized_at,
             lm.created_at,
             unnest(coalesce(lm.team_a_ids, '{}'::uuid[])) as player_id,
             case
               when lm.winning_team = 'A' then ((coalesce(lm.score_a, 0) - coalesce(lm.score_b, 0)) * 10) + 10
               else -(((coalesce(lm.score_b, 0) - coalesce(lm.score_a, 0)) * 10) + 10)
             end as delta
      from public.ladder_matches lm
      where lm.status = '완료'
        and lm.winning_team in ('A', 'B')

      union all

      select lm.id as match_id,
             lm.finalized_at,
             lm.created_at,
             unnest(coalesce(lm.team_b_ids, '{}'::uuid[])) as player_id,
             case
               when lm.winning_team = 'B' then ((coalesce(lm.score_b, 0) - coalesce(lm.score_a, 0)) * 10) + 10
               else -(((coalesce(lm.score_a, 0) - coalesce(lm.score_b, 0)) * 10) + 10)
             end as delta
      from public.ladder_matches lm
      where lm.status = '완료'
        and lm.winning_team in ('A', 'B')
    ) expanded
  ) ranked
  where rn = 1
)
update public.profiles p
set recent_total_delta = lmd.delta
from latest_match_delta lmd
where p.id = lmd.player_id;

commit;
