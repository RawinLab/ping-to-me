"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from "@pingtome/ui";
import { apiRequest } from "../../lib/api";
import { LinksTable } from "../../components/links/LinksTable";
import { ImportLinksModal } from "../../components/links/ImportLinksModal";
import {
  Download,
  Upload,
  Link2,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  BarChart3,
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
import { EngagementsChart } from "@/components/dashboard";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [refreshKey]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/analytics/dashboard");
      setMetrics(res);
    } catch (err) {
      console.error("Failed to fetch dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/links/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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

  const weeklyClicks = chartData.slice(-7).reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
  const previousWeekClicks = chartData.slice(-14, -7).reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
  const weeklyChange = previousWeekClicks > 0 ? Math.round(((weeklyClicks - previousWeekClicks) / previousWeekClicks) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              Live
            </Badge>
          </div>
          <p className="text-slate-500">
            Here&apos;s what&apos;s happening with your links today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportLinksModal onSuccess={() => setRefreshKey((prev) => prev + 1)}>
            <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg border-slate-200 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </ImportLinksModal>
          <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg border-slate-200 hover:bg-slate-50" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/links/new">
            <Button size="sm" className="gap-2 h-9 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
              <Plus className="h-4 w-4" />
              Create Link
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
                <p className="text-blue-100 text-sm font-medium">Total Links</p>
                <p className="text-4xl font-bold mt-2">
                  {loading ? "..." : metrics?.totalLinks?.toLocaleString() || "0"}
                </p>
                <p className="text-blue-100 text-xs mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Active & ready to use
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
                <p className="text-emerald-100 text-sm font-medium">Total Engagements</p>
                <p className="text-4xl font-bold mt-2">
                  {loading ? "..." : metrics?.allTimeClicks?.toLocaleString() || metrics?.totalClicks?.toLocaleString() || "0"}
                </p>
                <p className="text-emerald-100 text-xs mt-2 flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  All-time clicks
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
                <p className="text-violet-100 text-sm font-medium">This Week</p>
                <p className="text-4xl font-bold mt-2">
                  {loading ? "..." : weeklyClicks.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {weeklyChange >= 0 ? (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +{weeklyChange}%
                    </span>
                  ) : (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" />
                      {weeklyChange}%
                    </span>
                  )}
                  <span className="text-violet-200 text-xs">vs last week</span>
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
                <p className="text-amber-100 text-sm font-medium">Today</p>
                <p className="text-4xl font-bold mt-2">
                  {loading ? "..." : chartData.length > 0 ? (chartData[chartData.length - 1]?.clicks || 0).toLocaleString() : "0"}
                </p>
                <p className="text-amber-100 text-xs mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated live
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
                      Create Link
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Shorten URLs with custom slugs & tracking
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
                      QR Codes
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Create branded QR codes with your logo
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
                      Bio Pages
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Build your link-in-bio landing page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Engagements Chart */}
      {metrics && chartData.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Engagements Overview
              </CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                Track your link performance over time
              </p>
            </div>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm" className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                View Analytics
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <EngagementsChart data={chartData} onExport={handleExport} />
          </CardContent>
        </Card>
      )}

      {/* Recent Links */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Links</CardTitle>
            <p className="text-sm text-slate-500 mt-0.5">
              Your most recently created links
            </p>
          </div>
          <Link href="/dashboard/links">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-slate-200 hover:bg-slate-50">
              View All
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
                <h3 className="text-xl font-bold mb-2">Get Started with PingTO.Me</h3>
                <p className="text-slate-300 mb-4">
                  Create your first few links to unlock powerful analytics and tracking features.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/links/new">
                    <Button className="bg-white text-slate-900 hover:bg-slate-100 gap-2">
                      <Plus className="h-4 w-4" />
                      Create your first link
                    </Button>
                  </Link>
                  <Link href="/docs">
                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 gap-2">
                      <Globe className="h-4 w-4" />
                      Read the docs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            {/* Progress indicator */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Getting started progress</span>
                <span className="text-white font-medium">{Math.min(metrics.totalLinks, 5)} / 5 links</span>
              </div>
              <Progress value={Math.min((metrics.totalLinks / 5) * 100, 100)} className="h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
