'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Header({ navigateTo }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // 현재 로그인한 유저 정보 확인
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 디스코드 로그인 함수
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
    });
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <nav className="bg-gray-950 border-b border-gray-800 relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('Home')}>
          <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center font-bold text-slate-900 shadow-lg">BC</div>
          <h1 className="text-2xl font-black text-yellow-500 tracking-tighter">ByClan</h1>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => navigateTo('랭킹')} className="text-gray-300 hover:text-white font-bold">랭킹</button>
          <button onClick={() => navigateTo('공지사항')} className="text-gray-300 hover:text-white font-bold">공지사항</button>
          <button onClick={() => navigateTo('자유게시판')} className="text-gray-300 hover:text-white font-bold">자유게시판</button>
          <button onClick={() => navigateTo('가입신청')} className="text-gray-300 hover:text-white font-bold">가입신청</button>
          
          {user ? (
            <div className="flex items-center gap-3 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700">
              <img src={user.user_metadata.avatar_url} className="w-6 h-6 rounded-full" alt="avatar" />
              <span className="text-sm font-bold text-white">{user.user_metadata.full_name}</span>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">Logout</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform hover:scale-105">
              Discord Login
            </button>
          )}
        </div>

        <div className="md:hidden flex items-center gap-4">
          {!user && (
            <button onClick={handleLogin} className="text-xs bg-[#5865F2] px-3 py-1.5 rounded font-bold">Login</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 text-2xl">☰</button>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 flex flex-col p-4 gap-4">
          {user && (
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
              <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" alt="avatar" />
              <span className="font-bold text-yellow-500">{user.user_metadata.full_name}님 환영합니다!</span>
            </div>
          )}
          <button onClick={() => { navigateTo('랭킹'); setIsMobileMenuOpen(false); }} className="text-left text-gray-200 font-bold">랭킹</button>
          <button onClick={() => { navigateTo('공지사항'); setIsMobileMenuOpen(false); }} className="text-left text-gray-200 font-bold">공지사항</button>
          <button onClick={() => { navigateTo('자유게시판'); setIsMobileMenuOpen(false); }} className="text-left text-gray-200 font-bold">자유게시판</button>
          <button onClick={() => { navigateTo('가입신청'); setIsMobileMenuOpen(false); }} className="text-left text-gray-200 font-bold">가입신청</button>
          {user && (
            <button onClick={handleLogout} className="text-left text-red-400 font-bold pt-2 border-t border-gray-800">로그아웃</button>
          )}
        </div>
      )}
    </nav>
  );
}
