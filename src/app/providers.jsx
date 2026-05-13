// 파일명: src/app/providers.jsx

"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ToastContainer";

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}