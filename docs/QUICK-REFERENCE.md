# ⚡ 빠른 참조 가이드

개발 중 자주 찾게 되는 정보를 한곳에 모았습니다.

> 📎 관련 문서: [아키텍처 다이어그램](./ARCHITECTURE-DIAGRAMS.md) | [학습 로드맵](./LEARNING-ROADMAP.md)

---

## 1️⃣ 권한 매트릭스

| 권한 키 | developer | master | admin | elite | associate/member | rookie | applicant | visitor |
|--------|:---------:|:------:|:-----:|:-----:|:----------------:|:------:|:---------:|:-------:|
| `system.admin` | ✅ | | | | | | | |
| `database.modify` | ✅ | | | | | | | |
| `code.deploy` | ✅ | | | | | | | |
| `user.manage_all` | ✅ | | | | | | | |
| `clan.admin_all` | ✅ | | | | | | | |
| `clan.admin` | | ✅ | | | | | | |
| `member.approve` | ✅ | | ✅ | ✅ | | | | |
| `member.manage` | ✅ | ✅ | ✅ | | | | | |
| `master.delegate` | ✅ | ✅ | | | | | | |
| `tournament.create` | | ✅ | | | | | | |
| `tournament.join` | | | | ✅ | | | | |
| `ladder.admin` | | ✅ | | | | | | |
| `ladder.moderate` | | | ✅ | | | | | |
| `ladder.play` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | | |
| `match.manage` | | | ✅ | | | | | |
| `match.host` | | | | ✅ | | | | |
| `match.join` | | | | | ✅ | | | |
| `match.view` | | | | | | ✅ | ✅ | ✅ |
| `announcement.post` | | ✅ | | | | | | |
| `announcement.edit` | | | ✅ | | | | | |
| `community.post` | | | | | ✅ | | | |
| `community.view` | | | | | | ✅ | ✅ | ✅ |
| `community.comment` | | | | | ✅ | | | |
| `profile.edit` | | | | | ✅ | | | |
| `profile.view` | | | | | | ✅ | ✅ | ✅ |
| `member.mentor` | | | | ✅ | | | | |
| `member.test` | | ✅ | ✅ | | | | | |
| `application.submit` | | | | | | | | ✅ |
| `application.track` | | | | | | | ✅ | |

> ⚠️ developer 역할은 `DEV_SETTINGS`로 일부 권한을 제한할 수 있습니다.

---

## 2️⃣ 역할 레벨 빠른 참조

| 역할 | 레벨 | 아이콘 | 설명 |
|------|------|--------|------|
| `developer` | 100 | 👨‍💻 | 시스템 개발 및 유지보수 |
| `master` | 90 | 👑 | 클랜 총괄 운영 |
| `admin` | 80 | 🛡️ | 클랜 일반 운영 |
| `elite` | 60 | ⭐ | 클랜 경험 멤버 |
| `associate` | 50 | 🛡️ | 테스트 신청자 |
| `member` | 50 | 🛡️ | 정식 멤버 |
| `rookie` | 35 | 🆕 | 신입 길드원 |
| `applicant` | 25 | 📝 | 가입 신청자 |
| `visitor` | 10 | 👤 | 비로그인 방문자 |

---

## 3️⃣ 라우팅 매핑 (URL ↔ 한국어 이름)

| 한국어 이름 | URL | 라우트 그룹 |
|----------|-----|----------|
| `Home` | `/` | (main) |
| `개요` | `/overview` | (main)/(sidebar) |
| `클랜원` | `/members` | (main)/(sidebar) |
| `가입안내` / `가입신청` | `/join` | (main)/(sidebar) |
| `정회원 전환신청` | `/join/transfer` | (main)/(sidebar) |
| `공지사항` / `BSL 공지사항` / `토너먼트 공지` | `/notice` | (main)/(sidebar) |
| `자유게시판` / `클랜원 소식` | `/community` | (main)/(sidebar) |
| `랭킹` / `시즌별 랭킹` | `/ranking` | (main)/(sidebar) |
| `대시보드` / `BY래더시스템` | `/ladder` | (main)/(sidebar) |
| `BSL 경기일정 및 결과` / `진행중인 토너먼트` | `/tournament` | (main)/(sidebar) |
| `경기 영상` / `사진 갤러리` | `/media` | (main)/(sidebar) |
| `경기기록` | `/matches` | (main)/(sidebar) |
| `가입 심사` | `/admin/applications` | (main)/admin |
| `관리자` / `운영진게시판` | `/admin` | (main)/admin |
| `길드원 관리` | `/admin/guild` | (main)/admin |
| `개발자` | `/developer` | (main) |
| `프로필` | `/profile` | (main) |
| `알림` | `/notifications` | (main) |
| `로그인` | `/login` | (main) |

> 📘 useNavigate.js의 `VIEW_TO_PATH` 기준 — 새 페이지 추가 시 여기에 먼저 등록하세요.

---

## 4️⃣ 주요 훅 사용법

### useAuthContext()

```typescript
import { useAuthContext } from '@/app/context/AuthContext';

const {
  user,              // Supabase User 객체 (미로그인 시 null)
  profile,           // UserProfile 객체 (미로그인 시 null)
  authLoading,       // 인증 초기화 중 여부 (boolean)
  authError,         // 오류 메시지 (string | null, 4초 후 자동 삭제)
  needsSetup,        // 프로필 설정 필요 여부 (boolean)
  getPermissions,    // 권한 객체 반환 함수
  reloadProfile,     // DB에서 최신 프로필 다시 로드
  handleAuthSuccess, // 로그인 성공 처리
  handleSetupComplete, // 프로필 설정 완료 처리
  setIsAuthorized,   // HomeGate 인증 상태 설정
} = useAuthContext();
```

### getPermissions()

```javascript
const permissions = getPermissions();

// 불리언 속성 (can 객체)
permissions.can.playLadder       // 래더 참여 가능 여부
permissions.can.approveMembers   // 가입 심사 가능 여부
permissions.can.manageMembers    // 멤버 관리 가능 여부
permissions.can.postAnnouncement // 공지 게시 가능 여부
permissions.can.adminSystem      // 시스템 관리 가능 여부
permissions.can.hostMatch        // 매치 개최 가능 여부
permissions.can.joinMatch        // 매치 참여 가능 여부
permissions.can.editProfile      // 프로필 수정 가능 여부
permissions.can.mentorMembers    // 멘토링 가능 여부
permissions.can.deployCode       // 코드 배포 가능 여부

// 메서드
permissions.hasPermission('ladder.play')  // 특정 권한 키 확인
permissions.hasLevel(80)                  // 최소 레벨 확인 (admin 이상)
permissions.isInGroup('admin_group')      // 역할 그룹 확인
permissions.canAccessMenu('/admin')       // 메뉴 접근 가능 여부
```

### useNavigate()

```javascript
import { useNavigate } from '@/app/hooks/useNavigate';

const navigateTo = useNavigate();

navigateTo('랭킹');       // → /ranking
navigateTo('대시보드');    // → /ladder
navigateTo('관리자');      // → /admin
navigateTo('프로필');      // → /profile
```

### useToast()

```javascript
import { useToast } from '@/app/context/ToastContext';

const toast = useToast();

toast.success('저장 완료!');
toast.error('오류가 발생했습니다.');
toast.info('알림: 새 메시지가 있습니다.');
```

---

## 5️⃣ 컴포넌트 임포트 경로

```javascript
// Context Hooks
import { useAuthContext } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';

// Custom Hooks
import { useNavigate } from '@/app/hooks/useNavigate';

// Utilities
import { PermissionChecker, ROLE_PERMISSIONS, loadDevSettings } from '@/app/utils/permissions';
import logger, { Severity } from '@/app/utils/errorLogger';
import { withRetry, isRetryableError } from '@/app/utils/retry';

// Components
import { SectionErrorBoundary } from '@/app/components/ErrorBoundary';
import ToastContainer from '@/app/components/ToastContainer';

// Supabase Client
import { supabase, isSupabaseConfigured } from '@/supabase';
```

---

## 6️⃣ localStorage / sessionStorage 키 목록

| 키 | 스토리지 | 타입 | 설명 |
|----|---------|------|------|
| `byclan_home_gate` | sessionStorage | string | HomeGate 인증 상태 |
| `byclan_dev_settings` | localStorage | JSON | 개발자 설정 객체 |
| `byclan_dev_mode` | localStorage | string | 개발 모드 플래그 |
| `byclan_test_account_setting` | localStorage | JSON | 테스트 계정 설정 |

---

## 7️⃣ 자주 사용하는 권한 확인 패턴

```javascript
const { profile, getPermissions } = useAuthContext();
const permissions = getPermissions();
const role = profile?.role;

// ── 역할 직접 확인 ──
const isDeveloper    = role === 'developer';
const isMaster       = role === 'master';
const isAdmin        = role === 'admin';
const isElite        = role === 'elite';
const isApplicant    = role === 'applicant';
const isVisitor      = !profile || role === 'visitor';

// ── 역할 그룹 확인 ──
const isAdminOrHigher  = ['developer', 'master', 'admin'].includes(role);
const isEliteOrHigher  = ['developer', 'master', 'admin', 'elite'].includes(role);
const isMemberOrHigher = ['developer', 'master', 'admin', 'elite', 'associate', 'member', 'rookie'].includes(role);

// ── 레벨 비교 ──
const canManage   = permissions.hasLevel(80);  // admin(80) 이상
const canApprove  = permissions.hasLevel(60);  // elite(60) 이상
const isMemberUp  = permissions.hasLevel(35);  // rookie(35) 이상

// ── 기능별 확인 ──
const canPlayLadder = permissions.can.playLadder;  // 래더 참여
const canApproveApp = permissions.can.approveMembers;  // 가입 심사
```

---

## 8️⃣ 에러 처리 패턴

```javascript
import { withRetry, isRetryableError } from '@/app/utils/retry';
import logger, { Severity } from '@/app/utils/errorLogger';
import { useToast } from '@/app/context/ToastContext';

// 기본 패턴
const toast = useToast();

async function fetchData() {
  try {
    const result = await withRetry(async () => {
      const { data, error } = await supabase.from('profiles').select();
      if (error) throw error;
      return data;
    });
    return result;
  } catch (err) {
    logger(Severity.ERROR, 'fetchData', err);
    toast.error('데이터를 불러오지 못했습니다.');
    return null;
  }
}
```

---

## 9️⃣ 새 페이지 추가 체크리스트

```
1. [ ] src/app/(main)/(sidebar)/[route]/page.js 생성
2. [ ] src/app/pages/[PageName].js 생성 (실제 콘텐츠)
3. [ ] useNavigate.js VIEW_TO_PATH에 한국어 이름 → URL 추가
4. [ ] Header.js 또는 Sidebar.js 메뉴에 항목 추가
5. [ ] 권한 체크: getPermissions() 또는 hasLevel() 적용
6. [ ] 에러 처리: SectionErrorBoundary 감싸기
7. [ ] DB 접근 시: withRetry() + try-catch 적용
8. [ ] 파일 상단 JSDoc 블록 작성
```
