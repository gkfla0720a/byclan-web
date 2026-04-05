'use client';

import React from 'react';
import MyProfile from '../../components/MyProfile';
import PagePlaceholder from '../../pages/PagePlaceholder';
import { useAuthContext } from '../../context/AuthContext';
import { SectionErrorBoundary } from '../../components/ErrorBoundary';

export default function ProfilePage() {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
        <div className="w-full mt-8">
          <PagePlaceholder title="로그인이 필요합니다." />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full mt-4">
        <SectionErrorBoundary name="프로필">
          <MyProfile />
        </SectionErrorBoundary>
      </div>
    </main>
  );
}
