// 파일명: src/components/ladder/OngoingMatchList.tsx

export default function OngoingMatchList({ matches, matchProfiles, currentUserId, onMatchEnter }) {
  const inProgressMatches = matches.filter(m => m.status === 'in_progress');
  if (inProgressMatches.length === 0) return null;

  return (
    <div className="bg-[#0A1128] border border-emerald-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      <div className="px-5 py-4 border-b border-emerald-500/30 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0"></span>
        <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">레더매치보드 — 진행 중</p>
      </div>
      <div className="divide-y divide-emerald-900/20">
        {inProgressMatches.map(match => {
          const isParticipant = (match.ladder_record || []).some(r => r.user_id === currentUserId);
          const getProfileName = (id) => matchProfiles[id]?.by_id || '[닉네임 없음]';
          
          const teamANames = (match.ladder_record || []).filter(r => r.team === 'A').map(r => getProfileName(r.user_id));
          const teamBNames = (match.ladder_record || []).filter(r => r.team === 'B').map(r => getProfileName(r.user_id));
          
          const dynamicScoreA = matches.filter(om => om.match_id === match.match_id && om.winner_team === 'A').length;
          const dynamicScoreB = matches.filter(om => om.match_id === match.match_id && om.winner_team === 'B').length;

          return (
            <div key={match.match_id} className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-300 font-bold text-sm">{match.race_type} 래더</span>
                  <span className="text-gray-600 text-xs border border-gray-700 px-2 py-0.5 rounded">
                    진행중 — {dynamicScoreA} : {dynamicScoreB}
                  </span>
                </div>
                <div className="text-gray-600 text-xs font-sans">
                  <span className="text-blue-400">A</span>: {teamANames.join(', ')}
                  <span className="mx-2 text-gray-700">vs</span>
                  <span className="text-red-400">B</span>: {teamBNames.join(', ')}
                </div>
              </div>
              {isParticipant && (
                <button
                  onClick={() => onMatchEnter(match.match_id)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                  매치 재입장 →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}