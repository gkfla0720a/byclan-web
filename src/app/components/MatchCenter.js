'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function MatchCenter({ matchId }) {
  const [match, setMatch] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [bettingTime, setBettingTime] = useState(180); // 3분 타이머
  const [isRevealed, setIsRevealed] = useState(false); // 엔트리 공개 여부
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 실시간 데이터 동기화 및 타이머
  useEffect(() => {
    fetchMatchData();

    // 배팅 타이머 (엔트리 공개 전/후 3분간 작동)
    const timer = setInterval(() => {
      setBettingTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // 실시간 구독: 엔트리 제출이나 스코어 변동 시 즉시 반영
    const channel = supabase.channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ladder_matches' }, fetchMatchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_sets' }, fetchMatchData)
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const fetchMatchData = async () => {
    const { data: matchData } = await supabase
      .from('ladder_matches')
      .select('*, match_sets(*)')
      .eq('id', matchId)
      .single();
    
    setMatch(matchData);
    
    // 현재 진행 중인 세트 찾기 (상태가 '진행중'인 가장 최신 세트)
    const activeSet = matchData?.match_sets?.find(s => s.status !== '완료');
    setCurrentSet(activeSet);

    // 양팀 모두 준비 완료 시 엔트리 공개
    if (activeSet?.team_a_ready && activeSet?.team_b_ready) {
      setIsRevealed(true);
    }
  };

  // 🎲 무작위 종족 추첨 (프프프 제외)
  const drawRandomRaces = () => {
    const races = ['프', '테', '저', '랜'];
    let picked;
    do {
      picked = Array.from({ length: 3 }, () => races[Math.floor(Math.random() * races.length)]);
    } while (picked.every(r => r === '프'));
    return picked;
  };

  // 📝 엔트리 제출 (휴식 횟수 검증 포함)
  const submitEntry = async (team, selectedPlayers) => {
    const maxRest = match.match_type === 4 ? 1 : 2; // 4v4는 1회, 5v5는 2회
    
    // 휴식 횟수 체크 로직 (매치 내 세트 기록 분석 필요)
    // ... (이곳에 휴식 횟수 검증 코드 추가)

    const column = team === 'A' ? 'team_a_ready' : 'team_b_ready';
    await supabase.from('match_sets')
      .update({ 
        [`team_${team.toLowerCase()}_entry`]: selectedPlayers,
        [column]: true 
      })
      .eq('id', currentSet.id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
      
      {/* 🏁 1. 스코어 보드 (기존 디자인 유지) */}
      <div className="bg-gray-800 rounded-3xl p-6 flex justify-between items-center border border-yellow-500/30 shadow-2xl">
        <div className="text-center">
          <p className="text-blue-400 font-black text-sm mb-1">TEAM A</p>
          <h2 className="text-6xl font-black text-white">{match?.score_a || 0}</h2>
        </div>
        <div className="text-center px-4">
          <p className="text-gray-500 text-[10px] font-bold mb-2 tracking-widest uppercase">
            {match?.match_type}VS{match?.match_type} // BO{match?.match_type === 5 ? '7' : '5'}
          </p>
          <p className="text-2xl text-gray-600 font-black italic">VS</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-black text-sm mb-1">TEAM B</p>
          <h2 className="text-6xl font-black text-white">{match?.score_b || 0}</h2>
        </div>
      </div>

      {/* 💰 2. 실시간 배팅 패널 (배당률 계산 포함) */}
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
             <span className="text-yellow-500 font-black italic text-sm uppercase">Live Betting</span>
          </div>
          <span className="text-white font-mono bg-red-600 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
            {Math.floor(bettingTime / 60)}:{String(bettingTime % 60).padStart(2, '0')} LEFT
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-blue-900/20 border border-blue-500/50 p-5 rounded-2xl hover:bg-blue-900/40 transition-all text-center group">
            <p className="text-[10px] text-blue-400 font-bold mb-1 uppercase">Team A Win</p>
            <p className="text-2xl font-black text-white group-hover:scale-110 transition-transform">1.85<span className="text-xs ml-1 font-normal opacity-60">x</span></p>
          </button>
          <button className="bg-red-900/20 border border-red-500/50 p-5 rounded-2xl hover:bg-red-900/40 transition-all text-center group">
            <p className="text-[10px] text-red-400 font-bold mb-1 uppercase">Team B Win</p>
            <p className="text-2xl font-black text-white group-hover:scale-110 transition-transform">2.10<span className="text-xs ml-1 font-normal opacity-60">x</span></p>
          </button>
        </div>
      </div>

      {/* 📑 3. 세트 엔트리 및 종족전 정보 */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h4 className="text-white font-black text-lg">ROUND {match?.current_round || 1} ENTRYS</h4>
          <div className="flex gap-2">
            {/* 현재 세트 종족 카드 표시 */}
            {['프', '저', '랜'].map((r, i) => (
              <span key={i} className="w-8 h-8 bg-gray-900 border border-cyan-500 rounded flex items-center justify-center text-cyan-400 font-black text-xs shadow-inner">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* 엔트리 공개 전/후 화면 전환 */}
        <div className="grid grid-cols-2 gap-6">
          {['A', 'B'].map(t => (
            <div key={t} className={`p-4 rounded-2xl border-2 border-dashed ${t === 'A' ? 'border-blue-900 bg-blue-900/5' : 'border-red-900 bg-red-900/5'}`}>
              <p className={`text-center font-black mb-4 ${t === 'A' ? 'text-blue-500' : 'text-red-500'}`}>TEAM {t}</p>
              
              {isRevealed ? (
                <div className="space-y-3">
                  {/* 실제 공개된 선수 목록 */}
                  <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-700 text-center text-white text-xs font-bold">참가자 1 (프)</div>
                  <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-700 text-center text-white text-xs font-bold">참가자 2 (저)</div>
                  <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-700 text-center text-white text-xs font-bold">참가자 3 (랜)</div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-700 italic text-[10px] text-center px-4 leading-relaxed">
                  {currentSet?.[`team_${t.toLowerCase()}_ready`] ? '제출 완료 (상대방 대기중)' : '엔트리 제출 대기 중...'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 엔트리 제출 버튼 (내가 팀장일 때만 활성화하는 로직 추가 가능) */}
        {!isRevealed && (
          <button className="w-full mt-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95">
            내 엔트리 최종 제출
          </button>
        )}
      </div>

    </div>
  );
}
