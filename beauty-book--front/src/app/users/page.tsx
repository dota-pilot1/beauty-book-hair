"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { UserTableWithGuard } from "@/features/user-management/UserTable";

export default function UsersPage() {
  return (
    <RequireAuth>
      <AdminShell
        eyebrow="Admin"
        title="유저 관리"
        description="전체 유저 목록을 조회하고 역할 및 활성 상태를 변경할 수 있습니다."
      >
        <UserTableWithGuard />
      </AdminShell>
    </RequireAuth>
  );
}
