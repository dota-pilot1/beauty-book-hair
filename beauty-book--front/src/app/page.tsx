"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/user/model/authStore";
import { getDefaultHomePath } from "@/shared/lib/routing/defaultHome";

export default function Home() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getDefaultHomePath(user?.role.code));
    }
    else if (status === "anonymous") router.replace("/login");
  }, [status, user, router]);

  return null;
}
