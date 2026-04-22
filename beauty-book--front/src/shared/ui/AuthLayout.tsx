"use client";

import { Sparkles, Shield, Palette, Globe, Image as ImageIcon } from "lucide-react";
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
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10 sm:py-14 bg-gradient-to-br from-muted/40 via-background to-accent/10">
      <div className="relative w-full max-w-4xl">
        {/* Soft outer glow ring for emphasis */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[1.75rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-xl"
        />

        {/* Card = the "booklet" */}
        <div className="relative grid lg:grid-cols-2 rounded-2xl border-2 border-border bg-background shadow-[0_24px_70px_-18px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-hidden">
          {/* Spine (center divider on lg+) */}
          <span
            aria-hidden
            className="hidden lg:block absolute top-6 bottom-6 left-1/2 w-px bg-border"
          />
          {/* Top + bottom accent bars evoking book edges */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/70 via-primary to-primary/70"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-accent/60 via-accent to-accent/60"
          />

          {/* Left page — brand intro */}
          <section className="relative hidden lg:flex flex-col gap-5 overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/20 p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-accent/30 blur-3xl"
            />

            {/* Brand */}
            <div className="relative flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              BeautyBook
            </div>

            {/* Image placeholder */}
            <div className="relative flex-1 min-h-[140px] flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-background/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
                <span className="text-[11px] font-medium">{t("imagePlaceholder")}</span>
              </div>
              <span className="absolute top-2 left-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ring-1 ring-border">
                {t("imagePlaceholderTag")}
              </span>
            </div>

            {/* Intro copy */}
            <div className="relative space-y-3">
              <h2 className="text-xl font-bold leading-snug tracking-tight text-foreground whitespace-pre-line">
                {t("introTitle")}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("introSubtitle")}
              </p>

              <ul className="space-y-2 pt-1">
                {features.map(({ icon: Icon, key }) => (
                  <li
                    key={key}
                    className="flex items-center gap-2.5 text-xs text-foreground/80"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/70 ring-1 ring-border shadow-sm">
                      <Icon className="h-3 w-3 text-primary" />
                    </span>
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="relative text-[10px] text-muted-foreground">
              © {new Date().getFullYear()} BeautyBook · Auth Boilerplate
            </p>
          </section>

          {/* Right page — form */}
          <section className="flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-sm space-y-5">
              <div className="space-y-1.5 text-center lg:text-left">
                <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
