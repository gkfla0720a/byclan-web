import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ToastContainer";

export const metadata = {
  title: "ByClan NET – 스타크래프트 빠른무한 클랜",
  description: "ByClan 클랜 공식 홈페이지. 래더 시스템, 토너먼트, 클랜원 커뮤니티.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#06060a] text-gray-200">
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
            <ToastContainer />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
