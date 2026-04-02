'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function MatchCenter({ matchId, onExit }) {
  const [match, setMatch] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [betTimer, setBetTimer] = useState(180);
  const [myTeam, setMyTeam] = useState(null); // 'A' 또는 'B'
  const [isRevealed, setIsRevealed] = useState(false);

  // 🎲 무작위 종족 추첨 (프프프 제외)
  const drawRandomRaces = () => {
    const races = ['프', '테', '저', '랜'];
    let picked;
    do {
      picked = Array.from({ length: 3 }, () => races[Math.floor(Math.random() * races.length)]);
    } while (picked.every(r => r === '프'));
    return picked;
  };

  useEffect(() => {
    const fetchMatch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: m } = await supabase.from('ladder_matches').select('*, match_sets(*)').eq('id', matchId).single();
      
      setMatch(m);
      setMyTeam(m.team_a.includes(user.id) ? 'A' : 'B');
      
      const activeSet = m.match_sets.find(s => s.status !== '완료') || m.match_sets[m.match_sets.length - 1];
      setCurrentSet(activeSet);
      if (activeSet?.team_a_ready && activeSet?.team_b_ready) setIsRevealed(true);
    };

    fetchMatch();
    const sub = supabase.channel(`m-${matchId}`).on('postgres_changes', { event: '*', schema: 'public' }, fetchMatch).subscribe();
    const timer = setInterval(() => setBetTimer(p => (p > 0 ? p - 1 : 0)), 1000);

    return () => { supabase.removeChannel(sub); clearInterval(timer); };
  }, [matchId]);

  // 📝 엔트리 제출 (휴식 제한 로직 포함)
  const submitEntry = async (entryData) => {
    const column = myTeam === 'A' ? 'team_a_ready' : 'team_b_ready';
    const entryCol = myTeam === 'A' ? 'team_a_entry' : 'team_b_entry';
    
    await supabase.from('match_sets').update({ 
      [column]: true,
      [entryCol]: entryData 
    }).eq('id', currentSet.id);
  };

  // 💰 배당률 계산식: $$Odds = \frac{TotalBet}{TeamBet}$$
  const oddsA = 1.85; // 예시 (배팅 시스템 구현 시 연동)
  const oddsB = 2.10;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* 스코어 보드 */}
      <div className="bg-gray-800 rounded-3xl p-6 flex justify-around items-center border border-yellow-500/30">
        <div className="text-center">
          <p className="text-blue-400 font-black text-sm">TEAM A</p>
          <h2 className="text-5xl font-black text-white">{match?.score_a || 0}</h2>
          <p className="text-[10px] text-gray-500 mt-1">Odds: {oddsA}x</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-[10px] font-bold">BO{match?.match_type === 5 ? '7' : '5'}</p>
          <p className="text-2xl font-black text-gray-600 italic px-4">VS</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-black text-sm">TEAM B</p>
          <h2 className="text-5xl font-black text-white">{match?.score_b || 0}</h2>
          <p className="text-[10px] text-gray-500 mt-1">Odds: {oddsB}x</p>
        </div>
      </div>

      {/* 배팅 타이머 */}
      <div className="bg-gray-900 border border-gray-700 p-4 rounded-2xl flex justify-between items-center">
        <span className="text-yellow-500 font-black text-xs italic uppercase">Live Betting Window</span>
        <span className="text-white font-mono bg-red-600 px-3 py-1 rounded text-sm font-bold">
          {Math.floor(betTimer / 60)}:{String(betTimer % 60).padStart(2, '0')}
        </span>
      </div>

      {/* 엔트리 구역 */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-white font-black">ROUND {match?.match_sets?.length || 1} 엔트리</h4>
          <div className="flex gap-1">
             {currentSet?.race_cards?.map((r, i) => (
               <span key={i} className="px-2 py-1 bg-cyan-900 border border-cyan-500 text-cyan-400 text-[10px] font-bold rounded">{r}</span>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {['A', 'B'].map(t => (
            <div key={t} className={`p-4 rounded-2xl border-2 border-dashed ${t === 'A' ? 'border-blue-900 bg-blue-900/10' : 'border-red-900 bg-red-900/10'}`}>
              <p className={`text-center font-black mb-4 ${t === 'A' ? 'text-blue-400' : 'text-red-400'}`}>TEAM {t}</p>
              {isRevealed ? (
                <div className="space-y-2">
                  {currentSet?.[`team_${t.toLowerCase()}_entry`]?.map((p, i) => (
                    <div key={i} className="bg-gray-900 p-2 rounded border border-gray-700 text-xs text-center text-white font-bold">
                      {p.ByID} ({p.race})
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-700 italic text-[10px] text-center">
                  {currentSet?.[`team_${t.toLowerCase()}_ready`] ? '제출 완료' : '작성 중...'}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isRevealed && !currentSet?.[`team_${myTeam?.toLowerCase()}_ready`] && (
          <button 
            onClick={() => submitEntry([{ByID: 'Player1', race: '프'}, {ByID: 'Player2', race: '저'}, {ByID: 'Player3', race: '랜'}])}
            className="w-full mt-6 py-4 bg-emerald-600 text-white font-black rounded-xl"
          >
            엔트리 확정 및 제출
          </button>
        )}
      </div>
      
      <button onClick={onExit} className="w-full py-3 bg-gray-900 text-gray-500 text-xs rounded-xl">로비로 돌아가기 (임시)</button>
    </div>
  );
}
