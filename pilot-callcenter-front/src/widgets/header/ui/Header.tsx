"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, authActions } from "@/entities/user/model/authStore";

export function Header() {
  const { status, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await authActions.logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight hover:opacity-80">
            Twilio Callcenter
          </Link>
          {status === "authenticated" && (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              대시보드
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {status === "authenticated" ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.username ?? user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link
                href="/register"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                회원가입
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                로그인
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
