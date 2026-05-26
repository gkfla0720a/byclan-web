// 파일명: src/app/(main)/(sidebar)/community/[id]/page.tsx

'use client';

import Image from 'next/image';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { hasPermission, normalizeRole } from '@/utils/permissions';
import type { Database } from '@/types';

type PostsRow = Database['public']['Tables']['posts']['Row'];
type CommentsRow = Database['public']['Tables']['comments']['Row'];

interface JoinedPost extends PostsRow {
  profiles: { by_id: string | null } | null;
}

interface JoinedComment extends CommentsRow {
  profiles: { by_id: string | null } | null;
}

export default function PostDetailPage() {
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(true);

  const params = useParams(); // URL에서 :id 값을 가져옵니다.
  const router = useRouter(); // 페이지 이동을 위한 라우터
  const postId = Number(params.id); // 게시글 ID (숫자 변환)

  const [post, setPost] = useState<JoinedPost | null>(null); // 게시글 데이터
  const [commentsList, setCommentsList] = useState<JoinedComment[]>([]); // 댓글 목록 배열
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null); // 투표 타입 저장
  const [voteCounts, setVoteCounts] = useState({ like: 0, dislike: 0 }); // 투표 수량 저장

  const [comment, setComment] = useState(''); // 댓글 입력란의 현재 값
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null); // 현재 수정 중인 댓글 ID (null이면 수정 모드 아님)
  const [editContent, setEditContent] = useState(''); // 수정 중인 댓글의 내용

  const [adjacentPosts, setAdjacentPosts] = useState<{ prev: number | null; next: number | null }>({ prev: null, next: null }); // 이전/다음 글 ID 저장

  // --- 데이터 패치 로직(useCallback으로 최적화)---

  // 댓글 목록 불러오기
  const fetchComments = useCallback(async () => {
    if (!postId) return;
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles!user_id(by_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) setCommentsList(data as unknown as JoinedComment[]);
  }, [postId]);

  // 게시글 투표 합계
  const fetchVoteCounts = useCallback(async () => {
    if (!postId) return;
    const { data, error } = await supabase
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId);

    if (!error && data) {
      const like = data.filter(v => v.vote_type === 'like').length;
      const dislike = data.filter(v => v.vote_type === 'dislike').length;
      setVoteCounts({ like, dislike });
    }
  }, [postId]);

  // 유저의 투표 데이터
  const fetchUserVote = useCallback(async () => {
    if (!user?.id || !postId) return;
    const { data } = await supabase
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    setUserVote(data?.vote_type === 'like' || data?.vote_type === 'dislike' ? data.vote_type : null);
  }, [postId, user?.id]);

  // 전체 데이터 초기 로딩
  useEffect(() => {
    if (!postId || isNaN(postId)) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const { data: postData, error } = await supabase
          .from('posts')
          .select('*, profiles!user_id(by_id)')
          .eq('id', postId)
          .single();

        if (error) throw error;

        if (postData) {
          // 배열 반환을 방지하기 위한 안전한 추출
          const prof = Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles;
          setPost({ ...postData, profiles: prof } as JoinedPost);

          await supabase.rpc('increment_views', { row_id: postId });

          // 이전/다음글 찾기
          const [{ data: nextD }, { data: prevD }] = await Promise.all([
            supabase.from('posts').select('id').lt('created_at', postData.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('posts').select('id').gt('created_at', postData.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle()
          ]);
          setAdjacentPosts({ prev: prevD?.id ?? null, next: nextD?.id ?? null });
        }
        await Promise.all([fetchComments(), fetchVoteCounts(), fetchUserVote()]);
      } catch (err) {
        console.error("게시글 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    queueMicrotask(() => { fetchAllData(); });
  }, [postId, fetchComments, fetchVoteCounts, fetchUserVote]);

  // --- 이벤트 핸들러 ---
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    if (!user) return alert('로그인한 클랜원만 작성 가능합니다!');

    const { error } = await supabase.from('comments').insert([{ post_id: postId, user_id: user.id, content: comment }]);
    if (!error) {
      setComment('');
      fetchComments(); // 즉시 새로고침
    } else {
      alert('댓글 작성 실패: ' + error.message);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) fetchComments(); // 삭제 후 새로고침
  };

  // 댓글 수정 모드 켜기
  const startEditComment = (cmt: JoinedComment) => {
    setEditingCommentId(cmt.id);
    setEditContent(cmt.content);
  };

  // 댓글 수정 완료 (DB 저장)
  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    const { error } = await supabase.from('comments').update({ content: editContent }).eq('id', commentId);
    if (!error) {
      setEditingCommentId(null);
      fetchComments(); // 수정 후 새로고침
    }
  };

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!user) return alert('로그인한 클랜원만 투표가 가능합니다!');

    try {
      if (userVote === type) {
        // 투표 취소
        setUserVote(null);
        setVoteCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        // 투표 등록 및 변경
        setUserVote(type);
        setVoteCounts(prev => ({
          like: type === 'like' ? prev.like + 1 : (userVote === 'like' ? Math.max(0, prev.like - 1) : prev.like),
          dislike: type === 'dislike' ? prev.dislike + 1 : (userVote === 'dislike' ? Math.max(0, prev.dislike - 1) : prev.dislike)
        }));
        await supabase.from('post_votes').upsert({ post_id: postId, user_id: user.id, vote_type: type }, { onConflict: 'post_id, user_id' });
      }
    } catch (err) {
      console.error("투표 처리 중 오류:", err);
      // 실패 시 원래 상태로 복구하기 위해 다시 패치
      fetchVoteCounts();
      fetchUserVote();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    router.push('/community');
  };

  const isAuthor = user?.id === post?.user_id;
  const isManager = hasPermission(normalizeRole(profile?.role), 'community.manage') || ['developer', 'master', 'admin'].includes(profile?.role || '');

  // --- UI 랜더링 ---

  if (loading) return <div className="p-10 text-center text-white animate-pulse">게시글을 불러오는 중입니다...</div>;
  if (!post) return <div className="p-10 text-center text-red-400 font-bold border border-red-500 rounded p-8 bg-gray-900 mx-auto max-w-md mt-10">삭제되었거나 존재하지 않는 게시글입니다.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 font-sans">
      <div className="bg-gray-800 border border-gray-700 shadow-xl mb-1">
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
          <h1 className="text-2xl font-black text-white mb-4 leading-tight">{post.title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span className="font-bold text-yellow-500">✍️ {post.profiles?.by_id || '알 수 없음'}</span>
            <div className="flex gap-4 font-mono text-xs">
              <span>{new Date(post.created_at).toLocaleString('ko-KR')}</span>
              <span>조회 {post.views || 0}</span>
            </div>
          </div>
        </div>

        <div className="p-8 min-h-[300px] text-gray-200 bg-gray-900/50 text-base leading-loose whitespace-pre-wrap">
          {post.content}

          {/* 첨부 파일 렌더링 (타입 단언 추가) */}
          {post.attachment_urls && Array.isArray(post.attachment_urls) && post.attachment_urls.length > 0 && (
            <div className="mt-8 flex flex-col gap-4">
              {(post.attachment_urls as { url: string; name: string }[]).map((file, idx) => {
                const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                return isImage ? (
                  <Image key={idx} src={file.url} alt={file.name} width={1200} height={800} className="max-w-full h-auto rounded border border-gray-700 shadow-md" />
                ) : (
                  <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline bg-gray-800 px-4 py-3 border border-gray-700 w-fit rounded transition-colors hover:bg-gray-700">
                    📎 {file.name} (다운로드)
                  </a>
                );
              })}
            </div>
          )}

          {post.link_url && (
            <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded flex flex-col gap-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">🔗 Attached Link</span>
              <a href={post.link_url} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline break-all">
                {post.link_url}
              </a>
            </div>
          )}

          <div className="flex justify-center gap-6 mt-20">
            <button
              onClick={() => handleVote('like')}
              className={`flex flex-col items-center p-4 w-24 rounded border transition-colors ${userVote === 'like' ? 'bg-gray-700 border-yellow-500' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
            >
              <span className="text-2xl mb-2">👍</span>
              <span className={`text-sm font-bold ${userVote === 'like' ? 'text-yellow-500' : 'text-gray-400'}`}>
                추천 {voteCounts.like}
              </span>
            </button>
            <button
              onClick={() => handleVote('dislike')}
              className={`flex flex-col items-center p-4 w-24 rounded border transition-colors ${userVote === 'dislike' ? 'bg-gray-700 border-red-500' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
            >
              <span className="text-2xl mb-2">👎</span>
              <span className={`text-sm font-bold ${userVote === 'dislike' ? 'text-red-500' : 'text-gray-400'}`}>
                비추천 {voteCounts.dislike}
              </span>
            </button>
          </div>
        </div>

        {(isAuthor || isManager) && (
          <div className="p-3 border-t border-gray-700 flex justify-end bg-gray-900/30">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-900/50 text-red-400 hover:bg-red-800 hover:text-white font-bold rounded transition-colors text-sm">
              게시글 삭제
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 my-6">
        <button onClick={() => router.push('/community')} className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 font-bold rounded hover:bg-gray-700 transition-colors text-sm">
          📋 목록으로
        </button>
        {adjacentPosts.prev && <button onClick={() => router.push(`/community/${adjacentPosts.prev}`)} className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 font-bold rounded hover:bg-gray-700 transition-colors text-sm">▲ 이전 글</button>}
        {adjacentPosts.next && <button onClick={() => router.push(`/community/${adjacentPosts.next}`)} className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 font-bold rounded hover:bg-gray-700 transition-colors text-sm">▼ 다음 글</button>}
      </div>

      <div className="bg-gray-800 border border-gray-700 p-6 shadow-xl rounded-lg">
        <h3 className="text-lg font-black text-white mb-6 border-b border-gray-700 pb-3 flex items-center gap-2">
          💬 댓글 <span className="text-yellow-500">{commentsList.length}</span>
        </h3>

        <div className="space-y-4 mb-8">
          {commentsList.length === 0 ? (
            <div className="text-gray-500 text-center py-8 bg-gray-900/30 rounded border border-gray-700 border-dashed">
              가장 먼저 댓글을 남겨보세요!
            </div>
          ) : (
            commentsList.map(cmt => {
              const isCommentAuthor = user?.id === cmt.user_id;
              const canManageComment = isCommentAuthor || isManager;
              const prof = Array.isArray(cmt.profiles) ? cmt.profiles[0] : cmt.profiles;

              return (
                <div key={cmt.id} className="border-b border-gray-700/50 pb-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-yellow-400">{prof?.by_id || '알 수 없음'}</span>
                      <span className="text-gray-500 text-[10px] font-mono">{new Date(cmt.created_at).toLocaleString()}</span>
                    </div>
                    {canManageComment && editingCommentId !== cmt.id && (
                      <div className="flex gap-3 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCommentAuthor && <button onClick={() => startEditComment(cmt)} className="text-blue-400 hover:text-blue-300 uppercase tracking-wider">Edit</button>}
                        <button onClick={() => handleDeleteComment(cmt.id)} className="text-red-400 hover:text-red-300 uppercase tracking-wider">Delete</button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === cmt.id ? (
                    <div className="mt-2 flex gap-3 flex-col sm:flex-row">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-gray-900 border border-yellow-600/50 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-yellow-500"
                        rows={2}
                      />
                      <div className="flex sm:flex-col gap-2 justify-end">
                        <button onClick={() => handleUpdateComment(cmt.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold text-xs">완료</button>
                        <button onClick={() => setEditingCommentId(null)} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold text-xs">취소</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed pl-1">{cmt.content}</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 bg-gray-900 p-4 border border-gray-700 rounded-lg">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "상호 존중하는 댓글 문화를 만들어주세요." : "로그인 후 댓글을 작성할 수 있습니다."}
            disabled={!user}
            className="flex-1 bg-transparent text-white focus:outline-none resize-none h-16 text-sm placeholder-gray-600 disabled:opacity-50"
          />
          <button
            onClick={handleCommentSubmit}
            disabled={!user || !comment.trim()}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 px-8 py-2 font-black rounded transition-colors whitespace-nowrap"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
