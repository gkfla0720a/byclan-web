// src/app/components/AdminMembers.js 수정 버전
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); // 관리자 여부 상태
  const [loading, setLoading] = useState(true);  // 로딩 상태

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    // 1. 현재 로그인한 유저의 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 2. 그 유저의 role이 'admin'인지 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
        fetchMembers(); // 관리자일 때만 유저 목록 불러오기
      }
    }
    setLoading(false);
  };

  // ... (fetchMembers, handleEditClick, handleSaveClick 함수는 기존과 동일)

  if (loading) return <div className="text-center text-gray-400">권한 확인 중...</div>;
  if (!isAdmin) return null; // 관리자가 아니면 아무것도 렌더링하지 않음 (화면에서 사라짐)

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      {/* ... 기존 UI 코드 ... */}
    </div>
  );
}
