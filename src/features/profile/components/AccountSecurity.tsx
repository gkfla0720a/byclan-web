/**
 * AccountSecurity - 계정 보안 (이메일, 비밀번호 변경)
 * - 이메일 변경
 * - 비밀번호 변경
 */

'use client';

import { useState } from 'react';
import { updateEmail, updatePassword } from '../services/profileService';
import type { LinkMessage } from '../types/profile';

interface AccountSecurityProps {
  authEmail: string;
  usesInternalLogin: boolean;
  accountId?: string;
}

export function AccountSecurity({
  authEmail,
  usesInternalLogin,
  accountId,
}: AccountSecurityProps) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<LinkMessage | null>(null);

  const validateNewPassword = (pw: string): string | null => {
    if (!pw) return '새 비밀번호를 입력하세요.';
    if (pw.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(pw)) return '영문자가 포함되어야 합니다.';
    if (!/[0-9]/.test(pw)) return '숫자가 포함되어야 합니다.';
    return null;
  };

  const handleEmailChange = async () => {
    if (!newEmail)
      return setSecurityMsg({ type: 'error', text: '새 이메일 주소를 입력하세요.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
      return setSecurityMsg({ type: 'error', text: '올바른 이메일 형식이 아닙니다.' });
    if (newEmail === authEmail)
      return setSecurityMsg({ type: 'error', text: '현재 이메일과 동일합니다.' });

    setSecurityLoading(true);
    setSecurityMsg(null);
    try {
      await updateEmail(newEmail);
      setSecurityMsg({
        type: 'success',
        text: `확인 이메일이 발송되었습니다. 기존 주소(${authEmail})와 새 주소(${newEmail}) 양쪽의 링크를 모두 클릭해야 변경이 완료됩니다.`,
      });
      setNewEmail('');
    } catch (err) {
      setSecurityMsg({
        type: 'error',
        text: '이메일 변경 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'),
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const pwErr = validateNewPassword(newPassword);
    if (pwErr) return setSecurityMsg({ type: 'error', text: pwErr });
    if (newPassword !== confirmNewPassword)
      return setSecurityMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
    if (!currentPassword)
      return setSecurityMsg({ type: 'error', text: '현재 비밀번호를 입력하세요.' });
    if (currentPassword === newPassword)
      return setSecurityMsg({ type: 'error', text: '새 비밀번호가 현재 비밀번호와 동일합니다.' });

    setSecurityLoading(true);
    setSecurityMsg(null);
    try {
      await updatePassword(authEmail, currentPassword, newPassword);
      setSecurityMsg({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setSecurityMsg({
        type: 'error',
        text: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-xl space-y-8">
      <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] border-b border-gray-700/50 pb-3">
        🔒 계정 보안
      </h3>

      {securityMsg && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-bold ${
            securityMsg.type === 'success'
              ? 'bg-emerald-900/30 border border-emerald-500/50 text-emerald-300'
              : 'bg-red-900/30 border border-red-500/50 text-red-300'
          }`}
        >
          {securityMsg.type === 'success' ? '✓ ' : '⚠ '}
          {securityMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 이메일 변경 */}
        <div className="space-y-4">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            {usesInternalLogin ? '로그인 아이디' : '이메일 변경'}
          </h4>
          {usesInternalLogin ? (
            <>
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">
                  현재 로그인 아이디
                </label>
                <input
                  type="text"
                  value={accountId || ''}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-300 cursor-not-allowed text-sm"
                />
              </div>
              <p className="text-gray-600 text-[10px] leading-relaxed">
                일반 아이디 로그인 계정은 내부 인증용 이메일을 별도로 사용합니다. 현재 버전에서는
                로그인 아이디 변경을 지원하지 않습니다.
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">
                  현재 이메일
                </label>
                <input
                  type="text"
                  value={authEmail}
                  disabled
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-500 cursor-not-allowed text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">
                  새 이메일
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  className="w-full p-3 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-cyan-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-gray-600 text-[10px] leading-relaxed">
                변경 시 기존 이메일과 새 이메일 양쪽 모두에 확인 링크가 발송됩니다. 두 링크를 모두
                클릭해야 변경이 완료됩니다.
              </p>
              <button
                onClick={handleEmailChange}
                disabled={securityLoading || !newEmail}
                className="w-full py-3 bg-cyan-700/30 hover:bg-cyan-700/50 border border-cyan-500/40 text-cyan-300 text-xs font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {securityLoading ? '처리 중...' : '이메일 변경 요청'}
              </button>
            </>
          )}
        </div>

        {/* 비밀번호 변경 */}
        <div className="space-y-4">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest">비밀번호 변경</h4>
          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호"
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-yellow-500 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8자 이상, 영문+숫자 포함"
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-yellow-500 focus:outline-none transition-all"
            />
            {newPassword && (
              <div className="flex gap-3 mt-1.5 text-[10px]">
                <span className={newPassword.length >= 8 ? 'text-green-400' : 'text-gray-600'}>
                  ✓ 8자 이상
                </span>
                <span className={/[a-zA-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-600'}>
                  ✓ 영문 포함
                </span>
                <span className={/[0-9]/.test(newPassword) ? 'text-green-400' : 'text-gray-600'}>
                  ✓ 숫자 포함
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="비밀번호 재입력"
              className={`w-full p-3 rounded-xl bg-gray-900 border text-white text-sm focus:outline-none transition-all ${
                newPassword && confirmNewPassword
                  ? newPassword === confirmNewPassword
                    ? 'border-emerald-500'
                    : 'border-red-500'
                  : 'border-gray-600'
              }`}
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={securityLoading || !currentPassword || !newPassword || !confirmNewPassword}
            className="w-full py-3 bg-yellow-700/30 hover:bg-yellow-700/50 border border-yellow-500/40 text-yellow-300 text-xs font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {securityLoading ? '처리 중...' : '비밀번호 변경'}
          </button>
        </div>
      </div>
    </div>
  );
}
