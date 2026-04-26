'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/app/context/AuthContext';
import { PermissionChecker } from '@/app/utils/permissions';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id; 
  const { user, profile } = useAuthContext();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentsList, setCommentsList] = useState([]);
  const [comment, setComment] = useState('');
  const [adjacentPosts, setAdjacentPosts] = useState({ prev: null, next: null });

  // 댓글 불러오기 함수 (자주 쓰이므로 useCallback으로 선언)
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles!user_id(by_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (!error && data) setCommentsList(data);
  }, [postId]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const { data: postData } = await supabase.from('posts').select('*, profiles!user_id(by_id)').eq('id', postId).single();
      
      if (postData) {
        setPost(postData);
        await supabase.rpc('increment_views', { row_id: postId });
        
        // 내비게이션용 ID 찾기
        const { data: nextD } = await supabase.from('posts').select('id').lt('created_at', postData.created_at).order('created_at', { ascending: false }).limit(1).single();
        const { data: prevD } = await supabase.from('posts').select('id').gt('created_at', postData.created_at).order('created_at', { ascending: true }).limit(1).single();
        setAdjacentPosts({ prev: prevD?.id, next: nextD?.id });
      }
      await fetchComments();
      setLoading(false);
    };
    if (postId) fetchAllData();
  }, [postId, fetchComments]);

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    const { error } = await supabase.from('comments').insert([{ post_id: postId, user_id: user.id, content: comment }]);
    if (!error) {
      setComment('');
      fetchComments(); // 💡 즉시 갱신!
    }
  };

  const handleLike = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    const newLikes = (post.likes || 0) + 1;
    await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
    setPost({ ...post, likes: newLikes });
  };

  const handleDislike = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    const newDislikes = (post.dislikes || 0) + 1;
    await supabase.from('posts').update({ dislikes: newDislikes }).eq('id', postId);
    setPost({ ...post, dislikes: newDislikes });
  };

  if (loading) return <div className="p-10 text-center text-white">불러오는 중...</div>;
  if (!post) return <div className="p-10 text-center text-red-400">글이 없습니다.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* 1. 본문 영역 */}
      <div className="bg-gray-800 border border-gray-700 shadow-xl mb-1">
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
          <h1 className="text-2xl font-bold text-white mb-4">{post.title}</h1>
          <div className="flex justify-between text-sm text-gray-400">
            <span className="font-bold text-yellow-500">{post.profiles?.by_id}</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="p-8 min-h-[300px] text-gray-200 bg-gray-900/50 text-lg leading-relaxed">
          {post.content}
          
          {/* 추천 버튼부 */}
          <div className="flex justify-center gap-6 mt-20">
            <button onClick={handleLike} className="flex flex-col items-center p-4 border border-gray-600 bg-gray-800 rounded-xl hover:bg-gray-700">
              <span className="text-2xl">👍</span>
              <span className="text-sm font-bold text-pink-500">{post.likes || 0}</span>
            </button>
            <button onClick={handleDislike} className="flex flex-col items-center p-4 border border-gray-600 bg-gray-800 rounded-xl opacity-50">
              <span className="text-2xl">👎</span>
              <span className="text-sm font-bold text-gray-500">{post.dislikes || 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 내비게이션 화살표 */}
      <div className="flex justify-end gap-6 my-4 text-2xl text-gray-500">
        {adjacentPosts.prev && <button onClick={() => router.push(`/community/${adjacentPosts.prev}`)} className="hover:text-white">▲</button>}
        {adjacentPosts.next && <button onClick={() => router.push(`/community/${adjacentPosts.next}`)} className="hover:text-white">▼</button>}
        <button onClick={() => router.push('/community')} className="hover:text-white">📋</button>
      </div>

      {/* 3. 댓글 영역 */}
      <div className="bg-gray-800 border border-gray-700 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-700 pb-2">댓글 {commentsList.length}</h3>
        
        {/* 댓글 리스트가 먼저 나옴 */}
        <div className="space-y-4 mb-8">
          {commentsList.map(cmt => (
            <div key={cmt.id} className="border-b border-gray-700/50 pb-3">
              <div className="flex gap-2 text-sm mb-1">
                <span className="font-bold text-yellow-500">{cmt.profiles?.by_id}</span>
                <span className="text-gray-500 text-xs">{new Date(cmt.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="text-gray-300">{cmt.content}</p>
            </div>
          ))}
        </div>

        {/* 댓글 작성란이 아래에 위치 */}
        <div className="flex gap-3 bg-gray-900 p-4 border border-gray-700 rounded-lg">
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글을 입력하세요..." 
            className="flex-1 bg-transparent text-white focus:outline-none resize-none h-16"
          />
          <button onClick={handleCommentSubmit} className="bg-gray-700 hover:bg-gray-600 px-6 font-bold rounded-lg text-gray-300">등록</button>
        </div>
      </div>
    </div>
  );
}