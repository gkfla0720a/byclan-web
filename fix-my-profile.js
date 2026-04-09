// 현재 사용자 프로필 확인
// 브라우저 콘솔에서 실행

import { supabase } from '@/supabase';

const checkMyProfile = async () => {
  try {
    console.log('🔍 현재 사용자 프로필 확인...');
    
    // 1. 현재 로그인된 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ 사용자 정보 조회 실패:', userError);
      return;
    }
    
    if (!user) {
      console.log('❌ 로그인된 사용자가 없습니다.');
      return;
    }
    
    console.log('✅ 로그인된 사용자:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });
    
    // 2. 프로필 테이블에서 직접 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ 프로필 조회 실패:', profileError);
      
      // 프로필이 없는 경우
      if (profileError.code === 'PGRST116') {
        console.log('📝 프로필이 없습니다. 생성해야 합니다.');
        
        // 개발자 프로필 생성
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            discord_name: user.email?.split('@')[0] || 'User',
            ByID: `By_${user.email?.split('@')[0] || 'User'}`,
            role: 'developer', // 개발자 역할로 직접 설정
            Clan_Point: 100,
            race: 'Terran',
            intro: '시스템 개발자',
            Ladder_MMR: 1500,
            is_in_queue: false,
            vote_to_start: false
          }, { onConflict: 'id' })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ 프로필 생성 실패:', insertError);
        } else {
          console.log('✅ 개발자 프로필 생성 성공:', newProfile);
        }
      }
    } else {
      console.log('✅ 기존 프로필:', profile);
      
      // 역할이 developer가 아니면 수정
      if (profile.role !== 'developer') {
        console.log('🔧 역할을 developer로 수정합니다...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'developer' })
          .eq('id', user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ 역할 수정 실패:', updateError);
        } else {
          console.log('✅ 역할 수정 성공:', updatedProfile);
        }
      }
    }
    
    // 3. 최종 확인
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('🎯 최종 프로필 상태:', finalProfile);
    
  } catch (error) {
    console.error('❌ 프로필 확인 실패:', error);
  }
};

// 실행
checkMyProfile();
