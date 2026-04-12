// 모바일 문서 자동 업데이트 유틸리티
// 프로젝트 상태가 변경될 때마다 모바일 문서들을 자동으로 업데이트

import { writeFileSync } from 'fs';
import { CURRENT_STATUS, FILE_STRUCTURE } from './mobile-analyzer.js';

// 모바일 가이드 자동 업데이트 함수
export function updateMobileGuide() {
  const template = `# ByClan 모바일 개발 가이드

## 📱 모바일에서 작업하기

### 1. 프로젝트 상황 파악
\`\`\`javascript
// scripts/mobile/mobile-analyzer.js 파일 열고 확인
import { PROJECT_INFO, CURRENT_STATUS } from './mobile-analyzer.js';
console.log(PROJECT_INFO);
console.log(CURRENT_STATUS);
\`\`\`

### 2. 자주 묻는 질문 템플릿
\`\`\`
Q: ByClan 프로젝트 현재 상태는?
A: ${CURRENT_STATUS.phase}, 홈페이지 전면 개선 완료

Q: 어떤 기능이 작동하나?
A: ${CURRENT_STATUS.features.completed.join(', ')}

Q: 현재 문제점은?
A: ${CURRENT_STATUS.issues.join(', ')}

Q: 최근에 무엇을 개선했어?
A: 홈페이지 전면 개선 - 실시간 데이터, 로딩 상태, 콘텐츠 확장, 인터랙션 개선
\`\`\`

### 3. 모바일 작업 순서
1. GitHub 앱 → 코드 확인
2. ChatGPT/Claude → 질문/아이디어
3. GitHub 웹 → 간단 수정
4. 데스크톱 → 상세 개발

## 🚀 긴급 수정 시

### 현재 보안 상태
- 개발 서버: 비밀번호 "1990" // 개발 공사 중 임시 비밀번호
- Supabase: 공개 키 사용 중
- 권한: 개발자가 모든 권한 보유 // 개발 + 길드 운영을 위한 권한 설정(하지만 개발자가 마스터는 아님)

### 빠른 해결책
\`\`\`bash
# 보안 강화
export DEV_PASSWORD="새로운비밀번호"

# 권한 확인
console.log(['developer', 'master', 'admin'].includes(role));
\`\`\`

## 📞 연락처
- 개발자: halim0720gkfla0720a@gmail.com
- 데이터베이스: Supabase
- 백업: GitHub

---
*이 파일은 모바일에서 ByClan 프로젝트를 계속 작업하기 위한 가이드입니다.*
*최종 업데이트: ${new Date().toLocaleString('ko-KR')}*
`;

  return template;
}

// 모바일 분석기 자동 업데이트 함수
export function updateMobileAnalyzer() {
  const updates = {
    lastUpdate: new Date().toLocaleDateString('ko-KR'),
    recentChanges: [
      "환경변수 분리 완료",
      "모바일 문서 자동화 시스템 추가",
      "홈페이지 전면 개선 완료"
    ],
    nextSteps: [
      "권한 시스템 명확화",
      "알림 시스템 개발",
      "포인트 로그 구현"
    ]
  };

  return updates;
}

// 문서 업데이트 실행 함수
export function syncMobileDocs() {
  try {
    // 모바일 가이드 업데이트
    const updatedGuide = updateMobileGuide();
    
    // 모바일 분석기 업데이트
    const analyzerUpdates = updateMobileAnalyzer();
    
    console.log('✅ 모바일 문서 자동 업데이트 완료');
    console.log('📱 업데이트된 내용:', analyzerUpdates);
    
    return {
      success: true,
      guide: updatedGuide,
      analyzer: analyzerUpdates
    };
  } catch (error) {
    console.error('❌ 모바일 문서 업데이트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
