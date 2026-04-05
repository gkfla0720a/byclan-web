'use client';

import React, { useState, useRef, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { useNavigate } from '../hooks/useNavigate';

function ByClanLogo() {
  const logoUrl = "https://raw.githubusercontent.com/gkfla0720a/First-Coding-Repository/main/ByLogo.png";
  return (
    <div className="flex items-center justify-center cursor-pointer group w-12 h-12 relative">
      <img src={logoUrl} alt="ByClan Logo" className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110" style={{ filter: "drop-shadow(0px 3px 2px rgba(0, 0, 0, 0.9)) drop-shadow(0px 0px 12px rgba(0, 0, 0, 0.6))" }} />
    </div>
  );
}

export default function Header() {
  const navigateTo = useNavigate();
  
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nickname, setNickname] = useState('');

  // 🛡️ 권한 체크 로직 (소문자 및 공백 완벽 제거)
  const currentRole = role?.toString().trim().toLowerCase();
  
  // 최고 개발자(developer)는 모든 관리자/정예 권한을 상속받습니다.
  const isDeveloper = currentRole === 'developer';
  const isDevOrHigher = ['developer', 'master', 'admin', 'elite'].includes(currentRole);
  const isAdminOrHigher = ['developer', 'master', 'admin'].includes(currentRole);

  useEffect(() => {
    const getUserData = async () => {
      if (!isSupabaseConfigured) {
        setUser(null);
        setRole(null);
        setNickname('');
        setUnreadCount(0);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, ByID, discord_name')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setRole(profile.role);
          setNickname(profile.ByID || profile.discord_name || user.user_metadata?.full_name || '유저');
        }

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        setUnreadCount(count || 0);
      }
    };
    getUserData();

    if (!isSupabaseConfigured) {
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) getUserData();
      else {
        setUser(null); setRole(null); setNickname(''); setUnreadCount(0);
      }
    });

    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null); setRole(null); setNickname('');
    window.location.reload();
  };

  const menuData = [
    { title: '클랜 소개', items: ['가입안내', '정회원 전환신청', '개요'] },
    { title: '클랜원', items: ['클랜원'] },
    { title: 'BY래더시스템', items: ['대시보드', '랭킹', '경기기록'] },
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

  return (
    <nav ref={navRef} className="relative z-50 border-b border-cyan-400/20 bg-slate-950/70 backdrop-blur-2xl shadow-[0_12px_40px_rgba(15,23,42,0.35)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* 로고 & 타이틀 */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav('Home')}>
          <ByClanLogo />
          {/* 👇 Footer와 완벽하게 동일한 황금빛 그라데이션 및 그림자 적용! */}
          <span 
            className="text-3xl sm:text-4xl font-black tracking-widest shrink-0 transition-all duration-300 group-hover:brightness-110"
            style={{
              background: "linear-gradient(155deg, #FFE8C6 0%, #B89C60 20%, #C8A266 40%, #45372A 50%, #5E462E 60%, #B89C60 80%, #2E241C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0px 1px 0px rgba(200, 162, 102, 0.6)) drop-shadow(0px 2px 1px rgba(0, 0, 0, 0.9))",
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
                  <span className="text-xs font-bold text-slate-100">{nickname}</span>
                  <button onClick={handleLogout} className="text-[10px] text-red-500 font-black ml-1">OUT</button>
                </div>
              </>
            ) : (
              <button onClick={() => {
                if (!isSupabaseConfigured) {
                  alert('Supabase 환경변수가 설정되지 않아 로그인 기능을 사용할 수 없습니다.');
                  return;
                }
                const redirectTo = `${window.location.origin}/auth/callback`;
                console.log('[Discord Login] redirectTo:', redirectTo);
                supabase.auth.signInWithOAuth({ 
                  provider: 'discord',
                  options: { redirectTo }
                });
              }} className="px-4 py-2 border border-cyan-300/35 rounded-full text-cyan-200 bg-slate-950/70 shadow-[0_0_18px_rgba(88,101,242,0.12)] font-bold text-sm">Discord Login</button>
            )}
          </li>
        </ul>

        {/* 모바일 햄버거 메뉴 */}
        <div className="md:hidden flex items-center gap-3">
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
                <span className="font-black text-cyan-200 text-sm">{nickname}</span>
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
        </div>
      )}
    </nav>
  );
}