// 파일명: src/hooks/useSession.ts
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/supabase';

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    // 1. 초기 세션(로그인 상태) 가져오기
    const fetchSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data?.user || null);
      setSessionLoading(false);
    };

    fetchSession();

    // 2. 로그인/로그아웃 상태 변화 구독하기
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else {
        setUser(session?.user || null);
      }
      setSessionLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, sessionLoading };
}
