This is a Next.js 16 project.

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
