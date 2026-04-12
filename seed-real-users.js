/**
 * 테스트 계정 삭제 + 실제 유저 3명 데이터 시딩 스크립트
 * 실제 유저: By_Developer(A), By_6d0aa755a2(B), By_Master(C)
 */

const { Client } = require('pg');

const DB_URL = process.env.DB_URL || 'postgresql://postgres.mmsmedvdwmisewngmuka:byclanblacktiger01!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

// ── 실제 유저 UUID ───────────────────────────────────────────────────────────
const A_ID = '057c4bc1-8067-406b-ad40-efe6125a3d1f'; // By_Developer  (developer)
const B_ID = '6d0aa755-a291-4780-a0f8-04e15f2c3aca'; // By_6d0aa755a2 (member)
const C_ID = '04aa3e91-5d67-4dc8-afc1-b313a9d4995c'; // By_Master      (master)

// ── 삭제할 테스트 계정 UUID ──────────────────────────────────────────────────
const TEST_IDS = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
  '99999999-9999-4999-8999-999999999999',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '8388fb36-9dd7-4635-aaad-eb1c36c78059',
  '42e0117b-dba4-4853-bb9b-dd0ca5bd4d37',
  'e8dc072e-fc99-4b76-adee-e3a0d131ffee',
];

// ── 15개 1v1 경기 정의 ────────────────────────────────────────────────────────
// host: 매치 생성자, team_a: [host], team_b: [opponent]
// winner: 'A' or 'B' → team_a 또는 team_b 승리
// score_a, score_b: 세트 수
const MAPS = [
  '블리자드 밸리', '알트지 스테이션', '데스티네이션', '카트리나의 눈물',
  '피아식물원', '블루 스톰', '임피리얼 베이', '폴링 스카이',
  '협곡', '나나스', '에코', '네오 문글로우',
  '사막 폭스', '러쉬 아워', '레퀴엠',
];

/**
 * 경기 UUIDs (결정론적)
 * m01 ~ m15
 */
const MATCH_IDS = Array.from({ length: 15 }, (_, i) =>
  `aa${String(i + 1).padStart(6, '0')}-0000-4000-8000-000000000000`
);

/**
 * 15경기 정의
 * days_ago: 오늘 기준 며칠 전
 * A_vs_B, A_vs_C, B_vs_C 조합
 *
 * 최종 전적:
 *  A (By_Developer)  : 6승 4패 (10경기)
 *  B (By_6d0aa755a2) : 4승 6패 (10경기)
 *  C (By_Master)     : 5승 5패 (10경기)
 */
const MATCHES = [
  // A vs B
  { id: MATCH_IDS[0],  host: A_ID, ta: [A_ID], tb: [B_ID], winner: 'A', sa: 2, sb: 1, days: 60, map: MAPS[0]  },
  { id: MATCH_IDS[3],  host: B_ID, ta: [A_ID], tb: [B_ID], winner: 'B', sa: 0, sb: 2, days: 50, map: MAPS[3]  },
  { id: MATCH_IDS[6],  host: A_ID, ta: [A_ID], tb: [B_ID], winner: 'A', sa: 2, sb: 1, days: 40, map: MAPS[6]  },
  { id: MATCH_IDS[9],  host: A_ID, ta: [A_ID], tb: [B_ID], winner: 'A', sa: 2, sb: 1, days: 30, map: MAPS[9]  },
  { id: MATCH_IDS[12], host: A_ID, ta: [A_ID], tb: [B_ID], winner: 'A', sa: 2, sb: 0, days: 20, map: MAPS[12] },
  // A vs C
  { id: MATCH_IDS[1],  host: A_ID, ta: [A_ID], tb: [C_ID], winner: 'B', sa: 1, sb: 2, days: 57, map: MAPS[1]  },
  { id: MATCH_IDS[4],  host: C_ID, ta: [A_ID], tb: [C_ID], winner: 'A', sa: 2, sb: 0, days: 47, map: MAPS[4]  },
  { id: MATCH_IDS[7],  host: A_ID, ta: [A_ID], tb: [C_ID], winner: 'B', sa: 0, sb: 2, days: 37, map: MAPS[7]  },
  { id: MATCH_IDS[10], host: A_ID, ta: [A_ID], tb: [C_ID], winner: 'A', sa: 2, sb: 1, days: 27, map: MAPS[10] },
  { id: MATCH_IDS[14], host: C_ID, ta: [A_ID], tb: [C_ID], winner: 'B', sa: 1, sb: 2, days: 14, map: MAPS[14] },
  // B vs C
  { id: MATCH_IDS[2],  host: B_ID, ta: [B_ID], tb: [C_ID], winner: 'A', sa: 2, sb: 1, days: 54, map: MAPS[2]  },
  { id: MATCH_IDS[5],  host: C_ID, ta: [B_ID], tb: [C_ID], winner: 'B', sa: 1, sb: 2, days: 44, map: MAPS[5]  },
  { id: MATCH_IDS[8],  host: B_ID, ta: [B_ID], tb: [C_ID], winner: 'A', sa: 2, sb: 0, days: 34, map: MAPS[8]  },
  { id: MATCH_IDS[11], host: C_ID, ta: [B_ID], tb: [C_ID], winner: 'B', sa: 1, sb: 2, days: 24, map: MAPS[11] },
  { id: MATCH_IDS[13], host: B_ID, ta: [B_ID], tb: [C_ID], winner: 'A', sa: 2, sb: 1, days: 17, map: MAPS[13] },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ DB 연결 성공');

  try {
    // ══════════════════════════════════════════════════════════
    // PHASE 1 : 테스트 계정 데이터 전부 삭제
    // ══════════════════════════════════════════════════════════
    console.log('\n📦 PHASE 1 — 테스트 계정 데이터 삭제 시작');

    // 1-1. match_bets (match_id or user_id 기준)
    await client.query(`
      DELETE FROM public.match_bets
      WHERE user_id = ANY($1::uuid[])
         OR match_id IN (
           SELECT id FROM public.ladder_matches WHERE host_id = ANY($1::uuid[])
         )
    `, [TEST_IDS]);
    console.log('  ✓ match_bets 삭제');

    // 1-2. match_sets
    await client.query(`
      DELETE FROM public.match_sets
      WHERE match_id IN (
        SELECT id FROM public.ladder_matches WHERE host_id = ANY($1::uuid[])
      )
      OR match_id IN (
        SELECT id FROM public.ladder_matches
        WHERE team_a_ids && $1::uuid[]
           OR team_b_ids && $1::uuid[]
      )
    `, [TEST_IDS]);
    console.log('  ✓ match_sets 삭제');

    // 1-3. ladder_matches
    await client.query(`
      DELETE FROM public.ladder_matches
      WHERE host_id = ANY($1::uuid[])
         OR team_a_ids && $1::uuid[]
         OR team_b_ids && $1::uuid[]
    `, [TEST_IDS]);
    console.log('  ✓ ladder_matches 삭제');

    // 1-4. posts
    await client.query(`DELETE FROM public.posts WHERE user_id = ANY($1::uuid[])`, [TEST_IDS]);
    console.log('  ✓ posts 삭제');

    // 1-5. admin_posts
    await client.query(`DELETE FROM public.admin_posts WHERE author_id = ANY($1::uuid[])`, [TEST_IDS]);
    console.log('  ✓ admin_posts 삭제');

    // 1-6. notifications
    await client.query(`DELETE FROM public.notifications WHERE user_id = ANY($1::uuid[])`, [TEST_IDS]);
    console.log('  ✓ notifications 삭제');

    // 1-7. point_logs
    await client.query(`DELETE FROM public.point_logs WHERE user_id = ANY($1::uuid[])`, [TEST_IDS]);
    console.log('  ✓ point_logs 삭제');

    // 1-8. applications (user_id, tester_id 모두)
    await client.query(`
      DELETE FROM public.applications
      WHERE user_id = ANY($1::uuid[])
         OR tester_id = ANY($1::uuid[])
    `, [TEST_IDS]);
    console.log('  ✓ applications 삭제');

    // 1-9. ladders (is_test_data 또는 user_id 기준)
    await client.query(`
      DELETE FROM public.ladders
      WHERE is_test_data = true
         OR user_id = ANY($1::uuid[])
    `, [TEST_IDS]);
    console.log('  ✓ ladders 삭제');

    // 1-10. profiles
    await client.query(`DELETE FROM public.profiles WHERE id = ANY($1::uuid[])`, [TEST_IDS]);
    console.log('  ✓ profiles 삭제');

    // 1-11. auth.users (cascade 없으므로 마지막에 삭제)
    await client.query(`DELETE FROM auth.users WHERE id = ANY($1::uuid[])`, [TEST_IDS]);
    console.log('  ✓ auth.users 삭제');

    // ══════════════════════════════════════════════════════════
    // PHASE 2 : 실제 유저 프로필 업데이트 (승패 / MMR 반영)
    // ══════════════════════════════════════════════════════════
    console.log('\n👤 PHASE 2 — 실제 유저 프로필 갱신');

    // by_id도 보기 좋게 정리
    await client.query(`
      UPDATE public.profiles SET
        wins       = 6,
        losses     = 4,
        ladder_mmr = 1350,
        clan_point = 3200,
        intro      = '개발자 계정입니다. 저그전 연습 중입니다.',
        race       = 'Protoss'
      WHERE id = $1
    `, [A_ID]);

    await client.query(`
      UPDATE public.profiles SET
        by_id      = 'By_gkfla',
        wins       = 4,
        losses     = 6,
        ladder_mmr = 1050,
        clan_point = 1800,
        intro      = '클랜 초보입니다. 잘 부탁드립니다!',
        race       = 'Protoss'
      WHERE id = $1
    `, [B_ID]);

    await client.query(`
      UPDATE public.profiles SET
        wins       = 5,
        losses     = 5,
        ladder_mmr = 1200,
        clan_point = 2500,
        intro      = '마스터 계정. 프로토스 유저입니다.',
        race       = 'Protoss'
      WHERE id = $1
    `, [C_ID]);

    console.log('  ✓ 프로필 승/패/MMR 갱신');

    // ══════════════════════════════════════════════════════════
    // PHASE 3 : 경기 기록 등록 (15경기 1v1)
    // ══════════════════════════════════════════════════════════
    console.log('\n🎮 PHASE 3 — 경기 기록 등록');

    for (const m of MATCHES) {
      const createdAt = daysAgo(m.days);

      // ladder_matches 삽입
      await client.query(`
        INSERT INTO public.ladder_matches
          (id, host_id, status, match_type, team_a_ids, team_b_ids,
           team_a_races, team_b_races, winning_team, map_name,
           score_a, score_b, created_at, is_test_data)
        VALUES ($1,$2,'완료','1v1',$3,$4,
                ARRAY['Protoss'], ARRAY['Protoss'],
                $5,$6,$7,$8,$9,false)
        ON CONFLICT (id) DO NOTHING
      `, [
        m.id, m.host,
        m.ta, m.tb,
        m.winner, m.map,
        m.sa, m.sb,
        createdAt,
      ]);

      // match_sets 삽입 (bo3 기준 세트 생성)
      const sets = buildSets(m.id, m.sa, m.sb, m.ta[0], m.tb[0], createdAt);
      for (const s of sets) {
        await client.query(`
          INSERT INTO public.match_sets
            (id, match_id, set_number, race_type,
             team_a_entry, team_b_entry,
             winner_team, status, created_at,
             team_a_ready, team_b_ready)
          VALUES ($1,$2,$3,'1v1',
                  $4::jsonb, $5::jsonb,
                  $6,'완료',$7,true,true)
          ON CONFLICT (id) DO NOTHING
        `, [s.id, m.id, s.num,
            JSON.stringify({ race: 'Protoss', user_id: m.ta[0] }),
            JSON.stringify({ race: 'Protoss', user_id: m.tb[0] }),
            s.winner, createdAt]);
      }
    }
    console.log('  ✓ 15경기 + 세트 기록 등록 완료');

    // ══════════════════════════════════════════════════════════
    // PHASE 4 : 래더 랭킹 등록
    // ══════════════════════════════════════════════════════════
    console.log('\n🏆 PHASE 4 — 래더 랭킹 등록');

    const ladderEntries = [
      { user_id: A_ID, nickname: 'By_Developer', ladder_mmr: 1350, race: 'Protoss', win: 6, lose: 4, rank: 1 },
      { user_id: C_ID, nickname: 'By_Master',    ladder_mmr: 1200, race: 'Protoss', win: 5, lose: 5, rank: 2 },
      { user_id: B_ID, nickname: 'By_gkfla',     ladder_mmr: 1050, race: 'Protoss', win: 4, lose: 6, rank: 3 },
    ];

    for (const le of ladderEntries) {
      const wr = le.win + le.lose > 0
        ? Math.round((le.win / (le.win + le.lose)) * 100) + '%'
        : '0%';
      await client.query(`
        INSERT INTO public.ladders
          (user_id, nickname, ladder_mmr, race, win, lose, win_rate, rank, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
      `, [le.user_id, le.nickname, le.ladder_mmr, le.race, le.win, le.lose, wr, le.rank]);
    }
    console.log('  ✓ 래더 랭킹 3명 등록');

    // ══════════════════════════════════════════════════════════
    // PHASE 5 : 게시판 글 등록 (각 10건 이상)
    // ══════════════════════════════════════════════════════════
    console.log('\n📝 PHASE 5 — 게시판 글 등록');

    const posts = buildPosts();
    for (const p of posts) {
      await client.query(`
        INSERT INTO public.posts
          (user_id, author_name, category, title, content, views, created_at, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,false)
      `, [p.user_id, p.author, p.category, p.title, p.content, p.views, daysAgo(p.days)]);
    }
    console.log(`  ✓ 게시글 ${posts.length}건 등록`);

    // ══════════════════════════════════════════════════════════
    // PHASE 6 : 알림 등록
    // ══════════════════════════════════════════════════════════
    console.log('\n🔔 PHASE 6 — 알림 등록');

    const notifications = buildNotifications();
    for (const n of notifications) {
      await client.query(`
        INSERT INTO public.notifications
          (user_id, title, message, is_read, created_at, link_to, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,false)
      `, [n.user_id, n.title, n.message, n.is_read, daysAgo(n.days), n.link_to]);
    }
    console.log(`  ✓ 알림 ${notifications.length}건 등록`);

    // ══════════════════════════════════════════════════════════
    // PHASE 7 : 포인트 로그 등록
    // ══════════════════════════════════════════════════════════
    console.log('\n💰 PHASE 7 — 포인트 로그 등록');

    const pointLogs = buildPointLogs();
    for (const pl of pointLogs) {
      await client.query(`
        INSERT INTO public.point_logs
          (user_id, amount, reason, created_at)
        VALUES ($1,$2,$3,$4)
      `, [pl.user_id, pl.amount, pl.reason, daysAgo(pl.days)]);
    }
    console.log(`  ✓ 포인트 로그 ${pointLogs.length}건 등록`);

    // ══════════════════════════════════════════════════════════
    // PHASE 8 : 가입 신청 내역 등록 (합격 처리)
    // ══════════════════════════════════════════════════════════
    console.log('\n📋 PHASE 8 — 가입 신청 내역 등록');

    const apps = [
      {
        user_id: A_ID, discord_name: 'halim0720', btag: 'halim0720#1234',
        race: 'Protoss', tier: '다이아', intro: '열정적으로 활동하겠습니다!',
        status: '합격', days: 90,
      },
      {
        user_id: B_ID, discord_name: 'gkfla0720', btag: 'gkfla0720#5678',
        race: 'Protoss', tier: '골드', intro: '클랜에서 열심히 배우고 싶습니다.',
        status: '합격', days: 85,
      },
      {
        user_id: C_ID, discord_name: 'halim0720a', btag: 'halim0720a#9999',
        race: 'Protoss', tier: '마스터', intro: '클랜 운영에 기여하고 싶습니다.',
        status: '합격', days: 95,
      },
    ];
    for (const app of apps) {
      await client.query(`
        INSERT INTO public.applications
          (user_id, discord_name, btag, race, tier, intro, status, created_at, is_test_data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
      `, [app.user_id, app.discord_name, app.btag, app.race, app.tier, app.intro, app.status, daysAgo(app.days)]);
    }
    console.log('  ✓ 가입 신청 내역 3건 등록');

    // ══════════════════════════════════════════════════════════
    // PHASE 9 : 결과 검증
    // ══════════════════════════════════════════════════════════
    console.log('\n🔍 PHASE 9 — 결과 검증');

    const verify = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM public.profiles) AS profiles,
        (SELECT COUNT(*) FROM auth.users) AS auth_users,
        (SELECT COUNT(*) FROM public.ladder_matches) AS matches,
        (SELECT COUNT(*) FROM public.match_sets) AS match_sets,
        (SELECT COUNT(*) FROM public.posts) AS posts,
        (SELECT COUNT(*) FROM public.notifications) AS notifications,
        (SELECT COUNT(*) FROM public.point_logs) AS point_logs,
        (SELECT COUNT(*) FROM public.applications) AS applications,
        (SELECT COUNT(*) FROM public.ladders) AS ladders
    `);
    console.log('최종 카운트:', JSON.stringify(verify.rows[0], null, 2));

    const realProfiles = await client.query(`
      SELECT id, by_id, role, wins, losses, ladder_mmr, clan_point
      FROM public.profiles WHERE id = ANY($1::uuid[])
      ORDER BY ladder_mmr DESC
    `, [[A_ID, B_ID, C_ID]]);
    console.log('실제 유저 프로필:', JSON.stringify(realProfiles.rows, null, 2));

    console.log('\n✅ 모든 작업 완료!\n');

  } finally {
    await client.end();
  }
}

// ── 세트 생성 헬퍼 ────────────────────────────────────────────────────────────
// score_a, score_b 에 맞게 bo3 세트 배열을 생성한다.
// winner 'A' → team_a 승리 세트가 score_a개
function buildSets(matchId, sa, sb, taUser, tbUser, createdAt) {
  const total = sa + sb;
  const sets = [];
  // 최종 승자 A면 A가 sa개, B가 sb개 이긴 세트 순서로 배치
  for (let i = 1; i <= total; i++) {
    const isLast = i === total;
    let winner;
    if (sa > sb) {
      // A 최종 승: 마지막 세트는 A가 이겨야 함
      if (isLast) winner = 'A';
      else winner = i % 2 === 0 ? 'B' : 'A'; // 교대
    } else {
      // B 최종 승: 마지막 세트는 B가 이겨야 함
      if (isLast) winner = 'B';
      else winner = i % 2 === 0 ? 'A' : 'B';
    }
    const setId = `${matchId.slice(0, 8)}-${String(i).padStart(4, '0')}-4000-8000-${matchId.slice(-12)}`;
    sets.push({ id: setId, num: i, winner });
  }
  return sets;
}

// ── 게시글 헬퍼 ───────────────────────────────────────────────────────────────
function buildPosts() {
  const posts = [];

  // By_Developer (A) — 12건
  const aAuthor = 'By_Developer';
  const aPosts = [
    { category: '자유', title: '클랜 활동 처음 해보는데 재미있네요!', content: '처음으로 클랜 래더를 경험해봤는데 생각보다 경쟁이 치열하네요. 좋은 경험이 될 것 같습니다.', days: 58, views: 42 },
    { category: '전략', title: '프로토스 2게이트 러쉬 빌드 공유', content: '최근 사용 중인 2게이트 러쉬 빌드입니다. 상대가 테란이면 특히 효과적입니다.\n\n1. 9 파일런\n2. 12 게이트\n3. 13 어시밀레이터...', days: 55, views: 87 },
    { category: '경기리뷰', title: 'By_Master와의 경기 복기', content: 'By_Master와의 3세트 경기를 복기합니다. 2세트 실수가 뼈아팠는데 다음에는 더 잘 할 수 있을 것 같습니다.', days: 52, views: 56 },
    { category: '자유', title: '오늘 래더 결과 공유', content: '오늘 1v1 매치 2번 뛰었는데 1승 1패. 프로토스 미러전은 정말 어렵네요.', days: 48, views: 33 },
    { category: '전략', title: '저그전 PvZ 오프닝 분석', content: '저그전에서 가장 많이 쓰이는 3가지 오프닝을 분석했습니다. 각각의 장단점과 대응법...', days: 45, views: 124 },
    { category: '클랜소식', title: '이번 주 래더 일정 공지', content: '이번 주 클랜 내부 래더는 화요일, 목요일 저녁 9시에 진행합니다. 많은 참여 부탁드립니다!', days: 40, views: 67 },
    { category: '경기리뷰', title: 'By_gkfla와 3번째 경기 후기', content: '오늘 By_gkfla와 긴장감 있는 접전 끝에 2:1로 승리했습니다. 2세트에서 압박 시기가 아주 좋았습니다.', days: 38, views: 45 },
    { category: '전략', title: '캐리어 빌드 준비 중 - 테크 트리 정리', content: '멀티 빠르게 먹고 캐리어로 전환하는 빌드를 연습 중입니다. 캐리어 8기 기준 타이밍...', days: 33, views: 98 },
    { category: '자유', title: '스타2 vs 스타1 차이점 느낀 점', content: '두 게임 모두 즐기고 있는데 멀티태스킹 요구량이 스타2가 훨씬 더 높은 것 같습니다. 클랜에서도 같은 생각이신 분?', days: 28, views: 51 },
    { category: 'Q&A', title: '아비터 소환문 활용법 질문', content: '아비터 소환문 타이밍을 언제 치는 게 좋을까요? 교전 중에 사용하는 타이밍이 항상 헷갈립니다.', days: 22, views: 39 },
    { category: '경기리뷰', title: 'By_Master와 5세트 풀 게임 복기', content: '무려 5세트까지 간 접전이었습니다. 결국 By_Master의 후반 운영이 더 좋아서 졌지만 많이 배웠습니다.', days: 15, views: 82 },
    { category: '자유', title: '클랜 분위기 너무 좋습니다', content: '가입한 지 3달 됐는데 정말 즐겁게 활동하고 있습니다. 앞으로도 잘 부탁드립니다!', days: 7, views: 28 },
  ];
  aPosts.forEach(p => posts.push({ ...p, user_id: A_ID, author: aAuthor }));

  // By_gkfla (B) — 10건
  const bAuthor = 'By_gkfla';
  const bPosts = [
    { category: '자유', title: '클랜에 가입했습니다 잘 부탁드려요!', content: '처음으로 스타크래프트 클랜에 가입해봤습니다. 아직 실력이 부족하지만 열심히 하겠습니다!', days: 83, views: 61 },
    { category: 'Q&A', title: '게이트웨이 몇 개에서 시작하는 게 좋나요?', content: '1v1 오프닝에서 게이트웨이 개수 설정이 항상 헷갈립니다. 초반에 2개 vs 3개 중 어떤 게 더 유리한가요?', days: 79, views: 47 },
    { category: '자유', title: '첫 래더 경기 결과 공유!', content: '처음으로 클랜 래더에 참가해봤습니다. 2패로 끝났지만 많이 배웠습니다 ㅠㅠ', days: 72, views: 35 },
    { category: '전략', title: '프로토스 유닛 조합 공부 중', content: '질럿+드라군 조합에서 하이템플러까지 가는 타이밍을 연습 중입니다. 선배님들 조언 부탁드려요!', days: 65, views: 53 },
    { category: '경기리뷰', title: 'By_Developer와 경기 후기 (첫 클랜 경기)', content: '클랜 선배 By_Developer와 첫 1v1 경기를 해봤습니다. 2:0으로 졌지만 많은 것을 배웠습니다. 다음에는 꼭!', days: 50, views: 41 },
    { category: '전략', title: '테란 상대 프로토스 빌드 고민', content: '테란 상대로 항상 초반 바이오닉 러쉬에 당하는데 대응법이 있을까요? 포지 빠르게 올리는 빌드를 써봤는데...', days: 43, views: 78 },
    { category: 'Q&A', title: '래더 MMR 시스템 궁금한 점', content: '래더 MMR이 승리하면 얼마나 올라가나요? 상대 MMR에 따라 달라지는 건가요?', days: 36, views: 29 },
    { category: '자유', title: '드디어 첫 승리!!! 기쁩니다', content: '오늘 By_Master와의 경기에서 드디어 첫 승리를 따냈습니다!!! 정말 기쁩니다 ㅠㅠ 고맙습니다 클랜!', days: 30, views: 94 },
    { category: '경기리뷰', title: 'By_Master와 재경기 - 이번엔 내가!', content: '지난번 졌던 경기를 재도전했습니다. 이번엔 초반 준비를 더 잘 했더니 2:0 완승! 성장한 것 같아 기쁩니다.', days: 17, views: 66 },
    { category: '자유', title: '3개월 활동 소감', content: '가입한 지 3달이 지났습니다. 처음보다 많이 성장한 것 같고 좋은 클랜원들 덕분에 즐겁게 활동하고 있습니다!', days: 5, views: 37 },
  ];
  bPosts.forEach(p => posts.push({ ...p, user_id: B_ID, author: bAuthor }));

  // By_Master (C) — 11건
  const cAuthor = 'By_Master';
  const cPosts = [
    { category: '클랜소식', title: '클랜 래더 시즌 안내', content: '이번 시즌은 1v1 중심으로 운영할 예정입니다. 많은 참여 부탁드립니다.', days: 93, views: 112 },
    { category: '전략', title: '마스터 수준 프로토스 컨트롤 팁', content: '유닛 컨트롤에서 가장 중요한 건 포지셔닝입니다. 드라군을 후퇴시키면서 앞 유닛으로 시간 버는 법을 정리했습니다.', days: 88, views: 203 },
    { category: '자유', title: 'ByClan 새 시즌 개막을 환영합니다!', content: '새로운 시즌의 시작입니다. 모든 클랜원 여러분 파이팅! 이번 시즌도 좋은 경기 많이 만들어봅시다.', days: 85, views: 89 },
    { category: '경기리뷰', title: 'By_Developer와의 경기 복기 - 초반이 승부처', content: '으 초반 빌드 싸움에서 밀렸는데 결국 역전하진 못했습니다. 빌드 순서를 다시 점검해야겠습니다.', days: 56, views: 71 },
    { category: '전략', title: '다크템플러 러쉬 빌드 공유', content: '상대의 디텍팅이 늦으면 치명적인 DT 러쉬 빌드입니다. 타이밍과 진입 경로가 핵심입니다.', days: 50, views: 156 },
    { category: 'Q&A', title: '게임 리플레이 분석하는 좋은 방법?', content: '리플레이를 보면서 의미있게 분석하는 방법이 있을까요? 그냥 보기만 해서는 실력 향상이 더딘 것 같아서요.', days: 44, views: 83 },
    { category: '경기리뷰', title: '연속 3경기 후 분석 정리', content: '오늘 3경기 연속으로 진행했습니다. 초반 드라군 컨트롤에서 반복적인 실수를 발견했습니다. 패턴을 수정해야겠습니다.', days: 38, views: 62 },
    { category: '클랜소식', title: '클랜 내전 2v2 일정 공지', content: '다음 주 토요일 저녁 8시에 2v2 파트너 내전을 진행합니다. 팀 구성은 래더 MMR 기준으로 배분됩니다.', days: 31, views: 95 },
    { category: '전략', title: 'PvT 중반 이후 운영 가이드', content: '테란 상대로 중반까지 버텼다면 이후는 산업 확장이 관건입니다. 3넥서스 이후 업그레이드 우선순위 정리...', days: 24, views: 177 },
    { category: '자유', title: 'By_gkfla 성장이 대단하네요!', content: '처음 래더 참가할 때랑 지금이랑 완전히 다른 수준입니다. 요즘 경기하면서 많이 느낍니다. 계속 파이팅!', days: 18, views: 48 },
    { category: '경기리뷰', title: '이번 달 전체 경기 전적 정리', content: '5승 5패로 50% 승률입니다. By_Developer에게 2패를 기록한 게 아쉽습니다. 다음 달 목표는 6승 4패!', days: 3, views: 74 },
  ];
  cPosts.forEach(p => posts.push({ ...p, user_id: C_ID, author: cAuthor }));

  return posts;
}

// ── 알림 헬퍼 ────────────────────────────────────────────────────────────────
function buildNotifications() {
  const notifs = [];

  const items = [
    // User A
    { user_id: A_ID, title: '🎉 가입 합격!', message: 'ByClan의 정식 멤버가 되었습니다. 환영합니다!', is_read: true, days: 88, link_to: '/profile' },
    { user_id: A_ID, title: '⚔️ 경기 초대', message: 'By_Master가 1v1 경기를 신청했습니다.', is_read: true, days: 57, link_to: '/ladder' },
    { user_id: A_ID, title: '💰 포인트 지급', message: '경기 승리 보상으로 클랜 포인트 200p가 지급되었습니다.', is_read: true, days: 55, link_to: '/profile' },
    { user_id: A_ID, title: '⚔️ 경기 결과', message: 'By_gkfla와의 경기에서 2:1 승리하였습니다.', is_read: true, days: 40, link_to: '/ladder' },
    { user_id: A_ID, title: '💰 포인트 지급', message: '경기 승리 보상으로 클랜 포인트 200p가 지급되었습니다.', is_read: false, days: 20, link_to: '/profile' },
    // User B
    { user_id: B_ID, title: '🎉 가입 합격!', message: 'ByClan의 정식 멤버가 되었습니다. 환영합니다!', is_read: true, days: 83, link_to: '/profile' },
    { user_id: B_ID, title: '⚔️ 첫 경기 안내', message: 'By_Developer가 1v1 경기를 신청했습니다. 참여해보세요!', is_read: true, days: 72, link_to: '/ladder' },
    { user_id: B_ID, title: '📌 경기 패배', message: 'By_Developer와의 경기에서 0:2로 패배하였습니다.', is_read: true, days: 50, link_to: '/ladder' },
    { user_id: B_ID, title: '💰 포인트 지급', message: '경기 참여 보상으로 클랜 포인트 50p가 지급되었습니다.', is_read: true, days: 30, link_to: '/profile' },
    { user_id: B_ID, title: '🏆 첫 승리 축하!', message: 'By_Master와의 경기에서 첫 승리를 달성했습니다! 축하드립니다!', is_read: false, days: 17, link_to: '/ladder' },
    // User C
    { user_id: C_ID, title: '🎉 가입 합격!', message: 'ByClan의 정식 멤버가 되었습니다. 환영합니다!', is_read: true, days: 93, link_to: '/profile' },
    { user_id: C_ID, title: '⚔️ 경기 신청', message: 'By_Developer가 1v1 경기를 신청했습니다.', is_read: true, days: 57, link_to: '/ladder' },
    { user_id: C_ID, title: '💰 포인트 지급', message: '경기 승리 보상으로 클랜 포인트 200p가 지급되었습니다.', is_read: true, days: 55, link_to: '/profile' },
    { user_id: C_ID, title: '⚔️ 경기 결과', message: 'By_gkfla와의 경기에서 2:1 승리하였습니다.', is_read: true, days: 24, link_to: '/ladder' },
    { user_id: C_ID, title: '📢 새 게시글', message: 'By_Developer가 전략 게시판에 새 글을 올렸습니다.', is_read: false, days: 14, link_to: '/community' },
  ];

  return items;
}

// ── 포인트 로그 헬퍼 ──────────────────────────────────────────────────────────
function buildPointLogs() {
  const logs = [];

  const items = [
    // User A (총 3200p)
    { user_id: A_ID, amount: 1000, reason: '신규 가입 보너스', days: 88 },
    { user_id: A_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Master 2:1)', days: 60 },
    { user_id: A_ID, amount: -100, reason: '경기 패배 차감 (vs By_Master 1:2)', days: 57 },
    { user_id: A_ID, amount: -100, reason: '경기 패배 차감 (vs By_gkfla 0:2)', days: 50 },
    { user_id: A_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Master 2:0)', days: 47 },
    { user_id: A_ID, amount: 200,  reason: '경기 승리 보상 (vs By_gkfla 2:1)', days: 40 },
    { user_id: A_ID, amount: -100, reason: '경기 패배 차감 (vs By_Master 0:2)', days: 37 },
    { user_id: A_ID, amount: 200,  reason: '경기 승리 보상 (vs By_gkfla 2:1)', days: 30 },
    { user_id: A_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Master 2:1)', days: 27 },
    { user_id: A_ID, amount: 200,  reason: '경기 승리 보상 (vs By_gkfla 2:0)', days: 20 },
    { user_id: A_ID, amount: -100, reason: '경기 패배 차감 (vs By_Master 1:2)', days: 14 },
    { user_id: A_ID, amount: 500,  reason: '관리자 지급 (클랜 기여 보상)', days: 7 },

    // User B (총 1800p)
    { user_id: B_ID, amount: 1000, reason: '신규 가입 보너스', days: 83 },
    { user_id: B_ID, amount: -100, reason: '경기 패배 차감 (vs By_Developer 0:2) — 첫 경기', days: 60 },
    { user_id: B_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Developer 2:0)', days: 50 },
    { user_id: B_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Master 2:1)', days: 54 },
    { user_id: B_ID, amount: -100, reason: '경기 패배 차감 (vs By_Master 1:2)', days: 44 },
    { user_id: B_ID, amount: -100, reason: '경기 패배 차감 (vs By_Developer 1:2)', days: 40 },
    { user_id: B_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Master 2:0)', days: 34 },
    { user_id: B_ID, amount: -100, reason: '경기 패배 차감 (vs By_Developer 1:2)', days: 30 },
    { user_id: B_ID, amount: -100, reason: '경기 패배 차감 (vs By_Master 1:2)', days: 24 },
    { user_id: B_ID, amount: -100, reason: '경기 패배 차감 (vs By_Developer 0:2)', days: 20 },
    { user_id: B_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Master 2:1)', days: 17 },
    { user_id: B_ID, amount: 500,  reason: '관리자 지급 (커뮤니티 활동 보상)', days: 5 },

    // User C (총 2500p)
    { user_id: C_ID, amount: 1000, reason: '신규 가입 보너스', days: 93 },
    { user_id: C_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Developer 2:1)', days: 57 },
    { user_id: C_ID, amount: -100, reason: '경기 패배 차감 (vs By_Developer 0:2)', days: 47 },
    { user_id: C_ID, amount: -100, reason: '경기 패배 차감 (vs By_gkfla 1:2)', days: 54 },
    { user_id: C_ID, amount: 200,  reason: '경기 승리 보상 (vs By_gkfla 2:1)', days: 44 },
    { user_id: C_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Developer 2:0)', days: 37 },
    { user_id: C_ID, amount: -100, reason: '경기 패배 차감 (vs By_gkfla 0:2)', days: 34 },
    { user_id: C_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Developer 1:2... wait 2:1)', days: 27 },
    { user_id: C_ID, amount: 200,  reason: '경기 승리 보상 (vs By_gkfla 2:1)', days: 24 },
    { user_id: C_ID, amount: -100, reason: '경기 패배 차감 (vs By_Developer 1:2)', days: 27 },
    { user_id: C_ID, amount: 200,  reason: '경기 승리 보상 (vs By_Developer 2:1)', days: 14 },
    { user_id: C_ID, amount: -100, reason: '경기 패배 차감 (vs By_gkfla 1:2)', days: 17 },
    { user_id: C_ID, amount: 500,  reason: '관리자 지급 (클랜원 관리 기여)', days: 10 },
  ];

  return items;
}

run().catch(e => {
  console.error('❌ 오류 발생:', e.message);
  process.exit(1);
});
