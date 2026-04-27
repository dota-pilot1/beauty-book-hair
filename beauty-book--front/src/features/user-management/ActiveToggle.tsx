"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/entities/user/api/userApi";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ToggleSwitch } from "@/shared/ui/ToggleSwitch";
import { toast, toastError } from "@/shared/lib/toast";

type Props = {
  userId: number;
  active: boolean;
};

export function ActiveToggle({ userId, active }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => userApi.toggleActive(userId),
    onSuccess: (updated) => {
      toast.success(updated.active ? "활성화되었습니다." : "비활성화되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
    onError: (e) => toastError(e, "상태 변경에 실패했습니다."),
  });

  return (
    <>
      <ToggleSwitch
        checked={active}
        onCheckedChange={() => setOpen(true)}
        loading={mutation.isPending}
        labelOn="활성"
        labelOff="비활성"
      />
      <ConfirmDialog
        open={open}
        title={active ? "비활성화하시겠습니까?" : "활성화하시겠습니까?"}
        description={
          active
            ? "비활성화된 유저는 로그인할 수 없습니다."
            : "활성화 시 해당 유저가 다시 로그인할 수 있습니다."
        }
        variant={active ? "destructive" : "default"}
        confirmText={active ? "비활성화" : "활성화"}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
