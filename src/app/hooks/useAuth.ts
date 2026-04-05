import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS, loadDevSettings } from '../utils/permissions';
import {
  TEST_ACCOUNT_SETTING_EVENT,
  TEST_ACCOUNT_SETTING_KEY,
  shouldBypassDiscordForTestAccount,
} from '../utils/testData';
import { withRetry, isRetryableError } from '../utils/retry';
import logger, { Severity } from '../utils/errorLogger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  ByID: string;
  discord_name: string | null;
  discord_id: string | null;
  role: string;
  points: number;
  race: string;
  intro: string;
  ladder_points: number;
  is_in_queue: boolean;
  vote_to_start: boolean;
  wins?: number;
  losses?: number;
  queue_joined_at?: string | null;
  [key: string]: unknown;
}

export interface AuthPermissions {
  isDeveloper: boolean;
  isManagement: boolean;
  isSenior: boolean;
  isMember: boolean;
  level: number;
  roleInfo: Record<string, unknown> | null;
  can: {
    manageUsers: boolean;
    manageClan: boolean;
    approveMembers: boolean;
    manageMatches: boolean;
    hostMatches: boolean;
    postAnnouncements: boolean;
    accessDevTools: boolean;
    moderateLadder: boolean;
    playLadder: boolean;
    requiresDiscordLink: boolean;
    discordBypassAllowed: boolean;
  };
  canAccessMenu: (menuPath: string) => boolean;
  hasLevel: (requiredLevel: number) => boolean;
}

export interface UseAuthReturn {
  // Home-gate fields
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  isAuthorized: boolean;
  homeGateReady: boolean;
  setIsAuthorized: (value: boolean) => void;
  // Auth state
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  activeMatchId: string | null;
  setActiveMatchId: React.Dispatch<React.SetStateAction<string | null>>;
  user: Record<string, unknown> | null;
  setUser: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  needsSetup: boolean;
  setNeedsSetup: React.Dispatch<React.SetStateAction<boolean>>;
  authLoading: boolean;
  authError: string | null;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  getPermissions: () => AuthPermissions;
  handleAuthSuccess: (authUser: Record<string, unknown>) => void;
  handleSetupComplete: () => void;
  reloadProfile: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDiscordIdentity(authUser: Record<string, unknown>) {
  const identities = (authUser?.identities as { provider: string; identity_id?: string; id?: string }[]) || [];
  const discordIdentity = identities.find((identity) => identity.provider === 'discord');
  const meta = authUser?.user_metadata as Record<string, unknown> | undefined;
  const appMeta = authUser?.app_metadata as Record<string, unknown> | undefined;

  const isDiscordProvider =
    appMeta?.provider === 'discord' ||
    meta?.provider === 'discord' ||
    !!discordIdentity;

  return {
    isDiscordProvider,
    discordId:
      (meta?.provider_id as string) ||
      (meta?.sub as string) ||
      discordIdentity?.identity_id ||
      discordIdentity?.id ||
      null,
    discordName:
      (meta?.preferred_username as string) ||
      (meta?.full_name as string) ||
      (meta?.name as string) ||
      ((authUser?.email as string)?.split('@')[0]) ||
      'User',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): UseAuthReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [testAccountsEnabled, setTestAccountsEnabled] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthorizedState, setIsAuthorizedState] = useState(false);
  const [homeGateReady, setHomeGateReady] = useState(false);

  // Auto-clear authError after 4 seconds
  useEffect(() => {
    if (!authError) return;
    const timer = setTimeout(() => setAuthError(null), 4000);
    return () => clearTimeout(timer);
  }, [authError]);

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
          logger.error('시스템 설정 로드 실패', error, { severity: Severity.WARNING });
        }
        setTestAccountsEnabled(true);
        return;
      }

      setTestAccountsEnabled(data?.value_bool !== false);
    } catch (error) {
      logger.error('시스템 설정 초기화 실패', error);
      setTestAccountsEnabled(true);
    }
  };

  const loadUserData = async (authUser: Record<string, unknown>) => {
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
            ByID: `By_${(authUser.email as string)?.split('@')[0] || discordName || 'User'}`,
            role: 'visitor',
            points: 0,
            race: 'Terran',
            intro: '클랜 방문자',
            ladder_points: 1000,
            is_in_queue: false,
            vote_to_start: false,
          });

        if (insertError) {
          logger.error('프로필 생성 실패', insertError, { severity: Severity.CRITICAL });
          setAuthLoading(false);
          throw insertError;
        }

        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setProfile(newProfile as UserProfile);
        setNeedsSetup(false);
        setAuthLoading(false);
        return;
      }
      setAuthLoading(false);
      throw profileError;
    }

    let nextProfile: UserProfile = p as UserProfile;

    if (isDiscordProvider && (!p.discord_id || !p.discord_name)) {
      const updates: Record<string, string> = {};
      if (!p.discord_name) updates.discord_name = discordName;
      if (!p.discord_id && discordId) updates.discord_id = discordId;

      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', authUser.id)
          .select('*')
          .single();

        if (!updateError && updatedProfile) {
          nextProfile = updatedProfile as UserProfile;
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
          setActiveMatchId((m as { id: string }).id);
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
          await loadUserData(session.user as unknown as Record<string, unknown>);
        } else {
          setAuthLoading(false);
        }
      } catch (error) {
        logger.error('인증 초기화 실패', error);
        setAuthLoading(false);
      }
    };

    initializeData();

    const handleTestAccountSettingChanged = (event: Event) => {
      setTestAccountsEnabled((event as CustomEvent)?.detail !== false);
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
          await loadUserData(session.user as unknown as Record<string, unknown>);
        } catch (error) {
          logger.error('인증 상태 갱신 실패', error);
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

  const getPermissions = (): AuthPermissions => {
    const profileRole = profile?.role;
    const userRole = profileRole?.trim().toLowerCase();
    const roleInfo = userRole ? (ROLE_PERMISSIONS as Record<string, unknown>)[userRole] : null;
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
      level: (roleInfo as { level?: number })?.level || 0,
      roleInfo: roleInfo as Record<string, unknown> | null,
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
        discordBypassAllowed,
      },
      canAccessMenu: (menuPath: string) => PermissionChecker.canAccessMenu(userRole, menuPath),
      hasLevel: (requiredLevel: number) => PermissionChecker.hasLevel(userRole, requiredLevel),
    };
  };

  const handleAuthSuccess = (authUser: Record<string, unknown>) => {
    setUser(authUser);
  };

  const handleSetupComplete = () => {
    setNeedsSetup(false);
    if (user) {
      const loadProfile = async () => {
        try {
          const result = await withRetry(() =>
            Promise.resolve(supabase.from('profiles').select('*').eq('id', user.id).single())
          ) as { data: UserProfile | null; error: unknown };
          const { data, error } = result;
          if (error) {
            logger.error('프로필 로드 실패 (설정 완료 후)', error);
            if (!isRetryableError(error)) {
              setAuthError('프로필을 불러오는 데 실패했습니다.');
            }
            return;
          }
          if (data) setProfile(data);
        } catch (error) {
          logger.error('프로필 로드 중 오류 발생', error);
          setAuthError('프로필을 불러오는 데 실패했습니다.');
        }
      };
      loadProfile();
    }
  };

  const setIsAuthorized = (value: boolean) => {
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
      const result = await withRetry(
        () => Promise.resolve(supabase.from('profiles').select('*').eq('id', user.id).single()),
        {
          onRetry: (attempt: number, delay: number) => {
            logger.info(`프로필 재로드 재시도 ${attempt}회 (${delay}ms 후)`);
          },
        }
      ) as { data: UserProfile | null; error: unknown };
      const { data, error } = result;
      if (error) {
        logger.error('프로필 재로드 실패', error);
        if (!isRetryableError(error)) {
          setAuthError('프로필을 새로고침하는 데 실패했습니다.');
        }
        return;
      }
      if (data) setProfile(data);
    } catch (error) {
      logger.error('프로필 재로드 중 오류 발생', error);
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
