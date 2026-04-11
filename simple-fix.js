// 간단한 프로필 수정
// 브라우저 콘솔에서 이 한 줄만 실행

import { supabase } from '@/supabase';

const userId = '057c4bc1-8067-406b-ad40-efe6125a3d1f';

// 프로필 업데이트
supabase
  .from('profiles')
  .upsert({
    id: userId,
    discord_name: 'halim0720',
    by_id: 'By_halim0720',
    role: 'developer',
    clan_point: 100,
    race: 'Terran',
    intro: '시스템 개발자',
    clan_point: 1500,
    is_in_queue: false,
    vote_to_start: false
  })
  .then(result => {
    console.log('✅ 프로필 수정 결과:', result);
    if (result.error) {
      console.error('❌ 에러:', result.error);
    } else {
      console.log('🎉 성공! 페이지를 새로고침하세요.');
    }
  });
