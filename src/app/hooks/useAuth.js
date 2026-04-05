import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS, loadDevSettings } from '../utils/permissions';

function getDiscordIdentity(authUser) {
  const identities = authUser?.identities || [];
  const discordIdentity = identities.find((identity) => identity.provider === 'discord');
  const isDiscordProvider =
    authUser?.app_metadata?.provider === 'discord' ||
    authUser?.user_metadata?.provider === 'discord' ||
    Boolean(discordIdentity);

  return {
    isDiscordProvider,
    discordId:
      authUser?.user_metadata?.provider_id ||
      authUser?.user_metadata?.sub ||
      discordIdentity?.identity_id ||
      discordIdentity?.id ||
      null,
    discordName:
      authUser?.user_metadata?.preferred_username ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split('@')[0] ||
      'User'
  };
}

export function useAuth() {
  const [profile, setProfile] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthorizedState, setIsAuthorizedState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('byclan_home_gate') === 'authorized';
  });

  const loadUserData = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    setUser(authUser);
    const { isDiscordProvider, discordId, discordName } = getDiscordIdentity(authUser);

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
            discord_name: discordName,
            discord_id: isDiscordProvider ? discordId : null,
            ByID: `By_${authUser.email?.split('@')[0] || discordName || 'User'}`,
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

    let nextProfile = p;

    if (isDiscordProvider && (!p.discord_id || !p.discord_name)) {
      const updates = {
        ...(p.discord_name ? {} : { discord_name: discordName }),
        ...(p.discord_id ? {} : { discord_id: discordId })
      };

      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', authUser.id)
          .select('*')
          .single();

        if (!updateError && updatedProfile) {
          nextProfile = updatedProfile;
        }
      }
    }

    setProfile(nextProfile);

    if (nextProfile.role === 'visitor' || nextProfile.role === 'applicant') {
      setNeedsSetup(false);
      setAuthLoading(false);
      return;
    }

    setNeedsSetup(false);

    // 진행 중인 래더 매치 확인 (정식 멤버만)
    if (['associate', 'elite', 'admin', 'master', 'developer'].includes(nextProfile.role)) {
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
    const devSettings = loadDevSettings();
    const baseLadderPermission = PermissionChecker.hasPermission(userRole, 'ladder.play');
    const requiresDiscordLink = Boolean(
      baseLadderPermission &&
      devSettings.requireDiscordForLadder &&
      !profile?.discord_id
    );

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
        playLadder: baseLadderPermission && !requiresDiscordLink,
        requiresDiscordLink
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

  const setIsAuthorized = (value) => {
    setIsAuthorizedState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem('byclan_home_gate', 'authorized');
      } else {
        window.localStorage.removeItem('byclan_home_gate');
      }
    }
  };

  return {
    // Legacy password gate fields restored for homepage security gate
    password,
    setPassword,
    isAuthorized: isAuthorizedState,
    setIsAuthorized,
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
