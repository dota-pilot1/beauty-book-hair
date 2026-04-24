"use client";

import { BellRing, MessageSquareMore, Phone } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { useAuth } from "@/entities/user/model/authStore";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";

export default function MyInfoPage() {
  return (
    <RequireAuth>
      <MyInfoInner />
    </RequireAuth>
  );
}

function MyInfoInner() {
  const { user } = useAuth();

  return (
    <CustomerShell
      eyebrow="My Info"
      title="예약에 필요한 기본 정보를 관리합니다."
      description="초기 단계에서는 회원정보 전체보다 연락처, 요청사항, 알림 수신 여부처럼 예약과 직접 연결되는 정보부터 다루는 편이 효율적입니다."
    >
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">기본 정보</h2>
          <div className="mt-4 space-y-3 text-sm">
            <InfoRow label="이름" value={user?.username ?? "-"} />
            <InfoRow label="이메일" value={user?.email ?? "-"} />
            <InfoRow label="연락처" value="010-0000-0000" icon={Phone} />
          </div>
        </article>

        <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">예약 메모</h2>
          <div className="mt-4 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquareMore className="h-4 w-4" />
              요청사항 초안
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              예민한 두피, 조용한 시술 선호, 앞머리 길이 유지 같은 요청사항을 여기에 저장해두는 구조를 고려할 수 있습니다.
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellRing className="h-4 w-4" />
              알림 설정 초안
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              예약 확정, 일정 변경, 방문 전 알림을 어떤 방식으로 받을지 나중에 연결할 수 있습니다.
            </p>
          </div>
        </article>
      </section>
    </CustomerShell>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Phone;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-medium text-foreground">
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
        {value}
      </span>
    </div>
  );
}
