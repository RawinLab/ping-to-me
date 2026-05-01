"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from "@pingtome/ui";
import { apiRequest } from "@/lib/api";
import { Eye, MousePointerClick, Users, TrendingUp, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format, parseISO } from "date-fns";

interface BioAnalyticsDashboardProps {
  bioPageId: string;
}

interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  uniqueVisitors: number;
}

interface ViewsByDate {
  date: string;
  views: number;
}

interface TimeSeriesData {
  viewsByDate: ViewsByDate[];
}

interface LinkClick {
  linkId: string;
  title: string;
  url: string;
  clicks: number;
  percentage: number;
}

interface LinkClicksData {
  linkClicks: LinkClick[];
}

export function BioAnalyticsDashboard({ bioPageId }: BioAnalyticsDashboardProps) {
  const t = useTranslations("bio");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [linkClicks, setLinkClicks] = useState<LinkClicksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    fetchAnalytics();
  }, [bioPageId, days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all analytics data in parallel
      const [summaryData, timeSeriesData, clicksData] = await Promise.all([
        apiRequest(`/biopages/${bioPageId}/analytics/summary?days=${days}`),
        apiRequest(`/biopages/${bioPageId}/analytics/timeseries?period=${days}d`),
        apiRequest(`/biopages/${bioPageId}/analytics/clicks`),
      ]);

      setSummary(summaryData);
      setTimeSeries(timeSeriesData);
      setLinkClicks(clicksData);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError(err?.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Format chart data
  const chartData = timeSeries?.viewsByDate?.map((item) => ({
    date: format(parseISO(item.date), "MMM dd"),
    views: item.views,
  })) || [];

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-muted-foreground">
            {t("viewsLabel")}: <span className="font-semibold text-primary">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("errorLoadingAnalytics")}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={fetchAnalytics}
            className="text-sm text-primary hover:underline"
          >
            {t("tryAgain")}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Views */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalViews")}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalViews?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("lastDays", { days: String(days) })}
            </p>
          </CardContent>
        </Card>

        {/* Total Clicks */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalClicks")}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <MousePointerClick className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalClicks?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("linkClicks")}
            </p>
          </CardContent>
        </Card>

        {/* Unique Visitors */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("uniqueVisitors")}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.uniqueVisitors?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("distinctVisitors")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t("viewsOverTime")}
              </CardTitle>
              <CardDescription>
                {t("dailyViews", { days: String(days) })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1 bg-background"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>{t("noViewData")}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Links by Clicks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5 text-primary" />
            {t("topLinksByClicks")}
          </CardTitle>
          <CardDescription>
            {t("mostClickedLinks")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkClicks?.linkClicks && linkClicks.linkClicks.length > 0 ? (
            <div className="space-y-4">
              {linkClicks.linkClicks.map((link) => (
                <div key={link.linkId} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant="secondary" className="shrink-0">
                        {link.clicks.toLocaleString()} {t("clicksLabel").toLowerCase()}
                      </Badge>
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {link.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${link.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <MousePointerClick className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">{t("noClickDataYet")}</p>
              <p className="text-sm mt-1">
                {t("clicksWillAppear")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Click Distribution Chart (Optional - using bar chart) */}
      {linkClicks?.linkClicks && linkClicks.linkClicks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("clickDistribution")}</CardTitle>
            <CardDescription>
              {t("visualBreakdown")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={linkClicks.linkClicks}>
                <XAxis
                  dataKey="title"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium">{payload[0].payload.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("clicksLabel")}: <span className="font-semibold text-primary">{payload[0].value}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payload[0].payload.percentage.toFixed(1)}% {t("ofTotal")}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="clicks"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
