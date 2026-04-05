'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import {
  TEST_ACCOUNT_NAMES,
  TEST_ACCOUNT_SETTING_EVENT,
  TEST_ACCOUNT_SETTING_KEY,
  TEST_MODE_SETTING_KEY,
} from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';

export default function DevConsole() {
  const navigateTo = useNavigate();
  const [isTestMode, setIsTestMode] = useState(false);
  const [testAccountsEnabled, setTestAccountsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const shouldIgnoreToggleError = (error) => {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return error?.code === '42P01' || error?.code === '42703' || message.includes('does not exist');
  };

  const upsertBooleanSetting = async (key, value, description) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value_bool: value, description, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value_bool')
      .in('key', [TEST_MODE_SETTING_KEY, TEST_ACCOUNT_SETTING_KEY]);

    if (error) throw error;

    const settingsMap = Object.fromEntries((data || []).map((item) => [item.key, item.value_bool]));
    setIsTestMode(Boolean(settingsMap[TEST_MODE_SETTING_KEY]));
    setTestAccountsEnabled(settingsMap[TEST_ACCOUNT_SETTING_KEY] !== false);
  };

  // 1. 초기 시스템 설정 로드 (테스트 모드 상태 확인)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        await loadSettings();
      } catch (err) {
        console.error("설정 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. 테스트 모드 토글 함수
  const toggleTestMode = async () => {
    const nextMode = !isTestMode;
    try {
      await upsertBooleanSetting(TEST_MODE_SETTING_KEY, nextMode, '개발자 테스트 모드 활성화 여부');
      setIsTestMode(nextMode);
      alert(`서버 테스트 모드가 ${nextMode ? 'ON' : 'OFF'} 되었습니다.`);
    } catch (error) {
      alert("설정 업데이트 실패: " + error.message);
    }
  };

  const toggleTestAccounts = async () => {
    const nextState = !testAccountsEnabled;
    const confirmationMessage = nextState
      ? '테스트 계정과 테스트 데이터를 다시 활성화하시겠습니까?'
      : '테스트 계정과 테스트 데이터를 비활성화하시겠습니까? 주요 화면에서 숨겨집니다.';

    if (!confirm(confirmationMessage)) return;

    const operations = [
      { table: 'profiles', marker: 'is_test_account', activeField: 'is_test_account_active' },
      { table: 'ladders', marker: 'is_test_data', activeField: 'is_test_data_active' },
      { table: 'admin_posts', marker: 'is_test_data', activeField: 'is_test_data_active' },
      { table: 'posts', marker: 'is_test_data', activeField: 'is_test_data_active' },
      { table: 'applications', marker: 'is_test_data', activeField: 'is_test_data_active' },
      { table: 'notifications', marker: 'is_test_data', activeField: 'is_test_data_active' },
      { table: 'ladder_matches', marker: 'is_test_data', activeField: 'is_test_data_active' },
    ];

    try {
      for (const operation of operations) {
        const { error } = await supabase
          .from(operation.table)
          .update({ [operation.activeField]: nextState })
          .eq(operation.marker, true);

        if (error && !shouldIgnoreToggleError(error)) {
          throw error;
        }
      }

      await upsertBooleanSetting(TEST_ACCOUNT_SETTING_KEY, nextState, '테스트 계정 및 테스트 데이터 노출 여부');
      setTestAccountsEnabled(nextState);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TEST_ACCOUNT_SETTING_EVENT, { detail: nextState }));
      }
      alert(`테스트 계정이 ${nextState ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      alert('테스트 계정 토글 실패: ' + error.message);
    }
  };

  // 3. 전체 대기열 초기화
  const resetAllQueues = async () => {
    if(!confirm("모든 유저의 대기열 상태를 초기화하시겠습니까?")) return;
    const { error } = await supabase.from('profiles').update({ is_in_queue: false });
    if (!error) alert("대기열이 모두 비워졌습니다.");
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-mono">BOOTING CONSOLE...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-start border-l-4 border-red-600 pl-4">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Developer Console</h2>
          <p className="text-red-500 text-xs font-bold mt-1 tracking-widest">SYSTEM OPERATOR ACCESS</p>
        </div>
        <button 
          onClick={() => navigateTo('Home')}
          className="px-4 py-2 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-lg hover:bg-gray-700 transition-all uppercase"
        >
          Close Console
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 서버 테스트 모드 스위치 */}
        <button 
          onClick={toggleTestMode} 
          className={`p-6 border-2 rounded-2xl transition-all text-left group ${isTestMode ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800'}`}
        >
          <p className={`font-bold mb-1 text-[10px] uppercase ${isTestMode ? 'text-yellow-500' : 'text-gray-500'}`}>Server Status</p>
          <p className="text-white font-black text-xl">테스트 모드: {isTestMode ? '활성화' : '비활성화'}</p>
          <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">
            ON일 때만 테스터 ID들의 대기열 신청이 허용됩니다.<br/>
            현재 모드: <span className={isTestMode ? 'text-yellow-500' : 'text-red-500 font-bold'}>{isTestMode ? 'DEBUG' : 'STABLE'}</span>
          </p>
        </button>

        {/* 대기열 리셋 */}
        <button 
          onClick={resetAllQueues}
          className="p-6 bg-gray-800 border border-gray-700 rounded-2xl hover:border-red-500 transition-all text-left"
        >
          <p className="text-red-500 font-bold mb-1 text-[10px] uppercase tracking-widest">Database</p>
          <p className="text-white font-black text-xl">전체 대기열 리셋</p>
          <p className="text-gray-500 text-[10px] mt-2">매칭 시스템에 유령 인원이 남았을 때 강제로 비웁니다.</p>
        </button>

        <button 
          onClick={toggleTestAccounts}
          className={`p-6 border-2 rounded-2xl transition-all text-left group ${testAccountsEnabled ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-gray-800'}`}
        >
          <p className={`font-bold mb-1 text-[10px] uppercase ${testAccountsEnabled ? 'text-cyan-400' : 'text-gray-500'}`}>Seeded Accounts</p>
          <p className="text-white font-black text-xl">테스트 계정: {testAccountsEnabled ? '표시 중' : '숨김 처리'}</p>
          <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">
            주요 화면의 테스트 계정과 테스트 데이터를 일괄로 on/off 합니다.<br/>
            대상: {TEST_ACCOUNT_NAMES.join(', ')}
          </p>
        </button>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <h3 className="text-gray-400 font-bold text-xs mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">Developer Logs</h3>
        <ul className="text-[10px] text-gray-600 space-y-2 list-disc pl-4 font-medium">
          <li>테스트 모드는 개발 시뮬레이션용입니다. 실사용 시 반드시 OFF로 유지하세요.</li>
          <li>대기열 리셋은 DB의 모든 유저 데이터를 즉시 반영합니다.</li>
          <li>테스트 계정 토글은 `is_test_account_active` 및 `is_test_data_active` 플래그를 갱신합니다.</li>
          <li>테스트 계정이 열려 있는 동안에는 테스트 계정에 한해 래더 Discord 연동 필수 검사가 임시 우회됩니다.</li>
        </ul>
      </div>
    </div>
  );
}