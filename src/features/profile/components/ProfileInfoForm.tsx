/**
 * ProfileInfoForm - 프로필 정보 입력 폼
 * - 클랜 닉네임 (By_)
 * - 주종족 선택
 * - 한줄 자기소개
 * - 저장 버튼
 */

'use client';

import type { Race, ProfileFormState } from '../types/profile';

interface ProfileInfoFormProps {
  formState: ProfileFormState;
  onInputChange: (value: string) => void;
  onCheckDuplicate: () => void;
  onRaceChange: (race: Race) => void;
  onIntroChange: (intro: string) => void;
  onUpdate: () => void;
}

export function ProfileInfoForm({
  formState,
  onInputChange,
  onCheckDuplicate,
  onRaceChange,
  onIntroChange,
  onUpdate,
}: ProfileInfoFormProps) {
  const { clanNameInput, race, intro, isNicknameAvailable, isUpdating } = formState;

  return (
    <div className="bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-xl space-y-6">
      {/* by_id 미설정 경고 배너 */}
      {!clanNameInput && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm font-bold flex items-center gap-2">
          ⚠️ By닉네임이 설정되지 않았습니다. 아이디를 입력하고 중복 확인 후 저장해주세요.
        </div>
      )}

      {/* 1. 닉네임 설정 */}
      <div>
        <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">
          1. 클랜 닉네임 (By_ ID)
        </label>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center bg-gray-900 border border-gray-600 rounded-xl overflow-hidden focus-within:border-yellow-500 transition-colors">
            <span className="px-4 bg-gray-800 text-yellow-500 font-black text-sm border-r border-gray-700">
              By_
            </span>
            <input
              type="text"
              value={clanNameInput}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="아이디"
              className="w-full p-3.5 bg-transparent text-white font-bold focus:outline-none"
            />
          </div>
          <button
            onClick={onCheckDuplicate}
            className="px-6 py-3.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-sm transition-all border border-gray-600 shadow-lg"
          >
            중복 확인
          </button>
        </div>
        <p
          className={`text-[10px] mt-2 font-bold ${
            isNicknameAvailable ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isNicknameAvailable
            ? '✓ 사용 가능한 닉네임입니다.'
            : '⚠ 변경 시 중복 확인이 반드시 필요합니다.'}
        </p>
      </div>

      {/* 2. 종족 선택 */}
      <div>
        <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">
          2. 주종족 선택
        </label>
        <select
          value={race}
          onChange={(e) => onRaceChange(e.target.value as Race)}
          className="w-full p-3.5 rounded-xl bg-gray-900 border border-gray-600 text-white font-bold text-sm focus:border-yellow-500 focus:outline-none transition-all cursor-pointer"
        >
          <option value="미지정">선택해 주세요</option>
          <option value="Protoss">프로토스 (Protoss)</option>
          <option value="Terran">테란 (Terran)</option>
          <option value="Zerg">저그 (Zerg)</option>
          <option value="Random">랜덤 (Random)</option>
        </select>
      </div>

      {/* 3. 자기소개 */}
      <div>
        <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">
          3. 한줄 자기소개
        </label>
        <textarea
          value={intro}
          onChange={(e) => onIntroChange(e.target.value)}
          placeholder="클랜원들에게 보여질 한마디를 입력하세요."
          rows={3}
          className="w-full p-4 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-yellow-500 focus:outline-none resize-none transition-all"
        />
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={onUpdate}
        disabled={isUpdating || !isNicknameAvailable}
        className={`w-full py-4 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95
          ${
            isNicknameAvailable && !isUpdating
              ? 'bg-linear-to-r from-yellow-600 to-yellow-500 text-gray-900 hover:brightness-110'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
      >
        {isUpdating ? '데이터 처리 중...' : '변경 사항 저장하기'}
      </button>
    </div>
  );
}
