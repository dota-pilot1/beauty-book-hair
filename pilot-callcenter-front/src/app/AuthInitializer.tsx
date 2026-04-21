"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authActions, useAuth } from "@/entities/user/model/authStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    authActions.restore();
  }, []);

  useEffect(() => {
    const onLogout = () => {
      authActions.forceAnonymous();
      router.replace("/login");
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [router]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return <>{children}</>;
}
