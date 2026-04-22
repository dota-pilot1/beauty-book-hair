"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LoginForm } from "@/features/auth/login/LoginForm";

function LoginPageInner() {
  const { t } = useTranslation("auth");
  const params = useSearchParams();
  const nextParam = params.get("next");
  const nextPath = nextParam ?? undefined;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">{t("signInTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("signInSubtitle")}</p>
        </div>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
