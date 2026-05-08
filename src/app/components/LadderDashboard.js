// 파일명: src/app/components/LadderDashboard.js
'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/app/context/AuthContext'; 
import { useLadderData } from '@/app/hooks/useLadderData'; // 💡 비서 고용
import { getTier, TIER_COLORS, getRaceIcon, getPlayerMmr } from '@/app/utils/profiles';
import { MATCH_TYPES, buildTeams } from '@/app/utils/matchmaking';

// 💡 UI 부품들
import ConsentPopup from '@/app/components/ladder/ConsentPopup';
import TeamBalancePreview from '@/app/components/ladder/TeamBalancePreview';
import OngoingMatchList from '@/app/components/ladder/OngoingMatchList';
import Warning5v5Modal from '@/app/components/ladder/Warning5v5Modal';

export default function LadderDashboard({ onMatchEnter }) {
  const { user, profile: myProfile, authLoading } = useAuthContext();
  
  // 💡 [혁신] 모든 복잡한 상태와 함수를 비서 한 줄로 대체합니다!
  const { 
    queuePlayers, ongoingMatches, loading, inQueue, 
    activeProposal, setActiveProposal, proposalCooldown,
    joinQueue, leaveQueue, fetchData 
  } = useLadderData(user, authLoading);

  const [queueMatchType, setQueueMatchType] = useState('4v4');
  const [sortOption, setSortOption] = useState('balance');

  // 화면 계산용 변수들 (비서가 준 재료로 요리)
  const perTeam = MATCH_TYPES[queueMatchType]?.perTeam || 4;
  const teams = buildTeams(queuePlayers, perTeam, sortOption);
  
  if (loading) return <div className="text-center py-24 text-cyan-400 font-mono animate-pulse">[ CONNECTING... ]</div>;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 font-mono">
      {/* 1. 팝업/모달 관리 */}
      {activeProposal && <ConsentPopup proposal={activeProposal} myUserId={user?.id} onAccept={() => {}} onReject={() => setActiveProposal(null)} />}

      {/* 2. 내 통계 카드 (MyStatsCard로 따로 빼면 더 좋습니다) */}
      <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl p-5 mb-4">
          <p className="text-white font-bold text-lg">{myProfile?.by_id}</p>
          <p className="text-yellow-400 font-bold">{getPlayerMmr(myProfile)}점</p>
      </div>

      {/* 3. 대기열 메인 영역 */}
      <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl overflow-hidden">
        {/* 대기열 리스트 그리기 (queuePlayers 사용) */}
        {queuePlayers.map(p => (
           <div key={p.id} className="p-3 text-gray-200">
             {getRaceIcon(p.race)} {p.by_id} ({p.total_mmr}점)
           </div>
        ))}

        {/* 대기열 액션 버튼 */}
        <div className="p-4 border-t border-cyan-900/30">
          {!inQueue ? (
            <button onClick={joinQueue} className="btn-neon">대기열 참여</button>
          ) : (
            <button onClick={leaveQueue} className="text-red-400">대기 취소</button>
          )}
        </div>
      </div>

      {/* 4. 진행 중인 매치 목록 */}
      <OngoingMatchList matches={ongoingMatches} currentUserId={user?.id} onMatchEnter={onMatchEnter} />
    </div>
  );
}