'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/app/context/AuthContext'; 
import { useLadderData } from '@/app/hooks/useLadderData'; 
import { getRaceIcon, getPlayerMmr } from '@/app/utils/profiles';

import ConsentPopup from '@/app/components/ladder/ConsentPopup';
import TeamBalancePreview from '@/app/components/ladder/TeamBalancePreview';
import OngoingMatchList from '@/app/components/ladder/OngoingMatchList';
import Warning5v5Modal from '@/app/components/ladder/Warning5v5Modal';

export default function LadderDashboard({ onMatchEnter }) {
  const { user, profile: myProfile, authLoading } = useAuthContext();
  const [show5v5Warning, setShow5v5Warning] = useState(false);
  
  // 💡 [혁신] 로컬 useState를 다 지우고, 비서가 주는 걸 그대로 받습니다.
  const { 
    queuePlayers, ongoingMatches, loading, inQueue, joiningQueue,
    activeProposal, setActiveProposal, proposalCooldown,
    queueMatchType, setQueueMatchType, // 훅에서 옴
    sortOption, setSortOption,         // 훅에서 옴
    teams, perTeam,                    // 훅에서 계산해서 줌
    joinQueue, leaveQueue, proposeMatch, fetchData 
  } = useLadderData(user, authLoading);

  if (loading) return <div className="text-center py-24 text-cyan-400 font-mono animate-pulse">[ CONNECTING... ]</div>;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 font-mono">
      
      {/* 팝업/모달 관리 */}
      {activeProposal && <ConsentPopup proposal={activeProposal} myUserId={user?.id} onAccept={() => {}} onReject={() => setActiveProposal(null)} />}
      <Warning5v5Modal isOpen={show5v5Warning} onConfirm={joinQueue} onClose={() => setShow5v5Warning(false)} />

      {/* 내 통계 카드 */}
      <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl p-5 mb-4 flex justify-between items-center">
          <div>
            <p className="text-white font-bold text-lg">{myProfile?.by_id}</p>
            <p className="text-yellow-400 font-bold">{getPlayerMmr(myProfile)}점</p>
          </div>
          <button onClick={fetchData} className="text-cyan-500 text-sm hover:text-cyan-300">새로고침</button>
      </div>

      {/* 대기열 메인 영역 */}
      <div className="bg-[#0A1128] border border-cyan-500/30 rounded-xl overflow-hidden mb-4">
        
        {/* 컨트롤 패널 (정렬 및 타입 선택) */}
        <div className="p-3 border-b border-cyan-900/30 flex gap-4 bg-cyan-950/20">
           <select value={queueMatchType} onChange={(e) => setQueueMatchType(e.target.value)} className="bg-gray-900 text-cyan-300 p-1 rounded">
              <option value="3v3">3v3 래더</option>
              <option value="4v4">4v4 래더</option>
              <option value="5v5">5v5 래더</option>
           </select>
           
           <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-gray-900 text-cyan-300 p-1 rounded">
              <option value="balance">밸런스 우선</option>
              <option value="top">상픽 우선</option>
              <option value="bottom">하픽 우선</option>
           </select>
        </div>

        {/* 대기열 리스트 그리기 */}
        {queuePlayers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">대기 중인 플레이어가 없습니다.</div>
        ) : (
          queuePlayers.map(p => (
             <div key={p.id} className="p-3 text-gray-200 border-b border-cyan-900/20">
               <span className="text-cyan-500">{getRaceIcon(p.race)}</span> {p.by_id} <span className="text-yellow-500 text-xs">({p.total_mmr}점)</span>
             </div>
          ))
        )}

        {/* 팀 밸런스 미리보기 (teams 데이터가 있을 때만 렌더링) */}
        {teams && <TeamBalancePreview teams={teams} />}

        {/* 대기열 액션 버튼 */}
        <div className="p-4 border-t border-cyan-900/30 flex justify-between items-center bg-[#060A18]">
          {!inQueue ? (
            <button 
              onClick={() => queueMatchType === '5v5' ? setShow5v5Warning(true) : joinQueue()} 
              disabled={joiningQueue}
              className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
            >
              {joiningQueue ? '참여 중...' : '대기열 참여'}
            </button>
          ) : (
            <button onClick={leaveQueue} className="px-6 py-2 border border-red-500 text-red-500 rounded font-bold">대기 취소</button>
          )}

          {/* 제안 버튼 */}
          {teams && (
            <button 
              onClick={() => proposeMatch(perTeam, teams.teamA, teams.teamB)} 
              disabled={proposalCooldown > 0}
              className={`px-6 py-2 rounded font-bold ${proposalCooldown > 0 ? 'bg-gray-800 text-gray-500' : 'bg-cyan-600 text-white'}`}
            >
              {proposalCooldown > 0 ? `${proposalCooldown}초 후 제안` : '매치 제안'}
            </button>
          )}
        </div>
      </div>

      {/* 진행 중인 매치 목록 */}
      <OngoingMatchList matches={ongoingMatches} currentUserId={user?.id} onMatchEnter={onMatchEnter} />
    </div>
  );
}