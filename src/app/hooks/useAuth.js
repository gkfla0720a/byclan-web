import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';

export function useAuth() {
  const [profile, setProfile] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUserData = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    setUser(authUser);

    const { data: p, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // 프로필 없음 – visitor 기본 프로필 생성
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
          setAuthLoading(false);
          throw insertError;
        }

        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setProfile(newProfile);
        setNeedsSetup(false);
        setAuthLoading(false);
        return;
      }
      setAuthLoading(false);
      throw profileError;
    }

    setProfile(p);

    if (p.role === 'visitor' || p.role === 'applicant') {
      setNeedsSetup(false);
      setAuthLoading(false);
      return;
    }

    setNeedsSetup(false);

    // 진행 중인 래더 매치 확인 (정식 멤버만)
    if (['associate', 'elite', 'admin', 'master', 'developer'].includes(p.role)) {
      try {
        const { data: m, error: matchError } = await supabase
          .from('ladder_matches')
          .select('id')
          .eq('status', '진행중')
          .contains('team_a_ids', [authUser.id])
          .or(`team_b_ids.cs.{${authUser.id}}`)
          .maybeSingle();

        if (!matchError && m) {
          setActiveMatchId(m.id);
        }
      } catch {
        // 래더 매치 확인 실패는 무시
      }
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        setAuthLoading(false);
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
  }, []);

  const getPermissions = () => {
    const profileRole = profile?.role;
    const userRole = profileRole?.trim().toLowerCase();
    const roleInfo = ROLE_PERMISSIONS[userRole];

    return {
      isDeveloper: userRole === 'developer',
      isManagement: PermissionChecker.isInGroup(userRole, 'management'),
      isSenior: PermissionChecker.isInGroup(userRole, 'senior'),
      isMember: PermissionChecker.isInGroup(userRole, 'members'),
      level: roleInfo?.level || 0,
      roleInfo: roleInfo || null,
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
      canAccessMenu: (menuPath) => PermissionChecker.canAccessMenu(userRole, menuPath),
      hasLevel: (requiredLevel) => PermissionChecker.hasLevel(userRole, requiredLevel)
    };
  };

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
  };

  const handleSetupComplete = () => {
    setNeedsSetup(false);
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
    // Legacy password gate fields kept for backward compatibility but always true
    password: '',
    setPassword: () => {},
    isAuthorized: true,
    setIsAuthorized: () => {},
    // ─────────────────────────────────────────────
    profile,
    setProfile,
    activeMatchId,
    setActiveMatchId,
    user,
    setUser,
    needsSetup,
    setNeedsSetup,
    authLoading,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete
  };
}
