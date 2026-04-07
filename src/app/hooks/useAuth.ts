/**
 * =====================================================================
 * 파일명: src/app/hooks/useAuth.ts
 * 역할  : ByClan 웹앱의 핵심 인증(Authentication) 훅입니다.
 *         로그인/로그아웃 상태, 사용자 프로필, 권한 정보를 관리합니다.
 *
 * ■ 주요 기능
 *   1. 로그인/로그아웃 상태 추적 (Supabase Auth 연동)
 *   2. 사용자 프로필 로드 및 자동 생성 (신규 가입자)
 *   3. Discord 계정 연동 감지 및 자동 업데이트
 *   4. 역할/권한 계산 (getPermissions 함수)
 *   5. 홈 게이트(비밀번호 인증) 상태 관리
 *   6. 진행 중인 래더 매치 확인
 *
 * ■ 사용 방법
 *   이 훅은 직접 사용하지 말고, AuthContext를 통해 접근하세요.
 *   import { useAuthContext } from '@/app/context/AuthContext';
 *   const { profile, getPermissions, reloadProfile } = useAuthContext();
 *
 * ■ 반환하는 주요 상태
 *   profile:      현재 로그인한 사용자의 프로필 정보 (역할, 포인트 등)
 *   user:         Supabase Auth 사용자 객체 (이메일, UUID 등)
 *   authLoading:  인증 상태 로딩 중 여부
 *   authError:    인증 오류 메시지 (4초 후 자동 삭제)
 *   needsSetup:   프로필 설정이 필요한지 여부
 *   getPermissions(): 현재 사용자의 모든 권한 정보 반환
 *   reloadProfile():  DB에서 최신 프로필 다시 불러오기
 *
 * ■ TypeScript 타입 정의
 *   UserProfile:    profiles DB 테이블 형태
 *   AuthPermissions: getPermissions() 반환 타입
 *   UseAuthReturn:  이 훅의 전체 반환 타입
 * =====================================================================
 */
import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';
import { withRetry, isRetryableError } from '../utils/retry';
import logger, { Severity } from '../utils/errorLogger';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * UserProfile
 * - Supabase의 profiles 테이블 한 행(row)에 해당하는 타입입니다.
 * - 각 필드 설명:
 *   id:             Supabase Auth의 사용자 UUID (기본 키)
 *   ByID:           클랜 내 고유 닉네임 (예: 'By_홍길동')
 *   discord_name:   Discord 사용자 이름 (Discord 로그인 시 자동 설정)
 *   discord_id:     Discord 고유 ID (래더 참여 시 필요)
 *   role:           클랜 역할 (visitor/applicant/rookie/member/elite/admin/master/developer)
 *   points:         클랜 활동 포인트
 *   race:           스타크래프트 종족 (Terran/Zerg/Protoss)
 *   intro:          자기소개 문구
 *   ladder_points:  래더 레이팅 포인트 (기본값: 1000)
 *   is_in_queue:    현재 래더 대기열에 있는지 여부
 *   vote_to_start:  래더 시작 투표 여부
 *   wins:           래더 승리 수 (선택)
 *   losses:         래더 패배 수 (선택)
 *   queue_joined_at: 대기열 합류 시간 (선택)
 */

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

/**
 * AuthPermissions
 * - getPermissions() 함수가 반환하는 현재 사용자의 권한 정보 타입입니다.
 * - 각 필드 설명:
 *   isDeveloper:    개발자 역할 여부
 *   isManagement:   운영진(developer/master/admin) 여부
 *   isSenior:       시니어(developer/master/admin/elite) 여부
 *   isMember:       정식 클랜원(member 이상) 여부
 *   level:          역할 레벨 숫자 (0~100)
 *   roleInfo:       ROLE_PERMISSIONS에서 가져온 역할 상세 정보
 *   can:            개별 행동 가능 여부 플래그 모음
 *     manageUsers:         모든 유저 관리 가능 여부
 *     manageClan:          클랜 설정 관리 가능 여부
 *     approveMembers:      가입 신청 승인 가능 여부
 *     manageMatches:       매치 관리 가능 여부
 *     hostMatches:         매치 개최 가능 여부
 *     postAnnouncements:   공지 게시 가능 여부
 *     accessDevTools:      개발자 도구 접근 가능 여부
 *     moderateLadder:      래더 중재 가능 여부
 *     playLadder:          래더 플레이 가능 여부
 *   canAccessMenu(menuPath): 특정 메뉴 접근 가능한지 확인하는 함수
 *   hasLevel(requiredLevel): 최소 레벨을 충족하는지 확인하는 함수
 */
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
  const [password, setPassword] = useState('');
  const [isAuthorizedState, setIsAuthorizedState] = useState(false);
  const [homeGateReady, setHomeGateReady] = useState(false);

  // Auto-clear authError after 4 seconds
  useEffect(() => {
    if (!authError) return;
    const timer = setTimeout(() => setAuthError(null), 4000);
    return () => clearTimeout(timer);
  }, [authError]);

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
    if (['member', 'elite', 'admin', 'master', 'developer'].includes(nextProfile.role)) {
      try {
        const { data: m, error: matchError } = await supabase
          .from('ladder_matches')
          .select('id')
          .eq('status', '진행중')
          .or(`team_a_ids.cs.{${authUser.id}},team_b_ids.cs.{${authUser.id}}`)
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

  // Grants HomeGate access for authenticated users so that board, ranking,
  // and member sections are visible without re-entering the password.
  const ensureHomeGateAuthorized = () => {
    if (window.sessionStorage.getItem('byclan_home_gate') !== 'authorized') {
      window.sessionStorage.setItem('byclan_home_gate', 'authorized');
      setIsAuthorizedState(true);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (!isSupabaseConfigured) {
          setAuthLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Logged-in users automatically pass the HomeGate so they are not
          // shown the password prompt when opening the site in a new tab while
          // already authenticated.
          ensureHomeGateAuthorized();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setActiveMatchId(null);
        return;
      }
      if (session?.user) {
        // Auto-pass the HomeGate for users who sign in so that board,
        // ranking, and member sections become immediately visible.
        ensureHomeGateAuthorized();
        try {
          await loadUserData(session.user as unknown as Record<string, unknown>);
        } catch (error) {
          logger.error('인증 상태 갱신 실패', error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getPermissions = (): AuthPermissions => {
    const profileRole = profile?.role;
    const userRole = profileRole?.trim().toLowerCase();
    const roleInfo = userRole ? (ROLE_PERMISSIONS as Record<string, unknown>)[userRole] : null;
    const baseLadderPermission = PermissionChecker.hasPermission(userRole, 'ladder.play');

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
        playLadder: baseLadderPermission,
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
