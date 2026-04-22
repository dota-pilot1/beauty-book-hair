"use client";

import { Sparkles, Shield, Palette, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useTranslation("auth");

  const features = [
    { icon: Shield, key: "featureAuth" as const },
    { icon: Palette, key: "featureTheme" as const },
    { icon: Globe, key: "featureI18n" as const },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] grid lg:grid-cols-2">
      {/* Left: brand intro */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/20 p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent/30 blur-3xl"
        />

        <div className="relative flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          BeautyBook
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-foreground whitespace-pre-line">
            {t("introTitle")}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md">
            {t("introSubtitle")}
          </p>

          <ul className="space-y-3 pt-2">
            {features.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3 text-sm text-foreground/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/70 ring-1 ring-border shadow-sm">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} BeautyBook · Auth Boilerplate
        </p>
      </section>

      {/* Right: form */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
