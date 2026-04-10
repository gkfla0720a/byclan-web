// 데이터베이스 상태 확인 스크립트
// 브라우저 콘솔에서 실행

import { supabase } from '@/supabase';

const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 데이터베이스 상태 확인 시작...');
    
    // 1. profiles 테이블 확인
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, ByID, discord_name, role, Clan_point')
      .neq('role', 'visitor')
      .order('Clan_point', { ascending: false });
    
    if (profilesError) {
      console.error('❌ profiles 테이블 조회 실패:', profilesError);
    } else {
      console.log('✅ profiles 테이블 데이터:', profiles);
      console.log(`📊 총 ${profiles.length}명의 길드원이 있습니다.`);
    }
    
    // 2. admin_posts 테이블 확인
    const { data: posts, error: postsError } = await supabase
      .from('admin_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (postsError) {
      console.error('❌ admin_posts 테이블 조회 실패:', postsError);
    } else {
      console.log('✅ admin_posts 테이블 데이터:', posts);
      console.log(`📝 총 ${posts.length}개의 관리자 게시글이 있습니다.`);
    }
    
    // 3. 현재 로그인된 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('👤 현재 로그인된 사용자:', user);
      
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('👤 사용자 프로필:', userProfile);
    } else {
      console.log('❌ 로그인된 사용자가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 확인 실패:', error);
  }
};

// 실행
checkDatabaseStatus();
