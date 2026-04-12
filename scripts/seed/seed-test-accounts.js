/**
 * scripts/seed/seed-test-accounts.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 로그인 가능한 테스트 계정 30개 생성 + 3v3/4v4 경기 기록 + 샘플 데이터 시딩
 *
 * 테스트 계정 정보 (아이디/비밀번호 로그인):
 *   tester01 ~ tester30
 *   비밀번호: Byclan01! ~ Byclan30!
 *
 * 내부 Auth 이메일은 자동으로 <아이디>@auth.byclan.local 형식으로 생성됩니다.
 *
 * 실행: node scripts/seed/seed-test-accounts.js
 * 초기화: node scripts/seed/seed-test-accounts.js --reset
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';
const { Client } = require('pg');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');

const DB_URL = process.env.DB_URL ||
  'postgresql://postgres.mmsmedvdwmisewngmuka:byclanblacktiger01!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

const IS_RESET = process.argv.includes('--reset');

function buildAuthEmail(loginId) {
  return `${loginId}@auth.byclan.local`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function buildTesterUuid(n) {
  const suffix = String(n).padStart(12, '0');
  return `cc0000${pad2(n)}-0000-4000-8000-${suffix}`;
}

// ── 실제 유저 UUID ─────────────────────────────────────────────────────────────
const REAL = {
  A: '057c4bc1-8067-406b-ad40-efe6125a3d1f', // By_Developer  (developer)
  B: '6d0aa755-a291-4780-a0f8-04e15f2c3aca', // By_gkfla      (member)
  C: '04aa3e91-5d67-4dc8-afc1-b313a9d4995c', // By_Master     (master)
};

// ── 테스트 계정 정의 (총 30명) ───────────────────────────────────────────────
// 조건:
// - developer/master 제외
// - 모든 직급 2명 이상
// - 일반 길드원(member) 다수
// - 래더 가능 직급(admin/elite/member/rookie) 최소 14명 이상
const ROLE_BLUEPRINT = [
  { role: 'admin', count: 2, mmr: 1450, point: 2600, intro: '테스트 관리자 계정입니다.' },
  { role: 'elite', count: 4, mmr: 1350, point: 2200, intro: '테스트 정예 계정입니다.' },
  { role: 'member', count: 16, mmr: 1250, point: 2000, intro: '테스트 일반 길드원 계정입니다.' },
  { role: 'rookie', count: 4, mmr: 1120, point: 1500, intro: '테스트 루키 계정입니다.' },
  { role: 'applicant', count: 2, mmr: 1000, point: 1000, intro: '테스트 가입 신청자 계정입니다.' },
  { role: 'visitor', count: 2, mmr: 1000, point: 1000, intro: '테스트 방문자 계정입니다.' },
];

const RACES = ['Terran', 'Zerg', 'Protoss'];

function buildTesters() {
  const testers = [];
  let idx = 1;

  for (const spec of ROLE_BLUEPRINT) {
    for (let i = 0; i < spec.count; i += 1) {
      const no = pad2(idx);
      testers.push({
        id: buildTesterUuid(idx),
        login_id: `tester${no}`,
        password: `Byclan${no}!`,
        discord: `tester${no}`,
        by_id: `By_Tester${no}`,
        role: spec.role,
        race: RACES[(idx - 1) % RACES.length],
        mmr: spec.mmr,
        wins: 0,
        losses: 0,
        clan_point: spec.point,
        intro: spec.intro,
      });
      idx += 1;
    }
  }

  return testers;
}

const TESTERS = buildTesters();

function validateTesterComposition(testers) {
  if (testers.length !== 30) {
    throw new Error(`테스트 계정 수가 30명이 아닙니다. 현재: ${testers.length}`);
  }

  const disallowed = testers.filter(t => ['developer', 'master'].includes(t.role));
  if (disallowed.length > 0) {
    throw new Error('developer/master 직급이 포함되어 있습니다.');
  }

  const roleCounts = testers.reduce((acc, t) => {
    acc[t.role] = (acc[t.role] || 0) + 1;
    return acc;
  }, {});

  const requiredRoles = ['admin', 'elite', 'member', 'rookie', 'applicant', 'visitor'];
  for (const role of requiredRoles) {
    if ((roleCounts[role] || 0) < 2) {
      throw new Error(`${role} 직급이 2명 미만입니다.`);
    }
  }

  const ladderEligibleRoles = new Set(['admin', 'elite', 'member', 'rookie']);
  const eligibleCount = testers.filter(t => ladderEligibleRoles.has(t.role)).length;
  if (eligibleCount < 14) {
    throw new Error(`래더 매칭 가능 인원이 14명 미만입니다. 현재: ${eligibleCount}`);
  }

  if ((roleCounts.member || 0) <= 10) {
    throw new Error('일반 길드원(member) 비중이 충분하지 않습니다.');
  }
}

validateTesterComposition(TESTERS);

// ── 단축 ID 참조 (이후 경기 구성에서 사용) ────────────────────────────────────
const A = REAL.A;   // By_Developer
const B = REAL.B;   // By_gkfla
const C = REAL.C;   // By_Master
const T1 = TESTERS[0].id;  // By_Tester01
const T2 = TESTERS[1].id;  // By_Tester02
const T3 = TESTERS[2].id;  // By_Tester03
const T4 = TESTERS[3].id;  // By_Tester04
const T5 = TESTERS[4].id;  // By_Tester05

// ── 3v3 / 4v4 경기 목록 (12경기) ──────────────────────────────────────────────
// winner: 'A' or 'B'  → winning_team
// sa/sb: score_a, score_b (best-of 세트 수)
const MAPS = ['블리자드 밸리', '알트지 스테이션', '데스티네이션', '카트리나의 눈물',
              '피아식물원', '블루 스톰', '임피리얼 베이', '폴링 스카이',
              '협곡', '나나스', '에코', '네오 문글로우'];

const MATCHES = [
  // ── 3v3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'dd000001-0000-4000-8000-000000000001',
    type: '3v3', host: A,
    ta: [A, B, C],        tb: [T1, T2, T3],
    ta_races: ['Protoss','Protoss','Protoss'], tb_races: ['Terran','Zerg','Protoss'],
    winner: 'A', sa: 3, sb: 1, days: 55, map: MAPS[0],
  },
  {
    id: 'dd000002-0000-4000-8000-000000000002',
    type: '3v3', host: T1,
    ta: [T1, T2, T3],     tb: [A, B, C],
    ta_races: ['Terran','Zerg','Protoss'], tb_races: ['Protoss','Protoss','Protoss'],
    winner: 'B', sa: 1, sb: 3, days: 50, map: MAPS[1],
  },
  {
    id: 'dd000003-0000-4000-8000-000000000003',
    type: '3v3', host: A,
    ta: [A, T1, T4],      tb: [B, C, T2],
    ta_races: ['Protoss','Terran','Terran'], tb_races: ['Protoss','Protoss','Zerg'],
    winner: 'A', sa: 3, sb: 2, days: 45, map: MAPS[2],
  },
  {
    id: 'dd000004-0000-4000-8000-000000000004',
    type: '3v3', host: C,
    ta: [C, T2, T5],      tb: [A, T3, T4],
    ta_races: ['Protoss','Zerg','Zerg'], tb_races: ['Protoss','Protoss','Terran'],
    winner: 'B', sa: 0, sb: 3, days: 40, map: MAPS[3],
  },
  {
    id: 'dd000005-0000-4000-8000-000000000005',
    type: '3v3', host: B,
    ta: [B, T1, T3],      tb: [C, T2, T5],
    ta_races: ['Protoss','Terran','Protoss'], tb_races: ['Protoss','Zerg','Zerg'],
    winner: 'A', sa: 3, sb: 2, days: 35, map: MAPS[4],
  },
  {
    id: 'dd000006-0000-4000-8000-000000000006',
    type: '3v3', host: T2,
    ta: [T2, T4, T5],     tb: [A, B, T3],
    ta_races: ['Zerg','Terran','Zerg'], tb_races: ['Protoss','Protoss','Protoss'],
    winner: 'B', sa: 1, sb: 3, days: 30, map: MAPS[5],
  },
  {
    id: 'dd000007-0000-4000-8000-000000000007',
    type: '3v3', host: A,
    ta: [A, C, T5],       tb: [B, T1, T4],
    ta_races: ['Protoss','Protoss','Zerg'], tb_races: ['Protoss','Terran','Terran'],
    winner: 'A', sa: 3, sb: 1, days: 25, map: MAPS[6],
  },
  {
    id: 'dd000008-0000-4000-8000-000000000008',
    type: '3v3', host: C,
    ta: [C, T1, T2],      tb: [A, B, T3],
    ta_races: ['Protoss','Terran','Zerg'], tb_races: ['Protoss','Protoss','Protoss'],
    winner: 'B', sa: 2, sb: 3, days: 20, map: MAPS[7],
  },
  // ── 4v4 ─────────────────────────────────────────────────────────────────────
  {
    id: 'dd000009-0000-4000-8000-000000000009',
    type: '4v4', host: A,
    ta: [A, B, C, T1],    tb: [T2, T3, T4, T5],
    ta_races: ['Protoss','Protoss','Protoss','Terran'], tb_races: ['Zerg','Protoss','Terran','Zerg'],
    winner: 'A', sa: 3, sb: 0, days: 52, map: MAPS[8],
  },
  {
    id: 'dd000010-0000-4000-8000-000000000010',
    type: '4v4', host: T1,
    ta: [T1, T2, T3, T4], tb: [A, B, C, T5],
    ta_races: ['Terran','Zerg','Protoss','Terran'], tb_races: ['Protoss','Protoss','Protoss','Zerg'],
    winner: 'B', sa: 1, sb: 3, days: 43, map: MAPS[9],
  },
  {
    id: 'dd000011-0000-4000-8000-000000000011',
    type: '4v4', host: A,
    ta: [A, C, T2, T4],   tb: [B, T1, T3, T5],
    ta_races: ['Protoss','Protoss','Zerg','Terran'], tb_races: ['Protoss','Terran','Protoss','Zerg'],
    winner: 'A', sa: 3, sb: 2, days: 33, map: MAPS[10],
  },
  {
    id: 'dd000012-0000-4000-8000-000000000012',
    type: '4v4', host: B,
    ta: [B, T1, T3, T5],  tb: [A, C, T2, T4],
    ta_races: ['Protoss','Terran','Protoss','Zerg'], tb_races: ['Protoss','Protoss','Zerg','Terran'],
    winner: 'B', sa: 2, sb: 3, days: 15, map: MAPS[11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** 경기 세트 배열 생성 (총 세트 = sa+sb, 최종 승자 쪽이 마지막 세트 승리) */
function buildSets(matchId, sa, sb) {
  const total = sa + sb;
  const sets = [];
  const aWins = sa;
  const bWins = sb;
  const finalWinner = sa > sb ? 'A' : 'B';
  let curA = 0, curB = 0;

  for (let i = 1; i <= total; i++) {
    const remaining = total - i;
    const isLast = i === total;
    let winner;
    if (isLast) {
      winner = finalWinner;
    } else {
      const aNeeds = aWins - curA;
      const bNeeds = bWins - curB;
      // 최종 승자의 세트를 고르게 분배
      if (aNeeds > bNeeds) winner = 'A';
      else if (bNeeds > aNeeds) winner = 'B';
      else winner = i % 2 === 0 ? 'B' : 'A';
    }
    if (winner === 'A') curA++; else curB++;

    const setId = `${matchId.slice(0, 8)}-${String(i).padStart(4,'0')}-4000-8000-${matchId.slice(-12)}`;
    sets.push({ id: setId, num: i, winner });
  }
  return sets;
}

/** 경기 결과로 각 플레이어의 win/loss 집계 → Map<playerId, {win,loss}> */
function calcWinLoss(matches) {
  const stat = new Map();
  const add = (id, won) => {
    if (!stat.has(id)) stat.set(id, { win: 0, loss: 0 });
    const s = stat.get(id);
    if (won) s.win++; else s.loss++;
  };
  for (const m of matches) {
    const taWon = m.winner === 'A';
    m.ta.forEach(id => add(id, taWon));
    m.tb.forEach(id => add(id, !taWon));
  }
  return stat;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ DB 연결 성공\n');

  const TESTER_IDS = TESTERS.map(t => t.id);

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // --reset 플래그: 기존 테스트 계정 + 시딩 데이터 전체 초기화
    // ══════════════════════════════════════════════════════════════════════════
    if (IS_RESET) {
      console.log('🗑️  RESET — 기존 테스트 데이터 삭제 중...');
      await client.query(`DELETE FROM public.match_bets     WHERE user_id = ANY($1::uuid[])`, [TESTER_IDS]);
      await client.query(`DELETE FROM public.match_sets     WHERE match_id::text LIKE 'dd0000%'`);
      await client.query(`DELETE FROM public.ladder_matches WHERE id::text LIKE 'dd0000%'`);
      await client.query(`DELETE FROM public.posts          WHERE user_id = ANY($1::uuid[]) OR is_test_data = true`, [TESTER_IDS]);
      await client.query(`DELETE FROM public.notifications  WHERE user_id = ANY($1::uuid[])`, [TESTER_IDS]);
      await client.query(`DELETE FROM public.point_logs     WHERE user_id = ANY($1::uuid[])`, [TESTER_IDS]);
      await client.query(`DELETE FROM public.applications   WHERE user_id = ANY($1::uuid[])`, [TESTER_IDS]);
      await client.query(`DELETE FROM public.ladders        WHERE user_id  = ANY($1::uuid[])`, [TESTER_IDS]);
      await client.query(`DELETE FROM public.profiles       WHERE id = ANY($1::uuid[])`, [TESTER_IDS]);
      await client.query(`DELETE FROM auth.identities       WHERE user_id = ANY($1::uuid[])`, [TESTER_IDS]);
      await client.query(`DELETE FROM auth.users            WHERE id = ANY($1::uuid[])`, [TESTER_IDS]);
      console.log('  ✓ 초기화 완료\n');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1 : auth.users + auth.identities 생성 (이메일/비밀번호 로그인)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('👤 PHASE 1 — 테스트 계정 (auth) 생성');

    for (const t of TESTERS) {
      const hash = await bcrypt.hash(t.password, 10);
      const now  = new Date().toISOString();
      const authEmail = buildAuthEmail(t.login_id);
      const metaJson = JSON.stringify({ discord_name: t.discord }).replace(/'/g, "''");
      const identityJson = JSON.stringify({
        sub: t.id, email: authEmail, email_verified: true,
      }).replace(/'/g, "''");
      const identityId = crypto.randomUUID();
      const hashEsc = hash.replace(/'/g, "''");

      // auth.users — 리터럴 SQL (타입 추론 오류 우회)
      await client.query(`
        INSERT INTO auth.users (
          id, instance_id, aud, role, email,
          encrypted_password,
          email_confirmed_at, confirmation_token,
          recovery_token, email_change_token_new, email_change, phone_change,
          phone_change_token, email_change_token_current,
          reauthentication_token,
          raw_app_meta_data, raw_user_meta_data,
          is_super_admin, is_sso_user, is_anonymous,
          email_change_confirm_status,
          created_at, updated_at
        ) VALUES (
          '${t.id}'::uuid, '00000000-0000-0000-0000-000000000000'::uuid,
          'authenticated', 'authenticated', '${authEmail}',
          '${hashEsc}',
          '${now}'::timestamptz, '',
          '', '', '', '',
          '', '',
          '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          '${metaJson}'::jsonb,
          false, false, false,
          0,
          '${now}'::timestamptz, '${now}'::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
          SET encrypted_password = EXCLUDED.encrypted_password,
              updated_at = NOW()
      `);

      // auth.identities
      await client.query(`
        INSERT INTO auth.identities (
          id, provider_id, user_id,
          identity_data, provider,
          last_sign_in_at, created_at, updated_at
        ) VALUES (
          '${identityId}'::uuid, '${authEmail}', '${t.id}'::uuid,
          '${identityJson}'::jsonb, 'email',
          '${now}'::timestamptz, '${now}'::timestamptz, '${now}'::timestamptz
        )
        ON CONFLICT (provider, provider_id) DO NOTHING
      `);

      console.log(`  ✓ ${t.login_id}  (${t.by_id} / ${t.role})`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 2 : public.profiles 생성
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n🪪 PHASE 2 — profiles 생성');

    for (const t of TESTERS) {
      await client.query(`
        INSERT INTO public.profiles (
          id, discord_id, by_id, role, race,
          wins, losses, ladder_mmr, clan_point,
          intro, is_test_account, is_test_account_active,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, true, true,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE
          SET by_id = EXCLUDED.by_id,
              role  = EXCLUDED.role,
              race  = EXCLUDED.race,
              wins  = EXCLUDED.wins,
              losses= EXCLUDED.losses,
              ladder_mmr = EXCLUDED.ladder_mmr,
              clan_point = EXCLUDED.clan_point,
              intro = EXCLUDED.intro
      `, [t.id, t.discord, t.by_id, t.role, t.race,
          t.wins, t.losses, t.mmr, t.clan_point, t.intro]);
    }
    console.log(`  ✓ ${TESTERS.length}개 프로필 생성`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 3 : 3v3 / 4v4 경기 기록 (12경기)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n🎮 PHASE 3 — 3v3 / 4v4 경기 기록 등록');

    for (const m of MATCHES) {
      const createdAt = daysAgo(m.days);
      await client.query(`
        INSERT INTO public.ladder_matches (
          id, host_id, status, match_type,
          team_a_ids, team_b_ids,
          team_a_races, team_b_races,
          winning_team, map_name,
          score_a, score_b,
          created_at, is_test_data
        ) VALUES (
          $1,$2,'완료',$3,
          $4,$5,
          $6,$7,
          $8,$9,
          $10,$11,
          $12, true
        )
        ON CONFLICT (id) DO NOTHING
      `, [
        m.id, m.host, m.type,
        m.ta, m.tb,
        m.ta_races, m.tb_races,
        m.winner, m.map,
        m.sa, m.sb,
        createdAt,
      ]);

      // match_sets
      const sets = buildSets(m.id, m.sa, m.sb);
      for (const s of sets) {
        await client.query(`
          INSERT INTO public.match_sets (
            id, match_id, set_number, race_type,
            team_a_entry, team_b_entry,
            winner_team, status, created_at,
            team_a_ready, team_b_ready
          ) VALUES (
            $1,$2,$3,$4,
            $5::jsonb,$6::jsonb,
            $7,'완료',$8,
            true, true
          )
          ON CONFLICT (id) DO NOTHING
        `, [
          s.id, m.id, s.num, m.type,
          JSON.stringify({ players: m.ta, races: m.ta_races }),
          JSON.stringify({ players: m.tb, races: m.tb_races }),
          s.winner, daysAgo(m.days),
        ]);
      }

      const sets3 = buildSets(m.id, m.sa, m.sb);
      const totalSets = sets3.length;
      console.log(`  ✓ [${m.type}] ${m.ta.length}명 vs ${m.tb.length}명  |  winner: Team ${m.winner}  |  sets: ${totalSets}  |  ${m.days}일 전`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 4 : 프로필 승/패 갱신 (경기 결과 집계)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n📊 PHASE 4 — 프로필 승/패 갱신');

    const stat = calcWinLoss(MATCHES);

    for (const [userId, s] of stat.entries()) {
      const profile = await client.query('SELECT wins, losses FROM public.profiles WHERE id=$1', [userId]);
      if (profile.rows.length === 0) continue;
      const prev = profile.rows[0];
      const newWins   = (prev.wins   || 0) + s.win;
      const newLosses = (prev.losses || 0) + s.loss;
      const newMmr    = await computeMmr(client, userId, s.win, s.loss);
      await client.query(`
        UPDATE public.profiles
        SET wins = $1, losses = $2, ladder_mmr = $3
        WHERE id = $4
      `, [newWins, newLosses, newMmr, userId]);
    }
    console.log(`  ✓ ${stat.size}명 승/패/MMR 갱신`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 5 : 래더 랭킹 (전체 8인 반영)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n🏆 PHASE 5 — 래더 랭킹 갱신');
    // 기존 실제유저 래더 항목 삭제 후 재삽입 (통합 랭킹)
    await client.query(`DELETE FROM public.ladders WHERE user_id = ANY($1::uuid[])`, [[A, B, C]]);
    await client.query(`DELETE FROM public.ladders WHERE user_id = ANY($1::uuid[])`, [TESTER_IDS]);

    const allProfiles = await client.query(`
      SELECT id, by_id, ladder_mmr, race, wins, losses
      FROM public.profiles
      WHERE id = ANY($1::uuid[])
      ORDER BY ladder_mmr DESC
    `, [[A, B, C, ...TESTER_IDS]]);

    for (let i = 0; i < allProfiles.rows.length; i++) {
      const p = allProfiles.rows[i];
      const w = p.wins || 0;
      const l = p.losses || 0;
      const wr = w + l > 0 ? Math.round((w / (w + l)) * 100) + '%' : '0%';
      await client.query(`
        INSERT INTO public.ladders
          (user_id, nickname, ladder_mmr, race, win, lose, win_rate, rank, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
      `, [p.id, p.by_id, p.ladder_mmr, p.race, w, l, wr, i + 1]);
    }
    console.log(`  ✓ ${allProfiles.rows.length}명 래더 랭킹 등록`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 6 : 테스트 계정 가입 신청 내역 (합격)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n📋 PHASE 6 — 가입 신청 내역');
    const raceTiers = {
      Terran: '다이아', Zerg: '플래티넘', Protoss: '다이아',
    };
    for (const t of TESTERS) {
      await client.query(`
        INSERT INTO public.applications
          (user_id, discord_name, btag, race, tier, intro, status, created_at, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,'합격',$7,true)
        ON CONFLICT DO NOTHING
      `, [
        t.id, t.discord, `${t.discord}#${1000 + TESTERS.indexOf(t)}`,
        t.race, raceTiers[t.race] || '다이아',
        t.intro,
        daysAgo(80 - TESTERS.indexOf(t) * 5),
      ]);
    }
    console.log(`  ✓ ${TESTERS.length}건 가입 신청 등록`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 7 : 알림 (테스트 계정용)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n🔔 PHASE 7 — 알림 등록');
    const notifItems = [];
    for (const t of TESTERS) {
      notifItems.push({
        user_id: t.id,
        title: '🎉 가입 합격!',
        message: `ByClan에 오신 것을 환영합니다! ${t.by_id}님의 가입이 처리되었습니다.`,
        is_read: false, days: 79 - TESTERS.indexOf(t) * 5, link_to: '/profile',
      });
      notifItems.push({
        user_id: t.id,
        title: '⚔️ 첫 경기 참여 완료',
        message: '클랜 내전에 처음 참여하셨습니다. 경기 기록이 등록되었습니다.',
        is_read: false, days: 52, link_to: '/ladder',
      });
    }
    for (const n of notifItems) {
      await client.query(`
        INSERT INTO public.notifications
          (user_id, title, message, is_read, created_at, link_to, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,true)
      `, [n.user_id, n.title, n.message, n.is_read, daysAgo(n.days), n.link_to]);
    }
    console.log(`  ✓ ${notifItems.length}건 알림 등록`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 8 : 포인트 로그
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n💰 PHASE 8 — 포인트 로그');
    const pointItems = [];
    for (const t of TESTERS) {
      const s = stat.get(t.id) || { win: 0, loss: 0 };
      pointItems.push({ user_id: t.id, amount: 1000, reason: '신규 가입 보너스', days: 80 });
      for (let w = 0; w < s.win;  w++) pointItems.push({ user_id: t.id, amount:  150, reason: `경기 승리 보상 (#${w+1})`, days: 50 - w * 3 });
      for (let l = 0; l < s.loss; l++) pointItems.push({ user_id: t.id, amount:  -50, reason: `경기 패배 차감 (#${l+1})`, days: 45 - l * 3 });
    }
    for (const pl of pointItems) {
      await client.query(`
        INSERT INTO public.point_logs (user_id, amount, reason, created_at)
        VALUES ($1,$2,$3,$4)
      `, [pl.user_id, pl.amount, pl.reason, daysAgo(pl.days)]);
    }
    console.log(`  ✓ ${pointItems.length}건 포인트 로그`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 9 : 커뮤니티 게시글 (테스트 계정용)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n📝 PHASE 9 — 게시글 등록');
    const testPosts = [
      { user_id: T1, author: 'By_Tester01', category: '자유',  title: '테스트 계정으로 가입했습니다!', content: '클랜 활동을 테스트해보고 있습니다. 잘 부탁드려요!', days: 78, views: 12 },
      { user_id: T1, author: 'By_Tester01', category: '전략',  title: '테란 멀티 컨트롤 팁', content: '테란으로 멀티를 효율적으로 가져가는 팁을 공유합니다.', days: 60, views: 34 },
      { user_id: T2, author: 'By_Tester02', category: 'Q&A',   title: '저그 히드라 타이밍 질문', content: '히드라 러쉬 타이밍이 항상 너무 늦거나 이른 것 같습니다. 조언 부탁드립니다.', days: 72, views: 21 },
      { user_id: T2, author: 'By_Tester02', category: '경기리뷰', title: '첫 3v3 경기 후기', content: '실제 유저들과 처음으로 3v3 경기를 해봤습니다. 팀플레이가 생각보다 어렵네요.', days: 54, views: 45 },
      { user_id: T3, author: 'By_Tester03', category: '전략',  title: '프로토스 4v4 후반 전략', content: '4v4에서 프로토스가 후반에 캐리어 테크로 가는 전략을 써봤는데 효과가 좋았습니다.', days: 65, views: 67 },
      { user_id: T3, author: 'By_Tester03', category: '자유',  title: '클랜 내전 재미있습니다!', content: '여러 명이 함께 팀플레이를 하는 경험이 정말 즐겁습니다.', days: 44, views: 18 },
      { user_id: T4, author: 'By_Tester04', category: '자유',  title: '오늘 4v4 패배 아쉬웠습니다', content: '오늘 4v4 경기에서 초반 러쉬에 무너졌습니다. 다음엔 꼭!', days: 42, views: 9 },
      { user_id: T4, author: 'By_Tester04', category: 'Q&A',   title: '팀플에서 포지션 어떻게 나누나요?', content: '3v3, 4v4에서 각 종족 포지션을 어떻게 나누는 게 효율적인지 궁금합니다.', days: 30, views: 53 },
      { user_id: T5, author: 'By_Tester05', category: '자유',  title: '루키지만 열심히 하겠습니다!', content: '아직 실력이 부족하지만 클랜원들에게 배우면서 성장하겠습니다.', days: 75, views: 7 },
      { user_id: T5, author: 'By_Tester05', category: '경기리뷰', title: '3v3 참전 후기 - 저그 스포어 올리기 깜빡', content: '어이없는 실수로 게임을 졌습니다. 기초가 더 중요하다는 것을 깨달았습니다.', days: 48, views: 31 },
    ];
    for (const p of testPosts) {
      await client.query(`
        INSERT INTO public.posts
          (user_id, author_name, category, title, content, views, created_at, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,true)
      `, [p.user_id, p.author, p.category, p.title, p.content, p.views, daysAgo(p.days)]);
    }
    console.log(`  ✓ ${testPosts.length}건 게시글`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 10 : 결과 검증
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n🔍 PHASE 10 — 결과 검증');

    const cnt = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM public.profiles) AS profiles,
        (SELECT COUNT(*) FROM auth.users) AS auth_users,
        (SELECT COUNT(*) FROM public.ladder_matches WHERE id::text LIKE 'dd0000%') AS new_matches,
        (SELECT COUNT(*) FROM public.match_sets    WHERE match_id::text LIKE 'dd0000%') AS new_sets,
        (SELECT COUNT(*) FROM public.posts         WHERE is_test_data = true) AS test_posts,
        (SELECT COUNT(*) FROM public.notifications WHERE is_test_data = true) AS test_notifs,
        (SELECT COUNT(*) FROM public.ladders) AS ladder_rows
    `);
    console.log('카운트:', JSON.stringify(cnt.rows[0], null, 2));

    const final = await client.query(`
      SELECT p.by_id, p.role, p.race, p.wins, p.losses, p.ladder_mmr, p.clan_point,
             l.rank AS ladder_rank
      FROM public.profiles p
      LEFT JOIN public.ladders l ON l.user_id = p.id
      ORDER BY p.ladder_mmr DESC
    `);
    console.log('\n전체 멤버 현황:');
    final.rows.forEach(r =>
      console.log(`  ${String(r.ladder_rank||'-').padStart(2)}위  ${(r.by_id||'').padEnd(14)} | ${r.role.padEnd(10)} | ${r.race.padEnd(7)} | ${r.wins}승${r.losses}패 | MMR:${r.ladder_mmr} | 포인트:${r.clan_point}`)
    );

    console.log('\n🔑 테스트 계정 로그인 정보:');
    TESTERS.forEach(t =>
      console.log(`  ${t.login_id.padEnd(12)}  /  ${t.password}  (${t.by_id} / ${t.role})`)
    );
    console.log('\n✅ 모든 작업 완료!\n');

  } finally {
    await client.end();
  }
}

/** MMR 계산: 기존 MMR + 승리당 +50, 패배당 -30 */
async function computeMmr(client, userId, wins, losses) {
  const r = await client.query('SELECT ladder_mmr FROM public.profiles WHERE id=$1', [userId]);
  if (r.rows.length === 0) return 1000;
  const base = r.rows[0].ladder_mmr || 1000;
  return Math.max(800, base + wins * 50 - losses * 30);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
