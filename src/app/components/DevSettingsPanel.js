'use client';

import React, { useState, useEffect } from 'react';
import { saveDevSettings, loadDevSettings } from '../utils/permissions';

// 사이버틱 개발자 설정 컴포넌트
export default function DevSettingsPanel() {
  const [settings, setSettings] = useState({
    canReviewApplications: false,
    canManageMembers: false,
    canDelegateMaster: false
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSettings(loadDevSettings());
  }, []);

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveDevSettings(newSettings);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg border border-purple-400/30 transition-all hover:scale-105 font-bold text-sm"
      >
        ⚙️ 개발자 설정
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-400">👨‍💻 개발자 설정</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">가입 심사 권한</h3>
                <p className="text-gray-400 text-sm">가입 신청 심사 접근</p>
              </div>
              <button
                onClick={() => handleToggle('canReviewApplications')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.canReviewApplications 
                    ? 'bg-purple-500' 
                    : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.canReviewApplications 
                    ? 'translate-x-6' 
                    : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">멤버 관리 권한</h3>
                <p className="text-gray-400 text-sm">길드원 등급 변경 및 관리</p>
              </div>
              <button
                onClick={() => handleToggle('canManageMembers')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.canManageMembers 
                    ? 'bg-purple-500' 
                    : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.canManageMembers 
                    ? 'translate-x-6' 
                    : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">마스터 위임 권한</h3>
                <p className="text-gray-400 text-sm">마스터 역할 위임 가능</p>
              </div>
              <button
                onClick={() => handleToggle('canDelegateMaster')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.canDelegateMaster 
                    ? 'bg-purple-500' 
                    : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.canDelegateMaster 
                    ? 'translate-x-6' 
                    : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <p className="text-purple-300 text-sm">
            ⚠️ 개발자 설정은 브라우저에 저장됩니다. 설정을 변경하면 즉시 적용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
