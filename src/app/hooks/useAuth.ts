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
import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import type { AuthProfile as UserProfile } from '@/types/domain';
import { extractAccountIdFromAuthUser } from '../utils/accountId';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';
import { withRetry, isRetryableError } from '../utils/retry';
import logger, { Severity } from '../utils/errorLogger';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * UserProfile
 * - Supabase의 profiles 테이블 한 행(row)에 해당하는 타입입니다.
 * - 각 필드 설명:
 *   id:             Supabase Auth의 사용자 UUID (기본 키)
 *   by_id:           클랜 내 고유 닉네임 (예: 'By_홍길동') – 클랜원이라면 반드시 존재해야 함
 *   discord_id:     Discord 고유 ID (연동 식별자 – 연동 여부 판단·충돌 감지·표시에 사용)
 *   role:           클랜 역할 (visitor/applicant/rookie/member/elite/admin/master/developer)
 *   clan_point:     클랜 재화 포인트 (베팅·상점 등에 사용, 기본값: 0)
 *   race:           스타크래프트 종족 (Terran/Zerg/Protoss)
 *   intro:          자기소개 문구
 *   is_in_queue:    현재 래더 대기열에 있는지 여부
 *   vote_to_start:  래더 시작 투표 여부
 *   wins:           래더 승리 수 (선택)
 *   losses:         래더 패배 수 (선택)
 *   queue_joined_at: 대기열 합류 시간 (선택)
 */

export type { UserProfile };

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
  /** by_id가 비어있거나 없을 때 true. 프로필 설정 페이지로 유도하는 데 사용됩니다. */
  needsByIdSetup: boolean;
  authLoading: boolean;
  authError: string | null;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  getPermissions: () => AuthPermissions;
  handleAuthSuccess: (authUser: Record<string, unknown>) => void;
  handleSetupComplete: () => void;
  reloadProfile: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeProfileRow(profile: Record<string, unknown> | null): UserProfile | null {
  if (!profile) return null;

  if (typeof profile.clan_point !== 'number') {
    logger.warn('normalizeProfileRow: clan_point 컬럼이 없거나 숫자 타입이 아닙니다. DB 스키마를 확인하세요.');
  }
  if (typeof profile.ladder_mmr !== 'number') {
    logger.warn('normalizeProfileRow: ladder_mmr 컬럼이 없거나 숫자 타입이 아닙니다. DB 스키마를 확인하세요.');
  }

  return {
    ...(profile as UserProfile),
    clan_point: typeof profile.clan_point === 'number' ? profile.clan_point : 0,
    ladder_mmr: typeof profile.ladder_mmr === 'number' ? profile.ladder_mmr : 1000,
  };
}

function getSocialIdentity(authUser: Record<string, unknown>) {
  const identities = (authUser?.identities as {
    provider: string;
    identity_id?: string;
    id?: string;
    identity_data?: Record<string, unknown>;
  }[]) || [];
  const discordIdentity = identities.find((identity) => identity.provider === 'discord');
  const googleIdentity = identities.find((identity) => identity.provider === 'google');
  const meta = authUser?.user_metadata as Record<string, unknown> | undefined;
  const appMeta = authUser?.app_metadata as Record<string, unknown> | undefined;

  const isDiscordProvider =
    appMeta?.provider === 'discord' ||
    meta?.provider === 'discord' ||
    !!discordIdentity;

  const isGoogleProvider =
    appMeta?.provider === 'google' ||
    meta?.provider === 'google' ||
    !!googleIdentity;

  return {
    isDiscordProvider,
    isGoogleProvider,
    discordId:
      (discordIdentity?.identity_data?.sub as string) ||
      (discordIdentity?.identity_data?.provider_id as string) ||
      discordIdentity?.identity_id ||
      discordIdentity?.id ||
      null,
    discordName:
      (meta?.preferred_username as string) ||
      (meta?.full_name as string) ||
      (meta?.name as string) ||
      ((authUser?.email as string)?.split('@')[0]) ||
      'User',
    googleSub:
      (meta?.sub as string) ||
      (meta?.provider_id as string) ||
      googleIdentity?.identity_id ||
      googleIdentity?.id ||
      null,
    googleEmail:
      (meta?.email as string) ||
      (authUser?.email as string) ||
      null,
    googleName:
      (meta?.full_name as string) ||
      (meta?.name as string) ||
      (meta?.given_name as string) ||
      ((authUser?.email as string)?.split('@')[0]) ||
      'User',
    googleAvatarUrl:
      (meta?.avatar_url as string) ||
      (meta?.picture as string) ||
      null,
    authProvider:
      (appMeta?.provider as string) ||
      (meta?.provider as string) ||
      (identities[0]?.provider as string) ||
      'email',
  };
}

function sanitizeByIdSeed(seed: string): string {
  const cleaned = seed
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 20);
  return cleaned || 'User';
}

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message || '';
  return code === '23505' || /duplicate key/i.test(message);
}

async function resolveUniqueById(seed: string, currentUserId?: string): Promise<string> {
  const base = `By_${sanitizeByIdSeed(seed)}`;
  const candidates = Array.from({ length: 30 }, (_, i) => (i === 0 ? base : `${base}${i + 1}`));

  const { data, error } = await supabase
    .from('profiles')
    .select('id, by_id')
    .in('by_id', candidates);

  if (error) {
    logger.warn('by_id 후보 조회 실패, 기본값으로 진행', error);
    return base;
  }

  const taken = new Map<string, string>();
  (data || []).forEach((row: { id: string; by_id: string }) => {
    taken.set(row.by_id, row.id);
  });

  for (const candidate of candidates) {
    const owner = taken.get(candidate);
    if (!owner || owner === currentUserId) {
      return candidate;
    }
  }

  const suffix = (currentUserId || Date.now().toString()).replace(/-/g, '').slice(0, 6);
  return `${base}${suffix}`;
}

async function syncSocialProfileData(
  authUser: Record<string, unknown>,
  currentProfile: UserProfile
): Promise<UserProfile> {
  const {
    isDiscordProvider,
    isGoogleProvider,
    discordId,
    discordName,
    googleSub,
    googleEmail,
    googleName,
    googleAvatarUrl,
    authProvider,
  } = getSocialIdentity(authUser);

  const updates: Record<string, unknown> = {};

  if (isDiscordProvider) {
    // discord_id는 아직 없을 때만 백필(최초 로그인 시)합니다.
    // 명시적 연동(linkIdentity) 흐름에서는 auth/callback이 직접 저장합니다.
    if (discordId && !currentProfile.discord_id) updates.discord_id = discordId;
  }

  if (isGoogleProvider) {
    if (googleSub && currentProfile.google_sub !== googleSub) updates.google_sub = googleSub;
    if (googleEmail && currentProfile.google_email !== googleEmail) updates.google_email = googleEmail;
    if (googleName && currentProfile.google_name !== googleName) updates.google_name = googleName;
    if (googleAvatarUrl && currentProfile.google_avatar_url !== googleAvatarUrl) updates.google_avatar_url = googleAvatarUrl;
    if (authProvider && currentProfile.auth_provider !== authProvider) updates.auth_provider = authProvider;
  } else if (authProvider && currentProfile.auth_provider !== authProvider) {
    updates.auth_provider = authProvider;
  }

  if (!currentProfile.by_id || !currentProfile.by_id.trim()) {
    const loginId = extractAccountIdFromAuthUser(authUser, currentProfile);
    const seed = googleName || discordName || loginId || (authUser.email as string)?.split('@')[0] || 'User';
    updates.by_id = await resolveUniqueById(seed, authUser.id as string);
  }

  if (Object.keys(updates).length === 0) {
    return currentProfile;
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', authUser.id)
    .select('*')
    .single();

  if (updateError) {
    logger.warn('소셜 프로필 동기화 일부 실패', updateError);
    return currentProfile;
  }

  return (updatedProfile as UserProfile) || currentProfile;
}

// ─── HomeGate external store ─────────────────────────────────────────────────
// useSyncExternalStore avoids hydration mismatches (React error #418) because
// it accepts separate server and client snapshots. The server snapshot always
// returns false; the client snapshot lazily reads sessionStorage on first call
// and then tracks in-memory updates from setIsAuthorized / ensureHomeGateAuthorized.

let _homeGateAuthorized = false;
let _homeGateInitialized = false;
const _homeGateListeners = new Set<() => void>();

function _subscribeHomeGate(listener: () => void): () => void {
  _homeGateListeners.add(listener);
  return () => { _homeGateListeners.delete(listener); };
}

function _getHomeGateSnapshot(): boolean {
  if (!_homeGateInitialized) {
    _homeGateInitialized = true;
    _homeGateAuthorized = window.sessionStorage.getItem('byclan_home_gate') === 'authorized';
    if (!_homeGateAuthorized) {
      window.localStorage.removeItem('byclan_home_gate');
    }
  }
  return _homeGateAuthorized;
}

function _getHomeGateServerSnapshot(): boolean {
  return false;
}

function _updateHomeGateStore(value: boolean): void {
  _homeGateAuthorized = value;
  _homeGateInitialized = true;
  _homeGateListeners.forEach(l => l());
}

// homeGateReady never changes after mount (client = true, server = false),
// so no subscription is needed; this noop satisfies the useSyncExternalStore API.
const _noopSubscribe = () => () => {};

export function useAuth(): UseAuthReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // by_id 재확인 진행 상태를 추적하는 ref입니다.
  // state가 아닌 ref를 사용하여 불필요한 재렌더링을 방지합니다.
  const byIDRecheckRef = useRef<'idle' | 'checking'>('idle');
  const [password, setPassword] = useState('');

  // HomeGate 인증 상태입니다.
  // useSyncExternalStore를 사용하여 SSR/hydration 불일치(React error #418)를 방지합니다.
  // 서버 스냅샷은 항상 false를 반환하고, 클라이언트 스냅샷은 sessionStorage를 읽습니다.
  const isAuthorizedState = useSyncExternalStore(
    _subscribeHomeGate,
    _getHomeGateSnapshot,
    _getHomeGateServerSnapshot,
  );
  // 클라이언트 마운트 후에만 true가 됩니다 (서버에서는 false → 로딩 화면 표시).
  const homeGateReady = useSyncExternalStore(
    _noopSubscribe,
    () => true,
    () => false,
  );

  // ─── by_id 유효성 파생 ──────────────────────────────────────────────────────
  // needsByIdSetup은 profile에서 직접 파생되는 계산값입니다. (별도 state 불필요)
  // profile이 null이면 아직 로딩 중이므로 false로 처리합니다.
  const needsByIdSetup = profile !== null && !(profile.by_id && profile.by_id.trim() !== '');

  // Auto-clear authError after 4 seconds
  useEffect(() => {
    if (!authError) return;
    const timer = setTimeout(() => setAuthError(null), 4000);
    return () => clearTimeout(timer);
  }, [authError]);

  // ─── by_id 안전 재확인 + 자동 로그아웃 ────────────────────────────────────
  // by_id가 없어 보일 때 즉시 판단하지 않고, 아래 순서로 처리합니다.
  //   1. 1500ms 대기 (화면 전환·일시적 상태 무시)
  //   2. DB에서 직접 by_id를 재조회
  //   3. 재조회에서도 없으면: 에러 메시지 → 3초 후 로그아웃 + 페이지 새로고침
  //   4. 재조회에서 있으면: 전체 프로필을 다시 로드하고 정상 처리
  useEffect(() => {
    if (!user || !profile || authLoading) {
      byIDRecheckRef.current = 'idle';
      return;
    }

    const hasValidById = !!(profile.by_id && profile.by_id.trim() !== '');
    // by_id가 유효하면 재확인 상태를 초기화하고 종료합니다.
    if (hasValidById) {
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

      // DB에서 최신 by_id를 직접 조회합니다.
      const { data: fresh } = await supabase
        .from('profiles')
        .select('by_id')
        .eq('id', userId)
        .single();

      const freshHasValidById = !!(fresh?.by_id && (fresh.by_id as string).trim() !== '');

      if (freshHasValidById) {
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

      // 재확인 후에도 by_id가 없음 → 에러 표시 후 자동 로그아웃합니다.
      setAuthError('By닉네임이 존재하지 않습니다. 아이디를 재설정해주세요.');
      // 에러 메시지를 잠깐 보여준 뒤 로그아웃합니다.
      await new Promise<void>(resolve => setTimeout(resolve, 3000));
      try { await supabase.auth.signOut(); } catch (signOutErr) { logger.error('로그아웃 중 오류', signOutErr); }
      localStorage.clear();
      window.location.reload();
    };

    runRecheck().catch(async err => {
      logger.error('by_id 재확인 중 오류 발생', err);
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
    const { isDiscordProvider, isGoogleProvider, discordName, googleName, googleEmail } = getSocialIdentity(authUser);

    const { data: p, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // 프로필 없음 – visitor 기본 프로필 생성
        const loginId = extractAccountIdFromAuthUser(authUser);
        const byIdSeed = isGoogleProvider
          ? (googleName || (googleEmail || '').split('@')[0] || 'User')
          : (isDiscordProvider
            ? discordName
            : (loginId || ((authUser.email as string)?.split('@')[0] || 'User')));

        let insertError: unknown = null;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const uniqueById = await resolveUniqueById(`${byIdSeed}${attempt === 0 ? '' : attempt + 1}`, authUser.id as string);
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              by_id: uniqueById,
              role: 'visitor',
              clan_point: 0,
              race: 'Terran',
              intro: '클랜 방문자',
              is_in_queue: false,
              vote_to_start: false,
            });

          if (!error) {
            insertError = null;
            break;
          }

          insertError = error;
          if (!isUniqueViolation(error)) {
            break;
          }
        }

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

        const normalizedNewProfile = normalizeProfileRow(newProfile as Record<string, unknown>);
        const syncedProfile = await syncSocialProfileData(authUser, normalizedNewProfile as UserProfile);
        setProfile(syncedProfile);
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

    let nextProfile: UserProfile = normalizeProfileRow(p as Record<string, unknown>) as UserProfile;
    nextProfile = await syncSocialProfileData(authUser, nextProfile);

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
      _updateHomeGateStore(true);
    }
  };

  useEffect(() => {
    const syncAuthFromServer = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        setUser(null);
        setProfile(null);
        setActiveMatchId(null);
        setAuthLoading(false);
        return;
      }

      // Auth 서버에서 검증된 사용자만 HomeGate를 통과시킵니다.
      ensureHomeGateAuthorized();
      await loadUserData(data.user as unknown as Record<string, unknown>);
    };

    const initializeData = async () => {
      try {
        if (!isSupabaseConfigured) {
          setAuthLoading(false);
          return;
        }

        await syncAuthFromServer();
      } catch (error) {
        logger.error('인증 초기화 실패', error);
        setAuthLoading(false);
      }
    };

    initializeData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setActiveMatchId(null);
        setAuthLoading(false);
        return;
      }

      // onAuthStateChange 콜백 내부에서 Supabase 호출을 직접 await하지 않습니다.
      // SDK 권고에 따라 다음 태스크로 넘겨 deadlock/race 가능성을 줄입니다.
      setTimeout(() => {
        syncAuthFromServer().catch((error) => {
          logger.error('인증 상태 갱신 실패', error);
          setAuthLoading(false);
        });
      }, 0);
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
          if (data) setProfile(normalizeProfileRow(data as Record<string, unknown>));
        } catch (error) {
          logger.error('프로필 로드 중 오류 발생', error);
          setAuthError('프로필을 불러오는 데 실패했습니다.');
        }
      };
      loadProfile();
    }
  };

  const setIsAuthorized = (value: boolean) => {
    _updateHomeGateStore(value);
    if (value) {
      window.sessionStorage.setItem('byclan_home_gate', 'authorized');
      window.localStorage.removeItem('byclan_home_gate');
    } else {
      window.sessionStorage.removeItem('byclan_home_gate');
      window.localStorage.removeItem('byclan_home_gate');
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
      if (data) setProfile(normalizeProfileRow(data as Record<string, unknown>));
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
    needsByIdSetup,
    authLoading,
    authError,
    setAuthError,
    getPermissions,
    handleAuthSuccess,
    handleSetupComplete,
    reloadProfile,
  };
}
