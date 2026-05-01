"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@pingtome/ui";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Calendar,
  Target,
  Link2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  FileText,
  Activity,
  BarChart3,
  MousePointerClick,
} from "lucide-react";
import {
  EngagementsChart,
  LocationsChart,
  DevicesChart,
  ReferrersChart,
  BrowserChart,
  OSChart,
} from "@/components/dashboard";
import { cn } from "@pingtome/ui";

const DEVICE_COLORS = {
  Desktop: "#3B82F6",
  Mobile: "#06B6D4",
  Tablet: "#F97316",
  Other: "#8B5CF6",
};

const statusColors = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-300",
  PAUSED: "bg-amber-100 text-amber-700 border-amber-300",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-300",
};

const statusIcons = {
  DRAFT: Activity,
  ACTIVE: TrendingUp,
  PAUSED: BarChart3,
  COMPLETED: Target,
};

interface Campaign {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  startDate?: string;
  endDate?: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  goalType?: string;
  goalTarget?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    links: number;
  };
}

interface LinkAnalytics {
  id: string;
  slug: string;
  title?: string;
  originalUrl: string;
  clicks: number;
  uniqueClicks?: number;
  clickRate?: number;
}

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("campaigns");
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [linkAnalytics, setLinkAnalytics] = useState<LinkAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchCampaignDetails = useCallback(async () => {
    try {
      const res = await apiRequest(`/campaigns/${id}`);
      setCampaign(res);
    } catch (err) {
      console.error("Failed to load campaign details");
    }
  }, [id]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;

      // Fetch campaign analytics
      const analyticsRes = await apiRequest(`/campaigns/${id}/analytics?days=${days}`);
      setAnalytics(analyticsRes);

      // Fetch links in the campaign
      const linksRes = await apiRequest(`/campaigns/${id}/links`);

      // Fetch analytics for each link
      const linkAnalyticsPromises = linksRes.map(async (link: any) => {
        try {
          const linkAnalyticsRes = await apiRequest(`/links/${link.id}/analytics?days=${days}`);
          return {
            id: link.id,
            slug: link.slug,
            title: link.title,
            originalUrl: link.originalUrl,
            clicks: linkAnalyticsRes.totalClicks || 0,
            uniqueClicks: linkAnalyticsRes.uniqueClicks || 0,
            clickRate: 0, // Can be calculated if needed
          };
        } catch (err) {
          return {
            id: link.id,
            slug: link.slug,
            title: link.title,
            originalUrl: link.originalUrl,
            clicks: 0,
            uniqueClicks: 0,
            clickRate: 0,
          };
        }
      });

      const linkAnalyticsData = await Promise.all(linkAnalyticsPromises);
      setLinkAnalytics(linkAnalyticsData.sort((a, b) => b.clicks - a.clicks));
    } catch (err) {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [id, dateRange]);

  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
      fetchAnalytics();
    }
  }, [id, fetchCampaignDetails, fetchAnalytics]);

  // Re-fetch when date range changes
  useEffect(() => {
    if (id && analytics) {
      fetchAnalytics();
    }
  }, [dateRange]);

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      const token = localStorage.getItem("token");
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;

      const endpoint = format === 'pdf'
        ? `/campaigns/${id}/analytics/export/pdf?days=${days}`
        : `/campaigns/${id}/analytics/export?days=${days}`;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === 'pdf'
        ? `campaign-analytics-${campaign?.name || id}-${new Date().toISOString().split('T')[0]}.pdf`
        : `campaign-analytics-${campaign?.name || id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export analytics:", err);
      // Fallback: Export link analytics as CSV manually
      if (format === 'csv') {
        const csvContent = [
          ['Link', 'Slug', 'Clicks', 'Unique Clicks'],
          ...linkAnalytics.map(link => [
            link.title || link.originalUrl,
            link.slug,
            link.clicks,
            link.uniqueClicks || 0
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `campaign-analytics-${campaign?.name || id}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">
          {t("loadingAnalytics")}
        </div>
      </div>
    );
  }

  if (!analytics || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t("noAnalyticsDataFound")}</div>
      </div>
    );
  }

  // Process data for charts
  const chartData = analytics.clicksByDate || [];
  const totalClicks = analytics.totalClicks || 0;
  const uniqueClicks = analytics.uniqueClicks || 0;
  const totalLinks = linkAnalytics.length;
  const avgClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0;

  // Process location data
  const countriesData = Object.entries(analytics.countries || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage:
        totalClicks > 0
          ? Math.round(((value as number) / totalClicks) * 100)
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const citiesData = Object.entries(analytics.cities || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage:
        totalClicks > 0
          ? Math.round(((value as number) / totalClicks) * 100)
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Process device data
  const devicesData = Object.entries(analytics.devices || {}).map(
    ([name, value]) => ({
      name,
      value: value as number,
      color:
        DEVICE_COLORS[name as keyof typeof DEVICE_COLORS] ||
        DEVICE_COLORS.Other,
    }),
  );

  // Process browser data
  const browsersData = Object.entries(analytics.browsers || {}).map(
    ([name, value]) => ({
      name,
      value: value as number,
    }),
  );

  // Process OS data
  const osData = Object.entries(analytics.os || {}).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  // Process referrers data
  const referrersData = Object.entries(analytics.referrers || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage:
        totalClicks > 0
          ? Math.round(((value as number) / totalClicks) * 100)
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const weeklyChange = analytics.weeklyChange || 0;
  const clicksLast7Days = analytics.clicksLast7Days || 0;
  const periodChange = analytics.periodChange ?? 0;
  const StatusIcon = statusIcons[campaign.status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/campaigns")}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToCampaigns")}
        </Button>

        {/* Campaign Header Card */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Campaign Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center border border-blue-200 shadow-sm">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
                      {campaign.name}
                    </h1>
                    <Badge
                      className={cn(
                        "border",
                        statusColors[campaign.status]
                      )}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {campaign.status.charAt(0) +
                        campaign.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-slate-500">
                      {campaign.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {t("export")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      {t("exportAsCsv")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileText className="h-4 w-4 mr-2" />
                      {t("exportAsPdf")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Campaign Meta */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                {campaign.startDate
                  ? format(new Date(campaign.startDate), "MMM d, yyyy")
                  : t("noStart")}{" "}
                →{" "}
                {campaign.endDate
                  ? format(new Date(campaign.endDate), "MMM d, yyyy")
                  : t("ongoing")}
              </div>
              {campaign.goalType && campaign.goalTarget && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Target className="h-4 w-4" />
                  {t("goal")}: {campaign.goalTarget.toLocaleString()} {campaign.goalType}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link2 className="h-4 w-4" />
                {totalLinks} {totalLinks === 1 ? t("link") : t("links")}
              </div>
            </div>

            {/* UTM Parameters if present */}
            {(campaign.utmSource || campaign.utmMedium || campaign.utmCampaign) && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">{t("utmParametersLabel")}</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.utmSource && (
                    <Badge variant="outline" className="text-xs">
                      {t("source")} {campaign.utmSource}
                    </Badge>
                  )}
                  {campaign.utmMedium && (
                    <Badge variant="outline" className="text-xs">
                      {t("medium")} {campaign.utmMedium}
                    </Badge>
                  )}
                  {campaign.utmCampaign && (
                    <Badge variant="outline" className="text-xs">
                      {t("campaign")} {campaign.utmCampaign}
                    </Badge>
                  )}
                  {campaign.utmTerm && (
                    <Badge variant="outline" className="text-xs">
                      {t("term")} {campaign.utmTerm}
                    </Badge>
                  )}
                  {campaign.utmContent && (
                    <Badge variant="outline" className="text-xs">
                      {t("content")} {campaign.utmContent}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-600">
                  {t("totalClicks")}
                </p>
                <p className="text-4xl font-bold tracking-tight">
                  {totalClicks.toLocaleString()}
                </p>
                {periodChange !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    {periodChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : periodChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span
                      className={
                        periodChange > 0
                          ? "text-emerald-500"
                          : periodChange < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }
                    >
                      {periodChange > 0 ? "+" : ""}
                      {periodChange}% {t("vsPreviousPeriod")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">
                  {t("uniqueVisitors")}
                </p>
                <p className="text-4xl font-bold tracking-tight">
                  {uniqueClicks.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">
                  {totalClicks > 0 ? Math.round((uniqueClicks / totalClicks) * 100) : 0}% {t("ofTotal")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">
                  {t("totalLinks")}
                </p>
                <p className="text-4xl font-bold tracking-tight">
                  {totalLinks}
                </p>
                <p className="text-sm text-slate-500">
                  {t("inThisCampaign")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">
                  {t("avgClicksPerLink")}
                </p>
                <p className="text-4xl font-bold tracking-tight">
                  {avgClicksPerLink.toLocaleString()}
                </p>
                {weeklyChange !== 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    {weeklyChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        weeklyChange > 0 ? "text-emerald-500" : "text-red-500"
                      }
                    >
                      {weeklyChange > 0 ? "+" : ""}
                      {weeklyChange}% {t("vsLastWeek")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>
              {format(
                new Date(
                  Date.now() -
                    (dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90) *
                      24 *
                      60 *
                      60 *
                      1000,
                ),
                "MMM d, yyyy",
              )}
              {" → "}
              {format(new Date(), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                disabled={loading}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {range === "7d"
                  ? t("sevenDays")
                  : range === "30d"
                    ? t("thirtyDays")
                    : t("ninetyDays")}
              </button>
            ))}
          </div>
        </div>

        {/* Engagements Chart */}
        <EngagementsChart data={chartData} onExport={handleExport} />

        {/* Link Performance Table */}
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600" />
              {t("linkPerformance")}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("exportAsCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("exportAsPdf")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold">{t("link")}</TableHead>
                  <TableHead className="font-semibold">{t("shortUrl")}</TableHead>
                  <TableHead className="font-semibold text-right">{t("clicks")}</TableHead>
                  <TableHead className="font-semibold text-right">{t("unique")}</TableHead>
                  <TableHead className="font-semibold text-right">{t("percentOfTotal")}</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkAnalytics.length > 0 ? (
                  linkAnalytics.map((link) => (
                    <TableRow key={link.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">
                          {link.title || new URL(link.originalUrl).hostname}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {link.originalUrl}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://${process.env.NEXT_PUBLIC_SHORT_URL || "pingto.me"}/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {link.slug}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {link.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(link.uniqueClicks || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {totalClicks > 0
                            ? Math.round((link.clicks / totalClicks) * 100)
                            : 0}
                          %
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/links/${link.id}/analytics`)
                          }
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {t("viewDetails")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      {t("noLinksInCampaign")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Locations */}
        <LocationsChart
          countries={countriesData}
          cities={citiesData}
          onExport={handleExport}
        />

        {/* Referrers and Devices */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ReferrersChart
            data={referrersData}
            totalClicks={totalClicks}
            onExport={handleExport}
          />
          <DevicesChart
            data={devicesData}
            totalClicks={totalClicks}
            onExport={handleExport}
          />
        </div>

        {/* Browsers and Operating Systems */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BrowserChart
            data={browsersData}
            totalClicks={totalClicks}
            onExport={handleExport}
          />
          <OSChart
            data={osData}
            totalClicks={totalClicks}
            onExport={handleExport}
          />
        </div>

        {/* Recent Activity */}
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold">
              {t("recentActivity")}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4 text-blue-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("exportAsCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("exportAsPdf")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold">{t("time")}</TableHead>
                  <TableHead className="font-semibold">{t("link")}</TableHead>
                  <TableHead className="font-semibold">{t("country")}</TableHead>
                  <TableHead className="font-semibold">{t("city")}</TableHead>
                  <TableHead className="font-semibold">{t("device")}</TableHead>
                  <TableHead className="font-semibold">{t("referrer")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentClicks?.slice(0, 10).map((click: any) => (
                  <TableRow key={click.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">
                      {format(new Date(click.timestamp), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {click.linkSlug || t("unknown")}
                    </TableCell>
                    <TableCell>{click.country || t("unknown")}</TableCell>
                    <TableCell>{click.city || t("unknown")}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {click.device || t("unknown")}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-slate-500">
                      {click.referrer || t("direct")}
                    </TableCell>
                  </TableRow>
                ))}
                {(!analytics.recentClicks || analytics.recentClicks.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      {t("noRecentActivity")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
