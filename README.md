# ByClan Web

ByClan 클랜 공식 홈페이지 — Next.js 16 + React 19 + Supabase

## 📚 개발자 문서

| 문서 | 설명 |
|------|------|
| [CODE-STRUCTURE.md](CODE-STRUCTURE.md) | 전체 코드 구조 및 아키텍처 (텍스트) |
| [📊 docs/VISUAL-DIAGRAMS.md](docs/VISUAL-DIAGRAMS.md) | Mermaid 시각화 다이어그램 (8종) |
| [🖥️ docs/DIAGRAMS-INTERACTIVE.html](docs/DIAGRAMS-INTERACTIVE.html) | 인터랙티브 다이어그램 뷰어 |
| [DATABASE-GUIDE.md](DATABASE-GUIDE.md) | DB 스키마 및 쿼리 가이드 |
| [ENVIRONMENT-SETUP.md](ENVIRONMENT-SETUP.md) | 개발 환경 설정 |
| [MOBILE-GUIDE.md](MOBILE-GUIDE.md) | 모바일 최적화 가이드 |

### 🗺️ 신규 개발자 학습 경로

```text
1. CODE-STRUCTURE.md       → 전체 구조 파악 (텍스트)
2. docs/VISUAL-DIAGRAMS.md → 다이어그램으로 시각화 확인
3. DATABASE-GUIDE.md       → DB 스키마 이해
4. ENVIRONMENT-SETUP.md    → 로컬 환경 세팅
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
