'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function ByClanLogo() {
  const logoUrl = "https://raw.githubusercontent.com/gkfla0720a/First-Coding-Repository/main/ByLogo.png";
  return (
    <div className="flex items-center justify-center cursor-pointer group w-12 h-12 relative">
      <img src={logoUrl} alt="ByClan Logo" className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110" style={{ filter: "drop-shadow(0px 3px 2px rgba(0, 0, 0, 0.9)) drop-shadow(0px 0px 12px rgba(0, 0, 0, 0.6))" }} />
    </div>
  );
}

export default function Header({ navigateTo }) {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordionIndex, setMobileAccordionIndex] = useState(null);
  const menuRefs = useRef([]); 
  const navRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  
  // ✨ 새로 추가된 상태 (알림 개수 & 커스텀 닉네임)
  const [unreadCount, setUnreadCount] = useState(0);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // 프로필 정보 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, ByID, discord_name')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setRole(profile.role);
          // By_ 닉네임이 있으면 1순위, 없으면 디스코드 이름, 다 없으면 user_metadata 풀네임
          setNickname(profile.ByID || profile.discord_name || user.user_metadata?.full_name || '유저');
        }

        // 알림 개수 가져오기
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        setUnreadCount(count || 0);
      }
    };
    getUserData();

    // 로그인/아웃 실시간 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getUserData();
      } else {
        setUser(null);
        setRole(null);
        setNickname('');
        setUnreadCount(0);
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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'discord',
      options: {
        queryParams: {
          prompt: 'consent', // 무조건 동의/계정 선택 화면 강제
        },
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setNickname('');
    window.location.reload();
  };

  const menuData = [
    { title: '클랜 소개', items: ['가입안내', '가입신청', '정회원 전환신청', '개요'] },
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
    <nav ref={navRef} className="bg-gray-950 border-b border-gray-800 relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav('Home')}>
          <ByClanLogo />
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest shrink-0 transition-all duration-300 group-hover:brightness-110" style={{ background: "linear-gradient(155deg, #FFE8C6 0%, #B89C60 20%, #C8A266 40%, #45372A 50%, #5E462E 60%, #B89C60 80%, #2E241C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0px 1px 0px rgba(200, 162, 102, 0.6)) drop-shadow(0px 2px 1px rgba(0, 0, 0, 0.9))", textShadow: "0px 1px 1px rgba(200, 162, 102, 0.4), 0px 1px 0px rgba(0, 0, 0, 0.3)" }}>
            ByClan
          </h1>
        </div>
        
        <ul className="hidden md:flex flex-wrap gap-x-6 items-center justify-end w-full">
          {menuData.map((menu, index) => (
            <li key={index} className="relative" ref={(el) => menuRefs.current[index] = el}>
              <button onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)} className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105 text-sm font-semibold">
                {menu.title}
              </button>
              {openMenuIndex === index && (
                <div className="absolute top-full left-0 mt-4 w-48 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
                  {menu.items.map((subItem, subIndex) => (
                    <span key={subIndex} onClick={() => handleNav(subItem)} className="px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-yellow-500 cursor-pointer transition-colors border-b border-gray-800 last:border-none">
                      {subItem}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}

          {/* 가입 심사 메뉴 (엘리트, 운영진, 마스터 전용) */}
          {['master', 'admin', 'elite'].includes(role) && (
            <li>
              <button onClick={() => handleNav('가입 심사')} className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 text-sm font-bold border border-emerald-900/50 px-2 py-1 rounded bg-emerald-950/20">
                ⚔️ 가입 심사
              </button>
            </li>
          )}

          {/* 관리자 전용 버튼 (데스크톱) */}
          {['master', 'admin'].includes(role) && (
            <li>
              <button onClick={() => handleNav('관리자')} className="text-red-400 hover:text-red-300 transition-colors duration-200 hover:scale-105 text-sm font-bold border border-red-900/50 px-2 py-1 rounded bg-red-950/20">
                👑 관리자
              </button>
            </li>
          )}
          
          <li className="ml-2 flex items-center gap-3">
            {user ? (
              <>
                {/* ✨ 알림 종 아이콘 추가 */}
                <button onClick={() => handleNav('알림')} className="relative p-1 text-gray-400 hover:text-yellow-400 transition-colors hover:scale-110">
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-gray-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* ✨ 내 프로필 설정 아이콘 추가 */}
                <button onClick={() => handleNav('프로필')} className="p-1 text-gray-400 hover:text-yellow-400 transition-colors hover:scale-110" title="프로필 설정">
                  <span className="text-lg">👤</span>
                </button>

                {/* 유저 닉네임 및 아바타 */}
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700">
                  <img src={user.user_metadata?.avatar_url} className="w-5 h-5 rounded-full" alt="avatar" />
                  <span className="text-xs font-bold text-gray-200">{nickname}</span>
                  <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 ml-1 font-bold">Out</button>
                </div>
              </>
            ) : (
              <button onClick={handleLogin} className="px-4 py-1.5 border border-[#5865F2] rounded text-[#5865F2] font-bold text-sm hover:bg-[#5865F2] hover:text-white transition-colors">
                Discord Login
              </button>
            )}
          </li>
        </ul>

        <div className="md:hidden flex items-center gap-3">
          {!user && <button onClick={handleLogin} className="text-[#5865F2] text-xs font-bold border border-[#5865F2] px-2 py-1 rounded">Login</button>}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white p-2">
            {isMobileMenuOpen ? 'X' : '☰'}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 z-50 flex flex-col max-h-[80vh] overflow-y-auto animate-fade-in-down">
          {user && (
            <div className="px-6 py-4 border-b border-gray-800 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={user.user_metadata?.avatar_url} className="w-6 h-6 rounded-full" alt="avatar" />
                  <span className="font-bold text-yellow-500 text-sm">{nickname}</span>
                </div>
                <button onClick={handleLogout} className="text-xs text-red-400 font-bold bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/30">로그아웃</button>
              </div>
              
              {/* ✨ 모바일용 알림 및 프로필 버튼 */}
              <div className="flex gap-2">
                <button onClick={() => handleNav('알림')} className="flex-1 flex justify-center items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700 text-sm font-bold text-gray-300">
                  <span>🔔 알림</span>
                  {unreadCount > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount}</span>}
                </button>
                <button onClick={() => handleNav('프로필')} className="flex-1 bg-gray-900 p-2 rounded-lg border border-gray-700 text-gray-300 font-bold text-sm">
                  👤 프로필
                </button>
              </div>
            </div>
          )}
          
          {menuData.map((menu, index) => (
            <div key={index} className="flex flex-col border-b border-gray-800/50">
              <button onClick={() => setMobileAccordionIndex(mobileAccordionIndex === index ? null : index)} className="px-6 py-4 flex justify-between items-center text-gray-200 font-bold hover:bg-gray-900 transition-colors">
                {menu.title}
                <span className="text-gray-500 text-xs">{mobileAccordionIndex === index ? '▲' : '▼'}</span>
              </button>
              {mobileAccordionIndex === index && (
                <div className="flex flex-col bg-gray-900/50 py-2">
                  {menu.items.map((subItem, subIndex) => (
                    <span key={subIndex} onClick={() => handleNav(subItem)} className="px-10 py-3 text-sm text-gray-400 hover:text-yellow-500 cursor-pointer">
                      {subItem}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {['master', 'admin', 'elite'].includes(role) && (
            <button onClick={() => handleNav('가입 심사')} className="px-6 py-4 text-left text-emerald-400 font-bold border-b border-gray-800/50 hover:bg-gray-900">
              ⚔️ 가입 심사
            </button>
          )}
          
          {['master', 'admin'].includes(role) && (
            <button onClick={() => handleNav('관리자')} className="px-6 py-4 text-left text-red-400 font-bold border-b border-gray-800/50 hover:bg-gray-900">
              👑 관리자 모드
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
