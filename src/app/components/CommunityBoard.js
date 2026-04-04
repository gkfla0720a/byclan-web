'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase'; // 경로는 길드장님 환경에 맞게 유지

export default function CommunityBoard() {
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // ⭐ 1. 진짜 데이터를 담을 상태 (초기값은 빈 배열 [])
  const [posts, setPosts] = useState([]);

  // ⭐ 2. 페이지가 열릴 때 DB에서 글을 가져오는 함수
  const fetchPosts = useCallback(async () => {
    // 💡 select() 안을 보세요! posts의 모든 것(*)과 profiles의 username을 같이 가져옵니다.
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          discord_name,
          ByID
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("데이터 불러오기 에러:", error);
    } else {
      setPosts(data);
    }
  }, []);

  // 날짜 변환 함수 (예: 2026-04-01T... -> 04.01)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  };

  // ⭐ 3. 컴포넌트가 처음 화면에 나타날 때 (Mount) 한 번만 fetchPosts 실행
  useEffect(() => {
    const loadPosts = async () => {
      await fetchPosts();
    };
    void loadPosts();
  }, [fetchPosts]);

  // 글쓰기 완료 함수 (기존 코드 유지하되, 맨 밑에 성공 시 새로고침 기능 추가)
const handleSubmit = async () => {
    if (!title || !content) {
      alert('제목과 내용을 모두 입력해주세요!');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('글을 작성하려면 로그인이 필요합니다!');
      return;
    }

    // ⭐ 디스코드 유저 메타데이터에서 이름(닉네임)을 빼옵니다!
    // (보통 full_name이나 name에 들어있습니다)
    const discordName = user.user_metadata?.full_name || user.user_metadata?.name || '바클유저';

    const { error } = await supabase
      .from('posts')
      .insert([
        { 
          title: title, 
          content: content, 
          user_id: user.id,
          author_name: discordName // ⭐ 테이블에 만들어둔 컬럼에 디스코드 이름 저장!
        }
      ]);


    if (error) {
      alert('글 작성에 실패했습니다: ' + error.message);
    } else {
      alert('글이 성공적으로 등록되었습니다!');
      setTitle('');
      setContent('');
      setIsWriting(false);
      
      // ⭐ 4. 성공적으로 글을 썼다면, 화면을 강제로 새로고침하지 않고
      // 데이터만 다시 불러와서 즉시 화면에 반영!
      fetchPosts(); 
    }
  };

  // ... (이하 return() 부분은 기존 UI 코드 유지) ...

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-500">💬</span> 자유게시판
        </h2>
        {/* ✅ 버튼에 onClick 이벤트 추가! 누를 때마다 isWriting 상태가 반전됨 */}
        <button 
          onClick={() => setIsWriting(!isWriting)}
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform hover:scale-105"
        >
          {isWriting ? '취소하기 ❌' : '글쓰기 ✍️'}
        </button>
      </div>
      
      {/* ✅ isWriting이 true일 때만 아래 글쓰기 폼이 뿅 하고 나타남 */}
      {isWriting && (
        <div className="bg-gray-800 p-4 mb-6 rounded-xl border border-gray-700 shadow-xl flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="제목을 입력하세요 (예: 오늘 내전 팟 구함)" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <textarea 
            placeholder="내용을 입력하세요" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 h-32 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:border-yellow-500 resize-none"
          />
          <button 
            onClick={handleSubmit}
            className="self-end bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            등록 완료
          </button>
        </div>
      )}

      {/* 기존 게시글 목록 UI */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="flex flex-col">
          {posts.map(post => (
            <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer group">
              <div className="flex flex-col gap-1 mb-2 sm:mb-0">
                <span className="text-gray-200 font-medium group-hover:text-yellow-400 transition-colors">{post.title}</span>
                {/* 모바일 뷰 */}
                <span className="text-xs text-gray-500 sm:hidden">
                  {/* profiles에서 ByID를 꺼내오고, 없으면 discord_name으로 처리 */}
                  {post.profiles?.ByID || post.profiles?.discord_name || '알 수 없음'} | {formatDate(post.created_at)} | 조회 {post.views || 0}
                </span>
              </div>
              {/* PC/태블릿 뷰 */}
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
                <span className="w-24 text-center truncate">{post.profiles?.ByID || post.profiles?.discord_name || '알 수 없음'}</span>
                <span className="w-16 text-center">{formatDate(post.created_at)}</span>
                <span className="w-12 text-center text-xs">👀 {post.views || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}