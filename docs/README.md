# ByClan Web

ByClan 클랜 공식 홈페이지 — Next.js + React + Supabase

### 🗄️ Supabase 데이터베이스 연동 및 타입스크립트 지원

이 프로젝트는 데이터베이스와의 통신을 위해 `@supabase/supabase-js` 클라이언트를 사용하며, **자동 생성된 정적 타입(`Database`)을 적용하여 안전하게 개발할 수 있도록 구성**되어 있습니다.

- **핵심 클라이언트:** `src/supabase.ts` (DB 쿼리 시 이 파일의 `supabase` 객체를 import 합니다)
- **타입 정의 파일:** `src/types/supabase.ts` (Supabase CLI로 자동 생성된 파일)

#### 🔄 DB 스키마가 변경되었을 때 (타입 동기화 방법)

데이터베이스에 새로운 테이블, 컬럼, 새로운 Role(권한) 등이 추가되거나 변경되었다면, 수동으로 코드를 고치지 말고 아래 명령어를 터미널에 입력하여 타입을 최신화하세요.

1. **로그인 (최초 1회):**
   ```bash
   npx supabase login

2. **타입 자동 생성 업데이트**
  npx supabase gen types typescript --project-id mmsmedvdwmisewngmuka --schema public > src/types/supabase.ts