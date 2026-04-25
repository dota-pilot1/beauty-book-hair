"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { api } from "@/shared/api/axios";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type BusinessHourItem = {
  id: number;
  dayOfWeek: DayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

type BusinessHourRow = {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  closed: boolean;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "월요일",
  TUESDAY: "화요일",
  WEDNESDAY: "수요일",
  THURSDAY: "목요일",
  FRIDAY: "금요일",
  SATURDAY: "토요일",
  SUNDAY: "일요일",
};

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DEFAULT_ROW: Omit<BusinessHourRow, "dayOfWeek"> = {
  openTime: "10:00",
  closeTime: "20:00",
  closed: false,
};

function toHHMM(time: string | null) {
  if (!time) return "10:00";
  return time.slice(0, 5);
}

export default function SchedulePage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <AdminShell
        eyebrow="Admin"
        title="영업시간 관리"
        description="요일별 매장 영업시간을 설정합니다. 휴무일로 지정하면 해당 요일에 예약이 불가능해집니다."
      >
        <BusinessHoursForm />
      </AdminShell>
    </RequireRole>
  );
}

function BusinessHoursForm() {
  const queryClient = useQueryClient();

  const { data: serverData = [] } = useQuery<BusinessHourItem[]>({
    queryKey: ["admin-business-hours"],
    queryFn: () =>
      api.get<BusinessHourItem[]>("/api/admin/schedules/business-hours").then((r) => r.data),
  });

  const [rows, setRows] = useState<BusinessHourRow[]>(() =>
    ALL_DAYS.map((d) => ({ dayOfWeek: d, ...DEFAULT_ROW }))
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (serverData.length === 0) return;
    setRows(
      ALL_DAYS.map((d) => {
        const item = serverData.find((h) => h.dayOfWeek === d);
        return {
          dayOfWeek: d,
          openTime: toHHMM(item?.openTime ?? null),
          closeTime: toHHMM(item?.closeTime ?? null),
          closed: item?.closed ?? false,
        };
      })
    );
  }, [serverData]);

  const update = (day: DayOfWeek, patch: Partial<BusinessHourRow>) => {
    setSaved(false);
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
  };

  const mutation = useMutation({
    mutationFn: () =>
      api.put("/api/admin/schedules/business-hours", {
        businessHours: rows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          openTime: r.closed ? null : r.openTime + ":00",
          closeTime: r.closed ? null : r.closeTime + ":00",
          closed: r.closed,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-business-hours"] });
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      setSaved(true);
    },
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">요일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">오픈 시간</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">마감 시간</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">휴무</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.dayOfWeek}
                className={[
                  "transition-colors",
                  i !== rows.length - 1 ? "border-b border-border" : "",
                  row.closed ? "bg-muted/30" : "",
                ].join(" ")}
              >
                <td className="px-4 py-3 font-medium">
                  <span
                    className={[
                      "text-sm",
                      row.dayOfWeek === "SATURDAY" ? "text-blue-600" : "",
                      row.dayOfWeek === "SUNDAY" ? "text-rose-600" : "",
                    ].join(" ")}
                  >
                    {DAY_LABELS[row.dayOfWeek]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={row.openTime}
                    disabled={row.closed}
                    onChange={(e) => update(row.dayOfWeek, { openTime: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={row.closeTime}
                    disabled={row.closed}
                    onChange={(e) => update(row.dayOfWeek, { closeTime: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={row.closed}
                    onClick={() => update(row.dayOfWeek, { closed: !row.closed })}
                    className={[
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                      row.closed ? "bg-rose-500" : "bg-muted",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        row.closed ? "translate-x-6" : "translate-x-1",
                      ].join(" ")}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "저장 중..." : "저장"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">영업시간이 저장됐습니다.</span>
        )}
        {mutation.isError && (
          <span className="text-sm text-rose-600 font-medium">저장에 실패했습니다.</span>
        )}
      </div>
    </div>
  );
}
