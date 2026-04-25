"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authActions, authStore, useAuth } from "@/entities/user/model/authStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPathname =
    pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;

  useEffect(() => {
    if (normalizedPathname === "/login") {
      authStore.setState((s) => (s.status === "idle" ? { ...s, status: "anonymous" } : s));
      return;
    }
    authActions.restore();
  }, [normalizedPathname]);

  useEffect(() => {
    const onLogout = () => {
      if (authStore.state.status === "authenticated") {
        return;
      }
      authActions.forceAnonymous();
      if (normalizedPathname !== "/login") {
        router.replace("/login");
      }
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [normalizedPathname, router]);

  return <>{children}</>;
}
