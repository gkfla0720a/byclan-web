// 파일명: @/types/permissions/dev-settings.ts

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

export const loadDevSettings = (): DevSettings => {
  // SSR/테스트 환경 보호
  if (typeof window === 'undefined') return DEV_SETTINGS;

  try {
    const saved = window.localStorage.getItem('byclan_dev_settings');
    return saved ? { ...DEV_SETTINGS, ...JSON.parse(saved) } : DEV_SETTINGS;
  } catch {
    return DEV_SETTINGS;
  }
}

export const saveDevSettings = (settings: DevSettings): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem('byclan_dev_settings', JSON.stringify(settings));
  } catch {
    // localStorage 접근이 막힌 환경에서는 개발자 설정 저장만 건너뜁니다.
  }
}
