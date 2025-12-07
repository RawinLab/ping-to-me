"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Progress,
} from "@pingtome/ui";
import { format } from "date-fns";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  Users,
  Globe,
  Link as LinkIcon,
  Calendar,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LocationData {
  name: string;
  value: number;
  percentage: number;
}

interface ReferrerData {
  name: string;
  value: number;
  percentage: number;
}

interface LinkClickData {
  linkId: string;
  title: string;
  url: string;
  clicks: number;
  percentage: number;
}

const CHART_COLORS = {
  blue: "#3B82F6",
  indigo: "#6366F1",
  cyan: "#06B6D4",
};

export default function BioPageAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [page, setPage] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any>(null);
  const [clicks, setClicks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [expandedReferrers, setExpandedReferrers] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState(false);

  const fetchData = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const period = dateRange;

      const [pageRes, summaryRes, timeseriesRes, clicksRes] = await Promise.all([
        apiRequest(`/biopages/${slug}`).catch(() => null),
        apiRequest(`/biopages/${slug}/analytics/summary?period=${period}`).catch(() => ({
          totalViews: 0,
          totalClicks: 0,
          uniqueVisitors: 0,
        })),
        apiRequest(`/biopages/${slug}/analytics/timeseries?period=${period}`).catch(() => ({
          viewsByDate: [],
        })),
        apiRequest(`/biopages/${slug}/analytics/clicks?period=${period}`).catch(() => ({
          linkClicks: [],
          referrers: {},
          countries: {},
        })),
      ]);

      setPage(pageRes);
      setSummary(summaryRes);
      setTimeseries(timeseriesRes);
      setClicks(clicksRes);
    } catch (err) {
      console.error("Failed to load analytics data", err);
    } finally {
      setLoading(false);
    }
  }, [slug, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/biopages/${slug}/analytics/export?period=${dateRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `biopage-${slug}-analytics.csv`;
      a.click();
    } catch (err) {
      console.error("Failed to export analytics");
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Bio page not found</div>
      </div>
    );
  }

  // Process chart data
  const chartData = timeseries?.viewsByDate || [];

  // Process link clicks data
  const linkClicksData: LinkClickData[] = clicks?.linkClicks || [];
  const totalLinkClicks = linkClicksData.reduce((sum: number, link: LinkClickData) => sum + link.clicks, 0);

  // Process referrers data
  const referrersData: ReferrerData[] = Object.entries(clicks?.referrers || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage: totalLinkClicks > 0 ? Math.round(((value as number) / totalLinkClicks) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Process countries data
  const countriesData: LocationData[] = Object.entries(clicks?.countries || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage: totalLinkClicks > 0 ? Math.round(((value as number) / totalLinkClicks) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const displayReferrersCount = expandedReferrers ? referrersData.length : 5;
  const hasMoreReferrers = referrersData.length > 5;

  const displayCountriesCount = expandedCountries ? countriesData.length : 5;
  const hasMoreCountries = countriesData.length > 5;

  const maxCountryValue = Math.max(...countriesData.map((d) => d.value), 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/biopages")}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bio Pages
        </Button>

        {/* Bio Page Header Card */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
                  {page.title}
                </h1>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL}/bio/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  {process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '')}/bio/{slug}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {page.description && (
                  <p className="text-sm text-slate-500 max-w-2xl">{page.description}</p>
                )}
              </div>
            </div>

            {/* Bio Page Meta */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Created {format(new Date(page.createdAt), "MMMM d, yyyy")}
              </div>
              {page.links && page.links.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LinkIcon className="h-4 w-4" />
                  {page.links.length} {page.links.length === 1 ? 'link' : 'links'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Total Views</p>
                  <p className="text-4xl font-bold tracking-tight">
                    {(summary?.totalViews || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Total Clicks</p>
                  <p className="text-4xl font-bold tracking-tight">
                    {(summary?.totalClicks || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <MousePointerClick className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Unique Visitors</p>
                  <p className="text-4xl font-bold tracking-tight">
                    {(summary?.uniqueVisitors || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Users className="h-6 w-6 text-green-600" />
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
              {format(new Date(Date.now() - (dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90) * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
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
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Views Chart */}
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-semibold">Views over time</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4 text-blue-600" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={0} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="views"
                      fill={CHART_COLORS.blue}
                      radius={[4, 4, 0, 0]}
                      name="Views"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No view data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Link Clicks Performance */}
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-purple-600" />
              Clicks per Link
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {linkClicksData.length > 0 ? (
              <div className="space-y-4">
                {linkClicksData.map((link) => (
                  <div key={link.linkId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-slate-700 truncate">
                          {link.title || link.url}
                        </span>
                        {link.title && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-slate-500">
                          {link.clicks.toLocaleString()}
                        </span>
                        <span className="font-semibold text-purple-600 w-12 text-right">
                          {link.percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={link.percentage}
                      className="h-2 bg-purple-100"
                      style={{
                        "--progress-background": "#9333ea",
                      } as React.CSSProperties}
                    />
                    {!link.title && (
                      <p className="text-xs text-slate-400 truncate pl-2">
                        {link.url}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                No link click data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrers and Countries */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Referrers */}
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-cyan-600" />
                Top Referrers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {referrersData.length > 0 ? (
                <div className="space-y-3">
                  {referrersData.slice(0, displayReferrersCount).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm text-slate-500 w-5">{index + 1}</span>
                        <span className="text-sm text-slate-700 truncate" title={item.name}>
                          {item.name || "Direct"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 w-10 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {hasMoreReferrers && (
                    <button
                      onClick={() => setExpandedReferrers(!expandedReferrers)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors mt-2"
                    >
                      {expandedReferrers ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show {referrersData.length - 5} more
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  No referrer data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {countriesData.length > 0 ? (
                <div className="space-y-3">
                  {countriesData.slice(0, displayCountriesCount).map((item, index) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm text-slate-500 w-5">{index + 1}</span>
                          <span className="text-sm font-medium text-slate-700">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden ml-7">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-green-500"
                          style={{
                            width: `${(item.value / maxCountryValue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {hasMoreCountries && (
                    <button
                      onClick={() => setExpandedCountries(!expandedCountries)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors mt-2"
                    >
                      {expandedCountries ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show {countriesData.length - 5} more
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  No country data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
