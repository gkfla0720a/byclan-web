// 파일명: (main)/layout.jsx

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * MainLayout - 메인 레이아웃 컴포넌트
 * @param {React.ReactNode} children - 이 레이아웃 안에 렌더링될 하위 페이지 컴포넌트
 */

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
