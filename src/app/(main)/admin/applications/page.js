'use client';

import React from 'react';
import ApplicationList from '../../../components/ApplicationList';
import PagePlaceholder from '../../../pages/PagePlaceholder';
import { useAuthContext } from '../../../context/AuthContext';

export default function ApplicationsPage() {
  const { user } = useAuthContext();

  return (
    <main className="flex-grow w-full relative z-10 flex flex-col items-start justify-start px-2 sm:px-6 mb-10 max-w-6xl mx-auto">
      <div className="w-full mt-4">
        {user
          ? <ApplicationList />
          : <PagePlaceholder title="로그인이 필요합니다." />}
      </div>
    </main>
  );
}
