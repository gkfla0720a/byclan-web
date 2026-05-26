// 파일명: (main)/layout.tsx

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
        <main 
          id="main-content"
          role="main"
          className="grow w-full mx-auto px-4 sm:px-8 mb-10 mt-6 relative z-10 flex flex-col"
        >
          {children}
        </main>
      <Footer />
    </>
  );
}
