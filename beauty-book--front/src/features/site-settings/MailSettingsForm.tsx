"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailCheck, Plus, X } from "lucide-react";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";
import { toast, toastError } from "@/shared/lib/toast";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function MailSettingsForm() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["mail-settings"],
    queryFn: siteSettingApi.getMail,
  });

  useEffect(() => {
    if (data) {
      setEmails(data.reservationRequestEmails ?? []);
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      siteSettingApi.updateMail({ reservationRequestEmails: emails }),
    onSuccess: (fresh) => {
      toast.success("메일 설정이 저장되었습니다.");
      qc.setQueryData(["mail-settings"], fresh);
      setEmails(fresh.reservationRequestEmails ?? []);
      setIsDirty(false);
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  function addEmail() {
    const value = inputValue.trim();
    if (!value) return;
    if (!isValidEmail(value)) {
      setInputError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    if (emails.includes(value)) {
      setInputError("이미 추가된 이메일입니다.");
      return;
    }
    if (emails.length >= 10) {
      setInputError("최대 10개까지 추가할 수 있습니다.");
      return;
    }
    setEmails((prev) => [...prev, value]);
    setInputValue("");
    setInputError("");
    setIsDirty(true);
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
    setIsDirty(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">메일 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            고객이 예약 요청을 보냈을 때 매장에서 받을 관리자 이메일을 설정합니다.
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !isDirty}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          {saveMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </header>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <MailCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              예약 요청 수신 이메일
            </h2>
            <p className="text-sm text-muted-foreground">
              비워두면 고객에게만 접수 메일이 발송됩니다.
            </p>
          </div>
        </div>

        {/* 추가된 이메일 태그 목록 */}
        {emails.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 입력 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="email"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="admin@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {inputError && (
              <span className="mt-1 block text-xs text-destructive">
                {inputError}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={addEmail}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Enter 또는 추가 버튼으로 등록 · 최대 10개
        </p>
      </section>
    </div>
  );
}
