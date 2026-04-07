/**
 * 파일명: (main)/(sidebar)/ladder/page.js
 * 역할: 래더(경쟁전) 페이지
 * URL 경로: /ladder
 * 주요 기능:
 *   - 래더 참여 권한이 있으면 LadderDashboard 또는 MatchCenter 표시
 *   - 권한이 없으면 LadderPreview(미리보기) 표시
 *   - 활성 매치가 있을 때 MatchCenter로 전환
 * 접근 권한: 래더 참여 권한이 있는 정회원 이상 (비회원/방문자는 미리보기만)
 */
'use client';

import React from 'react';
import LadderDashboard from '../../../components/LadderDashboard';
import MatchCenter from '../../../components/MatchCenter';
import LadderPreview from '../../../components/LadderPreview';
import { useAuthContext } from '../../../context/AuthContext';
import { SectionErrorBoundary } from '../../../components/ErrorBoundary';

/**
 * LadderPage - 래더 페이지 컴포넌트
 * 사용자 권한에 따라 래더 대시보드, 매치 센터, 또는 미리보기를 렌더링합니다.
 */
export default function LadderPage() {
  // 프로필, 사용자, 현재 활성 매치 ID, 권한 정보 가져오기
  const { profile, user, activeMatchId, setActiveMatchId, getPermissions } = useAuthContext();

  // 권한 객체에서 래더 플레이 가능 여부 추출
  const permissions = getPermissions();
  const canPlayLadder = permissions.can?.playLadder;
  // 비로그인 사용자 여부
  const isGuest = !user;
  // 방문자(visitor) 역할인지 여부
  const isVisitor = user && profile && profile.role === 'visitor';

  if (!canPlayLadder) {
    return (
      <SectionErrorBoundary name="래더 프리뷰">
        <LadderPreview
          isGuest={isGuest || isVisitor}
        />
      </SectionErrorBoundary>
    );
  }

  return (
    <SectionErrorBoundary name="래더">
      {!activeMatchId
        ? <LadderDashboard onMatchEnter={(id) => setActiveMatchId(id)} />
        : <MatchCenter matchId={activeMatchId} onExit={() => setActiveMatchId(null)} />}
    </SectionErrorBoundary>
  );
}
