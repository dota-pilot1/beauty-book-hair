"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { RolePermissionManager } from "@/features/role-management/RolePermissionManager";

export default function RolePermissionsPage() {
  return (
    <RequireAuth>
      <main className="w-full px-2 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">역할-권한 매핑</h1>
          <p className="text-sm text-muted-foreground mt-1">
            역할을 선택하고 해당 역할에 허용할 권한을 설정하세요.
          </p>
        </header>
        <RolePermissionManager />
      </main>
    </RequireAuth>
  );
}
