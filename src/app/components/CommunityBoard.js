'use client';

import React from 'react';

export default function CommunityBoard() {
  // 임시 게시글 데이터
  const posts = [
    { id: 1, title: '오늘 저녁 8시 4:4 내전 하실 분 구합니다 (3/8)', author: 'By_Flash', date: '03.31', views: 42 },
    { id: 2, title: '요즘 11시 자리 테란 너무 힘든데 심시티 팁 좀요', author: 'By_Zergling', date: '03.30', views: 15 },
    { id: 3, title: '가입 인사 드립니다! 빨무 10년차 뉴비입니다.', author: '초보유저', date: '03.29', views: 28 },
    { id: 4, title: '어제 래더 결승전 명경기 리플레이 파일 공유', author: 'By_Slayer', date: '03.28', views: 56 },
    { id: 5, title: '클랜 홈페이지 너무 멋지네요 ㄷㄷ', author: '지나가는유저', date: '03.27', views: 89 },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-500">💬</span> 자유게시판
        </h2>
        <button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform hover:scale-105">
          글쓰기 ✍️
        </button>
      </div>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="flex flex-col">
          {posts.map(post => (
            <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer group">
              <div className="flex flex-col gap-1 mb-2 sm:mb-0">
                <span className="text-gray-200 font-medium group-hover:text-yellow-400 transition-colors">{post.title}</span>
                {/* 모바일에서만 보이는 작성자/날짜/조회수 */}
                <span className="text-xs text-gray-500 sm:hidden">
                  {post.author} | {post.date} | 조회 {post.views}
                </span>
              </div>
              {/* PC/태블릿에서만 보이는 우측 정보 */}
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
                <span className="w-24 text-center truncate">{post.author}</span>
                <span className="w-16 text-center">{post.date}</span>
                <span className="w-12 text-center text-xs">👀 {post.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
