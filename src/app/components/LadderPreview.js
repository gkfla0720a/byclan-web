'use client';

import React from 'react';

// 래더 미리보기 – 비회원/권한 없는 사용자에게 표시
export default function LadderPreview({ navigateTo, isGuest }) {
  const mockQueue = [
    { id: 1, name: 'By_StarPlayer', tier: 'Diamond', pts: 2150, race: '프' },
    { id: 2, name: 'By_NightHawk', tier: 'Platinum', pts: 1850, race: '테' },
    { id: 3, name: 'By_ZergMaster', tier: 'Gold', pts: 1630, race: '저' },
    { id: 4, name: 'By_ProtosStar', tier: 'Diamond', pts: 2080, race: '프' },
    { id: 5, name: 'By_TerranAce', tier: 'Platinum', pts: 1920, race: '테' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 px-2">
      {/* 안내 배너 */}
      <div className="mb-6 p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 text-center">
        <div className="text-4xl mb-3">⚔️</div>
        <h2 className="text-2xl font-black text-cyan-400 mb-2" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
          ByClan 래더 시스템
        </h2>
        <p className="text-gray-300 mb-1 text-sm">
          스타크래프트 빠른무한 3v3 · 4v4 내전 래더 — 실시간 매칭 & 포인트 베팅
        </p>
        <p className="text-gray-500 text-xs mb-4">
          {isGuest
            ? '래더 참여는 로그인 후 클랜원 등급 이상이어야 합니다.'
            : '래더 참여는 클랜원(준회원 이상) 등급이 필요합니다.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isGuest ? (
            <>
              <button
                onClick={() => navigateTo('로그인')}
                className="px-6 py-2.5 rounded-lg font-bold text-sm btn-neon"
              >
                로그인하기
              </button>
              <button
                onClick={() => navigateTo('가입안내')}
                className="px-6 py-2.5 rounded-lg font-bold text-sm bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20 transition-all"
              >
                클랜 가입 안내
              </button>
            </>
          ) : (
            <button
              onClick={() => navigateTo('가입신청')}
              className="px-6 py-2.5 rounded-lg font-bold text-sm btn-neon"
            >
              가입 신청하기
            </button>
          )}
        </div>
      </div>

      {/* 래더 시스템 미리보기 (블러 처리) */}
      <div className="relative rounded-xl overflow-hidden border border-gray-700/50">
        {/* 오버레이 */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-5xl mb-3">🔒</div>
          <p className="text-white font-bold text-lg">클랜원 전용 기능</p>
          <p className="text-gray-400 text-sm mt-1">래더에 참여하려면 클랜에 가입하세요</p>
        </div>

        {/* 블러된 대기열 미리보기 */}
        <div className="ladder-preview-blur p-6 bg-[#0d0d14]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-cyan-400">🟢 매칭 대기열 · 5명 대기 중</h3>
            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">4v4 래더</span>
          </div>
          <div className="space-y-2">
            {mockQueue.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-cyan-900/50 border border-cyan-700/40 flex items-center justify-center text-xs font-bold text-cyan-400">{p.race}</span>
                  <span className="font-semibold text-sm text-gray-200">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-purple-400">{p.tier}</span>
                  <span className="text-yellow-400 font-bold">{p.pts} P</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-lg bg-blue-900/20 border border-blue-700/30 text-center">
            <div className="text-blue-400 font-bold text-sm">4v4 매치 시작 가능 — 평균 점수 차이 120P</div>
            <button className="mt-2 px-5 py-2 rounded-lg text-sm font-bold bg-blue-500/20 border border-blue-400/40 text-blue-300 animate-pulse-neon">
              ⚡ 매치 시작 제안
            </button>
          </div>
        </div>
      </div>

      {/* 래더 시스템 소개 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🏆', title: '랭킹 시스템', desc: '승리마다 래더 점수 획득. 티어별 분류로 실력에 맞는 상대와 매칭됩니다.' },
          { icon: '💰', title: '포인트 베팅', desc: '경기 시작 후 5분간 A팀/B팀에 베팅 가능. 포인트를 불려보세요.' },
          { icon: '🎮', title: '3v3 · 4v4 내전', desc: '팀 밸런스 우선 매칭. 종족 선택, 세트 진행, 경기 기록 자동 저장.' },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-xl cyber-card">
            <div className="text-2xl mb-2">{item.icon}</div>
            <h4 className="font-bold text-sm text-cyan-400 mb-1">{item.title}</h4>
            <p className="text-gray-500 text-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
