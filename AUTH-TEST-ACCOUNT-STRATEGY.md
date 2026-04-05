# 테스트 계정 auth.users 생성 전략

## 결론

`auth.users`는 SQL Editor에서 직접 `insert`하는 방식보다 Supabase Auth Admin API 또는 Dashboard 생성 방식을 권장합니다.

이유는 다음과 같습니다.

- 비밀번호 해시와 계정 메타데이터를 Auth 내부 규칙에 맞게 넣어야 합니다.
- `auth.identities`, 세션, 감사 로그까지 함께 맞추려면 수동 SQL은 깨질 가능성이 큽니다.
- 운영 중 Supabase 내부 스키마가 바뀌면 직접 insert 전략은 쉽게 깨집니다.

## 권장 방식 1: 가장 안전한 운영 방식

Supabase Dashboard의 Authentication 메뉴에서 테스트 계정을 생성합니다.

- 이메일 예시: `test1@byclan.local` ~ `test10@byclan.local`
- 임시 비밀번호 예시: 운영자가 한 번에 바꿀 수 있는 공통 규칙 사용
- 생성 직후 User UUID를 확인한 뒤 `profiles.id`와 맞춥니다.

이 방식은 소량 계정에서는 가장 안전합니다. 다만 현재 `TEST-DATA-SEED.sql`은 고정 UUID를 사용하므로, Dashboard에서 임의 UUID로 생성하면 `profiles.id`와 맞지 않을 수 있습니다.

따라서 Dashboard 방식은 아래 두 경우에 적합합니다.

- SQL 시드의 UUID를 생성된 실제 UUID로 한번 수정할 때
- 또는 `profiles` 시드를 Dashboard에서 만든 UUID 기준으로 다시 맞출 때

## 권장 방식 2: 자동화에 적합한 방식

서비스 롤 키로 Admin API를 사용해 테스트 계정을 생성합니다.

예시 흐름은 다음과 같습니다.

1. `SUPABASE_SERVICE_ROLE_KEY`를 서버 전용 환경변수로 준비합니다.
2. Node 스크립트에서 `supabase.auth.admin.createUser()`를 호출합니다.
3. 계정 생성 직후 반환된 `user.id`를 사용해 `profiles`, `ladders` 등 시드 데이터를 넣습니다.
4. 같은 계정이 있으면 `listUsers` 또는 `getUserById` 대신 이메일 기준 조회 후 재사용합니다.

이 방식의 장점은 다음과 같습니다.

- 비밀번호와 이메일 인증 상태를 안전하게 설정할 수 있습니다.
- 대량 테스트 계정 생성/재생성이 쉽습니다.
- 추후 `seed-test-data.cjs`에 자연스럽게 통합할 수 있습니다.

## 현재 저장소 기준 추천안

현재 저장소는 이미 다음 전제를 사용합니다.

- `profiles.id`가 사용자 UUID와 일치해야 합니다.
- `TEST-DATA-SEED.sql`은 고정 UUID `1111...` ~ `aaaa...`를 사용합니다.
- 래더, 신청서, 알림, 매치가 모두 해당 UUID를 참조합니다.

그래서 가장 실용적인 전략은 아래 둘 중 하나입니다.

### A안. SQL 시드를 유지하고 auth 계정을 별도 수동 로그인 없이 운영

이 경우 테스트 데이터는 화면 검증 전용입니다.

- 장점: 지금 바로 적용 가능
- 단점: `test1`~`test10`으로 실제 로그인은 불가

화면 점검, 랭킹 채우기, 신청서/게시글/알림/래더 매치 확인만 필요하면 가장 빠릅니다.

### B안. auth 계정도 실제 로그인 가능하게 만들기

이 경우 Admin API 기반 별도 스크립트를 추가하는 것이 가장 안전합니다.

- 이메일: `test1@byclan.local` ~ `test10@byclan.local`
- 표시 이름: `test1` ~ `test10`
- 역할/랭더 데이터는 기존 시드 유지
- 생성 시 UUID를 고정할 수 없는 경우, 고정 UUID 기반 SQL 대신 생성된 UUID를 기준으로 `profiles` 시드를 다시 맞춥니다.

운영 관점에서는 이 B안을 추천합니다. 이유는 테스트 계정이 실제로 래더 진입, 프로필 확인, 알림 확인까지 검증 가능해지기 때문입니다.

## Discord 연동 필수 예외 정책

이번 변경으로 앱은 다음 규칙을 사용합니다.

- 기본적으로 래더 권한이 있는 계정은 개발자 설정상 Discord 연동 필수 여부를 따릅니다.
- 단, `system_settings.test_accounts_enabled = true` 이고 현재 프로필이 `is_test_account = true` 이면 Discord 미연동이어도 래더 진입이 허용됩니다.
- 일반 계정은 계속 기존 규칙을 따릅니다.

즉, 테스트 계정을 켜 두는 동안에만 테스트 계정에게 한정된 임시 우회가 적용됩니다.

## 운영 순서 추천

1. 먼저 `TEST-DATA-SEED.sql`을 실행해 화면용 테스트 데이터를 채웁니다.
2. 실제 로그인까지 필요 없으면 여기서 종료합니다.
3. 실제 로그인 검증이 필요하면 Admin API 기반 테스트 계정 생성 스크립트를 추가합니다.
4. 생성된 Auth UUID와 `profiles.id`를 일치시키는 방식으로 시드 방식을 정리합니다.
5. 테스트 종료 후 `test_accounts_enabled = false` 로 내려 화면에서 일괄 숨깁니다.

## 하지 않는 것을 권장하는 방식

아래 방식은 추천하지 않습니다.

- SQL Editor에서 `auth.users` 직접 insert
- 비밀번호 해시를 임의 문자열로 수동 작성
- `auth.identities`를 같이 수동 insert
- `profiles.id`와 `auth.users.id`를 다르게 유지

이 방식은 처음에는 동작해 보여도 이후 로그인, OAuth, 세션, 사용자 복구 과정에서 쉽게 깨집니다.