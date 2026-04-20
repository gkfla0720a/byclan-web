'use client';
import { useState, useEffect } from 'react';

export default function ExternalMatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetch('/api/external-records')
      .then(res => res.json())
      .then(json => {
        if (json.success) setMatches(json.data);
        else setErrorMsg(json.error);
      })
      .catch(() => setErrorMsg('네트워크 통신 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-cyan-400 animate-pulse cyber-card rounded-xl">📡 세부 Raw Data 통신 중...</div>;
  if (errorMsg) return <div className="p-6 text-red-400 cyber-card rounded-xl">🚨 에러: {errorMsg}</div>;
  if (matches.length === 0) return <div className="p-6 text-gray-400 cyber-card rounded-xl">데이터가 없습니다.</div>;

  return (
    <div className="space-y-6">
      {matches.map((match, idx) => (
        <div key={idx} className="bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
          
          {/* 매치 헤더 영역 (총 스코어) */}
          <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
            <div className="text-xs text-gray-400">
              <span className="text-cyan-500 font-bold mr-2">{match.matchId}</span>
              {match.date} <span className="ml-2 text-gray-500">({match.status})</span>
            </div>
            <div className="text-xl font-black text-white tracking-widest">
              <span className={match.totalScore.teamA > match.totalScore.teamB ? "text-cyan-400" : "text-gray-500"}>{match.totalScore.teamA}</span>
              <span className="mx-2 text-gray-600">:</span>
              <span className={match.totalScore.teamB > match.totalScore.teamA ? "text-cyan-400" : "text-gray-500"}>{match.totalScore.teamB}</span>
            </div>
          </div>

          {/* 세트별 상세 Raw Data 영역 */}
          <div className="p-4 space-y-2 bg-[#050508]">
            {match.sets.map((set, setIdx) => (
              <div key={setIdx} className="flex justify-between items-center p-2 rounded bg-gray-900/30 border border-gray-800/50 hover:border-cyan-900/50 transition-colors">
                
                {/* A팀 플레이어 목록 */}
                <div className="flex-1 flex flex-col items-end gap-1">
                  {set.teamA.map((p, i) => (
                    <div key={i} className="text-xs text-gray-300 flex items-center gap-1">
                      {p.isAce && <span className="bg-red-900/50 text-red-400 text-[10px] px-1 rounded">ACE</span>}
                      <span>{p.name}</span>
                      <span className="text-gray-600">({p.race})</span>
                    </div>
                  ))}
                </div>

                {/* 중앙 세트 번호 및 MMR */}
                <div className="w-20 flex flex-col items-center justify-center mx-4">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{set.setNumber}</span>
                  <span className="text-xs text-yellow-500 mt-1">{set.mmrChange}</span>
                </div>

                {/* B팀 플레이어 목록 */}
                <div className="flex-1 flex flex-col items-start gap-1">
                  {set.teamB.map((p, i) => (
                    <div key={i} className="text-xs text-gray-300 flex items-center gap-1">
                      <span className="text-gray-600">({p.race})</span>
                      <span>{p.name}</span>
                      {p.isAce && <span className="bg-red-900/50 text-red-400 text-[10px] px-1 rounded">ACE</span>}
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
}