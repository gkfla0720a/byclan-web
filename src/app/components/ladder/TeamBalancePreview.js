// 파일명: src/components/ladder/TeamBalancePreview.js
import React from 'react';
import { getRaceIcon, getPlayerMmr } from '@/app/utils/profiles';

const BALANCE_THRESHOLD = 200;

export default function TeamBalancePreview({ teams, matchType, avgA, avgB, balanceDiff }) {
  if (!teams) return null;

  return (
    <div className={`px-5 py-4 border-t ${balanceDiff > BALANCE_THRESHOLD ? 'border-yellow-700/30 bg-yellow-950/5' : 'border-blue-700/20 bg-blue-950/5'}`}>
      <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-3">
        예상 팀 구성 ({matchType})
        {balanceDiff > BALANCE_THRESHOLD && <span className="ml-2 text-yellow-500">⚠️ 밸런스 주의</span>}
      </p>
      <div className="flex items-center gap-4">
        {/* TEAM A */}
        <div className="flex-1">
          <p className="text-blue-400 text-xs font-bold mb-2">TEAM A — 평균 {Math.round(avgA)}점</p>
          <div className="space-y-1">
            {teams.teamA.map(p => (
              <div key={p.id} className="text-xs text-gray-300 flex items-center gap-2">
                <span className="text-cyan-600 w-4">{getRaceIcon(p.race)}</span>
                <span className="flex-1 truncate">{p.by_id || '[닉네임 없음]'}</span>
                <span className="text-yellow-400">{getPlayerMmr(p)}점</span>
              </div>
            ))}
          </div>
        </div>

        {/* VS 가운데 점수 차이 */}
        <div className="text-center px-3">
          <div className={`font-black text-2xl ${balanceDiff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}`}>
            {Math.round(balanceDiff)}점
          </div>
          <div className="text-gray-600 text-[10px]">MMR 차이</div>
        </div>

        {/* TEAM B */}
        <div className="flex-1 text-right">
          <p className="text-red-400 text-xs font-bold mb-2">TEAM B — 평균 {Math.round(avgB)}점</p>
          <div className="space-y-1">
            {teams.teamB.map(p => (
              <div key={p.id} className="text-xs text-gray-300 flex items-center gap-2 flex-row-reverse">
                <span className="text-cyan-600 w-4">{getRaceIcon(p.race)}</span>
                <span className="flex-1 truncate text-right">{p.by_id || '[닉네임 없음]'}</span>
                <span className="text-yellow-400">{getPlayerMmr(p)}점</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}