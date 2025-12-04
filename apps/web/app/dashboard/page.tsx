"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@pingtome/ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiRequest } from "../../lib/api";
import { LinksTable } from "../../components/links/LinksTable";
import { QrCodeModal } from "../../components/QrCodeModal";

import { ImportLinksModal } from "../../components/links/ImportLinksModal";
import { Download, Upload } from "lucide-react";

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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <ImportLinksModal onSuccess={() => setRefreshKey((prev) => prev + 1)}>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </ImportLinksModal>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLinks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalClicks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.recentClicks.length}
              </div>
              <p className="text-xs text-muted-foreground">in last 10 events</p>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Overview</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm">
              Last 7 Days
            </Button>
          </div>
        </div>
      )}

      {metrics && metrics.clicksByDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overview (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.clicksByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock data for now, or use metrics.topLinks if available */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">/link-1</p>
                    <p className="text-xs text-muted-foreground">
                      https://example.com/1
                    </p>
                  </div>
                  <div className="font-bold">50</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">/link-2</p>
                    <p className="text-xs text-muted-foreground">
                      https://example.com/2
                    </p>
                  </div>
                  <div className="font-bold">30</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="border p-6 rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Link</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Destination URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm font-medium">Slug (Optional)</label>
              <input
                type="text"
                placeholder="custom-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm font-medium">
                Expiration (Optional)
              </label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm font-medium">Password (Optional)</label>
              <input
                type="password"
                placeholder="secret"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm font-medium">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="tag1, tag2"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <Button className="mb-0.5">Create Link</Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Links</h2>
        <LinksTable key={refreshKey} />
      </div>
    </div>
  );
}
