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
import { useState, useEffect, useRef } from 'react';
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
 *   discord_id:     Discord 고유 ID (Discord OAuth 연동 시 저장, 현재 미사용)
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
  /** ByID가 비어있거나 없을 때 true. 프로필 설정 페이지로 유도하는 데 사용됩니다. */
  needsByIDSetup: boolean;
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

  // ByID 재확인 진행 상태를 추적하는 ref입니다.
  // state가 아닌 ref를 사용하여 불필요한 재렌더링을 방지합니다.
  const byIDRecheckRef = useRef<'idle' | 'checking'>('idle');
  const [password, setPassword] = useState('');

  // HomeGate 인증 상태를 sessionStorage에서 lazy하게 초기화합니다.
  // useEffect 내 setState 대신 lazy initializer를 사용하여 불필요한 재렌더링을 피합니다.
  const [isAuthorizedState, setIsAuthorizedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const sessionAuthorized = window.sessionStorage.getItem('byclan_home_gate') === 'authorized';
    if (!sessionAuthorized) {
      window.localStorage.removeItem('byclan_home_gate');
    }
    return sessionAuthorized;
  });
  const [homeGateReady, setHomeGateReady] = useState<boolean>(() => typeof window !== 'undefined');

  // ─── ByID 유효성 파생 ──────────────────────────────────────────────────────
  // needsByIDSetup은 profile에서 직접 파생되는 계산값입니다. (별도 state 불필요)
  // profile이 null이면 아직 로딩 중이므로 false로 처리합니다.
  const needsByIDSetup = profile !== null && !(profile.ByID && profile.ByID.trim() !== '');

  // Auto-clear authError after 4 seconds
  useEffect(() => {
    if (!authError) return;
    const timer = setTimeout(() => setAuthError(null), 4000);
    return () => clearTimeout(timer);
  }, [authError]);

  // ─── ByID 안전 재확인 + 자동 로그아웃 ────────────────────────────────────
  // ByID가 없어 보일 때 즉시 판단하지 않고, 아래 순서로 처리합니다.
  //   1. 1500ms 대기 (화면 전환·일시적 상태 무시)
  //   2. DB에서 직접 ByID를 재조회
  //   3. 재조회에서도 없으면: 에러 메시지 → 3초 후 로그아웃 + 페이지 새로고침
  //   4. 재조회에서 있으면: 전체 프로필을 다시 로드하고 정상 처리
  useEffect(() => {
    if (!user || !profile || authLoading) {
      byIDRecheckRef.current = 'idle';
      return;
    }

    const hasValidByID = !!(profile.ByID && profile.ByID.trim() !== '');
    // ByID가 유효하면 재확인 상태를 초기화하고 종료합니다.
    if (hasValidByID) {
      byIDRecheckRef.current = 'idle';
      return;
    }
    // 이미 재확인 중이면 중복 실행하지 않습니다.
    if (byIDRecheckRef.current !== 'idle') return;

    byIDRecheckRef.current = 'checking';

    const runRecheck = async () => {
      // 화면 전환 등 일시적 상태 변화를 충분히 기다립니다.
      await new Promise<void>(resolve => setTimeout(resolve, 1500));

      const userId = (user as { id: string }).id;

      // DB에서 최신 ByID를 직접 조회합니다.
      const { data: fresh } = await supabase
        .from('profiles')
        .select('ByID')
        .eq('id', userId)
        .single();

      const freshHasValidByID = !!(fresh?.ByID && (fresh.ByID as string).trim() !== '');

      if (freshHasValidByID) {
        // 일시적인 문제였음 - 전체 프로필을 다시 로드하고 종료합니다.
        byIDRecheckRef.current = 'idle';
        const { data: fullProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (fullProfile) setProfile(fullProfile as UserProfile);
        return;
      }

      // 재확인 후에도 ByID가 없음 → 에러 표시 후 자동 로그아웃합니다.
      setAuthError('By닉네임이 존재하지 않습니다. 아이디를 재설정해주세요.');
      // 에러 메시지를 잠깐 보여준 뒤 로그아웃합니다.
      await new Promise<void>(resolve => setTimeout(resolve, 3000));
      try { await supabase.auth.signOut(); } catch (signOutErr) { logger.error('로그아웃 중 오류', signOutErr); }
      localStorage.clear();
      window.location.reload();
    };

    runRecheck().catch(async err => {
      logger.error('ByID 재확인 중 오류 발생', err);
      byIDRecheckRef.current = 'idle';
      // 재확인 중 오류가 발생해도 로그아웃하여 사용자가 엉킨 상태에 머무르지 않도록 합니다.
      try { await supabase.auth.signOut(); } catch (signOutErr) { logger.error('로그아웃 중 오류', signOutErr); }
      localStorage.clear();
      window.location.reload();
    });
  }, [user, profile, authLoading]);

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
          // 프로필 생성에 실패해도 visitor 상태로 계속 진행
          return;
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
      // 프로필 로드 실패 (네트워크 오류 등) – visitor 수준으로 계속 진행
      // profile은 null로 유지되고 getPermissions()가 visitor로 대체합니다.
      logger.error('프로필 로드 실패, visitor 수준으로 대체', profileError);
      setAuthLoading(false);
      return;
    }

    let nextProfile: UserProfile = p as UserProfile;

    if (isDiscordProvider && !p.discord_name) {
      const updates: Record<string, string> = {};
      updates.discord_name = discordName;

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

    // 진행 중인 래더 매치 확인 (래더 플레이 가능 역할 전체)
    if (['rookie', 'member', 'elite', 'admin', 'master', 'developer'].includes(nextProfile.role)) {
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
    const rawRole = profileRole?.trim().toLowerCase();

    // 로그인은 됐지만 role이 없거나 유효하지 않은 경우(프로필 로드 실패, 삭제된 role 등)
    // visitor 수준으로 처리해 기능이 완전히 죽지 않게 합니다.
    let userRole: string | undefined;
    if (rawRole && (ROLE_PERMISSIONS as Record<string, unknown>)[rawRole]) {
      userRole = rawRole;
    } else if (user) {
      userRole = 'visitor';
    } else {
      userRole = undefined;
    }

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
    needsByIDSetup,
    authLoading,
    authError,
    setAuthError,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete,
    reloadProfile,
  };
}
