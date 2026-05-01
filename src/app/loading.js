// src/app/loading.js
export default function Loading() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-bold text-blue-500 animate-pulse">
          ByClan 데이터를 불러오고 있습니다...
        </p>
      </div>
    );
  }