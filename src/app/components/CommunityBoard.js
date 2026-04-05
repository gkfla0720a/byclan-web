'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';

export default function CommunityBoard() {
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchPosts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      const { data, error } = await filterVisibleTestData(supabase
        .from('posts')
        .select('id, title, content, user_id, author_name, views, created_at')
        .order('created_at', { ascending: false }));

      if (error) {
        console.error("데이터 불러오기 에러:", error);
        setFetchError(error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error("게시글 로딩 중 예외 발생:", err);
      setFetchError(err);
      setPosts([]);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    const loadPosts = async () => {
      await fetchPosts();
    };
    void loadPosts();
  }, [fetchPosts]);

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

    const discordName = user.user_metadata?.full_name || user.user_metadata?.name || '바클유저';

    const { error } = await supabase
      .from('posts')
      .insert([
        { 
          title: title, 
          content: content, 
          user_id: user.id,
          author_name: discordName
        }
      ]);


    if (error) {
      alert('글 작성에 실패했습니다: ' + error.message);
    } else {
      alert('글이 성공적으로 등록되었습니다!');
      setTitle('');
      setContent('');
      setIsWriting(false);
      
      fetchPosts(); 
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-500">💬</span> 자유게시판
        </h2>
        <button 
          onClick={() => setIsWriting(!isWriting)}
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform hover:scale-105"
        >
          {isWriting ? '취소하기 ❌' : '글쓰기 ✍️'}
        </button>
      </div>
      
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

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        {!isSupabaseConfigured ? (
          <div className="p-8 text-center text-gray-400">
            게시판 데이터 연결이 아직 완료되지 않았습니다. Supabase 연결 후 실제 클랜 글이 여기에 표시됩니다.
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">게시글을 불러오는 중입니다...</div>
        ) : fetchError ? (
          <div className="p-8 text-center text-red-400">
            게시글을 불러오지 못했습니다. 잠시 후 새로고침 해주세요.
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            아직 등록된 글이 없습니다. 첫 글을 남겨서 오늘 클랜 분위기를 시작해보세요.
          </div>
        ) : (
          <div className="flex flex-col">
          {posts.map(post => (
            <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer group">
              <div className="flex flex-col gap-1 mb-2 sm:mb-0">
                <span className="text-gray-200 font-medium group-hover:text-yellow-400 transition-colors">{post.title}</span>
                <span className="text-xs text-gray-500 sm:hidden">
                  {post.author_name || '알 수 없음'} | {formatDate(post.created_at)} | 조회 {post.views || 0}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
                <span className="w-24 text-center truncate">{post.author_name || '알 수 없음'}</span>
                <span className="w-16 text-center">{formatDate(post.created_at)}</span>
                <span className="w-12 text-center text-xs">👀 {post.views || 0}</span>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}