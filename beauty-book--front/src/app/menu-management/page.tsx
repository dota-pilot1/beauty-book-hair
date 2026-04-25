"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { MenuTreeTab } from "@/features/menu-management/MenuTreeTab";

export default function MenuManagementPage() {
  return (
    <RequireAuth>
      <AdminShell
        eyebrow="Admin"
        title="메뉴 관리"
        description="헤더 메뉴를 추가·수정·삭제하고 드래그로 순서를 변경합니다."
      >
        <MenuTreeTab />
      </AdminShell>
    </RequireAuth>
  );
}
