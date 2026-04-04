'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';

// 사이버틱 길드원 관리 컴포넌트
export default function GuildManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, action: '', member: null });
  const [masterDelegation, setMasterDelegation] = useState({ isOpen: false, targetId: null });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'visitor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('길드원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchMembers();
      setActionModal({ isOpen: false, action: '', member: null });
      alert('등급이 변경되었습니다.');
    } catch (error) {
      alert('등급 변경 실패: ' + error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'expelled' })
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchMembers();
      setActionModal({ isOpen: false, action: '', member: null });
      alert('제명 처리되었습니다.');
    } catch (error) {
      alert('제명 처리 실패: ' + error.message);
    }
  };

  const handleMasterDelegation = async (targetId) => {
    try {
      // 현재 마스터 찾기
      const currentMaster = members.find(m => m.role === 'master');
      if (currentMaster) {
        // 현재 마스터를 관리자로 변경
        await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', currentMaster.id);
      }

      // 새 마스터로 변경
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'master' })
        .eq('id', targetId);

      if (error) throw error;
      
      await fetchMembers();
      setMasterDelegation({ isOpen: false, targetId: null });
      alert('마스터 위임이 완료되었습니다.');
    } catch (error) {
      alert('마스터 위임 실패: ' + error.message);
    }
  };

  const getRoleColor = (role) => {
    return ROLE_PERMISSIONS[role]?.color || '#C7CEEA';
  };

  const getRoleIcon = (role) => {
    return ROLE_PERMISSIONS[role]?.icon || '👤';
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-cyan-400 font-mono">
        [ LOADING GUILD DATA... ]
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-2">
          길드원 관리
        </h1>
        <p className="text-gray-400">길드원 등급 변경, 제명, 마스터 위임 등의 관리 기능</p>
      </div>

      {/* 길드원 목록 */}
      <div className="bg-gray-900 border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-cyan-500/30">
              <tr>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">이름</th>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">역할</th>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">가입일</th>
                <th className="px-6 py-4 text-left text-cyan-400 font-bold">상태</th>
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
                        <div className="text-white font-medium">{member.ByID}</div>
                        <div className="text-gray-400 text-sm">{member.discord_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{ 
                        backgroundColor: getRoleColor(member.role) + '20',
                        color: getRoleColor(member.role),
                        border: `1px solid ${getRoleColor(member.role)}50`
                      }}
                    >
                      {ROLE_PERMISSIONS[member.role]?.name || member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(member.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      member.role === 'master' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      member.role === 'admin' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      member.role === 'elite' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {member.role === 'master' ? '마스터' :
                       member.role === 'admin' ? '관리자' :
                       member.role === 'elite' ? '정예' : '일반'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      {/* 개발자는 제외 */}
                      {member.role !== 'developer' && (
                        <>
                          <button
                            onClick={() => setActionModal({ isOpen: true, action: 'role', member })}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-colors"
                          >
                            등급
                          </button>
                          <button
                            onClick={() => setActionModal({ isOpen: true, action: 'remove', member })}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                          >
                            제명
                          </button>
                          {member.role !== 'master' && (
                            <button
                              onClick={() => setMasterDelegation({ isOpen: true, targetId: member.id })}
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

      {/* 관리 모달 */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">
              {actionModal.action === 'role' ? '등급 변경' : '제명 처리'}
            </h3>
            
            {actionModal.action === 'role' ? (
              <div className="space-y-3">
                <p className="text-gray-300">
                  {actionModal.member.ByID}님의 등급을 변경합니다.
                </p>
                <select 
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  defaultValue={actionModal.member.role}
                >
                  <option value="associate">일반 길드원</option>
                  <option value="elite">정예 길드원</option>
                  <option value="admin">관리자</option>
                  <option value="master">마스터</option>
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRoleChange(actionModal.member.id, actionModal.member.role)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold transition-colors"
                  >
                    변경
                  </button>
                  <button
                    onClick={() => setActionModal({ isOpen: false, action: '', member: null })}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-300">
                  {actionModal.member.ByID}님을 제명하시겠습니까?
                  <br />
                  <span className="text-red-400">이 작업은 되돌릴 수 없습니다.</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRemoveMember(actionModal.member.id)}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold transition-colors"
                  >
                    제명
                  </button>
                  <button
                    onClick={() => setActionModal({ isOpen: false, action: '', member: null })}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 마스터 위임 모달 */}
      {masterDelegation.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">👑 마스터 위임</h3>
            <p className="text-gray-300 mb-4">
              정말로 마스터 권한을 위임하시겠습니까?
              <br />
              <span className="text-yellow-400">마스터는 항상 한 명만 유지됩니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleMasterDelegation(masterDelegation.targetId)}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded font-bold transition-colors"
              >
                위임
              </button>
              <button
                onClick={() => setMasterDelegation({ isOpen: false, targetId: null })}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
