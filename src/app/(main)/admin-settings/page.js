/**
 * =====================================================================
 * 파일명: src/app/(main)/admin-settings/page.js
 * 역할  : 운영진 및 개발자를 위한 통합 관리/설정 페이지
 * 
 * 주요 기능:
 *   - 사용자의 권한(role)을 확인하여 허용된 관리 메뉴만 표시
 *   - 버튼(카드) 형태로 직관적인 관리 메뉴 제공 (CSS Grid 활용)
 *   - 개발자(developer) 접속 시 하단에 DevSettingsPanel 렌더링
 * =====================================================================
 */
'use client';

import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from '../../hooks/useNavigate';
import DevSettingsPanel from '../../components/DevSettingsPanel';

export default function AdminSettingsPage() {
  const navigateTo = useNavigate();
  const { user, profile, authLoading } = useAuthContext();

  // 아직 로딩 중이면 빈 화면(또는 스피너) 표시
  if (authLoading) return <div className="p-8 text-center text-cyan-400">데이터를 불러오는 중...</div>;

  // 권한 체크 로직 (Header.js와 동일하게 적용)
  const currentRole = profile?.role?.toString().trim().toLowerCase();
  
  const isDeveloper = currentRole === 'developer';
  const isEliteOrHigher = ['developer', 'master', 'admin', 'elite'].includes(currentRole);
  const isAdminOrHigher = ['developer', 'master', 'admin'].includes(currentRole);

  // 일반 유저가 비정상적인 방법으로 접근했을 때의 방어 로직 (보안)
  if (!user || !isEliteOrHigher) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 text-center">
        <span className="text-6xl mb-6">🚫</span>
        <h2 className="text-2xl font-bold text-red-500 mb-2">접근 권한이 없습니다</h2>
        <p className="text-slate-400">운영진 및 관리자 전용 페이지입니다.</p>
        <button 
          onClick={() => navigateTo('Home')}
          className="mt-6 px-6 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in-up">
      
      {/* 1. 페이지 타이틀 영역 */}
      <div className="border-b border-cyan-400/20 pb-4 mt-4">
        <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-3">
          <span className="text-cyan-400">⚙️</span> 시스템 및 운영 관리
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          현재 접속 계정의 권한에 맞는 관리 메뉴만 표시됩니다.
        </p>
      </div>

      {/* 2. 관리 메뉴 카드 영역 (CSS Grid 활용) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 🛡️ 가입 심사 메뉴 (엘리트 이상) */}
        {isEliteOrHigher && (
          <button 
            onClick={() => navigateTo('가입 심사 관리')}
            className="flex flex-col text-left p-6 rounded-2xl bg-slate-900/50 border border-emerald-400/20 hover:border-emerald-400/60 hover:bg-emerald-950/20 hover:-translate-y-1 transition-all duration-300 shadow-lg group"
          >
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚔️</span>
            <h3 className="text-lg font-bold text-emerald-300 mb-2">가입 심사 관리</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              신규 가입 신청자의 정보를 확인하고, 입단 테스트 결과에 따라 승인 및 거절을 처리합니다.
            </p>
          </button>
        )}

        {/* 👑 최고 관리자 메뉴 (어드민 이상) */}
        {isAdminOrHigher && (
          <button 
            onClick={() => navigateTo('관리자')}
            className="flex flex-col text-left p-6 rounded-2xl bg-slate-900/50 border border-rose-400/20 hover:border-rose-400/60 hover:bg-rose-950/20 hover:-translate-y-1 transition-all duration-300 shadow-lg group"
          >
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">👑</span>
            <h3 className="text-lg font-bold text-rose-300 mb-2">마스터 / 관리자 모드</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              클랜원 등급 조정, 게시판 관리, 전체 알림 발송 등 클랜의 전반적인 운영을 관리합니다.
            </p>
          </button>
        )}

        {/* 🛠️ 시스템 개발자 메뉴 (개발자 전용) */}
        {isDeveloper && (
          <button 
            onClick={() => navigateTo('개발자')}
            className="flex flex-col text-left p-6 rounded-2xl bg-slate-900/50 border border-cyan-400/20 hover:border-cyan-400/60 hover:bg-cyan-950/20 hover:-translate-y-1 transition-all duration-300 shadow-lg group"
          >
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛠️</span>
            <h3 className="text-lg font-bold text-cyan-300 mb-2">시스템 개발자 콘솔</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              데이터베이스 직접 제어, 권한 강제 수정 및 사이트 전체 환경 설정을 관리하는 시스템 코어입니다.
            </p>
          </button>
        )}
      </div>

      {/* 3. 개발자 전용 패널 렌더링 영역 */}
      {isDeveloper && (
        <div className="mt-8 pt-8 border-t border-slate-800">
          <div className="mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-cyan-500 rounded-full animate-pulse"></span>
            <h2 className="text-xl font-bold text-slate-200">개발자 실시간 디버그 패널</h2>
          </div>
          
          {/* MainLayout에서 제거했던 패널을 여기서 렌더링합니다 */}
          <div className="bg-slate-950/50 p-1 md:p-6 rounded-2xl border border-slate-800">
            <DevSettingsPanel />
          </div>
        </div>
      )}

    </div>
  );
}