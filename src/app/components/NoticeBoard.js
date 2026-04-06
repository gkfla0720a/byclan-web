/**
 * 파일명: NoticeBoard.js
 *
 * 역할:
 *   클랜 공지사항 목록을 테이블 형태로 보여주는 페이지 컴포넌트입니다.
 *
 * 주요 기능:
 *   - Supabase의 admin_posts 테이블에서 공지 데이터를 불러옵니다.
 *   - profiles 테이블과 JOIN하여 작성자 정보를 함께 표시하며,
 *     FK 관계가 없을 경우 JOIN 없이 재시도하는 폴백(fallback) 로직이 있습니다.
 *   - 첫 번째 공지는 '필독', 나머지는 '공지' 분류 배지로 표시합니다.
 *   - 모바일에서는 작성자·날짜 컬럼을 숨기고 제목 셀 안에 인라인으로 표시합니다.
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
            .from('admin_posts')
            .select('id, title, content, created_at, profiles:author_id ( ByID, discord_name, role )')
            .order('created_at', { ascending: false })
        );

        if (error) {
          // Retry without the JOIN if the FK relationship isn't defined in the database
          if (isRelationshipError(error)) {
            const { data: fallbackData, error: fallbackError } = await filterVisibleTestData(
              supabase
                .from('admin_posts')
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
            author: notice.profiles?.ByID || notice.profiles?.discord_name || '운영진',
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

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-500">📢</span> 공지사항
        </h2>
      </div>
      
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
