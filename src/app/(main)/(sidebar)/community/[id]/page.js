'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
// 💡 추가된 부분: 로그인 정보와 권한 체커 가져오기
import { useAuthContext } from '@/app/context/AuthContext';
import { PermissionChecker } from '@/app/utils/permissions';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id; 

  // 💡 추가된 부분: 현재 로그인한 유저 정보 꺼내기
  const { user, profile } = useAuthContext();

  // --- 상태(State) 관리 ---
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 수정 기능용 상태 (상세 페이지에서는 글을 '수정'할 때 title과 content를 씁니다)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // 댓글 입력용 상태
  const [comment, setComment] = useState('');

  // --- 글 데이터 불러오기 ---
  useEffect(() => {
    const fetchPostDetail = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(by_id)')
        .eq('id', postId)
        .single(); 

      if (error) {
        console.error('글 불러오기 에러:', error);
      } else {
        setPost(data);
        setEditTitle(data.title);
        setEditContent(data.content);
        // 조회수 증가 (옵션)
        await supabase.rpc('increment_views', { row_id: postId });
      }
      setLoading(false);
    };

    if (postId) fetchPostDetail();
  }, [postId]);

  // --- 권한 확인 (렌더링 직전에 계산) ---
  // 내가 쓴 글인가? (또는 관리자인가?)
  const isAuthor = user?.id === post?.user_id;
  const isManager = PermissionChecker.hasPermission(profile?.role, 'community.manage') || ['developer', 'master', 'admin'].includes(profile?.role);
  const canEditOrDelete = isAuthor || isManager;


  // --- 기능 함수들 (에러 처리 포함) ---
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 글을 삭제하시겠습니까?')) return;

    // 💡 에러 처리 방어선
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error; // 에러가 나면 catch 블록으로 던집니다.
      
      alert('게시글이 삭제되었습니다.');
      router.push('/community'); // 삭제 후 목록으로 쫓아냄
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editTitle || !editContent) return alert('제목과 내용을 입력해주세요.');

    try {
      const { error } = await supabase
        .from('posts')
        .update({ title: editTitle, content: editContent })
        .eq('id', postId);
        
      if (error) throw error;

      alert('수정되었습니다.');
      // 화면 데이터도 즉시 업데이트
      setPost({ ...post, title: editTitle, content: editContent });
      setIsEditing(false); // 수정 모드 종료
    } catch (err) {
      alert('수정 중 오류가 발생했습니다: ' + err.message);
    }
  };


  // --- UI 렌더링 ---
  if (loading) return <div className="p-8 text-center text-white">글을 불러오는 중입니다...</div>;
  if (!post) return <div className="p-8 text-center text-red-400">글을 찾을 수 없거나 삭제되었습니다.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <button onClick={() => router.push('/community')} className="mb-6 text-gray-400 hover:text-yellow-400 font-bold transition-colors">
        ← 목록으로
      </button>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl mb-8">
        
        {/* 헤더 및 본문 영역 */}
        {isEditing ? (
          // 수정 모드일 때 보여줄 화면
          <div className="p-6 flex flex-col gap-4">
            <input 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
              className="w-full p-3 rounded bg-gray-900 text-white border border-yellow-500 focus:outline-none font-bold text-xl"
            />
            <textarea 
              value={editContent} 
              onChange={(e) => setEditContent(e.target.value)} 
              className="w-full p-3 rounded bg-gray-900 text-white border border-yellow-500 focus:outline-none min-h-[300px] resize-y"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-500">취소</button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-500">저장</button>
            </div>
          </div>
        ) : (
          // 일반 읽기 모드일 때 보여줄 화면
          <>
            <div className="p-6 border-b border-gray-700 bg-gray-800/50">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="font-bold text-yellow-500">{post.profiles?.by_id || '알 수 없음'}</span>
                <span>{new Date(post.created_at).toLocaleString()}</span>
                <span>조회 {post.views || 0}</span>
              </div>
            </div>
            
            {/* 💡 요청하신 대로 본문 배경을 더 어둡게(bg-gray-900/50) 처리했습니다 */}
            <div className="p-8 min-h-[300px] text-gray-200 whitespace-pre-wrap leading-relaxed bg-gray-900/50 text-lg">
              {post.content}
            </div>

            {/* 본인 또는 관리자에게만 보이는 수정/삭제 버튼 */}
            {canEditOrDelete && (
              <div className="p-4 border-t border-gray-700 flex justify-end gap-2 bg-gray-900/30">
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-700 text-gray-200 rounded font-bold hover:bg-gray-600 transition-colors">수정</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-900/50 text-red-400 rounded font-bold hover:bg-red-800/50 transition-colors">삭제</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 댓글 뼈대 */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">💬 댓글</h3>
        <div className="flex gap-3 mb-8">
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글을 남겨보세요!" 
            className="flex-1 p-3 rounded-lg bg-gray-900 text-white border border-gray-600 focus:border-yellow-500 resize-none h-20"
          />
          <button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 font-bold rounded-lg transition-colors">등록</button>
        </div>
      </div>
    </div>
  );
}