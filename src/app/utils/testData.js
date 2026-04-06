/**
 * =====================================================================
 * 파일명: src/app/utils/testData.js
 * 역할  : 개발/테스트 환경에서 테스트 계정과 테스트 데이터를 관리하는
 *         유틸리티 상수 및 함수들을 제공합니다.
 *
 * ■ 배경
 *   실제 서비스와 테스트 데이터가 섞이지 않도록, 테스트 계정/데이터를
 *   별도로 표시하고 필터링하는 기능을 제공합니다.
 *
 * ■ 주의사항
 *   filterVisibleTestAccounts()와 filterVisibleTestData()는 현재 아무 동작도
 *   하지 않는 "no-op(빈 함수)" 상태입니다.
 *   DB에 is_test_account, is_test_data 컬럼이 추가될 때 실제 필터링이 활성화됩니다.
 *
 * ■ 테스트 계정 이름 목록
 *   test1 ~ test10 (TEST_ACCOUNT_NAMES 배열에 정의)
 *
 * ■ 사용 방법
 *   import { isMarkedTestAccount, shouldBypassDiscordForTestAccount } from '@/app/utils/testData';
 * =====================================================================
 */

/**
 * TEST_MODE_SETTING_KEY
 * - localStorage에서 "테스트 모드 활성화" 여부를 저장할 때 사용하는 키 이름입니다.
 */
export const TEST_MODE_SETTING_KEY = 'test_mode_active';

/**
 * TEST_ACCOUNT_SETTING_KEY
 * - Supabase system_settings 테이블과 localStorage에서 "테스트 계정 기능" 활성화 여부를
 *   저장할 때 사용하는 키 이름입니다.
 */
export const TEST_ACCOUNT_SETTING_KEY = 'test_accounts_enabled';

/**
 * TEST_ACCOUNT_SETTING_EVENT
 * - 테스트 계정 설정이 변경될 때 발생시키는 CustomEvent의 이름입니다.
 * - window.dispatchEvent()로 이벤트를 발생시키고, useAuth.ts에서 이를 감지해 상태를 업데이트합니다.
 */
export const TEST_ACCOUNT_SETTING_EVENT = 'byclan:test-account-setting-changed';

/**
 * TEST_ACCOUNT_FILTER
 * - Supabase 쿼리에서 테스트 계정을 필터링할 때 사용하는 조건 문자열입니다.
 * - 현재 미사용 상태 (DB 컬럼 추가 후 활성화 예정)
 */
export const TEST_ACCOUNT_FILTER = 'is_test_account.is.null,is_test_account_active.eq.true';

/**
 * TEST_DATA_FILTER
 * - Supabase 쿼리에서 테스트 데이터를 필터링할 때 사용하는 조건 문자열입니다.
 * - 현재 미사용 상태 (DB 컬럼 추가 후 활성화 예정)
 */
export const TEST_DATA_FILTER = 'is_test_data.is.null,is_test_data_active.eq.true';

/**
 * TEST_ACCOUNT_NAMES
 * - 테스트 계정으로 사용되는 이름 목록입니다.
 * - 이 이름들을 가진 계정은 테스트 계정으로 간주할 수 있습니다.
 */
export const TEST_ACCOUNT_NAMES = [
  'test1',
  'test2',
  'test3',
  'test4',
  'test5',
  'test6',
  'test7',
  'test8',
  'test9',
  'test10',
];

/**
 * filterVisibleTestAccounts(query)
 * - Supabase 쿼리에서 테스트 계정을 숨기는 필터를 적용합니다.
 * - ⚠️ 현재는 아무 동작도 하지 않습니다 (no-op 상태).
 *   DB에 is_test_account, is_test_account_active 컬럼이 추가된 후 활성화 예정.
 *
 * 매개변수:
 *   query: Supabase 쿼리 빌더 객체
 *
 * 반환값: 필터가 적용된 쿼리 (현재는 입력 그대로 반환)
 */
export function filterVisibleTestAccounts(query) {
  // NOTE: Filtering requires `is_test_account` and `is_test_account_active` columns
  // in the profiles table. Until those columns are added to the DB, this function
  // is intentionally a no-op so that queries are not broken by missing columns.
  return query;
}

/**
 * filterVisibleTestData(query)
 * - Supabase 쿼리에서 테스트 데이터를 숨기는 필터를 적용합니다.
 * - ⚠️ 현재는 아무 동작도 하지 않습니다 (no-op 상태).
 *   DB에 is_test_data, is_test_data_active 컬럼이 추가된 후 활성화 예정.
 *
 * 매개변수:
 *   query: Supabase 쿼리 빌더 객체
 *
 * 반환값: 필터가 적용된 쿼리 (현재는 입력 그대로 반환)
 */
export function filterVisibleTestData(query) {
  // NOTE: Filtering requires `is_test_data` and `is_test_data_active` columns in
  // the relevant tables. Until those columns are added to the DB, this function
  // is intentionally a no-op so that queries are not broken by missing columns.
  return query;
}

/**
 * isMarkedTestAccount(record)
 * - 특정 레코드(데이터 행)가 테스트 계정으로 표시되어 있는지 확인합니다.
 *
 * 매개변수:
 *   record: DB에서 가져온 프로필 또는 데이터 객체
 *
 * 반환값: is_test_account 필드가 truthy이면 true, 아니면 false
 */
export function isMarkedTestAccount(record) {
  return Boolean(record?.is_test_account);
}

/**
 * isMarkedTestData(record)
 * - 특정 레코드가 테스트 데이터로 표시되어 있는지 확인합니다.
 * - is_test_data 또는 is_test_account 중 하나라도 true이면 테스트 데이터로 간주합니다.
 *
 * 매개변수:
 *   record: DB에서 가져온 데이터 객체
 *
 * 반환값: 테스트 데이터이면 true, 아니면 false
 */
export function isMarkedTestData(record) {
  return Boolean(record?.is_test_data || record?.is_test_account);
}

/**
 * shouldBypassDiscordForTestAccount(profile, testAccountsEnabled)
 * - 테스트 계정이 Discord 연동 없이도 래더를 플레이할 수 있는지 결정합니다.
 * - 테스트 계정 기능이 활성화되어 있고, 해당 프로필이 테스트 계정으로 표시된 경우에만
 *   Discord 연동 필수 조건을 우회합니다.
 *
 * 매개변수:
 *   profile:              현재 로그인한 사용자의 프로필 객체
 *   testAccountsEnabled:  테스트 계정 기능 활성화 여부 (boolean)
 *
 * 반환값: Discord 연동 없이도 플레이 가능하면 true, 아니면 false
 */
export function shouldBypassDiscordForTestAccount(profile, testAccountsEnabled) {
  return Boolean(testAccountsEnabled && profile?.is_test_account);
}