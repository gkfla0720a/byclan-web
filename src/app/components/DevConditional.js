'use client';

import { useAuthContext } from '../context/AuthContext';
import DevSettingsPanel from './DevSettingsPanel';

/** 개발자 계정(role === 'developer')일 때만 DevSettingsPanel을 렌더링합니다. */
export default function DevConditional() {
  const { getPermissions } = useAuthContext();
  const { isDeveloper } = getPermissions();
  if (!isDeveloper) return null;
  return <DevSettingsPanel />;
}
