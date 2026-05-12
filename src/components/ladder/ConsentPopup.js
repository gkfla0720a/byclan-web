// 파일명: src/app/components/ladder/ConsentPopup.js
'use client';

import React, { useState, useEffect } from 'react';
import { getRaceIcon, getPlayerMmr } from '@/app/utils/profiles'; 

const PROPOSAL_CONSENT_SECONDS = 40;
const BALANCE_THRESHOLD = 200;

export default function ConsentPopup({ proposal, myUserId, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(PROPOSAL_CONSENT_SECONDS);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 && !rejected) { onReject(); return; }
    if (rejected) return;
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, rejected, onReject]);

  const handleReject = () => {
    setRejected(true);
    setTimeout(() => onReject(), 1800);
  };

  const isProposer = proposal.proposedBy === myUserId;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className={`relative max-w-md w-full mx-4 rounded-2xl border-2 p-8 transition-all duration-500 ${
        rejected ? 'border-gray-700 bg-gray-900 grayscale' : 'border-blue-500 bg-[#0a0f1e] shadow-[0_0_40px_rgba(59,130,246,0.4)]'
      }`}>
        {/* 원형 카운트다운 타이머 */}
        <div className="flex justify-center mb-6">
          <div className={`relative w-20 h-20 ${rejected ? 'opacity-30' : ''}`}>
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e3a5f" strokeWidth="6" />
              <circle cx="40" cy="40" r={radius} fill="none"
                stroke={rejected ? '#6b7280' : '#3b82f6'} strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - timeLeft / PROPOSAL_CONSENT_SECONDS)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center font-black text-xl ${rejected ? 'text-gray-600' : 'text-blue-400'}`}>
              {rejected ? '✕' : timeLeft}
            </div>
          </div>
        </div>

        <h3 className={`text-center font-black text-xl mb-2 ${rejected ? 'text-gray-500' : 'text-white'}`}>
          {rejected ? '매치 거절됨' : '⚡ 매치 시작 제안!'}
        </h3>
        <p className={`text-center text-sm mb-1 ${rejected ? 'text-gray-600' : 'text-gray-300'}`}>
          {proposal.matchType} 래더 매치
        </p>

        {!rejected && (
          <>
            <div className="grid grid-cols-2 gap-3 my-5">
              {['A', 'B'].map(team => (
                <div key={team} className={`p-3 rounded-xl border ${team === 'A' ? 'border-blue-800 bg-blue-950/20' : 'border-red-800 bg-red-950/20'}`}>
                  <p className={`text-xs font-bold mb-2 text-center ${team === 'A' ? 'text-blue-400' : 'text-red-400'}`}>TEAM {team}</p>
                  {(team === 'A' ? proposal.teamA : proposal.teamB).map(p => (
                    <div key={p.id} className="text-xs text-gray-300 truncate flex items-center gap-1 mb-1">
                      <span className="text-cyan-600 w-4 text-center">{getRaceIcon(p.race)}</span>
                      <span className="flex-1 truncate">{p.by_id || p.profiles?.by_id || <span className="text-red-400 text-[10px]">[닉네임 오류]</span>}</span>
                      <span className="text-yellow-500 text-[10px]">{getPlayerMmr(p)}점</span>
                    </div>
                  ))}
                  <div className={`text-center text-[10px] mt-1 font-bold ${team === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                    평균 {Math.round(team === 'A' ? proposal.avgA : proposal.avgB)}점
                  </div>
                </div>
              ))}
            </div>
            <div className={`text-center text-xs mb-5 ${proposal.diff > BALANCE_THRESHOLD ? 'text-yellow-400' : 'text-green-400'}`}>
              팀 MMR 차이: {Math.round(proposal.diff)}점
              {proposal.diff > BALANCE_THRESHOLD && ' ⚠️ 200점 초과 (불균형)'}
            </div>
            <p className="text-center text-xs text-gray-500 mb-6">
              {isProposer ? '상대방의 동의를 기다리고 있습니다...' : '매치 시작에 동의하시겠습니까?'}
            </p>
            <div className="flex gap-3">
              {!isProposer && (
                <button onClick={onAccept} className="flex-1 py-3 font-black rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                  ✓ 동의
                </button>
              )}
              <button onClick={handleReject} className={`${isProposer ? 'w-full' : 'flex-1'} py-3 font-black rounded-xl border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 transition-colors`}>
                {isProposer ? '제안 취소' : '✗ 거절'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}