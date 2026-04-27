"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  className?: string;
}

export function NavLink({ href, children, exact = false, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-medium transition-colors",
        isActive
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}
