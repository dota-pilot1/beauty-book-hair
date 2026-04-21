import { SignupForm } from "@/features/auth/signup/SignupForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="text-sm text-muted-foreground">
            Twilio Callcenter 계정을 생성합니다.
          </p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
