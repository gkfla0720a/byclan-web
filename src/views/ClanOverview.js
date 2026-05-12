/**
 * 파일명: ClanOverview.js
 *
 * 역할: 클랜 소개 페이지 컴포넌트입니다. 클랜의 메인 게임, 리더십, 활동 방식,
 *       운영 방향, 멤버 구성을 정적 콘텐츠로 설명합니다.
 * 주요 기능: 히어로 배너 + 3열 특징 카드 + 운영 방향/멤버 구성 2열 설명 블록
 * 사용 방법: <ClanOverview />
 */
'use client';

import React from 'react';

/**
 * ClanOverview 컴포넌트
 *
 * ByClan 클랜 소개 내용을 정적으로 렌더링합니다.
 * 별도의 상태나 API 호출 없이 순수 UI만 반환합니다.
 *
 * @returns {JSX.Element} 클랜 소개 페이지 UI
 */

function ClanOverview() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-6 sm:space-y-8">
      <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl p-8 sm:p-12 text-center group">
         <div className="absolute inset-0 bg-linear-to-b from-gray-700/40 to-transparent pointer-events-none"></div>
         <h2 className="relative text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-4 drop-shadow-lg">최강의 스타크래프트 빠른무한 클랜, ByClan</h2>
         <p className="relative text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">바이클랜은 스타크래프트 빠른무한(빨무)을 즐기는 유저들이 모인 명실상부 최고의 클랜입니다.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">🎮</span>
            <h3 className="text-lg font-bold text-white">메인 게임</h3>
            <p className="text-gray-400 text-sm">빠른무한 (Fast Infinite)</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">👑</span>
            <h3 className="text-lg font-bold text-white">리더십</h3>
            <p className="text-gray-400 text-sm">운영진 체제</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">⚔️</span>
            <h3 className="text-lg font-bold text-white">활동</h3>
            <p className="text-gray-400 text-sm">자체 래더 및 내전</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">클랜 운영 방향</h3>
          <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
            <li>• ByClan은 빠른무한을 오래 즐기는 유저들이 꾸준히 모여 래더와 내전을 함께 운영하는 클랜입니다.</li>
            <li>• 활동의 중심은 레더 경쟁, 디스코드 소통, 팀 단위 플레이 적응에 있습니다.</li>
            <li>• 운영진과 정예 멤버가 신규 인원 적응을 돕고, 활동 흐름은 공지와 알림을 통해 관리됩니다.</li>
          </ul>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">멤버 구성 안내</h3>
          <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
            <li>• 운영진, 정예 길드원, 일반 길드원 구성을 기준으로 역할이 나뉘며 리스트도 같은 기준으로 정리됩니다.</li>
            <li>• BJ 또는 스트리머 멤버는 별도 컬럼으로 관리하며, 플랫폼과 채널 링크를 함께 표시할 수 있습니다.</li>
            <li>• 상세한 멤버 명단은 별도 `클랜원` 메뉴에서 직책별 리스트로 확인할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ClanOverview;
