"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@pingtome/ui";
import { apiRequest } from "../../lib/api";
import { LinksTable } from "../../components/links/LinksTable";
import { ImportLinksModal } from "../../components/links/ImportLinksModal";
import {
  Download,
  Upload,
  Link2,
  MousePointerClick,
  TrendingUp,
  ArrowUpRight,
  Plus,
  BarChart3,
  QrCode,
  FileText,
} from "lucide-react";
import { StatsCard, EngagementsChart } from "@/components/dashboard";

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [password, setPassword] = useState("");
  const [tags, setTags] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, [refreshKey]);

  const fetchMetrics = async () => {
    try {
      const res = await apiRequest("/analytics/dashboard");
      setMetrics(res);
    } catch (err) {
      console.error("Failed to fetch dashboard metrics");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/links", {
        method: "POST",
        body: JSON.stringify({
          originalUrl: url,
          slug,
          expirationDate: expirationDate || undefined,
          password: password || undefined,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        }),
      });
      setUrl("");
      setSlug("");
      setExpirationDate("");
      setPassword("");
      setTags("");
      setRefreshKey((prev) => prev + 1); // Trigger table refresh
    } catch (err: any) {
      alert(err.message || "Failed to create link");
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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your links today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ImportLinksModal onSuccess={() => setRefreshKey((prev) => prev + 1)}>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </ImportLinksModal>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/links/new">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Link2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Create Link
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Shorten a new URL
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/qr-codes">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    QR Codes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Generate QR codes
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/biopages">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Bio Pages
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create a bio page
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total Links"
            value={metrics.totalLinks?.toLocaleString() || "0"}
            icon={<Link2 className="h-5 w-5" />}
          />
          <StatsCard
            title="Total Clicks"
            value={metrics.totalClicks?.toLocaleString() || "0"}
            icon={<MousePointerClick className="h-5 w-5" />}
          />
          <StatsCard
            title="This Week"
            value={
              chartData.slice(-7).reduce((sum: number, d: any) => sum + (d.clicks || 0), 0).toLocaleString()
            }
            trend={{ value: 12, isPositive: true }}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatsCard
            title="Today"
            value={chartData.length > 0 ? (chartData[chartData.length - 1]?.clicks || 0).toLocaleString() : "0"}
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Engagements Chart */}
      {metrics && chartData.length > 0 && (
        <EngagementsChart data={chartData} onExport={handleExport} />
      )}

      {/* Recent Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Recent Links</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your most recently created links
            </p>
          </div>
          <Link href="/dashboard/links">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <LinksTable key={refreshKey} limit={5} />
        </CardContent>
      </Card>
    </div>
  );
}
