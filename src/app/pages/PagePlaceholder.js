function PagePlaceholder({ title }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center animate-fade-in-down mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
      <p className="text-gray-400 text-lg">
        <strong className="text-white">{title}</strong> 메뉴는 현재 운영 정리 중입니다.
      </p>
      <p className="text-sm text-gray-500 mt-3">
        관련 데이터와 화면 흐름을 실제 서비스 기준으로 옮기는 작업이 끝나는 대로 이 영역도 순차적으로 연결됩니다.
      </p>
    </div>
  );
}

export default PagePlaceholder;
