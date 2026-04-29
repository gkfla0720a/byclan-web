/**
 * 파일명: HomeSections.js
 *
 * 역할:
 *   홈 화면에 배치되는 두 가지 섹션 컴포넌트를 정의합니다.
 *   - MatchStatus: 현재 모집 중이거나 진행 중인 래더 매치 목록을 보여줍니다.
 *   - ActivityLog: 게시글·공지·가입신청·매치 등 최근 클랜 활동 내역을 통합해 보여줍니다.
 *
 * 주요 기능:
 *   - Supabase DB에서 ladder_matches, posts, admin_posts, applications 데이터를 불러옵니다.
 *   - 각 데이터를 "X분 전", "X시간 전", "X일 전" 형식의 상대적 시간으로 표시합니다.
 *   - 로딩 중엔 스켈레톤 UI, 데이터 없을 땐 빈 상태 UI를 표시합니다.
 *
 * 사용 방법:
 *   import { MatchStatus, ActivityLog } from './HomeSections';
 *   <MatchStatus />   // 매치 현황 섹션
 *   <ActivityLog />   // 최근 활동 로그 섹션
 */
'use client';
import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { SkeletonLoader, EmptyState } from './UIStates';
import { filterVisibleTestData } from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';

/**
 * 날짜 문자열을 현재 시각 기준 상대적 시간 문자열로 변환합니다.
 *
 * @param {string} dateString - ISO 형식 날짜 문자열 (예: "2024-04-01T12:00:00Z")
 * @returns {string} "3분 전", "2시간 전", "5일 전", 또는 "MM.DD" 형식 날짜
 *
 * @example
 *   formatRelativeTime("2024-04-01T12:00:00Z") // "3일 전"
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';

  const timestamp = new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));

  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return new Date(dateString).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  });
}

// 매치 현황 컴포넌트
/**
 * MatchStatus 컴포넌트
 *
 * 현재 "모집중" 또는 "진행중" 상태인 래더 매치 목록을 최대 3개 표시합니다.
 * 클릭 시 대시보드 페이지로 이동합니다.
 *
 * @returns {JSX.Element} 매치 현황 섹션 UI
 */
function MatchStatus() {
  /** 페이지 이동 훅 — navigateTo('BY래더) 처럼 사용합니다 */
  const navigateTo = useNavigate();
  /** DB에서 불러온 매치 배열 상태 */
  const [matches, setMatches] = useState([]);
  /** 데이터 로딩 여부 상태 (true: 로딩 중) */
  const [loading, setLoading] = useState(true);

  /** 컴포넌트 마운트 시 매치 데이터를 한 번 불러옵니다 */
  useEffect(() => {
    const fetchMatches = async () => {
      if (!isSupabaseConfigured) {
        setMatches([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await filterVisibleTestData(supabase
          .from('ladder_match_sets')
          .select('*')
          .in('status', ['모집중', '진행중'])
          .order('created_at', { ascending: false })
          .limit(3));

        if (error) throw error;
        setMatches(data || []);
      } catch (error) {
        console.error('매치 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  /**
   * 매치 상태값에 따라 배지 색상 클래스를 반환합니다.
   * @param {string} status - 매치 상태 ("모집중" | "진행중" | 기타)
   * @returns {string} Tailwind CSS 클래스 문자열
   */
  const getStatusColor = (status) => {
    switch (status) {
      case '모집중': return 'bg-green-900/80 text-green-400';
      case '진행중': return 'bg-red-900/80 text-red-400';
      default: return 'bg-gray-900/80 text-gray-400';
    }
  };

  /**
   * 매치 상태값에 따라 이모지가 포함된 표시 텍스트를 반환합니다.
   * @param {string} status - 매치 상태 ("모집중" | "진행중" | 기타)
   * @returns {string} 화면에 보여줄 상태 텍스트
   */
  const getStatusText = (status) => {
    switch (status) {
      case '모집중': return '🔥 모집 중';
      case '진행중': return '⚔️ 진행 중';
      default: return '대기 중';
    }
  };

  return (
    <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl cursor-pointer" onClick={() => navigateTo('BY래더')}>
      <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">⚔️ 매치 현황</h3>
      <div className="space-y-3">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : matches.length === 0 ? (
          <EmptyState message="현재 진행 중인 매치가 없습니다" icon="⚔️" />
        ) : (
          matches.map((match) => (
            <div key={match.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(match.status)}`}>
                  {getStatusText(match.status)}
                </span>
                <span className="text-gray-300 font-medium">{match.race_type || '매치'}</span>
              </div>
              <span className="text-gray-500 text-xs">세트 {match.set_number || 1} 진행 중</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// 클랜 활동 로그 컴포넌트
/**
 * ActivityLog 컴포넌트
 *
 * 게시글·공지·가입신청·래더 매치 등 여러 테이블의 최신 데이터를 합쳐
 * 시간순으로 정렬한 최근 활동 5건을 표시합니다.
 *
 * @returns {JSX.Element} 최근 활동 로그 섹션 UI
 */
function ActivityLog() {
  /** DB에서 조합한 활동 항목 배열 상태 */
  const [activities, setActivities] = useState([]);
  /** 데이터 로딩 여부 상태 */
  const [loading, setLoading] = useState(true);

  /**
   * 컴포넌트 마운트 시 posts·admin_posts·applications·ladder_matches
   * 4개 테이블을 병렬로 조회하여 활동 목록을 구성합니다.
   */
  // 각 테이블에서 최대 3~2건씩 최신 데이터를 불러와서 활동 항목으로 변환한 뒤,
  // 전체를 시간순으로 정렬하여 상위 5개만 화면에 보여줍니다.
  useEffect(() => {
    const fetchActivities = async () => {
      if (!isSupabaseConfigured) {
        setActivities([]);
        setLoading(false);
        return;
      }

      try {
        const [postsResult, noticesResult, applicationsResult, matchesResult] = await Promise.all([
          filterVisibleTestData(supabase
            .from('posts')
            .select('id, title, created_at, profiles!user_id(by_id)')
            .order('created_at', { ascending: false })
            .limit(3)),
          filterVisibleTestData(supabase
            .from('admin_posts')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(2)),
          filterVisibleTestData(supabase
            .from('applications')
            .select('id, btag, status, created_at')
            .order('created_at', { ascending: false })
            .limit(2)),
          filterVisibleTestData(supabase
            .from('ladder_match_sets')
            .select('id, match_id, race_type, status, created_at')
            .order('created_at', { ascending: false })
            .limit(2))
        ]);

        const nextActivities = [
          ...(postsResult.data || []).map(post => ({
            id: `post-${post.id}`,
            type: '게시글',
            message: `${post.profiles?.by_id || '클랜원'}님이 '${post.title}' 글을 남겼습니다.`,
            time: formatRelativeTime(post.created_at),
            createdAt: post.created_at,
            icon: '📝'
          })),
          ...(noticesResult.data || []).map(notice => ({
            id: `notice-${notice.id}`,
            type: '공지',
            message: `운영진님이 '${notice.title}' 공지를 등록했습니다.`,
            time: formatRelativeTime(notice.created_at),
            createdAt: notice.created_at,
            icon: '📢'
          })),
          ...(applicationsResult.data || []).map(app => ({
            id: `application-${app.id}`,
            type: '가입',
            message: `${app.btag || '신규 유저'}님이 가입 신청서를 제출했습니다.`,
            time: formatRelativeTime(app.created_at),
            createdAt: app.created_at,
            icon: '👋'
          })),
          ...(matchesResult.data || []).map(match => ({
            id: `match-${match.id}`,
            type: '래더',
            message: `${match.race_type || '매치'}가 ${match.status || '생성'} 상태로 등록되었습니다.`,
            time: formatRelativeTime(match.created_at),
            createdAt: match.created_at,
            icon: '⚔️'
          })),
        ]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setActivities(nextActivities);
      } catch (error) {
        console.error('활동 로그 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">📈 최근 활동</h3>
      <div className="space-y-3">
        {loading ? (
          <SkeletonLoader count={3} />
        ) : activities.length === 0 ? (
          <EmptyState message="최근 활동이 없습니다" icon="📈" />
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{activity.icon}</span>
                <div>
                  <div className="text-gray-300 text-sm">{activity.message}</div>
                  <div className="text-gray-500 text-xs">{activity.type}</div>
                </div>
              </div>
              <span className="text-gray-500 text-xs">{activity.time}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export { MatchStatus, ActivityLog };
