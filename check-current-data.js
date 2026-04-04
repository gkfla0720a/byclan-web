// 현재 데이터베이스 상태 확인
// 브라우저 콘솔에서 실행

import { supabase } from '@/supabase';

const checkCurrentData = async () => {
  try {
    console.log('🔍 현재 데이터베이스 상태 확인...');
    
    // 1. 전체 프로필 데이터 확인
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ 전체 프로필 조회 실패:', allError);
    } else {
      console.log('✅ 전체 프로필 데이터:', allProfiles);
      console.log(`📊 총 ${allProfiles.length}개의 프로필이 있습니다.`);
      
      // 역할별 분류
      const roleCounts = {};
      allProfiles.forEach(profile => {
        roleCounts[profile.role] = (roleCounts[profile.role] || 0) + 1;
      });
      console.log('📈 역할별 분포:', roleCounts);
    }
    
    // 2. 길드원만 필터링 (visitor, applicant 제외)
    const { data: guildMembers, error: guildError } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'visitor')
      .neq('role', 'applicant')
      .neq('role', 'expelled')
      .order('ladder_points', { ascending: false });
    
    if (guildError) {
      console.error('❌ 길드원 조회 실패:', guildError);
    } else {
      console.log('✅ 길드원 데이터:', guildMembers);
      console.log(`👥 길드원 수: ${guildMembers.length}명`);
      
      // 랭킹별 정렬
      const rankedMembers = guildMembers.map((member, index) => ({
        rank: index + 1,
        ByID: member.ByID,
        discord_name: member.discord_name,
        role: member.role,
        ladder_points: member.ladder_points || 1000,
        race: member.race || 'Terran'
      }));
      console.log('🏆 랭킹별 길드원:', rankedMembers);
    }
    
    // 3. 가입 신청 현황
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (appError) {
      console.error('❌ 가입 신청 조회 실패:', appError);
    } else {
      console.log('✅ 가입 신청 데이터:', applications);
      console.log(`📝 가입 신청 수: ${applications.length}개`);
    }
    
    // 4. 관리자 게시글
    const { data: adminPosts, error: postError } = await supabase
      .from('admin_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (postError) {
      console.error('❌ 관리자 게시글 조회 실패:', postError);
    } else {
      console.log('✅ 관리자 게시글:', adminPosts);
      console.log(`📋 관리자 게시글 수: ${adminPosts.length}개`);
    }
    
    // 5. 현재 로그인된 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('👤 현재 로그인된 사용자:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      
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
    console.error('❌ 데이터 확인 실패:', error);
  }
};

// 실행
checkCurrentData();
