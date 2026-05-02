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
// src/app/(main)/(sidebar)/join/page.js

'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // useRouter 추가
import VisitorWelcome from '../../../components/VisitorWelcome';
import { useAuthContext } from '../../../context/AuthContext';

export default function JoinPage() {
  const router = useRouter();
  const { user, profile, reloadProfile, authLoading } = useAuthContext();

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  // 🛠️ 추가: 역할이 applicant(가입 대기자)인 경우 상태 확인 화면 렌더링
  if (user && profile?.role === 'applicant') {
    return (
      <div className="flex-grow flex flex-col justify-center items-center p-4 relative z-10 min-h-[60vh]">
        <div className="cyber-card p-8 rounded-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">테스트 대기 중</h2>
          <p className="text-gray-300 mb-4">
            가입 신청이 접수되었습니다.<br />
            입단 테스트 결과를 기다려주세요.
          </p>
          <div className="text-sm text-gray-400 mb-5">
            운영진의 안내는 알림함에서 확인하실 수 있습니다.
          </div>
          <button
            onClick={() => router.push('/profile/notifications')}
            className="px-5 py-2.5 rounded-lg font-bold text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors"
          >
            알림함 확인하기
          </button>
        </div>
      </div>
    );
  }

  // 비로그인, visitor 등 가입 신청을 하지 않은 사람에게 보여주는 화면
  return (
    <VisitorWelcome
      user={user}
      profile={profile}
      mode="guide"
      onApplicationSubmit={reloadProfile}
    />
  );
}