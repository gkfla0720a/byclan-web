// src/app/components/AdminMembers.js
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null); // 에러 메시지 상태 추가

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      setLoading(true);
      // 1. 현재 세션 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("로그인이 필요하거나 인증에 실패했습니다.");
      }

      // 2. 프로필 및 권한 확인
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (dbError) throw dbError;

      if (profile?.role === 'admin') {
        setIsAdmin(true);
        await fetchMembers();
      } else {
        throw new Error("관리자 권한이 없습니다. (현재 권한: " + (profile?.role || '없음') + ")");
      }
    } catch (err) {
      console.error("관리자 확인 에러:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("목록 불러오기 에러:", error);
    } else {
      setMembers(data);
    }
  };

  // ... (handleEditClick, handleSaveClick은 이전과 동일)

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">권한 확인 중...</div>;
  
  if (errorMsg) {
    return (
      <div className="text-center py-20 text-red-400">
        <p className="mb-4">⚠️ {errorMsg}</p>
        <button onClick={() => window.location.reload()} className="text-sm underline">다시 시도</button>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
       {/* 기존 관리자 UI 코드 */}
    </div>
  );
}
