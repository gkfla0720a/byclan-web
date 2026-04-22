'use client';

import React from 'react';
import ExternalMatchList from '@/app/components/ExternalMatchList';
import { SectionErrorBoundary } from '@/app/components/ErrorBoundary';

export default function ExternalLadderPage() {
  return (
    <SectionErrorBoundary name="외부 레더 랭킹">
      <div className="p-6">
        <div className="mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-bold text-white">외부 레더 랭킹</h1>
          <p className="text-sm text-gray-400 mt-1">
            타 서버의 실시간 랭킹 현황을 통합하여 보여줍니다. 
          </p>
        </div>
        
        {/* 모든 데이터를 보여줄 리스트 컴포넌트 */}
        <ExternalMatchList />
      </div>
    </SectionErrorBoundary>
  );
}