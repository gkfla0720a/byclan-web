/**
 * @file DevSettingsPanel.js
 * @역할 브라우저 로컬 스토리지 기반 개발자 편의 설정 패널 컴포넌트
 * @주요기능
 *   - 화면 우하단에 고정된 ⚙️ 버튼으로 열리는 개발자 설정 패널
 *   - 가입 심사 권한, 멤버 관리 권한, 마스터 위임 권한 토글
 *   - 래더 Discord 연동 필수 검사 ON/OFF (개발 시 우회용)
 *   - 설정값은 브라우저 로컬 스토리지에 저장되므로 새로고침 후에도 유지됨
 * @사용방법
 *   개발 환경에서 편의를 위해 사용합니다.
 *   이 컴포넌트를 렌더링하면 자동으로 우하단 고정 버튼이 표시됩니다.
 *   <DevSettingsPanel />
 * @관련컴포넌트 DevConsole.js (서버 기반 설정), permissions.js (saveDevSettings, loadDevSettings)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { saveDevSettings, loadDevSettings } from '../utils/permissions';

/**
 * DevSettingsPanel 컴포넌트
 * 개발자 편의를 위한 권한/기능 토글 패널입니다.
 * 설정은 브라우저 로컬 스토리지에 저장되며 서버 DB와는 무관합니다.
 */
// 사이버틱 개발자 설정 컴포넌트
export default function DevSettingsPanel() {
  /**
   * 현재 개발자 설정 상태 객체.
   * 초기값은 로컬 스토리지에서 loadDevSettings()로 불러옵니다.
   * 예: { canReviewApplications: true, canManageMembers: false, ... }
   */
  const [settings, setSettings] = useState(() => loadDevSettings());
  /** 설정 패널이 열려있는지 여부 (false이면 우하단 버튼만 표시) */
  const [isOpen, setIsOpen] = useState(false);

  /**
   * 특정 설정 키의 boolean 값을 반전(toggle)시키고 로컬 스토리지에 저장합니다.
   * @param {string} key - 토글할 설정 키 (예: 'canReviewApplications')
   */
  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveDevSettings(newSettings);
  };

  /**
   * 패널에 표시할 토글 항목 목록.
   * key: settings 객체의 키 이름
   * title: 화면에 표시되는 한국어 제목
   * desc: 기능 설명
   */
  const toggleItems = [
    {
      key: 'canReviewApplications',
      title: '가입 심사 권한',
      desc: '가입 신청 심사 접근',
    },
    {
      key: 'canManageMembers',
      title: '멤버 관리 권한',
      desc: '길드원 등급 변경 및 관리',
    },
    {
      key: 'canDelegateMaster',
      title: '마스터 위임 권한',
      desc: '마스터 역할 위임 가능',
    },
    {
      key: 'requireDiscordForLadder',
      title: '래더 Discord 연동 필수',
      desc: '래더 참여 시 Discord 연동 요구 (OFF: 개발 편의용 우회)',
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-900/60 hover:bg-purple-800/80 text-purple-300 px-4 py-2 rounded-lg shadow-lg border border-purple-500/30 transition-all hover:scale-105 font-bold text-sm"
        style={{ boxShadow: '0 0 12px rgba(168,85,247,0.2)' }}
      >
        ⚙️ 개발자 설정
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0d0d14] border border-purple-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl" style={{ boxShadow: '0 0 40px rgba(168,85,247,0.1)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-400" style={{ textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
            👨‍💻 개발자 설정
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {toggleItems.map(({ key, title, desc }) => (
            <div key={key} className="bg-gray-900/60 p-4 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="text-white font-medium text-sm">{title}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(key)}
                  className={`w-12 h-6 rounded-full transition-colors shrink-0 relative ${
                    settings[key] ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                  aria-label={`${title} ${settings[key] ? '비활성화' : '활성화'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    settings[key] ? 'translate-x-[26px]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
          <p className="text-purple-400 text-xs">
            ⚠️ 개발자 설정은 브라우저에 저장됩니다. 설정을 변경하면 즉시 적용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
