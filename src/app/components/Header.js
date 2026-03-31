'use client';

import React, { useState } from 'react';

export default function Header({ navigateTo }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-950 border-b border-gray-800 relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('Home')}>
          <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center font-bold text-slate-900 shadow-lg">BC</div>
          <h1 className="text-2xl font-black text-yellow-500 tracking-tighter">ByClan</h1>
        </div>
        
        <div className="hidden md:flex gap-6">
          <button onClick={() => navigateTo('랭킹')} className="text-gray-300 hover:text-white font-bold">랭킹</button>
          <button onClick={() => navigateTo('공지사항')} className="text-gray-300 hover:text-white font-bold">공지사항</button>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 text-2xl">☰</button>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 flex flex-col p-4 gap-4">
          <button onClick={() => { navigateTo('랭킹'); setIsMobileMenuOpen(false); }} className="text-left text-gray-200 font-bold">랭킹</button>
          <button onClick={() => { navigateTo('공지사항'); setIsMobileMenuOpen(false); }} className="text-left text-gray-200 font-bold">공지사항</button>
        </div>
      )}
    </nav>
  );
}
