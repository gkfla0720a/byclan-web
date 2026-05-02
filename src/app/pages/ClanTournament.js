/**
 * 파일명: ClanTournament.js
 *
 * 역할: 클랜 대회 및 토너먼트 일정을 카드 목록으로 보여주는 페이지 컴포넌트입니다.
 * 주요 기능: 하드코딩된 대회 목록을 그리드 카드로 표시합니다.
 * 사용 방법: <ClanTournament />
 */

/**
 * ClanTournament 컴포넌트
 *
 * 예정된 클랜 대회 목록을 카드 형태로 렌더링합니다.
 * 현재는 정적 데이터를 사용하며, 추후 DB 연동 예정입니다.
 *
 * @returns {JSX.Element} 토너먼트 목록 UI
 */
function ClanTournament() {
  /** 예정·진행 중인 대회 목록 (정적 데이터) */
  const upcomingTournaments = [
    { id: 1, title: '제 5회 BSL (ByClan StarLeague)', status: '참가 접수중', date: '04.10 ~ 04.30', prize: '우승 30만 포인트' },
    { id: 2, title: '주말 2:2 팀플 매치', status: '진행중', date: '03.28 ~ 03.29', prize: '치킨 기프티콘' }
  ];
  
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-8">
      <div className="text-center sm:text-left border-b border-gray-700 pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-200 to-yellow-500">⚔️ 클랜 대회 및 토너먼트</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {upcomingTournaments.map((t) => (
          <div key={t.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <span className="text-xs font-bold px-3 py-1 bg-sky-900/80 text-sky-400 rounded-full">{t.status}</span>
            <h4 className="text-xl font-bold text-white mt-4 mb-2">{t.title}</h4>
            <p className="text-sm text-yellow-500 font-semibold">🎁 {t.prize}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClanTournament;
