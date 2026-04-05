'use client';

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomeGate from '../components/HomeGate';
import DevSettingsPanel from '../components/DevSettingsPanel';
import { useAuthContext } from '../context/AuthContext';

export default function MainLayout({ children }) {
  const { getPermissions } = useAuthContext();
  const permissions = getPermissions();

  return (
    <HomeGate>
      <div className="min-h-screen flex flex-col bg-[#06060a] text-gray-200 font-semibold relative" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        <Header />
        {children}
        {permissions.isDeveloper && <DevSettingsPanel />}
        <Footer />
      </div>
    </HomeGate>
  );
}
