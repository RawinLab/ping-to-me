"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ActivityPage() {
  const router = useRouter();
  const t = useTranslations("settings.redirect");

  useEffect(() => {
    router.replace("/dashboard/settings/security?tab=activity");
  }, [router]);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <p className="text-slate-500">{t("redirecting")}</p>
      </div>
    </div>
  );
}
