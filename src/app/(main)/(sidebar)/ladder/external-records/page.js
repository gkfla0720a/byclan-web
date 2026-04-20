'use client';
import { useState, useEffect } from 'react';

export default function ExternalRecordsPage() {
  const [matches, setMatches] = useState([]);
  const [page, setPage] = useState(1); // 현재 페이지 번호
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩 상태
  const [hasMore, setHasMore] = useState(true); // 더 불러올 과거 데이터가 있는지 여부
  const [errorMsg, setErrorMsg] = useState(null);

  // 데이터 불러오는 핵심 함수
  const fetchMatches = async (targetPage, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      // API에 page 번호를 전달합니다.
      const res = await fetch(`/api/external-records?page=${targetPage}`);
      const json = await res.json();

      if (json.success) {
        if (json.data.length === 0) {
          setHasMore(false); // 더 이상 데이터가 없으면 버튼 숨김
        } else {
          // 기존 데이터에 과거 데이터를 이어 붙입니다!
          setMatches(prev => isLoadMore ? [...prev, ...json.data] : json.data);
        }
      } else {
        setErrorMsg(json.error);
      }
    } catch (err) {
      setErrorMsg('네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 처음 접속 시 1페이지 로드
  useEffect(() => {
    fetchMatches(1, false);
  }, []);

  // 더 보기 버튼 클릭 시 실행
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMatches(nextPage, true);
  };

  if (loading && page === 1) return <div className="p-8 text-cyan-400 animate-pulse">📡 최신 경기 기록을 불러오는 중입니다...</div>;
  if (errorMsg) return <div className="p-6 text-red-400">🚨 에러: {errorMsg}</div>;

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="text-sm text-gray-400 mb-6 border-b border-gray-800 pb-2">
        현재까지 총 <span className="text-cyan-400 font-bold">{matches.length}</span>개의 매치 기록을 불러왔습니다.
      </div>
      
      {/* 매치 리스트 렌더링 (기존과 동일) */}
      {matches.map((match, idx) => (
        <div key={idx} className="bg-[#0a0a0f] border border-gray-800 rounded-lg overflow-hidden shadow-lg transition-all hover:border-cyan-900">
          <div className="bg-gray-900/40 p-4 flex justify-between items-center border-b border-gray-800">
            <div className="flex flex-col">
              <span className="text-xs text-cyan-600 font-bold">{match.matchId}</span>
              <span className="text-[10px] text-gray-500 mt-1">{match.date} | 호스트: {match.host}</span>
            </div>
            <div className="text-2xl font-black tracking-widest text-white">
              <span className={match.totalScore.teamA > match.totalScore.teamB ? "text-cyan-400" : "text-gray-500"}>{match.totalScore.teamA}</span>
              <span className="mx-3 text-gray-700">:</span>
              <span className={match.totalScore.teamB > match.totalScore.teamA ? "text-cyan-400" : "text-gray-500"}>{match.totalScore.teamB}</span>
            </div>
          </div>

          <div className="p-3 bg-[#050508] space-y-2">
            {match.sets.map((set, setIdx) => (
              <div key={setIdx} className="flex justify-between items-center p-2 rounded bg-gray-900/20 border border-gray-800/30">
                <div className="flex-1 flex flex-col items-end gap-1">
                  {set.teamA.map((p, i) => (
                    <div key={i} className="text-[11px] text-gray-300 flex items-center gap-1.5">
                      {p.isAce && <span className="bg-red-900 text-white text-[9px] px-1 rounded font-bold">ACE</span>}
                      <span className="text-gray-500" title={p.tier}>({p.race})</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
                <div className="w-24 flex flex-col items-center justify-center mx-2">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">{set.setNumber}</span>
                  <span className="text-[10px] text-yellow-500 mt-1 font-bold">{set.mmrChange}</span>
                </div>
                <div className="flex-1 flex flex-col items-start gap-1">
                  {set.teamB.map((p, i) => (
                    <div key={i} className="text-[11px] text-gray-300 flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <span className="text-gray-500" title={p.tier}>({p.race})</span>
                      {p.isAce && <span className="bg-red-900 text-white text-[9px] px-1 rounded font-bold">ACE</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 더 보기 버튼 */}
      {hasMore && (
        <button 
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full mt-6 py-4 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-cyan-400 hover:border-cyan-800 transition-all font-bold flex justify-center items-center"
        >
          {loadingMore ? (
             <span className="animate-pulse">데이터를 불러오는 중...</span>
          ) : (
             `과거 기록 더 불러오기 (현재 ${page}페이지)`
          )}
        </button>
      )}
    </div>
  );
}