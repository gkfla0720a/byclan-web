# ByClan Web

ByClan 클랜 공식 홈페이지 — Next.js 16 + React 19 + Supabase

## 📚 개발자 문서

| 문서 | 설명 |
|------|------|
| [docs/CODE-STRUCTURE.md](docs/CODE-STRUCTURE.md) | 전체 코드 구조 및 아키텍처 (텍스트) |
| [📊 docs/VISUAL-DIAGRAMS.md](docs/VISUAL-DIAGRAMS.md) | Mermaid 시각화 다이어그램 (8종) |
| [🖥️ docs/DIAGRAMS-INTERACTIVE.html](docs/DIAGRAMS-INTERACTIVE.html) | 인터랙티브 다이어그램 뷰어 |
| [docs/guides/DATABASE-GUIDE.md](docs/guides/DATABASE-GUIDE.md) | DB 스키마 및 쿼리 가이드 |
| [docs/guides/ENVIRONMENT-SETUP.md](docs/guides/ENVIRONMENT-SETUP.md) | 개발 환경 설정 |
| [docs/guides/MOBILE-GUIDE.md](docs/guides/MOBILE-GUIDE.md) | 모바일 최적화 가이드 |

### 🗺️ 신규 개발자 학습 경로

```text
1. docs/CODE-STRUCTURE.md  → 전체 구조 파악 (텍스트)
2. docs/VISUAL-DIAGRAMS.md → 다이어그램으로 시각화 확인
3. docs/guides/DATABASE-GUIDE.md    → DB 스키마 이해
4. docs/guides/ENVIRONMENT-SETUP.md → 로컬 환경 세팅
```

## 저장소 분류

```text
docs/    → 아키텍처, 가이드, 워크로그 문서
scripts/ → 시드, 모바일 보조, 검증 스크립트
sql/     → 마이그레이션, RLS 정책, Advisor 대응, 운영 쿼리
src/     → 실제 앱 코드
public/  → 정적 자산
```

---

## Getting Started

Use Node.js 22 (see `.nvmrc`) or any Node.js version compatible with the `engines` field in `package.json`.

First, run the development server:

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

If build fails with `Cannot find native binding` from Tailwind, reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.js`. The page auto-updates as you edit the file.

## Codespaces

The repository includes `.devcontainer/devcontainer.json` so GitHub Codespaces uses Node.js 22 and runs `npm install` during setup.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🛠 커밋 컨벤션 (Commit Convention)

이 프로젝트에서는 일관된 커밋 메시지 관리를 위해 아래의 규칙을 따릅니다.

| 타입 (Type) | 의미 (Description) |
| :--- | :--- |
| **feat** | 새로운 기능 추가 |
| **fix** | 버그 수정 |
| **chore** | 빌드 설정, 패키지 매니저 설정, 환경 설정 (코드 수정 없음) |
| **docs** | 문서 수정 (README.md 등) |
| **style** | 코드 포맷팅, 세미콜론 누락 등 (로직 변경 없음) |
| **refactor** | 코드 리팩토링 (기능은 그대로, 구조 개선) |
| **test** | 테스트 코드 추가 및 수정 |
| **perf** | 성능 개선 |

**메시지 형태:** `타입: 요약 내용` (예: `feat: 로그인 API 연동`)