function ClanTournament() {
  const upcomingTournaments = [
    { id: 1, title: '제 5회 BSL (ByClan StarLeague)', status: '참가 접수중', date: '04.10 ~ 04.30', prize: '우승 30만 포인트' },
    { id: 2, title: '주말 2:2 팀플 매치', status: '진행중', date: '03.28 ~ 03.29', prize: '치킨 기프티콘' }
  ];
  
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-8">
      <div className="text-center sm:text-left border-b border-gray-700 pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">⚔️ 클랜 대회 및 토너먼트</h2>
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
