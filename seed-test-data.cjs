#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TEST_MODE_SETTING_KEY = 'test_mode_active';
const TEST_ACCOUNT_SETTING_KEY = 'test_accounts_enabled';
const INTERNAL_AUTH_DOMAIN = 'auth.byclan.local';
const INTERNAL_AUTH_PREFIX = 'login.';
const TEST_ACCOUNT_PASSWORD = 'ByClanTest123!';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = normalizedValue;
    }
  }
}

function relationMissing(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return (
    message.includes('does not exist') ||
    message.includes('relation') && message.includes('not found') ||
    error?.code === '42P01'
  );
}

function missingColumn(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return (
    message.includes('column') && message.includes('does not exist') ||
    error?.code === '42703'
  );
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

async function upsertRows(supabase, table, rows, options = {}) {
  if (!rows.length) {
    return { inserted: 0, skipped: false };
  }

  const { onConflict = 'id', ignoreMissingRelation = false } = options;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });

  if (error) {
    if (ignoreMissingRelation && relationMissing(error)) {
      console.warn(`- ${table}: 테이블이 없어 건너뜁니다.`);
      return { inserted: 0, skipped: true };
    }
    throw error;
  }

  console.log(`- ${table}: ${rows.length}개 upsert 완료`);
  return { inserted: rows.length, skipped: false };
}

async function tryStrategies(supabase, table, strategies) {
  let lastError = null;

  for (const strategy of strategies) {
    try {
      const rows = strategy.buildRows();
      return await upsertRows(supabase, table, rows, {
        onConflict: strategy.onConflict || 'id',
        ignoreMissingRelation: strategy.ignoreMissingRelation !== false,
      });
    } catch (error) {
      lastError = error;

      if (relationMissing(error)) {
        console.warn(`- ${table}: 테이블이 없어 건너뜁니다.`);
        return { inserted: 0, skipped: true };
      }

      if (missingColumn(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function buildInternalAuthEmail(accountId) {
  return `${INTERNAL_AUTH_PREFIX}${accountId}@${INTERNAL_AUTH_DOMAIN}`;
}

const TEST_USERS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    ladderId: '21111111-1111-4111-8111-111111111111',
    key: 'test1',
    role: 'master',
    race: 'Terran',
    ladderPoints: 2240,
    clanPoints: 5400,
    wins: 42,
    losses: 12,
    intro: '클랜 운영과 래더 밸런스를 함께 관리하는 테스트 마스터 계정입니다.',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    ladderId: '32222222-2222-4222-8222-222222222222',
    key: 'test2',
    role: 'admin',
    race: 'Protoss',
    ladderPoints: 2120,
    clanPoints: 4900,
    wins: 38,
    losses: 16,
    intro: '공지와 신청서 심사를 담당하는 테스트 운영진 계정입니다.',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    ladderId: '43333333-3333-4333-8333-333333333333',
    key: 'test3',
    role: 'elite',
    race: 'Zerg',
    ladderPoints: 2010,
    clanPoints: 4300,
    wins: 34,
    losses: 17,
    intro: '상위권 저그 전담 테스트 계정입니다.',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    ladderId: '54444444-4444-4444-8444-444444444444',
    key: 'test4',
    role: 'elite',
    race: 'Terran',
    ladderPoints: 1880,
    clanPoints: 4000,
    wins: 31,
    losses: 18,
    intro: '전방 압박형 운영을 자주 쓰는 테스트 계정입니다.',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    ladderId: '65555555-5555-4555-8555-555555555555',
    key: 'test5',
    role: 'associate',
    race: 'Protoss',
    ladderPoints: 1760,
    clanPoints: 3600,
    wins: 28,
    losses: 21,
    intro: '주말 내전 참여율이 높은 테스트 계정입니다.',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    ladderId: '76666666-6666-4666-8666-666666666666',
    key: 'test6',
    role: 'associate',
    race: 'Random',
    ladderPoints: 1650,
    clanPoints: 3300,
    wins: 25,
    losses: 22,
    intro: '랜덤 종족으로 분위기를 흔드는 테스트 계정입니다.',
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    ladderId: '87777777-7777-4777-8777-777777777777',
    key: 'test7',
    role: 'member',
    race: 'Zerg',
    ladderPoints: 1520,
    clanPoints: 2800,
    wins: 20,
    losses: 19,
    intro: '중위권 래더 테스트용 멤버 계정입니다.',
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    ladderId: '98888888-8888-4888-8888-888888888888',
    key: 'test8',
    role: 'member',
    race: 'Terran',
    ladderPoints: 1430,
    clanPoints: 2500,
    wins: 18,
    losses: 20,
    intro: '일반 매치와 래더를 번갈아 플레이하는 테스트 계정입니다.',
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    ladderId: 'a9999999-9999-4999-8999-999999999999',
    key: 'test9',
    role: 'rookie',
    race: 'Protoss',
    ladderPoints: 1320,
    clanPoints: 1800,
    wins: 14,
    losses: 21,
    intro: '가입 직후 흐름을 검증하기 위한 테스트 신입 계정입니다.',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    ladderId: 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    key: 'test10',
    role: 'developer',
    race: 'Terran',
    ladderPoints: 1260,
    clanPoints: 1600,
    wins: 12,
    losses: 23,
    intro: '테스트 모드와 개발자 화면 확인용 계정입니다.',
  },
];

function buildProfiles() {
  return TEST_USERS.map((user) => ({
    id: user.id,
    discord_name: user.key,
    ByID: `By_${user.key}`,
    role: user.role,
    Clan_Point: user.clanPoints,
    race: user.race,
    intro: user.intro,
    Clan_point: user.ladderPoints,
    is_in_queue: false,
    vote_to_start: false,
    is_test_account: true,
    is_test_account_active: true,
  }));
}

function buildLaddersFull() {
  return TEST_USERS.map((user, index) => ({
    id: user.ladderId,
    user_id: user.id,
    nickname: `By_${user.key}`,
    name: `By_${user.key}`,
    ByID: `By_${user.key}`,
    discord_name: user.key,
    race: user.race,
    rank: index + 1,
    points: user.ladderPoints,
    ladders_points: user.ladderPoints,
    win: user.wins,
    lose: user.losses,
    is_test_data: true,
    is_test_data_active: true,
  }));
}

function buildLaddersCompact() {
  return TEST_USERS.map((user, index) => ({
    id: user.ladderId,
    user_id: user.id,
    nickname: `By_${user.key}`,
    rank: index + 1,
    ladders_points: user.ladderPoints,
    win: user.wins,
    lose: user.losses,
    is_test_data: true,
    is_test_data_active: true,
  }));
}

function buildAdminPosts() {
  return [
    {
      id: 'c1111111-1111-4111-8111-111111111111',
      author_id: TEST_USERS[0].id,
      title: '테스트 시즌 오픈 안내',
      content: '홈 화면과 공지 보드가 비어 보이지 않도록 테스트 시즌 공지를 등록했습니다.',
      created_at: daysAgo(1),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'c2222222-2222-4222-8222-222222222222',
      author_id: TEST_USERS[1].id,
      title: '랭킹 보드 검증용 포인트 반영',
      content: 'test1~test10 계정의 래더 포인트와 전적이 함께 반영됩니다.',
      created_at: daysAgo(2),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'c3333333-3333-4333-8333-333333333333',
      author_id: TEST_USERS[0].id,
      title: '주말 내전 예고',
      content: '3v3, 4v4, 5v5 화면 확인이 가능하도록 더미 매치 데이터도 함께 들어갑니다.',
      created_at: daysAgo(4),
      is_test_data: true,
      is_test_data_active: true,
    },
  ];
}

function buildCommunityPosts() {
  return [
    {
      id: 'd1111111-1111-4111-8111-111111111111',
      user_id: TEST_USERS[2].id,
      author_name: TEST_USERS[2].key,
      title: '저그 운영 빌드 공유',
      content: '커뮤니티 보드 노출용 테스트 글입니다. 중반 운영 전환 타이밍을 정리했습니다.',
      views: 27,
      created_at: daysAgo(1),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'd2222222-2222-4222-8222-222222222222',
      user_id: TEST_USERS[3].id,
      author_name: TEST_USERS[3].key,
      title: '오늘 저녁 4v4 모집',
      content: '래더 대시보드와 자유게시판을 함께 확인할 수 있도록 작성한 모집 글입니다.',
      views: 14,
      created_at: daysAgo(2),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'd3333333-3333-4333-8333-333333333333',
      user_id: TEST_USERS[6].id,
      author_name: TEST_USERS[6].key,
      title: '가입 후 적응 팁 정리',
      content: '신입 계정 관점에서 필요한 안내 글을 가정한 테스트 게시물입니다.',
      views: 9,
      created_at: daysAgo(3),
      is_test_data: true,
      is_test_data_active: true,
    },
  ];
}

function buildApplicationsFull() {
  return [
    {
      id: 'e1111111-1111-4111-8111-111111111111',
      user_id: TEST_USERS[8].id,
      tester_id: TEST_USERS[1].id,
      discord_name: TEST_USERS[8].key,
      btag: 'test9#9009',
      race: 'Protoss',
      tier: 'Gold',
      intro: '안정적인 운영형 플레이를 선호합니다.',
      motivation: '클랜전과 래더를 꾸준히 참여하고 싶습니다.',
      playtime: '평일 20:00~24:00',
      phone: '010-9000-9009',
      status: '대기중',
      created_at: daysAgo(1),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'e2222222-2222-4222-8222-222222222222',
      user_id: TEST_USERS[9].id,
      tester_id: TEST_USERS[1].id,
      discord_name: TEST_USERS[9].key,
      btag: 'test10#9010',
      race: 'Terran',
      tier: 'Silver',
      intro: '내전 위주로 활동하고 싶습니다.',
      motivation: '가입 절차와 알림함 동선을 점검하기 위한 테스트 신청서입니다.',
      playtime: '주말 오후',
      phone: '010-9010-9010',
      status: '합격',
      test_result: '[합격] 담당: By_test2 | 코멘트: 기본 매너와 운영 이해도가 좋아 바로 활동 가능합니다.',
      created_at: daysAgo(5),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'e3333333-3333-4333-8333-333333333333',
      user_id: TEST_USERS[7].id,
      tester_id: TEST_USERS[1].id,
      discord_name: TEST_USERS[7].key,
      btag: 'test8#9008',
      race: 'Terran',
      tier: 'Silver',
      intro: '커뮤니티 활동 위주로 먼저 적응하고 싶습니다.',
      motivation: '심사 기록실 화면 확인용 테스트 데이터입니다.',
      playtime: '평일 저녁',
      phone: '010-9008-9008',
      status: '불합격',
      test_result: '[불합격] 담당: By_test2 | 코멘트: 기본기는 있으나 클랜 활동 시간대가 아직 맞지 않았습니다.',
      created_at: daysAgo(8),
      is_test_data: true,
      is_test_data_active: true,
    },
  ];
}

function buildApplicationsCompact() {
  return [
    {
      id: 'e1111111-1111-4111-8111-111111111111',
      user_id: TEST_USERS[8].id,
      btag: 'test9#9009',
      race: 'Protoss',
      tier: 'Gold',
      intro: '안정적인 운영형 플레이를 선호합니다.',
      motivation: '클랜전과 래더를 꾸준히 참여하고 싶습니다.',
      playtime: '평일 20:00~24:00',
      phone: '010-9000-9009',
      status: '대기중',
      created_at: daysAgo(1),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'e2222222-2222-4222-8222-222222222222',
      user_id: TEST_USERS[9].id,
      btag: 'test10#9010',
      race: 'Terran',
      tier: 'Silver',
      intro: '내전 위주로 활동하고 싶습니다.',
      motivation: '가입 절차와 알림함 동선을 점검하기 위한 테스트 신청서입니다.',
      playtime: '주말 오후',
      phone: '010-9010-9010',
      status: '합격',
      created_at: daysAgo(5),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'e3333333-3333-4333-8333-333333333333',
      user_id: TEST_USERS[7].id,
      btag: 'test8#9008',
      race: 'Terran',
      tier: 'Silver',
      intro: '커뮤니티 활동 위주로 먼저 적응하고 싶습니다.',
      motivation: '심사 기록실 화면 확인용 테스트 데이터입니다.',
      playtime: '평일 저녁',
      phone: '010-9008-9008',
      status: '불합격',
      created_at: daysAgo(8),
      is_test_data: true,
      is_test_data_active: true,
    },
  ];
}

function buildNotifications() {
  return [
    {
      id: 'f1111111-1111-4111-8111-111111111111',
      user_id: TEST_USERS[8].id,
      title: '📌 테스트 심사 대기 안내',
      message: '현재 신청서가 접수되었고 운영진 확인을 기다리는 상태입니다.',
      is_read: false,
      created_at: daysAgo(1),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'f2222222-2222-4222-8222-222222222222',
      user_id: TEST_USERS[9].id,
      title: '🎉 가입 합격 알림',
      message: '테스트 계정 기준으로 합격 알림 화면을 확인할 수 있도록 등록한 더미 알림입니다.',
      is_read: true,
      created_at: daysAgo(4),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'f3333333-3333-4333-8333-333333333333',
      user_id: TEST_USERS[1].id,
      title: '🛠️ 테스트 데이터 준비 완료',
      message: '랭킹, 신청서, 게시글, 매치 데이터가 모두 시드되었습니다.',
      is_read: false,
      created_at: daysAgo(0),
      is_test_data: true,
      is_test_data_active: true,
    },
  ];
}

function buildMatchesFull() {
  return [
    {
      id: 'ab111111-1111-4111-8111-111111111111',
      host_id: TEST_USERS[0].id,
      created_by: TEST_USERS[0].id,
      status: '모집중',
      match_type: 4,
      team_a_ids: [TEST_USERS[0].id, TEST_USERS[2].id, TEST_USERS[4].id, TEST_USERS[6].id],
      team_b_ids: [TEST_USERS[1].id, TEST_USERS[3].id, TEST_USERS[5].id, TEST_USERS[7].id],
      team_a_races: ['Terran', 'Zerg', 'Protoss', 'Zerg'],
      team_b_races: ['Protoss', 'Terran', 'Random', 'Terran'],
      score_a: 0,
      score_b: 0,
      map_name: 'Circuit Breakers',
      created_at: daysAgo(0),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'ab222222-2222-4222-8222-222222222222',
      host_id: TEST_USERS[1].id,
      created_by: TEST_USERS[1].id,
      status: '진행중',
      match_type: 3,
      team_a_ids: [TEST_USERS[0].id, TEST_USERS[2].id, TEST_USERS[8].id],
      team_b_ids: [TEST_USERS[1].id, TEST_USERS[3].id, TEST_USERS[9].id],
      team_a_races: ['Terran', 'Zerg', 'Protoss'],
      team_b_races: ['Protoss', 'Terran', 'Terran'],
      score_a: 2,
      score_b: 1,
      map_name: 'Fighting Spirit',
      created_at: daysAgo(1),
      is_test_data: true,
      is_test_data_active: true,
    },
  ];
}

function buildMatchesCompact() {
  return [
    {
      id: 'ab111111-1111-4111-8111-111111111111',
      status: '모집중',
      match_type: 4,
      team_a_ids: [TEST_USERS[0].id, TEST_USERS[2].id, TEST_USERS[4].id, TEST_USERS[6].id],
      team_b_ids: [TEST_USERS[1].id, TEST_USERS[3].id, TEST_USERS[5].id, TEST_USERS[7].id],
      score_a: 0,
      score_b: 0,
      map_name: 'Circuit Breakers',
      created_by: TEST_USERS[0].id,
      created_at: daysAgo(0),
      is_test_data: true,
      is_test_data_active: true,
    },
    {
      id: 'ab222222-2222-4222-8222-222222222222',
      status: '진행중',
      match_type: 3,
      team_a_ids: [TEST_USERS[0].id, TEST_USERS[2].id, TEST_USERS[8].id],
      team_b_ids: [TEST_USERS[1].id, TEST_USERS[3].id, TEST_USERS[9].id],
      score_a: 2,
      score_b: 1,
      map_name: 'Fighting Spirit',
      created_by: TEST_USERS[1].id,
      created_at: daysAgo(1),
      is_test_data: true,
      is_test_data_active: true,
    },
  ];
}

function buildSystemSettings() {
  return [
    {
      key: TEST_MODE_SETTING_KEY,
      value_bool: false,
      description: '개발자 테스트 모드 활성화 여부',
      updated_at: new Date().toISOString(),
    },
    {
      key: TEST_ACCOUNT_SETTING_KEY,
      value_bool: true,
      description: '테스트 계정 및 테스트 데이터 노출 여부',
      updated_at: new Date().toISOString(),
    },
  ];
}

async function main() {
  const rootDir = __dirname;
  loadEnvFile(path.join(rootDir, '.env.local'));
  loadEnvFile(path.join(rootDir, '.env'));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase 환경 변수가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정하세요.');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY가 없어 공개 anon 키로 진행합니다. RLS 정책에 따라 일부 테이블은 실패할 수 있습니다.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('ByClan 테스트 데이터 시드를 시작합니다.');
  console.log(`대상 계정: ${TEST_USERS.map((user) => user.key).join(', ')}`);

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    printSection('auth.users reset');
    for (const user of TEST_USERS) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        email: buildInternalAuthEmail(user.key),
        password: TEST_ACCOUNT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          display_name: user.key,
          login_id: user.key,
          test_account: true,
        },
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
      });

      if (error) {
        console.warn(`- ${user.key}: auth 계정 갱신 실패 (${error.message})`);
      } else {
        console.log(`- ${user.key}: 숨김 이메일 로그인 형식으로 auth 계정 갱신 완료`);
      }
    }
  }

  printSection('system_settings');
  await upsertRows(supabase, 'system_settings', buildSystemSettings(), { onConflict: 'key', ignoreMissingRelation: true });

  printSection('profiles');
  await upsertRows(supabase, 'profiles', buildProfiles());

  printSection('ladders');
  await tryStrategies(supabase, 'ladders', [
    { buildRows: buildLaddersFull },
    { buildRows: buildLaddersCompact },
  ]);

  printSection('admin_posts');
  await upsertRows(supabase, 'admin_posts', buildAdminPosts(), { ignoreMissingRelation: true });

  printSection('posts');
  await upsertRows(supabase, 'posts', buildCommunityPosts(), { ignoreMissingRelation: true });

  printSection('applications');
  await tryStrategies(supabase, 'applications', [
    { buildRows: buildApplicationsFull },
    { buildRows: buildApplicationsCompact },
  ]);

  printSection('notifications');
  await upsertRows(supabase, 'notifications', buildNotifications(), { ignoreMissingRelation: true });

  printSection('ladder_matches');
  await tryStrategies(supabase, 'ladder_matches', [
    { buildRows: buildMatchesFull },
    { buildRows: buildMatchesCompact },
  ]);

  console.log('\n완료되었습니다. 홈, 랭킹, 커뮤니티, 가입 심사, 매치 화면에서 테스트 데이터를 확인할 수 있습니다.');
}

main().catch((error) => {
  console.error('\n시드 실패:', error.message || error);
  process.exit(1);
});