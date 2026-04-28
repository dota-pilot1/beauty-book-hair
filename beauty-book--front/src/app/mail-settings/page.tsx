"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { MailSettingsForm } from "@/features/site-settings/MailSettingsForm";

export default function MailSettingsPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <AdminShell
        eyebrow="Admin"
        title="메일 관리"
        description="예약 알림 메일 수신 정보를 관리합니다."
      >
        <MailSettingsForm />
      </AdminShell>
    </RequireRole>
  );
}
