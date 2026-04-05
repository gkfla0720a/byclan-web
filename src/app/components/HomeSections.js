import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { SkeletonLoader, EmptyState } from './UIStates';
import { filterVisibleTestData } from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';

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
function MatchStatus() {
  const navigateTo = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!isSupabaseConfigured) {
        setMatches([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await filterVisibleTestData(supabase
          .from('ladder_matches')
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

  const getStatusColor = (status) => {
    switch (status) {
      case '모집중': return 'bg-green-900/80 text-green-400';
      case '진행중': return 'bg-red-900/80 text-red-400';
      default: return 'bg-gray-900/80 text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case '모집중': return '🔥 모집 중';
      case '진행중': return '⚔️ 진행 중';
      default: return '대기 중';
    }
  };

  return (
    <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl cursor-pointer" onClick={() => navigateTo('대시보드')}>
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
                <span className="text-gray-300 font-medium">{match.match_type || '1v1'}</span>
              </div>
              <span className="text-gray-500 text-xs">{match.map_name || '맵 선택 중'}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// 클랜 활동 로그 컴포넌트
function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

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
            .select('id, title, created_at, profiles: user_id ( ByID, discord_name )')
            .order('created_at', { ascending: false })
            .limit(3)),
          filterVisibleTestData(supabase
            .from('admin_posts')
            .select('id, title, created_at, profiles: author_id ( ByID, discord_name )')
            .order('created_at', { ascending: false })
            .limit(2)),
          filterVisibleTestData(supabase
            .from('applications')
            .select('id, discord_name, btag, status, created_at')
            .order('created_at', { ascending: false })
            .limit(2)),
          filterVisibleTestData(supabase
            .from('ladder_matches')
            .select('id, match_type, status, created_at, map_name')
            .order('created_at', { ascending: false })
            .limit(2))
        ]);

        const nextActivities = [
          ...(postsResult.data || []).map(post => ({
            id: `post-${post.id}`,
            type: '게시글',
            message: `${post.profiles?.ByID || post.profiles?.discord_name || '클랜원'}님이 '${post.title}' 글을 남겼습니다.`,
            time: formatRelativeTime(post.created_at),
            createdAt: post.created_at,
            icon: '📝'
          })),
          ...(noticesResult.data || []).map(notice => ({
            id: `notice-${notice.id}`,
            type: '공지',
            message: `${notice.profiles?.ByID || notice.profiles?.discord_name || '운영진'}님이 '${notice.title}' 공지를 등록했습니다.`,
            time: formatRelativeTime(notice.created_at),
            createdAt: notice.created_at,
            icon: '📢'
          })),
          ...(applicationsResult.data || []).map(app => ({
            id: `application-${app.id}`,
            type: '가입',
            message: `${app.discord_name || app.btag || '신규 유저'}님이 가입 신청서를 제출했습니다.`,
            time: formatRelativeTime(app.created_at),
            createdAt: app.created_at,
            icon: '👋'
          })),
          ...(matchesResult.data || []).map(match => ({
            id: `match-${match.id}`,
            type: '래더',
            message: `${match.match_type || '1v1'} 매치가 ${match.status || '생성'} 상태로 등록되었습니다${match.map_name ? ` · ${match.map_name}` : ''}.`,
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
