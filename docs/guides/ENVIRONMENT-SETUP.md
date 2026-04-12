# 환경변수 설정 가이드

## 개발 환경 버전

- Node.js 22 권장 (`.nvmrc` 기준)
- npm 10 이상 권장
- 의존성 설치: `npm install`

## 테스트 데이터 주입

`test1`부터 `test10`까지 프로필, 래더 랭킹, 게시글, 신청서, 알림, 매치 데이터를 넣으려면 아래처럼 실행하세요.

SQL Editor에 바로 붙여넣을 버전은 `TEST-DATA-SEED.sql` 파일에 있습니다.

`TEST-DATA-SEED.sql` 맨 아래에는 아래 용도의 점검용 쿼리도 같이 들어 있습니다.

- `system_settings` 상태 확인
- `test1`~`test10` 프로필/래더/게시글/신청서/알림/매치 반영 여부 확인
- 테스트 계정별 Discord 우회 적용 상태 확인
- 전체 테스트 데이터 숨김/복구용 update 예시

`.env.local`에 `SUPABASE_SERVICE_ROLE_KEY`를 추가한 뒤:

```bash
npm run seed:test-data
```

스크립트 파일은 `seed-test-data.cjs`이며, 동일한 ID로 `upsert`하므로 다시 실행해도 테스트 데이터가 갱신됩니다.

서비스 롤 키가 함께 설정되어 있으면 테스트 auth 계정도 같이 갱신합니다. 기본 로그인 정보는 다음과 같습니다.

- 로그인 아이디: `test1` ~ `test10`
- 비밀번호: `ByClanTest123!`

`auth.users` 생성 전략은 `AUTH-TEST-ACCOUNT-STRATEGY.md` 문서에 정리했습니다. 핵심은 `auth.users`에 직접 SQL insert 하지 말고, Supabase Dashboard 또는 Service Role 기반 Admin API를 사용해 계정을 만든 뒤 현재 시드와 동일한 UUID로 `profiles`를 맞추는 방식입니다.

Next.js 16과 Tailwind 4 조합에서는 오래된 Node 버전이나 불완전한 `node_modules` 상태에서 빌드가 실패할 수 있습니다.

`Error: Cannot find native binding`

위 오류가 나오면 아래 순서로 다시 설치하세요.

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 .env.local 파일 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 내용을 추가하세요:

```bash
# 개발 서버 접근 비밀번호
DEV_ACCESS_PASSWORD=1990

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://mmsmedvdwmisewngmuka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wOeB902mJJwOtWNa9nmyFA_KaaaHfeK

# 추가 보안 설정 (향후)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# JWT_SECRET=your_jwt_secret
```

## 🔒 보안 강화 단계

### 1단계: 현재 상태
- 비밀번호가 코드에 하드코딩됨
- Supabase 키가 노출됨

### 2단계: 환경변수 분리
- `.env.local` 파일로 민감 정보 이동
- 코드에서 `process.env`로 접근

### 3단계: 프로덕션 환경
- Vercel/호스팅 서비스에서 환경변수 설정
- 서비스 롤 키 사용

## 🚀 적용 방법

1. `.env.local` 파일 생성
2. 위 내용 복사/붙여넣기
3. 개발 서버 재시작: `npm run dev`
4. 비밀번호 변경 시 `.env.local`만 수정

## ⚠️ 주의사항

- `.env.local`은 `.gitignore`에 포함되어 있어 안전
- 절대 GitHub에 올리지 마세요
- 팀원들과는 안전한 방식으로 공유 필요
