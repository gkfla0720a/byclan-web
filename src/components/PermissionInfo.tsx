// 파일명: src/components/PermissionInfo.tsx

/**
 * @file PermissionInfo.tsx
 * @역할 역할(role)별 권한 정보를 시각적으로 표시하는 UI 컴포넌트 모음
 * @주요기능
 * - PermissionInfo: 특정 역할의 권한 목록과 레벨을 카드로 표시 (compact 모드 지원)
 * - PermissionComparison: 여러 역할의 권한을 테이블로 비교 표시
 * - PermissionTester: 특정 역할이 각 권한을 가졌는지 허용/거부로 표시
 */

'use client';

// 🚨 파일 경로에 맞게 정확하게 임포트 (이전 파일 구조 참고)
import { hasPermission as checkPermission, ROLE_PERMISSIONS } from '@/types/permissions';
import type { UserRole, PermissionAction } from '@/types';

// 💡 화면의 권한 테스트기(PermissionTester)에서 보여줄 샘플 권한 목록입니다.
// 기획에 맞게 추가/삭제하셔도 됩니다.
const SAMPLE_PERMISSIONS: PermissionAction[] = [
  'home.view',
  'dashboard.view',
  'community.post',
  'match.join',
  'ladder.play',
  'member.approve',
  'clan.admin',
  'master.delegate',
  'system.admin'
];

// ─── 1. 단일 권한 정보 표시 컴포넌트 ───
interface PermissionInfoProps {
  userRole: UserRole;
  compact?: boolean;
}

export const PermissionInfo = ({ userRole, compact = false }: PermissionInfoProps) => {
  const roleInfo = ROLE_PERMISSIONS[userRole];

  if (!roleInfo) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg" aria-label={roleInfo.name}>{roleInfo.icon}</span>
        <span className="font-medium" style={{ color: roleInfo.color }}>
          {roleInfo.name}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{roleInfo.icon}</span>
          <div>
            <h3 className="font-bold text-white">{roleInfo.name}</h3>
            <p className="text-gray-400 text-sm">{roleInfo.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">레벨</div>
          <div className="text-lg font-bold" style={{ color: roleInfo.color }}>
            {roleInfo.level}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <h4 className="text-sm font-medium text-gray-300 mb-2">권한 목록</h4>
        <div className="grid grid-cols-1 gap-1">
          {/* 🚨 변수 충돌 방지: permission이라는 이름으로 꺼냅니다 */}
          {roleInfo.permissions.map((permission, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-green-400 text-xs">✓</span>
              <span className="text-gray-300 text-sm">{permission}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2. 권한 비교 테이블 컴포넌트 ───
interface PermissionComparisonProps {
  roles: UserRole[]; // ROLES -> roles (소문자 시작 규칙)
}

export const PermissionComparison = ({ roles }: PermissionComparisonProps) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">🔐 역할별 권한 비교</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-2 text-gray-300">역할</th>
              <th className="text-center p-2 text-gray-300">레벨</th>
              <th className="text-left p-2 text-gray-300">주요 권한</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const roleInfo = ROLE_PERMISSIONS[role];
              if (!roleInfo) return null;

              return (
                <tr key={role} className="border-b border-gray-700/50">
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <span>{roleInfo.icon}</span>
                      <span className="font-medium" style={{ color: roleInfo.color }}>
                        {roleInfo.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-2">
                    <span className="font-bold" style={{ color: roleInfo.color }}>
                      {roleInfo.level}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {/* 🚨 3개까지만 보여주고 나머지는 +N 으로 표시 */}
                      {roleInfo.permissions.slice(0, 3).map((permission, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                        >
                          {permission}
                        </span>
                      ))}
                      {roleInfo.permissions.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                          +{roleInfo.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── 3. 권한 검사기 컴포넌트 ───
interface PermissionTesterProps {
  userRole: UserRole;
}

// 🚨 React 컴포넌트는 반드시 대문자로 시작해야 합니다 (hasPermission -> PermissionTester)
export const PermissionTester = ({ userRole }: PermissionTesterProps) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">🔍 권한 테스트</h3>

      <div className="space-y-3">
        {/* 🚨 TS 타입을 직접 map 돌릴 수 없으므로, 위에 정의한 SAMPLE_PERMISSIONS 배열을 사용합니다 */}
        {SAMPLE_PERMISSIONS.map((permission) => {
          const isAllowed = checkPermission(userRole, permission);

          return (
            <div key={permission} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div>
                <div className="text-white font-medium">{permission}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${isAllowed
                ? 'bg-emerald-900/80 text-emerald-400 border border-emerald-800'
                : 'bg-red-900/80 text-red-400 border border-red-800'
                }`}>
                {isAllowed ? '허용' : '거부'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionInfo;