/**
 * 파일명: NoticeBoard.js
 *
 * 역할:
 *   클랜 공지사항 목록을 테이블 형태로 보여주는 페이지 컴포넌트입니다.
 *
 * 주요 기능:
 *   - Supabase의 notice_posts 테이블에서 공지 데이터를 불러옵니다.
 *   - profiles 테이블과 JOIN하여 작성자 정보를 함께 표시하며,
 *     FK 관계가 없을 경우 JOIN 없이 재시도하는 폴백(fallback) 로직이 있습니다.
 *   - 첫 번째 공지는 '필독', 나머지는 '공지' 분류 배지로 표시합니다.
 *   - 모바일에서는 작성자·날짜 컬럼을 숨기고 제목 셀 안에 인라인으로 표시합니다.
 *   - admin 이상 등급은 공지사항을 작성할 수 있습니다 (announcement.post 권한 필요).
 *
 * 사용 방법:
 *   import NoticeBoard from './NoticeBoard';
 *   <NoticeBoard />
 */
'use client';

import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { EmptyState, SkeletonLoader } from './UIStates';
import { filterVisibleTestData } from '@/app/utils/testData';
import { isRelationshipError } from '@/app/utils/retry';
import { PermissionChecker } from '@/app/utils/permissions';
import { useAuthContext } from '@/app/context/AuthContext';

/**
 * NoticeBoard 컴포넌트
 *
 * admin_posts 테이블의 공지사항을 불러와 테이블 UI로 렌더링합니다.
 * 로딩 중에는 스켈레톤, 데이터 없을 때는 빈 상태 메시지를 보여줍니다.
 *
 * @returns {JSX.Element} 공지사항 테이블 UI
 */
export default function NoticeBoard() {
  /** 공지사항 항목 배열 상태 */
  const [notices, setNotices] = useState([]);
  /** 데이터 로딩 여부 */
  const [loading, setLoading] = useState(true);
  /** 글쓰기 폼 표시 여부 */
  const [isWriting, setIsWriting] = useState(false);
  /** 새 공지 제목·내용 */
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  /** 공지 저장 요청 진행 중 여부 */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 현재 로그인 유저 프로필 (권한 확인용) */
  const { profile } = useAuthContext();
  /** 현재 유저가 공지사항 작성 권한을 가졌는지 (admin 이상) */
  const canPost = profile ? PermissionChecker.hasPermission(profile.role, 'announcement.post') : false;

  /** 컴포넌트 마운트 시 공지사항 데이터를 불러옵니다 */
  useEffect(() => {
    const loadNotices = async () => {
      if (!isSupabaseConfigured) {
        setNotices([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await filterVisibleTestData(
          supabase
            .from('notice_posts')
            .select('id, title, content, created_at, profiles:author_id ( ByID, role )')
            .order('created_at', { ascending: false })
        );

        if (error) {
          // Retry without the JOIN if the FK relationship isn't defined in the database
          if (isRelationshipError(error)) {
            const { data: fallbackData, error: fallbackError } = await filterVisibleTestData(
              supabase
                .from('notice_posts')
                .select('id, title, content, created_at')
                .order('created_at', { ascending: false })
            );

            if (fallbackError) throw fallbackError;

            setNotices(
              (fallbackData || []).map((notice, index) => ({
                id: notice.id || `notice-${index}`,
                type: index === 0 ? '필독' : '공지',
                title: notice.title,
                author: '운영진',
                date: notice.created_at
                  ? new Date(notice.created_at).toLocaleDateString('ko-KR')
                  : '-',
              }))
            );
            return;
          }

          throw error;
        }

        setNotices(
          (data || []).map((notice, index) => ({
            id: notice.id || `notice-${index}`,
            type: index === 0 ? '필독' : '공지',
            title: notice.title,
            author: notice.profiles?.ByID || '[ByID 없음]',
            date: notice.created_at
              ? new Date(notice.created_at).toLocaleDateString('ko-KR')
              : '-',
          }))
        );
      } catch (error) {
        console.error('공지사항 로딩 실패:', error);
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotices();
  }, []);

  /**
   * 새 공지사항을 notice_posts 테이블에 저장합니다.
   * announcement.post 권한(admin 이상)이 없으면 저장하지 않습니다.
   */
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    if (!canPost) {
      alert('공지사항 작성 권한이 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error('로그인이 필요합니다.');
      const { error } = await supabase
        .from('notice_posts')
        .insert({ title: newPost.title, content: newPost.content, author_id: user.id });

      if (error) throw error;

      alert('공지사항이 등록되었습니다.');
      setNewPost({ title: '', content: '' });
      setIsWriting(false);
      // 목록 새로고침
      const { data } = await filterVisibleTestData(
        supabase
          .from('notice_posts')
          .select('id, title, content, created_at, profiles:author_id ( ByID, role )')
          .order('created_at', { ascending: false })
      );
      setNotices(
        (data || []).map((notice, index) => ({
          id: notice.id || `notice-${index}`,
          type: index === 0 ? '필독' : '공지',
          title: notice.title,
          author: notice.profiles?.ByID || '[ByID 없음]',
          date: notice.created_at
            ? new Date(notice.created_at).toLocaleDateString('ko-KR')
            : '-',
        }))
      );
    } catch (error) {
      alert('공지사항 등록 실패: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-500">📢</span> 공지사항
        </h2>
        {canPost && (
          <button
            onClick={() => setIsWriting(!isWriting)}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform hover:scale-105"
          >
            {isWriting ? '취소하기 ❌' : '공지 작성 ✍️'}
          </button>
        )}
      </div>

      {isWriting && (
        <div className="bg-gray-800 p-6 mb-6 rounded-xl border border-yellow-700 shadow-xl animate-fade-in-down">
          <h3 className="text-lg font-bold text-yellow-300 mb-4">새 공지사항 작성</h3>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <input
              type="text"
              name="title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="공지 제목을 입력하세요"
              required
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 focus:border-yellow-500 focus:outline-none text-white font-semibold"
            />
            <textarea
              name="content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="공지 내용을 입력하세요"
              required
              rows="6"
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 focus:border-yellow-500 focus:outline-none text-white text-sm leading-relaxed"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '공지 등록'}
              </button>
              <button
                type="button"
                onClick={() => setIsWriting(false)}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader count={5} />
          </div>
        ) : notices.length === 0 ? (
          <div className="p-6">
            <EmptyState message="등록된 공지사항이 없습니다" icon="📢" />
          </div>
        ) : (
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
              {notices.map((notice, index) => (
                <tr key={`${notice.id}-${index}`} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer group">
                  <td className="py-4 px-4 text-center hidden sm:table-cell">
                    <span className={`text-[11px] px-2 py-1 rounded font-bold ${
                      notice.type === '필독' ? 'bg-red-900/60 text-red-400' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {notice.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="sm:hidden text-[10px] text-gray-400">[{notice.type}]</span>
                      <span className="font-medium group-hover:text-yellow-400 transition-colors">{notice.title}</span>
                      <span className="sm:hidden text-xs text-gray-500">{notice.author} | {notice.date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-400 hidden md:table-cell">{notice.author}</td>
                  <td className="py-4 px-4 text-center text-gray-400 hidden sm:table-cell">{notice.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
