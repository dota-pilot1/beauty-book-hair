"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loginSchema, type LoginFormValues } from "@/shared/lib/validation/auth.schema";
import { authActions } from "@/entities/user/model/authStore";
import { getApiError } from "@/shared/api/errors";
import { getDefaultHomePath } from "@/shared/lib/routing/defaultHome";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { PasswordInput } from "@/shared/ui/PasswordInput";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const devAccounts = [
    {
      label: "관리자",
      email: "admin@daum.net",
      password: "password123",
      icon: ShieldCheck,
    },
    {
      label: "고객",
      email: "customer@daum.net",
      password: "password123",
      icon: UserRound,
    },
  ] as const;

  const storedLabel =
    typeof window !== "undefined"
      ? (localStorage.getItem("dev-account") ?? "관리자")
      : "관리자";
  const initialAccount =
    devAccounts.find((a) => a.label === storedLabel) ?? devAccounts[0];
  const [selectedDev, setSelectedDev] = useState<string>(initialAccount.label);

  const safePath =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : null;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: initialAccount.email,
      password: initialAccount.password,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await authActions.login(values.email, values.password);
      toast.success(t("loginSuccess"));
      router.replace(safePath ?? getDefaultHomePath(user.role.code));
    } catch (e) {
      const apiError = getApiError(e);
      if (apiError?.code === "AUTH_003") {
        setError("password", { type: "server", message: apiError.message });
      } else if (apiError?.code === "AUTH_004") {
        setError("email", { type: "server", message: apiError.message });
      } else {
        setFormError(apiError?.message ?? t("loginFailed"));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="rounded-md border border-border/70 bg-muted/30 p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">개발용 빠른 세팅</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {devAccounts.map(({ label, email, password, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setFormError(null);
                setSelectedDev(label);
                localStorage.setItem("dev-account", label);
                setValue("email", email, { shouldDirty: true });
                setValue("password", password, { shouldDirty: true });
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                selectedDev === label
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <FormField label={t("email")} htmlFor="login-email" error={errors.email?.message}>
        <TextInput
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          invalid={!!errors.email}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField label={t("password")} htmlFor="login-password" error={errors.password?.message}>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={!!errors.password}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        <LogIn className="h-4 w-4" />
        {isSubmitting ? t("signingIn") : t("signInButton")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="underline hover:text-foreground">
          {t("signUpLink")}
        </Link>
      </p>
    </form>
  );
}
