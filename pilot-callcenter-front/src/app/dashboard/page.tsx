"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-3">Twilio Callcenter</h1>
      <p className="text-muted-foreground max-w-md">
        Twilio 기반 콜센터 관리 플랫폼을 구현 예정입니다.
        <br />
        통화 관리, 상담사 배정, 실시간 모니터링 등의 기능이 추가될 예정입니다.
      </p>
    </main>
  );
}
