"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, LogIn, Mail, ShieldCheck, UserRound } from "lucide-react";
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

const loginPresets = [
  {
    label: "관리자",
    helper: "테스트",
    email: "admin@daum.net",
    password: "password123",
    icon: ShieldCheck,
  },
  {
    label: "고객",
    helper: "테스트",
    email: "customer@daum.net",
    password: "password123",
    icon: UserRound,
  },
  {
    label: "유저",
    helper: "직접 입력",
    email: "",
    password: "",
    icon: Mail,
  },
] as const;

const LOGIN_PRESET_STORAGE_KEY = "login-preset";
const USER_CREDENTIAL_STORAGE_KEY = "user-login-credentials";

function readRememberedUserCredentials() {
  try {
    const stored = localStorage.getItem(USER_CREDENTIAL_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<LoginFormValues>;
    if (typeof parsed.email !== "string" || typeof parsed.password !== "string") return null;
    return { email: parsed.email, password: parsed.password };
  } catch {
    return null;
  }
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const initialAccount = loginPresets[0];
  const [selectedDev, setSelectedDev] = useState<string>(initialAccount.label);
  const [rememberUserCredentials, setRememberUserCredentials] = useState(false);

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

  useEffect(() => {
    const storedLabel = localStorage.getItem(LOGIN_PRESET_STORAGE_KEY);
    if (!storedLabel) return;

    const storedAccount = loginPresets.find((a) => a.label === storedLabel);
    if (!storedAccount) return;

    const remembered = storedAccount.label === "유저" ? readRememberedUserCredentials() : null;
    setSelectedDev(storedAccount.label);
    setRememberUserCredentials(Boolean(remembered));
    setValue("email", remembered?.email ?? storedAccount.email, { shouldDirty: false });
    setValue("password", remembered?.password ?? storedAccount.password, { shouldDirty: false });
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await authActions.login(values.email, values.password);
      if (selectedDev === "유저") {
        if (rememberUserCredentials) {
          localStorage.setItem(
            USER_CREDENTIAL_STORAGE_KEY,
            JSON.stringify({ email: values.email, password: values.password })
          );
        } else {
          localStorage.removeItem(USER_CREDENTIAL_STORAGE_KEY);
        }
      }
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
      <div className="rounded-md border border-dashed border-border/80 bg-muted/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">로그인 방식</span>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            테스트 계정 구분
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {loginPresets.map(({ label, helper, email, password, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setFormError(null);
                setSelectedDev(label);
                localStorage.setItem(LOGIN_PRESET_STORAGE_KEY, label);
                const remembered = label === "유저" ? readRememberedUserCredentials() : null;
                setRememberUserCredentials(label === "유저" && Boolean(remembered));
                setValue("email", remembered?.email ?? email, { shouldDirty: true });
                setValue("password", remembered?.password ?? password, { shouldDirty: true });
              }}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                selectedDev === label
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex flex-col items-start leading-tight">
                <span>{label}</span>
                <span className={`text-[10px] font-normal ${selectedDev === label ? "text-background/65" : "text-muted-foreground"}`}>
                  {helper}
                </span>
              </span>
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

      {selectedDev === "유저" && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={rememberUserCredentials}
            onChange={(e) => setRememberUserCredentials(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          비밀번호 기억하기
        </label>
      )}

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
