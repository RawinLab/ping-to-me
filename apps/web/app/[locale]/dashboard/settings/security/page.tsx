"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger, Skeleton } from "@pingtome/ui";
import { Shield, Smartphone, Activity } from "lucide-react";
import { SecuritySettingsTab } from "@/components/settings/SecuritySettingsTab";
import { ActiveSessionsTab } from "@/components/settings/ActiveSessionsTab";
import { LoginActivityTab } from "@/components/settings/LoginActivityTab";

function SecurityPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("settings.security");

  const tabParam = searchParams.get("tab");
  const validTabs = ["security", "sessions", "activity"];
  const initialTab = validTabs.includes(tabParam || "") ? tabParam! : "security";

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    if (value === "security") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", value);
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-slate-500 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-12 p-1 bg-slate-100 rounded-xl">
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tabsSecurity")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tabsSessions")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tabsActivity")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="mt-6">
            <SecuritySettingsTab />
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <ActiveSessionsTab />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <LoginActivityTab />
          </TabsContent>
        </Tabs>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-12 w-full max-w-lg" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SecurityPageContent />
    </Suspense>
  );
}
