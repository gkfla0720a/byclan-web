'use client';

import React from 'react';
import ProfileSidebar from '@/app/components/ProfileSidebar'; // 경로 확인 필요!
import { useAuthContext } from '@/app/context/AuthContext'; // 유저 정보 필요 시

export default function SidebarLayout({ children }) {
  const { user, profile } = useAuthContext();

return (
    /* 여기서 max-w를 또 걸지 않아도 됩니다. 상위 layout.js에서 이미 잡았기 때문입니다. */
    <div className="w-full flex flex-col md:flex-row gap-8">
      
      {/* 왼쪽 사이드바: 모바일(기본)에서는 hidden, PC(md)부터 block */}
      <aside className="hidden md:block w-64 lg:w-72 xl:w-80 shrink-0">
        <ProfileSidebar profile={profile} user={user} />
      </aside>

      {/* 오른쪽 콘텐츠: 모바일에서는 전체 너비, PC에서는 남은 공간 차지 */}
      <section className="flex-1 min-w-0">
        {children}
      </section>
      
    </div>
  );
}