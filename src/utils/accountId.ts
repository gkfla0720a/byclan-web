// 파일명: @/utils/accountId.ts

const INTERNAL_AUTH_DOMAIN = 'auth.byclan.local';
const INTERNAL_AUTH_PREFIX = 'login.';

// Supabase User 및 프로필 객체의 최소한의 타입 정의 (필요에 따라 확장 가능)
interface AuthUser {
  id: string;
  email: string | null;
  user_metadata?: {
    login_id?: string;
    [key: string]: unknown; // user_metadata에 다른 속성이 있을 수 있음
  };
}

interface UserProfile {
  by_id?: string | null;
  [key: string]: unknown; // profile에 다른 속성이 있을 수 있음
}

export function normalizeAccountId(value: string = ''): string {
  return value.replace(/[^a-z0-9]/g, '');
}

export function isLegacyEmailLogin(value: string = ''): boolean { // 현재 사용 여부 확인 필요
  return /@/.test(value);
}

export function buildInternalAuthEmail(accountId: string): string {
  const normalized = normalizeAccountId(accountId);
  if (!normalized) return '';
  return `${INTERNAL_AUTH_PREFIX}${normalized}@${INTERNAL_AUTH_DOMAIN}`;
}

export function isInternalAuthEmail(email: string = ''): boolean {
  return email.endsWith(`@${INTERNAL_AUTH_DOMAIN}`);
}

export function extractAccountIdFromInternalEmail(email: string = ''): string {
  if (!isInternalAuthEmail(email)) return '';
  const localPart = email.split('@')[0]; // split('@')[0]은 항상 string을 반환하므로 || ''는 불필요
  return localPart.startsWith(INTERNAL_AUTH_PREFIX)
    ? localPart.slice(INTERNAL_AUTH_PREFIX.length)
    : localPart;
}

export function extractAccountIdFromById(byId: string = ''): string {
  if (!byId) return '';
  return byId.startsWith('By_') ? byId.slice(3) : byId;
}

export function extractAccountIdFromAuthUser(authUser: AuthUser | null | undefined, profile: UserProfile | null | undefined): string {
  const metaLoginId = authUser?.user_metadata?.login_id;
  if (typeof metaLoginId === 'string' && metaLoginId) {
    return metaLoginId;
  }

  const internalEmailLoginId = extractAccountIdFromInternalEmail(authUser?.email || '');
  if (internalEmailLoginId) {
    // 이메일에서 추출된 ID는 normalizeAccountId를 통해 이미 정규화되어 있을 것으로 예상됩니다.
    return internalEmailLoginId;
  }

  if (profile?.by_id) {
    return extractAccountIdFromById(profile.by_id);
  }
  return ''; // 모든 경우에 해당하지 않으면 빈 문자열 반환
}

export function getLoginEmailFromInput(input: string): string {
  return isLegacyEmailLogin(input) ? input : buildInternalAuthEmail(input);
}