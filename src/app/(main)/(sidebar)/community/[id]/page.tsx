// 파일명: src/app/(main)/(sidebar)/community/[id]/page.tsx
'use client';

import Image from 'next/image';
import { usePostDetail, JoinedComment } from '@/hooks/usePostDetail';

export default function PostDetailPage() {
  // 🚨 방금 만든 훅에서 필요한 모든 데이터와 함수를 가져옵니다! (코드가 엄청 깔끔해집니다)
  const {
    post, commentsList, loading, user, isAuthor, isManager, router, adjacentPosts,
    userVote, voteCounts, handleVote, handleDeletePost,
    comment, setComment, handleCommentSubmit,
    editingCommentId, setEditingCommentId, editContent, setEditContent,
    handleUpdateComment, handleDeleteComment
  } = usePostDetail();

  // --- UI 렌더링 영역 ---
  if (loading) return <div className="p-10 text-center text-white animate-pulse">게시글을 불러오는 중입니다...</div>;
  if (!post) return <div className="p-10 text-center text-red-400 font-bold border border-red-500 rounded p-8 bg-gray-900 mx-auto max-w-md mt-10">삭제되었거나 존재하지 않는 게시글입니다.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 font-sans">

      {/* 1. 게시글 본문 영역 */}
      <div className="bg-gray-800 border border-gray-700 shadow-xl mb-1">
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
          <h1 className="text-2xl font-black text-white mb-4 leading-tight">{post.title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span className="font-bold text-yellow-500">✍️ {post.profiles?.by_id || '알 수 없음'}</span>
            <div className="flex gap-4 font-mono text-xs">
              <span>{new Date(post.created_at || new Date().toISOString()).toLocaleString('ko-KR')}</span>
              <span>조회 {post.views || 0}</span>
            </div>
          </div>
        </div>

        <div className="p-8 min-h-[300px] text-gray-200 bg-gray-900/50 text-base leading-loose whitespace-pre-wrap">
          {post.content}

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
            <button onClick={() => handleVote('like')} className={`flex flex-col items-center p-4 w-24 rounded border transition-colors ${userVote === 'like' ? 'bg-gray-700 border-yellow-500' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}>
              <span className="text-2xl mb-2">👍</span>
              <span className={`text-sm font-bold ${userVote === 'like' ? 'text-yellow-500' : 'text-gray-400'}`}>추천 {voteCounts.like}</span>
            </button>
            <button onClick={() => handleVote('dislike')} className={`flex flex-col items-center p-4 w-24 rounded border transition-colors ${userVote === 'dislike' ? 'bg-gray-700 border-red-500' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}>
              <span className="text-2xl mb-2">👎</span>
              <span className={`text-sm font-bold ${userVote === 'dislike' ? 'text-red-500' : 'text-gray-400'}`}>비추천 {voteCounts.dislike}</span>
            </button>
          </div>
        </div>

        {/* 게시글 삭제 권한 확인 */}
        {(isAuthor || isManager) && (
          <div className="p-3 border-t border-gray-700 flex justify-end bg-gray-900/30">
            <button onClick={handleDeletePost} className="px-4 py-2 bg-red-900/50 text-red-400 hover:bg-red-800 hover:text-white font-bold rounded transition-colors text-sm">
              게시글 삭제
            </button>
          </div>
        )}
      </div>

      {/* 2. 네비게이션 */}
      <div className="flex justify-end gap-3 my-6">
        <button onClick={() => router.push('/community')} className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 font-bold rounded hover:bg-gray-700 transition-colors text-sm">📋 목록으로</button>
        {adjacentPosts.prev && <button onClick={() => router.push(`/community/${adjacentPosts.prev}`)} className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 font-bold rounded hover:bg-gray-700 transition-colors text-sm">▲ 이전 글</button>}
        {adjacentPosts.next && <button onClick={() => router.push(`/community/${adjacentPosts.next}`)} className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 font-bold rounded hover:bg-gray-700 transition-colors text-sm">▼ 다음 글</button>}
      </div>

      {/* 3. 댓글 영역 */}
      <div className="bg-gray-800 border border-gray-700 p-6 shadow-xl rounded-lg">
        <h3 className="text-lg font-black text-white mb-6 border-b border-gray-700 pb-3 flex items-center gap-2">
          💬 댓글 <span className="text-yellow-500">{commentsList.length}</span>
        </h3>

        <div className="space-y-4 mb-8">
          {commentsList.length === 0 ? (
            <div className="text-gray-500 text-center py-8 bg-gray-900/30 rounded border border-gray-700 border-dashed">가장 먼저 댓글을 남겨보세요!</div>
          ) : (
            commentsList.map((cmt: JoinedComment) => {
              const isCommentAuthor = user?.id === cmt.user_id;
              const canManageComment = isCommentAuthor || isManager;
              const prof = Array.isArray(cmt.profiles) ? cmt.profiles[0] : cmt.profiles;

              return (
                <div key={cmt.id} className="border-b border-gray-700/50 pb-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-yellow-400">{prof?.by_id || '알 수 없음'}</span>
                      <span className="text-gray-500 text-[10px] font-mono">{new Date(cmt.created_at || new Date().toISOString()).toLocaleString()}</span>
                    </div>
                    {canManageComment && editingCommentId !== cmt.id && (
                      <div className="flex gap-3 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCommentAuthor && <button onClick={() => { setEditingCommentId(cmt.id); setEditContent(cmt.content); }} className="text-blue-400 hover:text-blue-300 uppercase tracking-wider">Edit</button>}
                        <button onClick={() => handleDeleteComment(cmt.id)} className="text-red-400 hover:text-red-300 uppercase tracking-wider">Delete</button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === cmt.id ? (
                    <div className="mt-2 flex gap-3 flex-col sm:flex-row">
                      <textarea
                        value={editContent} onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-gray-900 border border-yellow-600/50 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-yellow-500" rows={2}
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
            value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "상호 존중하는 댓글 문화를 만들어주세요." : "로그인 후 댓글을 작성할 수 있습니다."}
            disabled={!user}
            className="flex-1 bg-transparent text-white focus:outline-none resize-none h-16 text-sm placeholder-gray-600 disabled:opacity-50"
          />
          <button
            onClick={handleCommentSubmit} disabled={!user || !comment.trim()}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 px-8 py-2 font-black rounded transition-colors whitespace-nowrap"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}