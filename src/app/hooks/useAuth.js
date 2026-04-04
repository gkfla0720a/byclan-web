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

  useEffect(() => {
    if (!isAuthorized) return;
    
    const initializeData = async () => {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!authUser) return;

        setUser(authUser);

        const { data: p, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (profileError) {
          // 프로필이 없으면 방문자 상태 (기본 프로필 생성)
          if (profileError.code === 'PGRST116') {
            await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                discord_name: authUser.email?.split('@')[0] || 'User',
                ByID: `By_${authUser.email?.split('@')[0] || 'User'}`,
                role: 'visitor', // 방문자 역할로 시작
                points: 0,
                race: 'Terran',
                intro: '클랜 방문자',
                ladder_points: 1000,
                is_in_queue: false,
                vote_to_start: false
              });
            
            setNeedsSetup(false); // 방문자는 별도 설정 불필요
            return;
          }
          throw profileError;
        }
        
        setProfile(p);
        
        // 방문자인지 확인
        if (p.role === 'visitor') {
          setNeedsSetup(false);
          return;
        }
        
        // 신규 가입자인지 확인
        if (p.role === 'applicant') {
          setNeedsSetup(false);
          return;
        }
        
        setNeedsSetup(false); // 기타 역할은 설정 불필요

        const { data: m, error: matchError } = await supabase
          .from('ladder_matches')
          .select('id')
          .eq('status', '진행중')
          .or(`team_a.cs.${authUser.id},team_b.cs.${authUser.id}`)
          .maybeSingle();
        
        if (matchError) throw matchError;
        if (m) setActiveMatchId(m.id);
      } catch (error) {
        console.error('인증 데이터 초기화 실패:', error);
      }
    };
    
    initializeData();
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
    const userRole = profile?.role?.trim().toLowerCase();
    const roleInfo = ROLE_PERMISSIONS[userRole];
    
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
      canAccessMenu: (menuPath) => PermissionChecker.canAccessMenu(userRole, menuPath),
      
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
