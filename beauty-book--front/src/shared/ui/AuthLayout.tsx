"use client";

import Image from "next/image";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useTranslation("auth");

  const { data: siteSetting } = useQuery({
    queryKey: ["site-settings"],
    queryFn: siteSettingApi.get,
    staleTime: 5 * 60 * 1000,
  });

  const heroImageUrl = siteSetting?.heroImageUrl ?? null;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-6 sm:py-10 bg-gradient-to-br from-muted/40 via-background to-accent/10">
      <div className="relative w-full max-w-6xl">
        {/* Soft outer glow ring */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[1.75rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-xl"
        />

        {/* Card = the "booklet" — items-stretch makes both pages equal height */}
        <div className="relative grid lg:grid-cols-[3fr_2fr] items-stretch rounded-2xl border-2 border-border bg-background shadow-[0_24px_70px_-18px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-hidden lg:min-h-[780px]">
          <span
            aria-hidden
            className="hidden lg:block absolute top-6 bottom-6 left-1/2 w-px bg-border"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/70 via-primary to-primary/70"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-accent/60 via-accent to-accent/60"
          />

          {/* Left page — full-bleed hero image */}
          <section className="relative hidden lg:flex h-full overflow-hidden bg-muted">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt="대문 이미지"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 512px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/20 text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
                <span className="text-xs font-medium">
                  {t("imagePlaceholder", { defaultValue: "소개 이미지 영역" })}
                </span>
              </div>
            )}

            {/* Brand overlay */}
            <div className="absolute top-5 left-5 flex items-center gap-2 text-sm font-semibold tracking-tight text-white drop-shadow">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              BeautyBook
            </div>

            {/* Copyright overlay */}
            <p className="absolute bottom-4 left-5 text-[10px] text-white/60">
              © {new Date().getFullYear()} BeautyBook
            </p>
          </section>

          {/* Right page — form */}
          <section className="flex h-full items-center justify-center p-6 sm:p-8">
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
