'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImprovedAuthForm from '../components/ImprovedAuthForm';
import { useAuthContext } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, handleAuthSuccess } = useAuthContext();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4 relative z-10">
      <ImprovedAuthForm
        onSuccess={(u) => {
          handleAuthSuccess(u);
          router.replace('/');
        }}
      />
      <button
        onClick={() => router.back()}
        className="mt-4 text-gray-500 hover:text-gray-300 text-sm underline"
      >
        ← 돌아가기
      </button>
    </div>
  );
}
