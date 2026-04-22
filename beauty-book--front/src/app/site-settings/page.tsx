"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { SiteSettingsForm } from "@/features/site-settings/SiteSettingsForm";

export default function SiteSettingsPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">메인 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            로그인/회원가입 화면에 노출되는 대문 이미지와 소개 문구를 관리합니다.
          </p>
        </header>
        <SiteSettingsForm />
      </main>
    </RequireRole>
  );
}
