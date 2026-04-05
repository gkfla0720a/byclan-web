import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { SkeletonLoader, EmptyState } from './UIStates';
import { filterVisibleTestData } from '@/app/utils/testData';

// 매치 현황 컴포넌트
function MatchStatus({ navigateTo }) {
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
        // 최신 게시글과 가입 신청을 가져옴
        const [postsResult, applicationsResult] = await Promise.all([
          filterVisibleTestData(supabase
            .from('posts')
            .select('title, created_at')
            .order('created_at', { ascending: false })
            .limit(3)),
          filterVisibleTestData(supabase
            .from('applications')
            .select('discord_name, status, created_at')
            .order('created_at', { ascending: false })
            .limit(3))
        ]);

        const activities = [
          ...(postsResult.data || []).map(post => ({
            type: '게시글',
            message: `${post.title} 게시글 작성`,
            time: new Date(post.created_at).toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            icon: '📝'
          })),
          ...(applicationsResult.data || []).map(app => ({
            type: '가입',
            message: `${app.discord_name || '익명'}님 가입 신청`,
            time: new Date(app.created_at).toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            icon: '👋'
          }))
        ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 3);

        setActivities(activities);
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
          activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
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
