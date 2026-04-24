"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequireRole } from "@/widgets/guards/RequireRole";
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
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/20 px-4 py-4">
      <header className="mx-auto mb-3 flex w-full max-w-[1600px] items-center justify-between rounded-md border border-border bg-background px-4 py-3 shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase text-primary">BeautyBook</p>
          <h1 className="text-lg font-semibold">시술 관리</h1>
        </div>
        <p className="hidden text-sm text-muted-foreground md:block">
          카테고리별 시술 가격과 소요 시간을 관리합니다.
        </p>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-[1600px] items-start gap-3 lg:grid-cols-[248px_minmax(0,1fr)]">
        <BeautyServiceCategorySidebar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        <BeautyServiceTable
          selectedCategoryId={selectedCategoryId}
          selectedCategory={selectedCategory}
        />
      </section>
    </main>
  );
}
