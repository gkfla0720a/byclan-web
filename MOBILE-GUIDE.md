# ByClan 모바일 개발 가이드

## 📱 모바일에서 작업하기

### 1. 프로젝트 상황 파악
```javascript
// mobile-analyzer.js 파일 열고 확인
import { PROJECT_INFO, CURRENT_STATUS } from './mobile-analyzer.js';
console.log(PROJECT_INFO);
console.log(CURRENT_STATUS);
```

### 2. 자주 묻는 질문 템플릿
```
Q: ByClan 프로젝트 현재 상태는?
A: 개발 서버 테스트 단계, 임시 비밀번호 보호 중

Q: 어떤 기능이 작동하나?
A: 기본 라우팅, 권한 시스템, 래더 기본 구조 작동 중

Q: 현재 문제점은?
A:성능(단일 파일), 에러 핸들링 부족
```

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



# 권한 확인
console.log(['developer', 'master', 'admin'].includes(role));
```

## 📞 연락처
- 개발자: halim0720gkfla0720a@gmail.com
- 데이터베이스: Supabase
- 백업: GitHub

---
*이 파일은 모바일에서 ByClan 프로젝트를 계속 작업하기 위한 가이드입니다.*
