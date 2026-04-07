/**
 * @file PermissionInfo.js
 * @역할 역할(role)별 권한 정보를 시각적으로 표시하는 UI 컴포넌트 모음
 * @주요기능
 *   - PermissionInfo: 특정 역할의 권한 목록과 레벨을 카드로 표시 (compact 모드 지원)
 *   - PermissionComparison: 여러 역할의 권한을 테이블로 비교 표시
 *   - PermissionChecker: 특정 역할이 각 권한을 가졌는지 허용/거부로 표시
 *   - getPermissionDisplayName: 권한 코드를 한국어 이름으로 변환하는 유틸 함수
 * @사용방법
 *   import { PermissionInfo, PermissionComparison, PermissionChecker } from './PermissionInfo';
 *   <PermissionInfo userRole="admin" />
 *   <PermissionInfo userRole="elite" compact={true} />
 *   <PermissionComparison roles={['rookie', 'member', 'elite', 'admin']} />
 *   <PermissionChecker userRole="master" />
 * @관련컴포넌트 GuildManagement.js, AdminBoard.js
 */
'use client';

import React from 'react';
import { ROLE_PERMISSIONS, PermissionChecker as PermissionUtilsChecker } from '../utils/permissions';

/**
 * 특정 역할의 권한 정보를 카드 형태로 표시하는 컴포넌트입니다.
 * @param {object} props
 * @param {string} props.userRole - 표시할 역할 코드 (예: 'admin', 'master')
 * @param {boolean} [props.compact=false] - true이면 아이콘+이름만 표시하는 간소화 모드
 * @returns {JSX.Element|null} 권한 정보 카드 또는 null (역할 정보 없을 때)
 */
// 권한 정보 표시 컴포넌트
export function PermissionInfo({ userRole, compact = false }) {
  const roleInfo = ROLE_PERMISSIONS[userRole];
  
  if (!roleInfo) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">{roleInfo.icon}</span>
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
          {roleInfo.permissions.map((permission, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-green-400 text-xs">✓</span>
              <span className="text-gray-300 text-sm">{getPermissionDisplayName(permission)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 여러 역할의 권한을 테이블 형태로 나란히 비교하는 컴포넌트입니다.
 * @param {object} props
 * @param {string[]} [props.roles] - 비교할 역할 코드 배열 (기본값: member, elite, admin, master)
 * @returns {JSX.Element} 권한 비교 테이블
 */
// 권한 비교 컴포넌트
export function PermissionComparison({ roles = ['member', 'elite', 'admin', 'master'] }) {
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
                      {roleInfo.permissions.slice(0, 3).map((permission, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                        >
                          {getPermissionDisplayName(permission)}
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
}

/**
 * 특정 역할이 주요 권한 목록 각각을 가지고 있는지 허용/거부로 표시하는 컴포넌트입니다.
 * 개발자 도구 또는 권한 테스트 용도로 사용합니다.
 * @param {object} props
 * @param {string} props.userRole - 검사할 역할 코드
 * @returns {JSX.Element} 권한 허용/거부 목록
 */
// 권한 검사기 컴포넌트
export function PermissionChecker({ userRole }) {
  /** 테스트할 권한 코드 목록 */
  const testPermissions = [
    'system.admin',
    'clan.admin',
    'member.approve',
    'match.manage',
    'ladder.play',
    'community.post'
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">🔍 권한 테스트</h3>
      
      <div className="space-y-3">
        {testPermissions.map((permission) => {
          const hasPermission = PermissionUtilsChecker.hasPermission(userRole, permission);
          
          return (
            <div key={permission} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div>
                <div className="text-white font-medium">{getPermissionDisplayName(permission)}</div>
                <div className="text-gray-400 text-xs">{permission}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasPermission 
                  ? 'bg-green-900/80 text-green-400' 
                  : 'bg-red-900/80 text-red-400'
              }`}>
                {hasPermission ? '허용' : '거부'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 권한 코드 문자열을 한국어 표시 이름으로 변환합니다.
 * 매핑 테이블에 없는 코드는 원래 문자열 그대로 반환합니다.
 * @param {string} permission - 변환할 권한 코드 (예: 'member.approve')
 * @returns {string} 한국어 권한 이름 (예: '가입 승인')
 */
// 권한 표시 이름 변환 함수
function getPermissionDisplayName(permission) {
  const displayNames = {
    'system.admin': '시스템 관리',
    'database.modify': '데이터베이스 수정',
    'code.deploy': '코드 배포',
    'user.manage_all': '전체 유저 관리',
    'clan.admin_all': '클랜 전체 관리',
    'clan.admin': '클랜 관리',
    'member.manage': '멤버 관리',
    'tournament.create': '토너먼트 생성',
    'ladder.admin': '래더 관리',
    'announcement.post': '공지사항 게시',
    'member.approve': '가입 승인',
    'match.manage': '매치 관리',
    'ladder.moderate': '래더 중재',
    'announcement.edit': '공지사항 편집',
    'match.host': '매치 개최',
    'tournament.join': '토너먼트 참여',
    'match.join': '매치 참여',
    'ladder.play': '래더 플레이',
    'community.post': '커뮤니티 게시',
    'profile.edit': '프로필 수정',
    'match.view': '매치 관람',
    'community.view': '커뮤니티 열람',
    'profile.view': '프로필 열람'
  };
  
  return displayNames[permission] || permission;
}

export default PermissionInfo;
