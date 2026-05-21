/**
 * @file accountId.test.ts
 * @description 계정 ID 정규화 및 변환 함수 테스트
 */

import {
  normalizeAccountId,
  isLegacyEmailLogin,
  buildInternalAuthEmail,
  isInternalAuthEmail,
  extractAccountIdFromInternalEmail,
  extractAccountIdFromById,
  getLoginEmailFromInput,
} from '@/utils/accountId';

describe('accountId utilities', () => {
  describe('normalizeAccountId', () => {
    it('소문자 영문과 숫자만 유지해야 한다', () => {
      expect(normalizeAccountId('user123')).toBe('user123');
      expect(normalizeAccountId('myaccount456')).toBe('myaccount456');
    });

    it('대문자는 제거하고 숫자와 소문자만 유지해야 한다', () => {
      expect(normalizeAccountId('User123')).toBe('ser123'); // U는 대문자이므로 제거
      expect(normalizeAccountId('My-Account_456')).toBe('yccount456');
    });

    it('특수문자와 공백을 제거해야 한다', () => {
      expect(normalizeAccountId('user@email.com')).toBe('useremailcom');
      expect(normalizeAccountId('user name')).toBe('username');
    });

    it('빈 문자열을 처리해야 한다', () => {
      expect(normalizeAccountId('')).toBe('');
      expect(normalizeAccountId(undefined as any)).toBe('');
    });

    it('한글을 제거해야 한다', () => {
      expect(normalizeAccountId('사용자123')).toBe('123');
      expect(normalizeAccountId('abc가나다123')).toBe('abc123');
    });

    it('소문자로 변환된 입력을 처리해야 한다', () => {
      const input = 'TestUser'.toLowerCase(); // testuser
      expect(normalizeAccountId(input)).toBe('testuser');
    });
  });

  describe('isLegacyEmailLogin', () => {
    it('@가 포함되면 레거시 이메일 로그인으로 판단해야 한다', () => {
      expect(isLegacyEmailLogin('user@example.com')).toBe(true);
      expect(isLegacyEmailLogin('test@gmail.com')).toBe(true);
    });

    it('@가 없으면 레거시 이메일 로그인이 아니어야 한다', () => {
      expect(isLegacyEmailLogin('username')).toBe(false);
      expect(isLegacyEmailLogin('user123')).toBe(false);
    });

    it('빈 문자열을 처리해야 한다', () => {
      expect(isLegacyEmailLogin('')).toBe(false);
      expect(isLegacyEmailLogin(undefined as any)).toBe(false);
    });
  });

  describe('buildInternalAuthEmail', () => {
    it('정규화된 계정 ID로 내부 인증 이메일을 생성해야 한다', () => {
      const email = buildInternalAuthEmail('username123');
      expect(email).toBe('login.username123@auth.byclan.local');
    });

    it('이메일 형식이 "login.{accountId}@auth.byclan.local"이어야 한다', () => {
      expect(buildInternalAuthEmail('test')).toBe('login.test@auth.byclan.local');
      expect(buildInternalAuthEmail('abc123')).toBe('login.abc123@auth.byclan.local');
    });

    it('빈 계정 ID는 빈 문자열을 반환해야 한다', () => {
      expect(buildInternalAuthEmail('')).toBe('');
      expect(buildInternalAuthEmail('  ')).toBe('');
    });

    it('특수문자가 포함된 계정 ID를 정규화해야 한다', () => {
      const email = buildInternalAuthEmail('user-@-name');
      expect(email).toBe('login.username@auth.byclan.local');
    });
  });

  describe('isInternalAuthEmail', () => {
    it('올바른 내부 인증 이메일을 인식해야 한다', () => {
      expect(isInternalAuthEmail('login.user123@auth.byclan.local')).toBe(true);
      expect(isInternalAuthEmail('login.test@auth.byclan.local')).toBe(true);
    });

    it('다른 도메인의 이메일은 인식하지 않아야 한다', () => {
      expect(isInternalAuthEmail('login.user123@gmail.com')).toBe(false);
      expect(isInternalAuthEmail('user@byclan.local')).toBe(false);
    });

    it('빈 문자열을 처리해야 한다', () => {
      expect(isInternalAuthEmail('')).toBe(false);
      expect(isInternalAuthEmail(undefined as any)).toBe(false);
    });
  });

  describe('extractAccountIdFromInternalEmail', () => {
    it('내부 인증 이메일에서 계정 ID를 추출해야 한다', () => {
      expect(extractAccountIdFromInternalEmail('login.user123@auth.byclan.local')).toBe('user123');
      expect(extractAccountIdFromInternalEmail('login.test@auth.byclan.local')).toBe('test');
    });

    it('login. 접두사를 제거해야 한다', () => {
      const accountId = extractAccountIdFromInternalEmail('login.myaccount@auth.byclan.local');
      expect(accountId).toBe('myaccount');
      expect(accountId.startsWith('login.')).toBe(false);
    });

    it('내부 인증 이메일이 아니면 빈 문자열을 반환해야 한다', () => {
      expect(extractAccountIdFromInternalEmail('user@gmail.com')).toBe('');
      expect(extractAccountIdFromInternalEmail('test@byclan.local')).toBe('');
    });

    it('빈 문자열을 처리해야 한다', () => {
      expect(extractAccountIdFromInternalEmail('')).toBe('');
      expect(extractAccountIdFromInternalEmail(undefined as any)).toBe('');
    });
  });

  describe('extractAccountIdFromById', () => {
    it('By_ 접두사가 있으면 제거해야 한다', () => {
      expect(extractAccountIdFromById('By_user123')).toBe('user123');
      expect(extractAccountIdFromById('By_test')).toBe('test');
    });

    it('By_ 접두사가 없으면 원본을 반환해야 한다', () => {
      expect(extractAccountIdFromById('user123')).toBe('user123');
    });

    it('빈 byId를 처리해야 한다', () => {
      expect(extractAccountIdFromById('')).toBe('');
      expect(extractAccountIdFromById(undefined as any)).toBe('');
    });
  });

  describe('getLoginEmailFromInput', () => {
    it('@ 기호가 있으면 그대로 이메일로 반환해야 한다 (레거시)', () => {
      expect(getLoginEmailFromInput('user@example.com')).toBe('user@example.com');
    });

    it('@ 기호가 없으면 내부 인증 이메일로 변환해야 한다', () => {
      const email = getLoginEmailFromInput('user123');
      expect(email).toBe('login.user123@auth.byclan.local');
    });

    it('계정 ID의 특수문자를 정규화해야 한다', () => {
      const email = getLoginEmailFromInput('user-name123');
      expect(email).toBe('login.username123@auth.byclan.local');
    });
  });

  describe('통합 워크플로우', () => {
    it('계정 ID → 이메일 → 계정 ID 변환이 일관성 있어야 한다', () => {
      const originalId = 'myaccount123'; // 소문자 입력
      const email = buildInternalAuthEmail(originalId);
      const extractedId = extractAccountIdFromInternalEmail(email);

      expect(extractedId).toBe(originalId);
    });

    it('By_Id 형식과 내부 이메일 형식을 모두 처리해야 한다', () => {
      const byIdFormat = 'By_user123';
      const internalEmail = 'login.user123@auth.byclan.local';

      expect(extractAccountIdFromById(byIdFormat)).toBe(
        extractAccountIdFromInternalEmail(internalEmail)
      );
    });
  });
});
