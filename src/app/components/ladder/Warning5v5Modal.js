// 파일명: src/components/ladder/Warning5v5Modal.js
import React from 'react';

export default function Warning5v5Modal({ onAccept, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="max-w-sm w-full mx-4 p-7 rounded-2xl border-2 border-red-600 bg-[#0a0008] shadow-[0_0_30px_rgba(239,68,68,0.4)]">
        <div className="text-4xl text-center mb-4">⚠️</div>
        <h3 className="text-center font-black text-lg text-red-400 mb-3">5대5 경고</h3>
        <p className="text-sm text-gray-300 text-center mb-6 leading-relaxed">
          5대5는 공식 권장 포맷이 아닙니다.<br />
          모든 참가자의 동의가 필요하며 진행에 어려움이 있을 수 있습니다.<br /><br />
          경기 형식: BO7 (4선승제)<br />
          MMR에 영향을 미칩니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 py-3 font-black rounded-xl bg-red-700 hover:bg-red-600 text-white transition-colors"
          >
            동의하고 참여
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 font-black rounded-xl border border-gray-700 text-gray-400 hover:border-gray-500 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}