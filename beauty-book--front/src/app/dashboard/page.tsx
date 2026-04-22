"use client";

import { useTranslation } from "react-i18next";
import { RequireAuth } from "@/widgets/guards/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const { t } = useTranslation("common");
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-3">{t("brand")}</h1>
      <p className="text-muted-foreground max-w-md">
        {t("tagline")}
        <br />
        {t("description")}
      </p>
    </main>
  );
}
