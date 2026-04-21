import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-muted-foreground">
            Twilio Callcenter에 접속합니다.
          </p>
        </div>
        <Suspense fallback={<div className="text-sm text-muted-foreground">로딩 중...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
