"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from "@pingtome/ui";
import { apiRequest, getAccessToken } from "@/lib/api";
import { useTranslations } from "next-intl";
import { useOrganization } from "@/contexts/OrganizationContext";
import { LinksTable } from "@/components/links/LinksTable";
import { ImportLinksModal } from "@/components/links/ImportLinksModal";
import {
  Download,
  Upload,
  Link2,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  QrCode,
  FileText,
  Globe,
  Zap,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  EngagementsChart,
  DateRangePicker,
  TopBrowsersWidget,
  TopOSWidget,
  DashboardSkeleton,
} from "@/components/dashboard";
import { LiveClickCounter } from "@/components/dashboard/LiveClickCounter";

interface DateRange {
  start: Date;
  end: Date;
}

// Default date range: last 30 days
const getDefaultDateRange = (): DateRange => ({
  start: startOfDay(subDays(new Date(), 29)),
  end: endOfDay(new Date()),
});

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const t = useTranslations("dashboard.home");

  // Calculate days from date range for API call
  const days = useMemo(() => {
    const diffTime = Math.abs(dateRange.end.getTime() - dateRange.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 30;
  }, [dateRange]);

  useEffect(() => {
    // Wait for organization to be loaded before fetching
    if (!orgLoading && currentOrg) {
      fetchMetrics();
    }
  }, [refreshKey, days, orgLoading, currentOrg]);

  const fetchMetrics = async () => {
    if (!currentOrg) return;
    try {
      setLoading(true);
      const res = await apiRequest(`/analytics/dashboard?days=${days}`);
      setMetrics(res);
    } catch (err) {
      console.error("Failed to fetch dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/links/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "links.csv";
      a.click();
    } catch (err) {
      alert("Failed to export links");
    }
  };

  // Process chart data
  const chartData =
    metrics?.clicksByDate?.map((item: any) => ({
      date: item.date,
      clicks: item.count,
    })) || [];

  const weeklyClicks = chartData
    .slice(-7)
    .reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
  const previousWeekClicks = chartData
    .slice(-14, -7)
    .reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
  const weeklyChange =
    previousWeekClicks > 0
      ? Math.round(
          ((weeklyClicks - previousWeekClicks) / previousWeekClicks) * 100,
        )
      : 0;

  // Show skeleton loading state
  if (loading && !metrics) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {t("welcomeBack")}
            </h1>
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 border-0 font-medium"
            >
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              {t("live")}
            </Badge>
          </div>
          <p className="text-slate-500">
            {t("welcomeSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Picker */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="h-9"
          />
          <ImportLinksModal onSuccess={() => setRefreshKey((prev) => prev + 1)}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" />
              {t("import")}
            </Button>
          </ImportLinksModal>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 rounded-lg border-slate-200 hover:bg-slate-50"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
          <Link href="/dashboard/links/new">
            <Button
              size="sm"
              className="gap-2 h-9 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-4 w-4" />
              {t("createLink")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Links */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{t("totalLinks")}</p>
                <p className="text-4xl font-bold mt-2">
                  {loading
                    ? "..."
                    : metrics?.totalLinks?.toLocaleString() || "0"}
                </p>
                <p className="text-blue-100 text-xs mt-2 flex items-center gap-1">
                  Active & ready to use
                  {t("activeReady")}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Link2 className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Clicks */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  {t("totalEngagements")}
                </p>
                <p className="text-4xl font-bold mt-2">
                  {loading
                    ? "..."
                    : metrics?.allTimeClicks?.toLocaleString() ||
                      metrics?.totalClicks?.toLocaleString() ||
                      "0"}
                </p>
                <p className="text-emerald-100 text-xs mt-2 flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  {t("allTimeClicks")}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Target className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">{t("thisWeek")}</p>
                <p className="text-4xl font-bold mt-2">
                  {loading ? "..." : weeklyClicks.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {weeklyChange >= 0 ? (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />+{weeklyChange}%
                    </span>
                  ) : (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" />
                      {weeklyChange}%
                    </span>
                  )}
                  <span className="text-violet-200 text-xs">{t("vsLastWeek")}</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <TrendingUp className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">{t("today")}</p>
                <p className="text-4xl font-bold mt-2">
                  {loading
                    ? "..."
                    : chartData.length > 0
                      ? (
                          chartData[chartData.length - 1]?.clicks || 0
                        ).toLocaleString()
                      : "0"}
                </p>
                <p className="text-amber-100 text-xs mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t("updatedLive")}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Zap className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/links/new" className="group">
          <Card className="h-full border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Link2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {t("createLink")}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("shortenUrls")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/qr-codes" className="group">
          <Card className="h-full border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {t("qrCodes")}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("createBrandedQr")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/bio" className="group">
          <Card className="h-full border-slate-200 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      {t("bioPages")}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("buildBioPage")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Live Analytics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          {/* Engagements Chart */}
          {metrics && chartData.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    {t("engagementsOverview")}
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {t("trackPerformance")}
                  </p>
                </div>
                <Link href="/dashboard/analytics">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    {t("viewAnalytics")}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <EngagementsChart data={chartData} onExport={handleExport} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="md:col-span-1">
          <LiveClickCounter dashboard={true} showFeed={true} />
        </div>
      </div>

      {/* Browser & OS Summary */}
      {metrics && (metrics.browsers || metrics.os) && (
        <div className="grid gap-4 md:grid-cols-2">
          <TopBrowsersWidget
            browsers={metrics.browsers || {}}
            loading={loading}
          />
          <TopOSWidget
            os={metrics.os || {}}
            loading={loading}
          />
        </div>
      )}

      {/* Recent Links */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              {t("recentLinks")}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-0.5">
              {t("recentLinksDesc")}
            </p>
          </div>
          <Link href="/dashboard/links">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              {t("viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-4">
          <LinksTable key={refreshKey} limit={5} />
        </CardContent>
      </Card>

      {/* Getting Started Guide (shown when few links) */}
      {metrics && metrics.totalLinks < 5 && (
        <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  {t("getStarted")}
                </h3>
                <p className="text-slate-300 mb-4">
                  {t("getStartedDesc")}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/links/new">
                    <Button className="bg-white text-slate-900 hover:bg-slate-100 gap-2">
                      <Plus className="h-4 w-4" />
                      {t("createFirstLink")}
                    </Button>
                  </Link>
                  <Link href="/docs">
                    <Button
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700 gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      {t("readDocs")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            {/* Progress indicator */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">{t("gettingStartedProgress")}</span>
                <span className="text-white font-medium">
                  {t("linksCount", { count: Math.min(metrics.totalLinks, 5) })}
                </span>
              </div>
              <Progress
                value={Math.min((metrics.totalLinks / 5) * 100, 100)}
                className="h-2 bg-slate-700"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
