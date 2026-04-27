"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, LayoutGrid, LayoutList, UserRound } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { staffApi } from "@/entities/staff/api/staffApi";

export default function DesignersPage() {
  const [viewMode, setViewMode] = useState<"list" | "card">("card");

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff-public"],
    queryFn: () => staffApi.list(),
  });

  const designers = staffList.filter((s) => s.role === "DESIGNER" && s.active);

  const toggle = (
    <div className="flex h-8 items-stretch rounded-md border border-border overflow-hidden">
      <button
        onClick={() => setViewMode("list")}
        className={`flex items-center px-2.5 transition-colors ${
          viewMode === "list"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        title="목록 뷰"
      >
        <LayoutList className="h-4 w-4" />
      </button>
      <div className="w-px bg-border" />
      <button
        onClick={() => setViewMode("card")}
        className={`flex items-center px-2.5 transition-colors ${
          viewMode === "card"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        title="카드 뷰"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <RequireAuth>
      <CustomerShell
        eyebrow="Designers"
        title="디자이너 선택이 필요한 예약 흐름을 위한 공간입니다."
        description="디자이너 선택이 필요한 서비스라면 전문 분야와 가장 빠른 가능 시간을 함께 보여주는 구조가 가장 실용적입니다."
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "불러오는 중..." : `총 ${designers.length}명`}
          </p>
          {toggle}
        </div>

        {isLoading ? (
          <div className={viewMode === "card" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : designers.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">등록된 디자이너가 없습니다.</p>
        ) : viewMode === "list" ? (
          <section className="space-y-4">
            {designers.map((designer) => (
              <article key={designer.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {designer.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={designer.profileImageUrl} alt={designer.name} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{designer.name}</h2>
                      {designer.introduction && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <BadgeCheck className="h-4 w-4 shrink-0" />
                          {designer.introduction}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        예약 가능 여부는 예약 페이지에서 확인하세요
                      </p>
                    </div>
                  </div>
                  <button type="button" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                    이 디자이너로 예약하기
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designers.map((designer) => (
              <article key={designer.id} className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
                  {designer.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={designer.profileImageUrl} alt={designer.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="inline-flex rounded-full bg-background p-5 shadow-sm">
                      <UserRound className="h-10 w-10 text-muted-foreground" />
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="text-base font-semibold">{designer.name}</h2>
                  {designer.introduction && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 shrink-0" />
                      {designer.introduction}
                    </p>
                  )}
                  <button
                    type="button"
                    className="mt-auto rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    이 디자이너로 예약하기
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </CustomerShell>
    </RequireAuth>
  );
}
