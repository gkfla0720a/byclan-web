'use client';

import React, { useState, useEffect } from 'react'; // ✨ 여기서 useState를 가져와야 에러가 안 납니다!
import { supabase } from '@/supabase';

export default function DevConsole({ navigateTo }) {
  const [isTestMode, setIsTestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. 초기 시스템 설정 로드 (테스트 모드 상태 확인)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'test_mode_active')
          .single();
        
        if (data) setIsTestMode(data.value_bool);
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
    const { error } = await supabase
      .from('system_settings')
      .update({ value_bool: nextMode, updated_at: new Date() })
      .eq('key', 'test_mode_active');
    
    if (!error) {
      setIsTestMode(nextMode);
      alert(`서버 테스트 모드가 ${nextMode ? 'ON' : 'OFF'} 되었습니다.`);
    } else {
      alert("설정 업데이트 실패: " + error.message);
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
      </div>

      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <h3 className="text-gray-400 font-bold text-xs mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">Developer Logs</h3>
        <ul className="text-[10px] text-gray-600 space-y-2 list-disc pl-4 font-medium">
          <li>테스트 모드는 개발 시뮬레이션용입니다. 실사용 시 반드시 OFF로 유지하세요.</li>
          <li>대기열 리셋은 DB의 모든 유저 데이터를 즉시 반영합니다.</li>
        </ul>
      </div>
    </div>
  );
}