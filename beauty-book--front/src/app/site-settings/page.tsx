"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { SiteSettingsForm } from "@/features/site-settings/SiteSettingsForm";

export default function SiteSettingsPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <AdminShell
        eyebrow="Admin"
        title="사이트 설정"
        description="미용실 기본 정보와 소개 영역을 수정합니다."
      >
        <SiteSettingsForm />
      </AdminShell>
    </RequireRole>
  );
}
