"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signupSchema, type SignupFormValues } from "@/shared/lib/validation/auth.schema";
import { authApi } from "@/entities/user/api/authApi";
import { getApiError, getFieldErrors } from "@/shared/api/errors";

export function SignupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { passwordConfirm: _, ...payload } = values;
      await authApi.signup(payload);
      toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
      router.push("/login");
    } catch (e) {
      const apiError = getApiError(e);
      const fields = getFieldErrors(e);

      (Object.keys(fields) as Array<keyof SignupFormValues>).forEach((k) => {
        setError(k, { type: "server", message: fields[k as string] });
      });

      if (apiError && Object.keys(fields).length === 0) {
        if (apiError.code === "AUTH_001") {
          setError("email", { type: "server", message: apiError.message });
        } else {
          toast.error(apiError.message);
        }
      } else if (!apiError) {
        toast.error("요청 중 오류가 발생했습니다.");
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

      <Field label="사용자명" error={errors.username?.message}>
        <input
          type="text"
          autoComplete="name"
          {...register("username")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="비밀번호" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <Field label="비밀번호 확인" error={errors.passwordConfirm?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register("passwordConfirm")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        {isSubmitting ? "가입 중..." : "가입하기"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <a href="/login" className="underline hover:text-foreground">
          로그인
        </a>
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
