import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS, loadDevSettings } from '../utils/permissions';
import {
  TEST_ACCOUNT_SETTING_EVENT,
  TEST_ACCOUNT_SETTING_KEY,
  shouldBypassDiscordForTestAccount,
} from '../utils/testData';

function getDiscordIdentity(authUser) {
  const identities = authUser?.identities || [];
  const discordIdentity = identities.find((identity) => identity.provider === 'discord');
  const isDiscordProvider =
    authUser?.app_metadata?.provider === 'discord' ||
    authUser?.user_metadata?.provider === 'discord' ||
    !!discordIdentity;

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
  const [authError, setAuthError] = useState(null);
  const [testAccountsEnabled, setTestAccountsEnabled] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthorizedState, setIsAuthorizedState] = useState(false);
  const [homeGateReady, setHomeGateReady] = useState(false);

  const loadServerSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value_bool')
        .eq('key', TEST_ACCOUNT_SETTING_KEY)
        .maybeSingle();

      if (error) {
        const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
        if (error.code !== '42P01' && !message.includes('does not exist')) {
          console.error('시스템 설정 로드 실패:', error);
        }
        setTestAccountsEnabled(true);
        return;
      }

      setTestAccountsEnabled(data?.value_bool !== false);
    } catch (error) {
      console.error('시스템 설정 초기화 실패:', error);
      setTestAccountsEnabled(true);
    }
  };

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
            discord_name: isDiscordProvider ? discordName : null,
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
      const updates = {};

      if (!p.discord_name) {
        updates.discord_name = discordName;
      }

      if (!p.discord_id) {
        updates.discord_id = discordId;
      }

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
    if (['member', 'associate', 'elite', 'admin', 'master', 'developer'].includes(nextProfile.role)) {
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
    if (typeof window !== 'undefined') {
      const sessionAuthorized = window.sessionStorage.getItem('byclan_home_gate') === 'authorized';
      if (!sessionAuthorized) {
        window.localStorage.removeItem('byclan_home_gate');
      }
      setIsAuthorizedState(sessionAuthorized);
      setHomeGateReady(true);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (!isSupabaseConfigured) {
          setAuthLoading(false);
          return;
        }

        await loadServerSettings();
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

    const handleTestAccountSettingChanged = (event) => {
      setTestAccountsEnabled(event?.detail !== false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(TEST_ACCOUNT_SETTING_EVENT, handleTestAccountSettingChanged);
    }

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
      if (typeof window !== 'undefined') {
        window.removeEventListener(TEST_ACCOUNT_SETTING_EVENT, handleTestAccountSettingChanged);
      }
      subscription.unsubscribe();
    };
  }, []);

  const getPermissions = () => {
    const profileRole = profile?.role;
    const userRole = profileRole?.trim().toLowerCase();
    const roleInfo = ROLE_PERMISSIONS[userRole];
    const devSettings = loadDevSettings();
    const baseLadderPermission = PermissionChecker.hasPermission(userRole, 'ladder.play');
    const discordBypassAllowed = shouldBypassDiscordForTestAccount(profile, testAccountsEnabled);
    const requiresDiscordLink = Boolean(
      baseLadderPermission &&
      devSettings.requireDiscordForLadder &&
      !discordBypassAllowed &&
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
        requiresDiscordLink,
        discordBypassAllowed
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
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (error) {
            console.error('프로필 로드 실패 (설정 완료 후):', error);
            setAuthError('프로필을 불러오는 데 실패했습니다.');
            return;
          }
          if (data) setProfile(data);
        } catch (error) {
          console.error('프로필 로드 중 오류 발생:', error);
          setAuthError('프로필을 불러오는 데 실패했습니다.');
        }
      };
      loadProfile();
    }
  };

  const setIsAuthorized = (value) => {
    setIsAuthorizedState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.sessionStorage.setItem('byclan_home_gate', 'authorized');
        window.localStorage.removeItem('byclan_home_gate');
      } else {
        window.sessionStorage.removeItem('byclan_home_gate');
        window.localStorage.removeItem('byclan_home_gate');
      }
    }
  };

  const reloadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('프로필 재로드 실패:', error);
        setAuthError('프로필을 새로고침하는 데 실패했습니다.');
        return;
      }
      if (data) setProfile(data);
    } catch (error) {
      console.error('프로필 재로드 중 오류 발생:', error);
      setAuthError('프로필을 새로고침하는 데 실패했습니다.');
    }
  };

  return {
    // Password gate fields for homepage security gate
    password,
    setPassword,
    isAuthorized: isAuthorizedState,
    homeGateReady,
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
    authError,
    setAuthError,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete,
    reloadProfile,
  };
}
