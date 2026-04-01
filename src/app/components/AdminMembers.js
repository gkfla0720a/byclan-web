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
      const { data: { user } } = await supabase.auth.getUser();
      console.log("1. 로그인 유저:", user?.id); // 로그인 확인

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log("2. DB에서 가져온 프로필:", profile); // 여기서 데이터가 오는지 확인!
        console.log("3. 발생한 에러(있다면):", error);

        if (profile?.role === 'admin') {
          setIsAdmin(true);
          fetchMembers();
        }
      }
    } catch (err) {
      console.error("에러 발생:", err);
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
