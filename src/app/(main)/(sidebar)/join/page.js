'use client';

import React from 'react';
import VisitorWelcome from '../../../components/VisitorWelcome';
import { useAuthContext } from '../../../context/AuthContext';

export default function JoinPage() {
  const { user, profile, reloadProfile } = useAuthContext();

  return (
    <VisitorWelcome
      user={user}
      profile={profile}
      mode="guide"
      onApplicationSubmit={reloadProfile}
    />
  );
}
