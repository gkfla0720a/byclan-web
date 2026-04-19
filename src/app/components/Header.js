/**
 * =====================================================================
 * 파일명: src/app/components/Header.js
 * 역할  : 웹사이트 최상단에 표시되는 내비게이션 헤더 컴포넌트입니다.
 *         로고, 메뉴, 로그인/로그아웃, 알림 버튼을 포함합니다.
 *
 * ■ 주요 기능
 *   - ByClan 로고 및 클릭 시 홈으로 이동
 *   - 데스크톱: 드롭다운 메뉴 (클랜 소개, 클랜원, 래더, BSL 등)
 *   - 모바일: 햄버거 메뉴(☰)를 열면 아코디언 방식으로 펼쳐짐
 *   - 역할별 메뉴 표시 (가입 심사: 정예 이상, 관리자: admin 이상, 개발자: developer만)
 *   - Discord OAuth 로그인 버튼
 *   - 읽지 않은 알림 개수 표시 (빨간 뱃지)
 *   - 로그아웃 버튼
 *
 * ■ 역할별 표시되는 특수 메뉴
 *   가입 심사 버튼: developer, master, admin, elite 만 표시
 *   관리자 버튼:   developer, master, admin 만 표시
 *   개발자 버튼:   developer 만 표시
 *
 * ■ 상태 변수 설명
 *   openMenuIndex:       열려있는 드롭다운 메뉴 인덱스 (null이면 닫힘)
 *   isMobileMenuOpen:    모바일 햄버거 메뉴 열림 여부
 *   mobileAccordionIndex: 모바일에서 펼쳐진 서브메뉴 인덱스
 *   user:                로그인한 사용자 객체 (null이면 비로그인)
 *   role:                사용자 역할 문자열
 *   unreadCount:         읽지 않은 알림 수
 *   nickname:            표시할 닉네임 (by_id 필수, 없으면 오류)
 * =====================================================================
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { useNavigate } from '../hooks/useNavigate';
import { useAuthContext } from '../context/AuthContext';

/**
 * ByClanLogo()
 * - ByClan 클랜 로고 이미지를 표시하는 내부 컴포넌트입니다.
 * - public 폴더의 로고 이미지를 Next.js Image로 최적화하여 불러옵니다.
 * - 마우스 오버 시 살짝 확대되는 효과가 있습니다.
 */
function ByClanLogo() {
  return (
    <div className="flex items-center justify-center cursor-pointer group w-12 h-12 relative">
      <Image 
        src="/ByClanLogo_WebP.webp" 
        alt="ByClan Logo" 
        width={48} 
        height={48}
        priority={true} 
        unoptimized={true}
        className="object-contain transition-transform duration-300 group-hover:scale-110" 
        style={{ 
        // brightness는 1.05~1.1 정도로 아주 미세하게만 올리고, 
        // 그림자 농도를 0.9에서 0.5 정도로 낮추는 것이 핵심입니다.
        filter: "brightness(1.1) drop-shadow(0px 3px 2px rgba(0, 0, 0, 0.5)) drop-shadow(0px 0px 12px rgba(0, 0, 0, 0.3))" 
      }}
      />
    </div>
  );
}

/**
 * Header()
 * - 웹사이트 상단 내비게이션 바 컴포넌트입니다.
 * - 로그인 상태, 역할에 따라 다른 메뉴와 버튼을 표시합니다.
 *
 * 주요 내부 함수:
 *   getUserData()       - Supabase에서 현재 로그인 사용자 정보와 알림 수를 불러옴
 *   handleLogout()      - 로그아웃 처리 (세션 삭제, localStorage 초기화, 페이지 새로고침)
 *   handleNav(viewName) - 메뉴 클릭 시 페이지 이동 + 드롭다운 닫기
 *   handleClickOutside  - 메뉴 밖 클릭 시 드롭다운 자동 닫기
 */
export default function Header() {
  const navigateTo = useNavigate();
  // AuthContext에서 전역 인증 상태를 가져옵니다.
  // Header가 독립적인 auth 상태를 관리하지 않고 전역 상태를 공유하여 OAuth 리다이렉트 후에도 올바른 상태를 표시합니다.
  const { user, profile, authLoading, needsByIdSetup, authError, reloadProfile } = useAuthContext();
  
  // navRef: 헤더 <nav> 요소의 참조. 외부 클릭 감지에 사용됩니다.
  const navRef = useRef(null);
  // openMenuIndex: 데스크톱에서 현재 열려있는 드롭다운 메뉴의 인덱스 (null=모두 닫힘)
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  // isMobileMenuOpen: 모바일 햄버거 메뉴 열림 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // mobileAccordionIndex: 모바일에서 아코디언 방식으로 펼쳐진 서브메뉴 인덱스
  const [mobileAccordionIndex, setMobileAccordionIndex] = useState(null);
  // unreadCount: 읽지 않은 알림 개수 (헤더 뱃지에 표시)
  const [unreadCount, setUnreadCount] = useState(0);

  // profile에서 역할과 닉네임을 파생합니다.
  const role = profile?.role || null;
  // by_id 없을 때 표시할 에러 메시지 (데스크톱/모바일 공통으로 사용)
  const NO_BYID_MESSAGE = 'By닉네임이 없습니다. 재설정해주세요.';
  // by_id만 사용합니다. 없으면 null로 처리하며 폴백 닉네임을 사용하지 않습니다.
  const hasValidById = !!(profile?.by_id && profile.by_id.trim() !== '');
  const nickname = hasValidById ? profile.by_id : null;

  // 권한 체크: 역할 문자열을 소문자로 정규화하여 비교합니다
  // 🛡️ 권한 체크 로직 (소문자 및 공백 완벽 제거)
  const currentRole = role?.toString().trim().toLowerCase();
  
  // isDeveloper: 개발자 역할 여부 (개발자 전용 메뉴 표시에 사용)
  // 최고 개발자(developer)는 모든 관리자/정예 권한을 상속받습니다.
  const isDeveloper = currentRole === 'developer';
  // isDevOrHigher: 정예 이상 여부 (가입 심사 버튼 표시에 사용)
  const isDevOrHigher = ['developer', 'master', 'admin', 'elite'].includes(currentRole);
  // isAdminOrHigher: admin 이상 여부 (관리자 버튼 표시에 사용)
  const isAdminOrHigher = ['developer', 'master', 'admin'].includes(currentRole);

  // 읽지 않은 알림 수를 가져옵니다. user가 변경될 때(로그인/로그아웃)마다 다시 조회합니다.
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isSupabaseConfigured || !user) {
        setUnreadCount(0);
        return;
      }
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnreadCount();
  }, [user]);

  // 헤더 외부 클릭 시 드롭다운 메뉴를 닫습니다.
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // by_id가 없는 경우 즉시 프로필 설정 페이지로 이동하여 아이디를 등록하도록 유도합니다.
  // (자동 로그아웃은 useAuth.ts의 재확인 로직에서 처리합니다.)
  useEffect(() => {
    if (user && !authLoading && needsByIdSetup) {
      navigateTo('프로필');
    }
  }, [user, authLoading, needsByIdSetup, navigateTo]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // signOut 실패 시에도 로컬 상태를 초기화하고 페이지를 새로고침합니다.
      console.error('로그아웃 중 오류 발생:', error);
    }
    localStorage.clear();
    window.location.reload();
  };

  const handleLogin = () => {
    navigateTo('로그인');
    setIsMobileMenuOpen(false);
    setOpenMenuIndex(null);
  };

  const menuData = [
    { title: '클랜 소개', items: ['가입안내', '정회원 전환신청', '개요'] },
    { title: '클랜원', items: ['클랜원'] },
    { title: 'BY래더시스템', items: ['대시보드', '랭킹', '경기기록', '외부 레더 기록'] },
    { title: 'BSL', items: ['BSL 공지사항', 'BSL 경기일정 및 결과'] },
    { title: '토너먼트', items: ['토너먼트 공지', '진행중인 토너먼트'] },
    { title: '커뮤니티', items: ['공지사항', '자유게시판', '클랜원 소식'] },
    { title: '포인트', items: ['포인트 상점', '포인트 내역'] }
  ];

  const handleNav = (viewName) => {
    navigateTo(viewName);
    setOpenMenuIndex(null);
    setIsMobileMenuOpen(false);
  };

  // 로고 클릭 시 홈으로 이동하면서 프로필을 재조회합니다.
  // SPA 탐색이므로 페이지가 새로고침되지 않아 프로필 변동사항이 반영되지 않을 수 있기 때문입니다.
  const handleLogoClick = () => {
    handleNav('Home');
    if (user) {
      reloadProfile();
    }
  };

  return (
    <nav ref={navRef} className="relative z-50 border-b border-cyan-400/20 bg-slate-950/70 backdrop-blur-2xl shadow-[0_12px_40px_rgba(15,23,42,0.35)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* 로고 & 타이틀 */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogoClick}>
          <ByClanLogo />
            <span 
              className="text-3xl sm:text-4xl font-black tracking-widest shrink-0 transition-all duration-300 group-hover:brightness-110"
              style={{
                background: "linear-gradient(155deg, #FFE8C6 0%, #B89C60 20%, #C8A266 40%, #45372A 50%, #5E462E 60%, #B89C60 80%, #2E241C 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "brightness(1.3) drop-shadow(0px 1px 0px rgba(200, 162, 102, 0.6)) drop-shadow(0px 2px 1px rgba(0, 0, 0, 0.4))",
                textShadow: "0px 1px 1px rgba(200, 162, 102, 0.4), 0px 1px 0px rgba(0, 0, 0, 0.3)"
              }}
            >
              ByClan
            </span>
        </div>
        
        {/* 데스크톱 메뉴 */}
        <ul className="hidden md:flex flex-wrap gap-x-4 items-center justify-end w-full">
          {menuData.map((menu, index) => (
            <li key={index} className="relative">
              <button
                onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                className="rounded-full border border-cyan-400/15 bg-slate-900/55 px-4 py-2 text-sm font-semibold text-slate-200 transition-all hover:border-cyan-300/45 hover:bg-cyan-400/8 hover:text-cyan-100 hover:shadow-[0_0_18px_rgba(34,211,238,0.12)]"
              >
                {menu.title}
              </button>
              {openMenuIndex === index && (
                <div className="absolute top-full left-0 mt-4 w-52 rounded-2xl border border-cyan-400/20 bg-slate-950/94 shadow-[0_20px_50px_rgba(8,15,26,0.55)] flex flex-col z-50 overflow-hidden backdrop-blur-xl">
                  {menu.items.map((subItem, subIndex) => (
                    <span key={subIndex} onClick={() => handleNav(subItem)} className="px-4 py-3 text-sm text-slate-200 hover:bg-cyan-400/8 hover:text-cyan-200 cursor-pointer transition-colors border-b border-cyan-400/10 last:border-none">
                      {subItem}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}

          {/* 🛡️ 가입 심사 버튼 (개발자, 마스터, 어드민, 엘리트) */}
          {isDevOrHigher && (
            <li>
              <button onClick={() => handleNav('가입 심사')} className="text-emerald-300 hover:text-emerald-200 text-sm font-bold border border-emerald-400/25 px-3 py-2 rounded-full bg-emerald-950/20 shadow-[0_0_14px_rgba(16,185,129,0.12)] transition-all">
                ⚔️ 가입 심사
              </button>
            </li>
          )}

          {/* 👑 관리자 버튼 (개발자, 마스터, 어드민) */}
          {isAdminOrHigher && (
            <li>
              <button onClick={() => handleNav('관리자')} className="text-rose-300 hover:text-rose-200 text-sm font-bold border border-rose-400/25 px-3 py-2 rounded-full bg-rose-950/20 shadow-[0_0_14px_rgba(244,63,94,0.12)] transition-all">
                👑 관리자
              </button>
            </li>
          )}

          {/* 🛠️ 개발자 전용 버튼 (오직 개발자만!) */}
          {isDeveloper && (
            <li>
              <button onClick={() => handleNav('개발자')} className="text-cyan-200 hover:text-white text-sm font-bold border border-cyan-300/35 px-3 py-2 rounded-full bg-cyan-950/25 shadow-[0_0_18px_rgba(34,211,238,0.15)] transition-all">
                🛠️ 개발자
              </button>
            </li>
          )}
          
          <li className="ml-2 flex items-center gap-3">
            {user ? (
              <>
                <button onClick={() => handleNav('알림')} className="relative p-1 text-slate-300 hover:text-cyan-200 transition-all">
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </button>
                <button onClick={() => handleNav('프로필')} className="p-1 text-slate-300 hover:text-cyan-200 transition-all"><span className="text-lg">👤</span></button>
                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-cyan-400/15 shadow-[0_0_18px_rgba(34,211,238,0.08)]">
                  {nickname ? (
                    <span className="text-xs font-bold text-slate-100">{nickname}</span>
                  ) : (
                    <span className="text-xs text-slate-400 max-w-[180px] truncate" title={NO_BYID_MESSAGE}>
                      {authError || NO_BYID_MESSAGE}
                    </span>
                  )}
                  <button onClick={handleLogout} className="text-[10px] text-red-500 font-black ml-1">OUT</button>
                </div>
              </>
            ) : (
              <button onClick={handleLogin} className="px-4 py-2 border border-cyan-300/35 rounded-full text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(34,211,238,0.16)] font-bold text-sm">로그인</button>
            )}
          </li>
        </ul>

        {/* 모바일 햄버거 메뉴 */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <>
              <button onClick={() => handleNav('알림')} aria-label="알림" className="relative p-2 text-slate-300 hover:text-cyan-200 transition-all border border-cyan-400/15 rounded-xl bg-slate-950/60">
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </button>
              <button onClick={() => handleNav('프로필')} aria-label="프로필" className="p-2 text-slate-300 hover:text-cyan-200 transition-all border border-cyan-400/15 rounded-xl bg-slate-950/60">
                <span className="text-lg">👤</span>
              </button>
            </>
          ) : (
            <button onClick={handleLogin} className="px-3 py-2 border border-cyan-300/35 rounded-xl text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(34,211,238,0.16)] font-bold text-xs whitespace-nowrap">
              로그인
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-200 hover:text-cyan-200 p-2 text-xl border border-cyan-400/15 rounded-xl bg-slate-950/60">
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* 모바일 전용 오버레이 */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-950/95 backdrop-blur-2xl border-b border-cyan-400/15 z-50 flex flex-col max-h-[85vh] overflow-y-auto animate-fade-in-down shadow-[0_24px_60px_rgba(8,15,26,0.55)]">
          {user && (
            <div className="px-6 py-5 border-b border-cyan-400/10 bg-slate-900/35 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                {nickname ? (
                  <span className="font-black text-cyan-200 text-sm">{nickname}</span>
                ) : (
                  <span className="text-slate-400 text-xs">{authError || NO_BYID_MESSAGE}</span>
                )}
                <button onClick={handleLogout} className="text-[10px] text-red-300 font-black bg-red-950/30 px-3 py-2 rounded-lg border border-red-400/20">LOGOUT</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleNav('알림')} className="flex-1 bg-slate-950/70 p-3 rounded-xl border border-cyan-400/10 text-xs font-bold text-slate-200 flex justify-center items-center gap-2">
                  <span>🔔 알림</span>
                  {unreadCount > 0 && <span className="bg-red-600 text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </button>
                <button onClick={() => handleNav('프로필')} className="flex-1 bg-slate-950/70 p-3 rounded-xl border border-cyan-400/10 text-slate-200 font-bold text-xs flex justify-center items-center gap-2">
                  <span>👤 프로필</span>
                </button>
              </div>
            </div>
          )}
          
          {menuData.map((menu, index) => (
            <div key={index} className="flex flex-col border-b border-cyan-400/10">
              <button onClick={() => setMobileAccordionIndex(mobileAccordionIndex === index ? null : index)} className="px-6 py-4 flex justify-between items-center text-slate-100 font-black text-sm">
                {menu.title}
                <span className="text-[10px] text-cyan-300">{mobileAccordionIndex === index ? '▲' : '▼'}</span>
              </button>
              {mobileAccordionIndex === index && (
                <div className="flex flex-col bg-cyan-400/4 py-2">
                  {menu.items.map((sub, i) => (
                    <span key={i} onClick={() => handleNav(sub)} className="px-10 py-3.5 text-xs text-slate-300 font-bold hover:text-cyan-200">{sub}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 모바일 가입 심사 */}
          {isDevOrHigher && (
            <button onClick={() => handleNav('가입 심사')} className="px-6 py-5 text-left text-emerald-300 font-black text-sm border-b border-cyan-400/10 bg-emerald-950/5 transition-all">⚔️ 가입 심사 관리</button>
          )}
          
          {/* 모바일 관리자 */}
          {isAdminOrHigher && (
            <button onClick={() => handleNav('관리자')} className="px-6 py-5 text-left text-rose-300 font-black text-sm border-b border-cyan-400/10 bg-red-950/5 transition-all">👑 관리자 모드</button>
          )}

          {/* 모바일 개발자 (오직 개발자만!) */}
          {isDeveloper && (
            <button onClick={() => handleNav('개발자')} className="px-6 py-5 text-left text-cyan-200 font-black text-sm border-b border-cyan-400/10 bg-cyan-950/10 transition-all underline decoration-cyan-400/40 underline-offset-8">🛠️ 시스템 개발자 콘솔</button>
          )}

          {/* 비로그인 시 로그인 버튼 */}
          {!user && (
            <div className="px-6 py-5 border-t border-cyan-400/10 bg-slate-900/35">
              <button onClick={handleLogin} className="w-full py-3 border border-cyan-300/35 rounded-xl text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(34,211,238,0.16)] font-bold text-sm">
                로그인
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
