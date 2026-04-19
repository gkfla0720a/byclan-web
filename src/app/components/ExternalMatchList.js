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
        if (json.success) {
          setMatches(json.data);
        } else {
          setErrorMsg(json.error || '서버에서 에러를 반환했습니다.');
        }
      })
      .catch(err => {
        setErrorMsg('네트워크 통신 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 1. 로딩 중일 때
  if (loading) {
    return (
      <div className="p-8 text-center text-cyan-400 font-bold animate-pulse cyber-card rounded-xl">
        📡 외부 서버와 통신 중... (데이터를 가져오는 중입니다)
      </div>
    );
  }

  // 2. 에러가 발생했을 때 (이 메시지를 보면 원인을 알 수 있습니다!)
  if (errorMsg) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400">
        <h3 className="font-bold mb-2">🚨 데이터를 불러오지 못했습니다.</h3>
        <p className="text-sm">{errorMsg}</p>
      </div>
    );
  }

  // 3. 통신은 성공했지만 파싱된 데이터가 없을 때
  if (matches.length === 0) {
    return (
      <div className="p-6 cyber-card rounded-xl text-gray-400 text-center">
        연동된 서버에서 가져올 경기 기록이 없습니다. (또는 HTML 구조가 변경되었을 수 있습니다.)
      </div>
    );
  }

  // 4. 정상적으로 데이터를 가져왔을 때
  return (
    <div className="space-y-3">
      {matches.map((match, idx) => (
        <div key={idx} className="bg-[#0f111a] border border-gray-800 p-4 rounded-lg flex justify-between items-center hover:border-cyan-500/50 transition-colors">
          <div className="text-xs text-gray-500">
            <span className="text-cyan-600 mr-2">{match.matchId}</span>
            {match.date}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 w-32 text-right truncate">{match.teamA.names}</span>
            <span className="text-xl font-black tracking-widest text-white">
              <span className={match.teamA.score > match.teamB.score ? "text-cyan-400" : "text-gray-500"}>{match.teamA.score}</span>
              <span className="mx-2 text-gray-600">:</span>
              <span className={match.teamB.score > match.teamA.score ? "text-cyan-400" : "text-gray-500"}>{match.teamB.score}</span>
            </span>
            <span className="text-sm text-gray-300 w-32 text-left truncate">{match.teamB.names}</span>
          </div>
        </div>
      ))}
    </div>
  );
}