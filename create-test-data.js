// 테스트 데이터 생성 스크립트
// 브라우저 콘솔에서 실행

import { supabase } from '@/supabase';

// 테스트 길드원 데이터 생성
const createTestData = async () => {
  try {
    // 테스트 길드원 데이터
    const testMembers = [
      {
        id: 'test-master-001',
        discord_name: 'TestMaster',
        by_id: 'By_Master',
        role: 'master',
        clan_point: 100,
        race: 'Terran',
        intro: '테스트 마스터 계정',
        clan_point: 1500,
        is_in_queue: false,
        vote_to_start: false
      },
      {
        id: 'test-admin-001',
        discord_name: 'TestAdmin',
        by_id: 'By_Admin',
        role: 'admin',
        clan_point: 80,
        race: 'Protoss',
        intro: '테스트 관리자 계정',
        clan_point: 1400,
        is_in_queue: false,
        vote_to_start: false
      },
      {
        id: 'test-elite-001',
        discord_name: 'TestElite',
        by_id: 'By_Elite',
        role: 'elite',
        clan_point: 60,
        race: 'Zerg',
        intro: '테스트 정예 계정',
        clan_point: 1300,
        is_in_queue: false,
        vote_to_start: false
      },
      {
        id: 'test-associate-001',
        discord_name: 'TestAssociate',
        by_id: 'By_Associate',
        role: 'associate',
        clan_point: 50,
        race: 'Terran',
        intro: '테스트 일반 계정',
        clan_point: 1200,
        is_in_queue: false,
        vote_to_start: false
      }
    ];

    // 데이터 삽입
    for (const member of testMembers) {
      const { error } = await supabase
        .from('profiles')
        .upsert(member, { onConflict: 'id' });
      
      if (error) {
        console.error('데이터 삽입 실패:', error);
      } else {
        console.log('✅ 데이터 삽입 성공:', member.by_id);
      }
    }

    // 테스트 관리자 게시글
    const { error: postError } = await supabase
      .from('admin_posts')
      .upsert([
        {
          title: '테스트 공지사항',
          content: '이것은 테스트 공지사항입니다. 시스템이 정상적으로 작동하는지 확인합니다.',
          author_id: 'test-master-001'
        },
        {
          title: '운영 회의록',
          content: '정기 운영 회의가 진행되었습니다. 클랜 운영 관련 사항들을 논의했습니다.',
          author_id: 'test-master-001'
        }
      ], { onConflict: 'id' });

    if (postError) {
      console.error('게시글 삽입 실패:', postError);
    } else {
      console.log('✅ 게시글 삽입 성공');
    }

    alert('테스트 데이터 생성이 완료되었습니다!');
    
  } catch (error) {
    console.error('테스트 데이터 생성 실패:', error);
    alert('테스트 데이터 생성에 실패했습니다: ' + error.message);
  }
};

// 실행
createTestData();
