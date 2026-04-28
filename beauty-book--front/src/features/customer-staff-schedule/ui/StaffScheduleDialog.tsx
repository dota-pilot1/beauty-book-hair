"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/axios";

// ─── types ──────────────────────────────────────────────────────────────────

type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

type StaffItem = {
  staffId: number;
  staffName: string;
  profileImageUrl: string | null;
  workingDays: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; working: boolean }[];
};

type SlotStatus = "AVAILABLE" | "BOOKED" | "REQUESTED" | "OFF_DUTY" | "BLOCKED" | "PAST";
type BlockType = "LUNCH" | "STORE_CLOSED" | "DESIGNER_OFF" | "EDUCATION" | "PERSONAL" | "ETC";

type StaffSlot = {
  startAt: string;
  endAt: string;
  status: SlotStatus;
  blockType: BlockType | null;
  reason: string | null;
};

type Props = { open: boolean; onClose: () => void };

// ─── constants & helpers ─────────────────────────────────────────────────────

const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 52;

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  STORE_CLOSED: "🚪 매장 휴무",
  DESIGNER_OFF: "💆 디자이너 휴무",
  LUNCH: "🍱 점심 시간",
  EDUCATION: "📚 교육",
  PERSONAL: "🙏 개인 사정",
  ETC: "📌 기타",
};

function getDateOptions(days = 7) {
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const short = i === 0 ? "오늘" : i === 1 ? "내일"
      : new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(d);
    const day = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(d);
    return { value, short, day };
  });
}

function isoToKSTMinutes(iso: string): number {
  const kst = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getHours() * 60 + kst.getMinutes();
}

function formatKSTTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function minutesToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// 연속된 같은 상태 슬롯을 하나의 범위로 병합
type Range = {
  status: SlotStatus;
  blockType: BlockType | null;
  reason: string | null;
  startMinutes: number;
  endMinutes: number;
  startAt: string;
  endAt: string;
};

function groupRanges(slots: StaffSlot[]): Range[] {
  if (slots.length === 0) return [];
  const ranges: Range[] = [];
  let cur: Range = {
    status: slots[0].status,
    blockType: slots[0].blockType,
    reason: slots[0].reason,
    startMinutes: isoToKSTMinutes(slots[0].startAt),
    endMinutes: isoToKSTMinutes(slots[0].endAt),
    startAt: slots[0].startAt,
    endAt: slots[0].endAt,
  };
  for (let i = 1; i < slots.length; i++) {
    const s = slots[i];
    if (
      s.status === cur.status &&
      s.blockType === cur.blockType &&
      s.reason === cur.reason
    ) {
      cur.endMinutes = isoToKSTMinutes(s.endAt);
      cur.endAt = s.endAt;
    } else {
      ranges.push(cur);
      cur = {
        status: s.status,
        blockType: s.blockType,
        reason: s.reason,
        startMinutes: isoToKSTMinutes(s.startAt),
        endMinutes: isoToKSTMinutes(s.endAt),
        startAt: s.startAt,
        endAt: s.endAt,
      };
    }
  }
  ranges.push(cur);
  return ranges;
}

function generateSlotMarkers(startMin: number, endMin: number) {
  const markers: { label: string; minutes: number }[] = [];
  const slotStart = Math.floor(startMin / SLOT_MINUTES) * SLOT_MINUTES;
  const slotEnd = Math.ceil(endMin / SLOT_MINUTES) * SLOT_MINUTES;
  for (let m = slotStart; m < slotEnd; m += SLOT_MINUTES) {
    markers.push({ label: minutesToHHMM(m), minutes: m });
  }
  return markers;
}

// ─── main component ───────────────────────────────────────────────────────────

export function StaffScheduleDialog({ open, onClose }: Props) {
  const dateOptions = useMemo(() => getDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);

  const { data: staffList = [], isLoading: staffLoading } = useQuery<StaffItem[]>({
    queryKey: ["staff-working-hours"],
    queryFn: () => api.get<StaffItem[]>("/api/schedules/staff-working-hours").then((r) => r.data),
    enabled: open,
  });

  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const activeStaffId = selectedStaffId ?? staffList[0]?.staffId ?? null;
  const activeStaff = staffList.find((s) => s.staffId === activeStaffId);

  // 모든 (디자이너 × 날짜) 조합 동시 조회: 날짜별 카운트 + 디자이너별 총 카운트
  const allSlotQueries = useQueries({
    queries: staffList.flatMap((staff) =>
      dateOptions.map((opt) => ({
        queryKey: ["staff-slots", staff.staffId, opt.value],
        queryFn: () =>
          api.get<StaffSlot[]>("/api/schedules/staff-slots", {
            params: { staffId: staff.staffId, date: opt.value },
          }).then((r) => r.data),
        enabled: open,
        staleTime: 30_000,
      }))
    ),
  });

  const countReservations = (data: StaffSlot[] | undefined) => {
    if (!data || data.length === 0) return 0;
    const ranges = groupRanges(data);
    return ranges.filter(
      (r) => r.status === "BOOKED" || r.status === "REQUESTED"
    ).length;
  };

  const queryIndex = (staffId: number, dateValue: string) => {
    const staffIdx = staffList.findIndex((s) => s.staffId === staffId);
    const dateIdx = dateOptions.findIndex((o) => o.value === dateValue);
    if (staffIdx < 0 || dateIdx < 0) return -1;
    return staffIdx * dateOptions.length + dateIdx;
  };

  // 활성 디자이너의 날짜별 카운트
  const dateReservationCounts = useMemo(() => {
    const map: Record<string, number> = {};
    if (activeStaffId === null) return map;
    dateOptions.forEach((opt) => {
      const idx = queryIndex(activeStaffId, opt.value);
      map[opt.value] = idx >= 0 ? countReservations(allSlotQueries[idx]?.data) : 0;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateOptions, allSlotQueries, activeStaffId, staffList]);

  // 디자이너별 7일 총 카운트
  const staffTotalCounts = useMemo(() => {
    const map: Record<number, number> = {};
    staffList.forEach((staff) => {
      let total = 0;
      dateOptions.forEach((opt) => {
        const idx = queryIndex(staff.staffId, opt.value);
        if (idx >= 0) total += countReservations(allSlotQueries[idx]?.data);
      });
      map[staff.staffId] = total;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffList, dateOptions, allSlotQueries]);

  const selectedQueryIdx = activeStaffId !== null ? queryIndex(activeStaffId, selectedDate) : -1;
  const selectedQuery = selectedQueryIdx >= 0 ? allSlotQueries[selectedQueryIdx] : undefined;
  const slots: StaffSlot[] = selectedQuery?.data ?? [];
  const slotLoading = selectedQuery?.isLoading ?? false;

  const isLoading = staffLoading || slotLoading;
  const isStoreClosed = !isLoading && slots.length === 0;
  const isStaffOffDay = !isLoading && slots.length > 0 &&
    slots.every((s) => s.status === "OFF_DUTY" || s.status === "PAST");

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[80vh] w-[95vw] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg md:w-[85vw] md:max-w-3xl">

          {/* 헤더 */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="text-sm font-semibold">
              {activeStaff ? `${activeStaff.staffName} 스케쥴` : "직원 스케쥴"}
            </Dialog.Title>
            <Dialog.Close onClick={onClose} className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* 바디: 모바일 = 세로, 데스크탑 = 좌우 분할 */}
          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

            {/* 직원 탭 — 모바일: 가로 스크롤 탭 */}
            {staffList.length > 0 && (
              <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border px-4 py-2.5 md:hidden">
                {staffList.map((s) => {
                  const total = staffTotalCounts[s.staffId] ?? 0;
                  const isActive = activeStaffId === s.staffId;
                  return (
                    <button
                      key={s.staffId}
                      type="button"
                      onClick={() => setSelectedStaffId(s.staffId)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {s.staffName}
                      {total > 0 && (
                        <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                          isActive ? "bg-background/20 text-background" : "bg-amber-500 text-white"
                        }`}>
                          {total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 직원 사이드바 — 데스크탑만 */}
            {staffList.length > 0 && (
              <div className="hidden shrink-0 flex-col gap-2 overflow-y-auto border-r border-border p-3 md:flex md:w-28">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  디자이너
                </p>
                {staffList.map((s) => {
                  const isActive = activeStaffId === s.staffId;
                  const total = staffTotalCounts[s.staffId] ?? 0;
                  return (
                    <button
                      key={s.staffId}
                      type="button"
                      onClick={() => setSelectedStaffId(s.staffId)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors ${
                        isActive ? "bg-foreground/8 ring-2 ring-foreground/20" : "hover:bg-muted"
                      }`}
                    >
                      {total > 0 && (
                        <span className="absolute right-1 top-1 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow">
                          {total}
                        </span>
                      )}
                      {s.profileImageUrl ? (
                        <img
                          src={s.profileImageUrl}
                          alt={s.staffName}
                          className={`h-12 w-12 rounded-full object-cover ring-2 ${
                            isActive ? "ring-foreground/40" : "ring-border"
                          }`}
                        />
                      ) : (
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ring-2 ${
                          isActive
                            ? "bg-foreground text-background ring-foreground/40"
                            : "bg-muted text-muted-foreground ring-border"
                        }`}>
                          {s.staffName.charAt(0)}
                        </div>
                      )}
                      <span className={`text-[11px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.staffName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 오른쪽: 날짜 탭 + 타임라인 */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* 날짜 탭 */}
              <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-4 py-2.5">
                {dateOptions.map((opt) => {
                  const count = dateReservationCounts[opt.value] ?? 0;
                  const isSelected = selectedDate === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedDate(opt.value)}
                      className={`relative flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5 text-center transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {count > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                          {count}
                        </span>
                      )}
                      <span className="text-[11px] font-medium">{opt.short}</span>
                      <span className="text-[10px] opacity-70">{opt.day}</span>
                    </button>
                  );
                })}
              </div>

              {/* 타임라인 */}
              <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
                {isLoading ? (
                  <SkeletonTimeline />
                ) : (
                  <Timeline
                    slots={slots}
                    isStoreClosed={isStoreClosed}
                    isStaffOff={isStaffOffDay}
                    staffName={activeStaff?.staffName ?? ""}
                  />
                )}
              </div>
            </div>

          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── timeline ────────────────────────────────────────────────────────────────

function SkeletonTimeline() {
  return (
    <div className="space-y-2 pt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </div>
  );
}

function Timeline({
  slots,
  isStoreClosed,
  isStaffOff,
  staffName,
}: {
  slots: StaffSlot[];
  isStoreClosed: boolean;
  isStaffOff: boolean;
  staffName: string;
}) {
  if (isStoreClosed) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-3xl">🚪</p>
        <p className="mt-3 text-sm text-muted-foreground">이 날은 매장 휴무일입니다.</p>
      </div>
    );
  }
  if (isStaffOff) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-3xl">💆</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {staffName} 디자이너 휴무일입니다.
        </p>
      </div>
    );
  }

  const ranges = groupRanges(slots);
  const allMin = Math.min(...ranges.map((r) => r.startMinutes));
  const allMax = Math.max(...ranges.map((r) => r.endMinutes));
  const markers = generateSlotMarkers(allMin, allMax);
  const baseMin = markers[0]?.minutes ?? 0;
  const containerHeight = markers.length * SLOT_HEIGHT;

  function topPx(m: number) {
    return Math.max(0, ((m - baseMin) / SLOT_MINUTES) * SLOT_HEIGHT);
  }
  function heightPx(start: number, end: number) {
    return Math.max(SLOT_HEIGHT, ((end - start) / SLOT_MINUTES) * SLOT_HEIGHT);
  }

  return (
    <div className="relative" style={{ height: `${containerHeight}px` }}>
      {/* 슬롯 라인 */}
      {markers.map((m, i) => (
        <div
          key={m.minutes}
          className="absolute left-0 right-0 flex items-start"
          style={{ top: `${i * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
        >
          <span className="w-11 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground/50">
            {m.label}
          </span>
          <div className="mt-2 flex-1 border-t border-dashed border-border/40" />
        </div>
      ))}

      {/* OFF_DUTY: 회색 오버레이 */}
      {ranges.filter((r) => r.status === "OFF_DUTY").map((r, i) => (
        <div
          key={`off-${i}`}
          className="absolute left-13 right-0 flex items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-slate-200 px-2.5 py-1.5"
          style={{ top: `${topPx(r.startMinutes)}px`, height: `${heightPx(r.startMinutes, r.endMinutes)}px` }}
        >
          <p className="truncate text-[11px] font-semibold text-slate-600">🚫 근무 외</p>
        </div>
      ))}

      {/* BLOCKED: 줄무늬 박스 */}
      {ranges.filter((r) => r.status === "BLOCKED").map((r, i) => (
        <div
          key={`block-${i}`}
          className="absolute left-13 right-0 flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5"
          style={{
            top: `${topPx(r.startMinutes)}px`,
            height: `${heightPx(r.startMinutes, r.endMinutes)}px`,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 12px)",
          }}
        >
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            {r.blockType ? BLOCK_TYPE_LABELS[r.blockType] : "차단"}
            {r.reason ? ` · ${r.reason}` : ""}
          </p>
        </div>
      ))}

      {/* BOOKED: 초록 박스 (확정) */}
      {ranges.filter((r) => r.status === "BOOKED").map((r, i) => (
        <div
          key={`booked-${i}`}
          className="absolute left-13 right-0 overflow-hidden rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5"
          style={{ top: `${topPx(r.startMinutes)}px`, height: `${heightPx(r.startMinutes, r.endMinutes)}px` }}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="truncate text-xs font-semibold text-emerald-700">예약됨</p>
            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              확정
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-emerald-700/70">
            {formatKSTTime(r.startAt)} ~ {formatKSTTime(r.endAt)}
          </p>
        </div>
      ))}

      {/* REQUESTED: 노란 박스 (승인 대기) */}
      {ranges.filter((r) => r.status === "REQUESTED").map((r, i) => (
        <div
          key={`requested-${i}`}
          className="absolute left-13 right-0 overflow-hidden rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5"
          style={{ top: `${topPx(r.startMinutes)}px`, height: `${heightPx(r.startMinutes, r.endMinutes)}px` }}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="truncate text-xs font-semibold text-amber-700">승인 대기</p>
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              대기
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-amber-700/70">
            {formatKSTTime(r.startAt)} ~ {formatKSTTime(r.endAt)}
          </p>
        </div>
      ))}

      {/* PAST: 지나간 시간 */}
      {ranges.filter((r) => r.status === "PAST").map((r, i) => (
        <div
          key={`past-${i}`}
          className="absolute left-13 right-0 flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100/70 px-2.5 py-1.5"
          style={{ top: `${topPx(r.startMinutes)}px`, height: `${heightPx(r.startMinutes, r.endMinutes)}px` }}
        >
          <p className="truncate text-[11px] font-medium text-slate-400">⏱ 지나간 시간</p>
        </div>
      ))}

      {/* AVAILABLE 슬롯이 하나도 없는 경우 */}
      {ranges.every((r) => r.status !== "AVAILABLE") && (
        <div className="sticky top-1/3 z-10 flex justify-center">
          <p className="rounded-full bg-muted/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            예약 가능한 시간이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
