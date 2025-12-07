"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "@pingtome/ui";
import { format } from "date-fns";
import {
  Download,
  Calendar,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Link2,
  MousePointerClick,
} from "lucide-react";
import {
  EngagementsChart,
  LocationsChart,
  DevicesChart,
  ReferrersChart,
} from "@/components/dashboard";

const DEVICE_COLORS = {
  Desktop: "#3B82F6",
  Mobile: "#06B6D4",
  Tablet: "#F97316",
  Other: "#8B5CF6",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const res = await apiRequest(`/analytics/dashboard?days=${days}`);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = async () => {
    // TODO: Implement export
    alert("Export functionality coming soon");
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">No analytics data found</div>
      </div>
    );
  }

  // Process data
  const totalClicks = data.totalClicks || 0;
  const allTimeClicks = data.allTimeClicks || totalClicks;
  const totalLinks = data.totalLinks || 0;
  const chartData = data.clicksByDate || [];

  // Process location data
  const countriesData = Object.entries(data.countries || {})
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
  const devicesData = Object.entries(data.devices || {}).map(
    ([name, value]) => ({
      name,
      value: value as number,
      color:
        DEVICE_COLORS[name as keyof typeof DEVICE_COLORS] ||
        DEVICE_COLORS.Other,
    }),
  );

  // Process referrers data
  const referrersData = Object.entries(data.referrers || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage:
        totalClicks > 0
          ? Math.round(((value as number) / totalClicks) * 100)
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              Analytics Overview
            </h1>
            <p className="text-slate-500 mt-1">
              Track performance across all your links
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-600">
                    Total Engagements
                  </p>
                  <p className="text-4xl font-bold tracking-tight">
                    {allTimeClicks.toLocaleString()}
                  </p>
                  {dateRange !== "90d" && totalClicks !== allTimeClicks && (
                    <p className="text-xs text-muted-foreground">
                      {totalClicks.toLocaleString()} in last{" "}
                      {dateRange === "7d" ? "7" : "30"} days
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <MousePointerClick className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Active Links
                  </p>
                  <p className="text-4xl font-bold tracking-tight">
                    {totalLinks.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Link2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Avg. per Link
                  </p>
                  <p className="text-4xl font-bold tracking-tight">
                    {totalLinks > 0
                      ? Math.round(totalClicks / totalLinks).toLocaleString()
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    clicks in last{" "}
                    {dateRange === "7d"
                      ? "7"
                      : dateRange === "30d"
                        ? "30"
                        : "90"}{" "}
                    days
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
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
                  ? "7 Days"
                  : range === "30d"
                    ? "30 Days"
                    : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Engagements Chart */}
        <EngagementsChart data={chartData} onExport={handleExport} />

        {/* Top Performing Links */}
        {data.topLinks && data.topLinks.length > 0 && (
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Top Performing Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Link</TableHead>
                    <TableHead className="font-semibold text-right">
                      Clicks
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topLinks.map((link: any, index: number) => (
                    <TableRow key={link.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-muted-foreground w-12">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${link.originalUrl ? new URL(link.originalUrl).hostname : ""}&sz=16`}
                              alt=""
                              className="w-4 h-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {link.title ||
                                (link.originalUrl
                                  ? new URL(link.originalUrl).hostname
                                  : link.slug)}
                            </p>
                            <p className="text-xs text-blue-600 truncate">
                              pingto.me/{link.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                          {link.clicks.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/links/${link.id}/analytics`)
                          }
                        >
                          View
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Locations */}
        <LocationsChart
          countries={countriesData}
          cities={[]}
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

        {/* Recent Activity */}
        {data.recentClicks && data.recentClicks.length > 0 && (
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <CardTitle className="text-lg font-semibold">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Link</TableHead>
                    <TableHead className="font-semibold">Country</TableHead>
                    <TableHead className="font-semibold">Referrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentClicks.map((click: any) => (
                    <TableRow key={click.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">
                        {format(new Date(click.timestamp), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-600 text-sm">
                          pingto.me/{click.link?.slug || "—"}
                        </span>
                      </TableCell>
                      <TableCell>{click.country || "Unknown"}</TableCell>
                      <TableCell className="max-w-xs truncate text-slate-500">
                        {click.referrer || "Direct"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
