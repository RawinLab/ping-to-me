"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";
import { routing } from "@/i18n/routing";
import { Button } from "@pingtome/ui";
import { Languages } from "lucide-react";

const localeLabels: Record<string, string> = {
  en: "EN",
  th: "TH",
};

export function LanguageSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = routing.locales.find((l) => l !== locale) || locale;

  const switchLocale = () => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={switchLocale}
      disabled={isPending}
      className="gap-1.5 text-xs font-medium"
    >
      <Languages className="h-3.5 w-3.5" />
      {localeLabels[nextLocale]}
    </Button>
  );
}
