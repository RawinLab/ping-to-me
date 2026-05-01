"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { QrCodeCustomizer } from "@/components/qrcode/QrCodeCustomizer";
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import {
  Search,
  QrCode,
  Download,
  Settings2,
  LayoutGrid,
  List,
  Calendar,
  BarChart3,
  Loader2,
  CheckSquare,
  Square,
  XCircle,
  FileArchive,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface LinkWithQr {
  id: string;
  slug: string;
  originalUrl: string;
  shortUrl: string;
  title?: string;
  createdAt: string;
  clickCount: number;
  qrCode?: {
    id: string;
    foregroundColor: string;
    backgroundColor: string;
    logoUrl?: string;
    errorCorrection: string;
    size: number;
  };
}

export default function QrCodesPage() {
  const t = useTranslations("qr");
  const [links, setLinks] = useState<LinkWithQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<"all" | "with" | "without">(
    "all",
  );
  const [selectedLink, setSelectedLink] = useState<LinkWithQr | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [batchFormat, setBatchFormat] = useState<"png" | "svg" | "pdf">("png");
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [qrSummary, setQrSummary] = useState<{
    totalClicks: number;
    qrClicks: number;
    directClicks: number;
    qrPercentage: number;
  } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/links");

      if (response.data) {
        // Fetch QR configs for each link
        const linksWithQr = await Promise.all(
          response.data.map(async (link: any) => {
            try {
              const qrResponse = await api.get(`/links/${link.id}/qr`);
              return { ...link, qrCode: qrResponse.data };
            } catch {
              return { ...link, qrCode: null };
            }
          }),
        );
        setLinks(linksWithQr);
      }

      // Fetch QR summary stats
      try {
        const summaryResponse = await api.get('/analytics/qr-summary');
        setQrSummary(summaryResponse.data);
      } catch (error) {
        console.error('Failed to fetch QR summary:', error);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const filteredLinks = links.filter((link) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      link.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.title?.toLowerCase().includes(searchQuery.toLowerCase());

    // QR status filter
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "with" && link.qrCode) ||
      (filterStatus === "without" && !link.qrCode);

    return matchesSearch && matchesFilter;
  });

  const handleCustomize = (link: LinkWithQr) => {
    setSelectedLink(link);
    setCustomizeOpen(true);
  };

  const generateQrPreviewUrl = (link: LinkWithQr) => {
    const params = new URLSearchParams({
      url: link.shortUrl,
      size: "150",
      format: "png",
    });
    if (link.qrCode) {
      params.set("foreground", link.qrCode.foregroundColor.replace("#", ""));
      params.set("background", link.qrCode.backgroundColor.replace("#", ""));
    }
    return `${apiUrl}/qr/generate?${params.toString()}`;
  };

  const handleDownload = async (
    link: LinkWithQr,
    format: "png" | "svg" = "png",
  ) => {
    const params = new URLSearchParams({
      url: link.shortUrl,
      size: "500",
      format,
    });
    if (link.qrCode) {
      params.set("foreground", link.qrCode.foregroundColor.replace("#", ""));
      params.set("background", link.qrCode.backgroundColor.replace("#", ""));
    }

    const downloadUrl = `${apiUrl}/qr/download?${params.toString()}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `qr-${link.slug}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleSelectAll = () => {
    if (selectedLinks.length === filteredLinks.length) {
      setSelectedLinks([]);
    } else {
      setSelectedLinks(filteredLinks.map((l) => l.id));
    }
  };

  const toggleLinkSelection = (linkId: string) => {
    setSelectedLinks((prev) =>
      prev.includes(linkId)
        ? prev.filter((id) => id !== linkId)
        : [...prev, linkId],
    );
  };

  const handleBatchDownload = async () => {
    if (selectedLinks.length === 0) return;

    setBatchDownloading(true);
    try {
      const response = await api.post(
        "/qr/batch-download",
        {
          linkIds: selectedLinks,
          format: batchFormat,
          size: 500,
        },
        { responseType: "blob" },
      );

      // Download ZIP file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-codes-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Reset selection after download
      setSelectMode(false);
      setSelectedLinks([]);
    } catch (error) {
      console.error("Batch download failed:", error);
    } finally {
      setBatchDownloading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Link href="/dashboard/links/new">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all">
              <QrCode className="mr-2 h-4 w-4" /> {t("createLinkWithQr")}
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 rounded-xl h-11 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          <Select
            value={filterStatus}
            onValueChange={(v: any) => setFilterStatus(v)}
          >
            <SelectTrigger className="h-11 w-[180px] bg-white border-slate-200 rounded-xl text-sm">
              <SelectValue placeholder={t("filterByQr")} />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl">
              <SelectItem value="all">{t("allLinks")}</SelectItem>
              <SelectItem value="with">{t("withQrConfig")}</SelectItem>
              <SelectItem value="without">{t("withoutQrConfig")}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Batch Select Toggle */}
          <Button
            variant={selectMode ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectMode(!selectMode)}
            className={`rounded-xl ${selectMode ? "bg-purple-600 text-white" : ""}`}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {selectMode ? t("exitSelect") : t("batchSelect")}
          </Button>
        </div>

        {/* Batch Action Toolbar */}
        {selectMode && (
          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="text-purple-700 hover:text-purple-900"
              >
                {selectedLinks.length === filteredLinks.length ? (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {t("deselectAll")}
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    {t("selectAll")}
                  </>
                )}
              </Button>
              <span className="text-sm text-purple-600">
                {t("selected", { count: selectedLinks.length, total: filteredLinks.length })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={batchFormat}
                onValueChange={(v: any) => setBatchFormat(v)}
              >
                <SelectTrigger className="h-9 w-[100px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBatchDownload}
                disabled={selectedLinks.length === 0 || batchDownloading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {batchDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("downloading")}
                  </>
                ) : (
                  <>
                    <FileArchive className="h-4 w-4 mr-2" />
                    {t("downloadZip")}
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectMode(false);
                  setSelectedLinks([]);
                }}
                className="text-slate-500"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/70 border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {links.length}
                </p>
                <p className="text-sm text-slate-500">{t("totalLinks")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Settings2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {links.filter((l) => l.qrCode).length}
                </p>
                <p className="text-sm text-slate-500">{t("customizedQrs")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {links.reduce((sum, l) => sum + (l.clickCount || 0), 0)}
                </p>
                <p className="text-sm text-slate-500">{t("totalScans")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR vs Direct Comparison */}
        {qrSummary && qrSummary.totalClicks > 0 && (
          <Card className="bg-white/70 border-slate-200/60">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {t("trafficSourceBreakdown")}
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('qrScans'), value: qrSummary.qrClicks, color: '#8b5cf6' },
                        { name: t('direct'), value: qrSummary.directClicks, color: '#3b82f6' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, t('clicks')]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-8 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-slate-600">{t('qr')}: {qrSummary.qrPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-600">{t('direct')}: {100 - qrSummary.qrPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Codes Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <Card className="bg-white/70 border-slate-200/60">
            <CardContent className="p-12 text-center">
              <QrCode className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {t("noQrCodesFound")}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || filterStatus !== "all"
                  ? t("tryAdjusting")
                  : t("createFirstLink")}
              </p>
              <Link href="/dashboard/links/new">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  {t("createLink")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLinks.map((link) => (
              <Card
                key={link.id}
                className="bg-white/70 border-slate-200/60 hover:shadow-lg transition-all group overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* QR Preview */}
                  <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8 relative">
                    {selectMode && (
                      <div
                        className="absolute top-2 left-2 z-10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLinkSelection(link.id);
                        }}
                      >
                        {selectedLinks.includes(link.id) ? (
                          <CheckSquare className="h-6 w-6 text-purple-600 bg-white rounded" />
                        ) : (
                          <Square className="h-6 w-6 text-slate-400 bg-white rounded" />
                        )}
                      </div>
                    )}
                    <div
                      className="w-full h-full rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor:
                          link.qrCode?.backgroundColor || "#FFFFFF",
                      }}
                    >
                      <img
                        src={generateQrPreviewUrl(link)}
                        alt={`QR code for ${link.slug}`}
                        className="w-full h-full object-contain p-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    {/* Hover Actions */}
                    {!selectMode && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white hover:bg-slate-100"
                          onClick={() => handleCustomize(link)}
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          {t("customize")}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white hover:bg-slate-100"
                          onClick={() => handleDownload(link)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {t("download")}
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 truncate">
                        /{link.slug}
                      </span>
                      {link.qrCode && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {t("customized")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate mb-3">
                      {link.originalUrl}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {link.clickCount || 0} {t("clicks")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLinks.map((link) => (
              <Card
                key={link.id}
                className="bg-white/70 border-slate-200/60 hover:shadow-md transition-all"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Checkbox for Select Mode */}
                  {selectMode && (
                    <div
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLinkSelection(link.id);
                      }}
                    >
                      {selectedLinks.includes(link.id) ? (
                        <CheckSquare className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Square className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                  )}
                  {/* QR Preview */}
                  <div
                    className="h-20 w-20 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor:
                        link.qrCode?.backgroundColor || "#F8FAFC",
                    }}
                  >
                    <img
                      src={generateQrPreviewUrl(link)}
                      alt={`QR code for ${link.slug}`}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">
                        /{link.slug}
                      </span>
                      {link.qrCode && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          {t("customized")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {link.originalUrl}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {link.clickCount || 0} {t("clicks")}
                      </span>
                    </div>
                  </div>
                  {/* Actions */}
                  {!selectMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => handleCustomize(link)}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        {t("customize")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => handleDownload(link)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Link href={`/dashboard/links/${link.id}/analytics`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* QR Customizer Dialog */}
      {selectedLink && (
        <QrCodeCustomizer
          url={selectedLink.shortUrl}
          linkId={selectedLink.id}
          initialQrCode={undefined}
          trigger={<span />}
          open={customizeOpen}
          onOpenChange={(open) => {
            setCustomizeOpen(open);
            if (!open) {
              setSelectedLink(null);
              fetchLinks(); // Refresh to get updated QR configs
            }
          }}
        />
      )}
    </div>
  );
}
