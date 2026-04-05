export const TEST_MODE_SETTING_KEY = 'test_mode_active';
export const TEST_ACCOUNT_SETTING_KEY = 'test_accounts_enabled';
export const TEST_ACCOUNT_SETTING_EVENT = 'byclan:test-account-setting-changed';

export const TEST_ACCOUNT_FILTER = 'is_test_account.is.null,is_test_account_active.eq.true';
export const TEST_DATA_FILTER = 'is_test_data.is.null,is_test_data_active.eq.true';

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

export function filterVisibleTestAccounts(query) {
  return query.or(TEST_ACCOUNT_FILTER);
}

export function filterVisibleTestData(query) {
  return query.or(TEST_DATA_FILTER);
}

export function isMarkedTestAccount(record) {
  return Boolean(record?.is_test_account);
}

export function isMarkedTestData(record) {
  return Boolean(record?.is_test_data || record?.is_test_account);
}

export function shouldBypassDiscordForTestAccount(profile, testAccountsEnabled) {
  return Boolean(testAccountsEnabled && profile?.is_test_account);
}