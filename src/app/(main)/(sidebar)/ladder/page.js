'use client';

import React from 'react';
import LadderDashboard from '../../../components/LadderDashboard';
import MatchCenter from '../../../components/MatchCenter';
import LadderPreview from '../../../components/LadderPreview';
import { useAuthContext } from '../../../context/AuthContext';
import { SectionErrorBoundary } from '../../../components/ErrorBoundary';

export default function LadderPage() {
  const { profile, user, activeMatchId, setActiveMatchId, getPermissions } = useAuthContext();

  const permissions = getPermissions();
  const canPlayLadder = permissions.can?.playLadder;
  const requiresDiscordLink = permissions.can?.requiresDiscordLink;
  const isGuest = !user;
  const isVisitor = user && profile && profile.role === 'visitor';

  if (!canPlayLadder) {
    return (
      <SectionErrorBoundary name="래더 프리뷰">
        <LadderPreview
          isGuest={isGuest || isVisitor}
          requiresDiscordLink={false}
        />
      </SectionErrorBoundary>
    );
  }

  return (
    <SectionErrorBoundary name="래더">
      {!activeMatchId
        ? <LadderDashboard requiresDiscordLink={requiresDiscordLink} onMatchEnter={(id) => setActiveMatchId(id)} />
        : <MatchCenter matchId={activeMatchId} onExit={() => setActiveMatchId(null)} />}
    </SectionErrorBoundary>
  );
}
