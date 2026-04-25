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
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-6 bg-gradient-to-br from-muted/40 via-background to-accent/10">
      <div className="w-full max-w-[1300px]">
        {/* Card */}
        <div className="grid lg:grid-cols-[3fr_2fr] items-stretch rounded-3xl border border-border bg-background shadow-2xl overflow-hidden lg:min-h-[820px]">

          {/* Left — hero image */}
          <section className="relative hidden lg:block bg-muted">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt="대문 이미지"
                fill
                unoptimized
                sizes="780px"
                className="object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-secondary/30 to-accent/20 text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
                <span className="text-sm font-medium">
                  {t("imagePlaceholder", { defaultValue: "소개 이미지 영역" })}
                </span>
              </div>
            )}

            {/* BeautyBook overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-white drop-shadow-md">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/25 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              BeautyBook
            </div>

            <p className="absolute bottom-5 left-6 text-[10px] text-white/50">
              © {new Date().getFullYear()} BeautyBook
            </p>
          </section>

          {/* Right — form */}
          <section className="flex h-full items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
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
