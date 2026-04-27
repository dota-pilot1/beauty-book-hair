"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/axios";

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

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

const DAY_LABEL: Record<DayOfWeek, string> = {
  MONDAY: "월요일", TUESDAY: "화요일", WEDNESDAY: "수요일", THURSDAY: "목요일",
  FRIDAY: "금요일", SATURDAY: "토요일", SUNDAY: "일요일",
};

const JS_DAY_TO_DOW: Record<number, DayOfWeek> = {
  0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
  4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
};

function todayDow(): DayOfWeek {
  return JS_DAY_TO_DOW[new Date().getDay()];
}

function toHHMM(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BusinessHoursDialog({ open, onClose }: Props) {
  const today = todayDow();

  const { data: hours = [], isLoading } = useQuery<BusinessHourItem[]>({
    queryKey: ["business-hours"],
    queryFn: () => api.get<BusinessHourItem[]>("/api/schedules/business-hours").then((r) => r.data),
    enabled: open,
  });

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Dialog.Title className="text-sm font-semibold">영업 시간</Dialog.Title>
            </div>
            <Dialog.Close onClick={onClose} className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {ALL_DAYS.map((day) => {
                  const item = hours.find((h) => h.dayOfWeek === day);
                  const isToday = day === today;
                  const isSat = day === "SATURDAY";
                  const isSun = day === "SUNDAY";
                  return (
                    <li
                      key={day}
                      className={[
                        "flex items-center justify-between rounded-xl border px-4 py-3",
                        isToday
                          ? "border-foreground/30 bg-foreground/5"
                          : "border-border bg-card",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        {isToday && (
                          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        )}
                        <span
                          className={[
                            "text-sm font-semibold",
                            isToday ? "text-foreground" : "",
                            !isToday && isSat ? "text-blue-600" : "",
                            !isToday && isSun ? "text-rose-600" : "",
                            !isToday && !isSat && !isSun ? "text-muted-foreground" : "",
                          ].join(" ")}
                        >
                          {DAY_LABEL[day]}
                          {isToday && (
                            <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">오늘</span>
                          )}
                        </span>
                      </div>
                      {!item ? (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      ) : item.closed ? (
                        <span className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                          휴무
                        </span>
                      ) : (
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {toHHMM(item.openTime)} ~ {toHHMM(item.closeTime)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
