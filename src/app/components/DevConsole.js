/**
 * @file DevConsole.js
 * @역할 시스템 개발자 전용 관리 콘솔 컴포넌트
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

const DISCORD_UNLINK_SETTING_KEY = 'discord_unlink_enabled';

export default function DevConsole() {
  const navigateTo = useNavigate();
  const [isTestMode, setIsTestMode] = useState(false);
  const [testAccountsEnabled, setTestAccountsEnabled] = useState(true);
  const [discordUnlinkEnabled, setDiscordUnlinkEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // [NEW] 데이터 백업용 상태
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState('');

  const shouldIgnoreToggleError = (error) => {
    const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    return error?.code === '42P01' || error?.code === '42703' || message.includes('does not exist');
  };

  const upsertBooleanSetting = async (key, value, description) => {
    const { error } = await supabase
      .from('developer_settings')
      .upsert({ key, value_bool: value, description, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('developer_settings')
      .select('key, value_bool')
      .in('key', [TEST_MODE_SETTING_KEY, TEST_ACCOUNT_SETTING_KEY, DISCORD_UNLINK_SETTING_KEY]);

    if (error) throw error;

    const settingsMap = Object.fromEntries((data || []).map((item) => [item.key, item.value_bool]));
    setIsTestMode(Boolean(settingsMap[TEST_MODE_SETTING_KEY]));
    setTestAccountsEnabled(settingsMap[TEST_ACCOUNT_SETTING_KEY] !== false);
    setDiscordUnlinkEnabled(Boolean(settingsMap[DISCORD_UNLINK_SETTING_KEY]));
  };

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
      { table: 'profile_meta', marker: 'is_test_account', activeField: 'is_test_account_active' },
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

        if (error && !shouldIgnoreToggleError(error)) throw error;
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

  const resetAllQueues = async () => {
    if(!confirm("모든 유저의 대기열 상태를 초기화하시겠습니까?")) return;
    const { error } = await supabase.from('ladder_queue').update({ is_in_queue: false, vote_to_start: false }).eq('is_in_queue', true);
    if (!error) alert("대기열이 모두 비워졌습니다.");
  };

  // [NEW FUNCTION 1] 머신러닝용 엑셀 API 주소 복사
  const copyMlExportLink = () => {
    const url = `${window.location.origin}/api/export-ml?page=1`;
    navigator.clipboard.writeText(url).then(() => {
      alert(`엑셀 파워쿼리용 주소가 복사되었습니다.\n\n[복사된 주소]\n${url}\n\n엑셀 메뉴 [데이터 -> 웹]에 붙여넣기 하시면 됩니다. (url 끝의 page 번호를 바꿔 과거 데이터를 조회할 수 있습니다)`);
    });
  };

  // [NEW FUNCTION 2] Supabase DB 일괄 백업 시스템
  const runDatabaseBackup = async () => {
    const startPageStr = prompt("백업을 시작할 페이지 번호를 입력하세요 (예: 1)", "1");
    if (!startPageStr) return;
    
    const endPageStr = prompt("백업을 종료할 페이지 번호를 입력하세요 (예: 10)", "10");
    if (!endPageStr) return;

    const startPage = parseInt(startPageStr, 10);
    const endPage = parseInt(endPageStr, 10);

    if (isNaN(startPage) || isNaN(endPage) || startPage > endPage) {
      alert("올바른 페이지 범위를 숫자로 입력해주세요.");
      return;
    }

    if (!confirm(`[DB 이관 작업]\n\n외부 래더 기록 ${startPage}페이지부터 ${endPage}페이지까지 DB(legacy_matches) 저장을 시작합니다.\n타겟 서버 보호를 위해 페이지당 1.5초의 대기 시간이 발생합니다.\n\n진행하시겠습니까?`)) return;

    setIsBackingUp(true);
    let successCount = 0;

    try {
      for (let p = startPage; p <= endPage; p++) {
        setBackupProgress(`데이터 추출 및 저장 중... (${p} / ${endPage} 페이지)`);

        // 1. 외부 서버에서 데이터 파싱 (우리가 만든 API 활용)
        const res = await fetch(`/api/external-records?page=${p}`);
        const json = await res.json();

        if (json.success && json.data.length > 0) {
          // 2. Supabase legacy_matches 테이블 규격에 맞게 변환
          const dbRecords = json.data.map(match => ({
            match_id: match.matchId,
            host: match.host,
            match_date: match.date,
            raw_data: match
          }));

          // 3. Supabase upsert (중복 시 덮어쓰기)
          const { error } = await supabase
            .from('legacy_matches')
            .upsert(dbRecords, { onConflict: 'match_id' });

          if (error) throw error;
          successCount += json.data.length;
        }

        // 4. 타겟 서버 차단 방지용 딜레이 (1.5초)
        if (p < endPage) await new Promise(resolve => setTimeout(resolve, 1500));
      }
      alert(`✅ 백업 완료!\n\n총 ${successCount}개의 매치 데이터가 데이터베이스에 성공적으로 이관/동기화 되었습니다.`);
    } catch (err) {
      alert(`🚨 백업 중 오류 발생:\n${err.message}`);
    } finally {
      setIsBackingUp(false);
      setBackupProgress('');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-mono">BOOTING CONSOLE...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in pb-20">
      
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
        {/* 기존 컨트롤러들 */}
        <button onClick={toggleTestMode} className={`p-6 border-2 rounded-2xl transition-all text-left group ${isTestMode ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800'}`}>
          <p className={`font-bold mb-1 text-[10px] uppercase ${isTestMode ? 'text-yellow-500' : 'text-gray-500'}`}>Server Status</p>
          <p className="text-white font-black text-xl">테스트 모드: {isTestMode ? '활성화' : '비활성화'}</p>
          <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">ON일 때만 테스터 ID들의 대기열 신청이 허용됩니다.<br/>현재 모드: <span className={isTestMode ? 'text-yellow-500' : 'text-red-500 font-bold'}>{isTestMode ? 'DEBUG' : 'STABLE'}</span></p>
        </button>

        <button onClick={resetAllQueues} className="p-6 bg-gray-800 border border-gray-700 rounded-2xl hover:border-red-500 transition-all text-left">
          <p className="text-red-500 font-bold mb-1 text-[10px] uppercase tracking-widest">Database</p>
          <p className="text-white font-black text-xl">전체 대기열 리셋</p>
          <p className="text-gray-500 text-[10px] mt-2">매칭 시스템에 유령 인원이 남았을 때 강제로 비웁니다.</p>
        </button>

        <button onClick={toggleTestAccounts} className={`p-6 border-2 rounded-2xl transition-all text-left group ${testAccountsEnabled ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-gray-800'}`}>
          <p className={`font-bold mb-1 text-[10px] uppercase ${testAccountsEnabled ? 'text-cyan-400' : 'text-gray-500'}`}>Seeded Accounts</p>
          <p className="text-white font-black text-xl">테스트 계정: {testAccountsEnabled ? '표시 중' : '숨김 처리'}</p>
          <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">주요 화면의 테스트 계정과 테스트 데이터를 일괄로 on/off 합니다.<br/>대상: {TEST_ACCOUNT_NAMES.join(', ')}</p>
        </button>

        <button onClick={toggleDiscordUnlink} className={`p-6 border-2 rounded-2xl transition-all text-left group ${discordUnlinkEnabled ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-800'}`}>
          <p className={`font-bold mb-1 text-[10px] uppercase ${discordUnlinkEnabled ? 'text-purple-400' : 'text-gray-500'}`}>Discord Auth</p>
          <p className="text-white font-black text-xl">연동 해제 기능: {discordUnlinkEnabled ? 'ON' : 'OFF'}</p>
          <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">ON이면 내 프로필 화면에 &apos;Discord 연동 해제&apos; 버튼이 표시됩니다.<br/>클랜원이 Discord 계정을 변경할 때 사용합니다. 기본값: OFF</p>
        </button>
      </div>

      {/* [NEW] 외부 데이터 마이그레이션 섹션 */}
      <div className="mt-8">
        <h3 className="text-cyan-500 font-bold text-sm mb-4 uppercase tracking-widest border-b border-gray-800 pb-2 pl-2">Data Migration & ML</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 엑셀 API URL 복사 버튼 */}
          <button 
            onClick={copyMlExportLink}
            className="p-6 bg-gray-800/80 border border-green-900/50 rounded-2xl hover:border-green-500 hover:bg-green-900/20 transition-all text-left group"
          >
            <p className="text-green-500 font-bold mb-1 text-[10px] uppercase tracking-widest">Excel Power Query</p>
            <p className="text-white font-black text-xl flex items-center gap-2">
              <i className="fa-solid fa-file-excel text-green-500"></i> ML 데이터 API 복사
            </p>
            <p className="text-gray-500 text-[10px] mt-2">
              랜덤포레스트 알고리즘 및 통계용 Flat 데이터(1줄=1선수) API 주소를 클립보드에 복사합니다.
            </p>
          </button>

          {/* Supabase DB 백업 버튼 */}
          <button 
            onClick={runDatabaseBackup}
            disabled={isBackingUp}
            className={`p-6 bg-gray-800/80 border rounded-2xl transition-all text-left group relative overflow-hidden ${
              isBackingUp ? 'border-blue-500 bg-blue-900/20 cursor-not-allowed' : 'border-blue-900/50 hover:border-blue-500 hover:bg-blue-900/20'
            }`}
          >
            <p className="text-blue-500 font-bold mb-1 text-[10px] uppercase tracking-widest">Supabase Backup</p>
            <p className="text-white font-black text-xl flex items-center gap-2">
              <i className="fa-solid fa-database text-blue-500"></i> {isBackingUp ? '동기화 진행 중...' : '기존 래더 DB 이관'}
            </p>
            <p className={`text-[10px] mt-2 font-bold ${isBackingUp ? 'text-yellow-400 animate-pulse' : 'text-gray-500'}`}>
              {isBackingUp ? backupProgress : '과거 JSON 데이터를 legacy_matches 테이블로 복제하여 리뉴얼에 대비합니다.'}
            </p>
          </button>

        </div>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <h3 className="text-gray-400 font-bold text-xs mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">Developer Logs</h3>
        <ul className="text-[10px] text-gray-600 space-y-2 list-disc pl-4 font-medium">
          <li>테스트 모드는 개발 시뮬레이션용입니다. 실사용 시 반드시 OFF로 유지하세요.</li>
          <li>대기열 리셋은 is_in_queue=true인 유저만 false로 갱신합니다.</li>
          <li>ML 데이터 API 복사 후 엑셀에서 [데이터 가져오기 - 웹]을 선택하여 활용하세요.</li>
          <li>DB 이관 작업은 페이지당 약 1.5초가 소요되며, 도중에 창을 닫으면 중단됩니다. 중복 데이터(match_id)는 덮어쓰기 되므로 안전합니다.</li>
        </ul>
      </div>
    </div>
  );
}