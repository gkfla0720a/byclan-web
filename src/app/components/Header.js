'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function Header({ setActiveView }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  const [nickname, setNickname] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // 메뉴 이동 핸들러
  const handleNav = (view) => {
    setActiveView(view);
    setIsMenuOpen(false); // 모바일 메뉴 닫기
  };

  useEffect(() => {
    fetchSessionAndData();

    // 로그인 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchSessionAndData();
      } else {
        setUser(null);
        setRole('guest');
        setNickname('');
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSessionAndData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 1. 프로필 및 직급 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, nickname, discord_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setRole((profile.role || 'associate').trim().toLowerCase());
          // 클랜 닉네임이 없으면 디스코드 이름 표시
          setNickname(profile.nickname || profile.discord_name || '유저');
        }

        // 2. 안 읽은 알림 개수 가져오기
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('헤더 데이터 로드 에러:', error);
    }
  };

  // 로그인 핸들러 (강제 계정 선택 창 띄우기 적용)
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        queryParams: { prompt: 'consent' },
      },
    });
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="w-full bg-gray-950 border-b border-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* 로고 영역 */}
        <div 
          onClick={() => handleNav('메인')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded flex items-center justify-center font-black text-gray-950 text-xl shadow-lg group-hover:scale-110 transition-transform">
            BY
          </div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 tracking-wider">
            ByClan
          </h1>
        </div>

        {/* 데스크톱 메인 메뉴 */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-300">
          <button onClick={() => handleNav('클랜 소개')} className="hover:text-yellow-400 transition-colors">클랜 소개</button>
          <button onClick={() => handleNav('BY래더시스템')} className="hover:text-yellow-400 transition-colors">BY래더시스템</button>
          <button onClick={() => handleNav('BSL')} className="hover:text-yellow-400 transition-colors">BSL</button>
          <button onClick={() => handleNav('토너먼트')} className="hover:text-yellow-400 transition-colors">토너먼트</button>
          <button onClick={() => handleNav('커뮤니티')} className="hover:text-yellow-400 transition-colors">커뮤니티</button>
          <button onClick={() => handleNav('포인트')} className="hover:text-yellow-400 transition-colors">포인트</button>
          
          {/* 관리자 전용 메뉴 (master, admin) */}
          {['master', 'admin'].includes(role) && (
            <button onClick={() => handleNav('관리자')} className="text-red-400 hover:text-red-300 transition-colors duration-200 hover:scale-105 border border-red-900/50 px-2 py-1 rounded bg-red-950/20">
              👑 관리자
            </button>
          )}

          {/* 가입 심사 메뉴 (master, admin, elite) */}
          {['master', 'admin', 'elite'].includes(role) && (
            <button onClick={() => handleNav('가입 심사')} className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 hover:scale-105 border border-emerald-900/50 px-2 py-1 rounded bg-emerald-950/20">
              ⚔️ 가입 심사
            </button>
          )}
        </nav>

        {/* 유저 컨트롤 영역 (데스크톱) */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* ✨ 알림 종 아이콘 */}
              <button onClick={() => handleNav('알림')} className="relative p-2 text-gray-400 hover:text-yellow-400 transition-colors hover:scale-110">
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-gray-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* ✨ 내 프로필 아이콘 */}
              <button onClick={() => handleNav('프로필')} className="p-2 text-gray-400 hover:text-yellow-400 transition-colors hover:scale-110" title="내 프로필 설정">
                <span className="text-xl">👤</span>
              </button>

              {/* 닉네임 및 로그아웃 버튼 */}
              <div className="flex items-center bg-gray-900 border border-gray-800 rounded-full pl-4 pr-1 py-1">
                <span className="text-sm font-bold text-gray-200 mr-3">{nickname}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-950/50 hover:bg-red-900 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                >
                  Out
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-transform hover:scale-105 text-sm"
            >
              <span>Discord Login</span>
            </button>
          )}
        </div>

        {/* 모바일 햄버거 메뉴 버튼 */}
        <button 
          className="md:hidden text-gray-300 hover:text-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
          </svg>
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 absolute w-full shadow-2xl">
          <div className="flex flex-col py-2">
            <button onClick={() => handleNav('클랜 소개')} className="px-6 py-4 text-left text-gray-300 font-bold border-b border-gray-800/50 hover:bg-gray-900">클랜 소개</button>
            <button onClick={() => handleNav('BY래더시스템')} className="px-6 py-4 text-left text-gray-300 font-bold border-b border-gray-800/50 hover:bg-gray-900">BY래더시스템</button>
            <button onClick={() => handleNav('BSL')} className="px-6 py-4 text-left text-gray-300 font-bold border-b border-gray-800/50 hover:bg-gray-900">BSL</button>
            <button onClick={() => handleNav('토너먼트')} className="px-6 py-4 text-left text-gray-300 font-bold border-b border-gray-800/50 hover:bg-gray-900">토너먼트</button>
            <button onClick={() => handleNav('커뮤니티')} className="px-6 py-4 text-left text-gray-300 font-bold border-b border-gray-800/50 hover:bg-gray-900">커뮤니티</button>
            <button onClick={() => handleNav('포인트')} className="px-6 py-4 text-left text-gray-300 font-bold border-b border-gray-800/50 hover:bg-gray-900">포인트</button>
            
            {['master', 'admin'].includes(role) && (
              <button onClick={() => handleNav('관리자')} className="px-6 py-4 text-left text-red-400 font-bold border-b border-gray-800/50 hover:bg-gray-900">👑 관리자</button>
            )}
            
            {['master', 'admin', 'elite'].includes(role) && (
              <button onClick={() => handleNav('가입 심사')} className="px-6 py-4 text-left text-emerald-400 font-bold border-b border-gray-800/50 hover:bg-gray-900">⚔️ 가입 심사</button>
            )}

            {/* 모바일 유저 영역 */}
            <div className="p-6 bg-gray-900/50">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-200 font-bold">{nickname} 님</span>
                    <button onClick={handleLogout} className="text-red-400 font-bold text-sm bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/30">로그아웃</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleNav('알림')} className="flex-1 flex justify-center items-center gap-2 bg-gray-800 p-3 rounded-xl border border-gray-700">
                      <span>🔔 알림</span>
                      {unreadCount > 0 && <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{unreadCount}</span>}
                    </button>
                    <button onClick={() => handleNav('프로필')} className="flex-1 bg-gray-800 p-3 rounded-xl border border-gray-700 text-gray-300 font-bold">
                      👤 프로필 설정
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={handleLogin} className="w-full bg-[#5865F2] text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2">
                  Discord Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
