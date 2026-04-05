'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';
import { filterVisibleTestAccounts, isMarkedTestAccount } from '@/app/utils/testData';

const DELEGATION_VERIFY_WINDOW_MS = 5 * 60 * 1000;

const createVerificationState = (email = '', phone = '') => ({
  method: 'password',
  password: '',
  otp: '',
  email,
  phone,
  otpSent: false,
  verifiedAt: null,
  verifiedMethod: '',
  sendingOtp: false,
  verifying: false,
  error: '',
  success: '',
});

// 사이버틱 길드원 관리 컴포넌트
export default function GuildManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentManager, setCurrentManager] = useState({ id: null, role: null, email: '', phone: '' });
  const [actionModal, setActionModal] = useState({ isOpen: false, action: '', member: null });
  const [masterDelegation, setMasterDelegation] = useState({ isOpen: false, member: null });
  const [pendingRole, setPendingRole] = useState('member');
  const [delegationVerification, setDelegationVerification] = useState(createVerificationState());

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadCurrentManager(), fetchMembers()]);
    };

    initialize();
  }, []);

  const loadCurrentManager = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setCurrentManager({
        id: user.id,
        role: profile?.role?.trim?.().toLowerCase?.() || null,
        email: user.email || '',
        phone: user.phone || '',
      });
      setDelegationVerification(createVerificationState(user.email || '', user.phone || ''));
    } catch (error) {
      console.error('관리자 정보 로드 실패:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await filterVisibleTestAccounts(supabase
        .from('profiles')
        .select('*')
        .neq('role', 'visitor')
        .neq('role', 'expelled')
        .order('created_at', { ascending: false }));

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('길드원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (newRole === 'master') {
      alert('마스터 지정은 재인증 후 마스터 위임으로만 처리할 수 있습니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchMembers();
      setPendingRole('member');
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
    const now = Date.now();

    if (!PermissionChecker.hasPermission(currentManager.role, 'master.delegate')) {
      alert('현재 계정에는 마스터 위임 권한이 없습니다.');
      return;
    }

    if (!delegationVerification.verifiedAt || now - delegationVerification.verifiedAt > DELEGATION_VERIFY_WINDOW_MS) {
      alert('마스터 위임 전 본인 재인증을 완료해야 합니다.');
      return;
    }

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
      setMasterDelegation({ isOpen: false, member: null });
      setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
      alert('마스터 위임이 완료되었습니다.');
    } catch (error) {
      alert('마스터 위임 실패: ' + error.message);
    }
  };

  const handlePasswordVerification = async () => {
    if (!delegationVerification.password.trim()) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '현재 계정 비밀번호를 입력하세요.',
        success: '',
      }));
      return;
    }

    const identifier = currentManager.email || currentManager.phone;
    if (!identifier) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '현재 계정에 이메일 또는 전화번호가 연결되어 있지 않아 비밀번호 재인증을 진행할 수 없습니다.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification((prev) => ({ ...prev, verifying: true, error: '', success: '' }));

      const credentials = currentManager.email
        ? { email: currentManager.email, password: delegationVerification.password }
        : { phone: currentManager.phone, password: delegationVerification.password };

      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) throw error;
      if (data.user?.id !== currentManager.id) {
        throw new Error('현재 로그인 계정과 일치하지 않는 인증 결과입니다.');
      }

      setDelegationVerification((prev) => ({
        ...prev,
        password: '',
        verifiedAt: Date.now(),
        verifiedMethod: 'password',
        verifying: false,
        error: '',
        success: '비밀번호 재인증이 완료되었습니다. 5분 안에 마스터 위임을 진행할 수 있습니다.',
      }));
    } catch (error) {
      setDelegationVerification((prev) => ({
        ...prev,
        verifying: false,
        error: error.message || '비밀번호 재인증에 실패했습니다.',
        success: '',
      }));
    }
  };

  const handleSendOtp = async () => {
    if (!currentManager.email) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '현재 계정에 이메일이 연결되어 있지 않아 이메일 인증을 보낼 수 없습니다.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification((prev) => ({ ...prev, sendingOtp: true, error: '', success: '' }));

      const { error } = await supabase.auth.signInWithOtp({
        email: currentManager.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setDelegationVerification((prev) => ({
        ...prev,
        otpSent: true,
        sendingOtp: false,
        error: '',
        success: '인증 코드를 현재 계정 이메일로 전송했습니다. 메일에 도착한 코드를 입력해 확인하세요.',
      }));
    } catch (error) {
      setDelegationVerification((prev) => ({
        ...prev,
        sendingOtp: false,
        error: error.message || '이메일 인증 코드 전송에 실패했습니다.',
        success: '',
      }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!delegationVerification.otp.trim()) {
      setDelegationVerification((prev) => ({
        ...prev,
        error: '이메일로 받은 인증 코드를 입력하세요.',
        success: '',
      }));
      return;
    }

    try {
      setDelegationVerification((prev) => ({ ...prev, verifying: true, error: '', success: '' }));

      const { data, error } = await supabase.auth.verifyOtp({
        email: currentManager.email,
        token: delegationVerification.otp.trim(),
        type: 'email',
      });

      if (error) throw error;
      if (data.user?.id !== currentManager.id) {
        throw new Error('현재 로그인 계정과 일치하지 않는 이메일 인증 결과입니다.');
      }

      setDelegationVerification((prev) => ({
        ...prev,
        otp: '',
        verifiedAt: Date.now(),
        verifiedMethod: 'email',
        verifying: false,
        error: '',
        success: '이메일 재인증이 완료되었습니다. 5분 안에 마스터 위임을 진행할 수 있습니다.',
      }));
    } catch (error) {
      setDelegationVerification((prev) => ({
        ...prev,
        verifying: false,
        error: error.message || '이메일 인증 확인에 실패했습니다.',
        success: '',
      }));
    }
  };

  const openMasterDelegationModal = (member) => {
    setMasterDelegation({ isOpen: true, member });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  };

  const closeMasterDelegationModal = () => {
    setMasterDelegation({ isOpen: false, member: null });
    setDelegationVerification(createVerificationState(currentManager.email, currentManager.phone));
  };

  const isDelegationVerified = Boolean(
    delegationVerification.verifiedAt &&
    Date.now() - delegationVerification.verifiedAt <= DELEGATION_VERIFY_WINDOW_MS
  );

  const canManageMembers = PermissionChecker.hasPermission(currentManager.role, 'member.manage');
  const canDelegateMaster = PermissionChecker.hasPermission(currentManager.role, 'master.delegate');

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

  if (!canManageMembers) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-4">
        <div className="rounded-3xl border border-red-500/30 bg-gray-950/80 px-8 py-12 text-center shadow-2xl">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-3xl font-black text-red-400 mb-4">길드원 관리 권한 없음</h2>
          <p className="text-gray-300">현재 계정에는 길드원 관리 권한이 없어 이 화면에 접근할 수 없습니다.</p>
        </div>
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
                        <div className="text-white font-medium flex items-center gap-2">{member.ByID}{isMarkedTestAccount(member) && <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>}</div>
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
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {ROLE_PERMISSIONS[member.role]?.description || '권한 정보 없음'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      {/* 개발자는 제외 */}
                      {member.role !== 'developer' && (
                        <>
                          <button
                            onClick={() => {
                              setPendingRole(member.role);
                              setActionModal({ isOpen: true, action: 'role', member });
                            }}
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
                          {member.role !== 'master' && canDelegateMaster && (
                            <button
                              onClick={() => openMasterDelegationModal(member)}
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
                  value={pendingRole}
                  onChange={(event) => setPendingRole(event.target.value)}
                >
                  <option value="associate">테스트신청자</option>
                  <option value="member">일반 클랜원</option>
                  <option value="rookie">신입 길드원</option>
                  <option value="elite">정예 길드원</option>
                  <option value="admin">관리자</option>
                </select>
                <p className="text-xs text-yellow-300/80">
                  마스터 지정은 이 메뉴가 아니라 아래의 재인증 기반 위임 절차로만 처리됩니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRoleChange(actionModal.member.id, pendingRole)}
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
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">👑 마스터 위임</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              <span className="text-white font-semibold">{masterDelegation.member?.ByID || masterDelegation.member?.discord_name || '대상 멤버'}</span> 님에게 마스터 권한을 위임합니다.
              <br />
              <span className="text-yellow-400">위임 전에 현재 로그인한 운영 계정으로 본인 재인증을 완료해야 합니다.</span>
            </p>

            <div className="rounded-xl border border-yellow-500/20 bg-black/20 p-4 space-y-4 mb-5">
              <div className="flex gap-2">
                <button
                  onClick={() => setDelegationVerification((prev) => ({ ...prev, method: 'password', error: '', success: '' }))}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${delegationVerification.method === 'password' ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  비밀번호 확인
                </button>
                <button
                  onClick={() => setDelegationVerification((prev) => ({ ...prev, method: 'email', error: '', success: '' }))}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${delegationVerification.method === 'email' ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  disabled={!currentManager.email}
                >
                  이메일 인증
                </button>
              </div>

              {delegationVerification.method === 'password' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    현재 로그인 계정의 비밀번호를 다시 입력해야 위임을 진행할 수 있습니다.
                  </p>
                  <input
                    type="password"
                    value={delegationVerification.password}
                    onChange={(event) => setDelegationVerification((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="현재 계정 비밀번호 입력"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handlePasswordVerification}
                    disabled={delegationVerification.verifying}
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-2 font-bold transition-colors"
                  >
                    {delegationVerification.verifying ? '확인 중...' : '비밀번호로 재인증'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    인증 코드를 <span className="text-cyan-300">{currentManager.email || '연결된 이메일 없음'}</span> 으로 보냅니다.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={delegationVerification.otp}
                      onChange={(event) => setDelegationVerification((prev) => ({ ...prev, otp: event.target.value }))}
                      placeholder="이메일 인증 코드 입력"
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={delegationVerification.sendingOtp || !currentManager.email}
                      className="rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-white px-4 py-2 font-bold transition-colors whitespace-nowrap"
                    >
                      {delegationVerification.sendingOtp ? '전송 중...' : delegationVerification.otpSent ? '재전송' : '코드 전송'}
                    </button>
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={delegationVerification.verifying || !delegationVerification.otp.trim()}
                    className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-2 font-bold transition-colors"
                  >
                    {delegationVerification.verifying ? '확인 중...' : '이메일 코드 확인'}
                  </button>
                </div>
              )}

              {delegationVerification.error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {delegationVerification.error}
                </div>
              )}

              {delegationVerification.success && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {delegationVerification.success}
                </div>
              )}

              <div className="text-xs text-gray-500">
                인증 성공 후 5분 안에만 위임을 실행할 수 있습니다.
                {isDelegationVerified && delegationVerification.verifiedMethod && (
                  <span className="text-emerald-300"> 현재 {delegationVerification.verifiedMethod === 'password' ? '비밀번호' : '이메일'} 재인증이 완료된 상태입니다.</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleMasterDelegation(masterDelegation.member?.id)}
                disabled={!isDelegationVerified}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:hover:bg-yellow-600 text-white py-2 rounded font-bold transition-colors"
              >
                위임 실행
              </button>
              <button
                onClick={closeMasterDelegationModal}
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
