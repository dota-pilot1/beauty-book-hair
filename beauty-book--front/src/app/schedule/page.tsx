"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, AlertCircle, X } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { api } from "@/shared/api/axios";
import type { Reservation } from "@/entities/reservation/model/types";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

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
  | "STORE_CLOSED" | "DESIGNER_OFF" | "LUNCH"
  | "EDUCATION" | "PERSONAL" | "ETC";

type BlockedTimeItem = {
  id: number;
  staffId: number | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  blockType: BlockedTimeType;
};

type RecurringBlockedTimeItem = {
  id: number;
  staffId: number | null;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  blockType: BlockedTimeType;
  reason: string | null;
  active: boolean;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "월요일", TUESDAY: "화요일", WEDNESDAY: "수요일", THURSDAY: "목요일",
  FRIDAY: "금요일", SATURDAY: "토요일", SUNDAY: "일요일",
};

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

const BLOCK_TYPE_LABELS: Record<BlockedTimeType, string> = {
  STORE_CLOSED: "🚪 매장 휴무", DESIGNER_OFF: "💆 디자이너 휴무", LUNCH: "🍱 점심 시간",
  EDUCATION: "📚 교육", PERSONAL: "🙏 개인 사정", ETC: "📌 기타",
};

const BLOCK_TYPE_BADGE_CLASS: Record<BlockedTimeType, string> = {
  STORE_CLOSED: "bg-slate-100 text-slate-700",
  DESIGNER_OFF: "bg-blue-100 text-blue-700",
  LUNCH: "bg-amber-100 text-amber-700",
  EDUCATION: "bg-purple-100 text-purple-700",
  PERSONAL: "bg-green-100 text-green-700",
  ETC: "bg-gray-100 text-gray-600",
};

const DEFAULT_ROW: Omit<BusinessHourRow, "dayOfWeek"> = {
  openTime: "10:00", closeTime: "20:00", closed: false,
};

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function toHHMM(time: string | null) {
  if (!time) return "10:00";
  return time.slice(0, 5);
}

function toKST(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function isoToLocalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).replace(/\. /g, "-").replace(".", "").trim();
}

function toApiDate(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
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
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
          {([
            { key: "hours", label: "영업시간" },
            { key: "blocked", label: "예약 차단 시간" },
          ] as const).map(({ key, label }) => (
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

        {tab === "hours" ? (
          <div className="space-y-8">
            <BusinessHoursForm />
            <RecurringBlockedTimeSection />
          </div>
        ) : (
          <BlockedTimeSection />
        )}
      </AdminShell>
    </RequireRole>
  );
}

// ── 요일 매핑 (JS getDay → DayOfWeek) ────────────────────────────────────────

const JS_TO_DOW: Record<number, DayOfWeek> = {
  0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
  4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
};

type PendingReservation = {
  id: number;
  status: string;
  startAt: string;
  endAt: string;
  customerName: string | null;
  customerPhone: string | null;
  staffName: string | null;
  beautyServiceName: string | null;
  customerMemo: string | null;
};

// ── 영업시간 폼 ───────────────────────────────────────────────────────────────

function BusinessHoursForm() {
  const queryClient = useQueryClient();

  const { data: serverData = [] } = useQuery<BusinessHourItem[]>({
    queryKey: ["admin-business-hours"],
    queryFn: () =>
      api.get<BusinessHourItem[]>("/api/admin/schedules/business-hours").then((r) => r.data),
  });

  const { data: pendingAll = [] } = useQuery<PendingReservation[]>({
    queryKey: ["admin-reservations-upcoming"],
    queryFn: () => api.get<PendingReservation[]>("/api/reservations/upcoming").then((r) => r.data),
  });

  const [rows, setRows] = useState<BusinessHourRow[]>(() =>
    ALL_DAYS.map((d) => ({ dayOfWeek: d, ...DEFAULT_ROW }))
  );
  const [saved, setSaved] = useState(false);
  const [cancelDayTarget, setCancelDayTarget] = useState<{ dayOfWeek: DayOfWeek; reservations: PendingReservation[] } | null>(null);

  function pendingForDay(day: DayOfWeek): PendingReservation[] {
    return pendingAll.filter((r) => {
      const d = new Date(r.startAt);
      return JS_TO_DOW[d.getDay()] === day;
    });
  }

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
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">진행중인 예약</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">휴무</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const pending = pendingForDay(row.dayOfWeek);
              return (
                <tr
                  key={row.dayOfWeek}
                  className={[
                    "transition-colors",
                    i !== rows.length - 1 ? "border-b border-border" : "",
                    row.closed ? "bg-muted/30" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-3 font-medium">
                    <span className={[
                      "text-sm",
                      row.dayOfWeek === "SATURDAY" ? "text-blue-600" : "",
                      row.dayOfWeek === "SUNDAY" ? "text-rose-600" : "",
                    ].join(" ")}>
                      {DAY_LABELS[row.dayOfWeek]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time" value={row.openTime} disabled={row.closed}
                      onChange={(e) => update(row.dayOfWeek, { openTime: e.target.value })}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time" value={row.closeTime} disabled={row.closed}
                      onChange={(e) => update(row.dayOfWeek, { closeTime: e.target.value })}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pending.length > 0 ? (
                      <button
                        onClick={() => setCancelDayTarget({ dayOfWeek: row.dayOfWeek, reservations: pending })}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {pending.length}개
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button" role="switch" aria-checked={row.closed}
                      onClick={() => update(row.dayOfWeek, { closed: !row.closed })}
                      className={[
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                        row.closed ? "bg-rose-500" : "bg-muted",
                      ].join(" ")}
                    >
                      <span className={[
                        "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        row.closed ? "translate-x-6" : "translate-x-1",
                      ].join(" ")} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 저장 버튼 — 우하단 */}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600 font-medium">영업시간이 저장됐습니다.</span>}
        {mutation.isError && <span className="text-sm text-rose-600 font-medium">저장에 실패했습니다.</span>}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "저장 중..." : "저장"}
        </button>
      </div>

      {cancelDayTarget && (
        <CancelDayReservationsDialog
          dayOfWeek={cancelDayTarget.dayOfWeek}
          reservations={cancelDayTarget.reservations}
          onClose={() => {
            setCancelDayTarget(null);
            queryClient.invalidateQueries({ queryKey: ["admin-reservations-upcoming"] });
          }}
        />
      )}
    </div>
  );
}

// ── 요일별 진행중 예약 일괄 취소 다이얼로그 ──────────────────────────────────

function CancelDayReservationsDialog({
  dayOfWeek,
  reservations,
  onClose,
}: {
  dayOfWeek: DayOfWeek;
  reservations: PendingReservation[];
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        reservations.map((r) =>
          api.patch(`/api/reservations/${r.id}/status`, {
            status: "CANCELLED_BY_ADMIN",
            adminMemo: reason || "영업시간 변경으로 인한 취소",
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations-upcoming"] });
      setDone(true);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-background shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {DAY_LABELS[dayOfWeek]} 진행중인 예약
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              총 {reservations.length}건 — 전화 확인 후 필요 시 일괄 취소하세요
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 예약 테이블 */}
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {done ? (
            <p className="text-sm text-emerald-600 font-medium py-8 text-center">
              {reservations.length}개 예약이 취소됐습니다.
            </p>
          ) : reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">진행중인 예약이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">고객명</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">전화번호</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">시술</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">담당 디자이너</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">일시</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r, i) => (
                  <tr key={r.id} className={i !== reservations.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {r.customerName ?? `#${r.id}`}
                    </td>
                    <td className="px-4 py-3">
                      {r.customerPhone ? (
                        <a
                          href={`tel:${r.customerPhone}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {r.customerPhone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.beautyServiceName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.staffName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {toKST(r.startAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={[
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        r.status === "REQUESTED" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
                      ].join(" ")}>
                        {r.status === "REQUESTED" ? "승인 대기" : "예약 확정"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 취소 폼 */}
        {!done && reservations.length > 0 && (
          <div className="border-t border-border px-6 py-4 space-y-3 bg-muted/10">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-muted-foreground">취소 사유 (고객에게 전달됩니다)</span>
              <input
                type="text"
                value={reason}
                placeholder="예: 매장 사정으로 인한 임시 휴무"
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
                닫기
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {cancelMutation.isPending ? "취소 중..." : `${reservations.length}개 예약 일괄 취소`}
              </button>
            </div>
            {cancelMutation.isError && (
              <p className="text-xs text-rose-600">취소에 실패했습니다. 다시 시도해주세요.</p>
            )}
          </div>
        )}

        {done && (
          <div className="border-t border-border px-6 py-4 flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              닫기
            </button>
          </div>
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
  const [cancelTarget, setCancelTarget] = useState<BlockedTimeItem | null>(null);

  const { start, end } = monthRange(year, month);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<BlockedTimeItem[]>({
    queryKey: ["admin-blocked-times", year, month],
    queryFn: () =>
      api.get<BlockedTimeItem[]>("/api/admin/schedules/blocked-times", {
        params: { startAt: start, endAt: end },
      }).then((r) => r.data),
  });

  const [form, setForm] = useState({
    startAt: "", endAt: "", reason: "", blockType: "STORE_CLOSED" as BlockedTimeType,
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
    mutationFn: (id: number) => api.delete(`/api/admin/schedules/blocked-times/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blocked-times"] }),
  });

  function handleCreate() {
    if (!form.startAt || !form.endAt) { setFormError("시작/종료 시간을 입력해주세요."); return; }
    if (new Date(form.startAt) >= new Date(form.endAt)) { setFormError("종료 시간이 시작 시간보다 나중이어야 합니다."); return; }
    setFormError("");
    createMutation.mutate();
  }

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); } else { setMonth((m) => m - 1); }
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); } else { setMonth((m) => m + 1); }
  }

  return (
    <>
      <div className="space-y-6">
        {/* 월 네비 + 목록 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">‹ 이전</button>
            <span className="text-sm font-semibold">{year}년 {month}월</span>
            <button onClick={nextMonth} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">다음 ›</button>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">이 달에 등록된 차단 시간이 없습니다.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">시작</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">종료</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">유형</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">사유</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">진행중인 예약</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <BlockedTimeRow
                      key={item.id}
                      item={item}
                      isLast={i === items.length - 1}
                      onDelete={() => deleteMutation.mutate(item.id)}
                      deleteDisabled={deleteMutation.isPending}
                      onCancelClick={() => setCancelTarget(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 생성 폼 */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">차단 시간 추가</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">시작 시간</span>
              <input
                type="datetime-local" value={form.startAt}
                onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">종료 시간</span>
              <input
                type="datetime-local" value={form.endAt}
                onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">차단 유형</span>
              <select
                value={form.blockType}
                onChange={(e) => setForm((f) => ({ ...f, blockType: e.target.value as BlockedTimeType }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {(Object.keys(BLOCK_TYPE_LABELS) as BlockedTimeType[]).map((t) => (
                  <option key={t} value={t}>{BLOCK_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">사유 (선택)</span>
              <input
                type="text" value={form.reason} placeholder="예: 정기 청소, 교육 일정"
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-3">
            {formError && <span className="text-sm text-rose-600">{formError}</span>}
            {createMutation.isSuccess && <span className="text-sm text-emerald-600 font-medium">추가됐습니다.</span>}
            <button
              onClick={handleCreate} disabled={createMutation.isPending}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? "추가 중..." : "차단 시간 추가"}
            </button>
          </div>
        </div>

      </div>

      {cancelTarget && (
        <CancelReservationsDialog
          blockedTime={cancelTarget}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  );
}

// ── 차단 시간 행 (예약 수 조회 포함) ─────────────────────────────────────────

function BlockedTimeRow({
  item,
  isLast,
  onDelete,
  deleteDisabled,
  onCancelClick,
}: {
  item: BlockedTimeItem;
  isLast: boolean;
  onDelete: () => void;
  deleteDisabled: boolean;
  onCancelClick: () => void;
}) {
  const date = toApiDate(item.startAt);

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations-date", date],
    queryFn: () =>
      api.get<Reservation[]>("/api/reservations", { params: { date } }).then((r) => r.data),
  });

  const start = new Date(item.startAt).getTime();
  const end = new Date(item.endAt).getTime();

  const conflicting = reservations.filter((r) => {
    if (!["REQUESTED", "CONFIRMED"].includes(r.status)) return false;
    const rStart = new Date(r.startAt).getTime();
    const rEnd = new Date(r.endAt).getTime();
    return rStart < end && rEnd > start;
  });

  return (
    <tr className={["transition-colors hover:bg-muted/20", !isLast ? "border-b border-border" : ""].join(" ")}>
      <td className="px-4 py-3 text-foreground">{toKST(item.startAt)}</td>
      <td className="px-4 py-3 text-foreground">{toKST(item.endAt)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${BLOCK_TYPE_BADGE_CLASS[item.blockType]}`}>
          {BLOCK_TYPE_LABELS[item.blockType]}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{item.reason ?? "—"}</td>
      <td className="px-4 py-3 text-center">
        {conflicting.length > 0 ? (
          <button
            onClick={onCancelClick}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <AlertCircle className="h-3 w-3" />
            {conflicting.length}개
          </button>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={onDelete} disabled={deleteDisabled}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// ── 정기 차단 시간 ─────────────────────────────────────────────────────────────

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "월", TUESDAY: "화", WEDNESDAY: "수", THURSDAY: "목",
  FRIDAY: "금", SATURDAY: "토", SUNDAY: "일",
};

function RecurringBlockedTimeSection() {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery<RecurringBlockedTimeItem[]>({
    queryKey: ["recurring-blocked-times"],
    queryFn: () => api.get("/api/admin/schedules/recurring-blocked-times").then((r) => r.data),
  });

  const [form, setForm] = useState({
    daysOfWeek: [] as DayOfWeek[],
    startTime: "13:00",
    endTime: "14:00",
    blockType: "LUNCH" as BlockedTimeType,
    reason: "",
  });
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post("/api/admin/schedules/recurring-blocked-times", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-blocked-times"] });
      setForm({ daysOfWeek: [], startTime: "13:00", endTime: "14:00", blockType: "LUNCH", reason: "" });
      setError("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/schedules/recurring-blocked-times/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-blocked-times"] }),
  });

  function toggleDay(day: DayOfWeek) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day],
    }));
  }

  function handleSubmit() {
    if (form.daysOfWeek.length === 0) { setError("요일을 선택해주세요."); return; }
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) {
      setError("시작/종료 시간을 올바르게 입력해주세요.");
      return;
    }
    setError("");
    createMutation.mutate({
      daysOfWeek: form.daysOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      blockType: form.blockType,
      reason: form.reason || null,
    });
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">정기 차단 시간</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">매주 반복되는 차단 시간을 설정합니다. (예: 매일 점심 13:00~14:00)</p>
      </div>

      {/* 목록 */}
      {items.length === 0 ? (
        <p className="mb-4 rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          등록된 정기 차단이 없습니다.
        </p>
      ) : (
        <div className="mb-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">요일</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">시간</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">유형</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">사유</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">삭제</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={["transition-colors hover:bg-muted/20", idx < items.length - 1 ? "border-b border-border" : ""].join(" ")}>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {ALL_DAYS.filter((d) => item.daysOfWeek.includes(d)).map((d) => (
                        <span key={d} className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {DAY_SHORT[d]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground">{item.startTime.slice(0, 5)} ~ {item.endTime.slice(0, 5)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${BLOCK_TYPE_BADGE_CLASS[item.blockType]}`}>
                      {BLOCK_TYPE_LABELS[item.blockType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.reason ?? "—"}</td>
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

      {/* 추가 폼 */}
      <div className="rounded-xl border border-border bg-muted/10 p-5">
        <p className="mb-3 text-sm font-medium text-foreground">정기 차단 추가</p>

        {/* 요일 선택 */}
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">요일</p>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  form.daysOfWeek.includes(day)
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-foreground hover:bg-accent"
                }`}
              >
                {DAY_SHORT[day]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, daysOfWeek: f.daysOfWeek.length === 7 ? [] : [...ALL_DAYS] }))}
              className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              {form.daysOfWeek.length === 7 ? "전체 해제" : "전체"}
            </button>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">시작 시간</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">종료 시간</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">차단 유형</label>
            <select
              value={form.blockType}
              onChange={(e) => setForm((f) => ({ ...f, blockType: e.target.value as BlockedTimeType }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {(Object.keys(BLOCK_TYPE_LABELS) as BlockedTimeType[]).map((k) => (
                <option key={k} value={k}>{BLOCK_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">사유 (선택)</label>
            <input
              type="text"
              placeholder="예: 직원 식사 시간"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {error && <p className="mb-2 text-xs font-medium text-rose-600">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending ? "추가 중..." : "정기 차단 추가"}
        </button>
      </div>
    </div>
  );
}

// ── 예약 일괄 취소 다이얼로그 ─────────────────────────────────────────────────

function CancelReservationsDialog({
  blockedTime,
  onClose,
}: {
  blockedTime: BlockedTimeItem;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const date = toApiDate(blockedTime.startAt);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations-date", date],
    queryFn: () =>
      api.get<Reservation[]>("/api/reservations", { params: { date } }).then((r) => r.data),
  });

  const start = new Date(blockedTime.startAt).getTime();
  const end = new Date(blockedTime.endAt).getTime();

  const targets = reservations.filter((r) => {
    if (!["REQUESTED", "CONFIRMED"].includes(r.status)) return false;
    const rStart = new Date(r.startAt).getTime();
    const rEnd = new Date(r.endAt).getTime();
    return rStart < end && rEnd > start;
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        targets.map((r) =>
          api.patch(`/api/reservations/${r.id}/status`, {
            status: "CANCELLED_BY_ADMIN",
            adminMemo: reason || null,
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations-date", date] });
      setDone(true);
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">진행중인 예약 일괄 취소</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {toKST(blockedTime.startAt)} ~ {toKST(blockedTime.endAt)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 예약 목록 */}
        <div className="max-h-60 overflow-y-auto px-5 py-3 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">불러오는 중...</p>
          ) : done ? (
            <p className="text-sm text-emerald-600 font-medium py-4 text-center">{targets.length}개 예약이 취소됐습니다.</p>
          ) : targets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">진행중인 예약이 없습니다.</p>
          ) : (
            targets.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.beautyServiceName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.staffName} · {new Date(r.startAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" })} ~ {new Date(r.endAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {r.customerName && (
                    <p className="text-xs text-muted-foreground">{r.customerName} {r.customerPhone && `· ${r.customerPhone}`}</p>
                  )}
                </div>
                <span className={[
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  r.status === "REQUESTED" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
                ].join(" ")}>
                  {r.status === "REQUESTED" ? "승인 대기" : "예약 확정"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* 취소 사유 + 버튼 */}
        {!done && targets.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-muted-foreground">취소 사유 (고객에게 전달됩니다)</span>
              <input
                type="text"
                value={reason}
                placeholder="예: 매장 사정으로 인한 임시 휴무"
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
                닫기
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {cancelMutation.isPending ? "취소 중..." : `${targets.length}개 예약 일괄 취소`}
              </button>
            </div>
            {cancelMutation.isError && (
              <p className="text-xs text-rose-600">취소에 실패했습니다. 다시 시도해주세요.</p>
            )}
          </div>
        )}

        {done && (
          <div className="border-t border-border px-5 py-4 flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
