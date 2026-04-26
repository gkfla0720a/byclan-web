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
  const [userVote, setUserVote] = useState(null); // 'like', 'dislike', null

  // 1. 댓글 목록 불러오기
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles!user_id(by_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (!error && data) setCommentsList(data);
  }, [postId]);

  // 2. 내 투표 기록 불러오기
  const fetchVote = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', user?.id)
      .maybeSingle();
    if (data) setUserVote(data.vote_type);
  }, [postId, user?.id]);

  // 3. 전체 데이터 초기 로딩
  useEffect(() => {
    const fetchAllData = async () => {
      // CCTV 끄기 핵심: 이미 현재 글 데이터가 있으면 멈춤! (불필요한 리로딩 방지)
      if (post && post.id == postId) return;
      setLoading(true);
      const { data: postData } = await supabase
        .from('posts')
        .select('*, profiles!user_id(by_id)')
        .eq('id', postId)
        .single();
      
      if (postData) {
        setPost(postData);
        await supabase.rpc('increment_views', { row_id: postId });
        
        // 이전/다음글 찾기
        const { data: nextD } = await supabase.from('posts').select('id').lt('created_at', postData.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle();
        const { data: prevD } = await supabase.from('posts').select('id').gt('created_at', postData.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle();
        setAdjacentPosts({ prev: prevD?.id, next: nextD?.id });
      }
      await fetchComments();
      await fetchVote();
      setLoading(false);
    };
    if (postId) fetchAllData();
  }, [postId, user?.id]);

  // --- 이벤트 핸들러 ---
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    if (!user) return alert('로그인한 길드원만 작성 가능합니다!');
    
    const { error } = await supabase.from('comments').insert([{ post_id: postId, user_id: user.id, content: comment }]);
    if (!error) {
      setComment('');
      fetchComments(); // 즉시 새로고침
    } else {
      alert('댓글 작성 실패: ' + error.message);
    }
  };

  const handleVote = async (type) => {
    if (!user) return alert('로그인한 길드원만 투표가 가능합니다!');

    try {
      if (userVote === type) {
        // [투표 취소] 같은 것을 다시 누름
        await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', user.id);
        setUserVote(null);
        // 화면 수치 1 깎기
        setPost(prev => ({ ...prev, [type === 'like' ? 'likes' : 'dislikes']: Math.max(0, (prev[type === 'like' ? 'likes' : 'dislikes'] || 0) - 1) }));
      } else {
        // [투표 등록/변경] 처음 누르거나 반대쪽 누름
        await supabase.from('post_votes').upsert(
          { post_id: postId, user_id: user.id, vote_type: type }, 
          { onConflict: 'post_id, user_id' } // 💡 제약조건을 이용해 덮어쓰기!
        );
        
        setPost(prev => {
          const newPost = { ...prev };
          // 만약 기존에 다른 투표를 했었다면 1 깎기
          if (userVote) newPost[userVote === 'like' ? 'likes' : 'dislikes'] = Math.max(0, (newPost[userVote === 'like' ? 'likes' : 'dislikes'] || 0) - 1);
          // 새로 누른 투표 1 더하기
          newPost[type === 'like' ? 'likes' : 'dislikes'] = (newPost[type === 'like' ? 'likes' : 'dislikes'] || 0) + 1;
          return newPost;
        });
        setUserVote(type);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    router.push('/community');
  };

  const isAuthor = user?.id === post?.user_id;
  const isManager = PermissionChecker.hasPermission(profile?.role, 'community.manage') || ['developer', 'master', 'admin'].includes(profile?.role);

  if (loading) return <div className="p-10 text-center text-white">게시글을 불러오는 중입니다...</div>;
  if (!post) return <div className="p-10 text-center text-red-400">삭제되었거나 존재하지 않는 게시글입니다.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* 1. 본문 영역 (직각 디자인) */}
      <div className="bg-gray-800 border border-gray-700 shadow-xl mb-1">
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
          <h1 className="text-2xl font-bold text-white mb-4">{post.title}</h1>
          <div className="flex justify-between text-sm text-gray-400">
            <span className="font-bold text-yellow-500">{post.profiles?.by_id || '알 수 없음'}</span>
            <div className="flex gap-4">
              <span>{new Date(post.created_at).toLocaleString()}</span>
              <span>조회 {post.views || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="p-8 min-h-[300px] text-gray-200 bg-gray-900/50 text-lg leading-relaxed">
          {/* 본문 텍스트 */}
          {post.content}

          {/* 첨부 파일 렌더링 */}
          {post.attachment_urls && post.attachment_urls.length > 0 && (
            <div className="mt-8 flex flex-col gap-4">
              {post.attachment_urls.map((file, idx) => {
                const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                return isImage ? (
                  <img key={idx} src={file.url} alt={file.name} className="max-w-full rounded border border-gray-700 shadow-md" />
                ) : (
                  <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline bg-gray-800 p-3 border border-gray-700 w-fit">
                    📎 {file.name} (다운로드)
                  </a>
                );
              })}
            </div>
          )}

          {/* 외부 링크 렌더링 */}
          {post.link_url && (
            <div className="mt-6 p-4 bg-gray-800 border border-gray-700">
              <span className="text-gray-400 text-sm block mb-1">🔗 첨부된 링크:</span>
              <a href={post.link_url} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline break-all">
                {post.link_url}
              </a>
            </div>
          )}
          
          {/* 💡 추천/비추천 버튼 (동일한 바탕 적용) */}
          <div className="flex justify-center gap-6 mt-20">
            <button 
              onClick={() => handleVote('like')} 
              className={`flex flex-col items-center p-4 w-24 border bg-gray-800 hover:bg-gray-700 transition-colors ${
                userVote === 'like' ? 'border-yellow-500' : 'border-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">👍</span>
              <span className={`text-sm font-bold ${userVote === 'like' ? 'text-yellow-500' : 'text-gray-400'}`}>
                추천 {post.likes || 0}
              </span>
            </button>
            <button 
              onClick={() => handleVote('dislike')} 
              className={`flex flex-col items-center p-4 w-24 border bg-gray-800 hover:bg-gray-700 transition-colors ${
                userVote === 'dislike' ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">👎</span>
              <span className={`text-sm font-bold ${userVote === 'dislike' ? 'text-red-500' : 'text-gray-400'}`}>
                비추천 {post.dislikes || 0}
              </span>
            </button>
          </div>
        </div>

        {/* 수정/삭제 권한 */}
        {(isAuthor || isManager) && (
          <div className="p-3 border-t border-gray-700 flex justify-end bg-gray-900/30">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-900/50 text-red-400 hover:bg-red-800/50 font-bold">삭제</button>
          </div>
        )}
      </div>

      {/* 2. 내비게이션 화살표 */}
      <div className="flex justify-end gap-6 my-4 text-2xl text-gray-500">
        {adjacentPosts.prev && <button onClick={() => router.push(`/community/${adjacentPosts.prev}`)} className="hover:text-white transition-colors" title="이전 글">▲</button>}
        {adjacentPosts.next && <button onClick={() => router.push(`/community/${adjacentPosts.next}`)} className="hover:text-white transition-colors" title="다음 글">▼</button>}
        <button onClick={() => router.push('/community')} className="hover:text-white transition-colors" title="목록">📋</button>
      </div>

      {/* 3. 댓글 영역 */}
      <div className="bg-gray-800 border border-gray-700 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-700 pb-2">댓글 {commentsList.length}</h3>
        
        {/* 💡 등록된 댓글 리스트 (위에 배치) */}
        <div className="space-y-4 mb-8">
          {commentsList.length === 0 ? (
            <div className="text-gray-500 text-center py-4">가장 먼저 댓글을 남겨보세요!</div>
          ) : (
            commentsList.map(cmt => (
              <div key={cmt.id} className="border-b border-gray-700/50 pb-3">
                <div className="flex gap-3 text-sm mb-1 items-baseline">
                  <span className="font-bold text-yellow-500">{cmt.profiles?.by_id || '알 수 없음'}</span>
                  <span className="text-gray-500 text-xs">{new Date(cmt.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-300">{cmt.content}</p>
              </div>
            ))
          )}
        </div>

        {/* 💡 댓글 작성란 (아래에 배치) */}
        <div className="flex gap-3 bg-gray-900 p-4 border border-gray-700">
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글을 입력하세요..." 
            className="flex-1 bg-transparent text-white focus:outline-none resize-none h-16"
          />
          <button 
            onClick={handleCommentSubmit} 
            className="bg-gray-700 hover:bg-gray-600 px-6 font-bold text-gray-300 transition-colors border border-gray-600"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}