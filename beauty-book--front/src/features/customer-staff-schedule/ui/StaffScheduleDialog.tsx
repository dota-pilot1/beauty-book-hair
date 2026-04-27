"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/axios";
import { AdminDesignerScheduleDialog } from "@/features/admin-designer-schedule/ui/AdminDesignerScheduleDialog";

type StaffItem = {
  staffId: number;
  staffName: string;
  profileImageUrl: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function todayKST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export function StaffScheduleDialog({ open, onClose }: Props) {
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [innerOpen, setInnerOpen] = useState(false);

  const { data: staffList = [], isLoading } = useQuery<StaffItem[]>({
    queryKey: ["staff-working-hours"],
    queryFn: () =>
      api.get<StaffItem[]>("/api/schedules/staff-working-hours").then((r) => r.data),
    enabled: open,
  });

  const selectedStaff = staffList.find((s) => s.staffId === selectedStaffId);

  function handleStaffSelect(staffId: number) {
    setSelectedStaffId(staffId);
    setInnerOpen(true);
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Dialog.Title className="text-sm font-semibold">직원 스케쥴</Dialog.Title>
              </div>
              <Dialog.Close onClick={onClose} className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
              <p className="mb-4 text-xs text-muted-foreground">
                확인하고 싶은 직원을 선택하면 해당 직원의 스케쥴을 볼 수 있습니다.
              </p>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
                  ))}
                </div>
              ) : staffList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">등록된 직원이 없습니다.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {staffList.map((staff) => (
                    <li key={staff.staffId}>
                      <button
                        type="button"
                        onClick={() => handleStaffSelect(staff.staffId)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/50 active:scale-[0.99]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                          {staff.staffName.slice(0, 1)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{staff.staffName}</p>
                          <p className="text-xs text-muted-foreground">스케쥴 보기 →</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {selectedStaff && (
        <AdminDesignerScheduleDialog
          open={innerOpen}
          onClose={() => setInnerOpen(false)}
          staffName={selectedStaff.staffName}
          staffId={selectedStaff.staffId}
          initialDate={todayKST()}
        />
      )}
    </>
  );
}
