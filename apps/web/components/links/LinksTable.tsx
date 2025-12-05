"use client";

import { useEffect, useState } from "react";
import { LinkResponse } from "@pingtome/types";
import { apiRequest } from "@/lib/api";
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import {
  ExternalLink,
  Copy,
  MoreHorizontal,
  QrCode,
  Trash2,
  BarChart2,
  PauseCircle,
  PlayCircle,
  Archive,
  Tags,
  Pencil,
  Globe,
  Calendar,
  Share2,
  Link2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import { QrCodeModal } from "./QrCodeModal";
import { EditLinkModal } from "./EditLinkModal";

interface LinksTableProps {
  limit?: number;
  hideFilters?: boolean;
  searchQuery?: string;
  viewMode?: "list" | "table" | "grid";
}

// Get favicon URL for a domain
const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

// Get domain from URL
const getDomain = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export function LinksTable({ limit, hideFilters = false, searchQuery = "", viewMode = "list" }: LinksTableProps) {
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalLink, setQrModalLink] = useState<{
    shortUrl: string;
    slug: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFilters();
    fetchLinks();
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [searchQuery]);

  const fetchFilters = async () => {
    try {
      const tagsRes = await apiRequest("/tags");
      setTags(tagsRes);
    } catch (error) {
      console.error("Failed to fetch filters");
    }
  };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery) query.append("search", searchQuery);
      if (limit) query.append("limit", limit.toString());

      const response = await apiRequest(`/links?${query.toString()}`);
      const linksData = response.data || response;
      setLinks(limit ? linksData.slice(0, limit) : linksData);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      await apiRequest(`/links/${id}`, { method: "DELETE" });
      fetchLinks();
    } catch (error) {
      alert("Failed to delete link");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} links?`))
      return;
    try {
      await apiRequest("/links/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      fetchLinks();
    } catch (error) {
      alert("Failed to delete links");
    }
  };

  const handleBulkTag = async () => {
    if (!bulkTagValue) return;
    try {
      await apiRequest("/links/bulk-tag", {
        method: "POST",
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          tagName: bulkTagValue,
        }),
      });
      setBulkTagDialogOpen(false);
      setBulkTagValue("");
      fetchLinks();
    } catch (error) {
      alert("Failed to add tags");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiRequest(`/links/${id}`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      fetchLinks();
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status");
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Render link card (list view)
  const renderLinkCard = (link: LinkResponse) => {
    const favicon = getFaviconUrl(link.originalUrl);
    const domain = getDomain(link.originalUrl);
    const shortDomain = link.shortUrl ? new URL(link.shortUrl).host : "pingto.me";

    return (
      <div
        className={`bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow ${
          selectedIds.has(link.id) ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={selectedIds.has(link.id)}
              onCheckedChange={() => toggleSelectOne(link.id)}
              className="border-slate-300"
            />
          </div>

          {/* Favicon */}
          <div className="flex-shrink-0">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="w-10 h-10 rounded-lg bg-slate-100 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-slate-900 truncate">
              {link.title || `${domain} – untitled`}
            </h3>

            {/* Short URL */}
            <div className="flex items-center gap-2 mt-1">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {shortDomain}/{link.slug}
              </a>
              <button
                onClick={() => copyToClipboard(link.shortUrl, link.id)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copiedId === link.id ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Original URL */}
            <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
              <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{link.originalUrl}</span>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 font-medium">
                  {(link as any).clicks || 0} engagements
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(link.createdAt), "MMM d, yyyy")}
              </span>
              {link.tags && link.tags.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Tags className="h-4 w-4" />
                  {link.tags.join(", ")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Tags className="h-4 w-4" />
                  No tags
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              asChild
            >
              <Link href={`/dashboard/links/${link.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              onClick={() => setQrModalLink(link)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              asChild
            >
              <Link href={`/dashboard/analytics/${link.id}`}>
                <BarChart2 className="h-4 w-4" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <EditLinkModal
                  link={{
                    id: link.id,
                    title: link.title,
                    campaignId: (link as any).campaignId,
                    expirationDate: (link as any).expirationDate,
                  }}
                  onSuccess={fetchLinks}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit link
                  </DropdownMenuItem>
                </EditLinkModal>
                <DropdownMenuItem onClick={() => setQrModalLink(link)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/analytics/${link.id}`}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    View analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusChange(
                      link.id,
                      link.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
                    )
                  }
                >
                  {link.status === "ACTIVE" ? (
                    <>
                      <PauseCircle className="mr-2 h-4 w-4" /> Disable link
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" /> Enable link
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(link.id, "ARCHIVED")}
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => handleDelete(link.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  // Promo banner
  const renderPromoBanner = () => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 flex items-center gap-3">
      <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0" />
      <p className="text-sm text-slate-700 flex-1">
        Change a link&apos;s destination, even after you&apos;ve shared it. Get redirects with every plan.{" "}
        <Link href="/dashboard/billing" className="text-blue-600 hover:text-blue-700 font-medium">
          View plans
        </Link>
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Bulk Tag Dialog */}
      <Dialog open={bulkTagDialogOpen} onOpenChange={setBulkTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to Links</DialogTitle>
            <DialogDescription>
              Add a tag to {selectedIds.size} selected link(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={bulkTagValue} onValueChange={setBulkTagValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkTag} disabled={!bulkTagValue}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white rounded-lg p-4 flex justify-between items-center">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBulkTagDialogOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white border-0"
            >
              <Tags className="mr-2 h-4 w-4" /> Tag
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Links List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-4 h-4 bg-slate-200 rounded" />
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No links yet</h3>
          <p className="text-slate-500 mb-6">
            Create your first short link to get started
          </p>
          <Button asChild>
            <Link href="/dashboard/links/new">Create link</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={link.id}>
              {renderLinkCard(link)}
              {/* Show promo banner after first link */}
              {index === 0 && links.length > 1 && renderPromoBanner()}
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrModalLink && (
        <QrCodeModal
          isOpen={!!qrModalLink}
          onClose={() => setQrModalLink(null)}
          link={qrModalLink}
        />
      )}
    </div>
  );
}
