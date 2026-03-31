'use client';

import React from 'react';

export default function NoticeBoard() {
  // 임시 공지사항 데이터 (나중에는 이것도 DB에서 불러올 수 있습니다!)
  const notices = [
    { id: 1, type: '필독', title: '바이클랜 2026년 상반기 통합 랭킹전 안내', author: '운영진', date: '2026.03.28' },
    { id: 2, type: '공지', title: '신규 클랜원 가입 조건 및 테스트 안내', author: '운영진', date: '2026.03.25' },
    { id: 3, type: '이벤트', title: '주말 빠른무한 내전 참여자 포인트 2배', author: '운영진', date: '2026.03.21' },
    { id: 4, type: '일반', title: '디스코드 서버 채널 개편 안내', author: '관리자', date: '2026.03.15' },
    { id: 5, type: '일반', title: '클랜 로고 및 홈페이지 리뉴얼 관련 의견 수렴', author: '길드마스터', date: '2026.03.10' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-500">📢</span> 공지사항
        </h2>
      </div>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/80 text-gray-400 text-sm border-b border-gray-700">
              <th className="py-4 px-4 font-semibold w-20 text-center hidden sm:table-cell">분류</th>
              <th className="py-4 px-4 font-semibold">제목</th>
              <th className="py-4 px-4 font-semibold text-center w-24 hidden md:table-cell">작성자</th>
              <th className="py-4 px-4 font-semibold text-center w-28 hidden sm:table-cell">작성일</th>
            </tr>
          </thead>
          <tbody className="text-gray-200 text-sm sm:text-base">
            {notices.map((notice) => (
              <tr key={notice.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer group">
                <td className="py-4 px-4 text-center hidden sm:table-cell">
                  <span className={`text-[11px] px-2 py-1 rounded font-bold ${
                    notice.type === '필독' ? 'bg-red-900/60 text-red-400' : 
                    notice.type === '이벤트' ? 'bg-sky-900/60 text-sky-400' : 
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {notice.type}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1">
                    {/* 모바일에서만 보이는 분류 뱃지 */}
                    <span className="sm:hidden text-[10px] text-gray-400">[{notice.type}]</span>
                    <span className="font-medium group-hover:text-yellow-400 transition-colors">{notice.title}</span>
                    {/* 모바일에서만 보이는 작성자/날짜 */}
                    <span className="sm:hidden text-xs text-gray-500">{notice.author} | {notice.date}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center text-gray-400 hidden md:table-cell">{notice.author}</td>
                <td className="py-4 px-4 text-center text-gray-400 hidden sm:table-cell">{notice.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
