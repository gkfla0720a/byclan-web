'use client';
import { useState, useEffect } from 'react';

export default function ByClanTacticalDashboard() {
  const [players, setPlayers] = useState([]);
  const [synergies, setSynergies] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. API 데이터 로드
  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPlayers(json.players);
          setSynergies(json.synergies);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. 3대3 승률 예측 로직 (TrueSkill + Synergy 기반)
  const simulateMatch = () => {
    if (teamA.length !== 3 || teamB.length !== 3) {
      alert("양 팀에 선수를 3명씩 배치해주세요!");
      return;
    }

    const sumMu = (team) => team.reduce((acc, p) => acc + p.mu, 0);
    
    // 시너지 보너스 계산 (팀원 간 synergy_scores 합산)
    const getSynergyBonus = (team) => {
      let bonus = 0;
      for (let i = 0; i < team.length; i++) {
        for (let j = i + 1; j < team.length; j++) {
          const pair = [team[i].nick, team[j].nick].sort();
          const syn = synergies.find(s => s.player_a === pair[0] && s.player_b === pair[1]);
          if (syn) bonus += (syn.combined_win_rate - 0.5) * 10; // 승률 50% 기준 가중치
        }
      }
      return bonus;
    };

    const muA = sumMu(teamA) + getSynergyBonus(teamA);
    const muB = sumMu(teamB) + getSynergyBonus(teamB);

    // 시그모이드 함수를 이용한 승률 변환
    const winProbA = 1 / (1 + Math.exp(-(muA - muB) / 4.166));
    setPrediction(winProbA * 100);
  };

  const addToTeam = (player, team) => {
    if (team === 'A' && teamA.length < 3 && !teamB.includes(player)) {
      setTeamA([...teamA, player]);
    } else if (team === 'B' && teamB.length < 3 && !teamA.includes(player)) {
      setTeamB([...teamB, player]);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-cyan-400 p-10">📡 분석 데이터를 동기화 중...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-6 font-sans">
      {/* 상단 헤더 */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
          BYCLAN TACTICAL SIMULATOR
        </h1>
        <p className="text-gray-400 text-sm">TrueSkill™ 알고리즘 기반 실시간 승률 예측 시스템</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        
        {/* 왼쪽: 선수 리스트 (Pool) */}
        <div className="col-span-3 bg-[#12121e] border border-gray-800 rounded-xl p-4 h-[800px] overflow-y-auto">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            대기 명단
          </h2>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.nick} className="bg-[#1a1a2e] p-3 rounded-lg border border-gray-700 hover:border-cyan-500 transition-all group">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">{p.nick}</span>
                  <span className="text-[10px] text-gray-500">σ {p.sigma.toFixed(1)}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => addToTeam(p, 'A')} className="flex-1 text-[10px] bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white py-1 rounded transition-colors">Team A</button>
                  <button onClick={() => addToTeam(p, 'B')} className="flex-1 text-[10px] bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white py-1 rounded transition-colors">Team B</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 중앙: 3v3 시뮬레이터 구역 */}
        <div className="col-span-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Team A 박스 */}
            <div className="bg-blue-900/10 border-2 border-blue-900/50 rounded-2xl p-6 min-h-[300px] relative">
              <div className="absolute top-[-12px] left-4 bg-blue-600 px-3 py-1 rounded-full text-xs font-bold">TEAM A</div>
              <div className="space-y-4">
                {teamA.map(p => (
                  <div key={p.nick} className="flex justify-between items-center bg-blue-950/50 p-4 rounded-xl border border-blue-500/30">
                    <span className="font-bold">{p.nick}</span>
                    <span className="text-blue-400">μ {p.mu.toFixed(2)}</span>
                    <button onClick={() => setTeamA(teamA.filter(t => t !== p))} className="text-gray-500 hover:text-white">✕</button>
                  </div>
                ))}
                {Array(3 - teamA.length).fill(0).map((_, i) => (
                  <div key={i} className="border-2 border-dashed border-blue-900/30 h-14 rounded-xl flex items-center justify-center text-blue-900/50 text-sm">배정 대기중</div>
                ))}
              </div>
            </div>

            {/* Team B 박스 */}
            <div className="bg-red-900/10 border-2 border-red-900/50 rounded-2xl p-6 min-h-[300px] relative">
              <div className="absolute top-[-12px] right-4 bg-red-600 px-3 py-1 rounded-full text-xs font-bold">TEAM B</div>
              <div className="space-y-4">
                {teamB.map(p => (
                  <div key={p.nick} className="flex justify-between items-center bg-red-950/50 p-4 rounded-xl border border-red-500/30">
                    <span className="font-bold">{p.nick}</span>
                    <span className="text-red-400">μ {p.mu.toFixed(2)}</span>
                    <button onClick={() => setTeamB(teamB.filter(t => t !== p))} className="text-gray-500 hover:text-white">✕</button>
                  </div>
                ))}
                {Array(3 - teamB.length).fill(0).map((_, i) => (
                  <div key={i} className="border-2 border-dashed border-red-900/30 h-14 rounded-xl flex items-center justify-center text-red-900/50 text-sm">배정 대기중</div>
                ))}
              </div>
            </div>
          </div>

          {/* 예측 버튼 & 결과 게이지 */}
          <div className="bg-[#12121e] rounded-2xl p-8 border border-gray-800 text-center">
            <button 
              onClick={simulateMatch}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20 mb-8"
            >
              SIMULATE BATTLE
            </button>

            {prediction !== null && (
              <div className="space-y-6">
                <div className="flex justify-between text-sm font-bold px-2">
                  <span className="text-blue-400">TEAM A {prediction.toFixed(1)}%</span>
                  <span className="text-red-400">TEAM B {(100 - prediction).toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex">
                  <div style={{ width: `${prediction}%` }} className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                  <div style={{ width: `${100 - prediction}%` }} className="h-full bg-red-600 transition-all duration-1000"></div>
                </div>
                <p className="text-gray-400 text-sm italic">
                  {prediction > 55 ? "팀 A가 전략적 우위를 점하고 있습니다." : prediction < 45 ? "팀 B의 승리 가능성이 높게 예측됩니다." : "팽팽한 접전이 예상되는 매치업입니다."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 시너지 통계 & 명예의 전당 */}
        <div className="col-span-3 space-y-6">
          <div className="bg-[#12121e] border border-gray-800 rounded-xl p-4">
            <h2 className="text-md font-bold mb-4 text-cyan-400">🏆 BEST SYNERGY TOP 5</h2>
            <div className="space-y-3">
              {synergies.slice(0, 5).map((s, i) => (
                <div key={i} className="text-[11px] bg-[#1a1a2e] p-2 rounded border-l-2 border-cyan-500">
                  <div className="flex justify-between text-gray-300">
                    <span>{s.player_a} & {s.player_b}</span>
                    <span className="text-cyan-400 font-bold">{(s.combined_win_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-gray-600 text-[9px] mt-1">함께 {s.total_games}경기 수행</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}