/**
 * @file DevConsole.js
 * @역할 시스템 개발자 전용 관리 콘솔 컴포넌트
 * @주요기능
 *   - 서버 테스트 모드 ON/OFF 토글 (system_settings 테이블 기반)
 *   - 테스트 계정 및 테스트 데이터 일괄 활성화/비활성화
 *   - 전체 유저 대기열(is_in_queue) 초기화
 *   - 개발자 로그(주의사항) 표시
 * @사용방법
 *   MyProfile 화면에서 'developer' 등급일 때만 보이는 톱니바퀴 버튼을 클릭하면 진입합니다.
 *   이 컴포넌트는 오직 'developer' 등급만 접근할 수 있어야 합니다.
 * @관련컴포넌트 MyProfile.js, DevSettingsPanel.js
 */
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

/** system_settings 키: Discord 연동 해제 기능 활성화 여부 (기본값: false) */
const DISCORD_UNLINK_SETTING_KEY = 'discord_unlink_enabled';

/**
 * DevConsole 컴포넌트
 * 시스템 개발자를 위한 관리 콘솔입니다.
 * 테스트 모드, 테스트 계정 노출, 대기열 리셋 등을 제어합니다.
 */
export default function DevConsole() {
  /** 페이지 전환을 위한 내비게이션 함수 (콘솔 닫기 시 Home으로 이동) */
  const navigateTo = useNavigate();
  /** 서버 테스트 모드 활성화 여부 (true = 테스트 모드 ON) */
  const [isTestMode, setIsTestMode] = useState(false);
  /** 테스트 계정 및 테스트 데이터가 화면에 표시되는지 여부 */
  const [testAccountsEnabled, setTestAccountsEnabled] = useState(true);
  /** Discord 연동 해제 기능 활성화 여부 (기본값: false) */
  const [discordUnlinkEnabled, setDiscordUnlinkEnabled] = useState(false);
  /** system_settings 데이터를 불러오는 중인지 여부 */
  const [loading, setLoading] = useState(true);

  /**
   * 테이블/컬럼 미존재 등 무시해도 되는 토글 에러인지 판별합니다.
   * @param {object} error - Supabase 에러 객체
   * @returns {boolean} 무시 가능한 에러이면 true
   */
  const shouldIgnoreToggleError = (error) => {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return error?.code === '42P01' || error?.code === '42703' || message.includes('does not exist');
  };

  /**
   * system_settings 테이블에 boolean 설정값을 upsert(없으면 추가, 있으면 업데이트)합니다.
   * @async
   * @param {string} key - 설정 키 이름
   * @param {boolean} value - 설정할 boolean 값
   * @param {string} description - 설정 설명 (DB에 함께 저장)
   */
  const upsertBooleanSetting = async (key, value, description) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value_bool: value, description, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;
  };

  /**
   * system_settings 테이블에서 테스트 모드와 테스트 계정 설정값을 불러옵니다.
   * @async
   */
  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value_bool')
      .in('key', [TEST_MODE_SETTING_KEY, TEST_ACCOUNT_SETTING_KEY, DISCORD_UNLINK_SETTING_KEY]);

    if (error) throw error;

    const settingsMap = Object.fromEntries((data || []).map((item) => [item.key, item.value_bool]));
    setIsTestMode(Boolean(settingsMap[TEST_MODE_SETTING_KEY]));
    setTestAccountsEnabled(settingsMap[TEST_ACCOUNT_SETTING_KEY] !== false);
    setDiscordUnlinkEnabled(Boolean(settingsMap[DISCORD_UNLINK_SETTING_KEY]));
  };

  /**
   * 컴포넌트가 마운트될 때 system_settings에서 현재 설정값을 불러옵니다.
   * 빈 배열 []이므로 최초 1회만 실행됩니다.
   */
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

  /**
   * 서버 테스트 모드를 현재 상태와 반대로 토글합니다.
   * ON일 때만 테스터 계정의 대기열 신청이 허용됩니다.
   * @async
   */
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

  /**
   * 테스트 계정과 테스트 데이터의 표시 여부를 일괄로 토글합니다.
   * profiles, ladders, admin_posts, posts, applications, notifications, ladder_matches 테이블
   * 의 is_test_account_active / is_test_data_active 플래그를 일괄 업데이트합니다.
   * 변경 후 브라우저 커스텀 이벤트(TEST_ACCOUNT_SETTING_EVENT)를 발행합니다.
   * @async
   */
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

  /**
   * Discord 연동 해제 기능의 활성화 여부를 토글합니다.
   * ON이면 MyProfile 화면에 "Discord 연동 해제" 버튼이 표시됩니다.
   * 기본값은 OFF입니다. 클랜 정책에 따라 사용 여부를 결정하세요.
   * @async
   */
  const toggleDiscordUnlink = async () => {
    const nextState = !discordUnlinkEnabled;
    try {
      await upsertBooleanSetting(DISCORD_UNLINK_SETTING_KEY, nextState, 'Discord 연동 해제 기능 활성화 여부');
      setDiscordUnlinkEnabled(nextState);
      alert(`Discord 연동 해제 기능이 ${nextState ? 'ON (활성화)' : 'OFF (비활성화)'} 되었습니다.`);
    } catch (error) {
      alert("설정 업데이트 실패: " + error.message);
    }
  };

  /**
   * profiles 테이블의 모든 유저 is_in_queue를 false로 초기화합니다.
   * 매칭 시스템에 유령 인원이 남아있을 때 강제로 비우는 용도입니다.
   * @async
   */
  // 3. 전체 대기열 초기화
  const resetAllQueues = async () => {
    if(!confirm("모든 유저의 대기열 상태를 초기화하시겠습니까?")) return;
    const { error } = await supabase.from('profiles').update({ is_in_queue: false }).eq('is_in_queue', true);
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

        {/* Discord 연동 해제 기능 토글 */}
        <button
          onClick={toggleDiscordUnlink}
          className={`p-6 border-2 rounded-2xl transition-all text-left group ${discordUnlinkEnabled ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-800'}`}
        >
          <p className={`font-bold mb-1 text-[10px] uppercase ${discordUnlinkEnabled ? 'text-purple-400' : 'text-gray-500'}`}>Discord Auth</p>
          <p className="text-white font-black text-xl">연동 해제 기능: {discordUnlinkEnabled ? 'ON' : 'OFF'}</p>
          <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">
            ON이면 내 프로필 화면에 &apos;Discord 연동 해제&apos; 버튼이 표시됩니다.<br/>
            클랜원이 Discord 계정을 변경할 때 사용합니다. 기본값: OFF
          </p>
        </button>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <h3 className="text-gray-400 font-bold text-xs mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">Developer Logs</h3>
        <ul className="text-[10px] text-gray-600 space-y-2 list-disc pl-4 font-medium">
          <li>테스트 모드는 개발 시뮬레이션용입니다. 실사용 시 반드시 OFF로 유지하세요.</li>
          <li>대기열 리셋은 is_in_queue=true인 유저만 false로 갱신합니다.</li>
          <li>테스트 계정 토글은 `is_test_account_active` 및 `is_test_data_active` 플래그를 갱신합니다.</li>
          <li>테스트 계정이 열려 있는 동안에는 테스트 계정에 한해 래더 Discord 연동 필수 검사가 임시 우회됩니다.</li>
          <li>Discord 연동 해제 기능은 기본 OFF입니다. ON 시 클랜원이 내 프로필에서 Discord를 해제·재연동할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}