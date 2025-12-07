"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { LinkResponse } from "@pingtome/types";
import { apiRequest, api, getAccessToken } from "@/lib/api";
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
  Plus,
  ArchiveRestore,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

import { QrCodeModal } from "./QrCodeModal";
import { EditLinkModal } from "./EditLinkModal";
import { FilterValues } from "./FiltersModal";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/contexts/AuthContext";

interface LinksTableProps {
  limit?: number;
  hideFilters?: boolean;
  searchQuery?: string;
  viewMode?: "list" | "table" | "grid";
  statusFilter?: string;
  dateRange?: { start: Date | null; end: Date | null };
  tagFilters?: FilterValues;
  onSelectionChange?: (count: number) => void;
}

export interface LinksTableRef {
  handleExport: () => Promise<void>;
  openBulkTagDialog: () => void;
  getSelectedCount: () => number;
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

const defaultTagFilters: FilterValues = {
  tags: [],
  linkType: "all",
  hasQrCode: "all",
};

export const LinksTable = forwardRef<LinksTableRef, LinksTableProps>(
  function LinksTable(
    {
      limit,
      hideFilters = false,
      searchQuery = "",
      viewMode = "list",
      statusFilter = "all",
      dateRange,
      tagFilters = defaultTagFilters,
      onSelectionChange,
    },
    ref,
  ) {
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
    const [inlineTagLinkId, setInlineTagLinkId] = useState<string | null>(null);
    const [inlineTagValue, setInlineTagValue] = useState<string>("");

    // Permission and auth context
    const { user } = useAuth();
    const {
      canEditLink,
      canDeleteLink,
      canBulkLinks,
      isEditor,
      isAdminOrAbove,
    } = usePermission();

    // Helper to check if user can modify a specific link
    const canModifyLink = (link: LinkResponse): boolean => {
      // Admins and owners can modify all links
      if (isAdminOrAbove) return true;

      // Editors can only modify links they created
      if (isEditor && link.createdById === user?.id) return true;

      // Viewers cannot modify links
      return false;
    };

    useEffect(() => {
      fetchFilters();
      fetchLinks();
    }, []);

    useEffect(() => {
      fetchLinks();
    }, [searchQuery, statusFilter, dateRange, tagFilters]);

    // Notify parent when selection changes
    useEffect(() => {
      onSelectionChange?.(selectedIds.size);
    }, [selectedIds, onSelectionChange]);

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
        // Map status filter to API values
        if (statusFilter && statusFilter !== "all") {
          const statusMap: Record<string, string> = {
            active: "ACTIVE",
            disabled: "DISABLED",
            expired: "EXPIRED",
            archived: "ARCHIVED",
          };
          if (statusMap[statusFilter]) {
            query.append("status", statusMap[statusFilter]);
          }
        }
        // Date range filter
        if (dateRange?.start) {
          query.append("startDate", dateRange.start.toISOString());
        }
        if (dateRange?.end) {
          query.append("endDate", dateRange.end.toISOString());
        }
        // Tag filters
        if (tagFilters.tags.length > 0) {
          tagFilters.tags.forEach((tag) => query.append("tag", tag));
        }
        // Link type filter
        if (tagFilters.linkType && tagFilters.linkType !== "all") {
          query.append("linkType", tagFilters.linkType);
        }
        // QR code filter
        if (tagFilters.hasQrCode && tagFilters.hasQrCode !== "all") {
          query.append("hasQrCode", tagFilters.hasQrCode);
        }

        const response = await apiRequest(`/links?${query.toString()}`);
        const linksData = response.data || response;
        setLinks(limit ? linksData.slice(0, limit) : linksData);
        setSelectedIds(new Set());
      } catch (error: any) {
        console.error("Failed to fetch links:", error);
        if (error?.response?.status === 403) {
          toast.error("Permission denied", {
            description: "You don't have permission to view links",
          });
        }
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
        toast.success("Link deleted successfully");
        fetchLinks();
      } catch (error: any) {
        console.error("Failed to delete link:", error);
        if (error?.response?.status === 403) {
          toast.error("Permission denied", {
            description: "You don't have permission to delete this link",
          });
        } else {
          toast.error("Failed to delete link");
        }
      }
    };

    const handleBulkDelete = async () => {
      if (!canBulkLinks()) {
        toast.error("Permission denied", {
          description: "You don't have permission to perform bulk operations",
        });
        return;
      }
      if (
        !confirm(`Are you sure you want to delete ${selectedIds.size} links?`)
      )
        return;
      try {
        await apiRequest("/links/bulk-delete", {
          method: "POST",
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        toast.success(`${selectedIds.size} links deleted successfully`);
        fetchLinks();
      } catch (error: any) {
        if (error?.response?.status === 403) {
          toast.error("Permission denied", {
            description: "You don't have permission to delete these links",
          });
        } else {
          toast.error("Failed to delete links");
        }
      }
    };

    const handleBulkStatusChange = async (status: string) => {
      if (!canBulkLinks()) {
        toast.error("Permission denied", {
          description: "You don't have permission to perform bulk operations",
        });
        return;
      }
      try {
        await apiRequest("/links/bulk-status", {
          method: "POST",
          body: JSON.stringify({
            ids: Array.from(selectedIds),
            status,
          }),
        });
        const statusLabel =
          status === "ACTIVE"
            ? "enabled"
            : status === "DISABLED"
              ? "disabled"
              : "archived";
        toast.success(`${selectedIds.size} links ${statusLabel} successfully`);
        fetchLinks();
      } catch (error: any) {
        if (error?.response?.status === 403) {
          toast.error("Permission denied", {
            description: "You don't have permission to update these links",
          });
        } else {
          toast.error("Failed to update link status");
        }
      }
    };

    const handleBulkTag = async () => {
      if (!bulkTagValue) return;
      if (!canBulkLinks()) {
        toast.error("Permission denied", {
          description: "You don't have permission to perform bulk operations",
        });
        return;
      }
      try {
        await apiRequest("/links/bulk-tag", {
          method: "POST",
          body: JSON.stringify({
            ids: Array.from(selectedIds),
            tagName: bulkTagValue,
          }),
        });
        toast.success("Tags added successfully");
        setBulkTagDialogOpen(false);
        setBulkTagValue("");
        fetchLinks();
      } catch (error: any) {
        if (error?.response?.status === 403) {
          toast.error("Permission denied", {
            description: "You don't have permission to add tags to these links",
          });
        } else {
          toast.error("Failed to add tags");
        }
      }
    };

    const handleExport = async () => {
      try {
        const token = getAccessToken();
        const response = await api.get("/links/export", {
          responseType: "blob",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "links.csv";
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Links exported successfully");
      } catch (error: any) {
        console.error("Export failed:", error);
        if (error?.response?.status === 403) {
          toast.error("Permission denied", {
            description: "You don't have permission to export links",
          });
        } else {
          toast.error("Failed to export links");
        }
      }
    };

    const openBulkTagDialog = () => {
      setBulkTagDialogOpen(true);
    };

    const handleAddInlineTag = async (linkId: string, tagName: string) => {
      if (!tagName.trim()) return;
      try {
        await apiRequest("/links/bulk-tag", {
          method: "POST",
          body: JSON.stringify({
            ids: [linkId],
            tagName: tagName.trim(),
          }),
        });
        setInlineTagLinkId(null);
        setInlineTagValue("");
        fetchLinks();
      } catch (error) {
        console.error("Failed to add tag:", error);
      }
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      handleExport,
      openBulkTagDialog,
      getSelectedCount: () => selectedIds.size,
    }));

    const handleStatusChange = async (id: string, status: string) => {
      try {
        await apiRequest(`/links/${id}`, {
          method: "POST",
          body: JSON.stringify({ status }),
        });
        toast.success("Link status updated");
        fetchLinks();
      } catch (error: any) {
        console.error("Failed to update status", error);
        if (error?.response?.status === 403) {
          toast.error("Permission denied", {
            description: "You don't have permission to update this link",
          });
        } else {
          toast.error("Failed to update status");
        }
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
      const shortDomain = link.shortUrl
        ? new URL(link.shortUrl).host
        : "pingto.me";
      const isExpired = link.status === "EXPIRED";
      const isDisabled = link.status === "DISABLED";

      return (
        <div
          className={`group bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-200 ${
            selectedIds.has(link.id)
              ? "ring-2 ring-blue-500 border-blue-300"
              : ""
          } ${isExpired || isDisabled ? "opacity-75" : ""}`}
        >
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            {canBulkLinks() && (
              <div className="pt-1">
                <Checkbox
                  checked={selectedIds.has(link.id)}
                  onCheckedChange={() => toggleSelectOne(link.id)}
                  className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </div>
            )}

            {/* Favicon */}
            <div className="flex-shrink-0 relative">
              {favicon ? (
                <div className="relative">
                  <img
                    src={favicon}
                    alt=""
                    className="w-12 h-12 rounded-xl bg-slate-50 p-1.5 border border-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {isExpired && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Globe className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title with status badge */}
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 truncate">
                  {link.title || `${domain} – untitled`}
                </h3>
                {isExpired && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    Expired
                  </span>
                )}
                {isDisabled && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                    Disabled
                  </span>
                )}
              </div>

              {/* Short URL */}
              <div className="flex items-center gap-2 mt-1.5">
                <a
                  href={link.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm transition-colors"
                >
                  {shortDomain}/{link.slug}
                </a>
                <button
                  onClick={() => copyToClipboard(link.shortUrl, link.id)}
                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-all"
                  title="Copy to clipboard"
                >
                  {copiedId === link.id ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400 group-hover:text-slate-500" />
                  )}
                </button>
              </div>

              {/* Original URL */}
              <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <span className="truncate hover:text-slate-700 transition-colors">
                  {link.originalUrl}
                </span>
              </div>

              {/* Meta info */}
              <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-4 text-sm">
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                  <BarChart2 className="h-4 w-4" />
                  <span className="font-semibold">{link.clicks || 0}</span>
                  <span className="text-emerald-600">engagements</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {format(new Date(link.createdAt), "MMM d, yyyy")}
                </span>
                {link.tags && link.tags.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Tags className="h-4 w-4 text-slate-400" />
                    <div className="flex gap-1">
                      {link.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {link.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">
                          +{link.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}
                {inlineTagLinkId === link.id ? (
                  <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg">
                    <Select
                      value={inlineTagValue}
                      onValueChange={setInlineTagValue}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select tag" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-lg shadow-lg max-h-[200px]">
                        {tags.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={t.name}
                            className="text-xs cursor-pointer"
                          >
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() =>
                        handleAddInlineTag(link.id, inlineTagValue)
                      }
                      className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setInlineTagLinkId(null);
                        setInlineTagValue("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 px-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setInlineTagLinkId(link.id)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm">Add tag</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEditLink() && canModifyLink(link) && (
                <EditLinkModal
                  link={{
                    id: link.id,
                    originalUrl: link.originalUrl,
                    title: link.title,
                    tags: link.tags,
                    campaignId: (link as any).campaignId,
                    expirationDate: (link as any).expirationDate,
                  }}
                  onSuccess={fetchLinks}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </EditLinkModal>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                onClick={() => setQrModalLink(link)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                asChild
              >
                <Link href={`/dashboard/links/${link.id}/analytics`}>
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
                  {canEditLink() && canModifyLink(link) && (
                    <EditLinkModal
                      link={{
                        id: link.id,
                        originalUrl: link.originalUrl,
                        title: link.title,
                        tags: link.tags,
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
                  )}
                  <DropdownMenuItem onClick={() => setQrModalLink(link)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/links/${link.id}/analytics`}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      View analytics
                    </Link>
                  </DropdownMenuItem>
                  {canEditLink() && canModifyLink(link) && (
                    <>
                      <DropdownMenuSeparator />
                      {link.status === "ARCHIVED" ? (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(link.id, "ACTIVE")}
                        >
                          <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(
                                link.id,
                                link.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                              )
                            }
                          >
                            {link.status === "ACTIVE" ? (
                              <>
                                <PauseCircle className="mr-2 h-4 w-4" /> Disable
                                link
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" /> Enable
                                link
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(link.id, "ARCHIVED")
                            }
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                  {canDeleteLink() && canModifyLink(link) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      );
    };

    // Render grid card
    const renderGridCard = (link: LinkResponse) => {
      const favicon = getFaviconUrl(link.originalUrl);
      const domain = getDomain(link.originalUrl);
      const shortDomain = link.shortUrl
        ? new URL(link.shortUrl).host
        : "pingto.me";
      const isExpired = link.status === "EXPIRED";
      const isDisabled = link.status === "DISABLED";

      return (
        <div
          className={`group bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-200 ${
            selectedIds.has(link.id)
              ? "ring-2 ring-blue-500 border-blue-300"
              : ""
          } ${isExpired || isDisabled ? "opacity-75" : ""}`}
        >
          {/* Header with favicon, checkbox and actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {canBulkLinks() && (
                <Checkbox
                  checked={selectedIds.has(link.id)}
                  onCheckedChange={() => toggleSelectOne(link.id)}
                  className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              )}
              {favicon ? (
                <img
                  src={favicon}
                  alt=""
                  className="w-10 h-10 rounded-xl bg-slate-50 p-1.5 border border-slate-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Globe className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                onClick={() => setQrModalLink(link)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {canEditLink() && canModifyLink(link) && (
                    <EditLinkModal
                      link={{
                        id: link.id,
                        originalUrl: link.originalUrl,
                        title: link.title,
                        tags: link.tags,
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
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/links/${link.id}/analytics`}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      View analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQrModalLink(link)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </DropdownMenuItem>
                  {canEditLink() && canModifyLink(link) && (
                    <>
                      <DropdownMenuSeparator />
                      {link.status === "ARCHIVED" ? (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(link.id, "ACTIVE")}
                        >
                          <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(
                                link.id,
                                link.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                              )
                            }
                          >
                            {link.status === "ACTIVE" ? (
                              <>
                                <PauseCircle className="mr-2 h-4 w-4" /> Disable
                                link
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" /> Enable
                                link
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(link.id, "ARCHIVED")
                            }
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                  {canDeleteLink() && canModifyLink(link) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title with status badge */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 truncate flex-1">
              {link.title || `${domain} – untitled`}
            </h3>
            {isExpired && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                Expired
              </span>
            )}
            {isDisabled && (
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full flex-shrink-0">
                Disabled
              </span>
            )}
          </div>

          {/* Short URL */}
          <div className="flex items-center gap-2 mb-2">
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm truncate"
            >
              {shortDomain}/{link.slug}
            </a>
            <button
              onClick={() => copyToClipboard(link.shortUrl, link.id)}
              className="p-1.5 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0"
            >
              {copiedId === link.id ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-500" />
              )}
            </button>
          </div>

          {/* Original URL */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
            <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">{link.originalUrl}</span>
          </div>

          {/* Tags */}
          <div className="flex items-center flex-wrap gap-1.5 mb-4">
            {link.tags && link.tags.length > 0 ? (
              <>
                {link.tags.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {link.tags.length > 2 && (
                  <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">
                    +{link.tags.length - 2}
                  </span>
                )}
              </>
            ) : null}
            <button
              onClick={() => setInlineTagLinkId(link.id)}
              className="flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded-full transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add tag
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-4">
            <span
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg"
              title="engagements"
            >
              <BarChart2 className="h-4 w-4" />
              <span className="font-semibold">{link.clicks || 0}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(link.createdAt), "MMM d")}
            </span>
          </div>
        </div>
      );
    };

    // Promo banner
    const renderPromoBanner = () => (
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100/60 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm text-slate-700 flex-1">
          <span className="font-medium text-slate-900">Pro tip:</span> Change a
          link&apos;s destination, even after you&apos;ve shared it. Get
          redirects with every plan.{" "}
          <Link
            href="/dashboard/billing"
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
          >
            View plans →
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
              <Button
                variant="outline"
                onClick={() => setBulkTagDialogOpen(false)}
              >
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
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 px-6 flex justify-between items-center shadow-xl shadow-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium">
                {selectedIds.size} link{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBulkTagDialogOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-lg"
              >
                <Tags className="mr-2 h-4 w-4" /> Add tag
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkStatusChange("ACTIVE")}
                className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-lg"
              >
                <PlayCircle className="mr-2 h-4 w-4" /> Enable All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkStatusChange("DISABLED")}
                className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-lg"
              >
                <PauseCircle className="mr-2 h-4 w-4" /> Disable All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkStatusChange("ARCHIVED")}
                className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-lg"
              >
                <Archive className="mr-2 h-4 w-4" /> Archive All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="rounded-lg"
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
                className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-5 h-5 bg-slate-200 rounded mt-0.5" />
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
                    <div className="h-4 bg-blue-100 rounded-lg w-1/4" />
                    <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
                    <div className="flex gap-3 pt-2">
                      <div className="h-7 bg-emerald-100 rounded-lg w-20" />
                      <div className="h-7 bg-slate-100 rounded-lg w-28" />
                      <div className="h-5 bg-slate-100 rounded-full w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10">
              <Link2 className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No links yet
            </h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              {canEditLink()
                ? "Create your first short link to start tracking clicks and engagement"
                : "You have view-only access. Links created by your team will appear here."}
            </p>
            {canEditLink() && (
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-8 shadow-lg shadow-blue-500/25"
              >
                <Link href="/dashboard/links/new">Create your first link</Link>
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <div key={link.id}>{renderGridCard(link)}</div>
            ))}
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
  },
);
