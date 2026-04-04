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

// 데이터 없음 상태 컴포넌트
export function EmptyState({ message, icon = "📋" }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-gray-400">{message}</div>
    </div>
  );
}
