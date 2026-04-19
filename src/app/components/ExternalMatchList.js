// src/app/components/ExternalMatchList.js
'use client';
import { useState, useEffect } from 'react';

export default function ExternalMatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/external-records')
      .then(res => res.json())
      .then(json => {
        if (json.success) setMatches(json.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 text-gray-500">데이터 로딩 중...</div>;

  return (
    <div className="space-y-3">
      {matches.map((match, idx) => (
        <div key={idx} className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex justify-between items-center">
          <div className="text-xs text-gray-500">{match.matchId} | {match.date}</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{match.teamA.names}</span>
            <span className="text-xl font-bold text-blue-400">{match.teamA.score} : {match.teamB.score}</span>
            <span className="text-sm text-gray-300">{match.teamB.names}</span>
          </div>
        </div>
      ))}
    </div>
  );
}