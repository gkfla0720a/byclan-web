'use client';

import React from 'react';
import VisitorWelcome from '../../../components/VisitorWelcome';
import { useAuthContext } from '../../../context/AuthContext';
import { supabase } from '@/supabase';

export default function JoinPage() {
  const { user, profile, setProfile } = useAuthContext();

  const handleApplicationSubmit = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  };

  return (
    <VisitorWelcome
      user={user}
      profile={profile}
      mode="guide"
      onApplicationSubmit={handleApplicationSubmit}
    />
  );
}
