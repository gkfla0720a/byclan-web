// 파일명: @/features/guild/memberTable.tsx

'use client';

import { hasPermission, ROLE_PERMISSIONS } from '@/types/permissions';
import { isMarkedTestAccount } from '@/utils/testData';

const getRoleColor = (role) => ROLE_PERMISSIONS[role]?.color || '#C7CEEA';
const getRoleIcon = (role) => ROLE_PERMISSIONS[role]?.icon || '👤';

/**
 * 클랜원 목록 테이블 UI 컴포넌트입니다.
 * 모든 로직은 props로 주입받습니다.
 */
export default function MemberTable({
  members,
  currentManager,
  canDelegateMaster,
  onRoleClick,
  onRemoveClick,
  onDelegateClick,
  onForcePromote,
}) {
  return (
    <div className="bg-gray-900 border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 border-b border-cyan-500/30">
            <tr>
              <th className="px-6 py-4 text-left text-cyan-400 font-bold">이름</th>
              <th className="px-6 py-4 text-left text-cyan-400 font-bold">직책</th>
              <th className="px-6 py-4 text-left text-cyan-400 font-bold">가입일</th>
              <th className="px-6 py-4 text-left text-cyan-400 font-bold">권한 설명</th>
              <th className="px-6 py-4 text-center text-cyan-400 font-bold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getRoleIcon(member.role)}</span>
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {member.by_id}
                        {isMarkedTestAccount(member) && (
                          <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">{member.discord_id || '-'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: getRoleColor(member.role) + '20',
                      color: getRoleColor(member.role),
                      border: `1px solid ${getRoleColor(member.role)}50`,
                    }}
                  >
                    {ROLE_PERMISSIONS[member.role]?.name || member.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {new Date(member.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300 leading-relaxed">
                    {ROLE_PERMISSIONS[member.role]?.description || '권한 정보 없음'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center flex-wrap">
                    {member.role !== 'developer' && (
                      <>
                        <button
                          onClick={() => onRoleClick(member)}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-colors"
                        >
                          등급
                        </button>
                        <button
                          onClick={() => onRemoveClick(member)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                        >
                          제명
                        </button>
                        {member.role === 'rookie' && currentManager.role === 'master' && (
                          <button
                            onClick={() => onForcePromote(member)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors"
                            title="수습 기간에 관계없이 즉시 정회원으로 승급 (마스터 전용)"
                          >
                            즉시 승급
                          </button>
                        )}
                        {member.role !== 'master' && canDelegateMaster && (
                          <button
                            onClick={() => onDelegateClick(member)}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors"
                          >
                            위임
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}