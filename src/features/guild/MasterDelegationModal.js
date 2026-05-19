'use client';

/**
 * 마스터 위임 모달 UI 컴포넌트입니다.
 * 비밀번호 재인증 또는 이메일 OTP 인증 후 위임을 실행합니다.
 */
export default function MasterDelegationModal({
  isOpen,
  member,
  currentManager,
  delegationVerification,
  isDelegationVerified,
  onPasswordChange,
  onOtpChange,
  onMethodChange,
  onPasswordVerify,
  onSendOtp,
  onVerifyOtp,
  onDelegate,
  onClose,
}) {
  if (!isOpen || !member) return null;

  const { method, password, otp, otpSent, sendingOtp, verifying, error, success, verifiedMethod } = delegationVerification;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 max-w-lg w-full shadow-2xl">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">👑 마스터 위임</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          <span className="text-white font-semibold">{member.by_id || '[by_id 없음]'}</span> 님에게 마스터 권한을 위임합니다.
          <br />
          <span className="text-yellow-400">위임 전에 현재 로그인한 운영 계정으로 본인 재인증을 완료해야 합니다.</span>
        </p>

        <div className="rounded-xl border border-yellow-500/20 bg-black/20 p-4 space-y-4 mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => onMethodChange('password')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${method === 'password' ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              비밀번호 확인
            </button>
            <button
              onClick={() => onMethodChange('email')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${method === 'email' ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              disabled={!currentManager.email}
            >
              이메일 인증
            </button>
          </div>

          {method === 'password' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                현재 로그인 계정의 비밀번호를 다시 입력해야 위임을 진행할 수 있습니다.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="현재 계정 비밀번호 입력"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-cyan-400"
              />
              <button
                onClick={onPasswordVerify}
                disabled={verifying}
                className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-2 font-bold transition-colors"
              >
                {verifying ? '확인 중...' : '비밀번호로 재인증'}
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
                  value={otp}
                  onChange={(e) => onOtpChange(e.target.value)}
                  placeholder="이메일 인증 코드 입력"
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
                <button
                  onClick={onSendOtp}
                  disabled={sendingOtp || !currentManager.email}
                  className="rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-white px-4 py-2 font-bold transition-colors whitespace-nowrap"
                >
                  {sendingOtp ? '전송 중...' : otpSent ? '재전송' : '코드 전송'}
                </button>
              </div>
              <button
                onClick={onVerifyOtp}
                disabled={verifying || !otp}
                className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-2 font-bold transition-colors"
              >
                {verifying ? '확인 중...' : '이메일 코드 확인'}
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {success}
            </div>
          )}

          <div className="text-xs text-gray-500">
            인증 성공 후 5분 안에만 위임을 실행할 수 있습니다.
            {isDelegationVerified && verifiedMethod && (
              <span className="text-emerald-300">
                {' '}현재 {verifiedMethod === 'password' ? '비밀번호' : '이메일'} 재인증이 완료된 상태입니다.
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDelegate}
            disabled={!isDelegationVerified}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white py-2 rounded font-bold transition-colors"
          >
            위임 실행
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
