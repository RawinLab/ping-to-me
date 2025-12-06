"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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
  const [links, setLinks] = useState<LinkWithQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<"all" | "with" | "without">("all");
  const [selectedLink, setSelectedLink] = useState<LinkWithQr | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

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
          })
        );
        setLinks(linksWithQr);
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

  const handleDownload = async (link: LinkWithQr, format: "png" | "svg" = "png") => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <div className="container py-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">QR Codes</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create and manage QR codes for your links
            </p>
          </div>
          <Link href="/dashboard/links/new">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all">
              <QrCode className="mr-2 h-4 w-4" /> Create Link with QR
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by link or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 rounded-xl h-11 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="h-11 w-[180px] bg-white border-slate-200 rounded-xl text-sm">
              <SelectValue placeholder="Filter by QR" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl">
              <SelectItem value="all">All Links</SelectItem>
              <SelectItem value="with">With QR Config</SelectItem>
              <SelectItem value="without">Without QR Config</SelectItem>
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
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/70 border-slate-200/60">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{links.length}</p>
                <p className="text-sm text-slate-500">Total Links</p>
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
                <p className="text-sm text-slate-500">Customized QRs</p>
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
                <p className="text-sm text-slate-500">Total Scans</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Codes Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <Card className="bg-white/70 border-slate-200/60">
            <CardContent className="p-12 text-center">
              <QrCode className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No QR codes found</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first link to generate a QR code"}
              </p>
              <Link href="/dashboard/links/new">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Create Link
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
                    <div
                      className="w-full h-full rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: link.qrCode?.backgroundColor || "#FFFFFF",
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white hover:bg-slate-100"
                        onClick={() => handleCustomize(link)}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        Customize
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white hover:bg-slate-100"
                        onClick={() => handleDownload(link)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 truncate">
                        /{link.slug}
                      </span>
                      {link.qrCode && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          Customized
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate mb-3">{link.originalUrl}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {link.clickCount || 0} clicks
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
                  {/* QR Preview */}
                  <div
                    className="h-20 w-20 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: link.qrCode?.backgroundColor || "#F8FAFC" }}
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
                      <span className="font-semibold text-slate-900">/{link.slug}</span>
                      {link.qrCode && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          Customized
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{link.originalUrl}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {link.clickCount || 0} clicks
                      </span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => handleCustomize(link)}
                    >
                      <Settings2 className="h-4 w-4 mr-1" />
                      Customize
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
                      <Button variant="outline" size="sm" className="rounded-lg">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
