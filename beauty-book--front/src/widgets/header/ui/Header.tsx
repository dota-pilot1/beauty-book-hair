"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth, authActions } from "@/entities/user/model/authStore";
import { RoleBadge } from "@/features/user-management/RoleBadge";
import { NavLink } from "@/shared/ui/NavLink";
import { ThemeSwitcher } from "@/shared/ui/theme/ThemeSwitcher";
import { LanguageSelect } from "@/shared/ui/LanguageSelect";

function UserAvatar({ name }: { name: string }) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold select-none">
      {initials}
    </span>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
      />
    </svg>
  );
}

function AdminDropdown() {
  const { t } = useTranslation("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isActive =
    pathname.startsWith("/users") ||
    pathname.startsWith("/role-permissions") ||
    pathname.startsWith("/site-settings");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm transition-colors ${
          isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {t("admin")}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-44 rounded-lg border border-border bg-background shadow-lg z-50 py-1 overflow-hidden">
          <Link
            href="/users"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {t("users")}
          </Link>
          <Link
            href="/role-permissions"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {t("rolePermissions")}
          </Link>
          <Link
            href="/site-settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {t("siteSettings")}
          </Link>
        </div>
      )}
    </div>
  );
}

function UserDropdown({ displayName, user }: { displayName: string; user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const { t } = useTranslation("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 hover:bg-muted transition-colors"
      >
        <UserAvatar name={displayName} />
        <span className="text-sm font-medium leading-none text-foreground">{displayName}</span>
        {user.role && (
          <>
            <span className="h-3.5 w-px bg-border/80" />
            <RoleBadge role={user.role} />
          </>
        )}
        <svg
          className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-border bg-background shadow-lg z-50 py-1 overflow-hidden">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {t("profile")}
          </Link>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useTranslation("nav");
  const { status, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await authActions.logout();
    router.replace("/login");
  };

  const displayName = user?.username ?? user?.email ?? "?";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 w-full items-center justify-between px-4">
        {/* Left: logo + nav */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            BeautyBook
          </Link>
          {status === "authenticated" && (
            <>
              <NavLink href="/dashboard" exact>
                {t("dashboard")}
              </NavLink>
              <AdminDropdown />
            </>
          )}
        </nav>

        {/* Right: user info + actions */}
        <div className="flex items-center gap-2">
          <LanguageSelect />
          <ThemeSwitcher />
          {status === "authenticated" ? (
            <>
              {user && <UserDropdown displayName={displayName} user={user} />}
              {/* Logout — ghost */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogoutIcon />
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-foreground hover:bg-muted transition-colors"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground ring-2 ring-background shadow-sm">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
                <span className="hidden sm:inline text-sm font-medium leading-none">
                  {t("register")}
                </span>
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 ring-2 ring-primary-foreground/10">
                  <LogIn className="h-3.5 w-3.5" />
                </span>
                <span className="hidden sm:inline text-sm font-medium leading-none">
                  {t("login")}
                </span>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
