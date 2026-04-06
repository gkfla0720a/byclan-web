/**
 * 파일명: (main)/(sidebar)/join/page.js
 * 역할: 클랜 가입 안내 및 신청 페이지
 * URL 경로: /join
 * 주요 기능:
 *   - 방문자에게 클랜 가입 방법 안내
 *   - 가입 신청서 작성 및 제출
 *   - 신청 완료 후 프로필 정보 갱신
 * 접근 권한: 전체 공개 (비회원 및 방문자 대상)
 */
'use client';

import React from 'react';
import VisitorWelcome from '../../../components/VisitorWelcome';
import { useAuthContext } from '../../../context/AuthContext';

/**
 * JoinPage - 클랜 가입 페이지 컴포넌트
 * 가입 안내와 신청 기능을 제공하는 VisitorWelcome을 렌더링합니다.
 */
export default function JoinPage() {
  // 로그인 사용자 정보, 프로필, 프로필 재조회 함수 가져오기
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
