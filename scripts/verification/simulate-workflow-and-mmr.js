const { Client } = require('pg');

const DB_URL = process.env.DB_URL || 'postgresql://postgres.mmsmedvdwmisewngmuka:byclanblacktiger01!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

const REAL = {
  DEV: '057c4bc1-8067-406b-ad40-efe6125a3d1f',
  MEMBER: '6d0aa755-a291-4780-a0f8-04e15f2c3aca',
  MASTER: '04aa3e91-5d67-4dc8-afc1-b313a9d4995c',
};

const MATCH_ID = 'ee000001-0000-4000-8000-000000000001';

async function main() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    console.log('✅ DB connected');

    const testProfiles = await client.query(`
      select id, by_id from public.profiles
      where is_test_account = true
      order by by_id asc
      limit 5
    `);

    if (testProfiles.rows.length < 5) {
      throw new Error('테스트 계정 5개가 필요합니다. seed-test-accounts.js를 먼저 실행하세요.');
    }

    const [T1, T2, T3, T4, T5] = testProfiles.rows.map(r => r.id);

    const participants = [REAL.DEV, REAL.MEMBER, REAL.MASTER, T1, T2, T3, T4, T5];

    console.log('\n1) 초기화: 모든 참가자 MMR 1500/0/1500 세팅');
    await client.query(`
      update public.profiles
      set ladder_mmr = 1500, team_mmr = 0, total_mmr = 1500, wins = 0, losses = 0, is_in_queue = false
      where id = any($1::uuid[])
    `, [participants]);

    await client.query(`delete from public.match_sets where match_id = $1::uuid`, [MATCH_ID]);
    await client.query(`delete from public.ladder_matches where id = $1::uuid`, [MATCH_ID]);

    console.log('2) 대기열 진입 실행');
    await client.query(`
      update public.profiles
      set is_in_queue = true,
          queue_joined_at = now()
      where id = any($1::uuid[])
    `, [participants]);

    const queueCount = await client.query(`select count(*)::int as cnt from public.profiles where id = any($1::uuid[]) and is_in_queue = true`, [participants]);
    console.log('   queue_count =', queueCount.rows[0].cnt);

    const teamA = [REAL.DEV, T1, T2, T3];
    const teamB = [REAL.MEMBER, REAL.MASTER, T4, T5];

    console.log('3) 매치 제안 실행 (4v4, 제안중)');
    await client.query(`
      insert into public.ladder_matches (
        id, host_id, created_by, status, match_type,
        team_a_ids, team_b_ids, score_a, score_b,
        is_test_data, is_test_data_active
      ) values (
        $1::uuid, $2::uuid, $2::uuid, '제안중', '4v4',
        $3::uuid[], $4::uuid[], 0, 0,
        true, true
      )
    `, [MATCH_ID, REAL.MASTER, teamA, teamB]);

    console.log('4) 매치 동의 실행 (진행중 전환, 대기열 이탈)');
    await client.query(`update public.ladder_matches set status = '진행중' where id = $1::uuid`, [MATCH_ID]);
    await client.query(`update public.profiles set is_in_queue = false where id = any($1::uuid[])`, [participants]);

    await createAndCompleteSet(client, MATCH_ID, 1, 'A');
    await snapshot(client, '세트1 완료(A 승)');

    await createAndCompleteSet(client, MATCH_ID, 2, 'B');
    await snapshot(client, '세트2 완료(B 승)');

    await createAndCompleteSet(client, MATCH_ID, 3, 'A');
    await snapshot(client, '세트3 완료(A 승)');

    await createAndCompleteSet(client, MATCH_ID, 4, 'A');
    await snapshot(client, '세트4 완료(A 승, 매치 종료)');

    console.log('5) 게시글 작성 실행 (커뮤니티 + 공지)');
    await client.query(`
      insert into public.posts (user_id, author_name, category, title, content, is_test_data, is_test_data_active)
      values ($1::uuid, 'By_Tester01', '경기리뷰', '4v4 테스트 매치 리뷰', '테스트 계정 기반 4v4 매치 시뮬레이션 완료. 세트별 MMR 반영을 확인했습니다.', true, true)
    `, [T1]);

    const memo = [
      '[MMR 정산 규칙 공지]',
      '1) 세트 완료 시: 승리팀 전원 +10(개인 MMR), 패배팀 전원 -10(개인 MMR).',
      '2) 매치 최종 승패 확정 시: 승리팀 전원 +10(팀 MMR), 패배팀 전원 -10(팀 MMR).',
      '3) 합산 MMR = 개인 MMR + 팀 MMR, 랭킹은 합산 MMR 기준.',
      '4) 세트 완료 즉시 MMR 반영되며 매치/랭킹 조회 시 최신값이 반영됩니다.',
    ].join('\n');

    await client.query(`
      insert into public.admin_posts (title, content, author_id, is_test_data, is_test_data_active)
      values ('[운영 공지] MMR 정산 규칙 및 적용 안내', $1, $2::uuid, false, true)
    `, [memo, REAL.MASTER]);

    console.log('6) 래더 랭킹 재정렬 (합산 MMR 기준)');
    await client.query(`delete from public.ladders where user_id = any($1::uuid[])`, [participants]);
    await client.query(`
      insert into public.ladders (rank, user_id, nickname, ladder_mmr, race, win, lose, win_rate, is_test_data, is_test_data_active)
      select
        row_number() over (order by p.total_mmr desc, p.created_at asc),
        p.id,
        p.by_id,
        p.total_mmr,
        p.race,
        coalesce(p.wins, 0),
        coalesce(p.losses, 0),
        case when coalesce(p.wins,0)+coalesce(p.losses,0)=0 then '0%'
             else concat(round((coalesce(p.wins,0)::numeric/(coalesce(p.wins,0)+coalesce(p.losses,0))::numeric)*100), '%') end,
        coalesce(p.is_test_account, false),
        coalesce(p.is_test_account_active, true)
      from public.profiles p
      where p.id = any($1::uuid[])
    `, [participants]);

    const matchFinal = await client.query(`
      select id, status, winning_team, score_a, score_b, team_mmr_applied
      from public.ladder_matches where id = $1::uuid
    `, [MATCH_ID]);

    console.log('\n[매치 최종 상태]');
    console.log(matchFinal.rows[0]);

    const mmrRows = await client.query(`
      select by_id, ladder_mmr as personal_mmr, team_mmr, total_mmr, wins, losses
      from public.profiles
      where id = any($1::uuid[])
      order by total_mmr desc, by_id asc
    `, [participants]);

    console.log('\n[합산 MMR 랭킹]');
    mmrRows.rows.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.by_id} | 개인:${r.personal_mmr} 팀:${r.team_mmr} 합산:${r.total_mmr} | ${r.wins}W ${r.losses}L`);
    });

    console.log('\n✅ 대기열 진입/매치 제안/세트 종료/게시글 작성 실행 및 점검 완료');
  } finally {
    await client.end();
  }
}

async function createAndCompleteSet(client, matchId, setNumber, winner) {
  const setId = `ee0000${String(setNumber).padStart(2, '0')}-0000-4000-8000-000000000001`;

  await client.query(`
    insert into public.match_sets (
      id, match_id, set_number, race_type,
      team_a_entry, team_b_entry,
      status, team_a_ready, team_b_ready, started_at
    ) values (
      $1::uuid, $2::uuid, $3, '4v4',
      '[]'::jsonb, '[]'::jsonb,
      '진행중', true, true, now()
    )
    on conflict (id) do nothing
  `, [setId, matchId, setNumber]);

  await client.query(`
    update public.match_sets
    set winner_team = $1,
        status = '완료'
    where id = $2::uuid
  `, [winner, setId]);
}

async function snapshot(client, label) {
  const m = await client.query(`select status, score_a, score_b from public.ladder_matches where id = $1::uuid`, [MATCH_ID]);
  console.log(`\n   [${label}] match=${m.rows[0].status} ${m.rows[0].score_a}:${m.rows[0].score_b}`);

  const r = await client.query(`
    select by_id, ladder_mmr, team_mmr, total_mmr
    from public.profiles
    where by_id in ('By_Developer', 'By_Master', 'By_gkfla', 'By_Tester01')
    order by by_id asc
  `);

  r.rows.forEach(x => {
    console.log(`   - ${x.by_id}: 개인 ${x.ladder_mmr}, 팀 ${x.team_mmr}, 합산 ${x.total_mmr}`);
  });
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
