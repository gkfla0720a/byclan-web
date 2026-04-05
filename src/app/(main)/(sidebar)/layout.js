'use client';

import React from 'react';
import ProfileSidebar from '../../components/ProfileSidebar';
import { useAuthContext } from '../../context/AuthContext';

export default function SidebarLayout({ children }) {
  const { profile, user } = useAuthContext();

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full flex gap-4 mt-4">
        <ProfileSidebar profile={profile} user={user} />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}
