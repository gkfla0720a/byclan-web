require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });
const { Client } = require('pg');

const DB_URL = process.env.DB_URL;
if (!DB_URL) throw new Error('DB_URL 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');

const REAL = {
  A: '057c4bc1-8067-406b-ad40-efe6125a3d1f', // By_Developer
  B: '6d0aa755-a291-4780-a0f8-04e15f2c3aca', // By_gkfla
  C: '04aa3e91-5d67-4dc8-afc1-b313a9d4995c', // By_Master
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function testerId(n) {
  const no = pad2(n);
  return `cc0000${no}-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

const T1 = testerId(1);
const T2 = testerId(2);
const T3 = testerId(3);
const T4 = testerId(4);
const T5 = testerId(5);

const MAPS = [
  '블리자드 밸리',
  '알트지 스테이션',
  '데스티네이션',
  '카트리나의 눈물',
  '피아식물원',
  '블루 스톰',
  '임피리얼 베이',
  '폴링 스카이',
  '협곡',
  '나나스',
  '에코',
  '네오 문글로우',
];

const MATCHES = [
  {
    id: 'dd000001-0000-4000-8000-000000000001',
    type: '3v3', host: REAL.A,
    ta: [REAL.A, REAL.B, REAL.C], tb: [T1, T2, T3],
    ta_races: ['Protoss', 'Protoss', 'Protoss'], tb_races: ['Terran', 'Zerg', 'Protoss'],
    winner: 'A', sa: 3, sb: 1, days: 55, map: MAPS[0],
  },
  {
    id: 'dd000002-0000-4000-8000-000000000002',
    type: '3v3', host: T1,
    ta: [T1, T2, T3], tb: [REAL.A, REAL.B, REAL.C],
    ta_races: ['Terran', 'Zerg', 'Protoss'], tb_races: ['Protoss', 'Protoss', 'Protoss'],
    winner: 'B', sa: 1, sb: 3, days: 50, map: MAPS[1],
  },
  {
    id: 'dd000003-0000-4000-8000-000000000003',
    type: '3v3', host: REAL.A,
    ta: [REAL.A, T1, T4], tb: [REAL.B, REAL.C, T2],
    ta_races: ['Protoss', 'Terran', 'Terran'], tb_races: ['Protoss', 'Protoss', 'Zerg'],
    winner: 'A', sa: 3, sb: 2, days: 45, map: MAPS[2],
  },
  {
    id: 'dd000004-0000-4000-8000-000000000004',
    type: '3v3', host: REAL.C,
    ta: [REAL.C, T2, T5], tb: [REAL.A, T3, T4],
    ta_races: ['Protoss', 'Zerg', 'Zerg'], tb_races: ['Protoss', 'Protoss', 'Terran'],
    winner: 'B', sa: 0, sb: 3, days: 40, map: MAPS[3],
  },
  {
    id: 'dd000005-0000-4000-8000-000000000005',
    type: '3v3', host: REAL.B,
    ta: [REAL.B, T1, T3], tb: [REAL.C, T2, T5],
    ta_races: ['Protoss', 'Terran', 'Protoss'], tb_races: ['Protoss', 'Zerg', 'Zerg'],
    winner: 'A', sa: 3, sb: 2, days: 35, map: MAPS[4],
  },
  {
    id: 'dd000006-0000-4000-8000-000000000006',
    type: '3v3', host: T2,
    ta: [T2, T4, T5], tb: [REAL.A, REAL.B, T3],
    ta_races: ['Zerg', 'Terran', 'Zerg'], tb_races: ['Protoss', 'Protoss', 'Protoss'],
    winner: 'B', sa: 1, sb: 3, days: 30, map: MAPS[5],
  },
  {
    id: 'dd000007-0000-4000-8000-000000000007',
    type: '3v3', host: REAL.A,
    ta: [REAL.A, REAL.C, T5], tb: [REAL.B, T1, T4],
    ta_races: ['Protoss', 'Protoss', 'Zerg'], tb_races: ['Protoss', 'Terran', 'Terran'],
    winner: 'A', sa: 3, sb: 1, days: 25, map: MAPS[6],
  },
  {
    id: 'dd000008-0000-4000-8000-000000000008',
    type: '3v3', host: REAL.C,
    ta: [REAL.C, T1, T2], tb: [REAL.A, REAL.B, T3],
    ta_races: ['Protoss', 'Terran', 'Zerg'], tb_races: ['Protoss', 'Protoss', 'Protoss'],
    winner: 'B', sa: 2, sb: 3, days: 20, map: MAPS[7],
  },
  {
    id: 'dd000009-0000-4000-8000-000000000009',
    type: '4v4', host: REAL.A,
    ta: [REAL.A, REAL.B, REAL.C, T1], tb: [T2, T3, T4, T5],
    ta_races: ['Protoss', 'Protoss', 'Protoss', 'Terran'], tb_races: ['Zerg', 'Protoss', 'Terran', 'Zerg'],
    winner: 'A', sa: 3, sb: 0, days: 52, map: MAPS[8],
  },
  {
    id: 'dd000010-0000-4000-8000-000000000010',
    type: '4v4', host: T1,
    ta: [T1, T2, T3, T4], tb: [REAL.A, REAL.B, REAL.C, T5],
    ta_races: ['Terran', 'Zerg', 'Protoss', 'Terran'], tb_races: ['Protoss', 'Protoss', 'Protoss', 'Zerg'],
    winner: 'B', sa: 1, sb: 3, days: 43, map: MAPS[9],
  },
  {
    id: 'dd000011-0000-4000-8000-000000000011',
    type: '4v4', host: REAL.A,
    ta: [REAL.A, REAL.C, T2, T4], tb: [REAL.B, T1, T3, T5],
    ta_races: ['Protoss', 'Protoss', 'Zerg', 'Terran'], tb_races: ['Protoss', 'Terran', 'Protoss', 'Zerg'],
    winner: 'A', sa: 3, sb: 2, days: 33, map: MAPS[10],
  },
  {
    id: 'dd000012-0000-4000-8000-000000000012',
    type: '4v4', host: REAL.B,
    ta: [REAL.B, T1, T3, T5], tb: [REAL.A, REAL.C, T2, T4],
    ta_races: ['Protoss', 'Terran', 'Protoss', 'Zerg'], tb_races: ['Protoss', 'Protoss', 'Zerg', 'Terran'],
    winner: 'B', sa: 2, sb: 3, days: 15, map: MAPS[11],
  },
];

function buildExtraMatches(extraIds, raceById) {
  const list = [];
  const count = 38;

  for (let i = 0; i < count; i += 1) {
    const is3v3 = i % 2 === 0;
    const perTeam = is3v3 ? 3 : 4;
    const start = (i * 3) % extraIds.length;
    const teamA = [];
    const teamB = [];

    for (let k = 0; k < perTeam; k += 1) {
      teamA.push(extraIds[(start + k) % extraIds.length]);
      teamB.push(extraIds[(start + perTeam + k) % extraIds.length]);
    }

    const winner = i % 3 === 0 ? 'A' : 'B';
    const loseSets = i % 3;
    const sa = winner === 'A' ? 3 : loseSets;
    const sb = winner === 'B' ? 3 : loseSets;

    const serial = i + 1;
    const id = `de1000${pad2(serial)}-0000-4000-8000-${String(serial).padStart(12, '0')}`;

    list.push({
      id,
      type: is3v3 ? '3v3' : '4v4',
      host: teamA[0],
      ta: teamA,
      tb: teamB,
      ta_races: teamA.map((pid) => raceById[pid] || 'Protoss'),
      tb_races: teamB.map((pid) => raceById[pid] || 'Protoss'),
      winner,
      sa,
      sb,
      days: 90 - i,
      map: MAPS[serial % MAPS.length],
    });
  }

  return list;
}

function buildMatchTimestamp(index) {
  // 약 5일 동안 하루 10경기 내외로 분포
  const dayOffset = Math.floor(index / 10);
  const slot = index % 10;
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(13 + Math.floor(slot / 2), (slot % 2) * 30, 0, 0);
  return d.toISOString();
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildSets(matchId, sa, sb) {
  const total = sa + sb;
  const sets = [];
  const finalWinner = sa > sb ? 'A' : 'B';
  let curA = 0;
  let curB = 0;

  for (let i = 1; i <= total; i += 1) {
    let winner;
    if (i === total) {
      winner = finalWinner;
    } else {
      const aNeeds = sa - curA;
      const bNeeds = sb - curB;
      if (aNeeds > bNeeds) winner = 'A';
      else if (bNeeds > aNeeds) winner = 'B';
      else winner = i % 2 === 0 ? 'B' : 'A';
    }

    if (winner === 'A') curA += 1;
    else curB += 1;

    const setId = `${matchId.slice(0, 8)}-${String(i).padStart(4, '0')}-4000-8000-${matchId.slice(-12)}`;
    sets.push({ id: setId, num: i, winner });
  }

  return sets;
}

function pickThree(teamIds, teamRaces, setNo) {
  const out = [];
  const n = teamIds.length;
  const start = (setNo - 1) % Math.max(1, n);
  for (let i = 0; i < 3; i += 1) {
    const idx = (start + i) % n;
    out.push({
      id: teamIds[idx],
      race: teamRaces[idx],
    });
  }
  return out;
}

function normalizeRace(r) {
  return String(r || '').trim().toLowerCase();
}

function getComboCode(races) {
  if (!Array.isArray(races) || races.length !== 3) return 'OTHER';
  const sorted = races.map(normalizeRace).sort();
  if (sorted.join(',') === 'protoss,protoss,protoss') return 'PPP';
  if (sorted.join(',') === 'protoss,protoss,terran') return 'PPT';
  if (sorted.join(',') === 'protoss,protoss,zerg') return 'PPZ';
  if (sorted.join(',') === 'protoss,terran,zerg') return 'PZT';
  return 'OTHER';
}

function emptyComboStats() {
  return {
    PPP: { wins: 0, losses: 0 },
    PPT: { wins: 0, losses: 0 },
    PPZ: { wins: 0, losses: 0 },
    PZT: { wins: 0, losses: 0 },
    OTHER: { wins: 0, losses: 0 },
  };
}

function ensurePlayer(state, id) {
  if (!state[id]) {
    state[id] = {
      ladder_mmr: 1500,
      team_mmr: 0,
      wins: 0,
      losses: 0,
      recent_total_delta: null,
      race_combo_stats: emptyComboStats(),
    };
  }
  return state[id];
}

async function main() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query('begin');

    const profileRows = await client.query(`
      select id, by_id, race
      from public.profiles
      where by_id like 'By_Tester%'
         or id = any($1::uuid[])
    `, [[REAL.A, REAL.B, REAL.C]]);
    const byIdMap = Object.fromEntries(profileRows.rows.map((r) => [r.id, r.by_id]));
    const raceById = Object.fromEntries(profileRows.rows.map((r) => [r.id, r.race || 'Protoss']));

    const extraTesterIds = Array.from({ length: 21 }, (_, idx) => testerId(idx + 6));
    const extraMatches = buildExtraMatches(extraTesterIds, raceById);
    const allMatches = [...MATCHES, ...extraMatches];

    await client.query(`delete from public.match_sets where match_id::text like 'dd0000%'`);
    await client.query(`delete from public.match_sets where match_id::text like 'de1000%'`);
    await client.query(`delete from public.ladder_matches where id::text like 'dd0000%'`);
    await client.query(`delete from public.ladder_matches where id::text like 'de1000%'`);

    const participants = [...new Set(allMatches.flatMap((m) => [...m.ta, ...m.tb]))];

    await client.query(`
      update public.profiles
      set ladder_mmr = 1500,
          team_mmr = 0,
          total_mmr = 1500,
          wins = 0,
          losses = 0,
          recent_total_delta = null,
          race_combo_stats = null
      where id = any($1::uuid[])
    `, [participants]);

    const statsByPlayer = {};

    for (const [matchIndex, m] of allMatches.entries()) {
      const createdAt = buildMatchTimestamp(matchIndex);
      await client.query(`
        insert into public.ladder_matches (
          id, host_id, status, match_type,
          team_a_ids, team_b_ids,
          team_a_races, team_b_races,
          winning_team, map_name,
          score_a, score_b,
          created_at, finalized_at,
          is_test_data, is_test_data_active,
          team_mmr_applied, created_by
        ) values (
          $1, $2, '완료', $3,
          $4, $5,
          $6, $7,
          $8, $9,
          $10, $11,
          $12, $12,
          true, true,
          true, $2
        )
      `, [
        m.id, m.host, m.type,
        m.ta, m.tb,
        m.ta_races, m.tb_races,
        m.winner, m.map,
        m.sa, m.sb,
        createdAt,
      ]);

      const sets = buildSets(m.id, m.sa, m.sb);

      for (const s of sets) {
        const teamAEntry = pickThree(m.ta, m.ta_races, s.num).map((p) => ({
          id: p.id,
          by_id: byIdMap[p.id] || null,
          race: p.race,
        }));
        const teamBEntry = pickThree(m.tb, m.tb_races, s.num).map((p) => ({
          id: p.id,
          by_id: byIdMap[p.id] || null,
          race: p.race,
        }));
        const raceCards = teamAEntry.map((p) => p.race);
        const comboCode = getComboCode(raceCards);

        await client.query(`
          insert into public.match_sets (
            id, match_id, set_number, race_type,
            team_a_entry, team_b_entry,
            winner_team, status, created_at,
            team_a_ready, team_b_ready,
            race_cards, combo_code, set_mmr_applied, started_at
          ) values (
            $1, $2, $3, $4,
            $5::jsonb, $6::jsonb,
            $7, '완료', $8,
            true, true,
            $9, $10, true, $8
          )
        `, [
          s.id, m.id, s.num, m.type,
          JSON.stringify(teamAEntry), JSON.stringify(teamBEntry),
          s.winner, createdAt,
          raceCards, comboCode,
        ]);

        const setWinners = s.winner === 'A' ? m.ta : m.tb;
        const setLosers = s.winner === 'A' ? m.tb : m.ta;

        setWinners.forEach((pid) => {
          ensurePlayer(statsByPlayer, pid).ladder_mmr += 10;
        });
        setLosers.forEach((pid) => {
          ensurePlayer(statsByPlayer, pid).ladder_mmr -= 10;
        });

        const entryWinners = s.winner === 'A' ? teamAEntry : teamBEntry;
        const entryLosers = s.winner === 'A' ? teamBEntry : teamAEntry;
        entryWinners.forEach((p) => {
          const row = ensurePlayer(statsByPlayer, p.id);
          row.race_combo_stats[comboCode].wins += 1;
        });
        entryLosers.forEach((p) => {
          const row = ensurePlayer(statsByPlayer, p.id);
          row.race_combo_stats[comboCode].losses += 1;
        });
      }

      const matchWinners = m.winner === 'A' ? m.ta : m.tb;
      const matchLosers = m.winner === 'A' ? m.tb : m.ta;
      const winSets = m.winner === 'A' ? m.sa : m.sb;
      const loseSets = m.winner === 'A' ? m.sb : m.sa;
      const delta = ((winSets - loseSets) * 10) + 10;

      matchWinners.forEach((pid) => {
        const row = ensurePlayer(statsByPlayer, pid);
        row.team_mmr += 10;
        row.wins += 1;
        row.recent_total_delta = delta;
      });
      matchLosers.forEach((pid) => {
        const row = ensurePlayer(statsByPlayer, pid);
        row.team_mmr -= 10;
        row.losses += 1;
        row.recent_total_delta = -delta;
      });
    }

    for (const playerId of participants) {
      const row = ensurePlayer(statsByPlayer, playerId);
      const total = row.ladder_mmr + row.team_mmr;
      await client.query(`
        update public.profiles
        set ladder_mmr = $2,
            team_mmr = $3,
            total_mmr = $4,
            wins = $5,
            losses = $6,
            recent_total_delta = $7,
            race_combo_stats = $8::jsonb
        where id = $1::uuid
      `, [
        playerId,
        row.ladder_mmr,
        row.team_mmr,
        total,
        row.wins,
        row.losses,
        row.recent_total_delta,
        JSON.stringify(row.race_combo_stats),
      ]);
    }

    // 요청된 레더 곡선(3000~500)으로 총점 재배치
    const visibleRows = await client.query(`
      select id
      from public.profiles
      where role not in ('visitor', 'applicant', 'expelled')
      order by created_at asc
    `);

    const visibleIds = visibleRows.rows.map((r) => r.id);
    const ranked = [...visibleIds].sort((a, b) => {
      const pa = ensurePlayer(statsByPlayer, a);
      const pb = ensurePlayer(statsByPlayer, b);
      const scoreA = (pa.wins * 3 - pa.losses) + pa.ladder_mmr + pa.team_mmr;
      const scoreB = (pb.wins * 3 - pb.losses) + pb.ladder_mmr + pb.team_mmr;
      return scoreB - scoreA;
    });

    const top = 3000;
    const bottom = 500;
    const span = Math.max(1, ranked.length - 1);

    for (let i = 0; i < ranked.length; i += 1) {
      const id = ranked[i];
      const p = ensurePlayer(statsByPlayer, id);
      const targetTotal = Math.round(top - ((top - bottom) * i) / span);
      const adjustedLadder = targetTotal - p.team_mmr;
      await client.query(`
        update public.profiles
        set total_mmr = $2,
            ladder_mmr = $3
        where id = $1::uuid
      `, [id, targetTotal, adjustedLadder]);
    }

    await client.query(`truncate table public.ladders restart identity`);
    await client.query(`
      insert into public.ladders (
        rank, user_id, nickname, ladder_mmr, race, win, lose, win_rate, is_test_data, is_test_data_active
      )
      select
        row_number() over (order by coalesce(total_mmr, 1500) desc, created_at asc) as rank,
        id,
        by_id,
        coalesce(total_mmr, 1500),
        race,
        coalesce(wins, 0),
        coalesce(losses, 0),
        case
          when coalesce(wins, 0) + coalesce(losses, 0) = 0 then '0%'
          else concat(round((coalesce(wins, 0)::numeric / (coalesce(wins, 0) + coalesce(losses, 0))::numeric) * 100), '%')
        end,
        coalesce(is_test_account, false),
        coalesce(is_test_account_active, true)
      from public.profiles
      where role not in ('visitor', 'applicant', 'expelled')
    `);

    await client.query('commit');

    const sample = await client.query(`
      select by_id, ladder_mmr, team_mmr, total_mmr, wins, losses, recent_total_delta, race_combo_stats
      from public.profiles
      where by_id like 'By_Tester%'
      order by by_id
      limit 15
    `);
    console.dir(sample.rows, { depth: 6 });

    const dist = await client.query(`
      select max(total_mmr) as max_total_mmr, min(total_mmr) as min_total_mmr
      from public.profiles
      where role not in ('visitor', 'applicant', 'expelled')
    `);
    console.log('MMR curve:', dist.rows[0]);

    const cnt = await client.query(`
      select count(*)::int as matches
      from public.ladder_matches
      where id::text like 'dd0000%'
         or id::text like 'de1000%'
    `);
    console.log('Generated matches:', cnt.rows[0].matches);

    console.log('\n✅ 경기 이력/랭킹 통계 재생성 완료');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('❌', e.stack || e.message);
  process.exit(1);
});
