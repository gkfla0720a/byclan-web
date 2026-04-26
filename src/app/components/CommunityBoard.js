/**
 * 파일명: CommunityBoard.js
 *
 * 역할:
 *   클랜 자유게시판 컴포넌트입니다. 게시글 목록을 보여주고,
 *   로그인한 사용자가 새 글을 작성·등록할 수 있습니다.
 *
 * 주요 기능:
 *   - Supabase posts 테이블에서 게시글 목록을 최신순으로 불러옵니다.
 *   - '글쓰기' 버튼을 누르면 제목·내용 입력 폼이 인라인으로 펼쳐집니다.
 *   - 글 등록 시 로그인 여부를 확인하고, Discord 닉네임을 작성자명으로 사용합니다.
 *   - 모바일에서는 날짜·조회수가 제목 셀 아래에 작게 표시됩니다.
 *
 * 사용 방법:
 *   import CommunityBoard from './CommunityBoard';
 *   <CommunityBoard />
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';
import { PermissionChecker } from '@/app/utils/permissions';
import { useAuthContext } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * CommunityBoard 컴포넌트
 *
 * 자유게시판 목록과 글쓰기 기능을 제공합니다.
 *
 * @returns {JSX.Element} 자유게시판 UI
 */
export default function CommunityBoard() {
  const router = useRouter(); // 페이지 이동을 위한 라우터
  const { profile } = useAuthContext(); // 현재 로그인 유저 프로필 (권한 확인용)

// --- 상태 정의 ---
  const [posts, setPosts] = useState([]); // DB에서 불러온 게시글 배열
  const [loading, setLoading] = useState(true);  // 게시글 로딩 중 여부
  
  // 💡 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const postsPerPage = 30; // 페이지당 게시글 수

  /**
   * posts 테이블에서 게시글을 최신순으로 불러옵니다.
   * useCallback으로 감싸 fetchPosts 참조가 불필요하게 바뀌지 않도록 합니다.
   */
  const fetchPosts = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data, error } = await filterVisibleTestData(supabase
        .from('posts')
        // author_name 컬럼 대신 profiles 테이블 JOIN으로 최신 닉네임을 가져옵니다.
        .select('id, title, user_id, views, likes, created_at, profiles!user_id(by_id), comments(count)')
        .order('created_at', { ascending: false }));

      if (!error) setPosts(data || []);
      } finally {
        setLoading(false);
      }      
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    // --- 페이징 계산 로직 ---
    // 1. 현재 페이지에 보여줄 게시글을 계산합니다.
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

    // 2. 총 페이지 수를 계산합니다.
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      {/* 상단 헤더 영역 */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-white">💬 자유게시판</h2>
        <button 
          onClick={() => router.push('/community/write')}
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-5 py-2 rounded-lg font-bold transition-all shadow-lg hover:scale-105"
        >
          글쓰기 ✍️
        </button>
      </div>

      {/* 게시판 본문 (테이블 형태) */}
      <div className="bg-gray-800 border border-gray-700 overflow-hidden shadow-2xl">
        {/* 1. 컬럼 제목 (Header) */}
        <div className="flex items-center bg-gray-900/80 text-gray-400 text-sm font-bold border-b border-gray-600">
          <div className="w-16 py-3 text-center border-r border-gray-700">번호</div>
          <div className="flex-1 py-3 text-center border-r border-gray-700">제목</div>
          <div className="w-28 py-3 text-center border-r border-gray-700">작성자</div>
          <div className="w-20 py-3 text-center border-r border-gray-700">날짜</div>
          <div className="w-16 py-3 text-center border-r border-gray-700">댓글</div>
          <div className="w-16 py-3 text-center border-r border-gray-700">추천수</div>
          <div className="w-16 py-3 text-center">조회수</div>
        </div>

        {/* 2. 게시글 목록 (Body) */}
        <div className="flex flex-col">
          {loading ? (
            <div className="p-10 text-center text-gray-500">불러오는 중...</div>
          ) : currentPosts.length === 0 ? (
            <div className="p-10 text-center text-gray-500">게시글이 없습니다.</div>
          ) : (
            currentPosts.map((post, index) => (
              <div 
                key={post.id}
                onClick={() => router.push(`/community/${post.id}`)}
                className="flex items-center text-sm text-gray-300 border-b border-gray-700/50 hover:bg-gray-700/40 transition-colors cursor-pointer"
              >
                {/* 💡 번호는 전체 개수에서 차례대로 보여줌 */}
                <div className="w-16 py-4 text-center border-r border-gray-700/50 text-gray-500 font-mono">
                  {posts.length - (indexOfFirstPost + index)}
                </div>
                <div className="flex-1 px-4 py-4 border-r border-gray-700/50 truncate font-medium text-gray-200">
                  {post.title}
                </div>
                <div className="w-28 py-4 text-center border-r border-gray-700/50 truncate">
                  {post.profiles?.by_id || '알 수 없음'}
                </div>
                <div className="w-20 py-4 text-center border-r border-gray-700/50 text-gray-400">
                  {formatDate(post.created_at)}
                </div>
                <div className="w-16 py-4 text-center border-r border-gray-700/50 text-yellow-500 font-bold">
                  {post.comments?.[0]?.count || 0} {/* 댓글 수 */}
                </div>
                <div className="w-16 py-4 text-center border-r border-gray-700/50 text-pink-400">
                  {post.likes || 0} {/* 추천수 */}
                </div>
                <div className="w-16 py-4 text-center text-gray-500">
                  {post.views || 0} {/* 조회수 */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. 페이지네이션 (Pagination) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`w-10 h-10 rounded-lg font-bold transition-all ${
                currentPage === number 
                ? 'bg-yellow-500 text-gray-900 shadow-lg' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}