"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { api } from "@/shared/api/axios";

// ── 타입 ──────────────────────────────────────────────────────────────────────

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

type BlockedTimeType =
  | "STORE_CLOSED"
  | "DESIGNER_OFF"
  | "LUNCH"
  | "EDUCATION"
  | "PERSONAL"
  | "ETC";

type BlockedTimeItem = {
  id: number;
  staffId: number | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  blockType: BlockedTimeType;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────

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

const BLOCK_TYPE_LABELS: Record<BlockedTimeType, string> = {
  STORE_CLOSED: "매장 휴무",
  DESIGNER_OFF: "디자이너 휴무",
  LUNCH: "점심 시간",
  EDUCATION: "교육",
  PERSONAL: "개인 사정",
  ETC: "기타",
};

const DEFAULT_ROW: Omit<BusinessHourRow, "dayOfWeek"> = {
  openTime: "10:00",
  closeTime: "20:00",
  closed: false,
};

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function toHHMM(time: string | null) {
  if (!time) return "10:00";
  return time.slice(0, 5);
}

function toKST(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
  return { start, end };
}

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [tab, setTab] = useState<"hours" | "blocked">("hours");

  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <AdminShell
        eyebrow="Admin"
        title="영업시간 관리"
        description="요일별 매장 영업시간을 설정하고, 특정 날짜의 예약 차단 시간을 관리합니다."
      >
        {/* 탭 */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
          {(
            [
              { key: "hours", label: "영업시간" },
              { key: "blocked", label: "예약 차단 시간" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "hours" ? <BusinessHoursForm /> : <BlockedTimeSection />}
      </AdminShell>
    </RequireRole>
  );
}

// ── 영업시간 폼 ───────────────────────────────────────────────────────────────

function BusinessHoursForm() {
  const queryClient = useQueryClient();

  const { data: serverData = [] } = useQuery<BusinessHourItem[]>({
    queryKey: ["admin-business-hours"],
    queryFn: () =>
      api
        .get<BusinessHourItem[]>("/api/admin/schedules/business-hours")
        .then((r) => r.data),
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
    setRows((prev) =>
      prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r))
    );
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
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                요일
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                오픈 시간
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                마감 시간
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                휴무
              </th>
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
                    onChange={(e) =>
                      update(row.dayOfWeek, { openTime: e.target.value })
                    }
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={row.closeTime}
                    disabled={row.closed}
                    onChange={(e) =>
                      update(row.dayOfWeek, { closeTime: e.target.value })
                    }
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={row.closed}
                    onClick={() =>
                      update(row.dayOfWeek, { closed: !row.closed })
                    }
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
          <span className="text-sm text-emerald-600 font-medium">
            영업시간이 저장됐습니다.
          </span>
        )}
        {mutation.isError && (
          <span className="text-sm text-rose-600 font-medium">
            저장에 실패했습니다.
          </span>
        )}
      </div>
    </div>
  );
}

// ── 예약 차단 시간 섹션 ───────────────────────────────────────────────────────

function BlockedTimeSection() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { start, end } = monthRange(year, month);

  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<BlockedTimeItem[]>({
    queryKey: ["admin-blocked-times", year, month],
    queryFn: () =>
      api
        .get<BlockedTimeItem[]>("/api/admin/schedules/blocked-times", {
          params: { startAt: start, endAt: end },
        })
        .then((r) => r.data),
  });

  // 생성 폼 상태
  const [form, setForm] = useState({
    startAt: "",
    endAt: "",
    reason: "",
    blockType: "STORE_CLOSED" as BlockedTimeType,
  });
  const [formError, setFormError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/admin/schedules/blocked-times", {
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        reason: form.reason || null,
        blockType: form.blockType,
        staffId: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-times"] });
      setForm({ startAt: "", endAt: "", reason: "", blockType: "STORE_CLOSED" });
      setFormError("");
    },
    onError: () => setFormError("생성에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/admin/schedules/blocked-times/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-times"] }),
  });

  function handleCreate() {
    if (!form.startAt || !form.endAt) {
      setFormError("시작/종료 시간을 입력해주세요.");
      return;
    }
    if (new Date(form.startAt) >= new Date(form.endAt)) {
      setFormError("종료 시간이 시작 시간보다 나중이어야 합니다.");
      return;
    }
    setFormError("");
    createMutation.mutate();
  }

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="space-y-6">
      {/* 생성 폼 */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">차단 시간 추가</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">시작 시간</span>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, startAt: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">종료 시간</span>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, endAt: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">차단 유형</span>
            <select
              value={form.blockType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  blockType: e.target.value as BlockedTimeType,
                }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {(Object.keys(BLOCK_TYPE_LABELS) as BlockedTimeType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {BLOCK_TYPE_LABELS[t]}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">사유 (선택)</span>
            <input
              type="text"
              value={form.reason}
              placeholder="예: 정기 청소, 교육 일정"
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? "추가 중..." : "차단 시간 추가"}
          </button>
          {formError && (
            <span className="text-sm text-rose-600">{formError}</span>
          )}
          {createMutation.isSuccess && (
            <span className="text-sm text-emerald-600 font-medium">
              추가됐습니다.
            </span>
          )}
        </div>
      </div>

      {/* 월 네비게이션 + 목록 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            ‹ 이전
          </button>
          <span className="text-sm font-semibold">
            {year}년 {month}월
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            다음 ›
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
            불러오는 중...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            이 달에 등록된 차단 시간이 없습니다.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    시작
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    종료
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    유형
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    사유
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    className={[
                      "transition-colors hover:bg-muted/20",
                      i !== items.length - 1 ? "border-b border-border" : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 text-foreground">
                      {toKST(item.startAt)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {toKST(item.endAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                        {BLOCK_TYPE_LABELS[item.blockType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.reason ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
