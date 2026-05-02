/**
 * 파일명: PagePlaceholder.js
 *
 * 역할: 아직 개발 중인 메뉴 페이지에 임시로 표시하는 플레이스홀더 컴포넌트입니다.
 * 주요 기능: 전달받은 title을 표시하고 "운영 정리 중" 안내 메시지를 보여줍니다.
 * 사용 방법: <PagePlaceholder title="랭킹" />
 */

/**
 * PagePlaceholder 컴포넌트
 *
 * @param {string} title - 페이지 제목 (예: "랭킹", "설정")
 * @returns {JSX.Element} 준비 중 안내 UI
 */
function PagePlaceholder({ title }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 p-10 rounded-xl border border-gray-700 shadow-2xl text-center animate-fade-in-down mt-10">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-600 mb-4">{title}</h2>
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
