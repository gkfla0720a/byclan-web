/**
 * =====================================================================
 * 파일명: src/app/context/AuthContext.js
 * 역할  : TypeScript로 마이그레이션된 AuthContext의 호환성 유지용 래퍼 파일입니다.
 *
 * ■ 실제 구현은 AuthContext.ts에 있습니다.
 *   이 파일은 .js 확장자로 import하는 기존 코드와의 호환성을 위해 남겨두었습니다.
 *   빌드 시스템은 AuthContext.ts를 우선적으로 사용합니다.
 *
 * ■ 사용 방법
 *   import { useAuthContext } from '@/app/context/AuthContext';
 *   const { profile, getPermissions } = useAuthContext();
 * =====================================================================
 */
// Migrated to TypeScript — see AuthContext.ts
// This file is kept only as a compatibility shim; the build resolves AuthContext.ts first.
export { AuthProvider, useAuthContext } from './AuthContext.ts';
