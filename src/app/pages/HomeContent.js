'use client';

import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { SkeletonLoader, ErrorMessage, EmptyState } from '../components/UIStates';
import { MatchStatus, ActivityLog } from '../components/HomeSections';
import { filterVisibleTestData, isMarkedTestData } from '@/app/utils/testData';

function HomeContent({ navigateTo }) {
  const [topRankers, setTopRankers] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!isSupabaseConfigured) {
        setTopRankers([]);
        setRecentNotices([
          { id: 1, type: '안내', title: 'Supabase 환경변수가 설정되지 않았습니다.', date: 'ENV' },
          { id: 2, type: '안내', title: '데이터 연결 후 최신 소식이 표시됩니다.', date: 'ENV' }
        ]);
        return;
      }

      const { data: rankData } = await filterVisibleTestData(supabase
        .from('ladders')
        .select('*')
        .order('rank', { ascending: true })
        .limit(3));

      const { data: noticeData } = await filterVisibleTestData(supabase
        .from('admin_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3));

      const notices = (noticeData || []).map((n, index) => ({
        id: n.id || `notice-${index}`,
        type: index === 0 ? '필독' : '공지',
        title: n.title,
        date: new Date(n.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
      }));

      if (rankData) setTopRankers(rankData);
      setRecentNotices(notices);
    } catch {
      setRecentNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="w-full space-y-5 animate-fade-in-down">
      {/* 히어로 배너 */}
      <section className="relative rounded-3xl overflow-hidden border border-cyan-300/20 bg-slate-950/40 h-56 sm:h-72 flex flex-col items-center justify-center text-center scanline shadow-[0_20px_60px_rgba(8,15,26,0.32)] backdrop-blur-sm">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/5 via-slate-950/35 to-slate-950/75" />
        {/* 사이버 그리드 오버레이 */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(0,212,255,0.04) 1px,transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="relative z-10 px-4">
          <p className="text-cyan-300 text-xs tracking-[0.3em] uppercase mb-2 font-bold animate-flicker">
            StarCraft Clan Network
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Welcome to{' '}
            <span
              className="italic"
              style={{
                background: 'linear-gradient(155deg,#FFE8C6 0%,#B89C60 20%,#C8A266 40%,#45372A 50%,#5E462E 60%,#B89C60 80%,#2E241C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ByClan
            </span>
          </h2>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigateTo('가입안내')}
              className="px-5 py-2 rounded-lg font-bold text-sm btn-neon"
            >
              클랜 소개 보기
            </button>
            <button
              onClick={() => navigateTo('대시보드')}
              className="px-5 py-2 rounded-lg font-bold text-sm bg-cyan-400/10 border border-cyan-300/30 text-cyan-200 hover:bg-cyan-400/18 transition-all shadow-[0_0_18px_rgba(34,211,238,0.08)]"
            >
              ⚔️ 래더 시스템
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: '클랜 성향',
            icon: '🌐',
            desc: 'ByClan은 스타크래프트 빠른무한 유저가 꾸준히 접속해 경쟁하고 교류하는 레더 중심 클랜입니다.'
          },
          {
            title: '관전 재미',
            icon: '⚡',
            desc: '경기 구경, 최근 변화가 큰 플레이어 체크, 포인트 베팅까지 방문자도 분위기를 빠르게 파악할 수 있습니다.'
          },
          {
            title: '가입 동선',
            icon: '📝',
            desc: '로그인 없이 개요와 가입 절차를 먼저 보고, 필요할 때만 회원가입·가입신청으로 이어지도록 구성했습니다.'
          },
        ].map((item) => (
          <div key={item.title} className="neon-panel p-5 rounded-2xl">
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-cyan-300 font-bold text-sm mb-2">{item.title}</h3>
            <p className="text-xs text-slate-300/85 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* 랭킹 + 소식 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section
          className="neon-panel p-5 rounded-2xl cursor-pointer"
          onClick={() => navigateTo('랭킹')}
        >
          <h3 className="text-base font-bold text-cyan-300 mb-3 border-b border-cyan-400/10 pb-2 flex items-center gap-2">
            🏆 <span>명예의 전당</span>
          </h3>
          <div className="space-y-2">
            {loading ? <SkeletonLoader count={3} /> :
             topRankers.length === 0 ? <EmptyState message="아직 랭킹 데이터가 없습니다" icon="🏆" /> :
             topRankers.map((p, index) => (
               <div key={`${p.rank ?? 'no-rank'}-${p.name ?? p.ByID ?? p.discord_name ?? index}`} className="flex items-center justify-between bg-slate-950/55 px-3 py-2 rounded-lg border border-cyan-400/10">
                 <span className="text-slate-100 font-semibold text-sm">
                   <span className="text-yellow-500 mr-1">{p.rank}위</span> {p.name}
                   {isMarkedTestData(p) && <span className="ml-2 text-[10px] text-amber-300">TEST</span>}
                 </span>
                 <span className="font-bold text-cyan-400 text-sm">MMR {p.points}점</span>
               </div>
             ))
            }
          </div>
        </section>

        <section
          className="neon-panel p-5 rounded-2xl cursor-pointer"
          onClick={() => navigateTo('공지사항')}
        >
          <h3 className="text-base font-bold text-cyan-300 mb-3 border-b border-cyan-400/10 pb-2 flex items-center gap-2">
            📢 <span>최신 소식</span>
          </h3>
          <div className="space-y-2">
            {loading ? <SkeletonLoader count={3} /> :
             recentNotices.length === 0 ? <EmptyState message="새로운 소식이 없습니다" icon="📢" /> :
             recentNotices.map((n, index) => (
               <div key={`${n.id ?? 'notice'}-${n.type ?? 'type'}-${n.title ?? 'title'}-${index}`} className="flex items-center justify-between text-sm py-1 border-b border-cyan-400/8 last:border-none">
                 <span className="text-slate-200 truncate">{n.title}</span>
                 <span className="text-slate-400 text-xs ml-2 shrink-0">{n.date}</span>
               </div>
             ))
            }
          </div>
        </section>
      </div>

      {/* 매치 상태 + 활동 로그 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MatchStatus navigateTo={navigateTo} />
        <ActivityLog />
      </div>

      {/* 빠른 접근 */}
      <div className="neon-panel p-5 rounded-2xl">
        <h3 className="text-base font-bold text-cyan-300 mb-4 border-b border-cyan-400/10 pb-2">🚀 빠른 접근</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '📖', label: '가입 안내', view: '가입안내' },
            { icon: '⚔️', label: '매치 참여', view: '대시보드' },
            { icon: '💬', label: '커뮤니티', view: '자유게시판' },
            { icon: '🏆', label: '랭킹 보기', view: '랭킹' },
          ].map(({ icon, label, view }) => (
            <button
              key={view}
              onClick={() => navigateTo(view)}
              className="p-3 rounded-lg text-sm font-bold text-slate-200 border border-cyan-400/10 bg-slate-950/45 hover:border-cyan-300/40 hover:text-cyan-200 transition-all"
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeContent;
