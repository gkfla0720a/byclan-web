// 파일명: src/hooks/auth/useAuthSession.ts

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/supabase';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    const fetchSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data?.user || null);
      setSessionLoading(false);
    };

    fetchSession();

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

  return { user, setUser, sessionLoading };
}
