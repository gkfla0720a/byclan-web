// 가입 프로세스 관리 시스템
// ByClan 단계별 가입 프로세스 자동화

export const JOIN_PROCESS = {
  // 단계별 상태 정의
  stages: {
    visitor: {
      name: '방문자',
      description: '로그인만 완료된 상태',
      nextStage: 'applicant',
      requirements: ['로그인'],
      restrictions: ['가입 신청 필요'],
      duration: null
    },
    applicant: {
      name: '신규 가입자',
      description: '가입 신청 후 테스트 대기',
      nextStage: 'rookie',
      requirements: ['가입 신청', '테스트 통과'],
      restrictions: ['테스트 대기'],
      duration: null
    },
    rookie: {
      name: '신입 길드원',
      description: '2주 활동 기간 (Discord 필수 연동)',
      nextStage: 'associate',
      requirements: ['Discord 연동', '2주 활동'],
      restrictions: ['래더 불가'],
      duration: 14 // 14일
    },
    associate: {
      name: '일반 길드원',
      description: '정식 클랜 멤버',
      nextStage: 'elite',
      requirements: ['2주 활동 완료'],
      restrictions: [],
      duration: null
    }
  },

  // 자동 승격 규칙
  autoPromotionRules: {
    rookie_to_associate: {
      daysRequired: 14,
      activityRequirements: {
        community_posts: 5,        // 커뮤니티 게시글 5개
        ladder_matches: 10,        // 래더 매치 10판 (Discord 연동 후)
        discord_linked: true       // Discord 연동 필수
      },
      checkInterval: 'daily'       // 매일 확인
    },
    
    applicant_to_rookie: {
      testRequired: true,
      testPassRate: 0.7,           // 70% 이상 통과
      manualApproval: true         // 관리자 수동 승인
    }
  },

  // Discord 연동 규칙
  discordRules: {
    requiredFor: ['rookie', 'associate', 'elite', 'admin', 'master'],
    benefits: {
      'rookie': '래더 시스템 접근',
      'associate': '클랜 채널 접근',
      'elite': '특별 역할 부여',
      'admin': '관리자 채널 접근'
    },
    restrictions: {
      'no_discord': {
        'rookie': '래더 시스템 접근 불가',
        'associate': '일부 기능 제한'
      }
    }
  }
};

// 가입 프로세스 관리 훅
export function useJoinProcess() {
  const checkPromotionEligibility = async (userId, currentRole) => {
    const rules = JOIN_PROCESS.autoPromotionRules[`${currentRole}_to_associate`];
    
    if (!rules) return { eligible: false, reason: '해당 역할의 승격 규칙이 없습니다' };

    try {
      // 활동 기간 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (!profile) return { eligible: false, reason: '프로필을 찾을 수 없습니다' };

      const daysSinceJoin = Math.floor(
        (new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceJoin < rules.daysRequired) {
        return { 
          eligible: false, 
          reason: `활동 기간 부족 (${daysSinceJoin}/${rules.daysRequired}일)` 
        };
      }

      // Discord 연동 확인
      const { data: discordProfile } = await supabase
        .from('profiles')
        .select('discord_id')
        .eq('id', userId)
        .single();

      if (!discordProfile?.discord_id && rules.activityRequirements.discord_linked) {
        return { eligible: false, reason: 'Discord 연동이 필요합니다' };
      }

      // 활동량 확인
      const [communityPosts, ladderMatches] = await Promise.all([
        supabase
          .from('posts')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - rules.daysRequired * 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('ladder_matches')
          .select('id')
          .contains('team_a_ids', [userId])
          .or(`team_b_ids.cs.{${userId}}`)
          .eq('status', '완료')
          .gte('created_at', new Date(Date.now() - rules.daysRequired * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const postsCount = communityPosts.data?.length || 0;
      const matchesCount = ladderMatches.data?.length || 0;

      if (postsCount < rules.activityRequirements.community_posts) {
        return { 
          eligible: false, 
          reason: `커뮤니티 게시글 부족 (${postsCount}/${rules.activityRequirements.community_posts}개)` 
        };
      }

      if (matchesCount < rules.activityRequirements.ladder_matches) {
        return { 
          eligible: false, 
          reason: `래더 매치 부족 (${matchesCount}/${rules.activityRequirements.ladder_matches}판)` 
        };
      }

      return { eligible: true, nextRole: 'associate' };

    } catch (error) {
      console.error('승격 자격 확인 실패:', error);
      return { eligible: false, reason: '시스템 오류가 발생했습니다' };
    }
  };

  const promoteUser = async (userId, newRole, promotedBy = null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          promoted_at: new Date().toISOString(),
          promoted_by: promotedBy
        })
        .eq('id', userId);

      if (error) throw error;

      // 승격 로그 기록
      await supabase
        .from('promotion_logs')
        .insert({
          user_id: userId,
          old_role: currentRole,
          new_role: newRole,
          promoted_by: promotedBy,
          promoted_at: new Date().toISOString()
        });

      return { success: true };
    } catch (error) {
      console.error('승격 처리 실패:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    checkPromotionEligibility,
    promoteUser
  };
}

// 가입 신청 처리 시스템
export function useApplicationProcess() {
  const submitApplication = async (userId, applicationData) => {
    try {
      // 기존 신청 확인
      const { data: existingApp } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['대기', '테스트중'])
        .single();

      if (existingApp) {
        return { success: false, error: '이미 진행 중인 신청이 있습니다' };
      }

      // 신청서 생성
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: userId,
          ...applicationData,
          status: '대기',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // 사용자 역할을 신규 가입자로 변경
      await supabase
        .from('profiles')
        .update({ role: 'applicant' })
        .eq('id', userId);

      return { success: true, data };
    } catch (error) {
      console.error('가입 신청 실패:', error);
      return { success: false, error: error.message };
    }
  };

  const processTestResult = async (applicationId, result, testerId) => {
    try {
      const { data: application } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!application) {
        return { success: false, error: '신청서를 찾을 수 없습니다' };
      }

      const passRate = result.score / result.totalScore;
      const passed = passRate >= JOIN_PROCESS.autoPromotionRules.applicant_to_rookie.testPassRate;

      // 신청서 상태 업데이트
      await supabase
        .from('applications')
        .update({
          status: passed ? '합격' : '불합격',
          test_result: result,
          tester_id: testerId,
          processed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (passed) {
        // 신입 길드원으로 승격
        await supabase
          .from('profiles')
          .update({ role: 'rookie' })
          .eq('id', application.user_id);

        return { success: true, promoted: true };
      } else {
        return { success: true, promoted: false };
      }
    } catch (error) {
      console.error('테스트 결과 처리 실패:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    submitApplication,
    processTestResult
  };
}

// Discord 연동 확인 훅
export function useDiscordIntegration() {
  const checkDiscordRequired = (userRole) => {
    return JOIN_PROCESS.discordRules.requiredFor.includes(userRole);
  };

  const checkDiscordLinked = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('discord_id, discord_name')
        .eq('id', userId)
        .single();

      return {
        linked: !!data?.discord_id,
        discordName: data?.discord_name
      };
    } catch (error) {
      console.error('Discord 연동 확인 실패:', error);
      return { linked: false, discordName: null };
    }
  };

  const enforceDiscordRequirement = (userRole, isDiscordLinked) => {
    if (checkDiscordRequired(userRole) && !isDiscordLinked) {
      return {
        enforced: true,
        message: '이 기능을 사용하려면 Discord 연동이 필요합니다',
        actions: ['Discord 연동하기']
      };
    }

    return { enforced: false };
  };

  return {
    checkDiscordRequired,
    checkDiscordLinked,
    enforceDiscordRequirement
  };
}
