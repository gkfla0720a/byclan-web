import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export function useAuth() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);

  const CORRECT_PASSWORD = process.env.DEV_ACCESS_PASSWORD || "1990";

  useEffect(() => {
    if (!isAuthorized) return;
    
    const initializeData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;

        const { data: p, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        setProfile(p);

        const { data: m, error: matchError } = await supabase
          .from('ladder_matches')
          .select('id')
          .eq('status', '진행중')
          .or(`team_a.cs.{${user.id}},team_b.cs.{${user.id}}`)
          .maybeSingle();
        
        if (matchError) throw matchError;
        if (m) setActiveMatchId(m.id);
      } catch (error) {
        console.error('인증 데이터 초기화 실패:', error);
      }
    };
    
    initializeData();
  }, [isAuthorized]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
    }
  };

  const getPermissions = () => {
    const userRole = profile?.role?.trim().toLowerCase();
    
    return {
      isAdminOrHigher: ['developer', 'master', 'admin'].includes(userRole),
      isEliteOrHigher: ['developer', 'master', 'admin', 'elite'].includes(userRole),
      isDeveloper: userRole === 'developer'
    };
  };

  return {
    password,
    setPassword,
    isAuthorized,
    setIsAuthorized,
    profile,
    activeMatchId,
    setActiveMatchId,
    handleLogin,
    getPermissions
  };
}
