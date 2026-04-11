/**
 * 파일명: HomeContent.js
 *
 * 역할:
 *   사이트 메인 홈 화면의 전체 콘텐츠를 구성하는 페이지 컴포넌트입니다.
 *
 * 주요 기능:
 *   - 히어로 배너: 배경 이미지와 사이버 그리드 오버레이로 꾸민 환영 섹션
 *   - 모바일 전용 프로필 카드: 로그인한 활성 클랜원에게만 히어로 배너 아래 표시
 *   - 클랜 소개 카드: 클랜 성향·관전 재미·가입 동선을 3열로 소개
 *   - 랭킹 미리보기: clan_point 기준 상위 3인 표시 (클릭 시 랭킹 페이지 이동)
 *   - 최신 소식: 최근 공지사항 3건 미리보기 (클릭 시 공지 페이지 이동)
 *   - 매치 현황·활동 로그: HomeSections의 MatchStatus, ActivityLog 컴포넌트 사용
 *   - 빠른 접근 버튼: 가입안내·매치·커뮤니티·랭킹 4가지 바로가기
 *
 * 사용 방법:
 *   import HomeContent from './HomeContent';
 *   <HomeContent profile={profile} user={user} />
 */
'use client';

import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { SkeletonLoader, ErrorMessage, EmptyState } from '../components/UIStates';
import { MatchStatus, ActivityLog } from '../components/HomeSections';
import { filterVisibleTestData, isMarkedTestData } from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';

/** 티어별 텍스트 색상 클래스 매핑 */
const TIER_COLORS = {
  Challenger: 'text-rose-400',
  Bronze: 'text-orange-700',
  Silver: 'text-gray-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Master: 'text-purple-400',
};

/** 종족 영문 키를 한국어 레이블로 변환 */
const RACE_LABELS = {
  Terran: '테란',
  Protoss: '프로토스',
  Zerg: '저그',
  Random: '랜덤',
};

/** 종족 영문 키를 이모지 아이콘으로 변환 */
const RACE_ICONS = {
  Terran: '🔧',
  Protoss: '✨',
  Zerg: '🦠',
  Random: '🎮',
};

/** MMR 수치를 받아 티어 이름 반환 */
function getTier(mmr) {
  if (mmr >= 2400) return 'Challenger';
  if (mmr >= 2200) return 'Master';
  if (mmr >= 1900) return 'Diamond';
  if (mmr >= 1600) return 'Platinum';
  if (mmr >= 1350) return 'Gold';
  if (mmr >= 1100) return 'Silver';
  return 'Bronze';
}

/** 승률 문자열 반환, 전적 없으면 '-' */
function getWinRate(wins, losses) {
  const total = (wins || 0) + (losses || 0);
  if (total === 0) return '-';
  return `${Math.round(((wins || 0) / total) * 100)}%`;
}

/**
 * 모바일 전용 프로필 카드 컴포넌트 (lg 이상에서는 숨김)
 * 로그인한 활성 클랜원에게 히어로 배너 아래에 표시됩니다.
 */
function MobileProfileCard({ profile, user, navigateTo }) {
  const isActiveMember =
    profile && ['member', 'elite', 'admin', 'master', 'developer', 'rookie'].includes(profile.role);

  if (!user || !isActiveMember) return null;

  const tier = getTier(profile.clan_point || 1000);
  const tierColor = TIER_COLORS[tier] || 'text-gray-400';
  const winRate = getWinRate(profile.wins, profile.losses);
  const race = RACE_LABELS[profile.race] || profile.race || '—';
  const raceIcon = RACE_ICONS[profile.race] || '🎮';

  return (
    <div
      className="lg:hidden neon-panel rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
      onClick={() => navigateTo('프로필')}
    >
      {/* 아바타 */}
      <div className="w-12 h-12 rounded-full bg-cyan-900/30 border border-cyan-700/30 flex items-center justify-center text-xl shrink-0">
        {raceIcon}
      </div>
      {/* 닉네임 + 티어 */}
      <div className="flex flex-col min-w-0">
        <span className="font-black text-sm text-cyan-400 truncate" style={{ textShadow: '0 0 8px rgba(0,212,255,0.4)' }}>
          {profile.by_id || 'By_????'}
        </span>
        <span className={`text-xs font-bold ${tierColor}`}>{tier}</span>
      </div>
      {/* 스탯 */}
      <div className="ml-auto flex gap-4 text-xs text-right shrink-0">
        <div>
          <div className="text-gray-500">MMR</div>
          <div className="font-black text-yellow-400">{profile.clan_point ?? 1000}</div>
        </div>
        <div>
          <div className="text-gray-500">승률</div>
          <div className="font-semibold text-gray-300">{winRate}</div>
        </div>
        <div>
          <div className="text-gray-500">전적</div>
          <div className="text-gray-300">
            <span className="text-green-400">{profile.wins ?? 0}W</span>{' '}
            <span className="text-red-400">{profile.losses ?? 0}L</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HomeContent 컴포넌트
 *
 * 홈 화면 전체 레이아웃을 렌더링합니다.
 * Supabase에서 상위 랭커와 최신 공지를 불러와 표시합니다.
 *
 * @param {{ profile: object|null, user: object|null }} props
 * @returns {JSX.Element} 홈 화면 전체 UI
 */
function HomeContent({ profile = null, user = null }) {
  /** 페이지 이동 훅 */
  const navigateTo = useNavigate();
  /** 래더 포인트 기준 상위 3인 랭커 배열 */
  const [topRankers, setTopRankers] = useState([]);
  /** 최신 공지사항 최대 3건 배열 */
  const [recentNotices, setRecentNotices] = useState([]);
  /** 데이터 로딩 여부 */
  const [loading, setLoading] = useState(true);

  /**
   * profiles 테이블에서 상위 랭커 3인과
   * admin_posts 테이블에서 최신 공지 3건을 병렬로 불러옵니다.
   * Supabase가 설정되지 않은 경우 안내 메시지용 더미 공지를 반환합니다.
   */
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
        .from('profiles')
        .select('id, by_id, clan_point')
        .neq('role', 'visitor')
        .neq('role', 'applicant')
        .neq('role', 'expelled')
        .order('clan_point', { ascending: false })
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

  /** 컴포넌트 마운트 시 fetchData를 한 번 실행합니다 */
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

      {/* 모바일 전용 프로필 카드 (데스크톱에서는 사이드바로 표시) */}
      <MobileProfileCard profile={profile} user={user} navigateTo={navigateTo} />

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
               <div key={`${p.id ?? index}`} className="flex items-center justify-between bg-slate-950/55 px-3 py-2 rounded-lg border border-cyan-400/10">
                 <span className="text-slate-100 font-semibold text-sm">
                   <span className="text-yellow-500 mr-1">{index + 1}위</span> {p.by_id || '[by_id 없음]'}
                   {isMarkedTestData(p) && <span className="ml-2 text-[10px] text-amber-300">TEST</span>}
                 </span>
                 <span className="font-bold text-cyan-400 text-sm">MMR {p.clan_point}점</span>
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
        <MatchStatus />
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
