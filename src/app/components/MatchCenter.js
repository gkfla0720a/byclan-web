'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function MatchCenter({ matchId, onExit }) {
  const [match, setMatch] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [betTimer, setBetTimer] = useState(180);
  const [myTeam, setMyTeam] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState([
    { id: '', ByID: '', race: '' },
    { id: '', ByID: '', race: '' },
    { id: '', ByID: '', race: '' }
  ]);

  // 1. 데이터 로드 및 실시간 구독
  const fetchMatchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: m } = await supabase.from('ladder_matches').select('*, profiles(*)').eq('id', matchId).single();
    
    if (!m) return;
    setMatch(m);

    const teamLetter = m.team_a.includes(user.id) ? 'A' : 'B';
    setMyTeam(teamLetter);
    setTeamMembers(m.profiles.filter(p => (teamLetter === 'A' ? m.team_a : m.team_b).includes(p.id)));

    const activeSet = m.match_sets?.find(s => s.status !== '완료') || m.match_sets?.[m.match_sets.length - 1];
    setCurrentSet(activeSet);
    
    if (activeSet?.team_a_ready && activeSet?.team_b_ready) setIsRevealed(true);
  }, [matchId]);

  useEffect(() => {
    fetchMatchData();
    const channel = supabase.channel(`m-${matchId}`).on('postgres_changes', { event: '*', schema: 'public' }, fetchMatchData).subscribe();
    const timer = setInterval(() => setBetTimer(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, [matchId, fetchMatchData]);

  // 2. 휴식 횟수 계산 로직
  const getRestStatus = (playerId) => {
    if (!match?.match_sets) return { count: 0, canRest: true };
    const restCount = match.match_sets.filter(s => 
      s.status === '완료' && !s[`team_${myTeam.toLowerCase()}_entry`]?.some(p => p.id === playerId)
    ).length;
    const maxRest = match.match_type === 4 ? 1 : 2; 
    return { count: restCount, canRest: restCount < maxRest };
  };

  // 3. 엔트리 선택 처리
  const handleSelect = (idx, playerId, race) => {
    const player = teamMembers.find(m => m.id === playerId);
    const newEntry = [...selectedEntry];
    newEntry[idx] = { id: playerId, ByID: player?.ByID || '', race: race };
    setSelectedEntry(newEntry);
  };

  const submitEntry = async () => {
    const column = myTeam === 'A' ? 'team_a_ready' : 'team_b_ready';
    const entryCol = myTeam === 'A' ? 'team_a_entry' : 'team_b_entry';
    await supabase.from('match_sets').update({ 
      [column]: true,
      [entryCol]: selectedEntry 
    }).eq('id', currentSet.id);
    alert("엔트리 제출 완료! 상대방을 기다립니다.");
  };

  if (!match) return <div className="py-20 text-center text-gray-500">전장 진입 중...</div>;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 font-sans">
      {/* 🏁 스코어보드 */}
      <div className="bg-gray-800 rounded-3xl p-8 flex justify-around items-center border border-yellow-500/30 shadow-2xl">
        <div className="text-center group">
          <p className="text-blue-400 font-black text-xs mb-2 tracking-tighter">TEAM BLUE</p>
          <h2 className="text-6xl font-black text-white drop-shadow-lg">{match.score_a}</h2>
          <p className="text-[10px] text-gray-500 mt-2">Odds: 1.85x</p>
        </div>
        <div className="text-center">
          <div className="bg-gray-900 px-4 py-1 rounded-full border border-gray-700 text-[10px] text-gray-400 font-bold mb-4 uppercase tracking-widest">
            BO{match.match_type === 5 ? '7' : '5'} LADDER
          </div>
          <p className="text-3xl font-black text-gray-600 italic">VS</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-black text-xs mb-2 tracking-tighter">TEAM RED</p>
          <h2 className="text-6xl font-black text-white drop-shadow-lg">{match.score_b}</h2>
          <p className="text-[10px] text-gray-500 mt-2">Odds: 2.10x</p>
        </div>
      </div>

      {/* 💰 배팅 타이머 */}
      <div className="bg-gray-900 border border-gray-700 p-5 rounded-2xl flex justify-between items-center shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          <span className="text-yellow-500 font-black text-xs italic uppercase tracking-widest">Live Betting Window</span>
        </div>
        <span className="text-white font-mono bg-red-600 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
          {Math.floor(betTimer / 60)}:{String(betTimer % 60).padStart(2, '0')}
        </span>
      </div>

      {/* 🛡️ 엔트리 제출 구역 */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <h4 className="text-white font-black text-lg italic">ROUND {match.match_sets?.length || 1} ENTRY</h4>
          <div className="flex gap-2">
             {currentSet?.race_cards?.map((r, i) => (
               <span key={i} className="w-9 h-9 bg-gray-900 border border-cyan-500 rounded-lg flex items-center justify-center text-cyan-400 font-black text-sm shadow-inner">
                 {r}
               </span>
             ))}
          </div>
        </div>

        {/* 팀별 현황 (공개 전/후) */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {['A', 'B'].map(t => (
            <div key={t} className={`p-5 rounded-2xl border-2 border-dashed transition-all ${t === 'A' ? 'border-blue-900 bg-blue-900/5' : 'border-red-900 bg-red-900/5'}`}>
              <p className={`text-center font-black text-sm mb-4 ${t === 'A' ? 'text-blue-500' : 'text-red-500'}`}>TEAM {t}</p>
              {isRevealed ? (
                <div className="space-y-3">
                  {currentSet?.[`team_${t.toLowerCase()}_entry`]?.map((p, i) => (
                    <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-800 text-xs text-center text-white font-bold shadow-sm">
                      {p.ByID} <span className="text-cyan-500 ml-1">({p.race})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-2">
                  {currentSet?.[`team_${t.toLowerCase()}_ready`] ? (
                    <>
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-emerald-500 font-bold text-[10px]">제출 완료</p>
                    </>
                  ) : (
                    <p className="text-gray-700 italic text-[10px] animate-pulse">상대방이 엔트리를 작성 중입니다...</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 내 엔트리 작성 (제출 전일 때만 노출) */}
        {!isRevealed && !currentSet?.[`team_${myTeam?.toLowerCase()}_ready`] && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            {currentSet?.race_cards?.map((race, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-gray-900 p-4 rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors">
                <div className="w-12 h-10 bg-black rounded-xl flex items-center justify-center text-yellow-500 font-black border border-yellow-500/30 text-sm italic">
                  {race}
                </div>
                <select 
                  className="flex-1 bg-transparent text-white text-sm outline-none cursor-pointer font-bold"
                  value={selectedEntry[idx].id}
                  onChange={(e) => handleSelect(idx, e.target.value, race)}
                >
                  <option value="" className="bg-gray-800">선수 선택</option>
                  {teamMembers.map(member => {
                    const { count, canRest } = getRestStatus(member.id);
                    const isSelected = selectedEntry.some((se, i) => i !== idx && se.id === member.id);
                    return (
                      <option key={member.id} value={member.id} disabled={isSelected} className="bg-gray-800">
                        {member.ByID} (휴식: {count}회) {isSelected ? ' [선택됨]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}
            <button 
              onClick={submitEntry}
              disabled={selectedEntry.some(e => !e.id)}
              className="w-full mt-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-xl disabled:opacity-20 active:scale-95 transition-transform"
            >
              {selectedEntry.every(e => e.id) ? '엔트리 최종 제출' : '모든 슬롯에 선수를 배치하세요'}
            </button>
          </div>
        )}
      </div>

      <button onClick={onExit} className="w-full py-4 bg-gray-900 text-gray-600 text-xs font-bold rounded-2xl hover:text-gray-400 transition-colors uppercase tracking-widest">
        Return to Lobby
      </button>
    </div>
  );
}
