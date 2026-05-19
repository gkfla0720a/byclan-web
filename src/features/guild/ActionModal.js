'use client';

/**
 * 클랜원 등급 변경 또는 제명 처리 모달 UI 컴포넌트입니다.
 */
export default function ActionModal({
  isOpen,
  action,
  member,
  pendingRole,
  onPendingRoleChange,
  onConfirm,
  onClose,
}) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">
          {action === 'role' ? '등급 변경' : '제명 처리'}
        </h3>

        {action === 'role' ? (
          <div className="space-y-3">
            <p className="text-gray-300">{member.by_id}님의 등급을 변경합니다.</p>
            <select
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
              value={pendingRole}
              onChange={(e) => onPendingRoleChange(e.target.value)}
            >
              <option value="applicant">신규 가입자</option>
              <option value="rookie">신입 클랜원</option>
              <option value="member">일반 클랜원</option>
              <option value="elite">정예 클랜원</option>
              <option value="admin">관리자</option>
            </select>
            <p className="text-xs text-yellow-300/80">
              마스터 지정은 이 메뉴가 아니라 재인증 기반 위임 절차로만 처리됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold transition-colors"
              >
                변경
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-300">
              {member.by_id}님을 제명하시겠습니까?
              <br />
              <span className="text-red-400">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold transition-colors"
              >
                제명
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
