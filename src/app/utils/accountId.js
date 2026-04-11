const INTERNAL_AUTH_DOMAIN = 'auth.byclan.local';
const INTERNAL_AUTH_PREFIX = 'login.';

export function normalizeAccountId(value = '') {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isLegacyEmailLogin(value = '') {
  return /@/.test(value.trim());
}

export function buildInternalAuthEmail(accountId) {
  const normalized = normalizeAccountId(accountId);
  if (!normalized) return '';
  return `${INTERNAL_AUTH_PREFIX}${normalized}@${INTERNAL_AUTH_DOMAIN}`;
}

export function isInternalAuthEmail(email = '') {
  return email.toLowerCase().endsWith(`@${INTERNAL_AUTH_DOMAIN}`);
}

export function extractAccountIdFromInternalEmail(email = '') {
  if (!isInternalAuthEmail(email)) return '';
  const localPart = email.split('@')[0] || '';
  return localPart.startsWith(INTERNAL_AUTH_PREFIX)
    ? localPart.slice(INTERNAL_AUTH_PREFIX.length)
    : localPart;
}

export function extractAccountIdFromById(byId = '') {
  if (!byId) return '';
  return byId.startsWith('By_') ? byId.slice(3) : byId;
}

export function extractAccountIdFromAuthUser(authUser, profile) {
  const metaLoginId = authUser?.user_metadata?.login_id;
  if (typeof metaLoginId === 'string' && metaLoginId.trim()) {
    return metaLoginId.trim();
  }

  const internalEmailLoginId = extractAccountIdFromInternalEmail(authUser?.email || '');
  if (internalEmailLoginId) {
    return internalEmailLoginId;
  }

  return extractAccountIdFromById(profile?.by_id || '');
}

export function getLoginEmailFromInput(input) {
  return isLegacyEmailLogin(input) ? input.trim() : buildInternalAuthEmail(input);
}