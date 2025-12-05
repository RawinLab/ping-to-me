"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  Download,
  Copy,
  MoreHorizontal,
  Pencil,
  Calendar,
  Tag,
  ExternalLink,
} from "lucide-react";
import {
  StatsCard,
  EngagementsChart,
  LocationsChart,
  DevicesChart,
} from "@/components/dashboard";

const DEVICE_COLORS = {
  Desktop: "#3B82F6",
  Mobile: "#6366F1",
  Tablet: "#06B6D4",
  Other: "#8B5CF6",
};

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    if (id) {
      fetchAnalytics();
      fetchLinkDetails();
    }
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const res = await apiRequest(`/links/${id}/analytics`);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkDetails = async () => {
    try {
      const res = await apiRequest(`/links/${id}`);
      setLink(res);
    } catch (err) {
      console.error("Failed to load link details");
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/links/${id}/analytics/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "analytics.csv";
      a.click();
    } catch (err) {
      alert("Failed to export analytics");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
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

  // Process data for charts
  const clicksByDate = data.recentClicks.reduce((acc: any, click: any) => {
    const date = format(new Date(click.timestamp), "MMM d");
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(clicksByDate)
    .map((date) => ({
      date,
      clicks: clicksByDate[date],
    }))
    .slice(-14);

  // Process location data
  const totalClicks = data.totalClicks || 0;
  const countriesData = Object.entries(data.countries || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage: totalClicks > 0 ? Math.round(((value as number) / totalClicks) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Process device data
  const devicesData = Object.entries(data.devices || {}).map(([name, value]) => ({
    name,
    value: value as number,
    color: DEVICE_COLORS[name as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.Other,
  }));

  // Calculate weekly change (mock for now)
  const weeklyChange = 23; // This should be calculated from actual data

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {link && (
            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                {link.title || link.slug || "Untitled Link"}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <a
                      href={`${process.env.NEXT_PUBLIC_SHORT_URL || "https://pingto.me"}/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      pingto.me/{link.slug}
                    </a>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {link.originalUrl}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(link.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </div>
                {link.tags && link.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {link.tags.slice(0, 2).join(", ")}
                    {link.tags.length > 2 && ` +${link.tags.length - 2} more`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              copyToClipboard(
                `${process.env.NEXT_PUBLIC_SHORT_URL || "https://pingto.me"}/${link?.slug}`
              )
            }
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Engagements"
          value={data.totalClicks.toLocaleString()}
          subtitle="All time"
        />
        <StatsCard
          title="Last 7 days"
          value={chartData
            .slice(-7)
            .reduce((sum, d) => sum + d.clicks, 0)
            .toLocaleString()}
        />
        <StatsCard
          title="Weekly change"
          value=""
          trend={{ value: weeklyChange, isPositive: weeklyChange > 0 }}
        />
      </div>

      {/* Date Range Selector */}
      <div className="flex justify-end">
        <div className="flex bg-muted rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === range
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Engagements Chart */}
      <EngagementsChart data={chartData} onExport={handleExport} />

      {/* Locations and Devices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LocationsChart countries={countriesData} onExport={handleExport} />
        <DevicesChart
          data={devicesData}
          totalClicks={totalClicks}
          onExport={handleExport}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4 text-primary" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Referrer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentClicks.slice(0, 10).map((click: any) => (
                <TableRow key={click.id}>
                  <TableCell className="font-medium">
                    {format(new Date(click.timestamp), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell>{click.country || "Unknown"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                      {click.device || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {click.referrer || "Direct"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
