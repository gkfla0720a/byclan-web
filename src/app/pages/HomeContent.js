'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { SkeletonLoader, ErrorMessage, EmptyState } from '../components/UIStates';
import { MatchStatus, ActivityLog } from '../components/HomeSections';

function HomeContent({ navigateTo }) {
  const [topRankers, setTopRankers] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 랭킹 데이터 가져오기
      const { data: rankData, error: rankError } = await supabase
        .from('ladders')
        .select('*')
        .order('rank', { ascending: true })
        .limit(3);
      
      if (rankError) throw rankError;

      // 공지사항 데이터 가져오기
      const { data: noticeData, error: noticeError } = await supabase
        .from('admin_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (noticeError) throw noticeError;

      // 데이터가 없을 경우 기본값 설정
      const notices = noticeData && noticeData.length > 0 
        ? noticeData.map(notice => ({
            id: notice.id,
            type: '공지',
            title: notice.title,
            date: new Date(notice.created_at).toLocaleDateString('ko-KR', { 
              month: '2-digit', 
              day: '2-digit' 
            }).replace(/\./g, '.')
          }))
        : [
            { id: 1, type: '안내', title: '바이클랜에 오신 것을 환영합니다!', date: '04.04' },
            { id: 2, type: '공지', title: '클랜 활동이 활발하게 진행 중입니다', date: '04.04' }
          ];

      if (rankData) setTopRankers(rankData);
      setRecentNotices(notices);
      
    } catch (error) {
      console.error('홈 데이터 로딩 실패:', error);
      setError('데이터 로딩 중 오류가 발생했습니다.');
      
      // 에러 시 기본값 설정
      setRecentNotices([
        { id: 1, type: '안내', title: '바이클랜에 오신 것을 환영합니다!', date: '04.04' },
        { id: 2, type: '공지', title: '클랜 활동이 활발하게 진행 중입니다', date: '04.04' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in-down mt-4 sm:mt-8">
      <section className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl h-64 sm:h-80 flex flex-col items-center justify-center text-center">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-20"></div>
         <div className="relative z-10 px-4">
           <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Welcome to <span className="text-yellow-500">ByClan</span></h2>
           <button onClick={() => navigateTo('가입신청')} className="px-6 py-2.5 bg-yellow-500 text-gray-900 font-bold rounded-full shadow-lg">가입 신청하기</button>
         </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl cursor-pointer" onClick={() => navigateTo('랭킹')}>
          <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">🏆 명예의 전당</h3>
          <div className="space-y-3">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : topRankers.length === 0 ? (
              <EmptyState message="아직 랭킹 데이터가 없습니다" icon="🏆" />
            ) : (
              topRankers.map((p) => (
                <div key={p.rank} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                  <span className="text-gray-200 font-semibold">{p.rank}위 {p.name}</span>
                  <span className="font-bold text-sky-400">{p.points} P</span>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl cursor-pointer" onClick={() => navigateTo('공지사항')}>
          <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">📢 최신 소식</h3>
          <div className="space-y-3">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : recentNotices.length === 0 ? (
              <EmptyState message="새로운 소식이 없습니다" icon="📢" />
            ) : (
              recentNotices.map((n) => (
                <div key={n.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 truncate">{n.title}</span>
                  <span className="text-gray-500 text-xs ml-2">{n.date}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 새로운 섹션들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MatchStatus navigateTo={navigateTo} />
        <ActivityLog />
      </div>

      {/* 빠른 접근 버튼 */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">🚀 빠른 접근</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => navigateTo('가입신청')}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            📝 가입 신청
          </button>
          <button 
            onClick={() => navigateTo('대시보드')}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            ⚔️ 매치 참여
          </button>
          <button 
            onClick={() => navigateTo('자유게시판')}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            💬 커뮤니티
          </button>
          <button 
            onClick={() => navigateTo('랭킹')}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            🏆 랭킹 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeContent;
