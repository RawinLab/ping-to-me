"use client";

import { useEffect, useState, useCallback } from "react";
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
  Progress,
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
  QrCode,
  Share2,
  TrendingUp,
  TrendingDown,
  Check,
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

export default function LinkAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [link, setLink] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [copied, setCopied] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const res = await apiRequest(`/links/${id}/analytics?days=${days}`);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [id, dateRange]);

  const fetchLinkDetails = useCallback(async () => {
    try {
      const res = await apiRequest(`/links/${id}`);
      setLink(res);
    } catch (err) {
      console.error("Failed to load link details");
    }
  }, [id]);

  const fetchQrAnalytics = useCallback(async () => {
    try {
      setQrLoading(true);
      const res = await apiRequest(`/links/${id}/analytics/qr`);
      setQrData(res);
    } catch (err) {
      console.error("Failed to load QR analytics");
    } finally {
      setQrLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchAnalytics();
      fetchLinkDetails();
      fetchQrAnalytics();
    }
  }, [id, fetchAnalytics, fetchLinkDetails, fetchQrAnalytics]);

  // Re-fetch when date range changes
  useEffect(() => {
    if (id && data) {
      fetchAnalytics();
    }
  }, [dateRange]);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShortUrl = () => {
    return `${process.env.NEXT_PUBLIC_SHORT_URL || "pingto.me"}/${link?.slug}`;
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

  // Use clicksByDate from API if available, otherwise process from recentClicks
  const chartData = data.clicksByDate || [];

  // Process location data
  const totalClicks = data.totalClicks || 0;
  const allTimeClicks = data.allTimeClicks || totalClicks;
  const countriesData = Object.entries(data.countries || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage: totalClicks > 0 ? Math.round(((value as number) / totalClicks) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Process cities data
  const citiesData = Object.entries(data.cities || {})
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

  // Process referrers data
  const referrersData = Object.entries(data.referrers || {})
    .map(([name, value]) => ({
      name,
      value: value as number,
      percentage: totalClicks > 0 ? Math.round(((value as number) / totalClicks) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const weeklyChange = data.weeklyChange || 0;
  const clicksLast7Days = data.clicksLast7Days || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/links")}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Links
        </Button>

        {/* Link Header Card */}
        {link && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Favicon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(link.originalUrl).hostname}&sz=32`}
                      alt=""
                      className="w-6 h-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
                      {link.title || new URL(link.originalUrl).hostname}
                    </h1>
                    <a
                      href={`https://${getShortUrl()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      {getShortUrl()}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <span className="truncate max-w-md">{link.originalUrl}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg"
                    onClick={() => copyToClipboard(`https://${getShortUrl()}`)}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-lg">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-lg">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Link Meta */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(link.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </div>
                {link.tags && link.tags.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Tag className="h-4 w-4" />
                    {link.tags.slice(0, 2).join(", ")}
                    {link.tags.length > 2 && ` +${link.tags.length - 2} more`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Bitly Style */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-600">Total Engagements</p>
                <p className="text-4xl font-bold tracking-tight">{allTimeClicks.toLocaleString()}</p>
                {dateRange !== "90d" && totalClicks !== allTimeClicks && (
                  <p className="text-xs text-muted-foreground">
                    {totalClicks.toLocaleString()} in last {dateRange === "7d" ? "7" : "30"} days
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Last 7 days</p>
                <p className="text-4xl font-bold tracking-tight">{clicksLast7Days.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Weekly change</p>
                <div className="flex items-center gap-2">
                  {weeklyChange !== 0 ? (
                    <>
                      {weeklyChange > 0 ? (
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      )}
                      <span
                        className={`text-4xl font-bold tracking-tight ${
                          weeklyChange > 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {weeklyChange > 0 ? "+" : ""}{weeklyChange}%
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold tracking-tight text-slate-400">0%</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Click Sources Section */}
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              Click Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {qrLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">
                  Loading click sources...
                </div>
              </div>
            ) : qrData ? (
              <div className="space-y-4">
                {/* QR Scans */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="font-medium text-slate-700">QR Scans</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {qrData.qrScans.toLocaleString()}
                      </span>
                      <span className="font-semibold text-purple-600 w-12 text-right">
                        {qrData.totalClicks > 0
                          ? Math.round((qrData.qrScans / qrData.totalClicks) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={qrData.totalClicks > 0
                      ? (qrData.qrScans / qrData.totalClicks) * 100
                      : 0}
                    className="h-2 bg-purple-100"
                    style={{
                      "--progress-background": "#a855f7",
                    } as React.CSSProperties}
                  />
                </div>

                {/* Direct Clicks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-slate-700">Direct Clicks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {qrData.directClicks.toLocaleString()}
                      </span>
                      <span className="font-semibold text-blue-600 w-12 text-right">
                        {qrData.totalClicks > 0
                          ? Math.round((qrData.directClicks / qrData.totalClicks) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={qrData.totalClicks > 0
                      ? (qrData.directClicks / qrData.totalClicks) * 100
                      : 0}
                    className="h-2 bg-blue-100"
                    style={{
                      "--progress-background": "#3b82f6",
                    } as React.CSSProperties}
                  />
                </div>

                {/* API Clicks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-medium text-slate-700">API Clicks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {qrData.apiClicks.toLocaleString()}
                      </span>
                      <span className="font-semibold text-green-600 w-12 text-right">
                        {qrData.totalClicks > 0
                          ? Math.round((qrData.apiClicks / qrData.totalClicks) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={qrData.totalClicks > 0
                      ? (qrData.apiClicks / qrData.totalClicks) * 100
                      : 0}
                    className="h-2 bg-green-100"
                    style={{
                      "--progress-background": "#10b981",
                    } as React.CSSProperties}
                  />
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-slate-900">Total Clicks</span>
                    <span className="text-slate-900">{qrData.totalClicks.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No click source data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code and Bio Page Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <QrCode className="h-16 w-16 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">QR Code</h3>
                    <p className="text-sm text-slate-500">Download or customize</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-lg">
                  <QrCode className="h-4 w-4 mr-2" />
                  Create QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
                    <Share2 className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Bio Page</h3>
                    <p className="text-sm text-slate-500">Add to your bio page</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-lg">
                  <Share2 className="h-4 w-4 mr-2" />
                  Create Bio Page
                </Button>
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

        {/* Engagements Chart */}
        <EngagementsChart data={chartData} onExport={handleExport} />

        {/* Locations */}
        <LocationsChart countries={countriesData} cities={citiesData} onExport={handleExport} />

        {/* Referrers and Devices */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ReferrersChart data={referrersData} totalClicks={totalClicks} onExport={handleExport} />
          <DevicesChart
            data={devicesData}
            totalClicks={totalClicks}
            onExport={handleExport}
          />
        </div>

        {/* Recent Activity */}
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4 text-blue-600" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold">Country</TableHead>
                  <TableHead className="font-semibold">City</TableHead>
                  <TableHead className="font-semibold">Device</TableHead>
                  <TableHead className="font-semibold">Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentClicks?.slice(0, 10).map((click: any) => (
                  <TableRow key={click.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">
                      {format(new Date(click.timestamp), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>{click.country || "Unknown"}</TableCell>
                    <TableCell>{click.city || "Unknown"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {click.device || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-slate-500">
                      {click.referrer || "Direct"}
                    </TableCell>
                  </TableRow>
                ))}
                {(!data.recentClicks || data.recentClicks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No recent activity
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
