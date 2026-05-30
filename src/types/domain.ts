// 파일명: src/types/domain.ts

// 1. 관리자가 수행할 수 있는 모든 특권 행동의 카테고리
export type AuditCategory = 
  | 'MEMBER_MANAGEMENT'  // 회원 관리 (추방, 직급 변경 등)
  | 'APPLICATION_REVIEW' // 가입 신청 처리 (승인, 거절 등)
  | 'MMR_ADJUSTMENT'     // MMR 및 전적 수동 조작
  | 'SYSTEM_SETTING'     // 시스템 설정 변경
  | 'POINT_MANAGEMENT';  // 포인트 강제 지급/차감

// 2. 구체적인 행동 유형 (여기에 정의된 행동만 로그로 남길 수 있도록 강제)
export type AdminActionType =
  // 회원 관리
  | 'UPDATE_ROLE'        // 직급 변경 (예: rookie -> member)
  | 'BAN_USER'           // 블랙리스트(영구 정지) 처리
  
  // 가입 신청
  | 'APPROVE_APPLICANT'  // 가입 승인
  | 'REJECT_APPLICANT'   // 가입 거절
  
  // MMR 및 기록
  | 'MANUAL_MMR_UPDATE'  // MMR 수동 변경
  | 'INVALIDATE_MATCH'   // 부정 경기 무효 처리
  
  // 기타
  | 'UPDATE_DEV_SETTING';// 개발자 설정 변경
