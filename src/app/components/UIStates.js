/**
 * @file UIStates.js
 *
 * @역할
 *   데이터 로딩 중, 오류 발생 시, 데이터가 없을 때 등 다양한 UI 상태를
 *   일관된 모습으로 표시하기 위한 재사용 가능한 컴포넌트 모음입니다.
 *
 * @주요기능
 *   - SkeletonLoader: 데이터 로딩 중일 때 뼈대(스켈레톤) UI를 표시
 *   - ErrorMessage: 오류 발생 시 메시지와 재시도 버튼을 표시
 *   - EmptyState: 데이터가 없을 때 안내 메시지와 아이콘을 표시
 *
 * @관련컴포넌트
 *   - 데이터를 불러오는 모든 페이지·컴포넌트에서 사용 가능 (예: 랭킹, 멤버 목록 등)
 *
 * @사용방법
 *   // 로딩 중:
 *   <SkeletonLoader count={5} />
 *
 *   // 오류 발생:
 *   <ErrorMessage message="데이터를 불러오지 못했습니다." onRetry={handleRetry} />
 *
 *   // 빈 목록:
 *   <EmptyState message="등록된 항목이 없습니다." icon="🗂️" />
 */

/**
 * 데이터 로딩 중 뼈대(스켈레톤) UI를 표시하는 컴포넌트입니다.
 * 실제 데이터가 오기 전 레이아웃을 유지하고 로딩 중임을 시각적으로 알려줍니다.
 *
 * @param {{ count?: number }} props
 * @param {number} [props.count=3] - 표시할 스켈레톤 행의 수 (기본값: 3)
 * @returns {JSX.Element} 깜빡이는 스켈레톤 행 목록
 */
// 로딩 스켈레톤 컴포넌트
export function SkeletonLoader({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="w-12 h-4 bg-gray-600 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * 오류 발생 시 오류 메시지와 재시도 버튼을 표시하는 컴포넌트입니다.
 *
 * @param {{ message: string, onRetry?: () => void }} props
 * @param {string} props.message - 표시할 오류 메시지
 * @param {function} [props.onRetry] - '다시 시도' 버튼 클릭 시 실행할 함수 (없으면 버튼 미표시)
 * @returns {JSX.Element} 오류 메시지 박스
 */
// 에러 상태 컴포넌트
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-center">
      <div className="text-red-400 mb-2">⚠️ {message}</div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * 데이터가 없을 때 빈 상태 안내 메시지와 아이콘을 표시하는 컴포넌트입니다.
 *
 * @param {{ message: string, icon?: string }} props
 * @param {string} props.message - 표시할 안내 메시지
 * @param {string} [props.icon='📋'] - 표시할 이모지 아이콘 (기본값: '📋')
 * @returns {JSX.Element} 빈 상태 안내 박스
 */
// 데이터 없음 상태 컴포넌트
export function EmptyState({ message, icon = "📋" }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-gray-400">{message}</div>
    </div>
  );
}
