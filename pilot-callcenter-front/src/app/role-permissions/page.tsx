"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { RolePermissionManager } from "@/features/role-management/RolePermissionManager";

export default function RolePermissionsPage() {
  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-3">
          <h1 className="text-xl font-bold tracking-tight">권한 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            역할별 권한을 설정하고, 유저 롤을 한 화면에서 관리하세요.
          </p>
        </header>
        <RolePermissionManager />
      </main>
    </RequireAuth>
  );
}
