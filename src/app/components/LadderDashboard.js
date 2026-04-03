'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard({ onMatchEnter }) {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTestModeActive, setIsTestModeActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🤖 시뮬레이션용 테스트 계정 리스트 (10개)
  const testAccounts = Array.from({ length: 10 }, (_, i) => `By_Test${String(i + 1).padStart(2, '0')}`);

  // --- [1. 데이터 동기화 및 권한 로드] ---
  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 내 프로필 정보 로드
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p);

      // 진행 중인 경기 여부 확인
      const { data: m } = await supabase.from('ladder_matches')
        .select('id').eq('status', '진행중')
        .or(`team_a.cs.{${user.id}},team_b.cs.{${user.id}}`).maybeSingle();
      
      if (m) onMatchEnter(m.id);

      // 대기열 목록 실시간 동기화
      const { data: q } = await supabase.from('profiles').select('id, ByID, ladder_points').eq('is_in_queue', true);
      setWaitingUsers(q || []);

      // 시스템 설정(테스트 모드) 확인
      const { data: settings } = await supabase.from('system_settings').select('value_bool').eq('key', 'test_mode_active').single();
      setIsTestModeActive(settings?.value_bool || false);

    } catch (error) {
      console.error("데이터 동기화 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [onMatchEnter]);

  useEffect(() => {
    fetchData();
    // 실시간 구독: 프로필 테이블 변경 시 목록 갱신
    const channel = supabase.channel('ladder_lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [fetchData]);


  // --- [2. 매칭 알고리즘: 황금 밸런스] ---
  const getBalancedTeams = (users) => {
    const size = Math.floor(users.length / 2);
    let bestDiff = Infinity;
    let bestCombination = { teamA: [], teamB: [] };

    const combine = (start, combo) => {
      if (combo.length === size) {
        const teamA = combo;
        const teamB = users.filter(u => !teamA.some(au => au.id === u.id));
        const sumA = teamA.reduce((sum, u) => sum + (u.ladder_points || 1000), 0);
        const sumB = teamB.reduce((sum, u) => sum + (u.ladder_points || 1000), 0);
        const diff = Math.abs(sumA - sumB);
        
        if (diff < bestDiff) {
          bestDiff = diff;
          bestCombination = { teamA, teamB };
        }
        return;
      }
      for (let i = start; i < users.length; i++) {
        combine(i + 1, [...combo, users[i]]);
      }
    };
    combine(0, []);
    return bestCombination;
  };

  const startMatch = async () => {
    if (isProcessing || waitingUsers.length < 2) return;
    setIsProcessing(true);
    try {
      const { teamA, teamB } = getBalancedTeams(waitingUsers);
      
      const { data: match, error: mError } = await supabase.from('ladder_matches').insert({
        match_type: Math.floor(waitingUsers.length / 2),
        team_a: teamA.map(u => u.id),
        team_b: teamB.map(u => u.id),
        status: '진행중',
        host_id: profile.id
      }).select().single();

      if (mError) throw mError;

      // 매칭 성사된 유저들 대기열에서 해제
      const pIds = waitingUsers.map(u => u.id);
      await supabase.from('profiles').update({ is_in_queue: false }).in('id', pIds);
      
      onMatchEnter(match.id);
    } catch (e) {
      alert("경기 생성 중 오류: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };


  // --- [3. 액션 핸들러] ---
  const toggleQueue = async () => {
    if (!profile?.ByID?.startsWith('By_')) return alert("⚠️ 'By_' 닉네임 설정이 필요합니다.");
    
    // 테스트 계정인데 테스트 모드가 꺼져있으면 진입 차단 (개발자 보호)
    if (profile.ByID.startsWith('By_Test') && !isTestModeActive) {
      return alert("현재 서버 테스트 모드가 비활성화 상태입니다.");
    }

    await supabase.from('profiles').update({ is_in_queue: !profile.is_in_queue }).eq('id', profile.id);
  };

  // 🚀 개발자 전용: 6인 즉시 투입
  const injectTestUsers = async () => {
    if (!isTestModeActive) return alert("개발자 콘솔(⚙️)에서 테스트 모드를 먼저 ON 하세요.");
    
    const { data: tests } = await supabase.from('profiles')
      .select('id')
      .ilike('ByID', 'By_Test%')
      .limit(6);

    if (!tests || tests.length < 6) return alert("DB에 테스트 계정이 부족합니다 (최소 6개 필요).");
    
    const ids = tests.map(t => t.id);
    await supabase.from('profiles').update({ is_in_queue: true }).in('id', ids);
    alert("테스트 인원 6명이 전장에 투입되었습니다!");
  };

  if (loading) return <div className="py-20 text-center font-mono text-cyan-500 animate-pulse tracking-widest uppercase">Initializing Battle Net...</div>;

  // 권한 체크: 개발자 여부
  const currentRole = profile?.role?.trim().toLowerCase();
  const isDeveloper = currentRole === 'developer';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in font-sans">
      
      {/* 🏆 점수판 메인 카드 */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden group">
        {isTestModeActive && isDeveloper && (
          <div className="absolute top-0 left-0 bg-yellow-500 text-black text-[10px] px-3 font-black py-1 tracking-tighter shadow-lg">DEVELOPER TEST MODE</div>
        )}
        
        <p className="text-gray-500 text-[10px] font-black tracking-[0.3em] mb-4 uppercase">Current Ranking Points</p>
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-400 to-yellow-600 italic mb-6 drop-shadow-sm">
          {profile?.ladder_points || 0}<span className="text-xl ml-3 text-yellow-600/80 not-italic font-bold">PTS</span>
        </h1>
        <h3 className="text-white font-black text-2xl mb-8 tracking-tight">{profile?.ByID}</h3>
        
        <button 
          onClick={toggleQueue}
          className={`w-full max-w-sm py-5 rounded-2xl font-black text-xl shadow-2xl transition-all active:scale-95 
            ${profile?.is_in_queue 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20'}`}
        >
          {profile?.is_in_queue ? '매칭 취소 (CANCEL)' : '래더 매칭 시작 (READY)'}
        </button>
      </div>

      {/* ⚔️ 매칭 발견 알림 (짝수 인원 충족 시) */}
      {waitingUsers.length >= 2 && waitingUsers.length % 2 === 0 && (
        <div className="bg-cyan-950/40 border-2 border-cyan-500/50 p-8 rounded-[2rem] text-center shadow-[0_0_40px_rgba(6,182,212,0.15)] animate-fade-in">
          <h4 className="text-white font-black text-2xl mb-2">⚔️ BATTLE READY! ({waitingUsers.length}인)</h4>
          <p className="text-cyan-300/80 text-sm mb-6 font-medium">모든 인원이 준비되었습니다. 최적의 밸런스로 팀을 구성합니다.</p>
          <button 
            onClick={startMatch}
            disabled={isProcessing}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-lg rounded-xl shadow-lg transition-all uppercase tracking-wider"
          >
            {isProcessing ? 'Creating Match...' : '황금 밸런스 경기 생성'}
          </button>
        </div>
      )}

      {/* 👥 실시간 대기 명단 */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 p-8 rounded-[2rem]">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h4 className="text-gray-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            Waiting Lobby ({waitingUsers.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {waitingUsers.map(user => (
            <div key={user.id} className={`p-4 border rounded-2xl text-center transition-all ${user.id === profile?.id ? 'border-yellow-500/50 bg-yellow-500/5 shadow-lg' : 'border-gray-800 bg-gray-800/40'}`}>
              <p className="font-bold text-white text-sm truncate mb-1">{user.ByID}</p>
              <p className="text-[11px] text-cyan-400 font-black font-mono">{user.ladder_points} P</p>
            </div>
          ))}
          {waitingUsers.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-gray-700 text-sm italic font-medium">대기열이 비어있습니다. 전장에 가장 먼저 합류하세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 🛠️ [최고 개발자 전용] 시스템 시뮬레이터 */}
      {isDeveloper && (
        <div className="mt-20 p-8 bg-gray-950 border-2 border-dashed border-cyan-900/30 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h4 className="text-cyan-400 font-black italic text-xl tracking-tighter">DEV SIMULATOR</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest underline underline-offset-4 decoration-cyan-900">Programmer Access Only</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black shadow-inner transition-colors ${isTestModeActive ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}>
              TEST MODE: {isTestModeActive ? 'ACTIVE' : 'STABLE'}
            </div>
          </div>

          {/* 테스터 상태 인디케이터 */}
          <div className="grid grid-cols-5 gap-3 mb-8">
            {testAccounts.map((id) => (
              <div key={id} className="flex flex-col gap-2 text-center group/test">
                <span className="text-[9px] text-gray-600 font-mono group-hover/test:text-cyan-500 transition-colors">{id}</span>
                <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${waitingUsers.some(u => u.ByID === id) ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]' : 'bg-gray-800'}`}></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <button 
              onClick={injectTestUsers}
              className="py-4 bg-cyan-900/40 hover:bg-cyan-500 hover:text-black border border-cyan-500/50 text-cyan-400 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
            >
              🚀 테스트 인원 6명 즉시 투입
            </button>
            <button 
              onClick={async () => {
                if(confirm("모든 유저의 대기열을 초기화합니까?")) {
                  await supabase.from('profiles').update({ is_in_queue: false });
                  alert("Lobby Cleared.");
                }
              }}
              className="py-4 bg-gray-900 hover:bg-red-900/40 border border-gray-800 hover:border-red-500/50 text-gray-600 hover:text-red-400 font-black rounded-2xl text-xs transition-all"
            >
              🧹 전체 대기열 강제 리셋
            </button>
          </div>
          
          {!isTestModeActive && (
            <p className="mt-6 text-center text-red-500/80 text-[10px] font-bold animate-pulse tracking-tighter">
              ⚠️ 시뮬레이터를 작동하려면 개발자 콘솔(⚙️)에서 테스트 모드를 먼저 켜주세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}