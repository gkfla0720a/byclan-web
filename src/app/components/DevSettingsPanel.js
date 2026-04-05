'use client';

import React, { useState, useEffect } from 'react';
import { saveDevSettings, loadDevSettings } from '../utils/permissions';

// 사이버틱 개발자 설정 컴포넌트
export default function DevSettingsPanel() {
  const [settings, setSettings] = useState(() => loadDevSettings());
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveDevSettings(newSettings);
  };

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
