"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function ProtectedRoute({ children, allowVisitor = false, fallback = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, authLoading } = useAuthContext();
  const isVisitor = profile?.role === "visitor";
  const isAllowed = Boolean(user) && (allowVisitor || !isVisitor);

  useEffect(() => {
    if (authLoading || isAllowed || user) return;
    const redirect = encodeURIComponent(pathname || "/");
    router.replace(`/login?redirect=${redirect}`);
  }, [authLoading, isAllowed, pathname, router, user]);

  if (authLoading) {
    return (
      fallback || (
        <div className="w-full flex justify-center py-20">
          <span className="text-cyan-500/50 font-mono animate-pulse font-bold text-sm">
            [ AUTHENTICATING... ]
          </span>
        </div>
      )
    );
  }

  if (!isAllowed) return fallback;
  return children;
}
