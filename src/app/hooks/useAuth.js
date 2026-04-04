import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';

export function useAuth() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const CORRECT_PASSWORD = process.env.DEV_ACCESS_PASSWORD || "1990";

  const loadUserData = async (authUser) => {
    if (!authUser) return;

    setUser(authUser);

    const { data: p, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // 디버그 로그
    console.log('🔍 프로필 로딩 시도:', {
      userId: authUser.id,
      profileData: p,
      profileError,
      errorCode: profileError?.code
    });

    if (profileError) {
      // 프로필이 없으면 방문자 상태 (기본 프로필 생성)
      if (profileError.code === 'PGRST116') {
        console.log('📝 프로필 없음 - visitor 생성 중...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            discord_name: authUser.email?.split('@')[0] || 'User',
            ByID: `By_${authUser.email?.split('@')[0] || 'User'}`,
            role: 'visitor',
            points: 0,
            race: 'Terran',
            intro: '클랜 방문자',
            ladder_points: 1000,
            is_in_queue: false,
            vote_to_start: false
          });

        if (insertError) {
          console.error('프로필 생성 실패:', insertError);
          throw insertError;
        }

        console.log('✅ visitor 프로필 생성 성공');

        // 생성된 프로필 다시 로드
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setProfile(newProfile);
        setNeedsSetup(false);
        return;
      }
      throw profileError;
    }

    console.log('✅ 프로필 로드 성공:', p);
    setProfile(p);

    // 방문자/신규 가입자 처리
    if (p.role === 'visitor' || p.role === 'applicant') {
      setNeedsSetup(false);
      return;
    }

    setNeedsSetup(false);

    // 래더 매치 확인은 정식 멤버만
    if (['associate', 'elite', 'admin', 'master', 'developer'].includes(p.role)) {
      try {
        const { data: m, error: matchError } = await supabase
          .from('ladder_matches')
          .select('id')
          .eq('status', '진행중')
          .contains('team_a_ids', [authUser.id])
          .or(`team_b_ids.cs.{${authUser.id}}`)
          .maybeSingle();

        if (matchError) {
          console.log('래더 매치 확인 실패 (정상):', matchError.message);
        } else if (m) {
          setActiveMatchId(m.id);
        }
      } catch (matchError) {
        console.log('래더 매치 확인 중 오류:', matchError.message);
      }
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    
    const initializeData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) return;

        await loadUserData(session.user);
      } catch (error) {
        // 인증 관련 오류는 정상적인 상황일 수 있음
        if (error.message.includes('Auth session missing') || 
            error.message.includes('column ladder_matches.team_a') ||
            error.message.includes('malformed array literal') ||
            error.message.includes('22P02')) {
          console.log('인증 초기화 상태:', error.message);
        } else {
          console.error('인증 데이터 초기화 실패:', error);
        }
      }
    };
    
    initializeData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setActiveMatchId(null);
        return;
      }

      if (session?.user) {
        try {
          await loadUserData(session.user);
        } catch (error) {
          console.error('인증 상태 갱신 실패:', error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthorized]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  };

  const getPermissions = () => {
    const profileRole = profile?.role;
    const userRole = profileRole?.trim().toLowerCase();
    const roleInfo = ROLE_PERMISSIONS[userRole];
    
    // 디버그 로그
    console.log('🔍 권한 계산:', {
      profile,              // 전체 profile 상태 확인
      profileRole,
      userRole,
      roleInfo,
      isDeveloper: userRole === 'developer',
      availableRoles: Object.keys(ROLE_PERMISSIONS),
      profileData: profile   // profileData와 profile가 같은지 확인
    });
    
    return {
      // 기본 권한 그룹
      isDeveloper: userRole === 'developer',
      isManagement: PermissionChecker.isInGroup(userRole, 'management'),
      isSenior: PermissionChecker.isInGroup(userRole, 'senior'),
      isMember: PermissionChecker.isInGroup(userRole, 'members'),
      
      // 레벨 기반 권한
      level: roleInfo?.level || 0,
      roleInfo: roleInfo || null,
      
      // 특정 권한 확인 함수들
      can: {
        manageUsers: PermissionChecker.hasPermission(userRole, 'user.manage_all'),
        manageClan: PermissionChecker.hasPermission(userRole, 'clan.admin'),
        approveMembers: PermissionChecker.hasPermission(userRole, 'member.approve'),
        manageMatches: PermissionChecker.hasPermission(userRole, 'match.manage'),
        hostMatches: PermissionChecker.hasPermission(userRole, 'match.host'),
        postAnnouncements: PermissionChecker.hasPermission(userRole, 'announcement.post'),
        accessDevTools: PermissionChecker.hasPermission(userRole, 'system.admin'),
        moderateLadder: PermissionChecker.hasPermission(userRole, 'ladder.admin'),
        playLadder: PermissionChecker.hasPermission(userRole, 'ladder.play')
      },
      
      // 메뉴 접근 권한
      canAccessMenu: (menuPath) => {
        const result = PermissionChecker.canAccessMenu(userRole, menuPath);
        console.log('🔍 메뉴 접근 권한:', { userRole, menuPath, result });
        return result;
      },
      
      // 권한 레벨 비교
      hasLevel: (requiredLevel) => PermissionChecker.hasLevel(userRole, requiredLevel)
    };
  };

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    // 프로필 확인은 useEffect에서 자동으로 처리됨
  };

  const handleSetupComplete = () => {
    setNeedsSetup(false);
    // 프로필 다시 로드
    if (user) {
      const loadProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      loadProfile();
    }
  };

  return {
    password,
    setPassword,
    isAuthorized,
    setIsAuthorized,
    profile,
    setProfile,
    activeMatchId,
    setActiveMatchId,
    user,
    setUser,
    needsSetup,
    setNeedsSetup,
    handleLogin,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete
  };
}
