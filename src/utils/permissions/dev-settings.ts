// 파일명: @/utils/permissions/dev-settings.ts

export interface DevSettings {
  homeGateEnabled: boolean;
  canReviewApplications: boolean;
  canManageMembers: boolean;
  canDelegateMaster: boolean;
}

export const DEV_SETTINGS: DevSettings = {
  homeGateEnabled: true,
  canReviewApplications: true,
  canManageMembers: true,
  canDelegateMaster: true,
};

export function loadDevSettings(): DevSettings {
  // SSR/테스트 환경 보호
  if (typeof window === 'undefined') return DEV_SETTINGS;

  try {
    const saved = window.localStorage.getItem('byclan_dev_settings');
    return saved ? { ...DEV_SETTINGS, ...JSON.parse(saved) } : DEV_SETTINGS;
  } catch {
    return DEV_SETTINGS;
  }
}