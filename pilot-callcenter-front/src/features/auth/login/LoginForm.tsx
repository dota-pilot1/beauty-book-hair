"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "@/shared/lib/validation/auth.schema";
import { authActions } from "@/entities/user/model/authStore";
import { getApiError } from "@/shared/api/errors";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const safePath = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "terecal@daum.net",
      password: "password123!@",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authActions.login(values.email, values.password);
      toast.success("로그인되었습니다.");
      router.replace(safePath);
    } catch (e) {
      const apiError = getApiError(e);
      if (apiError?.code === "AUTH_003") {
        setError("password", { type: "server", message: apiError.message });
      } else if (apiError?.code === "AUTH_004") {
        setError("email", { type: "server", message: apiError.message });
      } else {
        toast.error(apiError?.message ?? "로그인에 실패했습니다.");
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="이메일" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          {...register("email")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="비밀번호" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        {isSubmitting ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link href="/register" className="underline hover:text-foreground">
          회원가입
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
