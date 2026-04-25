"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { beautyServiceCategoryApi } from "@/entities/beauty-service-category/api/beautyServiceCategoryApi";
import { BeautyServiceCategorySidebar } from "@/features/beauty-service-management/BeautyServiceCategorySidebar";
import { BeautyServiceTable } from "@/features/beauty-service-management/BeautyServiceTable";

export default function BeautyServicesPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <BeautyServicesAdminPage />
    </RequireRole>
  );
}

function BeautyServicesAdminPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["beauty-service-categories"],
    queryFn: () => beautyServiceCategoryApi.list(),
  });

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  return (
    <AdminShell
      eyebrow="Admin"
      title="시술 관리"
      description="카테고리별 시술 가격과 소요 시간을 관리합니다."
    >
      <section className="grid min-h-[calc(100vh-12rem)] items-start gap-3 lg:grid-cols-[248px_minmax(0,1fr)]">
        <BeautyServiceCategorySidebar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        <BeautyServiceTable
          selectedCategoryId={selectedCategoryId}
          selectedCategory={selectedCategory}
        />
      </section>
    </AdminShell>
  );
}
